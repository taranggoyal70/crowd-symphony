/**
 * Service Worker for Crowd Symphony
 * Caches audio assets for offline playback
 */

const CACHE_NAME = "crowd-symphony-v1.0.0";
const AUDIO_CACHE = "crowd-symphony-audio-v1.0.0";

const STATIC_ASSETS = ["/", "/manifest.json", "/site.webmanifest"];

const AUDIO_ASSETS = ["/music/orchestra.mp3", "/music/dubstep.mp3"];

// Install - cache static assets
self.addEventListener("install", (event) => {
	event.waitUntil(
		Promise.all([
			caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
			caches.open(AUDIO_CACHE).then((cache) => cache.addAll(AUDIO_ASSETS)),
		]),
	);
	self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key !== CACHE_NAME && key !== AUDIO_CACHE)
						.map((key) => caches.delete(key)),
				),
			),
	);
	self.clients.claim();
});

// Fetch - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
	const url = new URL(event.request.url);

	// Audio files - cache first strategy
	if (url.pathname.endsWith(".mp3") || url.pathname.startsWith("/music/")) {
		event.respondWith(
			caches.match(event.request).then((cached) => {
				if (cached) return cached;
				return fetch(event.request).then((response) => {
					if (response.ok) {
						const clone = response.clone();
						caches
							.open(AUDIO_CACHE)
							.then((cache) => cache.put(event.request, clone));
					}
					return response;
				});
			}),
		);
		return;
	}

	// Static assets - cache first
	if (
		url.pathname === "/" ||
		url.pathname.endsWith(".webmanifest") ||
		url.pathname.endsWith(".json")
	) {
		event.respondWith(
			caches.match(event.request).then((cached) => {
				if (cached) return cached;
				return fetch(event.request);
			}),
		);
		return;
	}

	// Everything else - network first
	event.respondWith(
		fetch(event.request).catch(() => caches.match(event.request)),
	);
});

// Message handling for cache updates
self.addEventListener("message", (event) => {
	if (event.data === "skipWaiting") {
		self.skipWaiting();
	}
	if (event.data === "clearCache") {
		caches
			.keys()
			.then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
	}
});
