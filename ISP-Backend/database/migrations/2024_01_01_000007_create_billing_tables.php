<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('bills', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id')->index();
            $table->string('month');
            $table->decimal('amount', 10, 2)->default(0);
            $table->decimal('base_amount', 10, 2)->nullable();
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('commission_amount', 10, 2)->nullable();
            $table->decimal('reseller_profit', 10, 2)->nullable();
            $table->decimal('tenant_amount', 10, 2)->nullable();
            $table->uuid('reseller_id')->nullable()->index();
            $table->uuid('coupon_id')->nullable()->index();
            $table->string('status')->default('unpaid');
            $table->date('due_date')->nullable();
            $table->date('paid_date')->nullable();
            $table->string('payment_link_token')->nullable();
            $table->timestamps();
            $table->unique(['customer_id', 'month']);
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->uuid('customer_id')->index();
            $table->uuid('bill_id')->nullable()->index();
            $table->decimal('amount', 10, 2);
            $table->string('payment_method')->default('cash');
            $table->string('status')->default('completed');
            $table->string('transaction_id')->nullable();
            $table->string('bkash_payment_id')->nullable();
            $table->string('bkash_trx_id')->nullable();
            $table->string('month')->nullable();
            $table->timestamp('paid_at')->useCurrent();
            $table->timestamps();
        });

        Schema::create('merchant_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->string('transaction_id')->unique();
            $table->string('sender_phone');
            $table->decimal('amount', 10, 2)->default(0);
            $table->string('reference')->nullable();
            $table->date('payment_date')->useCurrent();
            $table->string('status')->default('unmatched');
            $table->uuid('matched_customer_id')->nullable()->index();
            $table->uuid('matched_bill_id')->nullable()->index();
            $table->text('notes')->nullable();
            $table->text('sms_text')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('merchant_payments');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('bills');
    }
};
