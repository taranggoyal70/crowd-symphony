"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Activity,
	Copy,
	ExternalLink,
	Megaphone,
	Music,
	Play,
	QrCode,
	Share2,
	Sparkles,
	Square,
	Users,
	Wand2,
} from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import {
	getRealtimeState,
	postRealtimeMessage,
	type RealtimeState,
} from "@/lib/realtime";
import { crowdTracks } from "@/lib/tracks";

function createRoomCode() {
	return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function HostPage() {
	const [roomCode, setRoomCode] = useState("");
	const [eventName, setEventName] = useState("Crowd Symphony");
	const [selectedTrack, setSelectedTrack] = useState(0);
	const [effectMode, setEffectMode] =
		useState<RealtimeState["effectMode"]>("symphony");
	const [state, setState] = useState<RealtimeState | null>(null);
	const [showQR, setShowQR] = useState(true);
	const [copied, setCopied] = useState<string | null>(null);
	const [lastMoment, setLastMoment] = useState<string | null>(null);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const room = params.get("room")?.toUpperCase() || createRoomCode();
		setRoomCode(room);
		window.history.replaceState(null, "", `/host?room=${room}`);
	}, []);

	const urls = useMemo(() => {
		if (!roomCode || typeof window === "undefined") {
			return { audience: "", conductor: "", recap: "" };
		}
		const origin = window.location.origin;
		return {
			audience: `${origin}/audience?session=${roomCode}`,
			conductor: `${origin}/conductor?session=${roomCode}`,
			recap: `${origin}/recap?room=${roomCode}`,
		};
	}, [roomCode]);

	useEffect(() => {
		if (!roomCode) return;

		let cancelled = false;
		const sync = async () => {
			try {
				const nextState = await getRealtimeState(roomCode);
				if (!cancelled) {
					setState(nextState);
					setSelectedTrack(nextState.selectedTrack);
					setEffectMode(nextState.effectMode);
					setEventName(nextState.eventName);
				}
			} catch (error) {
				console.error("Host sync failed:", error);
			}
		};

		sync();
		const interval = window.setInterval(sync, 1000);

		return () => {
			cancelled = true;
			window.clearInterval(interval);
		};
	}, [roomCode]);

	const updateHost = async (updates: {
		selectedTrack?: number;
		eventName?: string;
		effectMode?: RealtimeState["effectMode"];
	}) => {
		if (!roomCode) return;

		const nextState = await postRealtimeMessage({
			role: "host",
			sessionId: roomCode,
			type: "hostUpdate",
			selectedTrack,
			eventName,
			effectMode,
			...updates,
		});
		setState(nextState);
		setSelectedTrack(nextState.selectedTrack);
		setEffectMode(nextState.effectMode);
		setEventName(nextState.eventName);
	};

	const setShowState = async (active: boolean) => {
		if (!roomCode) return;
		const nextState = await postRealtimeMessage({
			role: "host",
			sessionId: roomCode,
			type: active ? "showStart" : "showStop",
		});
		setState(nextState);
	};

	const triggerMoment = async (
		label: string,
		kind: NonNullable<RealtimeState["activeMoment"]>["kind"],
	) => {
		if (!roomCode) return;

		const nextState = await postRealtimeMessage({
			role: "host",
			sessionId: roomCode,
			type: "triggerMoment",
			moment: { label, kind },
		});
		setState(nextState);
		setEffectMode(nextState.effectMode);
		setLastMoment(label);
		window.setTimeout(() => setLastMoment(null), 1600);
	};

	const copy = async (label: string, value: string) => {
		await navigator.clipboard.writeText(value);
		setCopied(label);
		window.setTimeout(() => setCopied(null), 1400);
	};

	const totalUsers = state?.userCount.total ?? 0;
	const leftUsers = state?.userCount.left ?? 0;
	const rightUsers = state?.userCount.right ?? 0;
	const conductorActive = state?.conductorActive ?? false;

	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#6d28d9_0,#09090b_28%,#000_70%)] text-white">
			<div className="mx-auto max-w-7xl px-5 py-6">
				<header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-sm text-violet-200">
							<Sparkles className="h-4 w-4" />
							Event Room Mode
						</div>
						<h1 className="text-4xl font-black tracking-tight md:text-6xl">
							Host a crowd symphony
						</h1>
						<p className="mt-2 max-w-2xl text-zinc-300">
							Create one room, put the QR on a projector, and turn every phone
							into part of the show.
						</p>
					</div>
					<div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-right">
						<p className="text-xs uppercase tracking-[0.3em] text-zinc-400">
							Room code
						</p>
						<p className="font-mono text-4xl font-black text-violet-200">
							{roomCode || "••••••"}
						</p>
					</div>
				</header>

				<div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
					<section className="space-y-6">
						<div className="grid gap-4 md:grid-cols-4">
							<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
								<Users className="mb-3 h-5 w-5 text-violet-300" />
								<p className="text-3xl font-black">{totalUsers}</p>
								<p className="text-sm text-zinc-400">phones connected</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
								<p className="text-3xl font-black text-emerald-300">
									{leftUsers}
								</p>
								<p className="text-sm text-zinc-400">left side</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
								<p className="text-3xl font-black text-pink-300">
									{rightUsers}
								</p>
								<p className="text-sm text-zinc-400">right side</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
								<Activity className="mb-3 h-5 w-5 text-violet-300" />
								<p
									className={
										conductorActive
											? "text-2xl font-black text-green-300"
											: "text-2xl font-black text-yellow-300"
									}
								>
									{conductorActive ? "Live" : "Waiting"}
								</p>
								<p className="text-sm text-zinc-400">show signal</p>
							</div>
						</div>

						<div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 shadow-2xl shadow-violet-950/30">
							<div className="mb-5 flex items-center justify-between">
								<div>
									<h2 className="text-2xl font-bold">Show controls</h2>
									<p className="text-sm text-zinc-400">
										These settings sync to audience phones in this room.
									</p>
								</div>
								<div className="flex gap-2">
									<button
										onClick={() => setShowState(true)}
										className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 font-bold text-black transition hover:bg-green-400"
									>
										<Play className="h-4 w-4" />
										Start
									</button>
									<button
										onClick={() => setShowState(false)}
										className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 font-bold text-white transition hover:bg-red-400"
									>
										<Square className="h-4 w-4" />
										Stop
									</button>
								</div>
							</div>

							<div className="grid gap-5 md:grid-cols-2">
								<label className="space-y-2">
									<span className="text-sm font-bold text-zinc-300">
										Event name
									</span>
									<input
										value={eventName}
										onChange={(event) => setEventName(event.target.value)}
										onBlur={() => updateHost({ eventName })}
										className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none ring-violet-500/30 focus:ring-4"
									/>
								</label>

								<label className="space-y-2">
									<span className="text-sm font-bold text-zinc-300">
										Crowd effect
									</span>
									<select
										value={effectMode}
										onChange={(event) =>
											updateHost({
												effectMode: event.target
													.value as RealtimeState["effectMode"],
											})
										}
										className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none ring-violet-500/30 focus:ring-4"
									>
										<option value="symphony">Symphony</option>
										<option value="bass-drop">Bass Drop</option>
										<option value="strobe">Strobe</option>
									</select>
								</label>
							</div>

							<div className="mt-6">
								<div className="mb-3 flex items-center gap-2">
									<Music className="h-5 w-5 text-violet-300" />
									<h3 className="font-bold">Track selection</h3>
								</div>
								<div className="grid gap-3 md:grid-cols-2">
									{crowdTracks.map((track, index) => (
										<button
											key={track.name}
											onClick={() => updateHost({ selectedTrack: index })}
											className={`rounded-2xl border p-4 text-left transition ${
												selectedTrack === index
													? "border-violet-300 bg-violet-500/20"
													: "border-white/10 bg-white/5 hover:bg-white/10"
											}`}
										>
											<p className="font-bold">{track.name}</p>
											<p className="text-sm text-zinc-400">{track.sizeLabel}</p>
										</button>
									))}
								</div>
							</div>
						</div>

						<div className="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-6 shadow-2xl shadow-violet-950/20">
							<div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
								<div>
									<div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-black/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
										<Megaphone className="h-4 w-4" />
										Show Composer
									</div>
									<h2 className="text-2xl font-bold">Trigger crowd moments</h2>
									<p className="text-sm text-zinc-300">
										One tap sends synced visual, vibration, and audio cues to
										every joined phone.
									</p>
								</div>
								{lastMoment && (
									<div className="rounded-full bg-green-400 px-4 py-2 text-sm font-black text-black">
										{lastMoment} fired
									</div>
								)}
							</div>
							<div className="grid gap-3 md:grid-cols-5">
								{[
									{
										label: "Full Crowd Pulse",
										kind: "pulse" as const,
										tone: "from-violet-500 to-fuchsia-500",
									},
									{
										label: "Left Side Drop",
										kind: "left-drop" as const,
										tone: "from-emerald-500 to-teal-400",
									},
									{
										label: "Right Side Drop",
										kind: "right-drop" as const,
										tone: "from-pink-500 to-rose-400",
									},
									{
										label: "Blackout Build",
										kind: "blackout" as const,
										tone: "from-zinc-700 to-zinc-300",
									},
									{
										label: "Finale Burst",
										kind: "finale" as const,
										tone: "from-yellow-400 to-orange-500",
									},
								].map((moment) => (
									<button
										key={moment.kind}
										onClick={() => triggerMoment(moment.label, moment.kind)}
										className={`rounded-2xl bg-gradient-to-br ${moment.tone} p-4 text-left font-black text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.98]`}
									>
										<Sparkles className="mb-4 h-5 w-5" />
										{moment.label}
									</button>
								))}
							</div>
							{state?.activeMoment && (
								<p className="mt-4 text-sm text-violet-100">
									Latest:{" "}
									<span className="font-bold">{state.activeMoment.label}</span>{" "}
									was sent to the room.
								</p>
							)}
						</div>
					</section>

					<aside className="space-y-6">
						<div className="rounded-3xl border border-white/10 bg-white/5 p-6">
							<div className="mb-4 flex items-center justify-between">
								<h2 className="text-xl font-bold">Audience join</h2>
								<button
									onClick={() => setShowQR(!showQR)}
									className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-black"
								>
									<QrCode className="h-4 w-4" />
									QR
								</button>
							</div>
							<div className="rounded-2xl bg-white p-5">
								{urls.audience && (
									<QRCodeSVG value={urls.audience} className="h-auto w-full" />
								)}
							</div>
							<div className="mt-4 space-y-3">
								<button
									onClick={() => copy("Audience link", urls.audience)}
									className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-left text-sm"
								>
									<span className="truncate pr-3">{urls.audience}</span>
									<Copy className="h-4 w-4 shrink-0" />
								</button>
								<Link
									href={urls.conductor || "/conductor"}
									className="flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 font-bold text-white transition hover:bg-violet-400"
								>
									<Wand2 className="h-4 w-4" />
									Open conductor
									<ExternalLink className="h-4 w-4" />
								</Link>
								<button
									onClick={() => copy("Conductor link", urls.conductor)}
									className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-left text-sm"
								>
									<span className="truncate pr-3">{urls.conductor}</span>
									<Copy className="h-4 w-4 shrink-0" />
								</button>
								<Link
									href={urls.recap || "/recap"}
									className="flex items-center justify-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-3 font-bold text-violet-100 transition hover:bg-violet-500/20"
								>
									<Share2 className="h-4 w-4" />
									Open live recap
									<ExternalLink className="h-4 w-4" />
								</Link>
								<button
									onClick={() => copy("Recap link", urls.recap)}
									className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-left text-sm"
								>
									<span className="truncate pr-3">{urls.recap}</span>
									<Copy className="h-4 w-4 shrink-0" />
								</button>
							</div>
							{copied && (
								<p className="mt-3 text-center text-sm text-green-300">
									{copied} copied.
								</p>
							)}
						</div>

						<div className="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-6">
							<h3 className="mb-2 font-bold">Run-of-show</h3>
							<ol className="space-y-2 text-sm text-violet-100">
								<li>1. Open this host page on a laptop/projector.</li>
								<li>2. Audience scans the QR and taps Enable Sound.</li>
								<li>3. Open conductor, start camera, and conduct the room.</li>
								<li>
									4. Use this dashboard to switch tracks and pause the show.
								</li>
							</ol>
						</div>
					</aside>
				</div>
			</div>

			<AnimatePresence>
				{showQR && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur"
						onClick={() => setShowQR(false)}
					>
						<motion.div
							initial={{ scale: 0.94 }}
							animate={{ scale: 1 }}
							exit={{ scale: 0.94 }}
							className="w-full max-w-xl rounded-3xl border border-white/10 bg-zinc-950 p-8"
							onClick={(event) => event.stopPropagation()}
						>
							<h2 className="mb-1 text-3xl font-black">Scan to join</h2>
							<p className="mb-6 text-zinc-400">Room {roomCode}</p>
							<div className="rounded-3xl bg-white p-8">
								{urls.audience && (
									<QRCodeSVG value={urls.audience} className="h-auto w-full" />
								)}
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
