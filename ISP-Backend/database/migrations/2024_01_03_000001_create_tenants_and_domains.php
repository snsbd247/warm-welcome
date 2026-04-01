<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ── Tenants table ────────────────────────────────────
        if (!Schema::hasTable('tenants')) {
            Schema::create('tenants', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name');
                $table->string('subdomain')->nullable()->unique();
                $table->string('email')->nullable();
                $table->string('phone')->nullable();
                $table->string('logo_url')->nullable();
                $table->string('status')->default('active'); // active, suspended, trial
                $table->string('plan')->default('basic');     // basic, pro, enterprise
                $table->timestamp('trial_ends_at')->nullable();
                $table->json('settings')->nullable();
                $table->timestamps();
            });
        }

        // ── Domains table ────────────────────────────────────
        if (!Schema::hasTable('domains')) {
            Schema::create('domains', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('tenant_id')->index();
                $table->string('domain')->unique();
                $table->boolean('is_primary')->default(false);
                $table->boolean('is_verified')->default(false);
                $table->timestamps();
            });
        }

        // ── Add tenant_id to users table ─────────────────────
        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'tenant_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->uuid('tenant_id')->nullable()->index()->after('id');
            });
        }

        // ── Add tenant_id to customers table ─────────────────
        if (Schema::hasTable('customers') && !Schema::hasColumn('customers', 'tenant_id')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->uuid('tenant_id')->nullable()->index()->after('id');
            });
        }

        // ── Add tenant_id to bills table ─────────────────────
        if (Schema::hasTable('bills') && !Schema::hasColumn('bills', 'tenant_id')) {
            Schema::table('bills', function (Blueprint $table) {
                $table->uuid('tenant_id')->nullable()->index()->after('id');
            });
        }

        // ── Add tenant_id to payments table ──────────────────
        if (Schema::hasTable('payments') && !Schema::hasColumn('payments', 'tenant_id')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->uuid('tenant_id')->nullable()->index()->after('id');
            });
        }

        // ── Add tenant_id to packages table ──────────────────
        if (Schema::hasTable('packages') && !Schema::hasColumn('packages', 'tenant_id')) {
            Schema::table('packages', function (Blueprint $table) {
                $table->uuid('tenant_id')->nullable()->index()->after('id');
            });
        }

        // ── Add tenant_id to expenses table ──────────────────
        if (Schema::hasTable('expenses') && !Schema::hasColumn('expenses', 'tenant_id')) {
            Schema::table('expenses', function (Blueprint $table) {
                $table->uuid('tenant_id')->nullable()->index()->after('id');
            });
        }

        // ── Add tenant_id to general_settings ────────────────
        if (Schema::hasTable('general_settings') && !Schema::hasColumn('general_settings', 'tenant_id')) {
            Schema::table('general_settings', function (Blueprint $table) {
                $table->uuid('tenant_id')->nullable()->index()->after('id');
            });
        }

        // ── Add tenant_id to mikrotik_routers ────────────────
        if (Schema::hasTable('mikrotik_routers') && !Schema::hasColumn('mikrotik_routers', 'tenant_id')) {
            Schema::table('mikrotik_routers', function (Blueprint $table) {
                $table->uuid('tenant_id')->nullable()->index()->after('id');
            });
        }

        // ── Add tenant_id to sms_settings ────────────────────
        if (Schema::hasTable('sms_settings') && !Schema::hasColumn('sms_settings', 'tenant_id')) {
            Schema::table('sms_settings', function (Blueprint $table) {
                $table->uuid('tenant_id')->nullable()->index()->after('id');
            });
        }

        // ── Add tenant_id to payment_gateways ────────────────
        if (Schema::hasTable('payment_gateways') && !Schema::hasColumn('payment_gateways', 'tenant_id')) {
            Schema::table('payment_gateways', function (Blueprint $table) {
                $table->uuid('tenant_id')->nullable()->index()->after('id');
            });
        }

        // ── Add tenant_id to accounts (COA) ──────────────────
        if (Schema::hasTable('accounts') && !Schema::hasColumn('accounts', 'tenant_id')) {
            Schema::table('accounts', function (Blueprint $table) {
                $table->uuid('tenant_id')->nullable()->index()->after('id');
            });
        }

        // ── Add tenant_id to employees ───────────────────────
        if (Schema::hasTable('employees') && !Schema::hasColumn('employees', 'tenant_id')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->uuid('tenant_id')->nullable()->index()->after('id');
            });
        }

        // ── Add tenant_id to vendors ─────────────────────────
        if (Schema::hasTable('vendors') && !Schema::hasColumn('vendors', 'tenant_id')) {
            Schema::table('vendors', function (Blueprint $table) {
                $table->uuid('tenant_id')->nullable()->index()->after('id');
            });
        }

        // ── Add tenant_id to suppliers ───────────────────────
        if (Schema::hasTable('suppliers') && !Schema::hasColumn('suppliers', 'tenant_id')) {
            Schema::table('suppliers', function (Blueprint $table) {
                $table->uuid('tenant_id')->nullable()->index()->after('id');
            });
        }

        // ── Add tenant_id to support_tickets ─────────────────
        if (Schema::hasTable('support_tickets') && !Schema::hasColumn('support_tickets', 'tenant_id')) {
            Schema::table('support_tickets', function (Blueprint $table) {
                $table->uuid('tenant_id')->nullable()->index()->after('id');
            });
        }

        // ── Add tenant_id to zones ───────────────────────────
        if (Schema::hasTable('zones') && !Schema::hasColumn('zones', 'tenant_id')) {
            Schema::table('zones', function (Blueprint $table) {
                $table->uuid('tenant_id')->nullable()->index()->after('id');
            });
        }

        // ── Add tenant_id to admin_sessions ──────────────────
        if (Schema::hasTable('admin_sessions') && !Schema::hasColumn('admin_sessions', 'tenant_id')) {
            Schema::table('admin_sessions', function (Blueprint $table) {
                $table->uuid('tenant_id')->nullable()->index()->after('id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('domains');
        Schema::dropIfExists('tenants');
        // tenant_id columns are left in place for safety
    }
};
