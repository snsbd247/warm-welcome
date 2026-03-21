<?php

namespace App\Services;

use App\Models\Bill;
use App\Models\Payment;
use App\Models\PaymentGateway;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BkashService
{
    protected ?PaymentGateway $gateway = null;
    protected ?string $token = null;

    protected function loadGateway(): PaymentGateway
    {
        if (!$this->gateway) {
            $this->gateway = PaymentGateway::where('gateway_name', 'bkash')
                ->where('status', 'active')
                ->firstOrFail();
        }
        return $this->gateway;
    }

    protected function getToken(): string
    {
        if ($this->token) return $this->token;

        $gw = $this->loadGateway();
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
            'username' => $gw->username,
            'password' => $gw->password,
        ])->post($gw->base_url . '/tokenized/checkout/token/grant', [
            'app_key' => $gw->app_key,
            'app_secret' => $gw->app_secret,
        ]);

        $data = $response->json();
        $this->token = $data['id_token'] ?? '';

        // Update last connected
        $gw->update(['last_connected_at' => now()]);

        return $this->token;
    }

    public function createPayment(string $billId, string $customerId, float $amount, string $callbackUrl): array
    {
        try {
            // Validate amount against bill
            $bill = Bill::findOrFail($billId);
            if (abs($bill->amount - $amount) > 0.01) {
                return ['success' => false, 'error' => 'Amount mismatch with bill'];
            }

            $gw = $this->loadGateway();
            $token = $this->getToken();

            $response = Http::withHeaders([
                'Authorization' => $token,
                'X-APP-Key' => $gw->app_key,
                'Content-Type' => 'application/json',
            ])->post($gw->base_url . '/tokenized/checkout/create', [
                'mode' => '0011',
                'payerReference' => $customerId,
                'callbackURL' => $callbackUrl,
                'amount' => number_format($amount, 2, '.', ''),
                'currency' => 'BDT',
                'intent' => 'sale',
                'merchantInvoiceNumber' => $billId,
            ]);

            return ['success' => true, 'data' => $response->json()];
        } catch (\Exception $e) {
            Log::error('bKash create payment failed: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function executePayment(string $paymentId, string $status): array
    {
        if ($status !== 'success') {
            return ['success' => false, 'error' => "Payment status: {$status}"];
        }

        try {
            $gw = $this->loadGateway();
            $token = $this->getToken();

            $response = Http::withHeaders([
                'Authorization' => $token,
                'X-APP-Key' => $gw->app_key,
                'Content-Type' => 'application/json',
            ])->post($gw->base_url . '/tokenized/checkout/execute', [
                'paymentID' => $paymentId,
            ]);

            $data = $response->json();

            if (($data['statusCode'] ?? '') === '0000') {
                // Create payment record
                $billId = $data['merchantInvoiceNumber'] ?? null;
                $bill = $billId ? Bill::find($billId) : null;

                if ($bill) {
                    Payment::create([
                        'customer_id' => $bill->customer_id,
                        'bill_id' => $bill->id,
                        'amount' => $data['amount'],
                        'payment_method' => 'bkash',
                        'bkash_payment_id' => $paymentId,
                        'bkash_trx_id' => $data['trxID'] ?? null,
                        'status' => 'completed',
                        'paid_at' => now(),
                    ]);

                    $bill->update(['status' => 'paid', 'paid_date' => now()]);
                }

                return ['success' => true, 'data' => $data];
            }

            return ['success' => false, 'error' => $data['statusMessage'] ?? 'Payment failed'];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
