import { getCache } from "@vercel/functions";
import { NextResponse } from "next/server";
import {
	createMoment,
	createSession,
	getAudienceCounts,
	getSessionByRoomCode,
	joinSession,
	logSessionEvent,
	updateSession,
} from "@/lib/db/sessions";
import { errors, formatErrorResponse } from "@/lib/errors";

type Section = "left" | "right";

type EffectMode = "symphony" | "bass-drop" | "strobe";
type MomentKind = "pulse" | "left-drop" | "right-drop" | "blackout" | "finale";

type CrowdMoment = {
	id: string;
	label: string;
	kind: MomentKind;
	triggeredAt: number;
};

type RealtimeState = {
	type: "state";
	leftVolume: number;
	rightVolume: number;
	conductorActive: boolean;
	updatedAt: number;
	volumeSequence: number;
	selectedTrack: number;
	eventName: string;
	effectMode: EffectMode;
	activeMoment: CrowdMoment | null;
	userCount: { left: number; right: number; total: number };
};

type RealtimePostBody =
	| {
			role: "conductor";
			sessionId: string;
			type: "volumeChange";
			leftVolume: number;
			rightVolume: number;
			sequence?: number;
	  }
	| {
			role: "conductor";
			sessionId: string;
			type: "conductorStart" | "conductorStop";
	  }
	| {
			role: "audience";
			sessionId: string;
			type: "heartbeat";
			clientId: string;
			section: Section;
	  }
	| {
			role: "host";
			sessionId: string;
			type: "hostUpdate";
			selectedTrack?: number;
			eventName?: string;
			effectMode?: EffectMode;
	  }
	| {
			role: "host";
			sessionId: string;
			type: "showStart" | "showStop";
	  }
	| {
			role: "host";
			sessionId: string;
			type: "triggerMoment";
			moment: {
				label?: string;
				kind?: MomentKind;
			};
	  };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

const cache = getCache({ namespace: "crowd-symphony" });
const _audienceTtlMs = 10_000;
const sessionTtlSeconds = 60 * 60;

function controlKey(sessionId: string) {
	return `control:${sessionId}`;
}

function _audienceKey(sessionId: string) {
	return `audience:${sessionId}`;
}

function isValidSessionId(sessionId: unknown): sessionId is string {
	return (
		typeof sessionId === "string" && /^[a-zA-Z0-9_-]{3,64}$/.test(sessionId)
	);
}

function isSection(section: unknown): section is Section {
	return section === "left" || section === "right";
}

function safeNumber(value: unknown, fallback: number) {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return fallback;
	}
	return Math.max(0, Math.min(100, Math.round(value)));
}

function safeSequence(value: unknown, fallback: number) {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return fallback;
	}
	return Math.max(0, Math.round(value));
}

function safeTrackIndex(value: unknown, fallback: number) {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return fallback;
	}
	return Math.max(0, Math.min(4, Math.round(value)));
}

function safeEventName(value: unknown, fallback: string) {
	if (typeof value !== "string") {
		return fallback;
	}
	const cleaned = value.trim().slice(0, 60);
	return cleaned || fallback;
}

function isEffectMode(value: unknown): value is EffectMode {
	return value === "symphony" || value === "bass-drop" || value === "strobe";
}

function isMomentKind(value: unknown): value is MomentKind {
	return (
		value === "pulse" ||
		value === "left-drop" ||
		value === "right-drop" ||
		value === "blackout" ||
		value === "finale"
	);
}

function safeMomentLabel(value: unknown, fallback: string) {
	if (typeof value !== "string") {
		return fallback;
	}
	const cleaned = value.trim().slice(0, 42);
	return cleaned || fallback;
}

function defaultMomentLabel(kind: MomentKind) {
	switch (kind) {
		case "left-drop":
			return "Left Side Drop";
		case "right-drop":
			return "Right Side Drop";
		case "blackout":
			return "Blackout Build";
		case "finale":
			return "Finale Burst";
		default:
			return "Full Crowd Pulse";
	}
}

function effectForMoment(kind: MomentKind): EffectMode {
	if (kind === "blackout" || kind === "finale") {
		return "strobe";
	}
	if (kind === "left-drop" || kind === "right-drop") {
		return "bass-drop";
	}
	return "symphony";
}

function toRealtimeState(
	session: Awaited<ReturnType<typeof getSessionByRoomCode>>,
	audienceCounts: { left: number; right: number; total: number },
): RealtimeState {
	if (!session) {
		throw errors.notFound("Session");
	}

	return {
		type: "state",
		leftVolume: session.left_volume,
		rightVolume: session.right_volume,
		conductorActive: session.conductor_active,
		updatedAt: new Date(session.updated_at).getTime(),
		volumeSequence: session.volume_sequence,
		selectedTrack: session.selected_track,
		eventName: session.event_name,
		effectMode: session.effect_mode,
		activeMoment: session.active_moment_id
			? {
					id: session.active_moment_id,
					label: session.active_moment_label ?? "",
					kind: session.active_moment_kind as MomentKind,
					triggeredAt: session.active_moment_triggered_at ?? 0,
				}
			: null,
		userCount: audienceCounts,
	};
}

async function readControlFromCache(
	sessionId: string,
): Promise<RealtimeState | null> {
	const cached = await cache.get(controlKey(sessionId));
	if (cached && typeof cached === "object" && "leftVolume" in cached) {
		const c = cached as {
			leftVolume: number;
			rightVolume: number;
			conductorActive: boolean;
			updatedAt: number;
			volumeSequence: number;
			selectedTrack: number;
			eventName: string;
			effectMode: EffectMode;
			activeMoment: CrowdMoment | null;
		};
		return {
			type: "state",
			...c,
			userCount: { left: 0, right: 0, total: 0 },
		};
	}
	return null;
}

async function writeControlToCache(sessionId: string, state: RealtimeState) {
	await cache.set(controlKey(sessionId), state, {
		name: `Crowd Symphony control ${sessionId}`,
		tags: [`control:${sessionId}`],
		ttl: sessionTtlSeconds,
	});
}

async function getOrCreateSession(sessionId: string) {
	// Try cache first for ultra-fast reads
	const cached = await readControlFromCache(sessionId);
	if (cached) {
		return cached;
	}

	// Fall back to database
	let session = await getSessionByRoomCode(sessionId);
	if (!session) {
		// Auto-create session if it doesn't exist (for ad-hoc rooms)
		session = await createSession(sessionId);
	}

	// Sync to cache
	const state: RealtimeState = {
		type: "state",
		leftVolume: session.left_volume,
		rightVolume: session.right_volume,
		conductorActive: session.conductor_active,
		updatedAt: new Date(session.updated_at).getTime(),
		volumeSequence: session.volume_sequence,
		selectedTrack: session.selected_track,
		eventName: session.event_name,
		effectMode: session.effect_mode,
		activeMoment: session.active_moment_id
			? {
					id: session.active_moment_id,
					label: session.active_moment_label ?? "",
					kind: session.active_moment_kind as MomentKind,
					triggeredAt: session.active_moment_triggered_at ?? 0,
				}
			: null,
		userCount: { left: 0, right: 0, total: 0 },
	};
	await writeControlToCache(sessionId, state);
	return state;
}

async function writeControl(
	sessionId: string,
	updates: Partial<RealtimeState>,
) {
	// Update cache
	const cached = await readControlFromCache(sessionId);
	const current: RealtimeState = cached ?? {
		type: "state",
		leftVolume: 50,
		rightVolume: 50,
		conductorActive: false,
		updatedAt: Date.now(),
		volumeSequence: 0,
		selectedTrack: 0,
		eventName: "Crowd Symphony",
		effectMode: "symphony",
		activeMoment: null,
		userCount: { left: 0, right: 0, total: 0 },
	};
	const merged: RealtimeState = {
		...current,
		...updates,
		updatedAt: Date.now(),
	};
	await writeControlToCache(sessionId, merged);

	// Persist to database
	await updateSession(sessionId, {
		left_volume: merged.leftVolume,
		right_volume: merged.rightVolume,
		conductor_active: merged.conductorActive,
		volume_sequence: merged.volumeSequence,
		selected_track: merged.selectedTrack,
		event_name: merged.eventName,
		effect_mode: merged.effectMode,
		active_moment_id: merged.activeMoment?.id ?? null,
		active_moment_label: merged.activeMoment?.label ?? null,
		active_moment_kind: merged.activeMoment?.kind ?? null,
		active_moment_triggered_at: merged.activeMoment?.triggeredAt ?? null,
		updated_at: new Date().toISOString(),
	});
}

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const sessionId = url.searchParams.get("session");

		if (!isValidSessionId(sessionId)) {
			return NextResponse.json(
				{ error: "Missing or invalid session." },
				{ status: 400 },
			);
		}

		// Get session from cache/db
		const session = await getSessionByRoomCode(sessionId);
		if (!session) {
			return NextResponse.json(
				{ error: "Session not found or expired." },
				{ status: 404 },
			);
		}

		// Get live audience counts
		const audienceCounts = await getAudienceCounts(session.id);

		return NextResponse.json(toRealtimeState(session, audienceCounts));
	} catch (error) {
		const { response, statusCode } = formatErrorResponse(error);
		return NextResponse.json(response, { status: statusCode });
	}
}

export async function POST(request: Request) {
	try {
		const body = (await request
			.json()
			.catch(() => null)) as RealtimePostBody | null;

		if (!body || !isValidSessionId(body.sessionId)) {
			return NextResponse.json(
				{ error: "Missing or invalid session." },
				{ status: 400 },
			);
		}

		// Ensure session exists
		await getOrCreateSession(body.sessionId);

		if (body.role === "conductor") {
			const current = await readControlFromCache(body.sessionId);
			if (!current) {
				return NextResponse.json(
					{ error: "Session not initialized" },
					{ status: 404 },
				);
			}

			if (body.type === "volumeChange") {
				const sequence = safeSequence(
					body.sequence,
					current.volumeSequence + 1,
				);
				if (sequence >= current.volumeSequence) {
					await writeControl(body.sessionId, {
						leftVolume: safeNumber(body.leftVolume, current.leftVolume),
						rightVolume: safeNumber(body.rightVolume, current.rightVolume),
						volumeSequence: sequence,
					});
				}
			}

			if (body.type === "conductorStart") {
				await writeControl(body.sessionId, { conductorActive: true });
				await logSessionEvent(body.sessionId, "conductor_started");
			}

			if (body.type === "conductorStop") {
				await writeControl(body.sessionId, { conductorActive: false });
				await logSessionEvent(body.sessionId, "conductor_stopped");
			}

			// Return updated state
			const session = await getSessionByRoomCode(body.sessionId);
			const audienceCounts = session
				? await getAudienceCounts(session.id)
				: { left: 0, right: 0, total: 0 };
			return NextResponse.json(toRealtimeState(session, audienceCounts));
		}

		if (body.role === "host") {
			const current = await readControlFromCache(body.sessionId);
			if (!current) {
				return NextResponse.json(
					{ error: "Session not initialized" },
					{ status: 404 },
				);
			}

			if (body.type === "hostUpdate") {
				await writeControl(body.sessionId, {
					selectedTrack: safeTrackIndex(
						body.selectedTrack,
						current.selectedTrack,
					),
					eventName: safeEventName(body.eventName, current.eventName),
					effectMode: isEffectMode(body.effectMode)
						? body.effectMode
						: current.effectMode,
				});
				await logSessionEvent(body.sessionId, "host_update", {
					selectedTrack: body.selectedTrack,
					eventName: body.eventName,
					effectMode: body.effectMode,
				});
			}

			if (body.type === "showStart") {
				await writeControl(body.sessionId, { conductorActive: true });
				await logSessionEvent(body.sessionId, "show_started");
			}

			if (body.type === "showStop") {
				await writeControl(body.sessionId, { conductorActive: false });
				await logSessionEvent(body.sessionId, "show_stopped");
			}

			if (body.type === "triggerMoment") {
				const kind = isMomentKind(body.moment?.kind)
					? body.moment.kind
					: "pulse";
				const moment = {
					id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
					label: safeMomentLabel(body.moment?.label, defaultMomentLabel(kind)),
					kind,
					triggeredAt: Date.now(),
				};
				await writeControl(body.sessionId, {
					activeMoment: moment,
					conductorActive: true,
					effectMode: effectForMoment(kind),
				});

				// Persist moment to database
				await createMoment(
					body.sessionId,
					moment.label,
					moment.kind,
					undefined,
					current.leftVolume,
				);
				await logSessionEvent(body.sessionId, "moment_triggered", {
					kind: moment.kind,
					label: moment.label,
				});
			}

			const session = await getSessionByRoomCode(body.sessionId);
			const audienceCounts = session
				? await getAudienceCounts(session.id)
				: { left: 0, right: 0, total: 0 };
			return NextResponse.json(toRealtimeState(session, audienceCounts));
		}

		if (body.role === "audience") {
			if (!body.clientId || !isSection(body.section)) {
				return NextResponse.json(
					{ error: "Missing or invalid audience identity." },
					{ status: 400 },
				);
			}

			// Join/heartbeat
			await joinSession(body.sessionId, body.clientId, body.section);
			await logSessionEvent(
				body.sessionId,
				"audience_heartbeat",
				{ section: body.section },
				body.clientId,
				body.section,
			);

			const session = await getSessionByRoomCode(body.sessionId);
			const audienceCounts = session
				? await getAudienceCounts(session.id)
				: { left: 0, right: 0, total: 0 };
			return NextResponse.json(toRealtimeState(session, audienceCounts));
		}

		return NextResponse.json(
			{ error: "Unsupported realtime message." },
			{ status: 400 },
		);
	} catch (error) {
		const { response, statusCode } = formatErrorResponse(error);
		return NextResponse.json(response, { status: statusCode });
	}
}
