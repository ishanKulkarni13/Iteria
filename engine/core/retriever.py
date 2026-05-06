from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from engine.config.settings import Settings
from engine.models import RetrievedItem


class BaseRetriever(Protocol):
    def retrieve(self, query: str, *, top_k: int) -> list[RetrievedItem]:
        raise NotImplementedError


def _tokenize(text: str) -> set[str]:
    return {t for t in re.findall(r"[a-zA-Z0-9]{2,}", text.lower())}


def _overlap_score(query: str, text: str) -> float:
    q = _tokenize(query)
    if not q:
        return 0.0
    d = _tokenize(text)
    return len(q & d) / len(q)


def _chunk_text(text: str, *, chunk_size: int, overlap: int) -> list[str]:
    if chunk_size <= 0:
        return [text]
    overlap = max(0, min(overlap, chunk_size - 1))

    chunks: list[str] = []
    start = 0
    text_len = len(text)
    while start < text_len:
        end = min(text_len, start + chunk_size)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == text_len:
            break
        start = end - overlap
    return chunks


@dataclass
class LocalDocsIndex:
    items: list[RetrievedItem]


class SimpleLocalDocsRetriever:
    """Fallback retriever that indexes local text files in `data/docs/`.

    This is intentionally simple so the core loop can be tested before the vector DB
    integration is ready.
    """

    def __init__(self, *, settings: Settings, docs_dir: str | Path = "data/docs") -> None:
        self._settings = settings
        self._docs_dir = Path(docs_dir)
        self._index = self._build_index()

    def _build_index(self) -> LocalDocsIndex:
        items: list[RetrievedItem] = []

        candidate_paths: list[Path] = []
        if self._docs_dir.exists():
            candidate_paths.extend(sorted(self._docs_dir.glob("*.txt")))

        # Also index project docs for a useful out-of-the-box demo.
        repo_root = Path(os.getcwd())
        readme = repo_root / "README.md"
        if readme.exists():
            candidate_paths.append(readme)

        docs_md_dir = repo_root / "docs"
        if docs_md_dir.exists():
            candidate_paths.extend(sorted(docs_md_dir.glob("*.md")))

        for path in candidate_paths:
            try:
                text = path.read_text(encoding="utf-8")
            except Exception:
                continue

            for chunk_idx, chunk in enumerate(
                _chunk_text(
                    text,
                    chunk_size=self._settings.chunk_size,
                    overlap=self._settings.chunk_overlap,
                )
            ):
                chunk_id = f"{path.stem}::chunk{chunk_idx}"
                items.append(
                    RetrievedItem(
                        chunk_id=chunk_id,
                        text=chunk,
                        score=0.0,
                        source=str(path.as_posix()),
                        metadata={"doc": path.name, "chunk_index": chunk_idx},
                    )
                )

        return LocalDocsIndex(items=items)

    def retrieve(self, query: str, *, top_k: int) -> list[RetrievedItem]:
        if not query.strip():
            return []
        scored: list[RetrievedItem] = []
        for item in self._index.items:
            score = _overlap_score(query, item.text)
            if score <= 0:
                continue
            scored.append(item.model_copy(update={"score": float(score)}))

        scored.sort(key=lambda x: x.score, reverse=True)
        return scored[:top_k]


class EmptyRetriever:
    def retrieve(self, query: str, *, top_k: int) -> list[RetrievedItem]:
        return []
