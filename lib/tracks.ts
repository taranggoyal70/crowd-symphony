export type CrowdTrack = {
	name: string;
	url: string;
	sizeLabel?: string;
};

export const crowdTracks = [
	{
		name: "Epic Orchestra",
		url: "/music/orchestra.mp3",
		sizeLabel: "Fast load",
	},
	{
		name: "Epic Dubstep Mix",
		url: "/music/dubstep.mp3",
		sizeLabel: "Heavy drop",
	},
	{
		name: "Electronic Beat",
		url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3",
		sizeLabel: "Remote",
	},
	{
		name: "Dubstep Drop",
		url: "https://cdn.pixabay.com/audio/2022/03/10/audio_4deafc42d2.mp3",
		sizeLabel: "Remote",
	},
	{
		name: "Bass House",
		url: "https://cdn.pixabay.com/audio/2022/08/02/audio_884fe5c21c.mp3",
		sizeLabel: "Remote",
	},
] satisfies CrowdTrack[];
