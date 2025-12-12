<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("DO $$ BEGIN
                CREATE TYPE message_direction AS ENUM ('inbound', 'outbound', 'system');
                EXCEPTION WHEN duplicate_object THEN null;
            END $$;");
        }

        Schema::create('messages', function (Blueprint $table) use ($driver) {
            $table->uuid('id')->primary();
            $table->uuid('conversation_id')->index();
            $table->uuid('sender_customer_id')->nullable(); // Null for system/bot

            if ($driver === 'pgsql') {
                $table->addColumn('direction', 'message_direction');
            } else {
                $table->enum('direction', ['inbound', 'outbound', 'system']);
            }

            $table->string('channel')->default('whatsapp');
            $table->string('external_message_id')->nullable();
            $table->text('body')->nullable();
            $table->string('content_type')->default('text');
            $table->uuid('media_id')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestampTz('sent_at')->nullable();
            $table->boolean('is_processed')->default(false);
            $table->timestampsTz();

            $table->index('sent_at');
        });

        Schema::create('message_history', function (Blueprint $table) use ($driver) {
            $table->uuid('id')->primary();
            $table->uuid('message_id');
            $table->uuid('conversation_id');
            $table->uuid('customer_id')->nullable(); // Who edited it

            if ($driver === 'pgsql') {
                $table->addColumn('direction', 'message_direction');
            } else {
                $table->enum('direction', ['inbound', 'outbound', 'system']);
            }

            $table->text('body')->nullable();
            $table->text('previous_body')->nullable();
            $table->timestampTz('edited_at')->useCurrent();
            $table->jsonb('metadata')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('message_history');
        Schema::dropIfExists('messages');
        DB::statement('DROP TYPE IF EXISTS message_direction');
    }
};
