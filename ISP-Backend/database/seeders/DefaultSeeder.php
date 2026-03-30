<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\CustomRole;
use App\Models\GeneralSetting;
use App\Models\Package;
use App\Models\Permission;
use App\Models\SmsTemplate;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\SmsSetting;
use App\Models\UserRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DefaultSeeder extends Seeder
{
    public function run(): void
    {
        // ── Custom Roles ─────────────────────────────────
        $superAdminRole = CustomRole::firstOrCreate(
            ['name' => 'Super Admin'],
            [
                'description' => 'Full system access',
                'db_role' => 'super_admin',
                'is_system' => true,
            ]
        );
        CustomRole::firstOrCreate(
            ['name' => 'Admin'],
            ['description' => 'Administrative access', 'db_role' => 'admin', 'is_system' => true]
        );
        CustomRole::firstOrCreate(
            ['name' => 'Staff'],
            ['description' => 'Standard staff access', 'db_role' => 'staff', 'is_system' => true]
        );
        CustomRole::firstOrCreate(
            ['name' => 'Manager'],
            ['description' => 'Manager access', 'db_role' => 'manager', 'is_system' => true]
        );
        CustomRole::firstOrCreate(
            ['name' => 'Operator'],
            ['description' => 'Operator access', 'db_role' => 'operator', 'is_system' => true]
        );
        CustomRole::firstOrCreate(
            ['name' => 'Technician'],
            ['description' => 'Technician access', 'db_role' => 'technician', 'is_system' => true]
        );
        CustomRole::firstOrCreate(
            ['name' => 'Accountant'],
            ['description' => 'Accounting access', 'db_role' => 'accountant', 'is_system' => true]
        );

        // ── Super Admin ──────────────────────────────────
        User::firstOrCreate(
            ['username' => 'admin'],
            [
                'full_name' => 'Super Admin',
                'email' => 'admin@smartisp.com',
                'password_hash' => Hash::make('admin123'),
                'status' => 'active',
            ]
        );
        $admin = User::where('username', 'admin')->first();
        UserRole::firstOrCreate(
            ['user_id' => $admin->id],
            ['role' => 'super_admin', 'custom_role_id' => $superAdminRole->id]
        );

        // Admin User: ismail
        User::firstOrCreate(
            ['username' => 'ismail'],
            [
                'full_name' => 'Ismail',
                'email' => 'ismail@smartisp.com',
                'password_hash' => Hash::make('Admin@123'),
                'status' => 'active',
            ]
        );
        $ismail = User::where('username', 'ismail')->first();
        UserRole::firstOrCreate(
            ['user_id' => $ismail->id],
            ['role' => 'super_admin', 'custom_role_id' => $superAdminRole->id]
        );

        // ── General Settings ─────────────────────────────
        if (GeneralSetting::count() === 0) {
            GeneralSetting::create([
                'site_name' => 'Smart ISP',
                'primary_color' => '#3B82F6',
            ]);
        }

        // ── System Settings ──────────────────────────────
        $systemSettings = [
            'footer_text' => '© 2025-{year} ISP Billing System. All Rights Reserved.',
            'company_name' => 'ISP Billing System',
            'footer_link' => '#',
            'footer_developer' => 'Sync & Solutions IT',
            'system_version' => '1.0.1',
            'auto_update_year' => 'true',
            'enabled_modules' => '["billing","payments","merchant_payments","tickets","sms","accounting","inventory","supplier","reports","users","roles","settings","hr","customers"]',
            'invoice_footer' => 'Thank you for using our internet service.',
            'ledger_type' => 'running_balance',
        ];
        foreach ($systemSettings as $key => $value) {
            SystemSetting::firstOrCreate(
                ['setting_key' => $key],
                ['setting_value' => $value]
            );
        }

        // ── SMS Settings ─────────────────────────────────
        if (SmsSetting::count() === 0) {
            SmsSetting::create([
                'sms_on_bill_generate' => true,
                'sms_on_payment' => true,
                'sms_on_registration' => true,
                'sms_on_suspension' => true,
                'sms_on_new_customer_bill' => true,
            ]);
        }

        // ── SMS Templates ────────────────────────────────
        $smsTemplates = [
            'bill_generated' => 'Dear {customer_name}, your bill of ৳{amount} for {month} has been generated. Customer ID: {customer_id}. Please pay before {due_date}.',
            'payment_received' => 'Dear {customer_name}, payment of ৳{amount} received. Thank you! Customer ID: {customer_id}.',
            'registration' => 'Welcome {customer_name}! Your account has been created. Customer ID: {customer_id}, Username: {pppoe_username}.',
            'suspension_warning' => 'Dear {customer_name}, your connection will be suspended due to unpaid bill of ৳{amount}. Please pay immediately. Customer ID: {customer_id}.',
            'bill_reminder' => 'Reminder: Dear {customer_name}, your bill of ৳{amount} for {month} is due on {due_date}. Please pay to avoid disconnection.',
        ];
        foreach ($smsTemplates as $name => $message) {
            SmsTemplate::firstOrCreate(
                ['name' => $name],
                ['message' => $message]
            );
        }

        // ── Default Packages ─────────────────────────────
        if (Package::count() === 0) {
            $packages = [
                ['name' => 'Basic 10Mbps', 'speed' => '10 Mbps', 'monthly_price' => 500, 'download_speed' => 10, 'upload_speed' => 10],
                ['name' => 'Standard 20Mbps', 'speed' => '20 Mbps', 'monthly_price' => 800, 'download_speed' => 20, 'upload_speed' => 20],
                ['name' => 'Premium 50Mbps', 'speed' => '50 Mbps', 'monthly_price' => 1200, 'download_speed' => 50, 'upload_speed' => 50],
                ['name' => 'Ultra 100Mbps', 'speed' => '100 Mbps', 'monthly_price' => 2000, 'download_speed' => 100, 'upload_speed' => 100],
            ];
            foreach ($packages as $pkg) {
                Package::create($pkg);
            }
        }

        // ── Default Chart of Accounts (with hierarchy) ────
        if (Account::count() === 0) {
            $assets = Account::create(['name' => 'Assets', 'type' => 'asset', 'code' => '1000', 'is_system' => true, 'level' => 0]);
            $liabilities = Account::create(['name' => 'Liabilities', 'type' => 'liability', 'code' => '2000', 'is_system' => true, 'level' => 0]);
            $income = Account::create(['name' => 'Income', 'type' => 'income', 'code' => '4000', 'is_system' => true, 'level' => 0]);
            $expenses = Account::create(['name' => 'Expenses', 'type' => 'expense', 'code' => '5000', 'is_system' => true, 'level' => 0]);
            $equity = Account::create(['name' => 'Equity', 'type' => 'equity', 'code' => '3000', 'is_system' => true, 'level' => 0]);

            Account::create(['name' => 'Cash', 'type' => 'asset', 'code' => '1001', 'parent_id' => $assets->id, 'level' => 1, 'is_system' => true]);
            Account::create(['name' => 'Bank Account', 'type' => 'asset', 'code' => '1002', 'parent_id' => $assets->id, 'level' => 1, 'is_system' => true]);
            Account::create(['name' => 'bKash', 'type' => 'asset', 'code' => '1003', 'parent_id' => $assets->id, 'level' => 1, 'is_system' => true]);
            Account::create(['name' => 'Nagad', 'type' => 'asset', 'code' => '1004', 'parent_id' => $assets->id, 'level' => 1, 'is_system' => true]);
            Account::create(['name' => 'Accounts Receivable', 'type' => 'asset', 'code' => '1100', 'parent_id' => $assets->id, 'level' => 1, 'is_system' => true]);
            Account::create(['name' => 'Inventory', 'type' => 'asset', 'code' => '1200', 'parent_id' => $assets->id, 'level' => 1, 'is_system' => true]);
            Account::create(['name' => 'Accounts Payable', 'type' => 'liability', 'code' => '2001', 'parent_id' => $liabilities->id, 'level' => 1, 'is_system' => true]);
            Account::create(['name' => 'ISP Billing Revenue', 'type' => 'income', 'code' => '4001', 'parent_id' => $income->id, 'level' => 1, 'is_system' => true]);
            Account::create(['name' => 'Product Sales', 'type' => 'income', 'code' => '4002', 'parent_id' => $income->id, 'level' => 1, 'is_system' => true]);
            Account::create(['name' => 'Cost of Goods Sold', 'type' => 'expense', 'code' => '5001', 'parent_id' => $expenses->id, 'level' => 1, 'is_system' => true]);
            Account::create(['name' => 'Salary Expense', 'type' => 'expense', 'code' => '5002', 'parent_id' => $expenses->id, 'level' => 1]);
            Account::create(['name' => 'Utility Expense', 'type' => 'expense', 'code' => '5003', 'parent_id' => $expenses->id, 'level' => 1]);
            Account::create(['name' => 'Office Expense', 'type' => 'expense', 'code' => '5004', 'parent_id' => $expenses->id, 'level' => 1]);
            Account::create(['name' => 'Owner Equity', 'type' => 'equity', 'code' => '3001', 'parent_id' => $equity->id, 'level' => 1]);
            Account::create(['name' => 'Retained Earnings', 'type' => 'equity', 'code' => '3002', 'parent_id' => $equity->id, 'level' => 1]);
        }

        // ── Default Permissions (matching frontend modules) ──
        $modules = [
            'customers'         => ['view', 'create', 'edit', 'delete'],
            'billing'           => ['view', 'create', 'edit', 'delete'],
            'payments'          => ['view', 'create', 'edit', 'delete'],
            'merchant_payments' => ['view', 'create', 'edit', 'delete'],
            'tickets'           => ['view', 'create', 'edit', 'delete'],
            'sms'               => ['view', 'create', 'edit', 'delete'],
            'accounting'        => ['view', 'create', 'edit', 'delete'],
            'inventory'         => ['view', 'create', 'edit', 'delete'],
            'hr'                => ['view', 'create', 'edit', 'delete'],
            'supplier'          => ['view', 'create', 'edit', 'delete'],
            'reports'           => ['view', 'create', 'edit', 'delete'],
            'settings'          => ['view', 'create', 'edit', 'delete'],
            'users'             => ['view', 'create', 'edit', 'delete'],
            'roles'             => ['view', 'create', 'edit', 'delete'],
        ];

        foreach ($modules as $module => $actions) {
            foreach ($actions as $action) {
                Permission::firstOrCreate(
                    ['module' => $module, 'action' => $action],
                    ['description' => ucfirst($action) . ' ' . str_replace('_', ' ', $module)]
                );
            }
        }

        $this->command->info('Default data seeded!');
        $this->command->info('Admin #1 → username: admin / password: admin123');
        $this->command->info('Admin #2 → username: ismail / password: Admin@123');
        $this->command->info('System settings, SMS templates, roles, COA seeded.');
    }
}
