# Minimal CPU-only Ollama for Render free tier (512 MB RAM).
# Model qwen2.5:0.5b (~398 MB) is baked at build time to avoid re-downloading on every cold start.

FROM ollama/ollama:latest AS ollama-base

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy only the Ollama binary and CPU runners (skip ~3 GB of GPU/CUDA layers).
COPY --from=ollama-base /usr/bin/ollama /usr/bin/ollama
COPY --from=ollama-base /usr/lib/ollama /usr/lib/ollama

ENV OLLAMA_MODELS=/models \
    OLLAMA_HOST=0.0.0.0:11434 \
    MODEL_NAME=qwen2.5:0.5b

RUN mkdir -p /models

# Bake the model into the image during build (~70 MB Ollama + ~398 MB model ≈ 470 MB total).
RUN ollama serve & \
    SERVER_PID=$! && \
    echo "Waiting for Ollama..." && \
    for i in $(seq 1 60); do \
      curl -sf http://127.0.0.1:11434/api/tags >/dev/null 2>&1 && break; \
      sleep 2; \
    done && \
    echo "Pulling ${MODEL_NAME}..." && \
    ollama pull "${MODEL_NAME}" && \
    echo "Model ready." && \
    kill $SERVER_PID && \
    wait $SERVER_PID 2>/dev/null || true

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 11434

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD sh -c 'curl -sf "http://127.0.0.1:${PORT:-11434}/api/tags" || exit 1'

ENTRYPOINT ["/docker-entrypoint.sh"]
