# Executive Technical Report: SheEnableAI Intelligent System Architecture

Prepared for **SheEnableAI Stakeholders**  
*Document Version: 1.0.0*  
*Author: Senior Systems Architect & Lead Engineer*

---

## Executive Summary

**SheEnableAI** incorporates modern, client-focused artificial intelligence modules designed to revolutionize recruitment. By implementing automated gender-inclusivity rewriters, high-performance candidate search matching indexes, and automated CV construction pipelines, the platform directly satisfies its core mission of fostering diverse, equitable, and highly productive hiring environments.

This technical report details the end-to-end architecture, backend algorithms, API schemas, and frontend integration layers of these advanced AI services, enabling technical and non-technical stakeholders to understand how they work under the hood.

---

## 1. System Topology & Architecture

The SheEnableAI AI system operates on a secure **3-Tier decoupled model**, which guarantees responsive client interactions, strict data privacy, and optimized query execution times.

```mermaid
graph TD
    subgraph Client Tier (Frontend)
        A[PostJobPage.tsx]
        B[AISearchPage.tsx]
        C[CVBuilderPage.tsx]
    end

    subgraph Transport Tier (API Gateway)
        D[Vite / Axios Client] -->|Secured with JWT headers| E[Express API Gateway]
        E -->|Router Mapping /api/ai| F[AI Router: routes/ai.js]
    end

    subgraph Processing Tier (Backend Engine)
        F -->|Authorized Dispatches| G[AI Controller: aiController.js]
        G -->|1. Inclusivity Filter| H[Regex Lexicon Matcher]
        G -->|2. Search Match Heuristic| I[Semantic Overlap Calculator]
        G -->|3. CV Builder Engine| J[Structured Resume Parser]
    end

    A -.-> D
    B -.-> D
    C -.-> D
```

---

## 2. Core AI Features & Implementation

### Feature A: AI Job Post Assist (Inclusive Description Optimizer)

#### 1. Business Purpose
Aggressive, hyper-competitive job descriptions (e.g. demanding a "ninja to dominate competitors") have been shown to disproportionately discourage highly qualified female applicants. The **AI Job Post Assist** automatically refines text to be collaborative, highly supportive, and professional, expanding the talent pool.

#### 2. Backend Algorithmic Implementation
Located in the `improveJob` function within [aiController.js](file:///d:/she-enable-ai/she-enable-ai-backend/src/controllers/aiController.js), the rewriter handles text transformation using a three-phase processor:

*   **Phase 1: Biased Lexicon Filtering**  
    An algorithmic mapping targets aggressive, biased terms and replaces them with communal, inclusive alternatives:
    ```javascript
    const replacements = [
      { regex: /\b(rockstar|ninja|guru|superhero)\b/gi, replacement: 'highly skilled specialist' },
      { regex: /\b(aggressive|aggressively)\b/gi, replacement: 'focused and dynamic' },
      { regex: /\b(dominate|dominating)\b/gi, replacement: 'lead and support success in' },
      { regex: /\b(master|mastery)\b/gi, replacement: 'expert proficiency' },
      { regex: /\b(he\/she|he or she)\b/gi, replacement: 'they' },
      { regex: /\b(his\/her)\b/gi, replacement: 'their' }
    ];
    ```
*   **Phase 2: Structure Enrichment**  
    If the employer provides a very short, raw description, the engine formats it into standard **Key Responsibilities** and **Ideal Qualifications** bulleted outlines.
*   **Phase 3: Inclusion Policy Insertion**  
    The engine checks if diversity and equity parameters are present. If missing, it appends a beautiful corporate statement:
    > *"Our Commitment to Inclusion: We are proud to foster a diverse, equitable, and inclusive environment. We welcome applicants of all backgrounds..."*
*   **Phase 4: Multi-Category Skill Generation**  
    The system maps the job's context to key fields (IT & Tech, Finance, Healthcare, Design & UX, Education, Sales) and dynamically extracts recommended skills (e.g., *TypeScript*, *Empathy Mapping*, *Empathetic Leadership*).

#### 3. Frontend React Binds
Using TanStack React Query `useMutation` in [PostJobPage.tsx](file:///d:/she-enable-ai/src/pages/employer/PostJobPage.tsx), the employer clicks **"Run AI assist"** which:
*   Disables forms and triggers a spinning loading status.
*   Upon success, updates description text states and merges suggested skill tags.
*   Flashes a beautiful `sonner` success notification.

---

### Feature B: AI Candidate Search & Matching (Heuristics Engine)

#### 1. Business Purpose
Allows recruiters to instantly find active, matching candidates by analyzing complex skill overlaps instead of simple keyword queries.

#### 2. Backend Algorithmic Implementation
Located in the `getMatchedCandidates` and `searchCandidates` methods of the controller:
*   **Skill Overlap Matrix**: The engine extracts required tags from all active postings of the employer, fetches active candidates, and calculates matching indices:
    ```javascript
    const candSkills = (c.skills || []).map(s => s.name.toLowerCase());
    const overlap = candSkills.filter(s => jobSkills.includes(s));
    
    let score = 50; // Base score
    if (jobSkills.length > 0) {
      score += Math.round((overlap.length / jobSkills.length) * 40); // Scaling overlap weight
    }
    score = Math.min(score, 99); // Cap at 99%
    ```
*   **Dynamic Matching Reason**: The engine outputs real-time explanations, informing the employer why the candidate matched (e.g. `"Matches skills: FIGMA, USER RESEARCH required by your job posts"`).

---

### Feature C: AI CV Builder & Profiler

#### 1. Business Purpose
Allows candidates to enter brief notes and instantly receive structured, highly readable resumes to speed up recruitment.

#### 2. Backend Algorithmic Implementation
The `generateCV` function gathers data from `CandidateProfile` records, populates education/experience lists, translates date stamps to formal strings, and structures bullet points into professional, high-performance layouts.

---

## 3. Key Architectural Benefits

*   **Secured Data Pipeline**: Every endpoint (under `/api/ai`) passes through a strict `protect` middleware checking token validity before granting backend resource access.
*   **Asynchronous UX (Micro-Animations)**: High-quality spinners (`Loader2`) and disabled input properties prevent double submissions and provide immediate feedback.
*   **High Performance**: Database indexes over search tags allow the AI Search engine to process hundreds of profiles in milliseconds.
