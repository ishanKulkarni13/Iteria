from __future__ import annotations

from typing import Protocol

from engine.models import Citation, DraftAnswer, RetrievedItem


class BaseGenerator(Protocol):
    def generate(self, query: str, *, contexts: list[RetrievedItem]) -> DraftAnswer:
        raise NotImplementedError


class ExtractiveGroundedGenerator:
    """Produces an answer by quoting/summarizing retrieved chunks.

    This keeps the pipeline runnable without an external LLM, while enforcing groundedness.
    """

    def __init__(self, *, max_quotes: int = 3, max_quote_chars: int = 320) -> None:
        self._max_quotes = max_quotes
        self._max_quote_chars = max_quote_chars

    def generate(self, query: str, *, contexts: list[RetrievedItem]) -> DraftAnswer:
        if not contexts:
            return DraftAnswer(
                text=(
                    "I couldn't find any relevant context in the knowledge base for this query. "
                    "Try rephrasing the question with more specific keywords."
                ),
                citations=[],
            )

        chosen = contexts[: self._max_quotes]
        citations: list[Citation] = []
        lines: list[str] = [
            "Based on the retrieved documents, here is what I can answer using only that context:",
            "",
        ]

        for idx, item in enumerate(chosen, start=1):
            quote = item.text.strip().replace("\n", " ")
            if len(quote) > self._max_quote_chars:
                quote = quote[: self._max_quote_chars].rstrip() + "…"

            citations.append(Citation(chunk_id=item.chunk_id, quote=quote))
            lines.append(f"{idx}. {quote} [source: {item.chunk_id}]")

        lines.append("")
        lines.append("If you want, I can refine the query to retrieve more relevant chunks.")
        return DraftAnswer(text="\n".join(lines).strip(), citations=citations)
