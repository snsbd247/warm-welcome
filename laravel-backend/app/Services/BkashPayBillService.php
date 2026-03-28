<?php

namespace App\Services;

use App\Models\Bill;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\PaymentGateway;
use Illuminate\Support\Facades\Log;

/**
 * bKash Pay Bill Integration Service
 * 
 * Handles bKash Pay Bill API callbacks:
 * 1. Bill Inquiry - bKash sends customer_id to get pending bill info
 * 2. Payment Notification - bKash notifies when payment is completed
 * 
 * Flow:
 * Customer opens bKash app → Pay Bill → Selects ISP biller
 * → Enters Customer ID → bKash calls billInquiry
 * → Customer confirms → bKash processes → calls paymentNotification
 */
class BkashPayBillService
{
    public function __construct(
        protected BillingService $billingService,
        protected LedgerService $ledgerService
    ) {}

    /**
     * Bill Inquiry - Called by bKash to validate customer and get bill details
     * 
     * bKash sends: billerId, customerNo (customer_id)
     * We respond with: customer name, bill amount, bill details
     */
    public function billInquiry(string $customerNo): array
    {
        try {
            // Find customer by customer_id (the short ID like "ISP-001")
            $customer = Customer::where('customer_id', $customerNo)
                ->where('status', 'active')
                ->first();

            if (!$customer) {
                return [
                    'statusCode' => '0001',
                    'statusMessage' => 'Customer not found or inactive',
                ];
            }

            // Get unpaid bills ordered by oldest first
            $unpaidBills = Bill::where('customer_id', $customer->id)
                ->where('status', 'unpaid')
                ->orderBy('due_date', 'asc')
                ->get();

            if ($unpaidBills->isEmpty()) {
                return [
                    'statusCode' => '0002',
                    'statusMessage' => 'No pending bills found',
                    'customerName' => $customer->name,
                ];
            }

            $totalDue = $unpaidBills->sum('amount');
            $oldestBill = $unpaidBills->first();

            // Build bill details array
            $billDetails = $unpaidBills->map(function ($bill) {
                return [
                    'billNo' => $bill->id,
                    'month' => $bill->month,
                    'amount' => number_format((float) $bill->amount, 2, '.', ''),
                    'dueDate' => $bill->due_date?->format('Y-m-d'),
                ];
            })->toArray();

            return [
                'statusCode' => '0000',
                'statusMessage' => 'Success',
                'customerName' => $customer->name,
                'customerNo' => $customer->customer_id,
                'customerId' => $customer->id,
                'phone' => $customer->phone,
                'totalBillCount' => $unpaidBills->count(),
                'totalDueAmount' => number_format($totalDue, 2, '.', ''),
                'billAmount' => number_format((float) $oldestBill->amount, 2, '.', ''),
                'billNo' => $oldestBill->id,
                'billMonth' => $oldestBill->month,
                'dueDate' => $oldestBill->due_date?->format('Y-m-d'),
                'bills' => $billDetails,
            ];
        } catch (\Exception $e) {
            Log::error('bKash Pay Bill Inquiry Error: ' . $e->getMessage());
            return [
                'statusCode' => '9999',
                'statusMessage' => 'System error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Payment Notification - Called by bKash when payment is completed
     * 
     * bKash sends: trxID, amount, customerNo, billNo, etc.
     * We process payment and mark bills as paid
     */
    public function paymentNotification(array $data): array
    {
        try {
            $customerNo = $data['customerNo'] ?? null;
            $trxID = $data['trxID'] ?? null;
            $amount = (float) ($data['amount'] ?? 0);
            $billNo = $data['billNo'] ?? null;
            $paymentID = $data['paymentID'] ?? null;

            if (!$customerNo || !$trxID || $amount <= 0) {
                return [
                    'statusCode' => '0001',
                    'statusMessage' => 'Invalid payment data',
                ];
            }

            // Check for duplicate transaction
            $exists = Payment::where('bkash_trx_id', $trxID)->exists();
            if ($exists) {
                return [
                    'statusCode' => '0000',
                    'statusMessage' => 'Payment already processed',
                    'trxID' => $trxID,
                ];
            }

            // Find customer
            $customer = Customer::where('customer_id', $customerNo)->first();
            if (!$customer) {
                return [
                    'statusCode' => '0002',
                    'statusMessage' => 'Customer not found',
                ];
            }

            // If specific bill is referenced, pay that bill
            if ($billNo) {
                $bill = Bill::find($billNo);
                if ($bill && $bill->customer_id === $customer->id && $bill->status === 'unpaid') {
                    return $this->processPayment($customer, $bill, $amount, $trxID, $paymentID);
                }
            }

            // Otherwise, auto-pay oldest unpaid bills with the amount
            $remainingAmount = $amount;
            $paidBills = [];

            $unpaidBills = Bill::where('customer_id', $customer->id)
                ->where('status', 'unpaid')
                ->orderBy('due_date', 'asc')
                ->get();

            if ($unpaidBills->isEmpty()) {
                // No bills but received payment — create advance payment record
                $payment = Payment::create([
                    'customer_id' => $customer->id,
                    'amount' => $amount,
                    'payment_method' => 'bkash_paybill',
                    'bkash_trx_id' => $trxID,
                    'bkash_payment_id' => $paymentID,
                    'status' => 'completed',
                    'paid_at' => now(),
                ]);

                $this->ledgerService->addCredit(
                    $customer->id,
                    $amount,
                    "bKash Pay Bill Advance - TrxID: {$trxID}",
                    $payment->id
                );

                return [
                    'statusCode' => '0000',
                    'statusMessage' => 'Advance payment recorded',
                    'trxID' => $trxID,
                    'paidAmount' => number_format($amount, 2, '.', ''),
                ];
            }

            foreach ($unpaidBills as $bill) {
                if ($remainingAmount <= 0) break;

                $billAmount = (float) $bill->amount;

                if ($remainingAmount >= $billAmount) {
                    // Full bill payment
                    $payment = Payment::create([
                        'customer_id' => $customer->id,
                        'bill_id' => $bill->id,
                        'amount' => $billAmount,
                        'payment_method' => 'bkash_paybill',
                        'bkash_trx_id' => $trxID,
                        'bkash_payment_id' => $paymentID,
                        'month' => $bill->month,
                        'status' => 'completed',
                        'paid_at' => now(),
                    ]);

                    $this->billingService->markBillPaid($bill);

                    $this->ledgerService->addCredit(
                        $customer->id,
                        $billAmount,
                        "bKash Pay Bill - {$bill->month} - TrxID: {$trxID}",
                        $payment->id
                    );

                    $remainingAmount -= $billAmount;
                    $paidBills[] = $bill->month;
                } else {
                    // Partial — still record as full payment for this bill if close enough
                    break;
                }
            }

            // If there's remaining amount after paying all bills, record as advance
            if ($remainingAmount > 0 && !empty($paidBills)) {
                $this->ledgerService->addCredit(
                    $customer->id,
                    $remainingAmount,
                    "bKash Pay Bill Excess - TrxID: {$trxID}",
                    null
                );
            }

            return [
                'statusCode' => '0000',
                'statusMessage' => 'Payment successful',
                'trxID' => $trxID,
                'paidAmount' => number_format($amount, 2, '.', ''),
                'paidBills' => $paidBills,
                'customerName' => $customer->name,
            ];
        } catch (\Exception $e) {
            Log::error('bKash Pay Bill Payment Error: ' . $e->getMessage());
            return [
                'statusCode' => '9999',
                'statusMessage' => 'System error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Process payment for a specific bill
     */
    protected function processPayment(Customer $customer, Bill $bill, float $amount, string $trxID, ?string $paymentID): array
    {
        $payment = Payment::create([
            'customer_id' => $customer->id,
            'bill_id' => $bill->id,
            'amount' => $amount,
            'payment_method' => 'bkash_paybill',
            'bkash_trx_id' => $trxID,
            'bkash_payment_id' => $paymentID,
            'month' => $bill->month,
            'status' => 'completed',
            'paid_at' => now(),
        ]);

        $this->billingService->markBillPaid($bill);

        $this->ledgerService->addCredit(
            $customer->id,
            $amount,
            "bKash Pay Bill - {$bill->month} - TrxID: {$trxID}",
            $payment->id
        );

        return [
            'statusCode' => '0000',
            'statusMessage' => 'Payment successful',
            'trxID' => $trxID,
            'paidAmount' => number_format($amount, 2, '.', ''),
            'paidBills' => [$bill->month],
            'customerName' => $customer->name,
        ];
    }
}
