import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
	ErrorBoundary,
	SentryProvider,
} from "@/app/_components/sentry-provider";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: {
		default: "Crowd Symphony",
		template: "%s | Crowd Symphony",
	},
	description:
		"Conduct an audience-powered music experience with hand gestures. Turn every phone into part of the show.",
	keywords: [
		"music",
		"live performance",
		"audience participation",
		"hand gestures",
		"conductor",
		"interactive",
		"event technology",
	],
	authors: [{ name: "Crowd Symphony Team" }],
	creator: "Crowd Symphony",
	publisher: "Crowd Symphony",
	robots: "index, follow",
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://crowd-symphony.vercel.app",
		siteName: "Crowd Symphony",
		title: "Crowd Symphony - Conduct the Crowd",
		description:
			"Turn every audience phone into a synchronized instrument. Conduct with hand gestures.",
		images: [
			{
				url: "/social-preview.png",
				width: 1200,
				height: 630,
				alt: "Crowd Symphony - Audience-powered music experience",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Crowd Symphony",
		description:
			"Conduct an audience-powered music experience with hand gestures.",
		images: ["/social-preview.png"],
		creator: "@taranggoyal70",
	},
	icons: {
		icon: "/favicon.ico",
		shortcut: "/favicon-16x16.png",
		apple: "/apple-touch-icon.png",
	},
	manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
	themeColor: "#090a0f",
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<SentryProvider>
					<ErrorBoundary>{children}</ErrorBoundary>
				</SentryProvider>
			</body>
		</html>
	);
}
