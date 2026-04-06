<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
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

        Schema::create('plan_modules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('plan_id')->index();
            $table->uuid('module_id')->index();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['plan_id', 'module_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_modules');
        Schema::dropIfExists('modules');
    }
};
