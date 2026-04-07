<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->string('full_name')->default('Admin');
            $table->string('email')->nullable();
            $table->string('username')->nullable()->unique();
            $table->string('mobile')->nullable();
            $table->text('address')->nullable();
            $table->string('avatar_url')->nullable();
            $table->string('password_hash')->nullable();
            $table->string('staff_id')->nullable();
            $table->string('status')->default('active');
            $table->string('language')->default('en');
            $table->boolean('must_change_password')->default(false);
            $table->timestamps();
        });

        Schema::create('custom_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->string('name')->unique();
            $table->string('description')->nullable();
            $table->string('db_role')->default('staff');
            $table->boolean('is_system')->default(false);
            $table->timestamps();
        });

        Schema::create('user_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->index();
            $table->string('role')->default('staff');
            $table->uuid('custom_role_id')->nullable()->index();
            $table->unique(['user_id', 'role']);
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('module');
            $table->string('action');
            $table->string('description')->nullable();
            $table->unique(['module', 'action']);
        });

        Schema::create('role_permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('role_id')->index();
            $table->uuid('permission_id')->index();
            $table->unique(['role_id', 'permission_id']);
        });

        Schema::create('admin_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->uuid('admin_id')->index();
            $table->string('session_token')->unique();
            $table->string('ip_address')->default('');
            $table->string('browser')->default('');
            $table->string('device_name')->default('');
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->timestamp('last_activity')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('admin_login_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('admin_id')->index();
            $table->string('action');
            $table->string('ip_address')->nullable();
            $table->string('browser')->nullable();
            $table->string('device_name')->nullable();
            $table->uuid('session_id')->nullable()->index();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_login_logs');
        Schema::dropIfExists('admin_sessions');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('custom_roles');
        Schema::dropIfExists('users');
    }
};
