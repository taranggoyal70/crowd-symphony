# 🎵 How to Add Your Own Music

## 🎧 Current Setup

The app now has **4 built-in tracks**:
1. Electronic Beat
2. Dubstep Drop
3. Bass House
4. EDM Energy

Audience members can choose which track to play!

---

## 🔥 Option 1: Add Online Music URLs

### Edit: `app/audience/page.tsx`

Find the `tracks` array (around line 21) and add your URLs:

```typescript
const tracks = [
  {
    name: "Your Track Name",
    url: "https://your-music-url.com/song.mp3"
  },
  {
    name: "Another Track",
    url: "https://another-url.com/track.mp3"
  }
];
```

### Free Music Sources:
- **Pixabay:** https://pixabay.com/music/
- **Free Music Archive:** https://freemusicarchive.org/
- **Incompetech:** https://incompetech.com/music/
- **YouTube Audio Library:** Download and host yourself

---

## 🎵 Option 2: Use Local Music Files

### Step 1: Add Music to Project

```bash
# Create public/music folder
mkdir -p public/music

# Copy your MP3 files there
cp ~/Downloads/my-dubstep.mp3 public/music/
```

### Step 2: Update Tracks Array

```typescript
const tracks = [
  {
    name: "My Dubstep",
    url: "/music/my-dubstep.mp3"
  },
  {
    name: "Bass Drop",
    url: "/music/bass-drop.mp3"
  }
];
```

### Step 3: Restart Server

```bash
npm run dev
```

---

## 🎼 Option 3: Use Spotify/SoundCloud (Advanced)

You'll need to use their APIs:

### Spotify Web Playback SDK
1. Create Spotify Developer account
2. Get API credentials
3. Implement Spotify Web Playback SDK
4. Requires Spotify Premium

### SoundCloud Widget API
1. Get SoundCloud track URL
2. Use SoundCloud Widget API
3. Embed player

---

## 🔊 Recommended Music Format

**Best Format:** MP3
- **Bitrate:** 128-320 kbps
- **Sample Rate:** 44.1 kHz
- **Channels:** Stereo

**Why MP3?**
- Universal browser support
- Good compression
- Works on all devices

---

## 🎯 Quick Example: Add Your Own Track

### 1. Download a free dubstep track from Pixabay

### 2. Put it in `public/music/my-track.mp3`

### 3. Edit `app/audience/page.tsx`:

```typescript
const tracks = [
  {
    name: "Electronic Beat",
    url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3"
  },
  {
    name: "My Custom Track", // ← Add this
    url: "/music/my-track.mp3" // ← Add this
  }
];
```

### 4. Restart and test!

---

## 🎨 Customize Track Display

You can add more info to tracks:

```typescript
const tracks = [
  {
    name: "Epic Drop",
    url: "/music/epic.mp3",
    artist: "DJ Name",
    bpm: 140,
    genre: "Dubstep"
  }
];
```

Then display it in the UI!

---

## 🔥 Pro Tips

### 1. **Keep Files Small**
- Compress MP3s to 128-192 kbps
- Shorter tracks load faster
- Mobile data friendly

### 2. **Test on Mobile**
- Some formats don't work on iOS
- MP3 is safest choice
- Test with headphones!

### 3. **Loop-Friendly Tracks**
- Tracks are set to loop
- Choose seamless loops
- Or disable loop: remove `loop` from `<audio>`

### 4. **Copyright**
- Use royalty-free music
- Or music you own rights to
- Don't use copyrighted tracks!

---

## 🎵 Free Dubstep/EDM Resources

1. **Pixabay Music**
   - https://pixabay.com/music/search/dubstep/
   - Free, no attribution required

2. **Free Music Archive**
   - https://freemusicarchive.org/search?quicksearch=dubstep
   - Various licenses

3. **Incompetech**
   - https://incompetech.com/music/royalty-free/music.html
   - Attribution required

4. **YouTube Audio Library**
   - Download from YouTube Studio
   - Free for creators

---

## 🚀 Next Steps

Want to add more features?

- **Upload tracks** from phone
- **Sync track selection** across all users
- **Visualizer** that reacts to music
- **Multiple playlists**
- **DJ effects** (reverb, delay, etc.)

Let me know what you want to add! 🎧
