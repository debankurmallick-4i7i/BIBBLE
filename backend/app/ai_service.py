
import os
import sys

from dotenv import load_dotenv
from google import genai

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing. Check your backend .env file."
    )

client = genai.Client(api_key=API_KEY)

MODEL_HYDROGEN = "gemini-4-hydrogen"
MODEL_GEMMA = "gemma-4-26b-a4b-it"
MODEL_FLASH = "gemini-3.8-flash"
MODEL_GEMMA_ADVANCED = "gemma-4-31b-it"

MODEL_TIMEOUT = 90
ADVANCED_MODEL_TIMEOUT = 300

THINKING_LEVELS = {
    MODEL_HYDROGEN: "medium",
    MODEL_GEMMA: "high",
    MODEL_FLASH: "low",
}


def choose_model(action: str, prompt: str) -> str:
    action = action.lower().strip()

    lightweight_actions = {
        "grammar",
        "shorten",
        "simple_correction",
        "short_summary",
    }

    if action in lightweight_actions:
        return MODEL_FLASH

    # Hydrogen handles every normal and deep first response.
    return MODEL_HYDROGEN


def _stream_model(model_name: str, prompt: str, timeout: int):
    generated_text = False
    thinking_level = THINKING_LEVELS.get(model_name)

    print(
        f"[BIBBLE AI] Trying {model_name}",
        file=sys.stderr,
        flush=True,
    )

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

    try:
        stream = client.interactions.create(**request_options)

        for event in stream:
            if event.event_type == "step.delta":
                if event.delta.type == "text":
                    chunk = event.delta.text

                    if chunk:
                        generated_text = True
                        yield chunk

        print(
            f"[BIBBLE AI] Completed with {model_name}",
            file=sys.stderr,
            flush=True,
        )

    except Exception:
        if generated_text:
            raise
        raise


def stream_gemini_response(
    prompt: str,
    action: str = "chat",
):
    selected_model = choose_model(action, prompt)

    fallback_models = {
        MODEL_HYDROGEN: [MODEL_FLASH],
        MODEL_FLASH: [MODEL_HYDROGEN],
    }

    models_to_try = [
        selected_model,
        *fallback_models.get(selected_model, []),
    ]

    for model_name in models_to_try:
        try:
            yield from _stream_model(
                model_name,
                prompt,
                MODEL_TIMEOUT,
            )
            return

        except Exception as error:
            print(
                f"[BIBBLE AI] {model_name} failed: {error}",
                file=sys.stderr,
                flush=True,
            )

    raise RuntimeError(
        "All BIBBLE AI models failed. Please try again."
    )


def stream_specialist_analysis(prompt: str):
    """Run a separate Gemma 26B specialist analysis."""

    yield from _stream_model(
        MODEL_GEMMA,
        prompt,
        MODEL_TIMEOUT,
    )


def stream_advanced_refinement(prompt: str):
    """Run Gemma 31B only after explicit user consent."""

    yield from _stream_model(
        MODEL_GEMMA_ADVANCED,
        prompt,
        ADVANCED_MODEL_TIMEOUT,
    )
