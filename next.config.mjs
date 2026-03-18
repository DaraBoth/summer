/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*\\.pdf",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=31536000, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/app/api/pdf-worker",
        destination: "/api/pdf-worker",
      },
      {
        source: "/menu.pdf",
        destination: "/api/pdf",
      },
    ];
  },
};

export default nextConfig;
