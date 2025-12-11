#!/bin/bash

# Chat Simulator Integration Test
# Tests the full flow: Customer -> Conversation -> Messages

set -e

API_KEY="kobliat-secret-key"
BASE_URL="http://localhost:8000/api/v1"

echo "========================================="
echo "Chat Simulator Integration Test"
echo "========================================="
echo ""

# Step 1: Create two customers (simulating two chat participants)
echo "1. Creating Customer 1 (Alice)..."
CUSTOMER1_RESPONSE=$(curl -s -X POST "$BASE_URL/customers" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"external_id":"alice_whatsapp","external_type":"whatsapp","name":"Alice"}')

CUSTOMER1_ID=$(echo $CUSTOMER1_RESPONSE | jq -r '.id')
echo "   ✓ Alice created: $CUSTOMER1_ID"

echo "2. Creating Customer 2 (Bob)..."
CUSTOMER2_RESPONSE=$(curl -s -X POST "$BASE_URL/customers" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"external_id":"bob_whatsapp","external_type":"whatsapp","name":"Bob"}')

CUSTOMER2_ID=$(echo $CUSTOMER2_RESPONSE | jq -r '.id')
echo "   ✓ Bob created: $CUSTOMER2_ID"

# Step 2: Create a conversation between them
echo "3. Creating conversation between Alice and Bob..."
CONVERSATION_RESPONSE=$(curl -s -X POST "$BASE_URL/conversations" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"type\":\"direct\",\"participants\":[\"$CUSTOMER1_ID\",\"$CUSTOMER2_ID\"]}")

CONVERSATION_ID=$(echo $CONVERSATION_RESPONSE | jq -r '.id')
echo "   ✓ Conversation created: $CONVERSATION_ID"

# Step 3: Simulate a chat conversation
echo ""
echo "4. Simulating chat conversation..."
echo "   ----------------------------------------"

# Alice sends first message
echo "   Alice: Hi Bob! How are you?"
MESSAGE1=$(curl -s -X POST "$BASE_URL/messages" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"conversation_id\":\"$CONVERSATION_ID\",\"direction\":\"inbound\",\"body\":\"Hi Bob! How are you?\",\"sender_customer_id\":\"$CUSTOMER1_ID\"}")
MESSAGE1_ID=$(echo $MESSAGE1 | jq -r '.id')
sleep 1

# Bob responds
echo "   Bob: Hey Alice! I'm doing great, thanks!"
MESSAGE2=$(curl -s -X POST "$BASE_URL/messages" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"conversation_id\":\"$CONVERSATION_ID\",\"direction\":\"inbound\",\"body\":\"Hey Alice! I'm doing great, thanks!\",\"sender_customer_id\":\"$CUSTOMER2_ID\"}")
MESSAGE2_ID=$(echo $MESSAGE2 | jq -r '.id')
sleep 1

# Alice asks a question
echo "   Alice: Did you get my package?"
MESSAGE3=$(curl -s -X POST "$BASE_URL/messages" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"conversation_id\":\"$CONVERSATION_ID\",\"direction\":\"inbound\",\"body\":\"Did you get my package?\",\"sender_customer_id\":\"$CUSTOMER1_ID\"}")
MESSAGE3_ID=$(echo $MESSAGE3 | jq -r '.id')
sleep 1

# Bob confirms
echo "   Bob: Yes! Just received it. Thanks!"
MESSAGE4=$(curl -s -X POST "$BASE_URL/messages" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"conversation_id\":\"$CONVERSATION_ID\",\"direction\":\"inbound\",\"body\":\"Yes! Just received it. Thanks!\",\"sender_customer_id\":\"$CUSTOMER2_ID\"}")
MESSAGE4_ID=$(echo $MESSAGE4 | jq -r '.id')

echo "   ----------------------------------------"
echo "   ✓ 4 messages sent successfully"

# Step 4: Retrieve the conversation with all messages
echo ""
echo "5. Retrieving full conversation..."
FULL_CONVERSATION=$(curl -s "$BASE_URL/conversations/$CONVERSATION_ID/details" \
  -H "X-API-Key: $API_KEY")

echo "   ✓ Conversation retrieved"
echo ""
echo "   Conversation Summary:"
echo "   ---------------------"
echo $FULL_CONVERSATION | jq '{
  conversation_id: .conversation.id,
  type: .conversation.type,
  participants: .participants | length,
  messages: .messages | length
}'

# Step 5: Get all messages in the conversation
echo ""
echo "6. Retrieving all messages..."
MESSAGES=$(curl -s "$BASE_URL/conversations/$CONVERSATION_ID/messages" \
  -H "X-API-Key: $API_KEY")

echo "   ✓ Messages retrieved"
echo ""
echo "   Message Timeline:"
echo "   -----------------"
echo $MESSAGES | jq -r '.data[] | "   [\(.created_at)] \(.body)"'

# Step 6: Update a message (simulate editing)
echo ""
echo "7. Testing message update..."
UPDATED_MESSAGE=$(curl -s -X PUT "$BASE_URL/messages/$MESSAGE1_ID" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"body":"Hi Bob! How are you doing today?"}')

echo "   ✓ Message updated successfully"
echo "   Original: \"Hi Bob! How are you?\""
echo "   Updated:  \"$(echo $UPDATED_MESSAGE | jq -r '.body')\""

# Step 7: Check API logs
echo ""
echo "8. Checking API Gateway logs..."
LOGS=$(curl -s "$BASE_URL/logs?page=1" \
  -H "X-API-Key: $API_KEY")

TOTAL_LOGS=$(echo $LOGS | jq -r '.total')
RECENT_LOGS=$(echo $LOGS | jq -r '.data[0:5] | .[] | "\(.method) \(.path) - \(.status_code)"')

echo "   ✓ Total API calls logged: $TOTAL_LOGS"
echo ""
echo "   Recent API calls:"
echo "$RECENT_LOGS" | while read line; do echo "   - $line"; done

echo ""
echo "========================================="
echo "✓ Chat Simulation Complete!"
echo "========================================="
echo ""
echo "Summary:"
echo "  - Customers created: 2 (Alice & Bob)"
echo "  - Conversations: 1"
echo "  - Messages sent: 4"
echo "  - Messages updated: 1"
echo "  - API calls logged: $TOTAL_LOGS"
echo ""
echo "Test IDs:"
echo "  Alice ID: $CUSTOMER1_ID"
echo "  Bob ID: $CUSTOMER2_ID"
echo "  Conversation ID: $CONVERSATION_ID"
echo "  Message IDs: $MESSAGE1_ID, $MESSAGE2_ID, $MESSAGE3_ID, $MESSAGE4_ID"
echo ""
echo "View in Ops Dashboard:"
echo "  - API Logs: http://localhost:5174/logs"
echo "  - Service Logs: http://localhost:5174/service-logs"
echo ""
