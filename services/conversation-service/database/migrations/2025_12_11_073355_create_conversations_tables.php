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
        // DB::statement("CREATE TYPE conversation_type AS ENUM ('direct', 'multi', 'group')");
        // DB::statement("CREATE TYPE conversation_status AS ENUM ('open', 'closed', 'pending')");
        // Note: Using text check constraints for compatibility and simplicity instead of Postgres ENUM types if strictly needed,
        // but explicit ENUMs are cleaner. I will use string columns with validations in app to keep migration portable or raw SQL for ENUMs.
        // The spec asked for ENUMs. I'll use simple strings with app-level validation to avoid raw SQL complexities for now,
        // OR standard check constraints. Let's stick to simple strings with defaults as typical in Laravel, or raw SQL if user strictly specified schema.
        // User spec said: CREATE TYPE conversation_type AS ENUM ...
        // So I will execute raw SQL for the types to match SPEC EXACTLY.

        // Only run Postgres specific ENUM creation if not using sqlite
        if (config('database.default') !== 'sqlite') {
            DB::statement("DO $$ BEGIN
                CREATE TYPE conversation_type AS ENUM ('direct', 'multi', 'group');
                EXCEPTION WHEN duplicate_object THEN null;
            END $$;");
        }

        if (config('database.default') !== 'sqlite') {
            DB::statement("DO $$ BEGIN
                CREATE TYPE conversation_status AS ENUM ('open', 'closed', 'pending');
                EXCEPTION WHEN duplicate_object THEN null;
            END $$;");
        }

        Schema::create('conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // We use raw SQL for the enum column definition to attach the type
            if (config('database.default') === 'sqlite') {
                $table->string('type')->default('direct');
                $table->string('status')->default('open');
            } else {
                $table->addColumn('conversation_type', 'type')->default('direct');
                $table->addColumn('conversation_status', 'status')->default('open');
            }

            $table->string('group_name')->nullable();
            $table->string('group_avatar')->nullable();
            $table->jsonb('group_metadata')->nullable();
            $table->timestampTz('last_message_at')->nullable();
            $table->timestampsTz();
        });

        Schema::create('conversation_participants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('conversation_id');
            $table->uuid('customer_id');
            $table->string('role')->default('member'); // owner, admin, member
            $table->timestampTz('joined_at')->useCurrent();
            $table->jsonb('metadata')->nullable();

            $table->foreign('conversation_id')->references('id')->on('conversations')->onDelete('cascade');
            $table->unique(['conversation_id', 'customer_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversation_participants');
        Schema::dropIfExists('conversations');

        DB::statement('DROP TYPE IF EXISTS conversation_type');
        DB::statement('DROP TYPE IF EXISTS conversation_status');
    }
};
