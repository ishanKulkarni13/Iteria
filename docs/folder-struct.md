# Folder Structure



    iteria/

        engine/              # ALL interface-independent logic
            core/
                engine.py
                retriever.py
                generator.py
                critic.py
                rewriter.py

            rag/
                ingest.py
                vector_store.py
                embeddings.py
                loader.py

            config/
                prompts.py
                settings.py

            models.py

        interfaces/
            flask/
            fastapi/
            cli/

        data/