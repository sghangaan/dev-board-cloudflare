import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/image-gallery/images
 * List all images from R2 bucket
 */
export async function GET(request: NextRequest) {
  try {
    // Get R2 bucket binding from environment
    const bucket = (process.env as any).image_gallery_bucket;

    if (!bucket) {
      return NextResponse.json(
        { error: 'R2 bucket not configured' },
        { status: 500 }
      );
    }

    // List all objects in bucket
    const listed = await bucket.list();

    // Get metadata for each image
    const images = await Promise.all(
      listed.objects.map(async (obj: any) => {
        const metadata = await bucket.head(obj.key);

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
    images.sort((a: any, b: any) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime());

    return NextResponse.json(
      {
        images,
        count: images.length
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (error) {
    console.error('List error:', error);
    return NextResponse.json(
      { error: 'Failed to list images' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
