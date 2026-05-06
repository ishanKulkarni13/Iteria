from __future__ import annotations

import re

from engine.models import DraftAnswer


class SimpleQueryRewriter:
    """Rewrites the query using critic feedback.

    Heuristic strategy:
    - If feedback includes "Missing terms:", append those keywords.
    - Otherwise, add a short instruction to retrieve definitions/examples.
    """

    _missing_terms_re = re.compile(r"Missing terms:\s*(.*)$", re.IGNORECASE)

    def rewrite(self, query: str, *, critic_feedback: str, draft: DraftAnswer) -> str:
        m = self._missing_terms_re.search(critic_feedback)
        if m:
            terms_raw = m.group(1)
            terms = [t.strip() for t in terms_raw.split(",") if t.strip()]
            if terms:
                return f"{query} (focus keywords: {' '.join(terms)})"

        if "No context" in critic_feedback:
            return f"{query} (add more specific keywords; include names, definitions, or file identifiers)"

        return f"{query} (retrieve more context; include definitions, key points, and examples)"
