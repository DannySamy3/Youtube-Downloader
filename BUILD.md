# Build Guide - YouTube Downloader

This guide explains how to build the YouTube Downloader application for macOS (DMG) and Windows (EXE) platforms.

## Prerequisites

Before building, ensure you have:

1. **Node.js & npm** (v16+)
   - Download from https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **Git** (for version control)
   - Already installed on macOS by default
   - Or download from https://git-scm.com/

3. **Dependencies installed:**
   ```bash
   npm install
   ```

4. **For macOS builds specifically:**
   - macOS 10.13+ (High Sierra or later)
   - Xcode Command Line Tools (usually pre-installed)
   - Optional: Xcode certificate for code signing (can skip for development builds)

5. **For Windows builds specifically:**
   - Windows 7 SP1 or later
   - NSIS (automatically installed by electron-builder)

6. **System Dependencies:**
   - **yt-dlp** (YouTube downloader cli)
     - macOS: `brew install yt-dlp`
     - Windows: `choco install yt-dlp` or download from https://github.com/yt-dlp/yt-dlp
   - **FFmpeg** (video/audio processing)
     - macOS: `brew install ffmpeg`
     - Windows: `choco install ffmpeg` or download from https://ffmpeg.org/download.html

## Project Structure

```
youtube-downloader/
├── main.js                 # Electron main process
├── preload.js             # Security preload script
├── package.json           # Build configuration & dependencies
├── renderer/              # UI files
│   ├── index.html
│   ├── style.css
│   └── renderer.js
├── services/
│   └── downloader.js      # Download & conversion logic
├── assets/                # App icon and resources
│   └── icon.png
└── dist/                  # Output directory for builds (created during build)
```

## Building for macOS (DMG)

### Quick Build

```bash
npm run dist:mac
```

Output files will be in `dist/`:
- `YouTube Downloader-1.0.0-arm64.dmg` - macOS app installer (Apple Silicon)
- `YouTube Downloader-1.0.0-arm64-mac.zip` - Portable ZIP archive

### Step-by-Step Build Process

1. **Open Terminal** and navigate to project:
   ```bash
   cd youtube-downloader
   ```

2. **Clean previous builds** (optional but recommended):
   ```bash
   rm -rf dist
   ```

3. **Build:**
   ```bash
   npm run dist:mac
   ```

4. **Wait for build to complete** (typically 1-2 minutes)

5. **Find the DMG file:**
   ```bash
   ls -lh dist/*.dmg
   ```

### Installation from DMG

1. Download or locate the `YouTube Downloader-X.X.X-arm64.dmg` file
2. Double-click to mount the DMG
3. Drag the "YouTube Downloader" app icon into the Applications folder
4. Open Applications folder and launch the app

### Code Signing (Optional for Distribution)

For production builds, code signing is recommended:

1. Obtain a Mac Developer certificate from Apple
2. Update `package.json` build config:
   ```json
   "mac": {
     "certificateFile": "/path/to/certificate.p12",
     "certificatePassword": "password"
   }
   ```
3. Rebuild: `npm run dist:mac`

Note: Skip code signing for development/testing builds.

## Building for Windows (EXE)

### Quick Build

```bash
npm run dist:win
```

Output file will be in `dist/`:
- `YouTube Downloader Setup 1.0.0.exe` - Windows installer (x64)

### Step-by-Step Build Process

1. **Open Command Prompt or PowerShell** and navigate to project:
   ```bash
   cd youtube-downloader
   ```

2. **Clean previous builds** (optional):
   ```bash
   rmdir /s /q dist
   ```

3. **Build:**
   ```bash
   npm run dist:win
   ```

4. **Wait for build to complete** (typically 2-3 minutes)

5. **Find the EXE file:**
   ```bash
   dir dist\*.exe
   ```

### Installation from EXE

1. Download `YouTube Downloader Setup 1.0.0.exe`
2. Double-click the installer
3. Follow the installation wizard:
   - Choose installation directory
   - Installation will create:
     - Desktop shortcut
     - Start Menu entry
4. Click "Finish" to launch the app

### Installer Features

The Windows installer includes:

- ✅ Custom installation directory selection
- ✅ Desktop shortcut creation
- ✅ Start Menu shortcuts
- ✅ Automatic uninstall option
- ✅ One-click launch after installation

## Building for Both Platforms

Create both DMG and EXE installers:

```bash
npm run build
```

This runs electron-builder for all configured platforms.

## Build Configuration

The build settings are in `package.json` under the `"build"` section:

```json
{
  "build": {
    "appId": "com.youtube-downloader.app",
    "productName": "YouTube Downloader",
    "files": ["main.js", "preload.js", "renderer/**/*", "services/**/*", "assets/**/*", "package.json"],
    "win": { "target": ["nsis"] },
    "mac": { "target": ["dmg", "zip"] }
  }
}
```

### Customizing the Build

To modify installer behavior:

1. **Change app name:** Edit `"productName"` in `package.json`
2. **Change app version:** Edit `"version"` in `package.json`
3. **Add custom icon:** Place icon in `assets/` folder and reference it
4. **Change installation options:** Modify the `"nsis"` or `"mac"` section

Then rebuild: `npm run dist:mac` or `npm run dist:win`

## Troubleshooting

### Build fails with "signing required"

**macOS:** Disable code signing for development:
```bash
# Build without signing
SKIP_NOTARIZE=true npm run dist:mac
```

Or edit `package.json` to add:
```json
"mac": {
  "gatekeeperAssess": false
}
```

### Build fails with missing dependencies

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run dist:mac  # or dist:win
```

### "yt-dlp not found" when installing/running

Install system yt-dlp:
- **macOS**: `brew install yt-dlp`
- **Windows**: `choco install yt-dlp`

### Build succeeds but app won't start

1. Ensure all system dependencies are installed (yt-dlp, ffmpeg)
2. Clear node_modules and reinstall: `npm install`
3. Try development mode first: `npm start`

### "FFmpeg not found" errors during download

FFmpeg is bundled via `ffmpeg-static`, but you can also install system ffmpeg:
- **macOS**: `brew install ffmpeg`
- **Windows**: `choco install ffmpeg`

### Very large installer file

This is normal. The app bundles:
- Electron runtime (~150MB)
- Node modules
- FFmpeg binaries
- yt-dlp packages

Typical sizes:
- macOS: 100-150MB
- Windows: 150-200MB

## Automated Building with CI/CD

For automated builds on every commit:

1. **Using GitHub Actions:** Add `.github/workflows/build.yml`
2. **Using Travis CI:** Add `.travis.yml`
3. **Using AppVeyor:** Add `appveyor.yml`

See https://www.electron.build/multi-platform-build for examples.

## Distribution

### Placing on GitHub Releases

1. Create a new GitHub Release
2. Upload the DMG and EXE files
3. Include release notes describing changes

Example files to upload:
- `YouTube Downloader-1.0.0-arm64.dmg`
- `YouTube Downloader Setup 1.0.0.exe`

### Updating the App

To create a new version:

1. Modify `"version"` in `package.json` (e.g., `"1.0.1"`)
2. Commit changes: `git add . && git commit -m "v1.0.1 release"`
3. Tag the version: `git tag v1.0.1`
4. Push to GitHub: `git push origin main && git push origin v1.0.1`
5. Rebuild installers: `npm run build`
6. Upload new installers to GitHub Releases

## Advanced Options

### Building for Specific Architecture

**macOS (arm64 only - Apple Silicon):**
```bash
npm run dist:mac
```

**macOS (Intel x64):** Edit `package.json` and rebuild

**Windows (x64):**
```bash
npm run dist:win
```

### Creating Portable Versions

**macOS portable ZIP:**
```bash
npm run dist:mac
# File: YouTube Downloader-X.X.X-arm64-mac.zip
```

**Windows portable EXE:**
Modify `package.json` `"win"` target to include `"nsis"`, `"portable"`, etc.

### Building for Testing

Quick test build without optimizations:

```bash
npm run pack
```

Creates unpackaged app for testing (no installer created).

## Resources

- **Electron Documentation:** https://www.electronjs.org/docs
- **Electron Builder:** https://www.electron.build/
- **NSIS (Windows installer):** https://nsis.sourceforge.io/
- **yt-dlp:** https://github.com/yt-dlp/yt-dlp
- **FFmpeg:** https://ffmpeg.org/

## Need Help?

See `README.md` for usage instructions and troubleshooting common runtime issues.

---

**Version:** 1.0.0  
**Last Updated:** April 2026
