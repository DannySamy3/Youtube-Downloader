# YouTube Downloader - Complete Setup Guide

This guide covers installation, running, and building for different scenarios.

## 🚀 Quick Start (5 minutes)

### Option 1: Automated Setup (Recommended)

```bash
# Navigate to project directory
cd youtube-downloader

# Run setup script
node setup.js

# Start the app
npm start
```

### Option 2: Manual Setup

```bash
cd youtube-downloader
npm install
npm start
```

**That's it!** The app should launch.

---

## 📋 Prerequisites Checklist

Before you start, ensure you have:

- [ ] **Node.js v16+**
  - Check: `node --version`
  - Download: https://nodejs.org/ (LTS recommended)
- [ ] **npm v8+**
  - Check: `npm --version`
  - Usually installed with Node.js
- [ ] **macOS 10.13+** (for macOS) OR **Windows 7 SP1+** (for Windows)

- [ ] **~500MB free disk space** per video download

### Installing Node.js

#### macOS (Homebrew)

```bash
brew install node
```

#### macOS (Direct)

Visit https://nodejs.org/ and download the LTS installer.

#### Windows

1. Visit https://nodejs.org/
2. Download Windows Installer
3. Run installer and follow prompts
4. Restart terminal

#### Linux

```bash
# Ubuntu/Debian
sudo apt-get install nodejs npm

# Fedora
sudo dnf install nodejs npm

# Arch
sudo pacman -S nodejs npm
```

---

## 🔧 Development Setup

### Initial Installation

```bash
cd youtube-downloader
npm install
```

This installs:

- Electron (app framework)
- @distube/ytdl-core (YouTube downloader)
- fluent-ffmpeg (audio converter)
- ffmpeg-static (FFmpeg binary)
- electron-builder (installer builder)

### Run in Development

```bash
npm start
```

**Features:**

- DevTools automatically open (press F12 or Cmd+Option+I)
- Reload with Ctrl+R (Windows) or Cmd+R (macOS)
- Change renderer files and refresh to see updates
- Restart app for main process changes

### Development Workflow

1. **Edit renderer files** (`renderer/style.css`, `renderer/renderer.js`, `renderer/index.html`)
   - Save file
   - Press Cmd+R / Ctrl+R to reload

2. **Edit main process** (`main.js`, `preload.js`)
   - Save file
   - Restart the app (close and `npm start`)

3. **Edit download service** (`services/downloader.js`)
   - Save file
   - Restart the app

---

## 🏗️ Building Installers

### Build for Current Platform

```bash
npm run build
```

This creates an installer in the `dist/` folder for your current OS.

### Build for macOS

```bash
npm run dist:mac
```

**Output:**

- `dist/YouTube Downloader-x.x.x.dmg` (disk image)
- `dist/YouTube Downloader-x.x.x.zip` (portable archive)

**Requirements:**

- Must run on macOS or use Docker cross-compilation
- Creates Universal Binary (Intel + Apple Silicon)

### Build for Windows

```bash
npm run dist:win
```

**Output:**

- `dist/YouTube Downloader Setup x.x.x.exe` (installer)
- `dist/YouTube Downloader Setup x.x.x.exe.blockmap`

**Requirements:**

- Must run on Windows or use Docker cross-compilation
- Creates 64-bit installer

### Build All Platforms (CI/CD)

```bash
# Using electron-builder directly
# This requires running on respective OS or Docker multi-platform setup
electron-builder -mwl
```

---

## 📦 Distribution

### Installing on macOS

1. Open `YouTube Downloader-x.x.x.dmg`
2. Drag app to Applications folder
3. First launch: Right-click → Open (if code-unsigned)
4. Grant any security prompts

### Installing on Windows

1. Run `YouTube Downloader Setup x.x.x.exe`
2. Follow installer wizard
3. App appears in Start Menu and Desktop (shortcuts added)
4. Uninstaller available in Control Panel

---

## 🐛 Troubleshooting

### Issue: "npm: command not found"

**Cause:** Node.js not installed or not in PATH
**Solution:**

```bash
# macOS (Homebrew)
brew install node

# Or download from https://nodejs.org/
# Then restart terminal
```

### Issue: "npm install" fails with permission denied

**Solution:**

```bash
# Don't use sudo! Instead:
- Use Homebrew to install Node (recommended)
- Or reinstall Node.js as administrator
- Or fix npm permissions: https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally
```

### Issue: "electron: command not found"

**Cause:** Dependencies not installed
**Solution:**

```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

### Issue: App crashes on startup

**Solution:**

1. Check Node.js version: `node --version` (needs v16+)
2. Reinstall dependencies:
   ```bash
   npm install
   ```
3. Check error in DevTools (Cmd+Option+I)

### Issue: "could not find any available match" (downloading)

**Cause:** YouTube format not available (video quality unavailable)
**Solution:**

- Try a different quality
- Some videos don't have all qualities available

### Issue: FFmpeg conversion fails (MP3 download)

**Solution:**

1. FFmpeg is bundled, so it should work
2. If it doesn't try:
   ```bash
   npm install --no-save ffmpeg-static --force
   ```
3. Reinstall app

### Issue: Getting "Invalid YouTube URL"

**Check:**

- Paste full URL: `https://www.youtube.com/watch?v=...`
- Not a playlist URL
- Not a channel URL
- URL is accessible in browser

### Issue: Build fails with "icon.png not found"

**Solution:**

```bash
# Icon was already created, but if missing:
node -e "
const fs = require('fs'),path = require('path');
const buf = Buffer.from([...]);
fs.writeFileSync(path.join(__dirname,'assets/icon.png'), buf);
"
```

---

## 🔐 Security Notes

The app implements security best practices:

✅ **Context Isolation** - Renderer can't access Node.js  
✅ **Preload Bridge** - Limited IPC API surface  
✅ **No Node Integration** - Direct Node access disabled  
✅ **Sandbox Mode** - Renderer runs isolated  
✅ **Input Validation** - All user inputs checked

**For production deployment:**

1. Code sign the app (add certificate to build config)
2. Distribute through your own server or app store
3. Consider notarization (macOS)

---

## 📊 Development Scripts

In `package.json`, available scripts:

```json
{
  "start": "electron .", // Run in dev mode
  "dev": "electron .", // Same as start
  "build": "npm run dist", // Build current platform
  "dist": "electron-builder", // Build with defaults
  "dist:win": "electron-builder --win", // Windows only
  "dist:mac": "electron-builder --mac" // macOS only
}
```

---

## 🎨 Customization

### Change App Name

1. Edit `package.json`:

   ```json
   {
     "name": "my-youtube-downloader",
     "productName": "My Video Downloader"
   }
   ```

2. Update `build.appId`:
   ```json
   {
     "build": {
       "appId": "com.mycompany.video-downloader"
     }
   }
   ```

### Change Default Settings

Edit `renderer/renderer.js` or `main.js`:

- Default download folder
- Default quality
- UI theme colors

### Add Custom Icon

Replace `assets/icon.png` with your 256x256 PNG or larger.

For best results:

- PNG format
- Transparent background
- 256x256 or larger at 1:1 aspect ratio

---

## 📝 Common Tasks

### Clear Cache and Rebuild

```bash
# Remove all build artifacts
rm -rf dist/ node_modules/ package-lock.json

# Fresh install
npm install

# Rebuild
npm run build
```

### Test on Different Machine

1. Copy entire `youtube-downloader/` folder
2. On target machine:
   ```bash
   cd youtube-downloader
   npm install
   npm start
   ```

### Deploy Binary

After building, distribute from `dist/` folder:

```bash
# macOS
dist/YouTube\ Downloader-*.dmg       # User-friendly installer
dist/YouTube\ Downloader-*.zip        # Portable version

# Windows
dist/YouTube\ Downloader\ Setup*.exe  # NSIS installer
```

---

## 📚 Additional Resources

- **Electron Docs**: https://www.electronjs.org/docs
- **electron-builder**: https://www.electron.build/
- **ytdl-core**: https://github.com/distubejs/ytdl-core
- **fluent-ffmpeg**: https://github.com/fluent-ffmpeg/node-fluent-ffmpeg

---

## 🆘 Still Having Issues?

### Debug Mode

Check console output:

**Windows:**

```bash
npm start 2>&1 | tee debug.log
```

**macOS/Linux:**

```bash
npm start &> debug.log &
```

### Get Help

1. Check the error message in DevTools
2. Review this troubleshooting section
3. Check main.js console output
4. Review electron-builder docs

---

**Last Updated:** 2024
**App Version:** 1.0.0
