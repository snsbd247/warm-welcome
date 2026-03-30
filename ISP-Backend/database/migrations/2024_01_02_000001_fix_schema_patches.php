<?php

/**
 * Idempotent schema patches — safe to run multiple times.
 * Adds missing columns and tables that may not exist after partial deployments.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ── user_roles: add timestamps if missing ────────────
        if (Schema::hasTable('user_roles')) {
            Schema::table('user_roles', function (Blueprint $table) {
                if (!Schema::hasColumn('user_roles', 'created_at')) {
                    $table->timestamp('created_at')->nullable();
                }
                if (!Schema::hasColumn('user_roles', 'updated_at')) {
                    $table->timestamp('updated_at')->nullable();
                }
            });
        }

        // ── Ensure cache table exists ────────────────────────
        if (!Schema::hasTable('cache')) {
            Schema::create('cache', function (Blueprint $table) {
                $table->string('key')->primary();
                $table->mediumText('value');
                $table->integer('expiration');
            });
        }

        if (!Schema::hasTable('cache_locks')) {
            Schema::create('cache_locks', function (Blueprint $table) {
                $table->string('key')->primary();
                $table->string('owner');
                $table->integer('expiration');
            });
        }

        // ── Ensure geo tables exist ──────────────────────────
        if (!Schema::hasTable('geo_divisions')) {
            Schema::create('geo_divisions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name');
                $table->string('bn_name')->nullable();
                $table->string('status')->default('active');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('geo_districts')) {
            Schema::create('geo_districts', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name');
                $table->string('bn_name')->nullable();
                $table->uuid('division_id')->index();
                $table->string('status')->default('active');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('geo_upazilas')) {
            Schema::create('geo_upazilas', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name');
                $table->string('bn_name')->nullable();
                $table->uuid('district_id')->index();
                $table->string('status')->default('active');
                $table->timestamps();
            });
        }

        // ── Ensure accounts table exists ─────────────────────
        if (!Schema::hasTable('accounts')) {
            Schema::create('accounts', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name');
                $table->string('type');
                $table->string('code')->nullable()->unique();
                $table->uuid('parent_id')->nullable()->index();
                $table->integer('level')->default(0);
                $table->decimal('balance', 14, 2)->default(0);
                $table->text('description')->nullable();
                $table->boolean('is_system')->default(false);
                $table->boolean('is_active')->default(true);
                $table->string('status')->default('active');
                $table->timestamps();
            });
        }

        // ── Ensure employees has photo_url ───────────────────
        if (Schema::hasTable('employees') && !Schema::hasColumn('employees', 'photo_url')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->string('photo_url')->nullable()->after('address');
            });
        }

        // ── Ensure customers has created_at index for performance ─
        // (Handled at application level, no index needed for portability)

        // ── Ensure sms_settings has all newer columns ────────
        if (Schema::hasTable('sms_settings')) {
            Schema::table('sms_settings', function (Blueprint $table) {
                if (!Schema::hasColumn('sms_settings', 'sms_on_reminder')) {
                    $table->boolean('sms_on_reminder')->default(false);
                }
                if (!Schema::hasColumn('sms_settings', 'whatsapp_enabled')) {
                    $table->boolean('whatsapp_enabled')->default(false);
                }
                if (!Schema::hasColumn('sms_settings', 'whatsapp_token')) {
                    $table->string('whatsapp_token')->nullable();
                }
                if (!Schema::hasColumn('sms_settings', 'whatsapp_phone_id')) {
                    $table->string('whatsapp_phone_id')->nullable();
                }
            });
        }

        // ── Ensure payment_gateways has receiving_account_id ─
        if (Schema::hasTable('payment_gateways') && !Schema::hasColumn('payment_gateways', 'receiving_account_id')) {
            Schema::table('payment_gateways', function (Blueprint $table) {
                $table->uuid('receiving_account_id')->nullable()->index();
            });
        }

        // ── Ensure customers has connection_status ───────────
        if (Schema::hasTable('customers') && !Schema::hasColumn('customers', 'connection_status')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->string('connection_status')->default('active');
            });
        }

        // ── Ensure customers has mikrotik_sync_status ────────
        if (Schema::hasTable('customers') && !Schema::hasColumn('customers', 'mikrotik_sync_status')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->string('mikrotik_sync_status')->default('pending');
            });
        }
    }

    public function down(): void
    {
        // Not reversible — these are safety patches
    }
};
