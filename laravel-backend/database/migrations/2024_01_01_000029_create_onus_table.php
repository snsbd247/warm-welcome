<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('onus', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('serial_number');
            $table->string('mac_address')->nullable();
            $table->uuid('olt_id')->nullable();
            $table->string('olt_port')->nullable();
            $table->uuid('customer_id')->nullable();
            $table->string('status')->default('active');
            $table->string('signal_strength')->nullable();
            $table->timestamps();
            $table->foreign('olt_id')->references('id')->on('olts')->onDelete('set null');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('onus');
    }
};
