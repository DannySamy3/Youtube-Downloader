# YouTube Downloader - Production-Ready Electron Desktop App

A cross-platform desktop application for downloading YouTube videos and audio with a modern, intuitive interface.

## Features

✨ **Modern UI**

- Clean, responsive interface with dark theme
- Real-time download progress tracking
- Embedded video preview and information

🎥 **Video Downloading**

- Support for multiple video qualities: 1080p, 720p, 480p, 360p
- MP4 format with H.264 codec
- Real-time progress with speed and ETA calculations

🎵 **Audio Extraction**

- Convert to MP3 format
- Extract as M4A audio-only format
- FFmpeg-powered conversion

🔒 **Security**

- Context isolation enabled
- No node integration in renderer process
- Secure IPC communication via preload bridge
- Sandboxed renderer context
- Input validation on all operations

🛠️ **Production Ready**

- Electron builder configuration for Windows & macOS installers
- Error handling and user-friendly messages
- Cross-platform compatibility

## Tech Stack

- **Electron** - Desktop application framework
- **@distube/ytdl-core** - YouTube downloader
- **fluent-ffmpeg + ffmpeg-static** - Audio/video processing
- **electron-builder** - Installer creation
- **Vanilla HTML + CSS + JavaScript** - UI (no framework)

## Project Structure

```
youtube-downloader/
├── main.js                 # Electron main process
├── preload.js             # Security bridge (IPC)
├── package.json           # Dependencies and build config
├── renderer/
│   ├── index.html         # Main UI
│   ├── style.css          # Styling
│   └── renderer.js        # UI logic
├── services/
│   └── downloader.js      # Download & conversion logic
└── assets/
    └── icon.png           # App icon
```

## Prerequisites

- **Node.js** v16+ and npm (required for installation and runtime)
- **FFmpeg** (installed via ffmpeg-static automatically)
- macOS 10.13+ or Windows 7+

## Installation

1. **Clone or extract the project:**

   ```bash
   cd youtube-downloader
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

   This installs:
   - Electron
   - @distube/ytdl-core (YouTube downloader)
   - fluent-ffmpeg
   - ffmpeg-static
   - electron-builder

## Development

### Running the App

Start the app in development mode:

```bash
npm start
```

Or use the shorthand:

```bash
npm run dev
```

The app will launch with DevTools open for debugging.

### Hot Reload

For changes to renderer files (HTML/CSS/JS), simply save and refresh the Electron window (⌘+R on macOS, Ctrl+R on Windows).

For main process changes, restart the app.

## Building

### Create Installers

Build for your current platform:

```bash
npm run build
```

Or specify a platform:

```bash
npm run dist:mac     # macOS DMG
npm run dist:win     # Windows NSIS installer
```

### Output

Installers are generated in the `dist/` directory:

- **macOS**: `YouTube Downloader-x.x.x.dmg` and `YouTube Downloader-x.x.x.zip`
- **Windows**: `YouTube Downloader Setup x.x.x.exe`

### Build Configuration

Edit `package.json` under the `"build"` section to customize:

- App name and icon
- Installer behavior
- Target platforms and architectures

## Usage Guide

### Step 1: Load Video

1. Paste a YouTube URL into the input field
2. Click "Load Video"
3. The app fetches video information and displays preview

### Step 2: Select Format

1. Choose video quality (1080p, 720p, 480p, 360p) OR
2. Choose audio format (MP3, M4A)

### Step 3: Download

1. Click "📥 Download"
2. Choose save location
3. Monitor progress in real-time
4. Download completes automatically

## Supported YouTube URLs

The app accepts standard YouTube URLs:

- `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- `https://youtu.be/dQw4w9WgXcQ`
- `https://www.youtube.com/playlist?list=...` (single videos from playlists)

## Error Handling

The app gracefully handles:

- ❌ Invalid YouTube URLs
- ❌ Video unavailable or private
- ❌ Network connection errors
- ❌ FFmpeg conversion failures
- ❌ Insufficient disk space
- ❌ Download cancellation

All errors are displayed with user-friendly messages.

## Security Features

✅ **Context Isolation**: Renderer and main process are isolated
✅ **NodeIntegration Disabled**: No direct Node.js access from renderer
✅ **Preload Bridge**: Only necessary IPC methods exposed
✅ **Sandbox Mode**: Renderer runs in sandbox
✅ **Input Validation**: All user inputs validated
✅ **No Remote Module**: Remote module disabled

## System Requirements

### macOS

- OS X 10.13 (High Sierra) or later
- 100MB disk space for app + 500MB per download

### Windows

- Windows 7 SP1 or later
- 100MB disk space for app + 500MB per download

## Troubleshooting

### "npm: command not found"

Install Node.js from https://nodejs.org/ and restart your terminal.

### App won't start

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
npm start
```

### Downloads fail with FFmpeg error

The app includes ffmpeg-static, so FFmpeg is bundled. If issues persist:

```bash
npm install --no-save ffmpeg-static@latest
```

### "Invalid YouTube URL" error

Ensure the URL is a valid YouTube video URL (not playlist URL or shortened link from other services).

## Development Notes

### Modifying Download Logic

Edit `services/downloader.js` to:

- Add new video formats
- Change quality options
- Modify FFmpeg conversion settings
- Add new audio codecs

### Modifying UI

- `renderer/index.html` - Structure
- `renderer/style.css` - Styling
- `renderer/renderer.js` - Interactions

### IPC Communication

New features should:

1. Add handler in `main.js` using `ipcMain.handle()`
2. Expose in `preload.js` via `contextBridge.exposeInMainWorld()`
3. Call from `renderer/renderer.js` via `window.electronAPI`

## Build Tips

### Reducing App Size

- Remove DevTools in production (main.js)
- Use `electron-builder` with `asar` option
- Optimize FFmpeg binary

### Code Signing (macOS/Windows)

The build config supports code signing. Add to `package.json`:

```json
"build": {
  "mac": {
    "certificateFile": "path/to/cert.p12",
    "certificatePassword": "password"
  }
}
```

## Performance Tips

- Downloads use streaming to minimize memory usage
- Progress updates throttled to 100ms intervals
- FFmpeg runs in separate process
- UI responsive during downloads

## Legal Notice

Users are responsible for ensuring their downloads comply with:

- YouTube Terms of Service
- Local copyright laws
- Content creator's licensing

This tool is provided for personal use and educational purposes.

## License

MIT

## Support

For issues:

1. Check error message in app
2. Review Troubleshooting section
3. Check FFmpeg installation: `ffmpeg -version`
4. Verify Node.js: `node --version`

## Changelog

### v1.0.0 (Initial Release)

- ✅ YouTube video downloading in multiple qualities
- ✅ Audio extraction to MP3/M4A
- ✅ Real-time progress tracking
- ✅ macOS and Windows installer support
- ✅ Production-ready security configuration
- ✅ Modern, responsive UI

---

**Built with Electron, Node.js, and ❤️**
