# Create Kafka topics for the event bus (Windows PowerShell)

Write-Host "📋 Creating Kafka topics..."

# Topic configuration
$KAFKA_BROKER = "localhost:9092"
$PARTITIONS = 3
$REPLICATION_FACTOR = 1

# List of topics
$topics = @(
    "webhook.inbound.received",
    "customer.created",
    "customer.upserted",
    "conversation.opened",
    "conversation.closed",
    "conversation.participant.added",
    "message.inbound.created",
    "message.outbound.created",
    "media.uploaded",
    "error.critical"
)

# Create each topic
foreach ($topic in $topics) {
    Write-Host "Creating topic: $topic"
    # kafka-topics.bat is assumed to be in PATH
    try {
        kafka-topics.bat --create `
            --bootstrap-server $KAFKA_BROKER `
            --topic $topic `
            --partitions $PARTITIONS `
            --replication-factor $REPLICATION_FACTOR `
            --if-not-exists
    } catch {
        Write-Warning "Failed to create topic $topic. Ensure kafka-topics.bat is in PATH and Kafka is running."
    }
}

Write-Host ""
Write-Host "✅ All topics processed"
Write-Host ""
Write-Host "To list topics, run:"
Write-Host "  kafka-topics.bat --list --bootstrap-server localhost:9092"
