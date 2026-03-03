import Image from "next/image";
import Link from "next/link";

const tutorials = [
  {
    title: "URL Shortener",
    subtitle: "Workers + KV",
    description: "Build a URL shortening service with HTTP 301 redirects and global edge KV storage for sub-millisecond lookups",
    learn: "Serverless functions, key-value storage",
    href: "/url-shortener",
    icon: "🔗"
  },
  {
    title: "Task/Notes API",
    subtitle: "Workers + D1 Database",
    description: "RESTful API with SQLite database at the edge. Implement GET, POST, PUT, DELETE endpoints with SQL queries and transactions",
    learn: "REST APIs, serverless SQL",
    href: "/tasks-api",
    icon: "📝"
  },
  {
    title: "AI Chat Interface",
    subtitle: "Pages + Workers AI",
    description: "Interactive chat application with LLM inference using streaming responses. Deploy static frontend with serverless AI backend",
    learn: "Frontend deployment, AI integration",
    href: "/ai-chat",
    icon: "🤖"
  },
  {
    title: "Image Gallery",
    subtitle: "Pages + R2",
    description: "S3-compatible object storage with multipart uploads, presigned URLs, and CDN-cached image delivery at scale",
    learn: "File uploads, object storage",
    href: "/image-gallery",
    icon: "🖼️"
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <nav className="w-full mb-16">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                className="dark:invert"
                src="/next.svg"
                alt="Next.js logo"
                width={100}
                height={20}
                priority
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">×</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Cloudflare</span>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Cloudflare Dev Tutorials
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
            Learn to build modern serverless applications with Cloudflare&apos;s developer platform.
            Interactive tutorials covering Workers, KV, D1, R2, and AI.
          </p>
        </div>

        {/* Tutorial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tutorials.map((tutorial) => (
            <Link
              key={tutorial.href}
              href={tutorial.href}
              className="group block p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start gap-4 mb-4">
                <span className="text-4xl">{tutorial.icon}</span>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tutorial.title}
                  </h2>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {tutorial.subtitle}
                  </p>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {tutorial.description}
              </p>

              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-900 dark:text-gray-100">Learn:</span>
                <span className="text-gray-600 dark:text-gray-400">{tutorial.learn}</span>
              </div>

              <div className="mt-4 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400">
                Start tutorial
                <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Built with Next.js and Cloudflare Pages
          </p>
        </div>
      </main>
    </div>
  );
}
