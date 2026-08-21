/**
 * Sentry configuration for error tracking and performance monitoring
 */

import * as Sentry from "@sentry/nextjs";

export function initSentry() {
	const env = process.env.NODE_ENV;
	const isProduction = env === "production";
	const isStaging = process.env.VERCEL_ENV === "staging";

	if (!isProduction && !isStaging) {
		return;
	}

	const dsn = process.env.SENTRY_DSN;
	if (!dsn) {
		console.warn("SENTRY_DSN not set, skipping Sentry initialization");
		return;
	}

	Sentry.init({
		dsn,

		// Adjust this value in production, or use tracesSampler for greater control
		tracesSampleRate: 0.1,

		// Session Replay - records user interactions for debugging
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,

		// Enable debug mode in development
		debug: process.env.NODE_ENV === "development",

		// Set environment
		environment: process.env.NODE_ENV,

		// Ignore certain errors
		ignoreErrors: [
			// Ignore network errors
			"NetworkError",
			"Network request failed",
			// Ignore aborted requests
			"AbortError",
			// Ignore media errors
			"MediaError",
			// Ignore clipboard errors
			"ClipboardError",
		],

		// Before send hook to filter/modify events
		beforeSend(event, _hint) {
			// Filter out development errors
			if (process.env.NODE_ENV === "development") {
				return null;
			}

			// Don't send errors without a stack trace
			if (!event.exception) {
				return null;
			}

			return event;
		},

		// Custom tags
		initialScope: {
			tags: {
				component: "crowd-symphony",
				feature: "realtime-audio",
			},
		},
	});
}

// Client-side initialization
export function initSentryClient() {
	if (typeof window === "undefined") return;

	const env = process.env.NODE_ENV;
	const isProduction = env === "production";
	const isStaging = process.env.VERCEL_ENV === "staging";

	if (!isProduction && !isStaging) {
		return;
	}

	const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
	if (!dsn) return;

	Sentry.init({
		dsn,
		tracesSampleRate: 0.1,
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,
		environment: process.env.NODE_ENV,
	});
}

// Helper to capture errors with context
export function captureError(error: Error, context?: Record<string, unknown>) {
	const env = process.env.NODE_ENV;
	const isProduction = env === "production";
	const isStaging = process.env.VERCEL_ENV === "staging";

	if (!isProduction && !isStaging) {
		console.error(error);
		return;
	}

	Sentry.captureException(error, {
		extra: context,
	});
}

// Helper to capture messages
export function captureMessage(
	message: string,
	level: Sentry.SeverityLevel = "info",
	context?: Record<string, unknown>,
) {
	const env = process.env.NODE_ENV;
	const isProduction = env === "production";
	const isStaging = process.env.VERCEL_ENV === "staging";

	if (!isProduction && !isStaging) {
		console.log(`[${level}] ${message}`, context);
		return;
	}

	Sentry.captureMessage(message, { level, extra: context });
}

// Helper to set user context
export function setSentryUser(user: {
	id: string;
	email?: string;
	username?: string;
}) {
	Sentry.setUser(user);
}

// Helper to clear user context
export function clearSentryUser() {
	Sentry.setUser(null);
}

// Helper to add breadcrumbs
export function addSentryBreadcrumb(
	category: string,
	message: string,
	data?: Record<string, unknown>,
) {
	Sentry.addBreadcrumb({
		category,
		message,
		data,
		level: "info",
	});
}

// Export Sentry for advanced usage
export { Sentry };
