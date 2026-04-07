<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sms_wallets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->unique();
            $table->integer('balance')->default(0);
            $table->decimal('sms_rate', 8, 4)->default(0.25);
            $table->timestamps();
        });

        Schema::create('sms_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index();
            $table->integer('amount');
            $table->string('type')->default('credit');
            $table->text('description')->nullable();
            $table->string('admin_id')->nullable();
            $table->integer('balance_after')->default(0);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_transactions');
        Schema::dropIfExists('sms_wallets');
    }
};
