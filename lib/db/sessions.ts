/**
 * Session database operations
 */

import { getSupabaseAdmin } from "./supabase";

export type SessionRow = {
	id: string;
	room_code: string;
	host_id: string | null;
	event_name: string;
	selected_track: number;
	effect_mode: "symphony" | "bass-drop" | "strobe";
	conductor_active: boolean;
	left_volume: number;
	right_volume: number;
	volume_sequence: number;
	active_moment_id: string | null;
	active_moment_label: string | null;
	active_moment_kind: string | null;
	active_moment_triggered_at: number | null;
	created_at: string;
	updated_at: string;
	expires_at: string;
	ended_at: string | null;
	is_archived: boolean;
};

export type AudienceMemberRow = {
	id: string;
	session_id: string;
	client_id: string;
	section: "left" | "right";
	joined_at: string;
	last_seen_at: string;
	left_at: string | null;
	user_agent: string | null;
	ip_hash: string | null;
};

export type MomentRow = {
	id: string;
	session_id: string;
	label: string;
	kind: "pulse" | "left-drop" | "right-drop" | "blackout" | "finale";
	triggered_at: string;
	triggered_by: string | null;
	affected_sections: string[];
	volume_at_trigger: number | null;
};

export type SessionEventRow = {
	id: string;
	session_id: string;
	event_type: string;
	event_data: Record<string, unknown> | null;
	client_id: string | null;
	section: "left" | "right" | null;
	created_at: string;
};

function toSessionRow(data: Record<string, unknown>): SessionRow {
	return {
		id: data.id as string,
		room_code: data.room_code as string,
		host_id: data.host_id as string | null,
		event_name: data.event_name as string,
		selected_track: data.selected_track as number,
		effect_mode: data.effect_mode as SessionRow["effect_mode"],
		conductor_active: data.conductor_active as boolean,
		left_volume: data.left_volume as number,
		right_volume: data.right_volume as number,
		volume_sequence: data.volume_sequence as number,
		active_moment_id: data.active_moment_id as string | null,
		active_moment_label: data.active_moment_label as string | null,
		active_moment_kind: data.active_moment_kind as string | null,
		active_moment_triggered_at: data.active_moment_triggered_at as
			| number
			| null,
		created_at: data.created_at as string,
		updated_at: data.updated_at as string,
		expires_at: data.expires_at as string,
		ended_at: data.ended_at as string | null,
		is_archived: data.is_archived as boolean,
	};
}

export async function createSession(
	roomCode: string,
	hostId?: string,
): Promise<SessionRow> {
	const supabase = getSupabaseAdmin();

	const { data, error } = await supabase
		.from("sessions")
		.insert({
			room_code: roomCode.toUpperCase(),
			host_id: hostId ?? null,
		})
		.select()
		.single();

	if (error || !data) {
		throw new Error(`Failed to create session: ${error?.message}`);
	}

	return toSessionRow(data);
}

export async function getSessionByRoomCode(
	roomCode: string,
): Promise<SessionRow | null> {
	const supabase = getSupabaseAdmin();

	const { data, error } = await supabase
		.from("sessions")
		.select("*")
		.eq("room_code", roomCode.toUpperCase())
		.eq("is_archived", false)
		.gt("expires_at", new Date().toISOString())
		.single();

	if (error) {
		if (error.code === "PGRST116") return null; // Not found
		throw new Error(`Failed to get session: ${error.message}`);
	}

	return data ? toSessionRow(data) : null;
}

export async function getSessionById(id: string): Promise<SessionRow | null> {
	const supabase = getSupabaseAdmin();

	const { data, error } = await supabase
		.from("sessions")
		.select("*")
		.eq("id", id)
		.single();

	if (error) {
		if (error.code === "PGRST116") return null;
		throw new Error(`Failed to get session: ${error.message}`);
	}

	return data ? toSessionRow(data) : null;
}

export async function updateSession(
	id: string,
	updates: Partial<SessionRow>,
): Promise<SessionRow> {
	const supabase = getSupabaseAdmin();

	// Remove fields that shouldn't be updated directly
	const { id: _, created_at: _createdAt, ...allowedUpdates } = updates;

	const { data, error } = await supabase
		.from("sessions")
		.update(allowedUpdates)
		.eq("id", id)
		.select()
		.single();

	if (error || !data) {
		throw new Error(`Failed to update session: ${error?.message}`);
	}

	return toSessionRow(data);
}

export async function endSession(id: string): Promise<SessionRow> {
	return updateSession(id, {
		conductor_active: false,
		ended_at: new Date().toISOString(),
		is_archived: true,
	});
}

export async function archiveExpiredSessions(): Promise<number> {
	const supabase = getSupabaseAdmin();

	const { data, error } = await supabase.rpc("cleanup_expired_sessions");

	if (error) {
		throw new Error(`Failed to archive sessions: ${error.message}`);
	}

	return data ?? 0;
}

export async function cleanupStaleAudience(): Promise<number> {
	const supabase = getSupabaseAdmin();

	const { data, error } = await supabase.rpc("cleanup_stale_audience_members");

	if (error) {
		throw new Error(`Failed to cleanup audience: ${error.message}`);
	}

	return data ?? 0;
}

// Audience members
export async function joinSession(
	sessionId: string,
	clientId: string,
	section: "left" | "right",
	userAgent?: string,
	ipHash?: string,
): Promise<AudienceMemberRow> {
	const supabase = getSupabaseAdmin();

	const { data, error } = await supabase
		.from("audience_members")
		.upsert(
			{
				session_id: sessionId,
				client_id: clientId,
				section,
				user_agent: userAgent ?? null,
				ip_hash: ipHash ?? null,
				last_seen_at: new Date().toISOString(),
			},
			{ onConflict: "session_id,client_id" },
		)
		.select()
		.single();

	if (error || !data) {
		throw new Error(`Failed to join session: ${error?.message}`);
	}

	return data as AudienceMemberRow;
}

export async function heartbeatAudience(
	sessionId: string,
	clientId: string,
): Promise<void> {
	const supabase = getSupabaseAdmin();

	const { error } = await supabase
		.from("audience_members")
		.update({ last_seen_at: new Date().toISOString() })
		.eq("session_id", sessionId)
		.eq("client_id", clientId);

	if (error) {
		throw new Error(`Failed to heartbeat: ${error.message}`);
	}
}

export async function leaveSession(
	sessionId: string,
	clientId: string,
): Promise<void> {
	const supabase = getSupabaseAdmin();

	const { error } = await supabase
		.from("audience_members")
		.update({ left_at: new Date().toISOString() })
		.eq("session_id", sessionId)
		.eq("client_id", clientId);

	if (error) {
		throw new Error(`Failed to leave session: ${error.message}`);
	}
}

export async function getAudienceCounts(
	sessionId: string,
): Promise<{ left: number; right: number; total: number }> {
	const supabase = getSupabaseAdmin();

	const { data, error } = await supabase
		.from("audience_members")
		.select("section")
		.eq("session_id", sessionId)
		.is("left_at", null)
		.gt("last_seen_at", new Date(Date.now() - 10_000).toISOString());

	if (error) {
		throw new Error(`Failed to get audience counts: ${error.message}`);
	}

	const left = data?.filter((m) => m.section === "left").length ?? 0;
	const right = data?.filter((m) => m.section === "right").length ?? 0;

	return { left, right, total: left + right };
}

// Moments
export async function createMoment(
	sessionId: string,
	label: string,
	kind: MomentRow["kind"],
	triggeredBy?: string,
	volumeAtTrigger?: number,
): Promise<MomentRow> {
	const supabase = getSupabaseAdmin();

	const { data, error } = await supabase
		.from("moments")
		.insert({
			session_id: sessionId,
			label,
			kind,
			triggered_by: triggeredBy ?? null,
			volume_at_trigger: volumeAtTrigger ?? null,
		})
		.select()
		.single();

	if (error || !data) {
		throw new Error(`Failed to create moment: ${error?.message}`);
	}

	return data as MomentRow;
}

export async function getMomentsForSession(
	sessionId: string,
): Promise<MomentRow[]> {
	const supabase = getSupabaseAdmin();

	const { data, error } = await supabase
		.from("moments")
		.select("*")
		.eq("session_id", sessionId)
		.order("triggered_at", { ascending: false });

	if (error) {
		throw new Error(`Failed to get moments: ${error.message}`);
	}

	return (data ?? []) as MomentRow[];
}

// Session events (analytics)
export async function logSessionEvent(
	sessionId: string,
	eventType: string,
	eventData?: Record<string, unknown>,
	clientId?: string,
	section?: "left" | "right",
): Promise<void> {
	const supabase = getSupabaseAdmin();

	const { error } = await supabase.from("session_events").insert({
		session_id: sessionId,
		event_type: eventType,
		event_data: eventData ?? null,
		client_id: clientId ?? null,
		section: section ?? null,
	});

	if (error) {
		// Don't throw for analytics failures
		console.error("Failed to log session event:", error);
	}
}

export async function getSessionEvents(
	sessionId: string,
	eventType?: string,
): Promise<SessionEventRow[]> {
	const supabase = getSupabaseAdmin();

	let query = supabase
		.from("session_events")
		.select("*")
		.eq("session_id", sessionId)
		.order("created_at", { ascending: false });

	if (eventType) {
		query = query.eq("event_type", eventType);
	}

	const { data, error } = await query;

	if (error) {
		throw new Error(`Failed to get session events: ${error.message}`);
	}

	return (data ?? []) as SessionEventRow[];
}
