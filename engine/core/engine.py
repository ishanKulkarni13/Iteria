from __future__ import annotations

import time

from engine.config.settings import Settings, get_settings
from engine.core.critic import SimpleCritic
from engine.core.generator import ExtractiveGroundedGenerator
from engine.core.retriever import BaseRetriever, ChromaRetriever, SimpleLocalDocsRetriever
from engine.core.rewriter import SimpleQueryRewriter
from engine.models import EngineResponse, IterationTrace


class IteriaEngine:
	def __init__(
		self,
		*,
		settings: Settings,
		retriever: BaseRetriever,
		generator: ExtractiveGroundedGenerator,
		critic: SimpleCritic,
		rewriter: SimpleQueryRewriter,
	) -> None:
		self.settings = settings
		self.retriever = retriever
		self.generator = generator
		self.critic = critic
		self.rewriter = rewriter

	def answer(
		self,
		query: str,
		*,
		max_iterations: int | None = None,
		top_k: int | None = None,
		debug: bool = False,
	) -> EngineResponse:
		query = query.strip()
		if not query:
			return EngineResponse(
				query=query,
				answer="Query cannot be empty.",
				accepted=False,
				iteration_count=0,
				trace=[] if debug else None,
				warnings=["empty_query"],
			)

		max_iterations = max_iterations or self.settings.max_iterations
		top_k = top_k or self.settings.top_k

		traces: list[IterationTrace] = []
		warnings: list[str] = []

		best_draft_text = ""
		best_score = -1.0

		current_query = query
		accepted = False

		for i in range(1, max_iterations + 1):
			t0 = time.perf_counter()
			retrieved = self.retriever.retrieve(current_query, top_k=top_k)
			t1 = time.perf_counter()
			draft = self.generator.generate(current_query, contexts=retrieved)
			t2 = time.perf_counter()
			critic = self.critic.evaluate(current_query, draft=draft, contexts=retrieved)
			t3 = time.perf_counter()

			if critic.scores.overall > best_score:
				best_score = critic.scores.overall
				best_draft_text = draft.text

			rewritten_query = None
			if critic.should_retry and i < max_iterations:
				rewritten_query = self.rewriter.rewrite(
					current_query, critic_feedback=critic.feedback, draft=draft
				)

			traces.append(
				IterationTrace(
					iteration=i,
					query=current_query,
					retrieved=retrieved,
					draft=draft,
					critic=critic,
					rewritten_query=rewritten_query,
					timings_ms={
						"retrieve": int((t1 - t0) * 1000),
						"generate": int((t2 - t1) * 1000),
						"critic": int((t3 - t2) * 1000),
						"total": int((t3 - t0) * 1000),
					},
				)
			)

			if not critic.should_retry:
				accepted = True
				best_draft_text = draft.text
				break

			if rewritten_query:
				current_query = rewritten_query

		if not accepted:
			warnings.append("max_iterations_reached")

		return EngineResponse(
			query=query,
			answer=best_draft_text or "No answer could be generated.",
			accepted=accepted,
			iteration_count=len(traces),
			trace=traces if (debug or not accepted) else None,
			warnings=warnings,
		)


def build_default_engine(*, settings: Settings | None = None) -> IteriaEngine:
	settings = settings or get_settings()
	retriever: BaseRetriever
	if settings.use_chroma_retriever:
		retriever = ChromaRetriever(settings=settings)
	else:
		retriever = SimpleLocalDocsRetriever(settings=settings)
	generator = ExtractiveGroundedGenerator()
	critic = SimpleCritic(settings=settings)
	rewriter = SimpleQueryRewriter()
	return IteriaEngine(
		settings=settings,
		retriever=retriever,
		generator=generator,
		critic=critic,
		rewriter=rewriter,
	)


__all__ = ["IteriaEngine", "build_default_engine"]
