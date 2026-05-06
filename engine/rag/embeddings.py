from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class EmbeddingConfig:
	model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
	normalize: bool = True


class SentenceTransformerEmbedder:
	def __init__(self, *, config: EmbeddingConfig | None = None) -> None:
		self.config = config or EmbeddingConfig()

		# Lazy import so the rest of the project can run without the extra.
		from sentence_transformers import SentenceTransformer

		self._model = SentenceTransformer(self.config.model_name)

	def embed_texts(self, texts: list[str]) -> list[list[float]]:
		embeddings = self._model.encode(
			texts,
			normalize_embeddings=self.config.normalize,
			show_progress_bar=False,
		)
		return [e.tolist() for e in embeddings]

	def embed_query(self, query: str) -> list[float]:
		return self.embed_texts([query])[0]
