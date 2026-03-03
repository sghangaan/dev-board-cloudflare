import Link from "next/link";

export default function ImageGallery() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-8 transition-colors"
        >
          <span className="mr-2">←</span>
          Back to Tutorials
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">🖼️</span>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                Image Gallery
              </h1>
              <p className="text-lg text-blue-600 dark:text-blue-400 font-medium">
                Pages + R2
              </p>
            </div>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            S3-compatible object storage with multipart uploads, presigned URLs, and CDN-cached image delivery at scale
          </p>
        </div>
      </main>
    </div>
  );
}