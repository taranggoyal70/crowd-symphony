/**
 * Analytics integration for Crowd Symphony
 * Uses PostHog for event tracking
 */

import posthog from "posthog-js";

let posthogInitialized = false;

export function initPostHog() {
	if (typeof window === "undefined") return;
	if (posthogInitialized) return;

	const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
	const host =
		process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

	if (!key) {
		console.warn("PostHog key not configured, analytics disabled");
		return;
	}

	posthog.init(key, {
		api_host: host,
		autocapture: true,
		capture_pageview: true,
		capture_pageleave: true,
		persistence: "localStorage",
		loaded: (posthog) => {
			if (process.env.NODE_ENV === "development") {
				posthog.debug();
			}
		},
	});

	posthogInitialized = true;
}

// Event tracking helpers
export const analytics = {
	// Session events
	sessionCreated: (sessionId: string, roomCode: string, isHost: boolean) => {
		posthog.capture("session_created", {
			session_id: sessionId,
			room_code: roomCode,
			is_host: isHost,
		});
	},

	sessionJoined: (
		sessionId: string,
		roomCode: string,
		section: "left" | "right",
	) => {
		posthog.capture("session_joined", {
			session_id: sessionId,
			room_code: roomCode,
			section,
		});
	},

	conductorStarted: (sessionId: string) => {
		posthog.capture("conductor_started", { session_id: sessionId });
	},

	conductorStopped: (sessionId: string, durationMs: number) => {
		posthog.capture("conductor_stopped", {
			session_id: sessionId,
			duration_ms: durationMs,
		});
	},

	// Audio events
	trackSelected: (sessionId: string, trackIndex: number, trackName: string) => {
		posthog.capture("track_selected", {
			session_id: sessionId,
			track_index: trackIndex,
			track_name: trackName,
		});
	},

	audioEnabled: (sessionId: string, section: "left" | "right") => {
		posthog.capture("audio_enabled", {
			session_id: sessionId,
			section,
		});
	},

	audioDisabled: (sessionId: string, section: "left" | "right") => {
		posthog.capture("audio_disabled", {
			session_id: sessionId,
			section,
		});
	},

	volumeChanged: (
		sessionId: string,
		section: "left" | "right",
		volume: number,
		source: "conductor" | "host" | "auto",
	) => {
		posthog.capture("volume_changed", {
			session_id: sessionId,
			section,
			volume,
			source,
		});
	},

	// Effects
	effectModeChanged: (
		sessionId: string,
		mode: "symphony" | "bass-drop" | "strobe",
	) => {
		posthog.capture("effect_mode_changed", {
			session_id: sessionId,
			mode,
		});
	},

	momentTriggered: (
		sessionId: string,
		kind: "pulse" | "left-drop" | "right-drop" | "blackout" | "finale",
		label: string,
	) => {
		posthog.capture("moment_triggered", {
			session_id: sessionId,
			moment_kind: kind,
			moment_label: label,
		});
	},

	// Engagement
	qrCodeScanned: (sessionId: string, method: "camera" | "manual") => {
		posthog.capture("qr_code_scanned", {
			session_id: sessionId,
			method,
		});
	},

	roomCodeEntered: (sessionId: string, success: boolean) => {
		posthog.capture("room_code_entered", {
			session_id: sessionId,
			success,
		});
	},

	// Errors
	errorOccurred: (error: Error, context?: Record<string, unknown>) => {
		posthog.capture("error_occurred", {
			error_message: error.message,
			error_stack: error.stack,
			...context,
		});
	},

	// Performance
	pageLoadTime: (page: string, loadTimeMs: number) => {
		posthog.capture("page_load_time", {
			page,
			load_time_ms: loadTimeMs,
		});
	},

	// Feature usage
	featureUsed: (feature: string, metadata?: Record<string, unknown>) => {
		posthog.capture("feature_used", {
			feature,
			...metadata,
		});
	},
};

// Identify user (call after auth)
export function identifyUser(userId: string, traits?: Record<string, unknown>) {
	posthog.identify(userId, traits);
}

// Reset user on logout
export function resetUser() {
	posthog.reset();
}

// Get PostHog instance for advanced usage
export function getPostHog() {
	return posthog;
}
