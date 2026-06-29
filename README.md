# Ollama on Render (Free Tier)

Deploy **Ollama** with **qwen2.5:0.5b** on [Render](https://render.com) free tier.

| Resource | Size |
|----------|------|
| Ollama (CPU-only) | ~70 MB |
| qwen2.5:0.5b model | ~398 MB |
| **Total image** | **~470 MB** |

Fits within Render free tier limits (512 MB RAM). The model is **baked into the Docker image at build time** so cold starts do not re-download ~400 MB.

## Limitations (free tier)

- **512 MB RAM** — only tiny models like `qwen2.5:0.5b` work reliably
- **Spins down after 15 min** idle — first request after wake-up takes ~30–60 s
- **CPU only** — slow inference (~5–15 tokens/s)
- **Public URL** — anyone with the URL can use your API; do not expose secrets
- **Ephemeral disk** — runtime file changes are lost on restart (model survives because it is in the image)

## Deploy to Render

### Option A — Blueprint (recommended)

1. Push this repo to GitHub/GitLab.
2. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect the repo — Render reads `render.yaml` automatically.
4. Wait for the build (~5–10 min; model pull happens during build).
5. Open `https://ollama-qwen.onrender.com/api/tags` to verify.

### Option B — Manual web service

1. **New** → **Web Service** → connect repo.
2. **Runtime**: Docker  
3. **Plan**: Free  
4. **Health check path**: `/api/tags`
5. Deploy.

## Test the API

Replace `YOUR_URL` with your Render service URL.

```bash
# List models
curl https://YOUR_URL.onrender.com/api/tags

# Chat
curl https://YOUR_URL.onrender.com/api/chat -d '{
  "model": "qwen2.5:0.5b",
  "messages": [{"role": "user", "content": "Say hello in one sentence."}],
  "stream": false
}'
```

```bash
# Generate (completion)
curl https://YOUR_URL.onrender.com/api/generate -d '{
  "model": "qwen2.5:0.5b",
  "prompt": "Why is the sky blue?",
  "stream": false
}'
```

## Local development

```bash
docker build -t ollama-render .
docker run --rm -p 11434:11434 -e PORT=11434 ollama-render
```

Then open http://localhost:11434/api/tags

## Why qwen2.5:0.5b?

- Smallest official Qwen2.5 instruct model on Ollama (~398 MB)
- Runs on CPU with minimal RAM
- Good enough for simple chat / classification demos

Larger models (1.5b+) will **OOM** on the free tier.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MODEL_NAME` | `qwen2.5:0.5b` | Model to serve |
| `PORT` | `11434` | Set automatically by Render |
| `OLLAMA_CONTEXT_LENGTH` | `2048` | Lower = less RAM |
| `OLLAMA_KEEP_ALIVE` | `5m` | Unload model from RAM when idle |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Build fails on `ollama pull` | Retry deploy; Ollama registry may be slow |
| Service OOM / crashes | Confirm plan is Free (512 MB) and model is `qwen2.5:0.5b` only |
| Health check fails | Build may still be pulling model; allow 10+ min on first deploy |
| Slow first response | Free tier spins down; wake-up + inference is slow on CPU |
