#!/bin/bash
set -e

# Create multiple databases
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE customer_db;
    CREATE DATABASE conversation_db;
    CREATE DATABASE messaging_db;
    CREATE DATABASE media_db;
    CREATE DATABASE gateway_db;
EOSQL

echo "Multiple databases created successfully"
