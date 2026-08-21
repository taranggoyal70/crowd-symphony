/**
 * Feature flags system for Crowd Symphony
 * Allows gradual rollout and A/B testing of features
 */

export type FeatureFlag =
	| "websockets"
	| "recording"
	| "admin-dashboard"
	| "analytics"
	| "advanced-effects"
	| "multi-track"
	| "session-replay"
	| "custom-tracks"
	| "host-moments"
	| "qr-code-v2";

interface FeatureFlagConfig {
	enabled: boolean;
	description: string;
	rolloutPercentage?: number; // 0-100
	targetGroups?: string[]; // e.g., ["beta-users", "admins"]
}

const featureFlags: Record<FeatureFlag, FeatureFlagConfig> = {
	websockets: {
		enabled: false,
		description: "Use WebSockets instead of polling for realtime updates",
		rolloutPercentage: 0,
		targetGroups: ["beta-users"],
	},
	recording: {
		enabled: false,
		description: "Record sessions for replay",
		rolloutPercentage: 0,
		targetGroups: ["admins"],
	},
	"admin-dashboard": {
		enabled: process.env.NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD === "true",
		description: "Enable admin dashboard for monitoring",
		targetGroups: ["admins"],
	},
	analytics: {
		enabled: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
		description: "Enable PostHog analytics tracking",
	},
	"advanced-effects": {
		enabled: true,
		description: "Enable advanced visual effects (strobe, particles, etc.)",
	},
	"multi-track": {
		enabled: true,
		description: "Allow multiple audio tracks per session",
	},
	"session-replay": {
		enabled: false,
		description: "Record and replay full sessions",
		rolloutPercentage: 0,
		targetGroups: ["admins"],
	},
	"custom-tracks": {
		enabled: false,
		description: "Allow hosts to upload custom tracks",
		rolloutPercentage: 0,
		targetGroups: ["beta-users", "admins"],
	},
	"host-moments": {
		enabled: true,
		description: "Enable host-triggered crowd moments",
	},
	"qr-code-v2": {
		enabled: true,
		description: "Use improved QR code generation with error correction",
	},
};

// Client-side feature flags (only public ones)
const clientFeatureFlags: Record<string, FeatureFlagConfig> = {
	"advanced-effects": featureFlags["advanced-effects"],
	"multi-track": featureFlags["multi-track"],
	"host-moments": featureFlags["host-moments"],
	"qr-code-v2": featureFlags["qr-code-v2"],
};

function getClientId(): string {
	if (typeof window === "undefined") return "server";
	// Generate or retrieve stable client ID
	let clientId = localStorage.getItem("cs_client_id");
	if (!clientId) {
		clientId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
		localStorage.setItem("cs_client_id", clientId);
	}
	return clientId;
}

function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
}

function isInRollout(flag: FeatureFlagConfig, identifier: string): boolean {
	if (!flag.rolloutPercentage || flag.rolloutPercentage === 0) return false;
	if (flag.rolloutPercentage >= 100) return true;

	const hash = hashString(`${identifier}:${flag.enabled}`);
	return hash % 100 < flag.rolloutPercentage;
}

function isInTargetGroup(flag: FeatureFlagConfig, groups: string[]): boolean {
	if (!flag.targetGroups || flag.targetGroups.length === 0) return true;
	return flag.targetGroups.some((g) => groups.includes(g));
}

export function isFeatureEnabled(
	flag: FeatureFlag,
	context?: { userId?: string; groups?: string[] },
): boolean {
	const config = featureFlags[flag];
	if (!config) return false;

	// Check if explicitly enabled
	if (config.enabled) return true;

	// Check rollout percentage
	const identifier = context?.userId ?? getClientId();
	if (isInRollout(config, identifier)) return true;

	// Check target groups
	if (context?.groups && isInTargetGroup(config, context.groups)) return true;

	return false;
}

export function getClientFeatureFlags(): Record<string, boolean> {
	const clientId = getClientId();
	const flags: Record<string, boolean> = {};

	for (const [key] of Object.entries(clientFeatureFlags)) {
		flags[key] = isFeatureEnabled(key as FeatureFlag, { userId: clientId });
	}

	return flags;
}

export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
	const flags: Record<string, boolean> = {};

	for (const [key, config] of Object.entries(featureFlags)) {
		flags[key] = config.enabled;
	}

	return flags as Record<FeatureFlag, boolean>;
}

// React hook for client-side feature flags
export function useFeatureFlag(flag: FeatureFlag): boolean {
	if (typeof window === "undefined") {
		return featureFlags[flag]?.enabled ?? false;
	}

	const flags = getClientFeatureFlags();
	return flags[flag] ?? false;
}

// Server-side only: get feature flags for a user
export function getUserFeatureFlags(
	userId: string,
	groups: string[] = [],
): Record<FeatureFlag, boolean> {
	const flags: Record<string, boolean> = {};

	for (const [key] of Object.entries(featureFlags)) {
		flags[key] = isFeatureEnabled(key as FeatureFlag, { userId, groups });
	}

	return flags as Record<FeatureFlag, boolean>;
}

export { featureFlags, clientFeatureFlags };
export type { FeatureFlagConfig };
