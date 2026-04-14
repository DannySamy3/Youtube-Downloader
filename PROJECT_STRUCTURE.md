# Project File Structure & Dependencies

## 📁 Directory Structure

```
youtube-downloader/
├── 📄 package.json              # NPM configuration, dependencies, build scripts
├── 📄 main.js                   # Electron main process (window management, IPC)
├── 📄 preload.js                # Security bridge (IPC communication)
├── 📄 config.js                 # Configuration settings
├── 📄 setup.js                  # Automated setup script
├── 📄 README.md                 # User documentation
├── 📄 SETUP.md                  # Setup and troubleshooting guide
├── 📄 .gitignore                # Git ignore rules
├── 📄 .npmrc                    # NPM configuration
├── 📁 renderer/                 # Frontend (renderer process)
│   ├── 📄 index.html            # UI markup
│   ├── 📄 style.css             # Styling and layout
│   └── 📄 renderer.js           # UI logic and interactions
├── 📁 services/                 # Backend services
│   └── 📄 downloader.js         # YouTube download & conversion logic
└── 📁 assets/                   # Static assets
    └── 🖼️ icon.png              # Application icon
```

## 📋 File Descriptions

### Core Application Files

#### `package.json`

- **Purpose:** NPM package configuration
- **Contains:** Dependencies, build scripts, app metadata, electron-builder config
- **Key Scripts:**
  - `npm start` - Run in dev mode
  - `npm run build` - Create installers
  - `npm run dist:mac` - macOS only
  - `npm run dist:win` - Windows only

#### `main.js` (Electron Main Process)

- **Purpose:** Manages application window and IPC communication
- **Responsibilities:**
  - Window creation and management
  - IPC handlers for download, validation, etc.
  - File dialogs
  - App lifecycle management
- **Dependencies:** electron, path
- **IPC Methods Exposed:**
  - `download-video` - Start download
  - `show-save-dialog` - File picker
  - `validate-url` - URL validation

#### `preload.js` (Security Bridge)

- **Purpose:** Secure IPC communication between renderer and main
- **Responsibilities:**
  - Validates all IPC input
  - Exposes only necessary APIs
  - Prevents direct Node.js access from renderer
- **Dependencies:** electron (contextBridge, ipcRenderer)
- **Exposed APIs in window.electronAPI:**
  - `downloadVideo(options)`
  - `showSaveDialog()`
  - `validateUrl(url)`
  - `onDownloadProgress(callback)`

#### `config.js`

- **Purpose:** Centralized configuration
- **Contains:** App settings, quality options, FFmpeg settings, security settings
- **Usage:** Import and use in main.js or services

### UI Files (Renderer Process)

#### `renderer/index.html`

- **Purpose:** Application UI structure
- **Sections:**
  - Header with title
  - URL input section
  - Video preview section
  - Format selection (video & audio)
  - Download button
  - Progress bar
  - Message display
- **Features:** Responsive grid layout, semantic HTML
- **Links:** style.css, renderer.js

#### `renderer/style.css`

- **Purpose:** Application styling and layout
- **Features:**
  - Dark theme with YouTube red accent
  - Responsive grid layout
  - Progress bar animations
  - Button states and hover effects
  - Mobile-friendly (768px breakpoint)
- **CSS Variables:**
  - `--primary: #ff0000` (YouTube red)
  - `--success: #1db954` (Spotify green)
  - `--dark: #1a1a1a` (Dark background)

#### `renderer/renderer.js`

- **Purpose:** UI logic and event handling
- **Responsibilities:**
  - Handle button clicks
  - Manage UI state
  - Format selection logic
  - Download flow
  - Progress updates
  - Message display
- **Dependencies:** window.electronAPI (from preload)
- **Key Functions:**
  - `loadBtn.addEventListener()` - Load video
  - `formatBtns.addEventListener()` - Format selection
  - `downloadBtn.addEventListener()` - Download trigger
  - `updateProgress()` - Progress bar updates

### Service Files (Backend)

#### `services/downloader.js`

- **Purpose:** YouTube download and conversion logic
- **Key Functions:**
  - `downloadVideo(url, format, quality, outputPath, onProgress)` - Main download
  - `downloadVideoMP4(url, quality, outputPath, onProgress)` - Video download
  - `downloadAudio(url, format, outputPath, onProgress)` - Audio extraction
  - `getVideoInfo(url)` - Fetch metadata
  - `validateURL(url)` - URL validation
- **Dependencies:**
  - `@distube/ytdl-core` - YouTube downloading
  - `fluent-ffmpeg` - Audio conversion
  - `ffmpeg-static` - FFmpeg binary
  - `fs`, `path` - Node filesystem
- **Features:**
  - Real-time progress tracking
  - FFmpeg audio conversion
  - Error handling
  - Stream-based downloading (memory efficient)

### Setup & Documentation

#### `setup.js`

- **Purpose:** Automated first-time setup
- **Usage:** `node setup.js`
- **Actions:**
  - Check Node.js version
  - Validate project files
  - Install dependencies
  - Display next steps
- **Dependencies:** node (built-in modules only)

#### `README.md`

- **Purpose:** User documentation
- **Contains:**
  - Feature overview
  - Tech stack
  - Installation instructions
  - Usage guide
  - Troubleshooting
  - Legal notice

#### `SETUP.md`

- **Purpose:** Detailed setup and development guide
- **Contains:**
  - Quick start instructions
  - Prerequisites checklist
  - Development setup
  - Build instructions
  - Troubleshooting (comprehensive)
  - Customization guide
  - Common tasks

### Configuration Files

#### `.gitignore`

- **Purpose:** Git ignore rules
- **Excludes:** node_modules/, dist/, build/, logs, etc.

#### `.npmrc`

- **Purpose:** NPM configuration
- **Settings:** exact versions, peer dependencies

#### `assets/icon.png`

- **Purpose:** Application icon
- **Usage:** Appears in window title bar, installer, and Start menu
- **Size:** 256x256 PNG (minimum)

## 🔗 Dependencies & Their Roles

### Runtime Dependencies

```
@distube/ytdl-core
├─ Purpose: Download YouTube videos
├─ Version: ^4.14.5
├─ Size: ~300KB
└─ Used in: services/downloader.js

fluent-ffmpeg
├─ Purpose: Node.js interface for FFmpeg
├─ Version: ^2.1.3
├─ Size: ~50KB
└─ Used in: services/downloader.js

ffmpeg-static
├─ Purpose: Pre-built FFmpeg binary
├─ Version: ^5.2.0
├─ Size: ~50-100MB (includes binary)
└─ Used in: services/downloader.js
```

### Development Dependencies

```
electron
├─ Purpose: Desktop application framework
├─ Version: ^29.0.0
├─ Size: ~200MB (includes Chromium)
└─ Used in: main.js, package.json

electron-builder
├─ Purpose: Build installers for Windows & macOS
├─ Version: ^24.9.1
├─ Size: ~100MB (with dependencies)
└─ Used in: package.json build scripts
```

## 🔄 Data Flow

```
User Input
    ↓
renderer.js
    ↓
window.electronAPI (preload.js)
    ↓
IPC main.js
    ↓
services/downloader.js
    ↓
@distube/ytdl-core (YouTube API)
    ↓
Downloaded file / FFmpeg conversion
    ↓
Saved to user's selected location
    ↓
Progress updates back to UI
```

## 🔐 Security Boundaries

```
┌─────────────────────────────────────────┐
│ Main Process (Node.js - Full Access)    │
│  main.js, services/downloader.js        │
└─────────────────────────────────────────┘
           ↕ IPC (preload.js validates)
┌─────────────────────────────────────────┐
│ Renderer Process (Sandboxed)            │
│  renderer/index.html, renderer.js       │
│  Can only access: window.electronAPI    │
└─────────────────────────────────────────┘
```

## 📦 Build Output

### Development Build

- **Command:** `npm start`
- **Output:** Live Electron window with DevTools
- **Size:** N/A (hot-loaded from source)

### Production Build

- **Command:** `npm run build`
- **macOS Output:**
  - `dist/YouTube Downloader-x.x.x.dmg` (~80-120MB)
  - `dist/YouTube Downloader-x.x.x.zip` (~60-100MB)
- **Windows Output:**
  - `dist/YouTube Downloader Setup x.x.x.exe` (~80-120MB)

## 🚀 Installation Size

- **App Folder (src):** ~500KB
- **node_modules:** ~500MB
- **macOS Installer:** ~100MB
- **Windows Installer:** ~100MB
- **Runtime Disk Space:** 500MB-1GB per video

## 📊 Performance Characteristics

- **Startup Time:** 2-4 seconds
- **Memory Usage:** 150-300MB idle, 500-1000MB downloading
- **Download Speed:** Limited only by internet connection
- **Conversion Speed:** Depends on audio bitrate (typically 30-60 seconds per minute of audio)

## 🔄 Update Paths

### From v1.0.0 to v1.x.x

1. Update version in package.json
2. Rebuild with `npm run build`
3. Distribute new installers from `dist/`

### Auto-Updates (Future Enhancement)

- Use `electron-updater` package
- Configure S3 or server for update manifests
- Add auto-update check in main.js

---

**Total Project Files:** 12  
**Total Lines of Code:** ~1,500  
**Build Time:** 2-5 minutes  
**First Install Time:** 3-10 minutes (depends on internet)
