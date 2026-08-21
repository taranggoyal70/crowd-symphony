/**
 * CDN and asset optimization configuration
 */

export const cdnConfig = {
	// Base CDN URL for audio assets (configure for production)
	audio: {
		baseUrl: process.env.NEXT_PUBLIC_CDN_URL || "",
		// Cache headers for audio files
		cacheControl: "public, max-age=31536000, immutable",
		// Compression
		enableBrotli: true,
		enableGzip: true,
	},
	// Image optimization
	images: {
		domains: ["cdn.pixabay.com", "images.unsplash.com"],
		formats: ["image/avif", "image/webp"],
	},
	// Asset versioning for cache busting
	version: process.env.NEXT_PUBLIC_ASSET_VERSION || "1.0.0",
};

export function getAudioUrl(path: string): string {
	const base = cdnConfig.audio.baseUrl;
	if (!base) return path;
	if (path.startsWith("http")) return path;
	return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export function getCacheHeaders(): Record<string, string> {
	return {
		"Cache-Control": cdnConfig.audio.cacheControl,
	};
}
