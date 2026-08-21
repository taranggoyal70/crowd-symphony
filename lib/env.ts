/**
 * Environment validation for Crowd Symphony
 * Ensures all required environment variables are present and valid at startup
 */

const requiredEnvVars = {
	// Core
	DATABASE_URL: { required: true, description: "PostgreSQL connection string" },
	NEXT_PUBLIC_APP_URL: { required: true, description: "Public app URL" },

	// Auth (optional for local dev)
	NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: {
		required: process.env.NODE_ENV === "production",
		description: "Clerk publishable key",
	},
	CLERK_SECRET_KEY: {
		required: process.env.NODE_ENV === "production",
		description: "Clerk secret key",
	},

	// Analytics (optional)
	NEXT_PUBLIC_POSTHOG_KEY: {
		required: false,
		description: "PostHog API key",
	},
	NEXT_PUBLIC_POSTHOG_HOST: {
		required: false,
		description: "PostHog host URL",
	},

	// Monitoring (optional)
	SENTRY_DSN: { required: false, description: "Sentry DSN" },
	SENTRY_ORG: { required: false, description: "Sentry organization" },
	SENTRY_PROJECT: { required: false, description: "Sentry project" },

	// Supabase (optional if using raw PostgreSQL)
	SUPABASE_URL: { required: false, description: "Supabase project URL" },
	SUPABASE_ANON_KEY: { required: false, description: "Supabase anon key" },
	SUPABASE_SERVICE_ROLE_KEY: {
		required: false,
		description: "Supabase service role key",
	},
} as const;

type EnvVarKey = keyof typeof requiredEnvVars;

interface ValidatedEnv {
	DATABASE_URL: string;
	NEXT_PUBLIC_APP_URL: string;
	NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
	CLERK_SECRET_KEY?: string;
	NEXT_PUBLIC_POSTHOG_KEY?: string;
	NEXT_PUBLIC_POSTHOG_HOST?: string;
	SENTRY_DSN?: string;
	SENTRY_ORG?: string;
	SENTRY_PROJECT?: string;
	SUPABASE_URL?: string;
	SUPABASE_ANON_KEY?: string;
	SUPABASE_SERVICE_ROLE_KEY?: string;
}

function validateEnv(): ValidatedEnv {
	const missing: string[] = [];
	const invalid: string[] = [];

	for (const [key, config] of Object.entries(requiredEnvVars)) {
		const value = process.env[key];

		if (config.required && (!value || value.trim() === "")) {
			missing.push(`${key} (${config.description})`);
			continue;
		}

		if (value) {
			// Basic URL validation for URL-type vars
			if (key.endsWith("_URL") || key === "DATABASE_URL") {
				try {
					new URL(value);
				} catch {
					invalid.push(`${key} (must be a valid URL)`);
				}
			}

			// Validate DSN format for Sentry
			if (key === "SENTRY_DSN" && value) {
				try {
					const url = new URL(value);
					if (!url.protocol.startsWith("http")) {
						invalid.push(`${key} (must use http/https protocol)`);
					}
				} catch {
					invalid.push(`${key} (must be a valid URL)`);
				}
			}
		}
	}

	if (missing.length > 0) {
		const message = [
			"Missing required environment variables:",
			...missing.map((m) => `  - ${m}`),
			"",
			"Copy .env.example to .env.local and fill in the values.",
			"See https://github.com/taranggoyal70/crowd-symphony#environment-setup",
		].join("\n");

		throw new Error(message);
	}

	if (invalid.length > 0) {
		const message = [
			"Invalid environment variables:",
			...invalid.map((i) => `  - ${i}`),
		].join("\n");
		throw new Error(message);
	}

	// Return validated env with proper types
	const databaseUrl = process.env.DATABASE_URL;
	const appUrl = process.env.NEXT_PUBLIC_APP_URL;

	if (!databaseUrl || !appUrl) {
		throw new Error("Required environment variables missing after validation");
	}

	return {
		DATABASE_URL: databaseUrl,
		NEXT_PUBLIC_APP_URL: appUrl,
		NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
			process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
		CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
		NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
		NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
		SENTRY_DSN: process.env.SENTRY_DSN,
		SENTRY_ORG: process.env.SENTRY_ORG,
		SENTRY_PROJECT: process.env.SENTRY_PROJECT,
		SUPABASE_URL: process.env.SUPABASE_URL,
		SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
		SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
	};
}

// Validate on module load (server-side only)
let validatedEnv: ValidatedEnv | null = null;

export function getValidatedEnv(): ValidatedEnv {
	if (typeof window !== "undefined") {
		// Client-side: return only public vars
		return {
			DATABASE_URL: "",
			NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "",
			NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
				process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
			NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
			NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
		} as ValidatedEnv;
	}

	if (!validatedEnv) {
		validatedEnv = validateEnv();
	}
	return validatedEnv;
}

// Export individual validated vars for convenience
export const env = getValidatedEnv();

export type { ValidatedEnv, EnvVarKey };
