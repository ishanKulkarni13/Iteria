from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
	model_config = SettingsConfigDict(
		env_prefix="ITERIA_",
		env_file=".env",
		extra="ignore",
	)

	# Iteration controller
	max_iterations: int = Field(default=3, ge=1, le=10)
	top_k: int = Field(default=4, ge=1, le=50)

	# Critic thresholds
	accept_overall_threshold: float = Field(default=0.35, ge=0, le=1)
	min_groundedness: float = Field(default=0.30, ge=0, le=1)
	min_relevance: float = Field(default=0.20, ge=0, le=1)
	min_completeness: float = Field(default=0.20, ge=0, le=1)

	# Fallback local-docs chunking (used only until vector DB integration is ready)
	chunk_size: int = Field(default=800, ge=100, le=5000)
	chunk_overlap: int = Field(default=120, ge=0, le=1000)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
	return Settings()

