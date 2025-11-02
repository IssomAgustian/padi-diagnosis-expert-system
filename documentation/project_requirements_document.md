# Project Requirements Document (PRD)

## 1. Project Overview

This project, named **padi-diagnosis-expert-system**, is a web-based expert system designed to help farmers and agronomists accurately diagnose rice plant diseases. It combines a **hybrid reasoning engine**—using forward chaining for deterministic rule matching and certainty factor calculations for probabilistic assessment—with a **modern, responsive frontend** built on Next.js. Once a disease is identified, it leverages a generative AI service (OpenAI/Gemini) to produce detailed, step-by-step treatment plans and medicine recommendations.

We’re building this to streamline the disease diagnosis process, reduce guesswork in the field, and provide actionable guidance in real time. Key success criteria include: 1) delivering accurate diagnoses (measured by expert validation), 2) a seamless user experience (page load times under 2 seconds, intuitive UI), and 3) reliable generative AI content (treatment plans rated “useful” by >80% of users). A solid developer experience—powered by Docker, TypeScript, and clear code organization—will ensure rapid feature additions and long-term maintainability.

## 2. In-Scope vs. Out-of-Scope

In-Scope (Version 1):
- User registration and login via **Google OAuth**.  
- Protected routes: `/dashboard/diagnosis` and `/dashboard/history`.  
- Symptom selection interface with checkbox components.  
- Two-phase diagnostic engine: forward chaining + certainty factor UI.  
- Generative AI integration for treatment recommendations.  
- Diagnosis history page with pagination (last 30 days).  
- Print-to-PDF functionality for individual reports.  
- Backend implemented in Flask (Python) with SQLAlchemy + PostgreSQL.  
- Frontend built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui.  
- Docker Compose setup covering frontend, backend, and database.  

Out-of-Scope (Later Phases):
- Admin dashboard for managing rules or training data.  
- Mobile-native apps (iOS/Android).  
- Offline/edge functionality.  
- Multi-language support beyond English.  
- User role management beyond basic authentication.  
- Third-party analytics or A/B testing integrations.  

## 3. User Flow

A new user lands on the public homepage and clicks **"Sign In with Google."** After completing the OAuth flow, they’re redirected to the `/dashboard` landing page. From there, they select **“Diagnose Now,”** which takes them to a symptom-selection form. The form lists all known rice-plant symptoms as checkboxes. The user picks applicable symptoms and clicks **“Diagnose.”**

Behind the scenes, the frontend sends the selected symptom IDs to the Flask backend (`POST /api/diagnose`). If a rule exactly matches, the system returns a complete diagnosis immediately. Otherwise, the user sees sliders next to each symptom asking for certainty levels (0–100%). After the user adjusts and submits certainty factors (`POST /api/calculate_certainty`), the final diagnosis is returned. The UI displays the disease name, explanation, and a **“View Treatment Plan”** button that fetches AI-generated recommendations. Users can then **print to PDF** or **save** the case. They may also navigate to **“History”** to see past 30-day records.

## 4. Core Features

- **Authentication & Access Control**: Secure Google OAuth sign-in, session management, and protected route guards.  
- **Symptom Selection UI**: Dynamic checkbox list for symptoms, responsive layout using shadcn/ui.  
- **Forward Chaining Engine**: Rule-based matching on the backend to identify diseases with absolute certainty.  
- **Certainty Factor Workflow**: Conditional UI to collect user confidence levels and calculate probabilistic scores.  
- **Generative AI Integration**: Flask service calls OpenAI/Gemini to generate detailed treatment steps and medicine advice.  
- **Diagnosis History**: Paginated table of past diagnoses (30-day window), with symptom, CF values, and result.  
- **Print-to-PDF**: Client-side PDF generation for individual reports (using `react-to-print` or equivalent).  
- **Dockerized Environment**: Single `docker-compose.yml` to orchestrate Next.js, Flask, and PostgreSQL.  

## 5. Tech Stack & Tools

- Frontend: Next.js (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui components.  
- Backend: Flask (Python 3.10+), SQLAlchemy ORM, PostgreSQL database.  
- AI/ML: OpenAI API (GPT-4/GPT-4o) or Google Gemini via HTTP.  
- Containerization: Docker & Docker Compose.  
- State Management (optional): Zustand or Jotai for multi-step flow.  
- Testing: Playwright or Cypress for end-to-end tests.  
- IDE & Plugins: VS Code with Docker, Python, and TypeScript extensions; Cursor for AI-assisted coding (optional).  

## 6. Non-Functional Requirements

- **Performance**: Page loads under 2 seconds. API responses under 1 second for primary endpoints. CF calculation under 500 ms.  
- **Security**: HTTPS everywhere, strict Content Security Policy, input validation & sanitization, CSRF protection on forms, token-based session handling.  
- **Compliance**: 30-day data retention for history, optional user data deletion on request (GDPR-friendly).  
- **Usability**: WCAG AA accessibility compliance, responsive design for desktop & tablet, clear error/success messages.  
- **Scalability**: Stateless frontend & backend, horizontal scaling via Docker containers or Kubernetes if needed.  

## 7. Constraints & Assumptions

- The OpenAI/Gemini API key is available and rate limits (e.g., 60 RPM) must be respected.  
- Users have modern browsers (Chrome, Firefox, Safari) with JavaScript enabled.  
- PostgreSQL service is reachable via Docker network.  
- Flask backend will run on a known base URL (e.g., `http://localhost:5000`).  
- We assume 30-day history retention; deletion logic runs nightly.  

## 8. Known Issues & Potential Pitfalls

- **AI Rate Limits & Costs**: Hitting API limits could delay treatment plan generation. Mitigation: cache AI responses, implement exponential backoff.  
- **Generative AI Variability**: Responses may vary in quality. Mitigation: enforce prompt templates, post-process for consistency.  
- **Certainty Factor Rounding**: Floating-point errors can skew results. Mitigation: use decimal libraries or consistent rounding rules.  
- **Cross-Origin Calls**: Frontend–backend CORS must be configured correctly.  
- **Large Symptom Lists**: Very long checkbox lists could hurt performance. Mitigation: lazy load or paginate symptom sections.  
- **PDF Rendering Quirks**: Different browsers handle CSS for print differently. Mitigation: test in major browsers, use print-specific styles.

---

This PRD serves as the single source of truth for building the padi-diagnosis-expert-system. With these details in place, the subsequent Tech Stack, Frontend Guidelines, Backend Structure, and other documents can be drafted unambiguously.