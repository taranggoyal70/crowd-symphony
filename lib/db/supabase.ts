/**
 * Supabase client for server-side operations
 * Uses service role key for admin operations
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseAdmin: SupabaseClient | null = null;
let supabaseAnon: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
	if (supabaseAdmin) return supabaseAdmin;

	const url = process.env.SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!url || !key) {
		throw new Error(
			"Supabase admin client not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
		);
	}

	supabaseAdmin = createClient(url, key, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});

	return supabaseAdmin;
}

export function getSupabaseAnon(): SupabaseClient {
	if (supabaseAnon) return supabaseAnon;

	const url = process.env.SUPABASE_URL;
	const key = process.env.SUPABASE_ANON_KEY;

	if (!url || !key) {
		throw new Error(
			"Supabase anon client not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY",
		);
	}

	supabaseAnon = createClient(url, key);

	return supabaseAnon;
}

// Helper to create a client with user's access token (for RLS)
export function getSupabaseWithAuth(accessToken: string): SupabaseClient {
	const url = process.env.SUPABASE_URL;
	const key = process.env.SUPABASE_ANON_KEY;

	if (!url || !key) {
		throw new Error("Supabase not configured");
	}

	return createClient(url, key, {
		global: {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	});
}

export type { SupabaseClient };
