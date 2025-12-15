#!/bin/bash
set -e

# Create multiple databases
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE kobliat_customers_db;
    CREATE DATABASE kobliat_conversation_db;
    CREATE DATABASE kobliat_messaging_db;
    CREATE DATABASE kobliat_media_db;
    CREATE DATABASE kobliat_gateway_db;
EOSQL

echo "Multiple databases created successfully"
