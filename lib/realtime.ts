export type Section = "left" | "right";

export type RealtimeState = {
	type: "state";
	leftVolume: number;
	rightVolume: number;
	conductorActive: boolean;
	updatedAt: number;
	userCount: {
		left: number;
		right: number;
		total: number;
	};
};

type ConductorMessage =
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
	  };

type AudienceHeartbeat = {
	role: "audience";
	sessionId: string;
	type: "heartbeat";
	clientId: string;
	section: Section;
};

export function createClientId() {
	return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

export async function getRealtimeState(sessionId: string) {
	const response = await fetch(
		`/api/realtime?session=${encodeURIComponent(sessionId)}`,
		{
			cache: "no-store",
		},
	);

	if (!response.ok) {
		throw new Error("Unable to load realtime state.");
	}

	return (await response.json()) as RealtimeState;
}

export async function postRealtimeMessage(
	message: ConductorMessage | AudienceHeartbeat,
) {
	const response = await fetch("/api/realtime", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(message),
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error("Unable to update realtime state.");
	}

	return (await response.json()) as RealtimeState;
}
