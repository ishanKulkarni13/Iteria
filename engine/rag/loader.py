from __future__ import annotations

from pathlib import Path
from typing import Iterable

from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_core.documents import Document


def load_documents(
    *,
    docs_dir: str | Path = "data/docs",
    glob: str = "**/*.txt",
) -> list[Document]:
    """Load documents from disk using LangChain loaders.

    Returns LangChain `Document` objects with:
    - `page_content`: text content
    - `metadata`: includes `source`, `path`, `filename`
    """

    docs_dir = Path(docs_dir)
    if not docs_dir.exists():
        return []

    loader = DirectoryLoader(
        str(docs_dir),
        glob=glob,
        loader_cls=TextLoader,
        loader_kwargs={"encoding": "utf-8"},
        use_multithreading=True,
        show_progress=False,
    )

    docs = loader.load()
    for d in docs:
        src = d.metadata.get("source")
        if src:
            path = Path(src)
            d.metadata.setdefault("path", str(path.as_posix()))
            d.metadata.setdefault("filename", path.name)
    return docs


def iter_texts(docs: Iterable[Document]) -> Iterable[str]:
    for d in docs:
        yield d.page_content


if __name__ == "__main__":
    docs = load_documents()
    print(f"Loaded {len(docs)} documents")
    for i, d in enumerate(docs[:3], start=1):
        print(f"\n--- Document {i}: {d.metadata.get('filename', 'unknown')} ---")
        print(d.page_content[:200])