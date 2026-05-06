# Iteria — Core Architecture (Engine)

This document defines the **core (engine/core)** architecture you can follow as you build Iteria.
It’s designed so the agentic reasoning loop works even before the vector DB ingestion is complete.

## Responsibilities (core/)

- `retriever.py`
  - Input: query
  - Output: `RetrievedItem[]` (ranked chunks)
  - Default implementation: `SimpleLocalDocsRetriever` (fallback for local `data/docs/*.txt`)
  - Later: replace with vector-store retriever (Chroma/Pinecone) without changing engine logic

- `generator.py`
  - Input: query + retrieved chunks
  - Output: `DraftAnswer` (answer + citations)
  - Current implementation is **extractive** (quotes/summarizes retrieved text)
  - Later: swap in LLM-backed generator

- `critic.py`
  - Input: query + draft + retrieved chunks
  - Output: `CriticResult` with 3 scores + overall + retry decision
  - Enforces: groundedness, relevance, completeness

- `rewriter.py`
  - Input: query + critic feedback + draft
  - Output: rewritten query for the next iteration

- `engine.py`
  - Iteration controller:
    - retrieve → generate → critique → accept OR rewrite → repeat
    - stops at `max_iterations` or when critic accepts

## Data Contracts

All request/response objects live in `engine/models.py` (Pydantic models):
- `RetrievedItem`, `DraftAnswer`, `CriticResult`, `EngineResponse`, etc.

## Sequence Diagram

```mermaid
sequenceDiagram
  participant U as User
  participant API as FastAPI
  participant E as IteriaEngine
  participant R as Retriever
  participant G as Generator
  participant C as Critic
  participant W as Rewriter

  U->>API: POST /api/v1/iteria/query {query}
  API->>E: answer(query)

  loop i = 1..max_iterations
    E->>R: retrieve(query_i, top_k)
    R-->>E: contexts_i
    E->>G: generate(query_i, contexts_i)
    G-->>E: draft_i
    E->>C: evaluate(query_i, draft_i, contexts_i)
    C-->>E: critic_i (scores + should_retry)

    alt accept
      E-->>API: EngineResponse(answer=draft_i)
      API-->>U: final answer
    else retry
      E->>W: rewrite(query_i, critic.feedback, draft_i)
      W-->>E: query_{i+1}
    end
  end

  Note over E: If max iterations reached, return best-scored draft
```

## Interface Layer (FastAPI)

FastAPI lives in `interfaces/fastapi/app.py` and exposes:
- `/api/v1/iteria/query`
- `/api/v1/iteria/retrieve`
- `/api/v1/iteria/generate`
- `/api/v1/iteria/evaluate`
- `/api/v1/iteria/rewrite`
- `/api/v1/iteria/health`

## Using uv (Package Manager)

From repo root:

```powershell
uv sync
uv run uvicorn interfaces.fastapi.app:app --reload --port 8000
```

Then open:
- `http://127.0.0.1:8000/docs` (Swagger UI)

## Notes
- The current retriever is a **fallback** that searches local text files in `data/docs/`.
- As Ishan’s `engine/rag/*` vector store becomes ready, you only need to swap the retriever implementation.
