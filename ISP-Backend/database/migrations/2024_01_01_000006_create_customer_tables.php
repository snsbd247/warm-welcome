<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('packages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->string('name');
            $table->string('speed');
            $table->decimal('monthly_price', 10, 2)->default(0);
            $table->integer('download_speed')->default(0);
            $table->integer('upload_speed')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('mikrotik_profile_name')->nullable();
            $table->string('bandwidth_profile')->nullable();
            $table->string('burst_limit')->nullable();
            $table->uuid('router_id')->nullable()->index();
            $table->uuid('ip_pool_id')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->string('customer_id')->unique();
            $table->string('name');
            $table->string('phone');
            $table->string('alt_phone')->nullable();
            $table->string('email')->nullable();
            $table->string('father_name')->nullable();
            $table->string('mother_name')->nullable();
            $table->string('occupation')->nullable();
            $table->string('nid')->nullable();
            $table->string('area');
            $table->string('road')->nullable();
            $table->string('house')->nullable();
            $table->string('city')->nullable();
            $table->string('village')->nullable();
            $table->string('post_office')->nullable();
            $table->string('district')->nullable();
            $table->string('division')->nullable();
            $table->string('upazila')->nullable();
            $table->text('permanent_address')->nullable();
            $table->string('perm_division')->nullable();
            $table->string('perm_district')->nullable();
            $table->string('perm_upazila')->nullable();
            $table->string('perm_village')->nullable();
            $table->string('perm_road')->nullable();
            $table->string('perm_house')->nullable();
            $table->string('perm_post_office')->nullable();
            $table->string('pop_location')->nullable();
            $table->string('box_name')->nullable();
            $table->uuid('package_id')->nullable()->index();
            $table->decimal('monthly_bill', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->nullable();
            $table->decimal('connectivity_fee', 10, 2)->nullable();
            $table->integer('due_date_day')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('static_ip')->nullable();
            $table->string('gateway')->nullable();
            $table->string('subnet')->nullable();
            $table->string('pppoe_username')->nullable()->unique();
            $table->string('pppoe_password')->nullable();
            $table->string('pppoe_password_hash')->nullable();
            $table->string('mac_address')->nullable();
            $table->string('onu_mac')->nullable();
            $table->string('router_mac')->nullable();
            $table->string('cable_length')->nullable();
            $table->uuid('router_id')->nullable()->index();
            $table->uuid('reseller_id')->nullable()->index();
            $table->uuid('zone_id')->nullable()->index();
            $table->date('installation_date')->nullable();
            $table->string('installed_by')->nullable();
            $table->string('status')->default('active');
            $table->string('connection_status')->default('active');
            $table->string('mikrotik_sync_status')->default('pending');
            $table->string('username')->nullable();
            $table->string('photo_url')->nullable();
            $table->timestamps();
        });

        Schema::create('customer_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id')->index();
            $table->string('session_token')->unique();
            $table->timestamp('expires_at');
            $table->timestamps();
        });

        Schema::create('customer_ledger', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id')->index();
            $table->date('date')->useCurrent();
            $table->string('type')->default('bill');
            $table->string('description');
            $table->decimal('debit', 10, 2)->default(0);
            $table->decimal('credit', 10, 2)->default(0);
            $table->decimal('balance', 10, 2)->default(0);
            $table->string('reference')->nullable();
            $table->timestamps();
        });

        Schema::create('customer_devices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->uuid('customer_id')->nullable()->index();
            $table->uuid('product_id')->nullable()->index();
            $table->string('serial_number')->nullable();
            $table->string('mac_address')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('status')->default('active');
            $table->text('notes')->nullable();
            $table->timestamp('assigned_at')->nullable();
            $table->timestamps();
        });

        Schema::create('coupons', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code')->unique();
            $table->string('description')->nullable();
            $table->string('discount_type')->default('fixed');
            $table->decimal('discount_value', 10, 2)->default(0);
            $table->integer('max_uses')->nullable();
            $table->integer('used_count')->default(0);
            $table->date('valid_from')->nullable();
            $table->date('valid_until')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('customer_devices');
        Schema::dropIfExists('customer_ledger');
        Schema::dropIfExists('customer_sessions');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('packages');
    }
};
