<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('designations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('employees', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->string('employee_id')->unique();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('nid')->nullable();
            $table->uuid('designation_id')->nullable()->index();
            $table->date('joining_date')->nullable();
            $table->decimal('salary', 12, 2)->default(0);
            $table->string('address')->nullable();
            $table->string('photo_url')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('attendance', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->uuid('employee_id')->index();
            $table->date('date');
            $table->string('status')->default('present');
            $table->time('check_in')->nullable();
            $table->time('check_out')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['employee_id', 'date']);
        });

        Schema::create('loans', function (Blueprint $table) {
            $table->uuid('tenant_id')->nullable()->index();
            $table->uuid('id')->primary();
            $table->uuid('employee_id')->index();
            $table->decimal('amount', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->decimal('monthly_deduction', 12, 2)->default(0);
            $table->date('approved_date')->nullable();
            $table->string('status')->default('active');
            $table->text('reason')->nullable();
            $table->timestamps();
        });

        Schema::create('salary_sheets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id')->index();
            $table->string('month');
            $table->decimal('basic_salary', 12, 2)->default(0);
            $table->decimal('house_rent', 12, 2)->default(0);
            $table->decimal('medical', 12, 2)->default(0);
            $table->decimal('conveyance', 12, 2)->default(0);
            $table->decimal('other_allowance', 12, 2)->default(0);
            $table->decimal('bonus', 12, 2)->default(0);
            $table->decimal('deduction', 12, 2)->default(0);
            $table->decimal('loan_deduction', 12, 2)->default(0);
            $table->decimal('pf_deduction', 12, 2)->default(0);
            $table->decimal('savings_deduction', 12, 2)->default(0);
            $table->decimal('net_salary', 12, 2)->default(0);
            $table->string('payment_method')->default('cash');
            $table->string('status')->default('pending');
            $table->date('paid_date')->nullable();
            $table->timestamps();
            $table->unique(['employee_id', 'month']);
        });

        Schema::create('employee_salary_structure', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->uuid('employee_id')->index();
            $table->decimal('basic_salary', 12, 2)->default(0);
            $table->decimal('house_rent', 12, 2)->default(0);
            $table->decimal('medical', 12, 2)->default(0);
            $table->decimal('conveyance', 12, 2)->default(0);
            $table->decimal('other_allowance', 12, 2)->default(0);
            $table->date('effective_from');
            $table->timestamps();
        });

        Schema::create('employee_education', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id')->index();
            $table->string('degree');
            $table->string('institution');
            $table->string('board_university')->nullable();
            $table->string('passing_year')->nullable();
            $table->string('result')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('employee_experience', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id')->index();
            $table->string('company_name');
            $table->string('designation');
            $table->date('from_date')->nullable();
            $table->date('to_date')->nullable();
            $table->text('responsibilities')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('employee_emergency_contacts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id')->index();
            $table->string('contact_name');
            $table->string('relation');
            $table->string('phone');
            $table->string('address')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('employee_provident_fund', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->uuid('employee_id')->index();
            $table->string('type')->default('contribution');
            $table->decimal('amount', 12, 2)->default(0);
            $table->decimal('employee_share', 12, 2)->default(0);
            $table->decimal('employer_share', 12, 2)->default(0);
            $table->date('date');
            $table->text('description')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('employee_savings_fund', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->uuid('employee_id')->index();
            $table->string('type')->default('deposit');
            $table->decimal('amount', 12, 2)->default(0);
            $table->date('date');
            $table->text('description')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_savings_fund');
        Schema::dropIfExists('employee_provident_fund');
        Schema::dropIfExists('employee_emergency_contacts');
        Schema::dropIfExists('employee_experience');
        Schema::dropIfExists('employee_education');
        Schema::dropIfExists('employee_salary_structure');
        Schema::dropIfExists('salary_sheets');
        Schema::dropIfExists('loans');
        Schema::dropIfExists('attendance');
        Schema::dropIfExists('employees');
        Schema::dropIfExists('designations');
    }
};
