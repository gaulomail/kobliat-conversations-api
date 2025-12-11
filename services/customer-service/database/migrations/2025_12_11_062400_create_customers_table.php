<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('external_id');
            $table->string('external_type')->default('whatsapp');
            $table->string('name')->nullable();
            $table->json('metadata')->default('{}');
            $table->timestampsTz();

            // Unique constraint on external_type and external_id
            $table->unique(['external_type', 'external_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
