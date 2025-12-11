#!/bin/bash

# API Gateway Endpoint Test
# Tests all available endpoints through the API Gateway

set -e

API_KEY="kobliat-secret-key"
BASE_URL="http://localhost:8000/api/v1"

echo "========================================="
echo "API Gateway Endpoint Test"
echo "========================================="
echo ""

# Test 1: Create Customer
echo "1. Testing POST /customers..."
CUSTOMER_RESPONSE=$(curl -s -X POST "$BASE_URL/customers" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"external_id":"test_gateway_001","external_type":"whatsapp","name":"Gateway Test User"}')

CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | jq -r '.id')
echo "   ✓ Customer created: $CUSTOMER_ID"

# Test 2: Get Customer
echo "2. Testing GET /customers/{id}..."
curl -s "$BASE_URL/customers/$CUSTOMER_ID" \
  -H "X-API-Key: $API_KEY" | jq -r '.name' > /dev/null
echo "   ✓ Get customer works"

# Test 3: Create Secondary Customer
CUSTOMER2_RESPONSE=$(curl -s -X POST "$BASE_URL/customers" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"external_id":"test_gateway_002","external_type":"whatsapp","name":"Gateway Test User 2"}')

CUSTOMER2_ID=$(echo $CUSTOMER2_RESPONSE | jq -r '.id')
echo "   ✓ Secondary customer created: $CUSTOMER2_ID"

# Test 4: List Conversations
echo "3. Testing GET /conversations..."
curl -s "$BASE_URL/conversations" \
  -H "X-API-Key: $API_KEY" | jq -r '.total' > /dev/null
echo "   ✓ List conversations works"

# Test 5: Create Conversation
echo "4. Testing POST /conversations..."
CONVERSATION_RESPONSE=$(curl -s -X POST "$BASE_URL/conversations" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"type\":\"direct\",\"participants\":[\"$CUSTOMER_ID\",\"$CUSTOMER2_ID\"]}")

CONVERSATION_ID=$(echo $CONVERSATION_RESPONSE | jq -r '.id')
echo "   ✓ Conversation created: $CONVERSATION_ID"

# Test 6: Get Conversation
echo "5. Testing GET /conversations/{id}..."
curl -s "$BASE_URL/conversations/$CONVERSATION_ID" \
  -H "X-API-Key: $API_KEY" | jq -r '.id' > /dev/null
echo "   ✓ Get conversation works"

# Test 7: Get Conversation Details (Aggregated)
echo "6. Testing GET /conversations/{id}/details..."
curl -s "$BASE_URL/conversations/$CONVERSATION_ID/details" \
  -H "X-API-Key: $API_KEY" | jq -r '.conversation.id' > /dev/null
echo "   ✓ Get conversation details works"

# Test 8: Send Message
echo "7. Testing POST /messages..."
MESSAGE_RESPONSE=$(curl -s -X POST "$BASE_URL/messages" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"conversation_id\":\"$CONVERSATION_ID\",\"direction\":\"outbound\",\"body\":\"Test message via gateway\",\"sender_customer_id\":\"$CUSTOMER_ID\"}")

MESSAGE_ID=$(echo $MESSAGE_RESPONSE | jq -r '.id')
echo "   ✓ Message sent: $MESSAGE_ID"

# Test 9: Get Messages
echo "8. Testing GET /conversations/{id}/messages..."
curl -s "$BASE_URL/conversations/$CONVERSATION_ID/messages" \
  -H "X-API-Key: $API_KEY" | jq -r '.total' > /dev/null
echo "   ✓ Get messages works"

# Test 10: Update Message
echo "9. Testing PUT /messages/{id}..."
curl -s -X PUT "$BASE_URL/messages/$MESSAGE_ID" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"body":"Updated message via gateway"}' | jq -r '.body' > /dev/null
echo "   ✓ Update message works"

# Test 11: Get Logs
echo "10. Testing GET /logs..."
LOGS_COUNT=$(curl -s "$BASE_URL/logs" \
  -H "X-API-Key: $API_KEY" | jq -r '.total')
echo "   ✓ Get logs works (Total: $LOGS_COUNT)"

echo ""
echo "========================================="
echo "✓ All API Gateway endpoints working!"
echo "========================================="
echo ""
echo "Test IDs for reference:"
echo "  Customer 1: $CUSTOMER_ID"
echo "  Customer 2: $CUSTOMER2_ID"
echo "  Conversation: $CONVERSATION_ID"
echo "  Message: $MESSAGE_ID"
echo ""
echo "View logs at: http://localhost:5173/logs"
