"""LLM Router and Caching Client.

Smart model routing:
- Flash (cheap, fast) for classification, extraction, one-liners
- Pro (reasoning, synthesis) for deep evaluation and verdicts
- SHA-256 caching: never call twice for the same prompt+model
- Token usage and cost tracking in USD and INR
"""

import os
import json
import hashlib
import logging
from typing import Optional, Dict, Any
from pathlib import Path

logger = logging.getLogger("finn.llm")

# Defaults per prompt specification
FLASH_MODEL = os.getenv("GEMINI_FLASH_MODEL", "gemini-2.5-flash")
PRO_MODEL = os.getenv("GEMINI_PRO_MODEL", "gemini-2.5-pro")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Estimated pricing per 1M tokens (USD)
# Flash: $0.15 / 1M in, $0.60 / 1M out
# Pro: $1.25 / 1M in, $5.00 / 1M out
PRICING = {
    "flash": {"in": 0.15 / 1e6, "out": 0.60 / 1e6},
    "pro": {"in": 1.25 / 1e6, "out": 5.00 / 1e6},
}
USD_TO_INR = 88.0

CACHE_FILE = Path("data/cache/llm_cache.json")


def _get_cache() -> dict:
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def _save_cache(cache: dict):
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)


def get_cache_key(model: str, prompt: str) -> str:
    """Compute sha256 cache key."""
    return hashlib.sha256(f"{model}:{prompt}".encode("utf-8")).hexdigest()


def call_llm(
    prompt: str,
    system_instruction: Optional[str] = None,
    model_tier: str = "flash",
    temperature: float = 0.1,
    response_mime_type: Optional[str] = None,
) -> Dict[str, Any]:
    """Call LLM with automatic SHA-256 caching and cost tracking.
    
    Returns:
    {
        "content": str,
        "json": dict or None,
        "tokens_in": int,
        "tokens_out": int,
        "cost_usd": float,
        "cost_inr": float,
        "cached": bool,
        "model": str
    }
    """
    model_name = PRO_MODEL if model_tier == "pro" else FLASH_MODEL
    cache_key = get_cache_key(model_name, f"{system_instruction}\n{prompt}")

    # 1. Check cache
    cache = _get_cache()
    if cache_key in cache:
        cached_entry = cache[cache_key]
        cached_entry["cached"] = True
        return cached_entry

    # 2. Call Google Gemini via google-genai
    if GEMINI_API_KEY:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=GEMINI_API_KEY)
            config = types.GenerateContentConfig(
                temperature=temperature,
                system_instruction=system_instruction,
                response_mime_type=response_mime_type,
            )
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )

            text_output = response.text or ""
            tokens_in = len(prompt.split()) * 2  # Approximate if usage_metadata not available
            tokens_out = len(text_output.split()) * 2

            if hasattr(response, "usage_metadata") and response.usage_metadata:
                tokens_in = response.usage_metadata.prompt_token_count or tokens_in
                tokens_out = response.usage_metadata.candidates_token_count or tokens_out

            pricing = PRICING.get(model_tier, PRICING["flash"])
            cost_usd = (tokens_in * pricing["in"]) + (tokens_out * pricing["out"])
            cost_inr = round(cost_usd * USD_TO_INR, 4)

            parsed_json = None
            if response_mime_type == "application/json" or "{" in text_output:
                try:
                    # Strip markdown blocks if present
                    clean_text = text_output.strip()
                    if clean_text.startswith("```json"):
                        clean_text = clean_text[7:]
                    if clean_text.startswith("```"):
                        clean_text = clean_text[3:]
                    if clean_text.endswith("```"):
                        clean_text = clean_text[:-3]
                    parsed_json = json.loads(clean_text.strip())
                except Exception:
                    pass

            result = {
                "content": text_output,
                "json": parsed_json,
                "tokens_in": tokens_in,
                "tokens_out": tokens_out,
                "cost_usd": round(cost_usd, 6),
                "cost_inr": cost_inr,
                "cached": False,
                "model": model_name,
            }

            # Cache output
            cache[cache_key] = result
            _save_cache(cache)
            return result

        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}. Trying fallback if available.")

    # 3. Optional fallback: Groq if GROQ_API_KEY is configured
    if GROQ_API_KEY:
        try:
            import requests

            groq_model = "llama-3.3-70b-versatile" if model_tier == "pro" else "llama-3.1-8b-instant"
            messages = []
            if system_instruction:
                messages.append({"role": "system", "content": system_instruction})
            messages.append({"role": "user", "content": prompt})

            r = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json={"model": groq_model, "messages": messages, "temperature": temperature},
                timeout=15,
            )
            if r.status_code == 200:
                resp_json = r.json()
                choice = resp_json["choices"][0]["message"]["content"]
                result = {
                    "content": choice,
                    "json": None,
                    "tokens_in": resp_json.get("usage", {}).get("prompt_tokens", 0),
                    "tokens_out": resp_json.get("usage", {}).get("completion_tokens", 0),
                    "cost_usd": 0.0,
                    "cost_inr": 0.0,
                    "cached": False,
                    "model": f"groq-{groq_model}",
                }
                cache[cache_key] = result
                _save_cache(cache)
                return result
        except Exception as e:
            logger.error(f"Groq fallback failed: {e}")

    # 4. Graceful offline heuristic response if no API key is set
    logger.info("Using local heuristic extractor (offline mode).")
    return {
        "content": "",
        "json": None,
        "tokens_in": 0,
        "tokens_out": 0,
        "cost_usd": 0.0,
        "cost_inr": 0.0,
        "cached": False,
        "model": "offline-rule-heuristic",
    }
