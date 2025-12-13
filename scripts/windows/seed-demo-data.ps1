# seed-demo-data.ps1 - Create complete demo data across all services (Windows)

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════════════════════════════╗"
Write-Host "║   Creating Complete Demo Data                                 ║"
Write-Host "╚════════════════════════════════════════════════════════════════╝"
Write-Host ""

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..."
Start-Sleep -Seconds 3

$API_KEY = "kobliat-secret-key"
$BASE_URL = "http://localhost:8000/api/v1"
$Headers = @{
    "Content-Type" = "application/json"
    "X-API-Key" = $API_KEY
}

Write-Host "📦 Creating demo customers..."

# Helper function to create customer
function New-Customer {
    param ($externalId, $type, $name)
    $body = @{
        external_id = $externalId
        external_type = $type
        name = $name
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BASE_URL/customers" -Method Post -Headers $Headers -Body $body
    return $response.id
}

$CUSTOMER1 = New-Customer "demo_user_1" "whatsapp" "John Doe"
$CUSTOMER2 = New-Customer "demo_user_2" "email" "Jane Smith"
$CUSTOMER3 = New-Customer "demo_user_3" "web" "Alice Johnson"
$CUSTOMER4 = New-Customer "demo_user_4" "sms" "Bob Brown"
$AI_ASSISTANT = New-Customer "ai_assistant" "assistant" "AI Assistant"

Write-Host "✅ Created 5 customers"

Write-Host "📦 Creating demo conversations..."

# Helper for conversation
function New-Conversation {
    param ($p1, $p2)
    $body = @{
        type = "direct"
        participants = @($p1, $p2)
    } | ConvertTo-Json -Depth 10 -Compress # Formatting weirdness avoidance
    
    $response = Invoke-RestMethod -Uri "$BASE_URL/conversations" -Method Post -Headers $Headers -Body $body
    return $response.id
}

$CONV1 = New-Conversation $CUSTOMER1 $AI_ASSISTANT
$CONV2 = New-Conversation $CUSTOMER2 $AI_ASSISTANT
$CONV3 = New-Conversation $CUSTOMER3 $AI_ASSISTANT
$CONV4 = New-Conversation $CUSTOMER4 $AI_ASSISTANT

Write-Host "✅ Created 4 conversations"

Write-Host "📦 Creating demo messages..."

# Helper for message
function New-Message {
    param ($convId, $dir, $bodyTxt, $sender)
    $body = @{
        conversation_id = $convId
        direction = $dir
        body = $bodyTxt
        sender_customer_id = $sender
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$BASE_URL/messages" -Method Post -Headers $Headers -Body $body | Out-Null
    } catch {
        Write-Warning "Failed to create message: $_"
    }
}

# Messages for Conv 1
New-Message $CONV1 "inbound" "Hello! I need some help." $CUSTOMER1
New-Message $CONV1 "outbound" "Hi there! I'd be happy to help. What can I assist you with today?" $AI_ASSISTANT
New-Message $CONV1 "inbound" "I have a question about your services." $CUSTOMER1
New-Message $CONV1 "outbound" "Of course! Please go ahead and ask your question." $AI_ASSISTANT

# Messages for Conv 2
New-Message $CONV2 "inbound" "Hi, can you help me?" $CUSTOMER2
New-Message $CONV2 "outbound" "Hello! Absolutely, I'm here to help. What do you need?" $AI_ASSISTANT

Write-Host "✅ Created 6 messages"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗"
Write-Host "║   Demo Data Created Successfully! 🎉                          ║"
Write-Host "╚════════════════════════════════════════════════════════════════╝"
Write-Host ""
Write-Host "You can now access the AI Chat at: http://localhost:5173"
Write-Host ""
