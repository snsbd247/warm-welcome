<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('network_nodes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index();
            $table->string('name');
            $table->string('type')->default('onu');
            $table->double('lat');
            $table->double('lng');
            $table->uuid('parent_id')->nullable();
            $table->string('status')->default('online');
            $table->uuid('device_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'type']);
        });

        Schema::create('network_links', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index();
            $table->uuid('from_node_id')->index();
            $table->uuid('to_node_id')->index();
            $table->string('link_type')->default('fiber');
            $table->string('label')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('network_links');
        Schema::dropIfExists('network_nodes');
    }
};
