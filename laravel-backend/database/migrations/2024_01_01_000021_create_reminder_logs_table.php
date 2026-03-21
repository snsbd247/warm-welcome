<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('reminder_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('phone');
            $table->text('message');
            $table->string('channel')->default('sms');
            $table->string('status')->default('sent');
            $table->uuid('customer_id')->nullable();
            $table->uuid('bill_id')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('set null');
            $table->foreign('bill_id')->references('id')->on('bills')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reminder_logs');
    }
};
