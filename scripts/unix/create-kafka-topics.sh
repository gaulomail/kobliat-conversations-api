#!/bin/bash

# Create Kafka topics for the event bus

echo "📋 Creating Kafka topics..."

# Topic configuration
KAFKA_BROKER="localhost:9092"
PARTITIONS=3
REPLICATION_FACTOR=1

# List of topics
topics=(
    "webhook.inbound.received"
    "customer.created"
    "customer.upserted"
    "conversation.opened"
    "conversation.closed"
    "conversation.participant.added"
    "message.inbound.created"
    "message.outbound.created"
    "media.uploaded"
    "error.critical"
)

# Create each topic
for topic in "${topics[@]}"; do
    echo "Creating topic: $topic"
    kafka-topics --create \
        --bootstrap-server $KAFKA_BROKER \
        --topic $topic \
        --partitions $PARTITIONS \
        --replication-factor $REPLICATION_FACTOR \
        --if-not-exists
done

echo ""
echo "✅ All topics created successfully"
echo ""
echo "To list topics, run:"
echo "  kafka-topics --list --bootstrap-server localhost:9092"
