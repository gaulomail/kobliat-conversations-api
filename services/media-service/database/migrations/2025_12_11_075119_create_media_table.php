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
        Schema::create('media', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('owner_service'); // Service that owns this media (e.g., 'messaging-service')
            $table->string('filename')->nullable();
            $table->string('content_type')->nullable();
            $table->bigInteger('size')->nullable();
            $table->string('storage_key'); // Path in S3
            $table->text('preview_url')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->boolean('is_scanned')->default(false);
            $table->boolean('is_infected')->default(false);
            $table->timestampsTz();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
