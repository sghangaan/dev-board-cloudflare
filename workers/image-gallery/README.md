# Image Gallery Cloudflare Worker

This directory contains the Cloudflare Worker that powers the Image Gallery API.

## Deployed Worker

**URL:** `https://image-gallery-api.sghangaan.workers.dev`

## Files

- `worker.js` - Main worker code handling image upload, retrieval, and management
- `wrangler.toml` - Cloudflare Worker configuration

## R2 Bucket

- **Bucket Name:** `image-gallery-bucket`
- **Binding:** `image_gallery_bucket`

## API Endpoints

### GET /api/images
List all images in the gallery
- Returns: `{ images: [], count: number }`

### POST /api/upload
Upload a new image
- Body: FormData with `file`, `title`, `description`
- Returns: `{ success: true, image: {...} }`

### GET /api/images/:key
Retrieve a specific image
- Returns: Image binary with appropriate Content-Type

### DELETE /api/images/:key
Delete a specific image
- Returns: `{ success: true }`

### GET /api/metadata/:key
Get image metadata
- Returns: `{ key, size, uploaded, contentType, customMetadata, etag }`

## Deployment

To redeploy the worker:

```bash
cd workers/image-gallery
wrangler deploy
```

## Creating R2 Bucket

If you need to create the R2 bucket:

```bash
wrangler r2 bucket create image-gallery-bucket
```

## Features

- ✅ Image upload with validation (max 10MB, JPEG/PNG/GIF/WebP)
- ✅ Automatic image listing with metadata
- ✅ Image deletion
- ✅ Custom metadata (title, description)
- ✅ CORS enabled
- ✅ Cloudflare R2 object storage
