import os

def load_documents():
    """
    Load all .txt documents from data/docs/
    Returns:
        List[str]: list of document contents
    """

    docs_path = "data/docs"
    documents = []

    # Check if folder exists
    if not os.path.exists(docs_path):
        print(f"Folder not found: {docs_path}")
        return documents

    # Loop through files
    for filename in os.listdir(docs_path):
        if filename.endswith(".txt"):
            file_path = os.path.join(docs_path, filename)

            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    documents.append(content)

            except Exception as e:
                print(f"Error reading {filename}: {e}")

    print(f"Loaded {len(documents)} documents")
    return documents



if __name__ == "__main__":
    docs = load_documents()
    for i, doc in enumerate(docs):
        print(f"\n--- Document {i + 1} ---\n")
        print(doc[:200])