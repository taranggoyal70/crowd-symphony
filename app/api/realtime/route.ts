import { getCache } from "@vercel/functions";
import { NextResponse } from "next/server";

type Section = "left" | "right";

type AudienceMember = {
	section: Section;
	lastSeen: number;
};

type SessionState = {
	leftVolume: number;
	rightVolume: number;
	conductorActive: boolean;
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
	  };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

const cache = getCache({ namespace: "crowd-symphony" });
const audienceTtlMs = 10_000;
const sessionTtlSeconds = 60 * 60;

function initialState(): SessionState {
	return {
		leftVolume: 50,
		rightVolume: 50,
		conductorActive: false,
		audience: {},
		updatedAt: Date.now(),
	};
}

function sessionKey(sessionId: string) {
	return `session:${sessionId}`;
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

function pruneAudience(state: SessionState) {
	const now = Date.now();
	for (const [clientId, member] of Object.entries(state.audience)) {
		if (now - member.lastSeen > audienceTtlMs) {
			delete state.audience[clientId];
		}
	}
	return state;
}

function counts(state: SessionState) {
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

function responseFor(state: SessionState) {
	const prunedState = pruneAudience(state);

	return NextResponse.json({
		type: "state",
		leftVolume: prunedState.leftVolume,
		rightVolume: prunedState.rightVolume,
		conductorActive: prunedState.conductorActive,
		updatedAt: prunedState.updatedAt,
		userCount: counts(prunedState),
	});
}

async function readSession(sessionId: string) {
	const cached = await cache.get(sessionKey(sessionId));

	if (
		cached &&
		typeof cached === "object" &&
		"leftVolume" in cached &&
		"rightVolume" in cached &&
		"audience" in cached
	) {
		return cached as SessionState;
	}

	return initialState();
}

async function writeSession(sessionId: string, state: SessionState) {
	await cache.set(sessionKey(sessionId), state, {
		name: `Crowd Symphony ${sessionId}`,
		tags: [`session:${sessionId}`],
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

	const state = pruneAudience(await readSession(sessionId));
	await writeSession(sessionId, state);

	return responseFor(state);
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

	const state = pruneAudience(await readSession(body.sessionId));

	if (body.role === "conductor") {
		if (body.type === "volumeChange") {
			state.leftVolume = safeNumber(body.leftVolume, state.leftVolume);
			state.rightVolume = safeNumber(body.rightVolume, state.rightVolume);
		}

		if (body.type === "conductorStart") {
			state.conductorActive = true;
		}

		if (body.type === "conductorStop") {
			state.conductorActive = false;
		}
	}

	if (body.role === "audience") {
		if (!body.clientId || !isSection(body.section)) {
			return NextResponse.json(
				{ error: "Missing or invalid audience identity." },
				{ status: 400 },
			);
		}

		state.audience[body.clientId] = {
			section: body.section,
			lastSeen: Date.now(),
		};
	}

	state.updatedAt = Date.now();
	await writeSession(body.sessionId, state);

	return responseFor(state);
}
