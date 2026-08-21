import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactCompiler: true,
	turbopack: {
		root: process.cwd(),
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "cdn.pixabay.com",
			},
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
		],
		formats: ["image/avif", "image/webp"],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
	},
	async headers() {
		return [
			{
				source: "/music/:path*",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=31536000, immutable",
					},
					{
						key: "Accept-Ranges",
						value: "bytes",
					},
					{
						key: "Content-Type",
						value: "audio/mpeg",
					},
				],
			},
			{
				source: "/:path*.mp3",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=31536000, immutable",
					},
					{
						key: "Accept-Ranges",
						value: "bytes",
					},
				],
			},
			{
				source: "/:path*.webmanifest",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=86400, must-revalidate",
					},
					{
						key: "Content-Type",
						value: "application/manifest+json",
					},
				],
			},
		];
	},
	async rewrites() {
		return [
			{
				source: "/service-worker.js",
				destination: "/_next/static/service-worker.js",
			},
		];
	},
	experimental: {
		optimizePackageImports: ["lucide-react", "framer-motion"],
	},
};

export default nextConfig;
