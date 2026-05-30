# CampusOS – Scalability & Engineering Roadmap

This document outlines the phased engineering roadmap to transition CampusOS from blueprint to production deployment, alongside the cloud-native infrastructure architecture designed to scale to thousands of schools and universities.

---

## 📅 The 6-Phase Development Roadmap

The engineering timeline spans 24 weeks, organized to systematically build, test, and harden the core SaaS:

```
[ Phase 1: Weeks 1-4 ] ──► [ Phase 2: Weeks 5-8 ] ──► [ Phase 3: Weeks 9-12 ]
  - Relational Schema       - PDF/Doc Parsing        - Booking engine
  - JWT Auth/RBAC Guard     - pgvector config        - Lost & Found Matcher
  - Dashboard Base layouts  - Basic LLM RAG loop     - Complaints escalate
                                                             │
┌────────────────────────────────────────────────────────────┘
│
▼
[ Phase 4: Weeks 13-16] ──► [ Phase 5: Weeks 17-20] ──► [ Phase 6: Weeks 21-24]
  - Placements Eligibility   - Predict Attendance    - Multi-tenant billing
  - A* Indoor Navigation     - Recommender engine    - AWS EKS / Docker Compose
  - Vector Resume analyzer   - Analytics reports     - Security audits / Load test
```

---

## 🐳 Containerized Development Topology (Docker Compose)

For fast local developer onboarding and staging replication, the entire stack runs under a unified, network-isolated multi-container environment:

```yaml
version: '3.8'

services:
  # 1. Persistent Transactional & Vector DB
  postgres_db:
    image: pgvector/pgvector:15-pgdg
    container_name: campusos-postgres
    environment:
      POSTGRES_USER: campus_admin
      POSTGRES_PASSWORD: SecretProductionPassword123
      POSTGRES_DB: campusos_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - campusos-network

  # 2. Key-Value Cache & Session Broker
  redis_cache:
    image: redis:7.0-alpine
    container_name: campusos-redis
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    networks:
      - campusos-network

  # 3. Main Express Backend Gateway & API Server
  backend_api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: campusos-api
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - NODE_ENV=development
      - DATABASE_URL=postgresql://campus_admin:SecretProductionPassword123@postgres_db:5432/campusos_db
      - REDIS_URL=redis://redis_cache:6379
      - JWT_SECRET=SuperSecureJWTKey
    depends_on:
      - postgres_db
      - redis_cache
    networks:
      - campusos-network

  # 4. Async PDF Parser & Vectorizer Worker
  bullmq_worker:
    build:
      context: ./backend
      dockerfile: Dockerfile.worker
    container_name: campusos-worker
    environment:
      - DATABASE_URL=postgresql://campus_admin:SecretProductionPassword123@postgres_db:5432/campusos_db
      - REDIS_URL=redis://redis_cache:6379
    depends_on:
      - redis_cache
    networks:
      - campusos-network

networks:
  campusos-network:
    driver: bridge

volumes:
  pgdata:
  redisdata:
```

---

## ☁️ Enterprise Cloud Scaling (AWS EKS Infrastructure)

When scaling to hundreds of schools supporting thousands of concurrent active student dashboards, the microservices scale out across a Kubernetes-managed cloud network (AWS EKS):

```
       [ Client Request ] ──► [ AWS Route 53 (Subdomain Route) ]
                                      │
                                      ▼
                        [ AWS Network Load Balancer ]
                                      │
                                      ▼
                         [ Nginx Ingress Controller ]
                                      │
         ┌────────────────────────────┴────────────────────────────┐
         ▼                                                         ▼
 [ Express Pod (Pod A) ]                                   [ Express Pod (Pod B) ]
 (Auto-scaled by HPA on CPU > 70%)                         (Auto-scaled by HPA on CPU > 70%)
         │                                                         │
         ├────────────────────────────┬────────────────────────────┤
         ▼                            ▼                            ▼
  [ AWS ElastiCache ]         [ AWS RDS Aurora PG ]        [ AWS S3 Buckets ]
  (Redis session replication) (Read Replicas & pgvector)   (Resumes, PDFs, Images)
```

### 1. Horizontal Pod Autoscaling (HPA)
The Express backend pods monitor CPU and Memory boundaries. During class hours (e.g. 9 AM - 4 PM), EKS automatically scales Express pods from 3 to 15 nodes based on a Target CPU Utilization of 75%.

### 2. AWS RDS Aurora PostgreSQL & Read-Replicas
* **Write Node**: A master Aurora database instance processes all writes (bookings, attendance logs, profile changes).
* **Read Replicas**: 3 geographically balanced read-replicas service high-volume student dashboard requests (fetching daily timetables, announcements, study files).

---

## ⚡ Cache Invalidation & Rate Limiting Strategy

### 1. Redis Caching Topology
To prevent repeated heavy SQL queries on complex static catalogs, we cache critical datasets:
* **Timetable Caching**: Student weekly schedules are cached under `tenant:T:student:S:timetable` with a Time-to-Live (TTL) of 24 hours. When a faculty member edits a slot, a database hook runs `DEL tenant:T:student:*:timetable` to clear the caches.
* **Lab Vacancy Check**: Live booking rosters use a 5-minute Redis slide cache to keep queries lighting-fast.

### 2. Security Rate Limiting Middleware
To prevent brute-force attacks on multi-tenant logins and coordinate protection against AI API abuse:
```javascript
const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");

const loginThrottler = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 15 * 60 * 1000, -- 15 minutes
  max: 10, -- Limit each IP to 10 login attempts per window
  message: "Too many login attempts from this IP. Please try again after 15 minutes."
});
```

---

## 🔒 Security Compliance & Disaster Recovery (DR)

### 1. Enterprise Grade Compliance
* **Data Sovereignty (GDPR / Local Educational Policies)**: Multi-tenant schemas isolate student profiles. For elite clients, the SaaS deploys on custom AWS accounts keeping the physical instances completely isolated.
* **Audit Trails**: Changes to grades, attendance logs, and administrative bookings are recorded in `audit_logs` with SHA-256 integrity signatures.

### 2. Disaster Recovery Benchmarks
To guarantee continuous operations and database resilience against cloud interruptions, CampusOS adheres to strict Recovery metrics:

* **Recovery Point Objective (RPO)**: **5 Minutes**. Database snapshots are continuously streamed to AWS S3. Vector stores undergo daily verification checks.
* **Recovery Time Objective (RTO)**: **30 Minutes**. In case of total zone failure, the automated Terraform and Kubernetes scripts re-spin the active stack in an alternate AWS availability zone within 30 minutes.
