<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('zones', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->string('area_name');
            $table->text('address')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('mikrotik_routers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->string('name');
            $table->string('ip_address');
            $table->string('username')->default('admin');
            $table->string('password');
            $table->integer('api_port')->default(8728);
            $table->string('status')->default('active');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('olts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('ip_address');
            $table->string('brand')->nullable();
            $table->string('location')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('onus', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('serial_number');
            $table->string('mac_address')->nullable();
            $table->uuid('olt_id')->nullable()->index();
            $table->string('olt_port')->nullable();
            $table->uuid('customer_id')->nullable()->index();
            $table->string('status')->default('active');
            $table->string('signal_strength')->nullable();
            $table->timestamps();
        });

        Schema::create('ip_pools', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->string('name');
            $table->string('subnet')->nullable();
            $table->string('gateway')->nullable();
            $table->string('start_ip')->nullable();
            $table->string('end_ip')->nullable();
            $table->integer('total_ips')->default(0);
            $table->integer('used_ips')->default(0);
            $table->string('status')->default('active');
            $table->uuid('router_id')->nullable()->index();
            $table->string('type')->nullable();
            $table->string('ranges')->nullable();
            $table->string('mikrotik_id')->nullable();
            $table->timestamps();
        });

        Schema::create('online_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('pppoe_username');
            $table->string('ip_address')->nullable();
            $table->string('mac_address')->nullable();
            $table->string('uptime')->nullable();
            $table->bigInteger('bytes_in')->nullable();
            $table->bigInteger('bytes_out')->nullable();
            $table->uuid('customer_id')->nullable()->index();
            $table->uuid('router_id')->nullable()->index();
            $table->string('status')->default('online');
            $table->timestamp('connected_at')->nullable();
            $table->timestamp('last_seen')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('online_sessions');
        Schema::dropIfExists('ip_pools');
        Schema::dropIfExists('onus');
        Schema::dropIfExists('olts');
        Schema::dropIfExists('mikrotik_routers');
        Schema::dropIfExists('zones');
    }
};
