# Tech Stack Document

## Frontend Technologies

The frontend of the expert system is built with modern JavaScript frameworks, libraries, and styling tools to deliver a fast, responsive, and user-friendly interface.

- **Next.js (App Router)**
  - Provides file-based routing, server-side rendering, and static generation.
  - Makes page transitions smooth and improves initial load times.
- **React 19 & TypeScript**
  - Enables building interactive UI components with type safety.
  - Reduces runtime errors and makes the code easier to maintain.
- **Tailwind CSS & shadcn/ui**
  - Tailwind offers utility-first CSS classes for rapid styling.
  - shadcn/ui supplies a collection of accessible, pre-built React components (e.g., buttons, forms, tables).
- **State Management (Zustand or Jotai)**
  - Manages multi-step diagnosis state (selected symptoms, certainty values) in a predictable way.
  - Keeps UI state decoupled from API logic, making components simpler.
- **react-to-print**
  - Enables a built-in “Print to PDF” feature so users can export their diagnosis reports directly from the browser.

Together, these tools create a cohesive and maintainable frontend that feels snappy and guides users through symptom selection, certainty input, and results review.

## Backend Technologies

The backend powers the core diagnosis logic, user management, and data storage. It runs as a standalone Flask service that the Next.js frontend talks to via HTTP.

- **Flask (Python)**
  - Lightweight web framework for building RESTful APIs.
  - Easy to extend with community libraries and supports clear project structure.
- **SQLAlchemy (ORM)**
  - Maps Python classes to PostgreSQL tables for Users, Symptoms, Diseases, Rules, and History.
  - Simplifies database interactions and migrations.
- **PostgreSQL**
  - Relational database for storing user accounts, symptom/disease definitions, rule base, and diagnosis history.
  - Reliable, ACID-compliant, and scales with Docker.
- **Expert System Logic**
  - **Forward Chaining**: Matches symptom combinations against a rule base for direct diagnoses.
  - **Certainty Factor Calculations**: Applies probabilistic reasoning when rules alone are inconclusive.
- **Generative AI Integration (OpenAI or Gemini)**
  - After identifying a disease, the backend calls an AI model to generate detailed treatment steps and medicine recommendations.

This separation of concerns ensures the frontend focuses on UI, while Flask handles authentication, diagnosis algorithms, and data storage.

## Infrastructure and Deployment

To keep development and deployment consistent, we containerize and automate the entire stack.

- **Docker & Docker Compose**
  - Defines services for the Next.js frontend, Flask API, and PostgreSQL database in a single `docker-compose.yml`.
  - Ensures every developer runs the same environment locally and in production.
- **Version Control: Git & GitHub**
  - Organizes code in a Git repository, enabling branch-based workflows and code reviews.
- **CI/CD: GitHub Actions**
  - Automates linting, type checking, and end-to-end tests (e.g., Playwright or Cypress) on every pull request.
  - Builds Docker images and can deploy to hosting platforms.
- **Hosting Options**
  - **Frontend**: Can deploy on Vercel or any container host (AWS ECS, DigitalOcean App Platform).
  - **Backend & Database**: Run in Docker containers on a cloud VM, Kubernetes cluster, or managed container service.

This setup promotes reliability, quick iteration, and easy rollbacks in case of issues.

## Third-Party Integrations

Several external services enhance the application’s functionality:

- **Google OAuth 2.0**
  - Enables users to sign in with their Google accounts.
  - Simplifies onboarding and leverages Google’s secure authentication flow.
- **OpenAI / Gemini API**
  - Generates human-readable treatment plans and medicine advice based on AI prompts.
  - Reduces manual content creation and provides detailed, up-to-date recommendations.

These integrations allow us to focus on core functionality while relying on proven services for authentication and content generation.

## Security and Performance Considerations

We’ve put security and speed at the forefront to protect user data and ensure a smooth experience.

Security Measures:
- **OAuth & Session Management**: Uses secure cookies, HTTPS, and CSRF protection for all authenticated routes.
- **Environment Variables**: Secrets (API keys, database credentials) are stored outside code in `.env` files or a secret manager.
- **Input Validation & Sanitization**: Validates all requests on the Flask side to prevent injection attacks.
- **CORS Configuration**: Restricts API access only to approved frontend origins.

Performance Optimizations:
- **Server-Side Rendering (SSR) & Static Generation**: Next.js pre-renders common pages for faster first load.
- **Code Splitting & Lazy Loading**: Splits large bundles and loads only what’s needed for each page.
- **Database Indexing**: Adds indexes to frequently queried fields (e.g., user ID, date) to speed up history lookups.
- **Caching Strategies**: Uses HTTP caching headers and can introduce Redis if needed for high-traffic endpoints.

By combining these measures, we protect user data while delivering a responsive UI even under load.

## Conclusion and Overall Tech Stack Summary

This expert system for rice plant disease diagnosis is built on a modern, maintainable, and performant foundation:

- Frontend: Next.js, React 19, TypeScript, Tailwind CSS, shadcn/ui, Zustand/Jotai, react-to-print
- Backend: Flask, SQLAlchemy, PostgreSQL, rule-based and certainty factor logic, AI integrations
- Infrastructure: Docker, Docker Compose, GitHub Actions, Git & GitHub, flexible hosting on Vercel or container services
- Integrations: Google OAuth for login, OpenAI/Gemini for treatment generation
- Security & Performance: OAuth flows, HTTPS, CSRF protection, input validation, SSR, code splitting, database indexing

Each technology was chosen to accelerate development, keep the system robust, and provide an intuitive user journey—from signing in, through symptom selection and diagnosis, to exporting a professional report. This stack ensures you can extend or modify any part of the system easily, focusing on the unique expert logic without rebuilding foundational tooling.