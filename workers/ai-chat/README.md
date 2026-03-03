# AI Chat Cloudflare Worker

This directory contains the Cloudflare Worker that powers the AI Chat interface using Cloudflare Workers AI.

## Deployed Worker

**URL:** `https://ai-chat-api.sghangaan.workers.dev`

## Files

- `worker.js` - Main worker code handling AI chat completions
- `wrangler.toml` - Cloudflare Worker configuration with Workers AI binding

## Workers AI Binding

The worker uses Cloudflare Workers AI through the `AI` binding configured in `wrangler.toml`:

```toml
[ai]
binding = "AI"
```

## Available AI Models

### Llama 3.1 8B (Default)
- **ID:** `@cf/meta/llama-3.1-8b-instruct`
- **Description:** Fast and efficient for general conversations
- **Provider:** Meta

### Llama 3.3 70B
- **ID:** `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- **Description:** More capable, better reasoning
- **Provider:** Meta

### Mistral 7B
- **ID:** `@cf/mistral/mistral-7b-instruct-v0.1`
- **Description:** Great for instruction following
- **Provider:** Mistral

### Qwen 1.5 14B
- **ID:** `@cf/qwen/qwen1.5-14b-chat-awq`
- **Description:** Multilingual support
- **Provider:** Qwen

## API Endpoints

### POST /api/chat
Send a chat message and get AI response

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "model": "@cf/meta/llama-3.1-8b-instruct",
  "stream": false
}
```

**Response:**
```json
{
  "response": "Hello! How can I help you today?",
  "model": "@cf/meta/llama-3.1-8b-instruct",
  "usage": {}
}
```

### GET /api/models
List all available AI models

**Response:**
```json
{
  "models": [
    {
      "id": "@cf/meta/llama-3.1-8b-instruct",
      "name": "Llama 3.1 8B",
      "description": "Fast and efficient for general conversations",
      "provider": "Meta"
    }
  ]
}
```

## Features

- ✅ Multiple AI models (Llama, Mistral, Qwen)
- ✅ Streaming support via Server-Sent Events (SSE)
- ✅ Non-streaming responses
- ✅ Full conversation history support
- ✅ CORS enabled
- ✅ Powered by Cloudflare's global network

## Streaming Support

The worker supports both streaming and non-streaming responses:

**Streaming (SSE):**
```json
{
  "messages": [...],
  "model": "@cf/meta/llama-3.1-8b-instruct",
  "stream": true
}
```

Response format:
```
data: {"content": "Hello", "done": false}

data: {"content": " there!", "done": false}

data: {"done": true}
```

## Deployment

To redeploy the worker:

```bash
cd workers/ai-chat
wrangler deploy
```

## No Additional Setup Required!

Workers AI is included in your Cloudflare account - no additional configuration, API keys, or buckets needed. Just deploy and start chatting!

## Usage Notes

- The AI binding is automatically available in the `env.AI` object
- Each request to Workers AI counts toward your account's Workers AI usage
- Free tier includes generous limits for development and testing
