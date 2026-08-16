#!/bin/sh
set -e

MODEL="${MODEL_NAME:-smollm:135m}"
PORT="${PORT:-11434}"

export OLLAMA_HOST="0.0.0.0:${PORT}"
export OLLAMA_MODELS="${OLLAMA_MODELS:-/models}"
export OLLAMA_NUM_PARALLEL="${OLLAMA_NUM_PARALLEL:-1}"
export OLLAMA_MAX_LOADED_MODELS="${OLLAMA_MAX_LOADED_MODELS:-1}"
export OLLAMA_CONTEXT_LENGTH="${OLLAMA_CONTEXT_LENGTH:-512}"
export OLLAMA_KEEP_ALIVE="${OLLAMA_KEEP_ALIVE:-1h}"

echo "Starting Ollama on port ${PORT} with model ${MODEL}"

ollama serve &
SERVE_PID=$!

for i in $(seq 1 90); do
  if curl -sf "http://127.0.0.1:${PORT}/api/tags" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

# Fallback pull if model was not baked (e.g. local dev without rebuild).
if ! curl -sf "http://127.0.0.1:${PORT}/api/tags" | grep -q "smollm"; then
  echo "Model not found — pulling ${MODEL} (this may take a few minutes)..."
  ollama pull "${MODEL}"
fi

echo "Ollama is ready."
wait $SERVE_PID
