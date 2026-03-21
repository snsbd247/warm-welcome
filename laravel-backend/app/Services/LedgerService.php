<?php

namespace App\Services;

use App\Models\CustomerLedger;

class LedgerService
{
    public function getBalance(string $customerId): float
    {
        $lastEntry = CustomerLedger::where('customer_id', $customerId)
            ->orderBy('created_at', 'desc')
            ->first();

        return $lastEntry ? (float) $lastEntry->balance : 0;
    }

    public function addDebit(string $customerId, float $amount, string $description, ?string $reference = null): CustomerLedger
    {
        $balance = $this->getBalance($customerId);
        $newBalance = $balance + $amount;

        return CustomerLedger::create([
            'customer_id' => $customerId,
            'date' => now()->toDateString(),
            'type' => 'bill',
            'description' => $description,
            'debit' => $amount,
            'credit' => 0,
            'balance' => $newBalance,
            'reference' => $reference,
        ]);
    }

    public function addCredit(string $customerId, float $amount, string $description, ?string $reference = null): CustomerLedger
    {
        $balance = $this->getBalance($customerId);
        $newBalance = $balance - $amount;

        return CustomerLedger::create([
            'customer_id' => $customerId,
            'date' => now()->toDateString(),
            'type' => 'payment',
            'description' => $description,
            'debit' => 0,
            'credit' => $amount,
            'balance' => $newBalance,
            'reference' => $reference,
        ]);
    }
}
