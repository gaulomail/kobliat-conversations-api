#!/bin/bash

# Kobliat Conversations - SQLite to MySQL Migration Script
# This script backs up data from SQLite, configures services to use MySQL,
# migrates the schemas, and restores the data.

MODELS_API_GATEWAY="ApiLog"
MODELS_CONVERSATION="Conversation,ConversationParticipant"
MODELS_CUSTOMER="Customer"
MODELS_INBOUND="InboundWebhook"
MODELS_MEDIA="Media"
MODELS_MESSAGING="Message,MessageHistory"

# Format: "directory:db_name:Model1,Model2"
SERVICES=(
    "services/api-gateway:kobliat_gateway:$MODELS_API_GATEWAY"
    "services/conversation-service:kobliat_conversations:$MODELS_CONVERSATION"
    "services/customer-service:kobliat_customers:$MODELS_CUSTOMER"
    "services/inbound-gateway:kobliat_inbound:$MODELS_INBOUND"
    "services/media-service:kobliat_media:$MODELS_MEDIA"
    "services/messaging-service:kobliat_messaging:$MODELS_MESSAGING"
    "services/chat-simulator:kobliat_simulator:"
)

echo "========================================="
echo "   Kobliat Migration: SQLite -> MySQL    "
echo "========================================="

# 1. Backup Phase
echo ""
echo "[1/5] Backing up data from SQLite..."
for entry in "${SERVICES[@]}"; do
    IFS=':' read -r dir db models_str <<< "$entry"
    if [ -n "$models_str" ]; then
        echo "   Processing $dir..."
        cd "$dir" || exit
        IFS=',' read -r -a models <<< "$models_str"
        for model in "${models[@]}"; do
            echo "      - Backing up Model: $model"
            # Clear config first to avoid stale cache issues
            php artisan config:clear > /dev/null
            
            php artisan tinker --execute="
                try {
                    config(['database.default' => 'sqlite']); 
                    config(['database.connections.sqlite.database' => database_path('database.sqlite')]);
                    \$table = (new \App\Models\\$model)->getTable();
                    \$path = storage_path('app/backup_' . \$table . '.json');
                    file_put_contents(\$path, \Illuminate\Support\Facades\DB::table(\$table)->get()->toJson());
                    echo '        Saved to ' . \$path . PHP_EOL;
                } catch (\Exception \$e) { echo '        Error: '. \$e->getMessage() . PHP_EOL; }
            "
        done
        cd - > /dev/null || exit
    fi
done

# 2. MySQL Provisioning
echo ""
echo "[2/5] Creating MySQL Databases..."
for entry in "${SERVICES[@]}"; do
    IFS=':' read -r dir db models_str <<< "$entry"
    # echo "   Creating $db..."
    mysql -u root -p'Blessmore@1' -e "CREATE DATABASE IF NOT EXISTS $db;"
done
echo "   All databases created."

# 3. Config Update
echo ""
echo "[3/5] Updating .env files..."
for entry in "${SERVICES[@]}"; do
    IFS=':' read -r dir db models_str <<< "$entry"
    # echo "   Updating $dir/.env..."
    ENV_FILE="$dir/.env"
    
    # Remove existing config lines (commented or not) to avoid issues
    sed -i '' '/DB_CONNECTION/d' "$ENV_FILE"
    sed -i '' '/DB_HOST/d' "$ENV_FILE"
    sed -i '' '/DB_PORT/d' "$ENV_FILE"
    sed -i '' '/DB_DATABASE/d' "$ENV_FILE"
    sed -i '' '/DB_USERNAME/d' "$ENV_FILE"
    sed -i '' '/DB_PASSWORD/d' "$ENV_FILE"
    sed -i '' '/DB_FOREIGN_KEYS/d' "$ENV_FILE"

    # Append new clean config
    echo "" >> "$ENV_FILE"
    echo "DB_CONNECTION=mysql" >> "$ENV_FILE"
    echo "DB_HOST=127.0.0.1" >> "$ENV_FILE"
    echo "DB_PORT=3306" >> "$ENV_FILE"
    echo "DB_DATABASE=$db" >> "$ENV_FILE"
    echo "DB_USERNAME=root" >> "$ENV_FILE"
    echo "DB_PASSWORD=Blessmore@1" >> "$ENV_FILE"

    # Clear config cache to ensure new env vars are picked up
    cd "$dir" || exit
    php artisan config:clear > /dev/null
    cd - > /dev/null || exit
done
echo "   Configurations updated."

# 4. Migration
echo ""
echo "[4/5] Running Migrations on MySQL..."
for entry in "${SERVICES[@]}"; do
    IFS=':' read -r dir db models_str <<< "$entry"
    echo "   Migrating $dir..."
    cd "$dir" || exit
    # Run migration
    php artisan migrate:fresh --force
    cd - > /dev/null || exit
done

# 5. Restore Phase
echo ""
echo "[5/5] Restoring Data to MySQL..."
for entry in "${SERVICES[@]}"; do
    IFS=':' read -r dir db models_str <<< "$entry"
    if [ -n "$models_str" ]; then
        echo "   Restoring $dir..."
        cd "$dir" || exit
        IFS=',' read -r -a models <<< "$models_str"
        for model in "${models[@]}"; do
            echo "      - Restoring Model: $model"
            php artisan tinker --execute="
                try {
                    \$table = (new \App\Models\\$model)->getTable();
                    \$path = storage_path('app/backup_' . \$table . '.json');
                    if (file_exists(\$path)) {
                        \$json = file_get_contents(\$path);
                        \$data = json_decode(\$json, true);
                        if (!empty(\$data) && is_array(\$data)) {
                             \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');
                             foreach(array_chunk(\$data, 100) as \$chunk) {
                                \Illuminate\Support\Facades\DB::table(\$table)->insert(\$chunk);
                             }
                             \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');
                             echo '        Restored ' . count(\$data) . ' records to ' . \$table . PHP_EOL;
                        } else {
                             echo '        No data to restore.' . PHP_EOL;
                        }
                    } else {
                        echo '        Backup file not found.' . PHP_EOL;
                    }
                } catch (\Exception \$e) { echo '        Error: '. \$e->getMessage() . PHP_EOL; }
            "
        done
        cd - > /dev/null || exit
    fi
done

echo ""
echo "Migration Complete! All services are now running on MySQL."
