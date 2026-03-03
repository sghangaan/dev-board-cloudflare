/**
 * Image Gallery API - Cloudflare Workers + R2
 * Handles image uploads, retrieval, and management
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // List all images
      if (path === '/api/images' && request.method === 'GET') {
        return await listImages(env, corsHeaders);
      }

      // Upload image
      if (path === '/api/upload' && request.method === 'POST') {
        return await uploadImage(request, env, corsHeaders);
      }

      // Get single image
      if (path.startsWith('/api/images/') && request.method === 'GET') {
        const key = path.replace('/api/images/', '');
        return await getImage(env, key, corsHeaders);
      }

      // Delete image
      if (path.startsWith('/api/images/') && request.method === 'DELETE') {
        const key = path.replace('/api/images/', '');
        return await deleteImage(env, key, corsHeaders);
      }

      // Get image metadata
      if (path.startsWith('/api/metadata/') && request.method === 'GET') {
        const key = path.replace('/api/metadata/', '');
        return await getMetadata(env, key, corsHeaders);
      }

      return jsonResponse({ error: 'Not found' }, 404, corsHeaders);

    } catch (error) {
      console.error('Error:', error);
      return jsonResponse({
        error: error.message || 'Internal server error'
      }, 500, corsHeaders);
    }
  },
};

/**
 * List all images in the bucket
 */
async function listImages(env, corsHeaders) {
  try {
    const listed = await env.image_gallery_bucket.list();

    const images = await Promise.all(
      listed.objects.map(async (obj) => {
        const metadata = await env.image_gallery_bucket.head(obj.key);

        return {
          key: obj.key,
          size: obj.size,
          uploaded: obj.uploaded,
          contentType: metadata?.httpMetadata?.contentType || 'image/jpeg',
          customMetadata: metadata?.customMetadata || {}
        };
      })
    );

    // Sort by upload date (newest first)
    images.sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));

    return jsonResponse({
      images,
      count: images.length
    }, 200, corsHeaders);

  } catch (error) {
    console.error('List error:', error);
    return jsonResponse({ error: 'Failed to list images' }, 500, corsHeaders);
  }
}

/**
 * Upload a new image
 */
async function uploadImage(request, env, corsHeaders) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title') || '';
    const description = formData.get('description') || '';

    if (!file) {
      return jsonResponse({ error: 'No file provided' }, 400, corsHeaders);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return jsonResponse({
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'
      }, 400, corsHeaders);
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return jsonResponse({
        error: 'File too large. Maximum size is 10MB.'
      }, 400, corsHeaders);
    }

    // Generate unique key
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const key = `${timestamp}-${randomString}.${extension}`;

    // Prepare metadata
    const customMetadata = {
      originalName: file.name,
      title: title,
      description: description,
      uploadedAt: new Date().toISOString()
    };

    // Upload to R2
    await env.image_gallery_bucket.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: customMetadata
    });

    return jsonResponse({
      success: true,
      message: 'Image uploaded successfully',
      image: {
        key,
        url: `/api/images/${key}`,
        size: file.size,
        contentType: file.type,
        ...customMetadata
      }
    }, 201, corsHeaders);

  } catch (error) {
    console.error('Upload error:', error);
    return jsonResponse({
      error: 'Failed to upload image'
    }, 500, corsHeaders);
  }
}

/**
 * Get image by key
 */
async function getImage(env, key, corsHeaders) {
  try {
    const object = await env.image_gallery_bucket.get(key);

    if (!object) {
      return jsonResponse({ error: 'Image not found' }, 404, corsHeaders);
    }

    const headers = {
      'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000',
      'ETag': object.httpEtag,
      ...corsHeaders
    };

    return new Response(object.body, { headers });

  } catch (error) {
    console.error('Get image error:', error);
    return jsonResponse({ error: 'Failed to retrieve image' }, 500, corsHeaders);
  }
}

/**
 * Delete image by key
 */
async function deleteImage(env, key, corsHeaders) {
  try {
    // Check if image exists
    const object = await env.image_gallery_bucket.head(key);

    if (!object) {
      return jsonResponse({ error: 'Image not found' }, 404, corsHeaders);
    }

    // Delete from R2
    await env.image_gallery_bucket.delete(key);

    return jsonResponse({
      success: true,
      message: 'Image deleted successfully'
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Delete error:', error);
    return jsonResponse({
      error: 'Failed to delete image'
    }, 500, corsHeaders);
  }
}

/**
 * Get image metadata
 */
async function getMetadata(env, key, corsHeaders) {
  try {
    const metadata = await env.image_gallery_bucket.head(key);

    if (!metadata) {
      return jsonResponse({ error: 'Image not found' }, 404, corsHeaders);
    }

    return jsonResponse({
      key,
      size: metadata.size,
      uploaded: metadata.uploaded,
      contentType: metadata.httpMetadata?.contentType,
      customMetadata: metadata.customMetadata || {},
      etag: metadata.httpEtag
    }, 200, corsHeaders);

  } catch (error) {
    console.error('Metadata error:', error);
    return jsonResponse({
      error: 'Failed to get metadata'
    }, 500, corsHeaders);
  }
}

/**
 * Helper: JSON response
 */
function jsonResponse(data, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    },
  });
}
