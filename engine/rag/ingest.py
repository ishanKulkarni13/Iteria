from __future__ import annotations

import argparse
import hashlib
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import spacy
from langchain_core.documents import Document

from engine.config.settings import get_settings
from engine.rag.embeddings import EmbeddingConfig, SentenceTransformerEmbedder
from engine.rag.loader import load_documents
from engine.rag.vector_store import ChromaConfig, ChromaVectorStore


@dataclass(frozen=True)
class RagDocument:
	doc_id: str
	text: str
	metadata: dict[str, Any]


@dataclass(frozen=True)
class RagChunk:
	chunk_id: str
	doc_id: str
	chunk_index: int
	text: str
	metadata: dict[str, Any]


def _stable_doc_id(doc: Document) -> str:
	src = str(doc.metadata.get("path") or doc.metadata.get("source") or "")
	base = src if src else doc.page_content[:200]
	return hashlib.sha1(base.encode("utf-8", "ignore")).hexdigest()[:16]


def _get_nlp(model: str) -> Any:
	"""Load spaCy pipeline.

	If the requested model isn't installed, fall back to a blank English pipeline with
	a sentencizer so chunking still works.
	"""

	try:
		nlp = spacy.load(model, disable=["tagger", "parser", "ner", "lemmatizer"])
		# If we disabled the parser (or the model has no sentence segmenter), ensure
		# sentence boundaries exist for `doc.sents`.
		if not (nlp.has_pipe("parser") or nlp.has_pipe("senter") or nlp.has_pipe("sentencizer")):
			nlp.add_pipe("sentencizer")
		return nlp
	except Exception:
		nlp = spacy.blank("en")
		if "sentencizer" not in nlp.pipe_names:
			nlp.add_pipe("sentencizer")
		return nlp


def chunk_documents_spacy(
	docs: list[Document],
	*,
	chunk_size: int,
	chunk_overlap: int,
	spacy_model: str = "en_core_web_sm",
) -> list[RagChunk]:
	nlp = _get_nlp(spacy_model)
	chunks: list[RagChunk] = []

	for d in docs:
		text = d.page_content.strip()
		if not text:
			continue

		doc_id = _stable_doc_id(d)
		base_meta = dict(d.metadata)
		base_meta["doc_id"] = doc_id

		spacy_doc = nlp(text)
		sentences = [s.text.strip() for s in spacy_doc.sents if s.text.strip()]
		if not sentences:
			sentences = [text]

		current: list[str] = []
		current_len = 0
		idx = 0

		def flush() -> None:
			nonlocal current, current_len, idx
			if not current:
				return
			chunk_text = " ".join(current).strip()
			chunk_id = f"{doc_id}::chunk{idx}"
			meta = dict(base_meta)
			meta.update({"chunk_index": idx})
			chunks.append(
				RagChunk(
					chunk_id=chunk_id,
					doc_id=doc_id,
					chunk_index=idx,
					text=chunk_text,
					metadata=meta,
				)
			)
			idx += 1

			# Overlap by carrying suffix sentences until we reach overlap chars.
			if chunk_overlap <= 0:
				current = []
				current_len = 0
				return
			suffix: list[str] = []
			suffix_len = 0
			for sent in reversed(current):
				sent_len = len(sent) + 1
				if suffix_len + sent_len > chunk_overlap and suffix:
					break
				suffix.insert(0, sent)
				suffix_len += sent_len
			current = suffix
			current_len = len(" ".join(current))

		for sent in sentences:
			sent_len = len(sent) + 1
			if current_len + sent_len <= chunk_size:
				current.append(sent)
				current_len += sent_len
				continue

			flush()
			# sentence might be longer than chunk size; hard-split
			if len(sent) > chunk_size:
				start = 0
				while start < len(sent):
					part = sent[start : start + chunk_size].strip()
					if part:
						chunk_id = f"{doc_id}::chunk{idx}"
						meta = dict(base_meta)
						meta.update({"chunk_index": idx})
						chunks.append(
							RagChunk(
								chunk_id=chunk_id,
								doc_id=doc_id,
								chunk_index=idx,
								text=part,
								metadata=meta,
							)
						)
						idx += 1
					start += chunk_size
				current = []
				current_len = 0
			else:
				current = [sent]
				current_len = len(sent)

		flush()

	return chunks


def run_ingest(
	*,
	docs_dir: str,
	glob: str,
	persist_dir: str,
	collection: str,
	reset: bool,
	spacy_model: str,
	embedding_model: str,
) -> dict[str, Any]:
	settings = get_settings()

	docs = load_documents(docs_dir=docs_dir, glob=glob)
	chunks = chunk_documents_spacy(
		docs,
		chunk_size=settings.chunk_size,
		chunk_overlap=settings.chunk_overlap,
		spacy_model=spacy_model,
	)

	store = ChromaVectorStore(config=ChromaConfig(persist_dir=persist_dir, collection_name=collection))
	if reset:
		store.reset()

	embedder = SentenceTransformerEmbedder(config=EmbeddingConfig(model_name=embedding_model))
	embeddings = embedder.embed_texts([c.text for c in chunks])

	store.upsert(
		ids=[c.chunk_id for c in chunks],
		documents=[c.text for c in chunks],
		embeddings=embeddings,
		metadatas=[c.metadata for c in chunks],
	)

	return {
		"documents": len(docs),
		"chunks": len(chunks),
		"collection": collection,
		"persist_dir": persist_dir,
		"stored_count": store.count(),
	}


def main() -> None:
	parser = argparse.ArgumentParser(description="Iteria ingestion: load -> chunk -> embed -> store")
	parser.add_argument("--docs-dir", default="data/docs")
	parser.add_argument("--glob", default="**/*.txt")
	parser.add_argument("--persist-dir", default="data/vector_db")
	parser.add_argument("--collection", default="iteria")
	parser.add_argument("--reset", action="store_true")
	parser.add_argument("--spacy-model", default="en_core_web_sm")
	parser.add_argument(
		"--embedding-model",
		default="sentence-transformers/all-MiniLM-L6-v2",
		help="HuggingFace sentence-transformers model id",
	)

	args = parser.parse_args()
	result = run_ingest(
		docs_dir=args.docs_dir,
		glob=args.glob,
		persist_dir=args.persist_dir,
		collection=args.collection,
		reset=args.reset,
		spacy_model=args.spacy_model,
		embedding_model=args.embedding_model,
	)
	print("Ingestion complete:")
	for k, v in result.items():
		print(f"- {k}: {v}")


if __name__ == "__main__":
	main()
