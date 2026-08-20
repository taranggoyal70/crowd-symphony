"use client";

import { motion } from "framer-motion";
import {
	ArrowRight,
	CircleDot,
	Github,
	QrCode,
	Radio,
	Smartphone,
	Users,
	WandSparkles,
} from "lucide-react";
import Link from "next/link";

const waveform = [
	26, 48, 34, 72, 44, 88, 58, 100, 68, 42, 78, 54, 94, 66, 38, 70, 50, 82, 46,
	62, 36, 76, 52, 92, 64, 40, 74, 48, 86, 56, 32, 68, 44, 80,
];

const steps = [
	{
		label: "Start conducting",
		description: "Open the conductor desk and get one room code instantly.",
		icon: WandSparkles,
		tone: "coral",
		meta: "Step 1",
	},
	{
		label: "Share the room",
		description: "Let the crowd scan the QR code or type the short room code.",
		icon: QrCode,
		tone: "lime",
		meta: "Step 2",
	},
	{
		label: "Raise your hands",
		description:
			"Shape the left and right channels while every phone follows live.",
		icon: Users,
		tone: "cyan",
		meta: "Step 3",
	},
];

export default function Home() {
	return (
		<main className="crowd-home">
			<nav className="crowd-nav" aria-label="Primary navigation">
				<Link className="crowd-brand" href="/">
					<span className="crowd-brand-mark" aria-hidden="true">
						<span />
						<span />
						<span />
					</span>
					<span>Crowd Symphony</span>
				</Link>
				<div className="crowd-nav-actions">
					<span className="crowd-live-state">
						<CircleDot size={14} /> Live system
					</span>
					<a
						className="crowd-icon-link"
						href="https://github.com/taranggoyal70/crowd-symphony"
						target="_blank"
						rel="noreferrer"
						aria-label="View Crowd Symphony on GitHub"
					>
						<Github size={18} />
					</a>
				</div>
			</nav>

			<section className="crowd-hero">
				<div className="crowd-hero-copy">
					<motion.p
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						className="crowd-kicker"
					>
						<Radio size={15} /> Multi-device live music
					</motion.p>
					<motion.h1
						initial={{ opacity: 0, y: 18 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.08 }}
					>
						One room.
						<span>Every phone.</span>
						Your hands.
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, y: 18 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.15 }}
						className="crowd-intro"
					>
						Conduct a synchronized crowd from your browser. Hand gestures shape
						the music while every connected phone becomes part of the show.
					</motion.p>
					<motion.div
						initial={{ opacity: 0, y: 18 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.22 }}
						className="crowd-primary-actions"
					>
						<Link className="crowd-primary-button" href="/conductor">
							<WandSparkles size={18} /> Start conducting{" "}
							<ArrowRight size={17} />
						</Link>
						<Link className="crowd-text-link" href="/audience">
							<Smartphone size={17} /> Join with a room code{" "}
							<ArrowRight size={16} />
						</Link>
					</motion.div>
				</div>

				<motion.div
					initial={{ opacity: 0, scale: 0.97 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.12, duration: 0.55 }}
					className="crowd-stage"
					aria-label="Live audio visualization"
				>
					<div className="crowd-stage-topline">
						<span>Room CS-2025</span>
						<span className="crowd-stage-status">Broadcast ready</span>
					</div>
					<div className="crowd-stage-center">
						<div className="crowd-wave" aria-hidden="true">
							{waveform.map((height, index) => (
								<motion.span
									key={`${height}-${index}`}
									style={{ height: `${height}%` }}
									animate={{ scaleY: [0.55, 1, 0.7] }}
									transition={{
										duration: 1.15 + (index % 5) * 0.12,
										repeat: Number.POSITIVE_INFINITY,
										repeatType: "mirror",
										delay: index * 0.025,
									}}
								/>
							))}
						</div>
						<div className="crowd-hand-readout">
							<span>Gesture input</span>
							<strong>68%</strong>
							<small>Right channel rising</small>
						</div>
					</div>
					<div className="crowd-stage-footer">
						<div>
							<Users size={15} />
							<span>124 connected</span>
						</div>
						<div>
							<span className="crowd-channel-dot coral" />
							Left 62%
						</div>
						<div>
							<span className="crowd-channel-dot cyan" />
							Right 68%
						</div>
					</div>
				</motion.div>
			</section>

			<section className="crowd-mode-strip">
				<div className="crowd-section-heading">
					<p>How it works</p>
					<h2>One simple flow.</h2>
				</div>
				<div className="crowd-mode-grid">
					{steps.map((step) => (
						<div key={step.label}>
							<article className={`crowd-mode crowd-mode-${step.tone}`}>
								<div className="crowd-mode-icon" aria-hidden="true">
									<step.icon size={24} />
								</div>
								<span className="crowd-mode-meta">{step.meta}</span>
								<h3>{step.label}</h3>
								<p>{step.description}</p>
							</article>
						</div>
					))}
				</div>
			</section>

			<footer className="crowd-footer">
				<span>YC Stack Auth Hackathon winner</span>
				<span>MediaPipe · Socket.IO · Web Audio API</span>
			</footer>
		</main>
	);
}
