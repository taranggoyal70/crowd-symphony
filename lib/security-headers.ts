/**
 * Security headers middleware for Next.js
 * Adds CSP, HSTS, and other security headers
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const CSP_POLICY = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdn.pixabay.com",
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
	"font-src 'self' data: https://fonts.gstatic.com",
	"img-src 'self' data: https: blob:",
	"media-src 'self' https://cdn.pixabay.com blob:",
	"connect-src 'self' https://*.supabase.co https://*.vercel.app https://cdn.jsdelivr.net https://cdn.pixabay.com wss://*.supabase.co",
	"frame-src 'self'",
	"worker-src 'self' blob:",
	"manifest-src 'self'",
	"form-action 'self'",
	"base-uri 'self'",
	"frame-ancestors 'none'",
	"upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = {
	"Content-Security-Policy": CSP_POLICY,
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"X-XSS-Protection": "1; mode=block",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": [
		"camera=(self)",
		"microphone=()",
		"geolocation=()",
		"payment=()",
		"usb=()",
		"magnetometer=()",
		"accelerometer=()",
		"gyroscope=()",
	].join(", "),
};

export function securityHeadersMiddleware(request: NextRequest) {
	const response = NextResponse.next();

	// Add security headers
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(key, value);
	}

	// Add HSTS in production
	if (process.env.NODE_ENV === "production") {
		response.headers.set(
			"Strict-Transport-Security",
			"max-age=31536000; includeSubDomains; preload",
		);
	}

	// Add cache control for API routes
	if (request.nextUrl.pathname.startsWith("/api/")) {
		response.headers.set(
			"Cache-Control",
			"no-store, no-cache, must-revalidate, proxy-revalidate",
		);
	}

	return response;
}

export function addSecurityHeaders(response: NextResponse) {
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(key, value);
	}
	return response;
}
