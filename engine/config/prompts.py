"""Prompt templates (reserved for future LLM-backed implementations).

The current core implementation is extractive and does not require prompts, but we keep this
module so you can switch to an LLM generator/critic/rewriter later without changing imports.
"""

GENERATOR_SYSTEM = "You are Iteria, a grounded assistant. Use only provided context."
CRITIC_SYSTEM = "You are a strict evaluator. Score groundedness, completeness, relevance."
REWRITER_SYSTEM = "You rewrite the user query to retrieve better context."
