# Cloudflare Workers

This directory contains all the Cloudflare Workers for the dev board project.

## 🔒 Security Setup

**IMPORTANT:** Before deploying any worker, you must configure your credentials:

### First-Time Setup

Each worker has a `wrangler.jsonc.example` file. You need to:

1. **Copy the example file:**
   ```bash
   cd workers/[worker-name]
   cp wrangler.jsonc.example wrangler.jsonc
   ```

2. **Add your credentials:**
   - Edit `wrangler.jsonc` and replace placeholder values with your actual IDs
   - Get your IDs from Cloudflare Dashboard or by creating resources via CLI

3. **Never commit `wrangler.jsonc`:**
   - This file is gitignored to protect your credentials
   - Only commit `wrangler.jsonc.example` files

## Available Workers

### 1. **AI Chat** (`ai-chat/`)
- Powers the AI chat interface using Workers AI
- **Setup:** Copy `wrangler.jsonc.example` to `wrangler.jsonc` (no additional config needed)

### 2. **Image Gallery** (`image-gallery/`)
- Image storage and retrieval using R2 bucket
- **Setup:** Create R2 bucket and update `wrangler.jsonc` with bucket name
- **Command:** `wrangler r2 bucket create your-bucket-name`

### 3. **Task API** (`task-api/`)
- RESTful API for task management using D1 database
- **Setup:** Create D1 database and update `wrangler.jsonc` with database ID
- **Command:** `wrangler d1 create tasks-db`

### 4. **URL Shortener** (`url-shortener/`)
- URL shortening service using KV storage
- **Setup:** Create KV namespace and update `wrangler.jsonc` with namespace ID
- **Command:** `wrangler kv:namespace create URL_STORE`

## Quick Start Guide

For each worker you want to deploy:

```bash
# 1. Navigate to worker directory
cd workers/[worker-name]

# 2. Set up configuration
cp wrangler.jsonc.example wrangler.jsonc

# 3. Create required resources (see worker-specific README)
# Example for D1: wrangler d1 create tasks-db
# Example for KV: wrangler kv:namespace create URL_STORE
# Example for R2: wrangler r2 bucket create bucket-name

# 4. Update wrangler.jsonc with your resource IDs

# 5. Deploy
wrangler deploy
```

## Configuration Files

- **`wrangler.jsonc.example`** - Template file (committed to git)
- **`wrangler.jsonc`** - Your actual config with credentials (gitignored)
- **`.env.example`** - Environment variable template (committed to git)
- **`.env.local`** - Your actual environment variables (gitignored)

## Best Practices

✅ **DO:**
- Keep `wrangler.jsonc` local and never commit it
- Use `wrangler.jsonc.example` as a template for others
- Document all required configuration in README files
- Test locally with `wrangler dev` before deploying

❌ **DON'T:**
- Commit database IDs, namespace IDs, or bucket names to public repos
- Share your `wrangler.jsonc` file
- Hardcode API keys or secrets in worker code
- Skip the `.example` file when adding new workers

## Local Development

Each worker can be run locally:

```bash
cd workers/[worker-name]
wrangler dev
```

This starts a local server and simulates the Cloudflare Workers environment.

## Deployment

Deploy individual workers:

```bash
cd workers/[worker-name]
wrangler deploy
```

Or deploy all at once (from project root):

```bash
# Deploy all workers (run from each directory)
for dir in workers/*/; do
  cd "$dir"
  wrangler deploy
  cd ../..
done
```

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Workers AI](https://developers.cloudflare.com/workers-ai/)
- [D1 Database](https://developers.cloudflare.com/d1/)
- [R2 Storage](https://developers.cloudflare.com/r2/)
- [KV Storage](https://developers.cloudflare.com/kv/)
