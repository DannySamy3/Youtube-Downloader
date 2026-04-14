/**
 * YouTube Downloader - Configuration File
 * Centralized settings for the application
 */

const config = {
  // Application metadata
  app: {
    name: "YouTube Downloader",
    version: "1.0.0",
    author: "Your Team",
    description:
      "A production-ready desktop app for downloading YouTube videos",
  },

  // Download settings
  download: {
    defaultQuality: "720",
    autoDetectQuality: true,
    maxConcurrentDownloads: 1,
    timeout: 300000, // 5 minutes in milliseconds
    retryAttempts: 3,
  },

  // Video formats
  formats: {
    video: ["1080", "720", "480", "360"],
    audio: ["mp3", "m4a"],
  },

  // UI settings
  ui: {
    theme: "dark",
    language: "en",
    updateCheckInterval: 86400000, // 24 hours
  },

  // FFmpeg settings
  ffmpeg: {
    audioCodec: "libmp3lame",
    audioQuality: "192k",
    timeout: 600000, // 10 minutes
  },

  // File settings
  files: {
    defaultOutputDir: "Downloads",
    maxFilenameLength: 200,
    sanitizeFilenames: true,
  },

  // Security settings
  security: {
    contextIsolation: true,
    nodeIntegration: false,
    enableRemoteModule: false,
    sandbox: true,
    validateUrls: true,
    validateInputs: true,
  },

  // Logging
  logging: {
    enabled: true,
    level: "info", // 'error', 'warn', 'info', 'debug'
    logFile: "~/.youtube-downloader/app.log",
  },

  // Supported URL patterns
  supportedUrls: [
    "youtube.com",
    "www.youtube.com",
    "youtu.be",
    "www.youtu.be",
    "youtube.co.uk",
    "www.youtube.co.uk",
  ],
};

module.exports = config;
