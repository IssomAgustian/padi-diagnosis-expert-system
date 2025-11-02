# Frontend Guideline Document

This document describes the frontend setup for the **padi-diagnosis-expert-system**, a Next.js-based starter project tailored to host a rice disease expert system. It covers architecture, design principles, styling, components, state management, routing, performance, testing, and a final summary.

## 1. Frontend Architecture

### 1.1 Technology Stack
- **Next.js (App Router)**: File-based routing, server-side rendering, API routes (replaced by Flask).  
- **React 19 & TypeScript**: Typed components, interfaces for API data, improved refactoring and IDE support.  
- **Tailwind CSS & shadcn/ui**: Utility-first styling plus accessible, pre-built component library.  
- **HTTP API Client**: Centralized `lib/api-client.ts` for calls to the Flask service (e.g. `/api/diagnose`, `/api/history`).  
- **Docker Compose**: Orchestrates the Next.js frontend, Flask backend, and PostgreSQL database in development.

### 1.2 Scalability, Maintainability & Performance
- **Component-Based Layout**: Breaking UI into reusable pieces speeds up new feature development and ensures consistency.  
- **Type Safety**: Shared TypeScript interfaces for request/response payloads reduce runtime errors.  
- **Separation of Concerns**: Frontend only handles presentation; all business logic, data storage, and AI calls reside in the Flask API.  
- **Built-in Optimizations**: Next.js handles code splitting, static asset serving, and image optimization out of the box.

## 2. Design Principles

### 2.1 Usability
- Provide clear labels and affordances—buttons describe their actions (e.g., “Diagnose Now,” “Save History”).  
- Multi-step forms guide users through symptom selection, certainty input, and result review.

### 2.2 Accessibility
- Rely on **shadcn/ui** components with built-in ARIA roles.  
- Ensure keyboard navigation and focus management on forms and modal dialogs.  
- Use semantic HTML (`<label>`, `<fieldset>`, `<legend>`) for form controls.

### 2.3 Responsiveness
- Mobile-first breakpoints in Tailwind (`sm`, `md`, `lg`, `xl`).  
- Flexbox and CSS Grid for adaptable layouts: symptom list, slider inputs, and tables collapse gracefully on smaller screens.

### 2.4 Consistency & Simplicity
- Follow **KISS** (Keep It Simple, Stupid) and **DRY** (Don’t Repeat Yourself) principles in both markup and styling.  
- Centralize colors, fonts, and spacing in the Tailwind configuration to avoid magic values.

## 3. Styling and Theming

### 3.1 Styling Approach
- **Utility-First CSS** with **Tailwind**—no BEM or SMACSS.  
- Minimal custom CSS: use `@tailwind base components utilities`, and override in `tailwind.config.js` when needed.

### 3.2 Theming
- **Light & Dark Mode** via the `class` strategy in `tailwind.config.js`.  
- CSS variables for primary color accents, backgrounds, and text.  
- Dark mode toggled automatically via user preference or manual switch in the header.

### 3.3 Visual Style
- **Modern Flat Design**: Subtle shadows, rounded corners (Tailwind’s `rounded-lg`), and smooth hover states.  
- Occasional glassmorphism elements (semi-transparent backdrops) on modals and result cards for emphasis.

### 3.4 Color Palette
- Primary: #4CAF50 (Green)  
- Secondary: #FFC107 (Amber)  
- Success: #00C853 (Bright Green)  
- Warning: #FF6F00 (Dark Amber)  
- Error: #D32F2F (Red)  
- Neutral:  
  • Light Gray: #F5F5F5  
  • Medium Gray: #9E9E9E  
  • Dark Gray: #212121

### 3.5 Typography
- **Font Family**: Inter, sans-serif fallback.  
- **Weights**: 400 (regular), 500 (medium), 700 (bold) for headings and emphasis.  
- **Line Height**: 1.5 for body text, 1.3 for headings.

## 4. Component Structure

### 4.1 Folder Organization
```
/app                   # Next.js App Router pages and layouts
/components            # Reusable React components
  /auth                # SignInButton, SignOutButton
  /diagnosis           # SymptomSelector, CertaintySlider, ResultsCard
  /ui                  # Button, Card, Modal (shadcn/ui wrappers)
/lib                   # Shared utilities (api-client.ts, types.ts)
/public                # Static assets (images, icons)
```

### 4.2 Reusability & Single Responsibility
- Each component focuses on one piece of UI or logic.  
- For example, `SymptomSelector` handles only checkboxes and labels; `DiagnosisForm` composes multiple selectors and sliders.

### 4.3 Benefits
- **Discoverability**: Developers know where to add or find components.  
- **Consistency**: UI elements stay uniform across diagnosis, history, and dashboard pages.  
- **Testability**: Small components are easier to unit-test in isolation.

## 5. State Management

### 5.1 Local State
- **React Hooks** (`useState`, `useEffect`) for page-specific state (e.g. text input, modal open/close).

### 5.2 Global State
- **Zustand** (recommended) or **React Context** for cross-page state:  
  • Authentication status and user profile.  
  • Ongoing diagnosis data (selected symptoms, certainty factors).  

### 5.3 Data Fetching & Caching
- **SWR** or **React Query** can be used to fetch and cache API responses (symptom list, history pages).  
- Automatic revalidation, error handling, and loading indicators simplify the UX.

## 6. Routing and Navigation

### 6.1 File-Based Routing
- **`app/` directory**:  
  • `/sign-in` & `/sign-up` for authentication.  
  • `/dashboard/diagnosis` for the main expert system form.  
  • `/dashboard/history` for paginated results.

### 6.2 Layouts & Protected Routes
- Shared `app/layout.tsx` with header, footer, and `<ContextProvider>`.  
- **Route Protection** via client component in layout or middleware: redirect to `/sign-in` if unauthenticated.

### 6.3 Navigation UI
- **Navbar** uses `next/link` for client-side transitions.  
- Active link highlight via Tailwind’s `border-b-2` utility.

## 7. Performance Optimization

### 7.1 Code Splitting & Lazy Loading
- **Next.js automatic splitting** by page.  
- Use `dynamic(() => import('./HeavyComponent'), { ssr: false })` for rarely used or heavy modules (e.g., PDF print UI).

### 7.2 Asset Optimization
- **Next/Image** for responsive, optimized images.  
- SVG icons where possible—inline or via `<Image>`.

### 7.3 Caching & Data Fetching
- **HTTP caching headers** on Flask responses.  
- **SWR stale-while-revalidate** to avoid blocking UI on data refresh.

### 7.4 Bundle Analysis
- Integrate `@next/bundle-analyzer` in development to spot large dependencies and prune unused code.

## 8. Testing and Quality Assurance

### 8.1 Unit & Integration Tests
- **Jest** + **React Testing Library**:  
  • Test individual components (`SymptomSelector`, `ResultsCard`).  
  • Integration tests for multi-step `DiagnosisForm` flows.

### 8.2 End-to-End Tests
- **Playwright** or **Cypress**:  
  • Simulate user sign-in (Google OAuth stub).  
  • Full diagnosis flow: symptom selection → certainty sliders → result page.  

### 8.3 Linting & Formatting
- **ESLint** with `eslint-config-next` for code standards.  
- **Prettier** for consistent formatting.  
- **TypeScript** `tsc --noEmit` in CI to enforce type safety.

### 8.4 Continuous Integration
- Run tests, lint, and type checks on every PR via GitHub Actions or similar.

## 9. Conclusion and Overall Frontend Summary

This frontend guideline lays out a clear, opinionated path for building the rice diagnosis expert system UI. By leveraging Next.js, TypeScript, Tailwind CSS, and shadcn/ui, the project ensures:  

- **Scalability**: Component-driven architecture adapts as features grow.  
- **Maintainability**: Typed interfaces, shared utilities, and a modular folder structure keep code organized.  
- **Performance**: Built-in Next.js optimizations, dynamic imports, and caching strategies deliver a snappy user experience.  
- **Accessibility & Responsiveness**: Pre-built UI components, semantic markup, and mobile-first styling cover a wide range of users.  

Unique to this setup is the clean separation between the Next.js frontend and the Flask backend, allowing domain experts to focus on expert system logic in Python while frontend developers concentrate on delivering a polished, user-friendly interface. This clear delineation of responsibilities, combined with robust developer tooling and testing practices, distinguishes this project as both developer-friendly and user-centric.