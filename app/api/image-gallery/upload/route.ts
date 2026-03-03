import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/image-gallery/upload
 * Upload a new image to R2 bucket
 */
export async function POST(request: NextRequest) {
  try {
    // Get R2 bucket binding from environment
    const bucket = (process.env as any).image_gallery_bucket;

    if (!bucket) {
      return NextResponse.json(
        { error: 'R2 bucket not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string || '';
    const description = formData.get('description') as string || '';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
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

    // Convert file to ArrayBuffer for R2
    const arrayBuffer = await file.arrayBuffer();

    // Upload to R2
    await bucket.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: customMetadata
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Image uploaded successfully',
        image: {
          key,
          url: `/api/image-gallery/images/${key}`,
          size: file.size,
          contentType: file.type,
          ...customMetadata
        }
      },
      {
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
