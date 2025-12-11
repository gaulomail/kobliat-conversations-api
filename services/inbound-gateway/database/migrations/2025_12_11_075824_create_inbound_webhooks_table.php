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
        Schema::create('inbound_webhooks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('provider'); // whatsapp, slack
            $table->string('provider_message_id');
            $table->jsonb('headers')->nullable();
            $table->jsonb('raw_payload');
            $table->boolean('is_processed')->default(false);
            $table->timestampTz('received_at')->useCurrent();
            $table->timestampsTz();

            // Idempotency constraint
            $table->unique(['provider', 'provider_message_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inbound_webhooks');
    }
};
