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
    <div className="min-h-screen bg-[#0a0a0a]">
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <nav className="w-full mb-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                className="invert"
                src="/next.svg"
                alt="Next.js logo"
                width={120}
                height={24}
                priority
              />
              <span className="text-sm text-gray-600">×</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                  Cloudflare
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="mb-20">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-6 leading-tight">
            Cloudflare Dev Tutorials
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl leading-relaxed">
            Learn to build modern serverless applications with Cloudflare&apos;s developer platform.
            Interactive tutorials covering <span className="text-gray-200 font-semibold">Workers, KV, D1, R2, and AI</span>.
          </p>
        </div>

        {/* Tutorial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tutorials.map((tutorial) => (
            <Link
              key={tutorial.href}
              href={tutorial.href}
              className="group block p-8 rounded-2xl border border-[#2a2a2a] bg-gradient-to-br from-[#1a1a1a] to-[#151515] hover:border-[#3a3a3a] hover:from-[#1f1f1f] hover:to-[#1a1a1a] transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 relative overflow-hidden"
            >
              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

              <div className="relative z-10">
                <div className="flex items-start gap-5 mb-5">
                  <div className="text-5xl p-3 rounded-xl bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] group-hover:scale-110 transition-transform duration-300">
                    {tutorial.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2 group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                      {tutorial.title}
                    </h2>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                      <span className="text-sm font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        {tutorial.subtitle}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-400 mb-5 leading-relaxed">
                  {tutorial.description}
                </p>

                <div className="flex items-center gap-2 text-sm mb-5 p-3 rounded-lg bg-[#1f1f1f]/50 border border-[#2a2a2a]">
                  <span className="font-semibold text-gray-300">Learn:</span>
                  <span className="text-gray-400">{tutorial.learn}</span>
                </div>

                <div className="flex items-center text-sm font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent group-hover:from-indigo-300 group-hover:to-purple-300">
                  Start tutorial
                  <span className="ml-2 group-hover:translate-x-2 transition-transform duration-300">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-[#2a2a2a]">
          <p className="text-sm text-gray-500 text-center">
            Built with <span className="text-gray-400 font-semibold">Next.js</span> and{" "}
            <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent font-semibold">
              Cloudflare Pages
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
