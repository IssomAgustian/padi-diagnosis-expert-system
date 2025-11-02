# Backend Structure Document - Padi Diagnosis Expert System

This document describes the backend setup for the Padi Diagnosis Expert System—an application that diagnoses rice plant diseases using hybrid Forward Chaining and Certainty Factor techniques, augmented with AI-driven treatment recommendations. It is written in everyday language so anyone can understand how the backend is organized, hosted, and maintained.

## 1. Backend Architecture

### Overall Design
- **Framework**: A standalone Flask application structured with Blueprints to separate concerns (authentication, diagnosis, history, AI integration).
- **Pattern**: Layered (or “clean”) architecture:
  - **Routes** (entry points)
  - **Services** (business logic for Forward Chaining and Certainty Factor calculations)
  - **Models** (ORM definitions with SQLAlchemy)
  - **Utilities** (OpenAI client, PDF generator, helper functions)
- **Server**: Gunicorn as the WSGI server, with Nginx in front as a reverse proxy and SSL terminator.
- **Containers**: Each component (Flask API, PostgreSQL, Redis) runs in its own Docker container for isolation and portability.

### Scalability, Maintainability, Performance
- **Horizontal Scaling**: Multiple identical Flask containers behind a load balancer allow handling increased traffic.
- **Connection Pooling**: SQLAlchemy’s connection pool reuses database connections, reducing overhead.
- **Auto-Reload & Hot-Deploy**: In development, Docker Compose auto-rebuilds on code changes; in production, CI/CD pipelines handle rolling updates.
- **Modularity**: Clean separation of routes, logic, and data models makes it easy to add new features (e.g., additional disease rules) without touching unrelated code.

## 2. Database Management

### Technologies Used
- **Type**: Relational (SQL)
- **System**: PostgreSQL (hosted via AWS RDS or similar managed service)
- **ORM**: SQLAlchemy for Python to map tables to classes.
- **Migrations**: Alembic for versioning schema changes.

### Data Flow and Practices
- **Structure**: Normalized tables with primary/foreign keys. JSONB columns for flexible data, like storing selected symptom lists and AI-generated recommendations.
- **Access**: Data access happens through SQLAlchemy sessions, ensuring thread-safe transactions and automatic rollback on errors.
- **Backups & Snapshots**: Daily automated database snapshots. Point-in-time recovery configured for up to 7 days.
- **Retention Policy**: Diagnosis history older than 30 days is either archived or pruned to save storage.

## 3. Database Schema

### Human-Readable Overview
- **Users**: Tracks user accounts and Google OAuth details.
- **Symptoms**: Lists all possible rice plant symptoms.
- **Diseases**: Lists known diseases and their descriptions.
- **Rules**: Defines which symptoms map directly to a disease (Forward Chaining).
- **Symptom–Disease Factors**: Stores the MB (measure of belief) and MD (measure of disbelief) for each symptom–disease pair.
- **Diagnosis History**: Records each diagnosis event, including selected symptoms, certainty factors, final CF score, and AI-generated treatment recommendations.

### SQL Schema (PostgreSQL)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE symptoms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT
);

CREATE TABLE diseases (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT
);

CREATE TABLE rules (
  id SERIAL PRIMARY KEY,
  disease_id INTEGER NOT NULL REFERENCES diseases(id) ON DELETE CASCADE,
  symptom_id INTEGER NOT NULL REFERENCES symptoms(id) ON DELETE CASCADE
);

CREATE TABLE symptom_disease_cf (
  id SERIAL PRIMARY KEY,
  symptom_id INTEGER NOT NULL REFERENCES symptoms(id),
  disease_id INTEGER NOT NULL REFERENCES diseases(id),
  mb FLOAT NOT NULL,
  md FLOAT NOT NULL,
  UNIQUE (symptom_id, disease_id)
);

CREATE TABLE diagnosis_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  disease_id INTEGER REFERENCES diseases(id),
  diagnosis_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) NOT NULL,
  selected_symptoms JSONB NOT NULL,
  certainty_factors JSONB,
  final_cf_value FLOAT,
  final_recommendations JSONB
);
``` 

## 4. API Design and Endpoints

### RESTful Approach
- **Format**: JSON over HTTP, clear status codes, meaningful error messages.
- **Versioning**: Prefix routes with `/api/v1/` for future changes.

### Key Endpoints
- **Authentication**
  - `POST /api/v1/auth/login/google` → start Google OAuth flow
  - `POST /api/v1/auth/logout` → end session
- **Symptoms**
  - `GET /api/v1/symptoms` → fetch list of all symptoms
- **Diagnosis**
  - `POST /api/v1/diagnose` → submit selected symptom IDs; server performs Forward Chaining and responds with either a complete diagnosis or a request for certainty factors
  - `POST /api/v1/calculate-certainty` → submit symptom IDs with user-supplied certainty values; server calculates final CF score and returns the result plus AI-generated treatment plan
- **History**
  - `GET /api/v1/history` → list the logged-in user’s last 30 days of diagnoses, paginated
  - `GET /api/v1/history/admin` → (admin only) list all users’ history records

## 5. Hosting Solutions

### Development Environment
- **Docker Compose**: Runs Flask, PostgreSQL, and Redis locally. One command to spin up the full stack.

### Production Environment
- **Container Orchestration**: AWS ECS (Fargate) or Kubernetes (EKS)
- **Database**: AWS RDS for PostgreSQL (managed backups, high availability)
- **Load Balancing**: AWS Application Load Balancer in front of Flask containers
- **DNS & SSL**: AWS Route 53 and ACM for managed SSL certificates

**Benefits**: high availability, automated scaling, pay-as-you-go, managed security updates.

## 6. Infrastructure Components

- **Load Balancer** (ALB or Nginx): Distributes incoming API traffic across multiple Flask instances.
- **WSGI Server** (Gunicorn): Manages worker processes for handling concurrent requests.
- **Proxy/SSL Termination** (Nginx): Handles TLS, static file serving (if needed), and request routing.
- **Caching** (Redis):
  - Session storage (optional)
  - Caching frequently fetched data (e.g., symptom list)
- **CDN** (e.g., AWS CloudFront): Delivers static assets (icons, docs) with low latency.
- **Logging & Centralized Storage**: CloudWatch Logs or ELK stack for aggregated, searchable logs.

## 7. Security Measures

- **Transport Security**: TLS (HTTPS) for all in-transit data.
- **Authentication & Authorization**:
  - OAuth2 with Google for user login
  - Session cookies (secure, HttpOnly) or JWTs for API calls
  - Role-based access control (regular user vs. admin)
- **Input Validation**: Strict schema checks with Marshmallow or Pydantic.
- **Rate Limiting**: Flask-Limiter to protect against brute-force and denial-of-service.
- **Secret Management**: Environment variables stored in AWS Secrets Manager (DB credentials, OAuth keys, OpenAI API keys).
- **Data Encryption**: AES-256 at rest for RDS, Redis encryption if supported.
- **Compliance**: GDPR-friendly design (data retention policy, right to delete).

## 8. Monitoring and Maintenance

- **Performance Monitoring**: Prometheus + Grafana or AWS CloudWatch metrics (CPU, memory, request latency).
- **Application Tracing**: OpenTelemetry or DataDog APM for end-to-end request traces.
- **Alerting**: CPU/RAM thresholds, error-rate spikes sent to Slack/SMS via SNS or PagerDuty.
- **Automated Backups**: Daily RDS snapshots, weekly full dumps of JSON history archives.
- **Health Checks**: ECS health checks pings `/api/v1/health` endpoint to restart unhealthy containers.
- **Database Migrations**: Automated via Alembic in CI/CD pipeline before new container deploy.

## 9. Conclusion and Overall Backend Summary

The backend for the Padi Diagnosis Expert System is a modular, containerized Flask application backed by PostgreSQL. It cleanly separates API routes, business logic, and data models, making it easy to extend with new diseases or reasoning rules. By combining Forward Chaining, Certainty Factor calculations, and AI-driven treatment generation, it meets the project’s goal of delivering accurate, actionable diagnoses. Deployed in a modern cloud environment using Docker, ECS, and managed databases, it ensures reliability, scalability, and efficient maintenance for both developers and end users.