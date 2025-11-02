# padi-diagnosis-expert-system Security Guidelines

This document defines security best practices tailored to the `padi-diagnosis-expert-system`, a hybrid Next.js frontend and Flask backend application for diagnosing rice plant diseases. It aligns with industry‐standard principles to ensure confidentiality, integrity, and availability throughout the system lifecycle.

---

## 1. Security Principles by Design
- **Security by Design**: Integrate security reviews at each sprint—design, development, testing, and deployment.  
- **Least Privilege**: Grant minimal access rights to users, services, and database roles.  
- **Defense in Depth**: Combine network, host, and application controls so a single failure is not a system compromise.  
- **Fail Securely**: Default to denial for any error or exception; do not leak stack traces or sensitive data.  
- **Secure Defaults**: Ensure production builds disable debug features, verbose logging, and development-only endpoints.

---

## 2. Authentication & Access Control

### 2.1 Google OAuth Integration
- Use OAuth 2.0 Authorization Code flow with PKCE for Google sign-in.  
- Validate and verify ID tokens server-side using Google’s public keys.  
- Implement strict redirect URI allow-listing.

### 2.2 Session Management
- Use HTTP-only, Secure, SameSite=strict cookies to store session identifiers.  
- Rotate session identifiers on privilege changes and at regular intervals.  
- Enforce idle timeout (e.g., 30 minutes) and absolute expiration (e.g., 24 hours).  
- Provide explicit logout endpoint (`POST /api/auth/logout`) to invalidate server-side sessions.

### 2.3 Role-Based Access Control (RBAC)
- Define roles (e.g., `user`, `admin`) and enforce server-side checks for every protected route.  
- On the Flask side, decorate endpoints with role checks and abort unauthorized requests (HTTP 403).

---

## 3. Input Validation & Output Encoding

### 3.1 Frontend & API Input Validation
- Treat all client input as untrusted.  
- On Next.js, use Zod or Yup to validate request payloads before sending to the backend.  
- On Flask, validate JSON bodies with Marshmallow or Pydantic.  
- Enforce allow-lists for enum fields (e.g., symptom IDs, certainty factor ranges).

### 3.2 Prevent Injection Attacks
- Use parameterized queries via SQLAlchemy ORM—never concatenate SQL strings.  
- Sanitize any user‐provided text used in templates.  
- Apply context-aware encoding when rendering values in React (React escapes by default).

### 3.3 File Handling
- If generating or accepting PDF reports, ensure no user‐controlled content is executed.  
- Store temporary files in a protected directory outside the webroot with restrictive permissions.

---

## 4. Data Protection & Privacy

### 4.1 Transport Encryption
- Enforce HTTPS/TLS 1.2+ for all frontend↔backend and backend↔external-AI calls.  
- HSTS header with `max-age=63072000; includeSubDomains; preload`.

### 4.2 At-Rest Encryption
- Enable PostgreSQL Transparent Data Encryption (TDE) or disk-level encryption.  
- Encrypt any fallback backups or snapshots stored offsite.

### 4.3 Secret Management
- Do **NOT** commit secrets or API keys to source control.  
- Store secrets in AWS Secrets Manager, HashiCorp Vault, or similar.  
- Inject secrets into containers at runtime via environment variables or secret volumes.

### 4.4 Sensitive Data Handling
- Mask or redact PII (e.g., user emails) in logs.  
- Retain diagnosis history only for the configured period (e.g., 30 days), then purge.

---

## 5. API & Service Security

### 5.1 CORS & CSRF
- Configure CORS to allow only trusted origins (`https://example.com`).  
- Enable CSRF tokens in Next.js for state-changing POST/PUT/DELETE calls.

### 5.2 Rate Limiting & Throttling
- Implement rate limiting (e.g., 100 req/min per IP) on both Next.js API routes and Flask endpoints to mitigate brute-force and DoS attempts.

### 5.3 API Versioning & Contract
- Prefix API routes with `/v1/` and document them with OpenAPI/Swagger.  
- Use strict request/response schemas and reject unknown fields.

### 5.4 Least Privileged Service Accounts
- The Flask service account should connect to PostgreSQL with only the necessary roles (e.g., read/write on `symptoms`, `diagnoses`, but no `DROP` privileges).

---

## 6. Web Application Security Hygiene

### 6.1 Security Headers
- **Content-Security-Policy**: restrict scripts/styles to your CDN and self.  
- **X-Frame-Options**: `DENY` to prevent clickjacking.  
- **X-Content-Type-Options**: `nosniff`.  
- **Referrer-Policy**: `strict-origin-when-cross-origin`.

### 6.2 Secure Cookies
- Set `HttpOnly; Secure; SameSite=Strict` on all authentication cookies.

### 6.3 Subresource Integrity
- Use SRI attributes for any third-party CDN assets in the Next.js `_document.js`.

---

## 7. Infrastructure & Configuration

### 7.1 Docker & Deployment
- Build multi-stage Docker images to separate build and runtime.  
- Avoid SSH or root access in production containers.  
- Run containers with nonroot user IDs.

### 7.2 Network Segmentation
- Place the database in a private network segment.  
- Expose only necessary ports (e.g., 443 for the web, 5432 only to the backend).  
- Use security groups/firewall rules to restrict access.

### 7.3 Secrets & Environment
- Store Flask and Next.js environment variables in encrypted parameter stores, not in code.  
- Use dotenv only for local development; never in production.

### 7.4 Patching & Hardening
- Regularly update Node.js, Python, OS packages, and libraries.  
- Use CIS-benchmarked base images.  
- Disable debug and verbose stack traces in production builds.

---

## 8. Dependency Management

- Maintain lockfiles (`package-lock.json`, `Pipfile.lock`).  
- Perform automated SCA scans (e.g., Dependabot, Snyk) on each pull request.  
- Review advisories for transitive dependencies.
- Remove unused packages to minimize attack surface.

---

## 9. Monitoring, Logging & Incident Response

- Centralize logs with a secure logging service (e.g., ELK stack, CloudWatch).  
- Mask sensitive fields in logs.  
- Alert on anomalous behavior (e.g., repeated failed logins, excessive rate limiting hits).  
- Define and document an incident response plan, including roles, escalation, and communication.

---

**Adhering to these guidelines will help ensure the `padi-diagnosis-expert-system` remains secure, resilient, and maintainable as it evolves.**