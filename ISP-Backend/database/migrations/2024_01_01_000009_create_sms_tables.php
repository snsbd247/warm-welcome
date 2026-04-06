<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sms_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->string('api_token')->nullable();
            $table->string('sender_id')->nullable();
            $table->boolean('sms_on_bill_generate')->default(false);
            $table->boolean('sms_on_payment')->default(false);
            $table->boolean('sms_on_registration')->default(false);
            $table->boolean('sms_on_suspension')->default(false);
            $table->boolean('sms_on_new_customer_bill')->default(true);
            $table->boolean('sms_on_reminder')->default(false);
            $table->boolean('whatsapp_enabled')->default(false);
            $table->string('whatsapp_token')->nullable();
            $table->string('whatsapp_phone_id')->nullable();
            $table->timestamps();
        });

        Schema::create('sms_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->text('message');
            $table->timestamps();
        });

        Schema::create('sms_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->string('phone');
            $table->text('message');
            $table->string('sms_type');
            $table->string('status')->default('pending');
            $table->text('response')->nullable();
            $table->uuid('customer_id')->nullable()->index();
            $table->integer('sms_count')->default(1);
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('reminder_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('phone');
            $table->text('message');
            $table->string('channel')->default('sms');
            $table->string('status')->default('sent');
            $table->uuid('customer_id')->nullable()->index();
            $table->uuid('bill_id')->nullable()->index();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reminder_logs');
        Schema::dropIfExists('sms_logs');
        Schema::dropIfExists('sms_templates');
        Schema::dropIfExists('sms_settings');
    }
};
