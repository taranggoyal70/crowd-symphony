import { getCache } from "@vercel/functions";
import { NextResponse } from "next/server";

type Section = "left" | "right";

type AudienceMember = {
	section: Section;
	lastSeen: number;
};

type EffectMode = "symphony" | "bass-drop" | "strobe";
type MomentKind = "pulse" | "left-drop" | "right-drop" | "blackout" | "finale";

type CrowdMoment = {
	id: string;
	label: string;
	kind: MomentKind;
	triggeredAt: number;
};

type ControlState = {
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

type AudienceState = {
	audience: Record<string, AudienceMember>;
	updatedAt: number;
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
const audienceTtlMs = 10_000;
const sessionTtlSeconds = 60 * 60;

function initialControlState(): ControlState {
	return {
		leftVolume: 50,
		rightVolume: 50,
		conductorActive: false,
		updatedAt: Date.now(),
		volumeSequence: 0,
		selectedTrack: 0,
		eventName: "Crowd Symphony",
		effectMode: "symphony",
		activeMoment: null,
	};
}

function initialAudienceState(): AudienceState {
	return {
		audience: {},
		updatedAt: Date.now(),
	};
}

function controlKey(sessionId: string) {
	return `control:${sessionId}`;
}

function audienceKey(sessionId: string) {
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

function pruneAudience(state: AudienceState) {
	const now = Date.now();
	for (const [clientId, member] of Object.entries(state.audience)) {
		if (now - member.lastSeen > audienceTtlMs) {
			delete state.audience[clientId];
		}
	}
	return state;
}

function counts(state: AudienceState) {
	let left = 0;
	let right = 0;

	for (const member of Object.values(state.audience)) {
		if (member.section === "left") {
			left += 1;
		} else {
			right += 1;
		}
	}

	return {
		left,
		right,
		total: left + right,
	};
}

function responseFor(control: ControlState, audience: AudienceState) {
	const prunedAudience = pruneAudience(audience);

	return NextResponse.json({
		type: "state",
		leftVolume: control.leftVolume,
		rightVolume: control.rightVolume,
		conductorActive: control.conductorActive,
		updatedAt: Math.max(control.updatedAt, prunedAudience.updatedAt),
		volumeSequence: control.volumeSequence,
		selectedTrack: control.selectedTrack,
		eventName: control.eventName,
		effectMode: control.effectMode,
		activeMoment: control.activeMoment,
		userCount: counts(prunedAudience),
	});
}

async function readControl(sessionId: string) {
	const cached = await cache.get(controlKey(sessionId));

	if (
		cached &&
		typeof cached === "object" &&
		"leftVolume" in cached &&
		"rightVolume" in cached
	) {
		return {
			...initialControlState(),
			...(cached as Partial<ControlState>),
		};
	}

	return initialControlState();
}

async function readAudience(sessionId: string) {
	const cached = await cache.get(audienceKey(sessionId));

	if (cached && typeof cached === "object" && "audience" in cached) {
		return {
			...initialAudienceState(),
			...(cached as Partial<AudienceState>),
		};
	}

	return initialAudienceState();
}

async function writeControl(sessionId: string, state: ControlState) {
	await cache.set(controlKey(sessionId), state, {
		name: `Crowd Symphony control ${sessionId}`,
		tags: [`control:${sessionId}`],
		ttl: sessionTtlSeconds,
	});
}

async function writeAudience(sessionId: string, state: AudienceState) {
	await cache.set(audienceKey(sessionId), state, {
		name: `Crowd Symphony audience ${sessionId}`,
		tags: [`audience:${sessionId}`],
		ttl: sessionTtlSeconds,
	});
}

export async function GET(request: Request) {
	const url = new URL(request.url);
	const sessionId = url.searchParams.get("session");

	if (!isValidSessionId(sessionId)) {
		return NextResponse.json(
			{ error: "Missing or invalid session." },
			{ status: 400 },
		);
	}

	const [control, audience] = await Promise.all([
		readControl(sessionId),
		readAudience(sessionId),
	]);
	const prunedAudience = pruneAudience(audience);
	await writeAudience(sessionId, prunedAudience);

	return responseFor(control, prunedAudience);
}

export async function POST(request: Request) {
	const body = (await request
		.json()
		.catch(() => null)) as RealtimePostBody | null;

	if (!body || !isValidSessionId(body.sessionId)) {
		return NextResponse.json(
			{ error: "Missing or invalid session." },
			{ status: 400 },
		);
	}

	if (body.role === "conductor") {
		const control = await readControl(body.sessionId);

		if (body.type === "volumeChange") {
			const sequence = safeSequence(body.sequence, control.volumeSequence + 1);
			if (sequence >= control.volumeSequence) {
				control.leftVolume = safeNumber(body.leftVolume, control.leftVolume);
				control.rightVolume = safeNumber(body.rightVolume, control.rightVolume);
				control.volumeSequence = sequence;
			}
		}

		if (body.type === "conductorStart") {
			control.conductorActive = true;
		}

		if (body.type === "conductorStop") {
			control.conductorActive = false;
		}

		control.updatedAt = Date.now();
		await writeControl(body.sessionId, control);

		return responseFor(control, await readAudience(body.sessionId));
	}

	if (body.role === "host") {
		const control = await readControl(body.sessionId);

		if (body.type === "hostUpdate") {
			control.selectedTrack = safeTrackIndex(
				body.selectedTrack,
				control.selectedTrack,
			);
			control.eventName = safeEventName(body.eventName, control.eventName);
			control.effectMode = isEffectMode(body.effectMode)
				? body.effectMode
				: control.effectMode;
		}

		if (body.type === "showStart") {
			control.conductorActive = true;
		}

		if (body.type === "showStop") {
			control.conductorActive = false;
		}

		if (body.type === "triggerMoment") {
			const kind = isMomentKind(body.moment?.kind) ? body.moment.kind : "pulse";
			control.activeMoment = {
				id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
				label: safeMomentLabel(body.moment?.label, defaultMomentLabel(kind)),
				kind,
				triggeredAt: Date.now(),
			};
			control.conductorActive = true;
			control.effectMode = effectForMoment(kind);
		}

		control.updatedAt = Date.now();
		await writeControl(body.sessionId, control);

		return responseFor(control, await readAudience(body.sessionId));
	}

	if (body.role === "audience") {
		if (!body.clientId || !isSection(body.section)) {
			return NextResponse.json(
				{ error: "Missing or invalid audience identity." },
				{ status: 400 },
			);
		}

		const audience = pruneAudience(await readAudience(body.sessionId));
		audience.audience[body.clientId] = {
			section: body.section,
			lastSeen: Date.now(),
		};
		audience.updatedAt = Date.now();
		await writeAudience(body.sessionId, audience);

		return responseFor(await readControl(body.sessionId), audience);
	}

	return NextResponse.json(
		{ error: "Unsupported realtime message." },
		{ status: 400 },
	);
}
