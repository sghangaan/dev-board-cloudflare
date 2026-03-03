# URL Shortener - Cloudflare Worker

This directory contains the Cloudflare Worker that powers the URL Shortener service using Cloudflare KV (key-value storage).

## Deployed Worker

**URL:** `https://url-shortener.sghangaan.workers.dev`

## Files

- `worker.js` - Main worker code handling URL shortening and redirects
- `wrangler.toml` - Cloudflare Worker configuration with KV binding

## Cloudflare KV Binding

The worker uses Cloudflare KV through the `URL_STORE` binding configured in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "URL_STORE"
id = "e681c6c47f284308974667a859a3e468"
```

## How It Works

1. **URL Shortening**: POST a long URL to `/api/shorten`
2. **Generate Short Code**: Creates a random 6-character code
3. **Store in KV**: Saves URL mapping with metadata (created date, click count)
4. **Redirect**: Visiting `/{shortCode}` redirects to the original URL
5. **Track Clicks**: Each visit increments the click counter

## API Endpoints

### POST /api/shorten
Create a shortened URL

**Request:**
```json
{
  "url": "https://example.com/very/long/url/here"
}
```

**Response:**
```json
{
  "shortUrl": "https://url-shortener.sghangaan.workers.dev/abc123",
  "shortCode": "abc123",
  "longUrl": "https://example.com/very/long/url/here"
}
```

**Error Response:**
```json
{
  "error": "Invalid URL"
}
```

### GET /api/stats/:shortCode
Get statistics for a shortened URL

**Response:**
```json
{
  "url": "https://example.com/original",
  "created": "2024-03-01T12:00:00.000Z",
  "clicks": 42
}
```

### GET /:shortCode
Redirect to the original URL

**Response:** HTTP 302 redirect to the original URL

If the short code doesn't exist, returns HTTP 404.

## Data Structure

Each shortened URL is stored in KV with this structure:

```javascript
{
  "url": "https://original-url.com",
  "created": "2024-03-01T12:00:00.000Z",
  "clicks": 0
}
```

## Features

- ✅ Random 6-character short codes (62^6 = 56.8 billion possibilities)
- ✅ URL validation (requires http:// or https://)
- ✅ Click tracking and analytics
- ✅ HTTP 302 redirects for compatibility
- ✅ Global edge KV storage for sub-millisecond lookups
- ✅ CORS enabled for API access
- ✅ No expiration (URLs last forever unless deleted)

## Setup Instructions

### 1. Create KV Namespace

```bash
cd workers/url-shortener

# Create production KV namespace
wrangler kv:namespace create URL_STORE

# Create preview KV namespace for local dev
wrangler kv:namespace create URL_STORE --preview
```

This will output namespace IDs. Update `wrangler.toml` with these IDs:

```toml
[[kv_namespaces]]
binding = "URL_STORE"
id = "your_production_kv_id"
preview_id = "your_preview_kv_id"
```

### 2. Deploy Worker

```bash
wrangler deploy
```

## Local Development

```bash
# Run locally with KV
wrangler dev

# Your worker will be available at http://localhost:8787
```

## KV Operations

### View Stored URLs

```bash
# List all keys in the namespace
wrangler kv:key list --namespace-id=e681c6c47f284308974667a859a3e468

# Get a specific short code
wrangler kv:key get abc123 --namespace-id=e681c6c47f284308974667a859a3e468
```

### Manage URLs

```bash
# Delete a short code
wrangler kv:key delete abc123 --namespace-id=e681c6c47f284308974667a859a3e468

# Manually create a short code
wrangler kv:key put custom --namespace-id=e681c6c47f284308974667a859a3e468 \
  --metadata='{"url":"https://example.com","created":"2024-03-01","clicks":0}'
```

### Bulk Operations

```bash
# Export all URLs to JSON
wrangler kv:key list --namespace-id=e681c6c47f284308974667a859a3e468 --prefix="" > urls.json

# Delete all URLs (use with caution!)
wrangler kv:key list --namespace-id=e681c6c47f284308974667a859a3e468 | \
  jq -r '.[].name' | \
  xargs -I {} wrangler kv:key delete {} --namespace-id=e681c6c47f284308974667a859a3e468
```

## Custom Short Codes

To implement custom short codes (e.g., `/mylink` instead of random):

1. Modify the `/api/shorten` endpoint to accept an optional `customCode` parameter
2. Check if the code already exists before creating it
3. Validate the custom code (alphanumeric, length limits, etc.)

Example modification:

```javascript
const shortCode = customCode || generateShortCode();

// Check if custom code already exists
if (customCode) {
  const existing = await env.URL_STORE.get(customCode);
  if (existing) {
    return jsonResponse({ error: 'Short code already in use' }, 409, corsHeaders);
  }
}
```

## Performance

- **KV Reads**: Sub-millisecond globally (cached at edge)
- **KV Writes**: ~1 second globally (eventual consistency)
- **Redirects**: Instant once KV read completes
- **Throughput**: Scales automatically with Cloudflare's network

## Limitations

- **KV Storage**: 1 GB per namespace (millions of URLs)
- **Key Size**: Max 512 bytes (plenty for short codes)
- **Value Size**: Max 25 MB (URLs + metadata are tiny)
- **Operations**: 1000 writes/sec, unlimited reads
- **Eventual Consistency**: Writes propagate globally in ~60 seconds

## Best Practices

1. **Short Code Length**: 6 characters balances uniqueness with URL brevity
2. **Character Set**: Mix of upper/lower case + numbers reduces collisions
3. **URL Validation**: Always validate before storing to prevent abuse
4. **Click Tracking**: Consider using Analytics Engine for detailed metrics
5. **Rate Limiting**: Add rate limiting to prevent abuse (not included in basic version)

## Security Considerations

- URLs are public if someone guesses the short code
- No authentication (anyone can create short URLs)
- Consider adding:
  - Rate limiting per IP
  - CAPTCHA for abuse prevention
  - URL blacklist for phishing protection
  - Password protection for sensitive links

## Analytics Upgrade

For production use, consider upgrading to Workers Analytics Engine:

```javascript
// In worker.js
await env.ANALYTICS.writeDataPoint({
  blobs: [shortCode, referrer, userAgent],
  doubles: [1], // click count
  indexes: [shortCode]
});
```

This provides:
- Real-time click analytics
- Referrer tracking
- Geographic data
- Time-series analysis
- 30-day retention (free tier)

## Troubleshooting

**KV writes not appearing immediately:**
- KV is eventually consistent (60s propagation)
- Use `--preview` namespace for local testing

**404 on redirect:**
- Check if short code exists in KV
- Verify namespace binding in wrangler.toml

**CORS errors:**
- Worker includes `Access-Control-Allow-Origin: *`
- Check browser network tab for specific error

**URL not redirecting:**
- Ensure URL includes http:// or https://
- Check KV value is valid JSON
