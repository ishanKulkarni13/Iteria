# RAG Module — Structure & Responsibilities

This folder contains everything related to the **Retrieval-Augmented Generation (RAG)** pipeline, specifically the data preparation and storage layer.

The goal of this module is to take raw documents and convert them into a format that can be efficiently searched during query time.

---

## Folder Overview

```text
rag/
  embeddings.py
  ingest.py
  loader.py
  vector_store.py
```

---

## High-Level Flow

The ingestion process follows this pipeline:

```text
Documents → Load → Chunk → Embed → Store
```

Each file in this folder is responsible for a specific step in this process.

---

## File Responsibilities

### `ingest.py`

This is the entry point for the ingestion pipeline.

It orchestrates the full flow:

* loads documents
* splits them into chunks
* generates embeddings
* stores them in the vector database

This file should contain the main function you run to prepare your data.

---

### `loader.py`

Responsible for loading raw documents from disk.

Typical responsibilities:

* reading files from `data/docs/`
* supporting basic formats (start with `.txt`)
* returning documents in a consistent structure

Keep this simple and focused — no processing logic here.

---

### `embeddings.py`

Handles embedding-related logic.

Responsibilities:

* initializing the embedding model
* providing a reusable embedding function/object

This keeps model-specific logic separate from the rest of the pipeline.

---

### `vector_store.py`

Handles interaction with the vector database.

Responsibilities:

* creating/loading the vector store
* storing embedded chunks
* managing persistence (saving to disk)

This acts as the interface between your code and the vector database (e.g., ChromaDB).

---

## Design Notes

* This module is **offline-only** (runs during setup, not per request)
* No API or framework logic should exist here

---

## Usage

Run ingestion using:

```bash
python engine/rag/ingest.py
```

This will:

* process documents from `data/docs/`
* generate embeddings
* store them in the vector database

---

## 📝 Notes

* Start with a small dataset (1–2 files)
* Keep chunking simple initially
* Avoid premature optimization

This module forms the foundation of the entire system — correctness here directly impacts answer quality later.

---
