import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRateLimitKey, ratelimit } from "@/lib/rate-limit";
import { securityHeadersMiddleware } from "@/lib/security-headers";

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		"/((?!_next/static|_next/image|favicon.ico|public/).*)",
	],
};

export async function middleware(request: NextRequest) {
	// Apply security headers
	const response = securityHeadersMiddleware(request);

	// Apply rate limiting to API routes
	if (request.nextUrl.pathname.startsWith("/api/")) {
		const ip =
			request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
			request.headers.get("x-real-ip") ??
			"unknown";
		const key = getRateLimitKey(ip, request.nextUrl.pathname);

		const { success, limit, remaining, reset } = await ratelimit.limit(key);

		response.headers.set("X-RateLimit-Limit", limit.toString());
		response.headers.set("X-RateLimit-Remaining", remaining.toString());
		response.headers.set("X-RateLimit-Reset", reset.toString());

		if (!success) {
			return new NextResponse(JSON.stringify({ error: "Too Many Requests" }), {
				status: 429,
				headers: {
					"Content-Type": "application/json",
					...Object.fromEntries(response.headers),
				},
			});
		}
	}

	// Redirect www to non-www in production
	if (
		process.env.NODE_ENV === "production" &&
		request.headers.get("host")?.startsWith("www.")
	) {
		const url = request.nextUrl.clone();
		url.host = url.host.replace("www.", "");
		return NextResponse.redirect(url, 301);
	}

	return response;
}
