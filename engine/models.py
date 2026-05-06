from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class RetrievedItem(BaseModel):
    chunk_id: str
    text: str
    score: float = Field(ge=0)
    source: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class Citation(BaseModel):
    chunk_id: str
    quote: str | None = None


class DraftAnswer(BaseModel):
    text: str
    citations: list[Citation] = Field(default_factory=list)


class CriticScores(BaseModel):
    groundedness: float = Field(ge=0, le=1)
    completeness: float = Field(ge=0, le=1)
    relevance: float = Field(ge=0, le=1)
    overall: float = Field(ge=0, le=1)


class CriticResult(BaseModel):
    scores: CriticScores
    feedback: str
    should_retry: bool


class IterationTrace(BaseModel):
    iteration: int
    query: str
    retrieved: list[RetrievedItem]
    draft: DraftAnswer
    critic: CriticResult
    rewritten_query: str | None = None
    timings_ms: dict[str, int] = Field(default_factory=dict)


class EngineResponse(BaseModel):
    query: str
    answer: str
    accepted: bool
    iteration_count: int
    trace: list[IterationTrace] | None = None
    warnings: list[str] = Field(default_factory=list)


class QueryRequest(BaseModel):
    query: str = Field(min_length=1)
    max_iterations: int | None = Field(default=None, ge=1, le=10)
    top_k: int | None = Field(default=None, ge=1, le=50)
    debug: bool = False


class RetrieveRequest(BaseModel):
    query: str = Field(min_length=1)
    top_k: int | None = Field(default=None, ge=1, le=50)


class RetrieveResponse(BaseModel):
    retrieved: list[RetrievedItem]


class GenerateRequest(BaseModel):
    query: str = Field(min_length=1)
    contexts: list[RetrievedItem] = Field(default_factory=list)


class GenerateResponse(BaseModel):
    draft: DraftAnswer


class EvaluateRequest(BaseModel):
    query: str = Field(min_length=1)
    draft: DraftAnswer
    contexts: list[RetrievedItem] = Field(default_factory=list)


class EvaluateResponse(BaseModel):
    critic: CriticResult


class RewriteRequest(BaseModel):
    query: str = Field(min_length=1)
    draft: DraftAnswer
    feedback: str = Field(min_length=1)


class RewriteResponse(BaseModel):
    rewritten_query: str
