from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class ChromaConfig:
	persist_dir: str = "data/vector_db"
	collection_name: str = "iteria"


class ChromaVectorStore:
	def __init__(self, *, config: ChromaConfig | None = None) -> None:
		self.config = config or ChromaConfig()

		# Lazy import for optional dependency.
		import chromadb

		persist_path = Path(self.config.persist_dir)
		persist_path.mkdir(parents=True, exist_ok=True)

		self._client = chromadb.PersistentClient(path=str(persist_path))
		self._collection = self._client.get_or_create_collection(name=self.config.collection_name)

	def count(self) -> int:
		return int(self._collection.count())

	def reset(self) -> None:
		# Drop and recreate.
		self._client.delete_collection(name=self.config.collection_name)
		self._collection = self._client.get_or_create_collection(name=self.config.collection_name)

	def upsert(
		self,
		*,
		ids: list[str],
		documents: list[str],
		embeddings: list[list[float]],
		metadatas: list[dict[str, Any]] | None = None,
	) -> None:
		if metadatas is None:
			metadatas = [{} for _ in ids]
		self._collection.upsert(
			ids=ids,
			documents=documents,
			embeddings=embeddings,
			metadatas=metadatas,
		)

	def similarity_search(
		self,
		*,
		query_embedding: list[float],
		top_k: int,
	) -> list[dict[str, Any]]:
		res = self._collection.query(
			query_embeddings=[query_embedding],
			n_results=top_k,
			include=["documents", "metadatas", "distances"],
		)
		ids = res.get("ids", [[]])[0]
		docs = res.get("documents", [[]])[0]
		metas = res.get("metadatas", [[]])[0]
		dists = res.get("distances", [[]])[0]

		out: list[dict[str, Any]] = []
		for i, doc_id in enumerate(ids):
			out.append(
				{
					"id": doc_id,
					"document": docs[i] if i < len(docs) else "",
					"metadata": metas[i] if i < len(metas) and metas[i] is not None else {},
					"distance": float(dists[i]) if i < len(dists) else None,
				}
			)
		return out
