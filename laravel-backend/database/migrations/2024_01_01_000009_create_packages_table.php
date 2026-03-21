<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('packages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('speed');
            $table->decimal('monthly_price', 10, 2)->default(0);
            $table->integer('download_speed')->default(0);
            $table->integer('upload_speed')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('mikrotik_profile_name')->nullable();
            $table->string('bandwidth_profile')->nullable();
            $table->string('burst_limit')->nullable();
            $table->uuid('router_id')->nullable();
            $table->timestamps();
            $table->foreign('router_id')->references('id')->on('mikrotik_routers')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('packages');
    }
};
