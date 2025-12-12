# Kobliat Conversations - SQLite to MySQL Migration Script (Windows PowerShell)

$MODELS_API_GATEWAY = "ApiLog"
$MODELS_CONVERSATION = "Conversation,ConversationParticipant"
$MODELS_CUSTOMER = "Customer"
$MODELS_INBOUND = "InboundWebhook"
$MODELS_MEDIA = "Media"
$MODELS_MESSAGING = "Message,MessageHistory"

$SERVICES = @(
    "services/api-gateway:kobliat_gateway:$MODELS_API_GATEWAY",
    "services/conversation-service:kobliat_conversations:$MODELS_CONVERSATION",
    "services/customer-service:kobliat_customers:$MODELS_CUSTOMER",
    "services/inbound-gateway:kobliat_inbound:$MODELS_INBOUND",
    "services/media-service:kobliat_media:$MODELS_MEDIA",
    "services/messaging-service:kobliat_messaging:$MODELS_MESSAGING",
    "services/chat-simulator:kobliat_simulator:"
)

Write-Host "========================================="
Write-Host "   Kobliat Migration: SQLite -> MySQL    "
Write-Host "========================================="

# 1. Backup Phase
Write-Host ""
Write-Host "[1/5] Backing up data from SQLite..."
foreach ($entry in $SERVICES) {
    $parts = $entry -split ":"
    $dir = $parts[0]
    $db = $parts[1]
    $models_str = $parts[2]

    if (-not [string]::IsNullOrEmpty($models_str)) {
        Write-Host "   Processing $dir..."
        Push-Location $dir
        
        # Clear config cache first
        php artisan config:clear | Out-Null
        
        $models = $models_str -split ","
        foreach ($model in $models) {
            Write-Host "      - Backing up Model: $model"
            
            $code = "
                try {
                    config(['database.default' => 'sqlite']);
                    config(['database.connections.sqlite.database' => database_path('database.sqlite')]);
                    `$table = (new \App\Models\\$model)->getTable();
                    `$path = storage_path('app/backup_' . `$table . '.json');
                    file_put_contents(`$path, \Illuminate\Support\Facades\DB::table(`$table)->get()->toJson());
                    echo '        Saved to ' . `$path . PHP_EOL;
                } catch (\Exception `$e) { echo '        Error: '. `$e->getMessage() . PHP_EOL; }
            "
            
            $code | php artisan tinker
        }
        Pop-Location
    }
}

# 2. MySQL Provisioning
Write-Host ""
Write-Host "[2/5] Creating MySQL Databases..."
foreach ($entry in $SERVICES) {
    $parts = $entry -split ":"
    $db = $parts[1]
    # Use -p"Password" for Windows compatibility
    mysql -u root -p"Blessmore@1" -e "CREATE DATABASE IF NOT EXISTS $db;"
}
Write-Host "   All databases created."

# 3. Config Update
Write-Host ""
Write-Host "[3/5] Updating .env files..."
foreach ($entry in $SERVICES) {
    $parts = $entry -split ":"
    $dir = $parts[0]
    $db = $parts[1]
    
    $envPath = "$dir/.env"
    if (Test-Path $envPath) {
        $content = Get-Content $envPath
        
        # Filter out existing DB_ lines (commented or not)
        $newContent = $content | Where-Object { 
            $_ -notmatch "^#?\s*DB_CONNECTION" -and
            $_ -notmatch "^#?\s*DB_HOST" -and
            $_ -notmatch "^#?\s*DB_PORT" -and
            $_ -notmatch "^#?\s*DB_DATABASE" -and
            $_ -notmatch "^#?\s*DB_USERNAME" -and
            $_ -notmatch "^#?\s*DB_PASSWORD" -and
            $_ -notmatch "^#?\s*DB_FOREIGN_KEYS"
        }
        
        $newContent += ""
        $newContent += "DB_CONNECTION=mysql"
        $newContent += "DB_HOST=127.0.0.1"
        $newContent += "DB_PORT=3306"
        $newContent += "DB_DATABASE=$db"
        $newContent += "DB_USERNAME=root"
        $newContent += "DB_PASSWORD=Blessmore@1"
        
        $newContent | Set-Content $envPath -Encoding UTF8
        
        # Clear Config
        Push-Location $dir
        php artisan config:clear | Out-Null
        Pop-Location
    }
}
Write-Host "   Configurations updated."

# 4. Migration
Write-Host ""
Write-Host "[4/5] Running Migrations on MySQL..."
foreach ($entry in $SERVICES) {
    $parts = $entry -split ":"
    $dir = $parts[0]
    Write-Host "   Migrating $dir..."
    Push-Location $dir
    php artisan migrate:fresh --force
    Pop-Location
}

# 5. Restore Phase
Write-Host ""
Write-Host "[5/5] Restoring Data to MySQL..."
foreach ($entry in $SERVICES) {
    $parts = $entry -split ":"
    $dir = $parts[0]
    $models_str = $parts[2]

    if (-not [string]::IsNullOrEmpty($models_str)) {
        Write-Host "   Restoring $dir..."
        Push-Location $dir
        $models = $models_str -split ","
        foreach ($model in $models) {
            Write-Host "      - Restoring Model: $model"
            $code = "
                try {
                    `$table = (new \App\Models\\$model)->getTable();
                    `$path = storage_path('app/backup_' . `$table . '.json');
                    if (file_exists(`$path)) {
                        `$json = file_get_contents(`$path);
                        `$data = json_decode(`$json, true);
                        if (!empty(`$data) && is_array(`$data)) {
                             \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');
                             foreach(array_chunk(`$data, 100) as `$chunk) {
                                \Illuminate\Support\Facades\DB::table(`$table)->insert(`$chunk);
                             }
                             \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');
                             echo '        Restored ' . count(`$data) . ' records to ' . `$table . PHP_EOL;
                        } else {
                             echo '        No data to restore.' . PHP_EOL;
                        }
                    } else {
                        echo '        Backup file not found.' . PHP_EOL;
                    }
                } catch (\Exception `$e) { echo '        Error: '. `$e->getMessage() . PHP_EOL; }
            "
            $code | php artisan tinker
        }
        Pop-Location
    }
}

Write-Host ""
Write-Host "Migration Complete! All services are now running on MySQL."
