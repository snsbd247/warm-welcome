<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('merchant_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('transaction_id')->unique();
            $table->string('sender_phone');
            $table->decimal('amount', 10, 2)->default(0);
            $table->string('reference')->nullable();
            $table->date('payment_date')->useCurrent();
            $table->string('status')->default('unmatched');
            $table->uuid('matched_customer_id')->nullable();
            $table->uuid('matched_bill_id')->nullable();
            $table->text('notes')->nullable();
            $table->text('sms_text')->nullable();
            $table->timestamps();
            $table->foreign('matched_customer_id')->references('id')->on('customers')->onDelete('set null');
            $table->foreign('matched_bill_id')->references('id')->on('bills')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('merchant_payments');
    }
};
