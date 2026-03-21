<?php

namespace App\Services;

use App\Models\Bill;
use App\Models\Payment;
use App\Models\PaymentGateway;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NagadService
{
    public function createPayment(string $billId, string $customerId, float $amount, string $callbackUrl): array
    {
        try {
            $bill = Bill::findOrFail($billId);
            if (abs($bill->amount - $amount) > 0.01) {
                return ['success' => false, 'error' => 'Amount mismatch with bill'];
            }

            $gw = PaymentGateway::where('gateway_name', 'nagad')
                ->where('status', 'active')
                ->firstOrFail();

            // Nagad payment initialization
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-KM-Api-Version' => 'v-0.2.0',
            ])->post($gw->base_url . '/remote-payment/initialize/' . $gw->merchant_number . '/' . $billId, [
                'accountNumber' => $gw->merchant_number,
                'dateTime' => now()->format('YmdHis'),
                'sensitiveData' => json_encode([
                    'merchantId' => $gw->merchant_number,
                    'orderId' => $billId,
                    'amount' => number_format($amount, 2, '.', ''),
                    'currencyCode' => '050',
                    'challenge' => bin2hex(random_bytes(16)),
                ]),
                'signature' => '',
            ]);

            return ['success' => true, 'data' => $response->json()];
        } catch (\Exception $e) {
            Log::error('Nagad create payment failed: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function verifyPayment(array $data): array
    {
        try {
            $gw = PaymentGateway::where('gateway_name', 'nagad')
                ->where('status', 'active')
                ->first();

            if (!$gw) {
                return ['success' => false, 'error' => 'Nagad gateway not configured'];
            }

            $paymentRefId = $data['payment_ref_id'] ?? $data['paymentRefId'] ?? null;
            if (!$paymentRefId) {
                return ['success' => false, 'error' => 'Missing payment reference'];
            }

            $response = Http::get($gw->base_url . '/verify/payment/' . $paymentRefId);
            $result = $response->json();

            if (($result['status'] ?? '') === 'Success') {
                $billId = $result['orderId'] ?? null;
                $bill = $billId ? Bill::find($billId) : null;

                if ($bill) {
                    Payment::create([
                        'customer_id' => $bill->customer_id,
                        'bill_id' => $bill->id,
                        'amount' => $result['amount'],
                        'payment_method' => 'nagad',
                        'transaction_id' => $paymentRefId,
                        'status' => 'completed',
                        'paid_at' => now(),
                    ]);

                    $bill->update(['status' => 'paid', 'paid_date' => now()]);
                }

                return ['success' => true, 'data' => $result];
            }

            return ['success' => false, 'error' => $result['message'] ?? 'Verification failed'];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
