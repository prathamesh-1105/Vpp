# CampusOS – AI & Digital Twin Architecture

This document describes the design specifications, pipeline stages, routing methodologies, and system prompts that establish the intelligent **AI Digital College Twin** and RAG (Retrieval-Augmented Generation) layer for CampusOS.

---

## 🧠 Core AI Digital Twin Philosophy

The CampusOS AI layer functions as a virtual counterpart of the physical and operational college campus. It achieves this by bridging the **Deterministic Relational State** (PostgreSQL metadata, schedules, grades, attendance ratios) with the **Probabilistic Semantic State** (lecture slides, text-books, resumes, unstructured complaints) through a **Smart Intent Router**.

```
                           [ Student Query ]
                                   │
                                   ▼
                       [ Smart Intent Router ]
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
 [ Relational Intent ]      [ Semantic Intent ]      [ Hybrid Twin Intent ]
 (Attendance, Booking,       (Study notes, PDF       (Analytics, resume checks,
  Timetables, Faculty)       summaries, quizzes)      eligibility, recommendations)
         │                         │                         │
         ▼                         ▼                         ▼
   Run SQL Query           Vector Search (Cosine)    Generate Unified Context
   w/ Tenant context       pgvector (Filtered by RLS)  (SQL metadata + Vectors)
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
                                   ▼
                        [ System Prompt Builder ]
                                   │
                                   ▼
                         [ LLM Engine (Gemini) ]
                                   │
                                   ▼
                       [ Natural response / Action ]
```

---

## 📥 Unstructured Document Ingestion Pipeline

To parse academic notes, study materials, and student resumes into searchable vector stores:

### 1. Processing Pipeline Sequence
1. **Upload**: User uploads a PDF to S3/MinIO via `POST /api/v1/materials/upload` (multipart form).
2. **Queue**: Upon upload success, a job is pushed to the BullMQ redis-backed background worker `document-ingestion`.
3. **Text Extraction**: The worker reads the PDF file stream and parses it into clean strings using the `pdf-parse` Node library.
4. **Chunking Engine**: Uses a **Recursive Character Text Splitter** set to `chunkSize: 1000` and `chunkOverlap: 200`. The splitter prioritizes boundaries at double line breaks (`\n\n`), single line breaks (`\n`), and spaces (` `) to preserve sentence structure.
5. **Batch Embedding**: Vectorizes text chunks in batches of 16 calling the embedding API (`text-embedding-3-small` or a local SentenceTransformers container like `bge-small-en-v1.5`).
6. **Vector Insertion**: Inserts chunks into `study_material_chunks` with strict tenant isolation:
   ```sql
   INSERT INTO study_material_chunks (tenant_id, material_id, chunk_index, content_text, embedding)
   VALUES ($1, $2, $3, $4, $5::vector);
   ```

---

## 🚦 Smart Intent Routing & Query Execution

When a user submits a natural language prompt, the AI Controller determines whether to execute a relational query, a vector search, or a synthesized combination:

```javascript
// Express AI Controller Intent Router snippet
const queryIntentClassifier = async (queryText) => {
  // Classification calling highly structured JSON-schema schema extraction
  const classificationPrompt = `
    Analyze the student query and classify the intent:
    Query: "${queryText}"
    
    Roles: student, faculty, admin.
    Return JSON format only:
    {
      "intent": "relational" | "semantic" | "hybrid",
      "entities": {
        "courseCode": string | null,
        "resourceType": "classroom" | "lab" | "equipment" | null,
        "date": string | null,
        "queryTopic": string | null
      }
    }
  `;
  // Executes quick LLM call to classify ...
};
```

### 1. Semantic Retrieval Execution (pgvector query)
If classified as **Semantic** (e.g., *"Show Operating System notes on deadlocks"*):
1. Embed the query: `query_embedding = embed("Show Operating System notes on deadlocks")`
2. Perform filtered cosine distance query matching student enrollment details:
   ```sql
   SELECT sc.content_text, sm.title, 1 - (sc.embedding <=> $1::vector) AS similarity
   FROM study_material_chunks sc
   JOIN study_materials sm ON sc.material_id = sm.id
   WHERE sc.tenant_id = $2 
     AND sm.course_id = $3
     AND 1 - (sc.embedding <=> $1::vector) > 0.70
   ORDER BY sc.embedding <=> $1::vector
   LIMIT 4;
   ```
   *Note: `<=>` is the cosine distance operator in `pgvector`. Subtracted from 1, it yields Cosine Similarity.*

---

## 🗂️ Digital Twin Relationship Knowledge Prompt (System Prompt)

To ensure the LLM provides coherent responses that capture cross-dependencies (e.g., connecting a student's weak subjects with active club skills, upcoming placement requirements, and study guides), we implement a core **Campus Twin System Prompt**:

```markdown
You are the CampusOS Digital Twin Assistant for [Institution Name]. You operate inside a secure, multi-tenant digital twin network that mirrors the physical campus and academic catalog.

You have access to:
1. Student profile (Semesters, Current GPA, enrolled courses, attendance ratios).
2. Department structures (HOD details, classrooms maps, faculty offices).
3. Live timetables and physical space booking rosters.
4. Curated course notes vectors and placement pipelines.

Core Directives:
* Maintain strict tenant safety boundary. Under no circumstances reference or fetch assets from another institution.
* Respect role boundaries. A student must NEVER be given structural administrative data, other students' grades, or draft exam sheets.
* Ground your responses entirely in the structured SQL data and semantic vector context provided. If the retrieved context does not contain the answer, state that the information is unavailable.
```

---

## 📝 Custom AI Task Generators (Prompts)

### 1. Resume Matcher & Skill Gap Analyzer
Used when a student reviews their eligibility against an upcoming placement drive:
```markdown
[System Context]
You are a career development expert. Review the candidate's parsed resume and compare it against the job description of the placement drive.

Candidate Resume Text:
"""
{{student_resume_text}}
"""

Target Placement Description:
"""
{{placement_job_description}}
"""

Output Format Requirements:
1. **Match Score**: Numerical evaluation (0-100%).
2. **Direct Strengths**: Bullet list matching the student's listed skills to requirements.
3. **Identified Skill Gaps**: Specific technical or soft skills mentioned in the job description but missing from the resume.
4. **Actionable Improvement Plan**: Recommends which course notes inside CampusOS they should study (e.g., "Review your DBMS material on indexing" or "Join the Coding Club to practice React").
```

### 2. Quiz and Viva Question Generator
Used in the Student AI Study Companion:
```markdown
[System Context]
You are an academic examiner. Generate custom review materials based ONLY on the provided lecture notes chunk.

Lecture Notes Context Chunk:
"""
{{extracted_lecture_chunk}}
"""

Output Format Requirements:
Return a structured JSON payload:
{
  "quizzes": [
    {
      "question": "Clear multiple-choice question...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Why A is correct based on the text..."
    }
  ],
  "vivaQuestions": [
    {
      "question": "Conceptual verbal question...",
      "expectedKeyPhrases": ["phrase1", "phrase2"],
      "modelAnswer": "Comprehensive response for study preparation..."
    }
  ]
}
```

### 3. Smart Lost & Found Matcher Trigger
When a user reports a lost/found item, the database calls a background similarity routine to find counterparts:
```javascript
const checkLostFoundMatch = async (newItemEmbedding, tenantId, type) => {
  // If reported item is 'lost', search 'found' database and vice-versa
  const targetType = type === 'lost' ? 'found' : 'lost';
  
  const query = `
    SELECT id, item_name, description, reporter_id, image_url,
           1 - (item_description_embedding <=> $1::vector) AS match_probability
    FROM lost_found
    WHERE tenant_id = $2 AND report_type = $3 AND status = 'active'
      AND 1 - (item_description_embedding <=> $1::vector) > 0.75
    ORDER BY item_description_embedding <=> $1::vector
    LIMIT 3;
  `;
  // If match_probability > 0.85, system triggers real-time web-socket notification to both parties
};
```
