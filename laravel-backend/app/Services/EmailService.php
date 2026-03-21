<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EmailService
{
    public function send(string $to, string $subject, string $html, ?string $fromName = null): array
    {
        $fromName = $fromName ?? config('mail.from.name', 'Smart ISP');
        $fromAddress = config('mail.from.address', 'noreply@example.com');

        try {
            Mail::html($html, function ($message) use ($to, $subject, $fromName, $fromAddress) {
                $message->to($to)
                    ->subject($subject)
                    ->from($fromAddress, $fromName);
            });

            return ['success' => true, 'provider' => 'smtp'];
        } catch (\Exception $e) {
            Log::error('Email send failed: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
