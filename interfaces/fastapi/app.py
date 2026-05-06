from __future__ import annotations

from fastapi import FastAPI

from engine.core.engine import build_default_engine
from engine.models import (
    EngineResponse,
    EvaluateRequest,
    EvaluateResponse,
    GenerateRequest,
    GenerateResponse,
    QueryRequest,
    RetrieveRequest,
    RetrieveResponse,
    RewriteRequest,
    RewriteResponse,
)

app = FastAPI(title="Iteria API", version="0.1.0")
engine = build_default_engine()


@app.get("/api/v1/iteria/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/iteria/query", response_model=EngineResponse)
def query(req: QueryRequest) -> EngineResponse:
    return engine.answer(
        req.query,
        max_iterations=req.max_iterations,
        top_k=req.top_k,
        debug=req.debug,
    )


@app.post("/api/v1/iteria/retrieve", response_model=RetrieveResponse)
def retrieve(req: RetrieveRequest) -> RetrieveResponse:
    top_k = req.top_k or engine.settings.top_k
    retrieved = engine.retriever.retrieve(req.query, top_k=top_k)
    return RetrieveResponse(retrieved=retrieved)


@app.post("/api/v1/iteria/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest) -> GenerateResponse:
    draft = engine.generator.generate(req.query, contexts=req.contexts)
    return GenerateResponse(draft=draft)


@app.post("/api/v1/iteria/evaluate", response_model=EvaluateResponse)
def evaluate(req: EvaluateRequest) -> EvaluateResponse:
    critic = engine.critic.evaluate(req.query, draft=req.draft, contexts=req.contexts)
    return EvaluateResponse(critic=critic)


@app.post("/api/v1/iteria/rewrite", response_model=RewriteResponse)
def rewrite(req: RewriteRequest) -> RewriteResponse:
    rewritten = engine.rewriter.rewrite(req.query, critic_feedback=req.feedback, draft=req.draft)
    return RewriteResponse(rewritten_query=rewritten)
