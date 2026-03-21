<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('admin_login_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('admin_id');
            $table->string('action');
            $table->string('ip_address')->nullable();
            $table->string('browser')->nullable();
            $table->string('device_name')->nullable();
            $table->uuid('session_id')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('session_id')->references('id')->on('admin_sessions')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_login_logs');
    }
};
