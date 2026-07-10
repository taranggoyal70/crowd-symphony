"use client";

import {
	Activity,
	ArrowLeft,
	Copy,
	ExternalLink,
	Music,
	Share2,
	Sparkles,
	Trophy,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { getRealtimeState, type RealtimeState } from "@/lib/realtime";
import { crowdTracks } from "@/lib/tracks";

function modeLabel(mode: RealtimeState["effectMode"]) {
	if (mode === "bass-drop") return "Bass Drop";
	if (mode === "strobe") return "Strobe";
	return "Symphony";
}

function RecapContent() {
	const searchParams = useSearchParams();
	const room = searchParams.get("room")?.toUpperCase() || "";
	const [state, setState] = useState<RealtimeState | null>(null);
	const [copied, setCopied] = useState(false);

	const urls = useMemo(() => {
		if (!room || typeof window === "undefined") {
			return { audience: "", host: "", recap: "" };
		}

		const origin = window.location.origin;
		return {
			audience: `${origin}/audience?session=${room}`,
			host: `${origin}/host?room=${room}`,
			recap: `${origin}/recap?room=${room}`,
		};
	}, [room]);

	useEffect(() => {
		if (!room) return;

		let cancelled = false;
		const sync = async () => {
			try {
				const nextState = await getRealtimeState(room);
				if (!cancelled) {
					setState(nextState);
				}
			} catch (error) {
				console.error("Recap sync failed:", error);
			}
		};

		sync();
		const interval = window.setInterval(sync, 2000);

		return () => {
			cancelled = true;
			window.clearInterval(interval);
		};
	}, [room]);

	const copyRecap = async () => {
		await navigator.clipboard.writeText(urls.recap);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1400);
	};

	const total = state?.userCount.total ?? 0;
	const left = state?.userCount.left ?? 0;
	const right = state?.userCount.right ?? 0;
	const track = crowdTracks[state?.selectedTrack ?? 0] ?? crowdTracks[0];

	if (!room) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
				<div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
					<Trophy className="mx-auto mb-4 h-12 w-12 text-violet-300" />
					<h1 className="text-3xl font-black">No room selected</h1>
					<p className="mt-2 text-zinc-400">
						Open this from a host room to generate a live recap.
					</p>
					<Link
						href="/host"
						className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 font-bold text-white"
					>
						Open host mode
						<ExternalLink className="h-4 w-4" />
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top,#7c3aed_0,#09090b_34%,#000_80%)] px-5 py-8 text-white">
			<div className="mx-auto max-w-6xl">
				<header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<Link
							href={`/host?room=${room}`}
							className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-violet-200 transition hover:text-white"
						>
							<ArrowLeft className="h-4 w-4" />
							Back to host
						</Link>
						<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-500/10 px-3 py-1 text-sm text-violet-100">
							<Sparkles className="h-4 w-4" />
							Live event recap
						</div>
						<h1 className="text-4xl font-black tracking-tight md:text-6xl">
							{state?.eventName ?? "Crowd Symphony"}
						</h1>
						<p className="mt-2 max-w-2xl text-zinc-300">
							Room {room} turned audience phones into a synced crowd instrument.
						</p>
					</div>
					<div className="rounded-3xl border border-white/10 bg-black/40 p-5">
						<p className="text-xs uppercase tracking-[0.35em] text-zinc-400">
							Room code
						</p>
						<p className="font-mono text-5xl font-black text-violet-200">
							{room}
						</p>
					</div>
				</header>

				<div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
					<section className="space-y-6">
						<div className="grid gap-4 md:grid-cols-4">
							<div className="rounded-3xl border border-white/10 bg-white/5 p-5">
								<Users className="mb-4 h-6 w-6 text-violet-300" />
								<p className="text-4xl font-black">{total}</p>
								<p className="text-sm text-zinc-400">phones joined</p>
							</div>
							<div className="rounded-3xl border border-white/10 bg-white/5 p-5">
								<p className="text-4xl font-black text-emerald-300">{left}</p>
								<p className="text-sm text-zinc-400">left side</p>
							</div>
							<div className="rounded-3xl border border-white/10 bg-white/5 p-5">
								<p className="text-4xl font-black text-pink-300">{right}</p>
								<p className="text-sm text-zinc-400">right side</p>
							</div>
							<div className="rounded-3xl border border-white/10 bg-white/5 p-5">
								<Activity className="mb-4 h-6 w-6 text-violet-300" />
								<p className="text-2xl font-black">
									{state?.conductorActive ? "Live" : "Paused"}
								</p>
								<p className="text-sm text-zinc-400">show signal</p>
							</div>
						</div>

						<div className="rounded-[2rem] border border-violet-400/20 bg-violet-500/10 p-6">
							<div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
								<div>
									<h2 className="text-3xl font-black">Crowd energy snapshot</h2>
									<p className="mt-2 text-zinc-300">
										Current track, effect mode, and latest host-triggered
										moment.
									</p>
								</div>
								<button
									onClick={copyRecap}
									className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-black text-black transition hover:bg-violet-100"
								>
									{copied ? "Copied" : "Share recap"}
									{copied ? (
										<Copy className="h-4 w-4" />
									) : (
										<Share2 className="h-4 w-4" />
									)}
								</button>
							</div>

							<div className="mt-6 grid gap-4 md:grid-cols-3">
								<div className="rounded-2xl bg-black/40 p-5">
									<Music className="mb-4 h-5 w-5 text-violet-300" />
									<p className="text-sm text-zinc-400">Selected track</p>
									<p className="mt-1 text-xl font-black">{track.name}</p>
									<p className="text-sm text-zinc-500">{track.sizeLabel}</p>
								</div>
								<div className="rounded-2xl bg-black/40 p-5">
									<Sparkles className="mb-4 h-5 w-5 text-yellow-300" />
									<p className="text-sm text-zinc-400">Effect mode</p>
									<p className="mt-1 text-xl font-black">
										{modeLabel(state?.effectMode ?? "symphony")}
									</p>
								</div>
								<div className="rounded-2xl bg-black/40 p-5">
									<Trophy className="mb-4 h-5 w-5 text-orange-300" />
									<p className="text-sm text-zinc-400">Latest moment</p>
									<p className="mt-1 text-xl font-black">
										{state?.activeMoment?.label ?? "Waiting for host"}
									</p>
								</div>
							</div>
						</div>
					</section>

					<aside className="space-y-6">
						<div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
							<h2 className="mb-4 text-2xl font-black">Join this room</h2>
							<div className="rounded-3xl bg-white p-5">
								{urls.audience && (
									<QRCodeSVG value={urls.audience} className="h-auto w-full" />
								)}
							</div>
							<p className="mt-4 break-all rounded-2xl bg-black/40 p-4 text-sm text-zinc-300">
								{urls.audience}
							</p>
						</div>

						<div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
							<h3 className="text-xl font-black">Why this matters</h3>
							<p className="mt-3 text-sm leading-6 text-zinc-300">
								Crowd Symphony is not just a music controller. It is an
								event-tech layer that gives hosts a measurable, repeatable
								audience participation moment they can show to venues,
								hackathons, brand activations, and campus organizers.
							</p>
						</div>
					</aside>
				</div>
			</div>
		</div>
	);
}

export default function RecapPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center bg-black text-white">
					Loading recap…
				</div>
			}
		>
			<RecapContent />
		</Suspense>
	);
}
