# Kobliat Mini Router 2.0 — Infrastructure & CI/CD (Part 2)

This document is the second half of the split from the original Gateway/Simulator/Infrastructure document. It includes:
- Docker Compose (Full Local Dev Stack)
- Kubernetes Manifests & Helm
- CI/CD Pipeline (Full Expanded)
- Environment Variables & Configuration (For All Services)
- Testing Strategy
- Directory Layouts
- Observability Dashboards
- Operational Playbooks
- Appendix Scripts

---

# 1. Docker Compose (Full Local Dev Stack)
Full development stack for local simulation and integration testing.

```yaml
version: '3.9'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.0.1
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:7.0.1
    depends_on: [zookeeper]
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: 'zookeeper:2181'
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092

  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: svc
      POSTGRES_PASSWORD: secret

  minio:
    image: minio/minio
    command: server /data
    environment:
      MINIO_ROOT_USER: minio
      MINIO_ROOT_PASSWORD: minio123

  inbound-gateway:
    build: ./inbound-gateway
    depends_on: [kafka, postgres]
    environment:
      DB_HOST: postgres
      KAFKA_BROKER: kafka:9092

  api-gateway:
    build: ./api-gateway
    depends_on: [kafka, postgres]
    ports:
      - "8080:8080"
```

---

# 2. Kubernetes Manifests & Helm

## 2.1 Deployment Example
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inbound-gateway
spec:
  replicas: 2
  selector:
    matchLabels:
      app: inbound-gateway
  template:
    metadata:
      labels:
        app: inbound-gateway
    spec:
      containers:
      - name: inbound-gateway
        image: koblait/inbound-gateway:latest
        ports:
        - containerPort: 8080
        envFrom:
        - secretRef:
            name: inbound-gateway-secrets
```

## 2.2 Service Example
```yaml
apiVersion: v1
kind: Service
metadata:
  name: inbound-gateway
spec:
  ports:
  - port: 8080
  selector:
    app: inbound-gateway
```

## 2.3 Helm Chart Structure
```
charts/
  inbound-gateway/
    templates/
    values.yaml
```

---

# 3. CI/CD Pipeline (Full Expanded)

## 3.1 Pipeline Stages
- Static analysis
- Unit tests
- Build Docker image
- Integration tests via Testcontainers
- Publish Helm chart
- Deploy to staging
- Deploy to production (manual approval)

## 3.2 Example GitHub Action
```yaml
name: Deploy to Staging
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
      - name: Deploy Helm
        run: |
          helm upgrade --install koblait ./charts -f values-staging.yaml
```

---

# 4. Environment Variables (All Services)
```
SERVICE_NAME=message-svc
ENVIRONMENT=staging
PORT=8080
DB_HOST=postgres
DB_PORT=5432
DB_NAME=messages
DB_USER=svc
DB_PASS=secret
KAFKA_BROKER=kafka:9092
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minio
S3_SECRET_KEY=minio123
OTEL_COLLECTOR=http://otel-collector:4317
SENTRY_DSN=
GEMINI_API_KEY=
```

---

# 5. Testing Strategy
- Unit tests (PHPUnit/Jest)
- Integration tests via Testcontainers
- Pact contract tests
- End-to-end tests using Chat Simulator
- Load tests with k6 or Locust
- Security tests: Trivy / Snyk

---

# 6. Directory Layout Recommendations
```
inbound-gateway/
├─ src/
├─ migrations/
├─ Dockerfile
├─ helm/
└─ README.md

api-gateway/
├─ src/
├─ openapi.yaml
├─ Dockerfile
└─ README.md
```

---

# 7. Observability Dashboards (Recommended Panels)
- Ingestion rate per channel
- Latency per endpoint
- Kafka consumer lag
- Error ratio per service
- Media scan success/failure rates

---

# 8. Operational Playbooks
## Incident: Kafka Lag High
- Check consumer health
- Restart stalled consumers
- Increase replicas (HPA)

## Incident: Media Scan Failures
- Inspect ClamAV containers
- Reprocess messages from queue

## Disaster Recovery
- Restore Postgres snapshot
- Replay Kafka events

---

# 9. Appendix: Helper Scripts
- `scripts/send-simulator-scenario.sh`
- `scripts/seed-data.sql`
- `scripts/replay-events.sh`

---

# END OF PART 2

