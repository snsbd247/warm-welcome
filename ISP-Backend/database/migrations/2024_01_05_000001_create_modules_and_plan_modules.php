<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ── Modules registry ─────────────────────────────────
        if (!Schema::hasTable('modules')) {
            Schema::create('modules', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name');
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->string('icon')->nullable();
                $table->boolean('is_core')->default(false);
                $table->boolean('is_active')->default(true);
                $table->integer('sort_order')->default(0);
                $table->timestamps();
            });
        }

        // ── Plan-Module mapping ──────────────────────────────
        if (!Schema::hasTable('plan_modules')) {
            Schema::create('plan_modules', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('plan_id')->index();
                $table->uuid('module_id')->index();
                $table->timestamp('created_at')->useCurrent();

                $table->unique(['plan_id', 'module_id']);
                $table->foreign('plan_id')->references('id')->on('saas_plans')->onDelete('cascade');
                $table->foreign('module_id')->references('id')->on('modules')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_modules');
        Schema::dropIfExists('modules');
    }
};
