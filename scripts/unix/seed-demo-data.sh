#!/bin/bash
# seed-demo-data.sh - Create complete demo data across all services

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Creating Complete Demo Data                                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 3

API_KEY="kobliat-secret-key"
BASE_URL="http://localhost:8000/api/v1"

echo "📦 Creating demo customers..."
# Create customers
CUSTOMER1=$(curl -s -X POST "$BASE_URL/customers" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"external_id":"demo_user_1","external_type":"whatsapp","name":"John Doe"}' | jq -r '.id')

CUSTOMER2=$(curl -s -X POST "$BASE_URL/customers" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"external_id":"demo_user_2","external_type":"whatsapp","name":"Jane Smith"}' | jq -r '.id')

CUSTOMER3=$(curl -s -X POST "$BASE_URL/customers" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"external_id":"demo_user_3","external_type":"web","name":"Alice Johnson"}' | jq -r '.id')

AI_ASSISTANT=$(curl -s -X POST "$BASE_URL/customers" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"external_id":"ai_assistant","external_type":"assistant","name":"AI Assistant"}' | jq -r '.id')

echo "✅ Created 4 customers"

echo "📦 Creating demo conversations..."
# Create conversations
CONV1=$(curl -s -X POST "$BASE_URL/conversations" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"type\":\"direct\",\"participants\":[\"$CUSTOMER1\",\"$AI_ASSISTANT\"]}" | jq -r '.id')

CONV2=$(curl -s -X POST "$BASE_URL/conversations" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"type\":\"direct\",\"participants\":[\"$CUSTOMER2\",\"$AI_ASSISTANT\"]}" | jq -r '.id')

CONV3=$(curl -s -X POST "$BASE_URL/conversations" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"type\":\"direct\",\"participants\":[\"$CUSTOMER3\",\"$AI_ASSISTANT\"]}" | jq -r '.id')

echo "✅ Created 3 conversations"

echo "📦 Creating demo messages..."
# Create messages for conversation 1
curl -s -X POST "$BASE_URL/messages" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"conversation_id\":\"$CONV1\",\"direction\":\"inbound\",\"body\":\"Hello! I need some help.\",\"sender_customer_id\":\"$CUSTOMER1\"}" > /dev/null

curl -s -X POST "$BASE_URL/messages" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"conversation_id\":\"$CONV1\",\"direction\":\"outbound\",\"body\":\"Hi there! I'd be happy to help. What can I assist you with today?\",\"sender_customer_id\":\"$AI_ASSISTANT\"}" > /dev/null

curl -s -X POST "$BASE_URL/messages" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"conversation_id\":\"$CONV1\",\"direction\":\"inbound\",\"body\":\"I have a question about your services.\",\"sender_customer_id\":\"$CUSTOMER1\"}" > /dev/null

curl -s -X POST "$BASE_URL/messages" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"conversation_id\":\"$CONV1\",\"direction\":\"outbound\",\"body\":\"Of course! Please go ahead and ask your question.\",\"sender_customer_id\":\"$AI_ASSISTANT\"}" > /dev/null

# Create messages for conversation 2
curl -s -X POST "$BASE_URL/messages" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"conversation_id\":\"$CONV2\",\"direction\":\"inbound\",\"body\":\"Hi, can you help me?\",\"sender_customer_id\":\"$CUSTOMER2\"}" > /dev/null

curl -s -X POST "$BASE_URL/messages" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"conversation_id\":\"$CONV2\",\"direction\":\"outbound\",\"body\":\"Hello! Absolutely, I'm here to help. What do you need?\",\"sender_customer_id\":\"$AI_ASSISTANT\"}" > /dev/null

echo "✅ Created 6 messages"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Demo Data Created Successfully! 🎉                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Created:"
echo "  • 4 Customers"
echo "  • 3 Conversations"
echo "  • 6 Messages"
echo ""
echo "You can now access the AI Chat at: http://localhost:5174"
echo ""
