# Iteria API Endpoints

Base path: `/api/v1/iteria`

## POST /query
Runs the full Iteria loop (retrieve → generate → critique → rewrite if needed).

Request (`QueryRequest`):
- `query`: string
- `max_iterations` (optional): int (1..10)
- `top_k` (optional): int (1..50)
- `debug` (optional): bool

Response (`EngineResponse`):
- `answer`: string
- `accepted`: bool
- `iteration_count`: int
- `trace` (optional): list of iteration objects (present when `debug=true` or `accepted=false`)
- `warnings`: list[string]

## POST /retrieve
Retrieval-only debug endpoint.

Request (`RetrieveRequest`):
- `query`: string
- `top_k` (optional)

Response (`RetrieveResponse`):
- `retrieved`: list[`RetrievedItem`]

## POST /generate
Generator-only endpoint (uses provided contexts).

Request (`GenerateRequest`):
- `query`: string
- `contexts`: list[`RetrievedItem`]

Response (`GenerateResponse`):
- `draft`: `DraftAnswer`

## POST /evaluate
Critic-only endpoint (uses provided draft + contexts).

Request (`EvaluateRequest`):
- `query`: string
- `draft`: `DraftAnswer`
- `contexts`: list[`RetrievedItem`]

Response (`EvaluateResponse`):
- `critic`: `CriticResult`

## POST /rewrite
Query rewriter endpoint (uses provided draft + feedback).

Request (`RewriteRequest`):
- `query`: string
- `draft`: `DraftAnswer`
- `feedback`: string

Response (`RewriteResponse`):
- `rewritten_query`: string

## GET /health
Health check.

Response:
- `{ "status": "ok" }`
