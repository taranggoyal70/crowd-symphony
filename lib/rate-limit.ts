/**
 * Rate limiting for API routes using Vercel KV
 * Falls back to in-memory for local development
 */

import { createClient } from "@vercel/kv";

interface RateLimitResult {
	success: boolean;
	limit: number;
	remaining: number;
	reset: number;
}

class RateLimiter {
	private kv: ReturnType<typeof createClient> | null = null;
	private memoryStore = new Map<string, { count: number; reset: number }>();
	private readonly defaultLimit = 100;
	private readonly defaultWindowMs = 60_000; // 1 minute

	constructor() {
		// Only initialize KV in production with proper env vars
		if (
			process.env.NODE_ENV === "production" &&
			process.env.KV_REST_API_URL &&
			process.env.KV_REST_API_TOKEN
		) {
			try {
				this.kv = createClient({
					url: process.env.KV_REST_API_URL,
					token: process.env.KV_REST_API_TOKEN,
				});
			} catch (error) {
				console.warn(
					"Failed to initialize Vercel KV, falling back to in-memory rate limiting:",
					error,
				);
			}
		}
	}

	async limit(
		key: string,
		options: { limit?: number; windowMs?: number } = {},
	): Promise<RateLimitResult> {
		const limit = options.limit ?? this.defaultLimit;
		const windowMs = options.windowMs ?? this.defaultWindowMs;
		const windowSec = Math.ceil(windowMs / 1000);
		const now = Date.now();
		const reset = now + windowMs;

		if (this.kv) {
			// Use Vercel KV for distributed rate limiting
			const kvKey = `ratelimit:${key}`;
			const current = await this.kv.get<number>(kvKey);

			if (current === null) {
				await this.kv.set(kvKey, 1, { ex: windowSec });
				return {
					success: true,
					limit,
					remaining: limit - 1,
					reset,
				};
			}

			if (current >= limit) {
				const ttl = await this.kv.ttl(kvKey);
				return {
					success: false,
					limit,
					remaining: 0,
					reset: now + (ttl > 0 ? ttl * 1000 : windowMs),
				};
			}

			const newCount = await this.kv.incr(kvKey);
			return {
				success: true,
				limit,
				remaining: Math.max(0, limit - newCount),
				reset,
			};
		}

		// Fallback to in-memory store (dev only, not suitable for production)
		const entry = this.memoryStore.get(key);
		if (!entry || now > entry.reset) {
			this.memoryStore.set(key, { count: 1, reset });
			return { success: true, limit, remaining: limit - 1, reset };
		}

		if (entry.count >= limit) {
			return {
				success: false,
				limit,
				remaining: 0,
				reset: entry.reset,
			};
		}

		entry.count++;
		return {
			success: true,
			limit,
			remaining: limit - entry.count,
			reset: entry.reset,
		};
	}

	// Clean up expired entries from memory store periodically
	cleanup() {
		const now = Date.now();
		for (const [key, entry] of this.memoryStore.entries()) {
			if (now > entry.reset) {
				this.memoryStore.delete(key);
			}
		}
	}
}

export const ratelimit = new RateLimiter();

// Run cleanup every 5 minutes in development
if (process.env.NODE_ENV !== "production" && typeof window === "undefined") {
	setInterval(() => ratelimit.cleanup(), 5 * 60 * 1000);
}

export function getRateLimitKey(identifier: string, endpoint: string): string {
	return `${identifier}:${endpoint}`;
}

// Specific rate limit configs for different endpoints
export const rateLimitConfigs = {
	realtime: { limit: 60, windowMs: 60_000 }, // 60 req/min for realtime
	heartbeat: { limit: 120, windowMs: 60_000 }, // 120 req/min for heartbeats
	host: { limit: 30, windowMs: 60_000 }, // 30 req/min for host actions
	auth: { limit: 10, windowMs: 60_000 }, // 10 req/min for auth
	default: { limit: 100, windowMs: 60_000 },
} as const;
