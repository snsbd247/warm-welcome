<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fiber_olts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index();
            $table->string('name');
            $table->string('location')->nullable();
            $table->integer('total_pon_ports')->default(0);
            $table->string('status')->default('active');
            $table->double('lat')->nullable();
            $table->double('lng')->nullable();
            $table->timestamps();
        });

        Schema::create('fiber_pon_ports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index();
            $table->uuid('olt_id')->index();
            $table->integer('port_number');
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('fiber_cables', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index();
            $table->uuid('pon_port_id')->nullable()->index();
            $table->string('name');
            $table->integer('total_cores')->default(0);
            $table->string('color')->nullable();
            $table->double('length_meters')->nullable();
            $table->string('status')->default('active');
            $table->string('source_type')->nullable();
            $table->uuid('source_id')->nullable();
            $table->double('lat')->nullable();
            $table->double('lng')->nullable();
            $table->timestamps();
        });

        Schema::create('fiber_cores', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index();
            $table->uuid('fiber_cable_id')->index();
            $table->integer('core_number');
            $table->string('color')->nullable();
            $table->string('status')->default('available');
            $table->uuid('connected_olt_port_id')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('fiber_splitters', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index();
            $table->uuid('core_id')->nullable()->index();
            $table->string('ratio')->default('1:8');
            $table->string('location')->nullable();
            $table->string('label')->nullable();
            $table->string('status')->default('active');
            $table->double('lat')->nullable();
            $table->double('lng')->nullable();
            $table->string('source_type')->nullable();
            $table->uuid('source_id')->nullable();
            $table->timestamps();
        });

        Schema::create('fiber_splitter_outputs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index();
            $table->uuid('splitter_id')->index();
            $table->integer('output_number');
            $table->string('status')->default('available');
            $table->string('color')->nullable();
            $table->string('connection_type')->nullable();
            $table->uuid('connected_id')->nullable();
            $table->timestamps();
        });

        Schema::create('fiber_onus', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index();
            $table->uuid('splitter_output_id')->nullable()->index();
            $table->string('serial_number');
            $table->string('mac_address')->nullable();
            $table->string('status')->default('active');
            $table->uuid('customer_id')->nullable()->index();
            $table->string('signal_strength')->nullable();
            $table->double('lat')->nullable();
            $table->double('lng')->nullable();
            $table->timestamps();
        });

        Schema::create('core_connections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index();
            $table->uuid('from_core_id')->index();
            $table->uuid('to_core_id')->index();
            $table->string('label')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('core_connections');
        Schema::dropIfExists('fiber_onus');
        Schema::dropIfExists('fiber_splitter_outputs');
        Schema::dropIfExists('fiber_splitters');
        Schema::dropIfExists('fiber_cores');
        Schema::dropIfExists('fiber_cables');
        Schema::dropIfExists('fiber_pon_ports');
        Schema::dropIfExists('fiber_olts');
    }
};
