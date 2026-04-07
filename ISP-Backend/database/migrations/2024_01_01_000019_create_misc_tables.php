<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('demo_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('company_name');
            $table->string('contact_name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->text('message')->nullable();
            $table->string('status')->default('pending');
            $table->text('notes')->nullable();
            $table->string('subdomain')->nullable();
            $table->uuid('tenant_id')->nullable()->index();
            $table->timestamp('approved_at')->nullable();
            $table->string('approved_by')->nullable();
            $table->json('approved_modules')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('landing_sections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('section_type');
            $table->string('title')->nullable();
            $table->string('subtitle')->nullable();
            $table->text('description')->nullable();
            $table->text('content')->nullable();
            $table->string('icon')->nullable();
            $table->string('image_url')->nullable();
            $table->string('button_text')->nullable();
            $table->string('button_url')->nullable();
            $table->string('link_text')->nullable();
            $table->string('link_url')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('impersonations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('admin_id')->index();
            $table->uuid('tenant_id')->nullable()->index();
            $table->uuid('target_user_id')->nullable()->index();
            $table->string('token')->unique();
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();
        });

        // Ledger mappings for accounting
        Schema::create('ledger_mappings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->string('mapping_key')->index();
            $table->uuid('account_id')->index();
            $table->string('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ledger_mappings');
        Schema::dropIfExists('impersonations');
        Schema::dropIfExists('landing_sections');
        Schema::dropIfExists('demo_requests');
    }
};
