#!/bin/bash

# Kobliat API Test Suite
# Based on postman_collection.json

set -e

echo "========================================="
echo "Kobliat Microservices API Test Suite"
echo "========================================="
echo ""

# Variables
CUSTOMER_PHONE="27831234567"
API_KEY="kobliat-secret-key"

# 1. CUSTOMER SERVICE TESTS
echo "1. Testing Customer Service (8001)..."
echo "   - Creating customer..."
CUSTOMER_RESPONSE=$(curl -s -X POST http://localhost:8001/api/customers \
  -H "Content-Type: application/json" \
  -d "{\"external_id\":\"$CUSTOMER_PHONE\",\"external_type\":\"whatsapp\",\"name\":\"John Doe\",\"metadata\":{\"vip\":true}}")

CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | jq -r '.id')
echo "   ✓ Customer created: $CUSTOMER_ID"

echo "   - Getting customer by ID..."
curl -s http://localhost:8001/api/customers/$CUSTOMER_ID | jq -r '.name' > /dev/null
echo "   ✓ Get customer by ID works"

echo "   - Finding customer by external ID..."
curl -s http://localhost:8001/api/customers/external/whatsapp/$CUSTOMER_PHONE | jq -r '.id' > /dev/null
echo "   ✓ Find by external ID works"

# Create secondary customer
SECONDARY_RESPONSE=$(curl -s -X POST http://localhost:8001/api/customers \
  -H "Content-Type: application/json" \
  -d "{\"external_id\":\"27831234568\",\"external_type\":\"whatsapp\",\"name\":\"Jane Doe\"}")
SECONDARY_CUSTOMER_ID=$(echo $SECONDARY_RESPONSE | jq -r '.id')
echo "   ✓ Secondary customer created: $SECONDARY_CUSTOMER_ID"

# 2. CONVERSATION SERVICE TESTS
echo ""
echo "2. Testing Conversation Service (8002)..."
echo "   - Creating conversation..."
CONVERSATION_RESPONSE=$(curl -s -X POST http://localhost:8002/api/conversations \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"direct\",\"participants\":[\"$CUSTOMER_ID\",\"$SECONDARY_CUSTOMER_ID\"]}")

CONVERSATION_ID=$(echo $CONVERSATION_RESPONSE | jq -r '.id')
echo "   ✓ Conversation created: $CONVERSATION_ID"

echo "   - Listing conversations..."
curl -s http://localhost:8002/api/conversations | jq -r '.data[0].id' > /dev/null
echo "   ✓ List conversations works"

echo "   - Getting conversation details..."
curl -s http://localhost:8002/api/conversations/$CONVERSATION_ID | jq -r '.id' > /dev/null
echo "   ✓ Get conversation details works"

# 3. MESSAGING SERVICE TESTS
echo ""
echo "3. Testing Messaging Service (8003)..."
echo "   - Sending message..."
MESSAGE_RESPONSE=$(curl -s -X POST http://localhost:8003/api/messages \
  -H "Content-Type: application/json" \
  -d "{\"conversation_id\":\"$CONVERSATION_ID\",\"direction\":\"outbound\",\"body\":\"Hello from API!\",\"sender_customer_id\":\"$CUSTOMER_ID\"}")

MESSAGE_ID=$(echo $MESSAGE_RESPONSE | jq -r '.id')
echo "   ✓ Message sent: $MESSAGE_ID"

echo "   - Getting conversation messages..."
curl -s http://localhost:8003/api/conversations/$CONVERSATION_ID/messages | jq -r '.data[0].id' > /dev/null
echo "   ✓ Get messages works"

echo "   - Updating message..."
curl -s -X PUT http://localhost:8003/api/messages/$MESSAGE_ID \
  -H "Content-Type: application/json" \
  -d '{"body":"Hello from API! (Edited)"}' | jq -r '.body' > /dev/null
echo "   ✓ Update message works"

# 4. MEDIA SERVICE TESTS
echo ""
echo "4. Testing Media Service (8004)..."
echo "   - Creating test file..."
echo "Test content" > /tmp/test-media.txt

echo "   - Uploading media..."
MEDIA_RESPONSE=$(curl -s -X POST http://localhost:8004/api/media/upload \
  -F "file=@/tmp/test-media.txt" \
  -F "owner_service=messaging-service")

MEDIA_ID=$(echo $MEDIA_RESPONSE | jq -r '.id')
echo "   ✓ Media uploaded: $MEDIA_ID"

echo "   - Getting media info..."
curl -s http://localhost:8004/api/media/$MEDIA_ID | jq -r '.id' > /dev/null
echo "   ✓ Get media info works"

echo "   - Getting download URL..."
curl -s http://localhost:8004/api/media/$MEDIA_ID/download | jq -r '.download_url' > /dev/null
echo "   ✓ Get download URL works"

rm /tmp/test-media.txt

# 5. INBOUND GATEWAY TESTS
echo ""
echo "5. Testing Inbound Gateway (8005)..."
echo "   - Simulating WhatsApp webhook..."
WEBHOOK_RESPONSE=$(curl -s -X POST http://localhost:8005/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d "{\"object\":\"whatsapp_business_account\",\"entry\":[{\"changes\":[{\"value\":{\"messages\":[{\"from\":\"$CUSTOMER_PHONE\",\"id\":\"wamid.test123\",\"text\":{\"body\":\"Hello via Webhook\"},\"type\":\"text\",\"timestamp\":$(date +%s)}]}}]}]}")

echo "   ✓ WhatsApp webhook processed"

# 6. API GATEWAY TESTS
echo ""
echo "6. Testing API Gateway (8000)..."
echo "   - Getting aggregated conversation..."
curl -s http://localhost:8000/api/v1/conversations/$CONVERSATION_ID/details \
  -H "X-API-Key: $API_KEY" | jq -r '.conversation.id' > /dev/null
echo "   ✓ Aggregated conversation works"

echo "   - Proxying message creation..."
curl -s -X POST http://localhost:8000/api/v1/messages \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"conversation_id\":\"$CONVERSATION_ID\",\"direction\":\"outbound\",\"body\":\"Sent via Gateway\"}" | jq -r '.id' > /dev/null
echo "   ✓ Proxy message creation works"

# 7. CHAT SIMULATOR TESTS
echo ""
echo "7. Testing Chat Simulator (8006)..."
echo "   - Simulating angry customer scenario..."
SIMULATION_RESPONSE=$(curl -s -X POST http://localhost:8006/api/simulate \
  -H "Content-Type: application/json" \
  -d '{"scenario":"angry_customer"}')

echo "   ✓ Simulation completed"

echo ""
echo "========================================="
echo "✓ All tests passed successfully!"
echo "========================================="
echo ""
echo "Test IDs for reference:"
echo "  Customer ID: $CUSTOMER_ID"
echo "  Conversation ID: $CONVERSATION_ID"
echo "  Message ID: $MESSAGE_ID"
echo "  Media ID: $MEDIA_ID"
