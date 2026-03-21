<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id');
            $table->uuid('bill_id')->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('payment_method')->default('cash');
            $table->string('status')->default('completed');
            $table->string('transaction_id')->nullable();
            $table->string('bkash_payment_id')->nullable();
            $table->string('bkash_trx_id')->nullable();
            $table->string('month')->nullable();
            $table->timestamp('paid_at')->useCurrent();
            $table->timestamps();
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('bill_id')->references('id')->on('bills')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
