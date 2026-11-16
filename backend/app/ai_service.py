
import os
import sys
import json
import httpx

from dotenv import load_dotenv
from google import genai

load_dotenv()

# --------------------------------------------------
# API CONFIGURATION
# --------------------------------------------------

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing. Check your backend .env file."
    )

gemini_client = genai.Client(api_key=GEMINI_API_KEY)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# --------------------------------------------------
# MODEL CONFIGURATION
# --------------------------------------------------

# Direct Google API
MODEL_PRIMARY = "gemini-3.5-flash-lite"
MODEL_BACKUP = "gemini-3.8-flash"

# OpenRouter models
MODEL_ERNIE = "baidu/ernie-5.5-flash-preview:free"
MODEL_NEMOTRON = "nvidia/nemotron-3-ultra-550b-a55b:free"

# Gemini specialist models
MODEL_GEMMA = "gemma-4-26b-a4b-it"
MODEL_GEMMA_ADVANCED = "gemma-4-31b-it"

# Timeouts
MODEL_TIMEOUT = 15
SPECIALIST_TIMEOUT = 90
ADVANCED_MODEL_TIMEOUT = 300

# Thinking configuration
THINKING_LEVELS = {
    MODEL_BACKUP: "low",
    MODEL_GEMMA: "high",
}


# --------------------------------------------------
# LOGGING
# --------------------------------------------------

def log(message: str):
    print(
        f"[BIBBLE AI] {message}",
        file=sys.stderr,
        flush=True,
    )


# --------------------------------------------------
# TASK CLASSIFICATION
# --------------------------------------------------

def choose_models(action: str, prompt: str) -> list[str]:
    """
    Select the best model order based on the creative task.

    Poetry and emotional writing:
        ERNIE -> Nemotron -> Gemini

    Complex stories and worldbuilding:
        Nemotron -> ERNIE -> Gemini

    Simple editing:
        Gemini -> ERNIE -> Nemotron
    """

    action_text = (action or "chat").lower()
    prompt_text = (prompt or "").lower()

    lightweight_actions = {
        "grammar",
        "shorten",
        "simple_correction",
        "short_summary",
        "correction",
        "rewrite_short",
    }

    if action_text in lightweight_actions:
        return [
            MODEL_PRIMARY,
            MODEL_ERNIE,
            MODEL_NEMOTRON,
        ]

    # Poetry and emotionally expressive writing
    poetry_keywords = [
        "poem",
        "poetry",
        "verse",
        "stanza",
        "metaphor",
        "one-sided love",
        "emotional prose",
        "songwriting",
        "song lyrics",
        "lyrics",
        "write a song",
        "write a poem",
        "write poetry",
        "spoken word",
    ]

    # Complex stories, fiction and narrative development
    story_keywords = [
        "story",
        "short story",
        "write a story",
        "storytelling",
        "fiction",
        "fictional",
        "novel",
        "chapter",
        "screenplay",
        "screenwriting",
        "worldbuilding",
        "world building",
        "plot",
        "plot structure",
        "story architecture",
        "character development",
        "character arc",
        "narrative",
        "complex narrative",
        "psychologically compelling",
        "psychological depth",
        "meaningful twist",
        "unexpected twist",
        "multiple characters",
        "five-act",
        "five act",
        "develop a fictional world",
        "narrative structure",
        "character backstory",
        "conflict and resolution",
    ]

    # Poetry takes priority when explicitly requested.
    if any(word in prompt_text for word in poetry_keywords):
        return [
            MODEL_ERNIE,
            MODEL_NEMOTRON,
            MODEL_PRIMARY,
        ]

    # Complex narrative tasks go to Nemotron first.
    if any(word in prompt_text for word in story_keywords):
        return [
            MODEL_NEMOTRON,
            MODEL_ERNIE,
            MODEL_PRIMARY,
        ]

    # General creative requests
    return [
        MODEL_ERNIE,
        MODEL_NEMOTRON,
        MODEL_PRIMARY,
    ]


# --------------------------------------------------
# OPENROUTER STREAMING
# --------------------------------------------------

def _stream_openrouter_model(
    model_name: str,
    prompt: str,
):
    """
    Stream a response from an OpenRouter model.

    A 15-second read timeout protects against a model
    that does not begin responding or stops streaming.
    """

    if not OPENROUTER_API_KEY:
        raise RuntimeError(
            "OPENROUTER_API_KEY is missing."
        )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5174",
        "X-Title": "BIBBLE Creative Studio",
    }

    payload = {
        "model": model_name,
        "messages": [
            {
                "role": "user",
                "content": prompt,
            }
        ],
        "stream": True,
        "max_tokens": 4096,
    }

    generated_text = False

    log(f"Trying OpenRouter model: {model_name}")

    timeout = httpx.Timeout(
        connect=10.0,
        read=MODEL_TIMEOUT,
        write=15.0,
        pool=10.0,
    )

    with httpx.Client(timeout=timeout) as client:
        with client.stream(
            "POST",
            OPENROUTER_URL,
            headers=headers,
            json=payload,
        ) as response:

            if response.status_code >= 400:
                error_body = response.read().decode(
                    "utf-8",
                    errors="replace",
                )

                raise RuntimeError(
                    f"OpenRouter error {response.status_code}: "
                    f"{error_body[:1000]}"
                )

            for line in response.iter_lines():

                if not line or not line.startswith("data:"):
                    continue

                data = line[len("data:"):].strip()

                if data == "[DONE]":
                    break

                try:
                    event = json.loads(data)
                except json.JSONDecodeError:
                    continue

                choices = event.get("choices", [])

                if not choices:
                    continue

                delta = choices[0].get("delta", {})
                content = delta.get("content")

                if isinstance(content, str) and content:
                    generated_text = True
                    yield content

    if not generated_text:
        raise RuntimeError(
            f"{model_name} completed without producing text."
        )

    log(f"Completed with {model_name}")


# --------------------------------------------------
# GEMINI STREAMING
# --------------------------------------------------

def _stream_gemini_model(
    model_name: str,
    prompt: str,
    timeout: int,
):
    generated_text = False

    thinking_level = THINKING_LEVELS.get(model_name)

    log(f"Trying Gemini model: {model_name}")

    request_options = {
        "model": model_name,
        "input": prompt,
        "stream": True,
        "timeout": timeout,
    }

    if thinking_level:
        request_options["generation_config"] = {
            "thinking_level": thinking_level
        }

    stream = gemini_client.interactions.create(
        **request_options
    )

    for event in stream:
        event_type = getattr(event, "event_type", None)
        delta = getattr(event, "delta", None)
        delta_type = getattr(delta, "type", None)

        if event_type == "step.delta" and delta_type == "text":
            chunk = getattr(delta, "text", None)

            if chunk:
                generated_text = True
                yield chunk

    if not generated_text:
        raise RuntimeError(
            f"{model_name} completed without producing text."
        )

    log(f"Completed with {model_name}")


# --------------------------------------------------
# ADAPTIVE RESPONSE GENERATION
# --------------------------------------------------

def stream_gemini_response(
    prompt: str,
    action: str = "chat",
):
    """
    Main BIBBLE generation entry point.

    Keeps the existing function name so main.py
    does not need to be changed.
    """

    models_to_try = choose_models(action, prompt)

    log(
        "Selected routing order: "
        + " -> ".join(models_to_try)
    )

    for model_index, model_name in enumerate(models_to_try):

        sent_text = False

        try:

            if model_name in {
                MODEL_ERNIE,
                MODEL_NEMOTRON,
            }:
                generator = _stream_openrouter_model(
                    model_name,
                    prompt,
                )

            else:
                generator = _stream_gemini_model(
                    model_name,
                    prompt,
                    MODEL_TIMEOUT,
                )

            for chunk in generator:
                sent_text = True
                yield chunk

            return

        except Exception as error:

            log(
                f"{model_name} failed: {repr(error)}"
            )

            # Never mix partial answers from different models.
            if sent_text:
                raise RuntimeError(
                    "AI generation was interrupted after "
                    "streaming started. Please retry."
                ) from error

            if model_index == len(models_to_try) - 1:
                break

            next_model = models_to_try[model_index + 1]

            log(
                f"Failing over to {next_model}"
            )

    raise RuntimeError(
        "BIBBLE could not generate a response. "
        "All configured models failed. Please try again."
    )


# --------------------------------------------------
# SPECIALIST ANALYSIS
# --------------------------------------------------

def stream_specialist_analysis(prompt: str):
    """Run Gemma 26B for deeper creative analysis."""

    yield from _stream_gemini_model(
        MODEL_GEMMA,
        prompt,
        SPECIALIST_TIMEOUT,
    )


# --------------------------------------------------
# ADVANCED REFINEMENT
# --------------------------------------------------

def stream_advanced_refinement(prompt: str):
    """Run Gemma 31B only after explicit user consent."""

    yield from _stream_gemini_model(
        MODEL_GEMMA_ADVANCED,
        prompt,
        ADVANCED_MODEL_TIMEOUT,
    )
