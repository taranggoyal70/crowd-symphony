# 🎵 How to Add Your YouTube Song

## 📺 Song: https://www.youtube.com/watch?v=SVMOND1SU5g

---

## 🚀 **Quick Steps:**

### **Method 1: Using yt-dlp (Recommended)**

#### Step 1: Install yt-dlp
```bash
# On Mac (using Homebrew)
brew install yt-dlp

# Or using pip
pip install yt-dlp
```

#### Step 2: Download Audio
```bash
# Navigate to your project
cd /Users/tarang/CascadeProjects/windsurf-project/crowd-symphony

# Download as MP3
yt-dlp -x --audio-format mp3 -o "public/music/dubstep.mp3" "https://www.youtube.com/watch?v=SVMOND1SU5g"
```

#### Step 3: Done!
The file is now at `public/music/dubstep.mp3` and ready to use!

---

### **Method 2: Online Converter**

#### Step 1: Use Online Tool
Go to one of these sites:
- https://ytmp3.nu/
- https://y2mate.com/
- https://320ytmp3.com/

#### Step 2: Paste URL
```
https://www.youtube.com/watch?v=SVMOND1SU5g
```

#### Step 3: Download MP3
- Click "Convert" or "Download"
- Save the MP3 file

#### Step 4: Move to Project
```bash
# Copy downloaded file to project
cp ~/Downloads/your-downloaded-file.mp3 /Users/tarang/CascadeProjects/windsurf-project/crowd-symphony/public/music/dubstep.mp3
```

---

### **Method 3: Using Browser Extension**

1. Install extension like "Video DownloadHelper"
2. Play the YouTube video
3. Click extension icon
4. Download as MP3
5. Move to `public/music/dubstep.mp3`

---

## ✅ **After Download:**

### 1. Verify File Location
```bash
ls -lh public/music/dubstep.mp3
```

Should show the file!

### 2. Restart Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### 3. Test It!
- Open app on phone
- Choose "Your YouTube Song"
- Press "Drop It"
- Should play! 🎵

---

## 🎯 **File Already Set Up!**

The code is ready at:
```
app/audience/page.tsx
```

Looking for:
```
/music/dubstep.mp3
```

Just download and place the file there!

---

## 🔥 **Quick Command (All-in-One)**

If you have yt-dlp installed:

```bash
cd /Users/tarang/CascadeProjects/windsurf-project/crowd-symphony && \
yt-dlp -x --audio-format mp3 -o "public/music/dubstep.mp3" "https://www.youtube.com/watch?v=SVMOND1SU5g" && \
echo "✅ Download complete! Restart server and test!"
```

---

## ⚠️ **Important Notes:**

### Copyright
- This is for personal/educational use
- Don't redistribute the music
- Respect artist's rights

### File Size
- YouTube audio can be large
- Consider compressing if needed
- Mobile users will download it

### Quality
- yt-dlp downloads best quality
- You can specify bitrate:
  ```bash
  yt-dlp -x --audio-format mp3 --audio-quality 192K -o "public/music/dubstep.mp3" "URL"
  ```

---

## 🎵 **Alternative: Use Multiple Songs**

Want to add more YouTube songs?

```bash
# Download multiple
yt-dlp -x --audio-format mp3 -o "public/music/song1.mp3" "URL1"
yt-dlp -x --audio-format mp3 -o "public/music/song2.mp3" "URL2"
```

Then update tracks array:
```typescript
const tracks = [
  { name: "Song 1", url: "/music/song1.mp3" },
  { name: "Song 2", url: "/music/song2.mp3" },
];
```

---

## 🚀 **Ready to Go!**

1. Download the YouTube song using any method above
2. Place at `public/music/dubstep.mp3`
3. Restart server
4. Select "Your YouTube Song" in app
5. Enjoy! 🎧

---

**Need help? Let me know!**
