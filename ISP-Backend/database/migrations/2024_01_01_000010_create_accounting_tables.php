<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->string('name');
            $table->string('type');
            $table->string('code')->nullable();
            $table->uuid('parent_id')->nullable()->index();
            $table->integer('level')->default(0);
            $table->decimal('balance', 14, 2)->default(0);
            $table->text('description')->nullable();
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type')->default('journal');
            $table->string('category')->nullable();
            $table->decimal('amount', 12, 2)->default(0);
            $table->decimal('debit', 12, 2)->default(0);
            $table->decimal('credit', 12, 2)->default(0);
            $table->date('date')->nullable();
            $table->text('description')->nullable();
            $table->string('reference')->nullable();
            $table->string('reference_type')->nullable();
            $table->uuid('reference_id')->nullable();
            $table->uuid('account_id')->nullable()->index();
            $table->uuid('customer_id')->nullable()->index();
            $table->uuid('vendor_id')->nullable()->index();
            $table->uuid('created_by')->nullable()->index();
            $table->string('journal_ref')->nullable()->index();
            $table->timestamps();
            $table->index('type');
            $table->index('date');
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->string('category')->default('other');
            $table->decimal('amount', 12, 2)->default(0);
            $table->date('date');
            $table->text('description')->nullable();
            $table->string('payment_method')->default('cash');
            $table->uuid('account_id')->nullable()->index();
            $table->string('reference')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('daily_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('date')->unique();
            $table->decimal('total_billed', 14, 2)->default(0);
            $table->decimal('total_collection', 14, 2)->default(0);
            $table->decimal('total_expense', 14, 2)->default(0);
            $table->integer('new_customers')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('income_heads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('expense_heads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('other_heads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('type')->default('other');
            $table->text('description')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
        Schema::dropIfExists('other_heads');
        Schema::dropIfExists('expense_heads');
        Schema::dropIfExists('income_heads');
        Schema::dropIfExists('daily_reports');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('accounts');
    }
};
