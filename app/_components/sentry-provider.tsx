"use client";

import * as Sentry from "@sentry/nextjs";
import React, { useEffect } from "react";

export function SentryProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		if (process.env.NODE_ENV !== "production") return;

		const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
		if (!dsn) return;

		Sentry.init({
			dsn,
			tracesSampleRate: 0.1,
			replaysSessionSampleRate: 0.1,
			replaysOnErrorSampleRate: 1.0,
			environment: process.env.NODE_ENV,
			integrations: [
				Sentry.browserTracingIntegration(),
				Sentry.replayIntegration({
					maskAllText: true,
					blockAllMedia: true,
				}),
			],
		});

		// Set user context if available
		// This would typically come from your auth system
		// Sentry.setUser({ id: userId, email: userEmail });
	}, []);

	return <>{children}</>;
}

// Error boundary for catching render errors
export class ErrorBoundary extends React.Component<
	{ children: React.ReactNode; fallback?: React.ReactNode },
	{ hasError: boolean; error: Error | null }
> {
	constructor(props: {
		children: React.ReactNode;
		fallback?: React.ReactNode;
	}) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		Sentry.captureException(error, {
			extra: {
				componentStack: errorInfo.componentStack,
			},
		});
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
					<div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
						<div className="mb-4 text-6xl">🎭</div>
						<h1 className="text-2xl font-bold">Something went wrong</h1>
						<p className="mt-2 text-zinc-400">
							We captured this error and our team has been notified.
						</p>
						<button
							onClick={() => window.location.reload()}
							className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-black"
						>
							Reload Page
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
