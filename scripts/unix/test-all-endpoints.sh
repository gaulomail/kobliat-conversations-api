#!/bin/bash
# test-all-endpoints.sh - Test all microservice endpoints

set -e

API_KEY="kobliat-secret-key"
BASE_URL="http://localhost:8000/api/v1"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Testing All Microservice Endpoints                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    echo -n "Testing: $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$endpoint" -H "X-API-Key: $API_KEY")
    else
        response=$(curl -s -w "\n%{http_code}" -X POST "$endpoint" \
            -H "Content-Type: application/json" \
            -H "X-API-Key: $API_KEY" \
            -d "$data")
    fi
    
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $status)"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $status)"
        echo "Response: $body"
        return 1
    fi
}

# Track results
TOTAL=0
PASSED=0
FAILED=0

echo "════════════════════════════════════════════════════════════════"
echo "1. CUSTOMER SERVICE"
echo "════════════════════════════════════════════════════════════════"

# Test GET /customers
test_endpoint "GET" "$BASE_URL/customers" "" "200" "GET /customers - List all customers"
((TOTAL++)); [ $? -eq 0 ] && ((PASSED++)) || ((FAILED++))

# Test POST /customers
test_endpoint "POST" "$BASE_URL/customers" '{"external_id":"test_'$(date +%s)'","external_type":"web","name":"Test User"}' "201" "POST /customers - Create customer"
((TOTAL++)); [ $? -eq 0 ] && ((PASSED++)) || ((FAILED++))

# Get a customer ID for further tests
CUSTOMER_ID=$(curl -s "$BASE_URL/customers" -H "X-API-Key: $API_KEY" | jq -r '.data[0].id // empty')

if [ -n "$CUSTOMER_ID" ]; then
    test_endpoint "GET" "$BASE_URL/customers/$CUSTOMER_ID" "" "200" "GET /customers/{id} - Get customer by ID"
    ((TOTAL++)); [ $? -eq 0 ] && ((PASSED++)) || ((FAILED++))
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "2. CONVERSATION SERVICE"
echo "════════════════════════════════════════════════════════════════"

# Test GET /conversations
test_endpoint "GET" "$BASE_URL/conversations" "" "200" "GET /conversations - List all conversations"
((TOTAL++)); [ $? -eq 0 ] && ((PASSED++)) || ((FAILED++))

# Test POST /conversations (need 2 customer IDs)
if [ -n "$CUSTOMER_ID" ]; then
    CUSTOMER_ID2=$(curl -s "$BASE_URL/customers" -H "X-API-Key: $API_KEY" | jq -r '.data[1].id // empty')
    if [ -n "$CUSTOMER_ID2" ]; then
        test_endpoint "POST" "$BASE_URL/conversations" "{\"type\":\"direct\",\"participants\":[\"$CUSTOMER_ID\",\"$CUSTOMER_ID2\"]}" "201" "POST /conversations - Create conversation"
        ((TOTAL++)); [ $? -eq 0 ] && ((PASSED++)) || ((FAILED++))
    fi
fi

# Get a conversation ID for further tests
CONV_ID=$(curl -s "$BASE_URL/conversations" -H "X-API-Key: $API_KEY" | jq -r '.data[0].id // .[0].id // empty')

if [ -n "$CONV_ID" ]; then
    test_endpoint "GET" "$BASE_URL/conversations/$CONV_ID" "" "200" "GET /conversations/{id} - Get conversation by ID"
    ((TOTAL++)); [ $? -eq 0 ] && ((PASSED++)) || ((FAILED++))
    
    test_endpoint "GET" "$BASE_URL/conversations/$CONV_ID/details" "" "200" "GET /conversations/{id}/details - Get conversation details"
    ((TOTAL++)); [ $? -eq 0 ] && ((PASSED++)) || ((FAILED++))
    
    test_endpoint "GET" "$BASE_URL/conversations/$CONV_ID/messages" "" "200" "GET /conversations/{id}/messages - Get conversation messages"
    ((TOTAL++)); [ $? -eq 0 ] && ((PASSED++)) || ((FAILED++))
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "3. MESSAGING SERVICE"
echo "════════════════════════════════════════════════════════════════"

# Test POST /messages
if [ -n "$CONV_ID" ] && [ -n "$CUSTOMER_ID" ]; then
    test_endpoint "POST" "$BASE_URL/messages" "{\"conversation_id\":\"$CONV_ID\",\"direction\":\"inbound\",\"body\":\"Test message\",\"sender_customer_id\":\"$CUSTOMER_ID\"}" "201" "POST /messages - Create message"
    ((TOTAL++)); [ $? -eq 0 ] && ((PASSED++)) || ((FAILED++))
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "4. API GATEWAY"
echo "════════════════════════════════════════════════════════════════"

# Test health endpoint
test_endpoint "GET" "http://localhost:8000/health" "" "200" "GET /health - Health check"
((TOTAL++)); [ $? -eq 0 ] && ((PASSED++)) || ((FAILED++))

# Test logs endpoint
test_endpoint "GET" "$BASE_URL/logs" "" "200" "GET /logs - API logs"
((TOTAL++)); [ $? -eq 0 ] && ((PASSED++)) || ((FAILED++))

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "5. INDIVIDUAL SERVICE HEALTH CHECKS"
echo "════════════════════════════════════════════════════════════════"

test_endpoint "GET" "http://localhost:8001/api/health" "" "200" "Customer Service - Health"
((TOTAL++)); [ $? -eq 0 ] && ((PASSED++)) || ((FAILED++))

test_endpoint "GET" "http://localhost:8002/api/health" "" "200" "Conversation Service - Health"
((TOTAL++)); [ $? -eq 0 ] && ((PASSED++)) || ((FAILED++))

test_endpoint "GET" "http://localhost:8003/api/health" "" "200" "Messaging Service - Health"
((TOTAL++)); [ $? -eq 0 ] && ((PASSED++)) || ((FAILED++))

test_endpoint "GET" "http://localhost:8004/api/health" "" "200" "Media Service - Health"
((TOTAL++)); [ $? -eq 0 ] && ((PASSED++)) || ((FAILED++))

test_endpoint "GET" "http://localhost:8005/api/health" "" "200" "Inbound Gateway - Health"
((TOTAL++)); [ $? -eq 0 ] && ((PASSED++)) || ((FAILED++))

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Test Results                                                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
    exit 1
fi
