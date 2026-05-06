from __future__ import annotations

import re

from engine.config.settings import Settings
from engine.models import CriticResult, CriticScores, DraftAnswer, RetrievedItem


def _tokenize(text: str) -> set[str]:
    return {t for t in re.findall(r"[a-zA-Z0-9]{2,}", text.lower())}


class SimpleCritic:
    """Heuristic critic that scores groundedness/completeness/relevance.

    Replace later with an LLM-based critic if desired.
    """

    def __init__(self, *, settings: Settings) -> None:
        self._settings = settings

    def evaluate(self, query: str, *, draft: DraftAnswer, contexts: list[RetrievedItem]) -> CriticResult:
        query_tokens = _tokenize(query)
        answer_tokens = _tokenize(draft.text)

        # Relevance: how much of the query vocabulary appears in the answer.
        if not query_tokens:
            relevance = 0.0
        else:
            relevance = len(query_tokens & answer_tokens) / len(query_tokens)

        # Completeness (heuristic): coverage of query tokens + presence of at least one
        # concrete statement (we approximate by requiring minimum answer length).
        length_bonus = 1.0 if len(draft.text.strip()) >= 60 else 0.5
        completeness = min(1.0, relevance * 0.7 + 0.3 * length_bonus)

        # Groundedness: citations exist and reference retrieved chunks; quoted text must
        # come from those chunks.
        retrieved_ids = {c.chunk_id for c in contexts}
        quoted_ok = 0
        for citation in draft.citations:
            if citation.chunk_id not in retrieved_ids:
                continue
            if citation.quote is None:
                quoted_ok += 1
                continue
            # quote should be a substring of its referenced context
            ctx = next((c for c in contexts if c.chunk_id == citation.chunk_id), None)
            if ctx:
                quote_norm = " ".join(citation.quote.replace("…", "").split())
                ctx_norm = " ".join(ctx.text.split())
                if quote_norm[:40] and quote_norm[:40] in ctx_norm:
                    quoted_ok += 1

        groundedness = 0.0
        if draft.citations:
            groundedness = quoted_ok / len(draft.citations)

        overall = float(
            0.45 * groundedness + 0.30 * relevance + 0.25 * completeness
        )

        missing_terms: list[str] = []
        if query_tokens:
            missing_terms = sorted(list(query_tokens - answer_tokens))[:8]

        feedback_parts: list[str] = []
        if not contexts:
            feedback_parts.append("No context was retrieved.")
        if groundedness < self._settings.min_groundedness:
            feedback_parts.append(
                "Low groundedness: add explicit citations or remove unsupported claims."
            )
        if relevance < self._settings.min_relevance:
            feedback_parts.append("Low relevance: answer does not align with the question.")
        if completeness < self._settings.min_completeness:
            feedback_parts.append("Low completeness: the answer is missing requested details.")
        if missing_terms:
            feedback_parts.append(f"Missing terms: {', '.join(missing_terms)}")

        feedback = " ".join(feedback_parts).strip() or "Looks good."

        should_retry = (
            overall < self._settings.accept_overall_threshold
            or groundedness < self._settings.min_groundedness
            or relevance < self._settings.min_relevance
            or completeness < self._settings.min_completeness
            or not contexts
        )

        return CriticResult(
            scores=CriticScores(
                groundedness=float(groundedness),
                completeness=float(completeness),
                relevance=float(relevance),
                overall=float(overall),
            ),
            feedback=feedback,
            should_retry=bool(should_retry),
        )
