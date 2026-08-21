export type CrowdTrack = {
	name: string;
	url: string;
	preload?: "auto" | "metadata" | "none";
	sizeLabel?: string;
	duration?: number; // in seconds
	loop?: boolean;
};

export const crowdTracks = [
	{
		name: "Epic Orchestra",
		url: "/music/orchestra.mp3",
		preload: "auto",
		sizeLabel: "2.0 MB",
		duration: 129,
		loop: true,
	},
	{
		name: "Epic Dubstep Mix",
		url: "/music/dubstep.mp3",
		preload: "auto",
		sizeLabel: "939 KB",
		duration: 60,
		loop: true,
	},
	{
		name: "Electronic Beat",
		url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3",
		preload: "metadata",
		sizeLabel: "Remote",
		duration: 180,
		loop: true,
	},
	{
		name: "Dubstep Drop",
		url: "https://cdn.pixabay.com/audio/2022/03/10/audio_4deafc42d2.mp3",
		preload: "metadata",
		sizeLabel: "Remote",
		duration: 145,
		loop: true,
	},
	{
		name: "Bass House",
		url: "https://cdn.pixabay.com/audio/2022/08/02/audio_884fe5c21c.mp3",
		preload: "metadata",
		sizeLabel: "Remote",
		duration: 172,
		loop: true,
	},
] satisfies CrowdTrack[];

export function getTrackByIndex(index: number): CrowdTrack {
	return crowdTracks[index] ?? crowdTracks[0];
}

export function getTrackCount(): number {
	return crowdTracks.length;
}
