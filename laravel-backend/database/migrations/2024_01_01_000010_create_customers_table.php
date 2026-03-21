<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
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
            $table->text('permanent_address')->nullable();
            $table->string('pop_location')->nullable();
            $table->string('box_name')->nullable();
            $table->uuid('package_id')->nullable();
            $table->decimal('monthly_bill', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->nullable();
            $table->decimal('connectivity_fee', 10, 2)->nullable();
            $table->integer('due_date_day')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('gateway')->nullable();
            $table->string('subnet')->nullable();
            $table->string('pppoe_username')->nullable()->unique();
            $table->string('pppoe_password')->nullable();
            $table->string('pppoe_password_hash')->nullable();
            $table->string('onu_mac')->nullable();
            $table->string('router_mac')->nullable();
            $table->string('cable_length')->nullable();
            $table->uuid('router_id')->nullable();
            $table->date('installation_date')->nullable();
            $table->string('installed_by')->nullable();
            $table->string('status')->default('active');
            $table->string('connection_status')->default('active');
            $table->string('mikrotik_sync_status')->default('pending');
            $table->string('username')->nullable();
            $table->string('photo_url')->nullable();
            $table->timestamps();
            $table->foreign('package_id')->references('id')->on('packages')->onDelete('set null');
            $table->foreign('router_id')->references('id')->on('mikrotik_routers')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
