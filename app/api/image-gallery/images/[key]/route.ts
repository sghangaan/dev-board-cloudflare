import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/image-gallery/images/[key]
 * Get a specific image from R2 bucket
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Get R2 bucket binding from environment
    const bucket = (process.env as any).image_gallery_bucket;

    if (!bucket) {
      return NextResponse.json(
        { error: 'R2 bucket not configured' },
        { status: 500 }
      );
    }

    const key = params.key;
    const object = await bucket.get(key);

    if (!object) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Convert R2 object body to ArrayBuffer
    const arrayBuffer = await object.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
        'ETag': object.httpEtag,
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Get image error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve image' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/image-gallery/images/[key]
 * Delete a specific image from R2 bucket
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Get R2 bucket binding from environment
    const bucket = (process.env as any).image_gallery_bucket;

    if (!bucket) {
      return NextResponse.json(
        { error: 'R2 bucket not configured' },
        { status: 500 }
      );
    }

    const key = params.key;

    // Check if image exists
    const object = await bucket.head(key);

    if (!object) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Delete from R2
    await bucket.delete(key);

    return NextResponse.json(
      {
        success: true,
        message: 'Image deleted successfully'
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
