#!/bin/bash
services=(
    "services/api-gateway:kobliat_gateway"
    "services/conversation-service:kobliat_conversations"
    "services/customer-service:kobliat_customers"
    "services/inbound-gateway:kobliat_inbound"
    "services/media-service:kobliat_media"
    "services/messaging-service:kobliat_messaging"
    "services/chat-simulator:kobliat_simulator"
)

for entry in "${services[@]}"; do
    IFS=':' read -r dir db <<< "$entry"
    file="$dir/.env.example"
    if [ -f "$file" ]; then
        echo "Updating $file..."
        
        # Remove old DB Config
        sed -i '' '/DB_CONNECTION/d' "$file"
        sed -i '' '/DB_HOST/d' "$file"
        sed -i '' '/DB_PORT/d' "$file"
        sed -i '' '/DB_DATABASE/d' "$file"
        sed -i '' '/DB_USERNAME/d' "$file"
        sed -i '' '/DB_PASSWORD/d' "$file"
        sed -i '' '/DB_FOREIGN_KEYS/d' "$file"

        # Append New
        echo "" >> "$file"
        echo "DB_CONNECTION=mysql" >> "$file"
        echo "DB_HOST=127.0.0.1" >> "$file"
        echo "DB_PORT=3306" >> "$file"
        echo "DB_DATABASE=$db" >> "$file"
        echo "DB_USERNAME=root" >> "$file"
        echo "DB_PASSWORD=" >> "$file"
    else
        echo "Warning: $file not found"
    fi
done
echo "All .env.example files updated."
