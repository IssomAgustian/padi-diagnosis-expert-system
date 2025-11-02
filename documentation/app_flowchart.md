flowchart TD
    A[Landing Page] --> B[Sign In Page]
    B --> C{Is Authenticated?}
    C -->|No| B
    C -->|Yes| D[Dashboard]
    D --> E[Diagnosis Page]
    D --> F[History Page]
    E --> G[Fetch Symptoms]
    G --> H[Select Symptoms]
    H --> I{Match Rule}
    I -->|Yes| J[Show Diagnosis Result]
    I -->|No| K[Ask Certainty Factors]
    K --> L[Submit Certainty Factors]
    L --> M[Calculate Final Diagnosis]
    M --> J
    J --> N[Print to PDF]
    J --> O[Save to History]
    J --> P[Diagnose Again]
    F --> Q[Fetch History]
    Q --> R[Show Paginated History]
    R --> P