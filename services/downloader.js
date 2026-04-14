const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");

// Find and set ffmpeg path - use system ffmpeg from Homebrew
function getFFmpegPath() {
  const possiblePaths = [
    '/usr/local/bin/ffmpeg',      // Intel Mac
    '/opt/homebrew/bin/ffmpeg',   // Apple Silicon
  ];
  
  for (const ffmpegPath of possiblePaths) {
    if (fs.existsSync(ffmpegPath)) {
      return ffmpegPath;
    }
  }
  
  // Fallback - try system PATH
  return 'ffmpeg';
}

// Set ffmpeg path
const ffmpegPath = getFFmpegPath();
ffmpeg.setFfmpegPath(ffmpegPath);

// Find yt-dlp binary - works in both dev and packaged app
function getYtdlpPath() {
  // Try different possible locations
  const possiblePaths = [
    '/usr/local/bin/yt-dlp',        // Homebrew on Intel
    '/opt/homebrew/bin/yt-dlp',     // Homebrew on Apple Silicon
    'yt-dlp'                         // System PATH
  ];
  
  for (const binPath of possiblePaths) {
    try {
      // For absolute paths, check file exists
      if (binPath.startsWith('/')) {
        if (fs.existsSync(binPath)) {
          return binPath;
        }
      } else {
        // For 'yt-dlp', just try it - will use $PATH
        return binPath;
      }
    } catch (e) {}
  }
  
  // Fallback to just 'yt-dlp' and hope it's in PATH
  return 'yt-dlp';
}

/**
 * Validate YouTube URL
 */
function validateURL(url) {
  try {
    const ytdlUrl = new URL(url);
    return (
      ytdlUrl.hostname === "www.youtube.com" ||
      ytdlUrl.hostname === "youtube.com" ||
      ytdlUrl.hostname === "youtu.be" ||
      ytdlUrl.hostname === "www.youtu.be"
    );
  } catch {
    return false;
  }
}

/**
 * Extract video ID from YouTube URL
 */
function extractVideoId(url) {
  try {
    const urlObj = new URL(url);

    // Handle youtu.be short links
    if (urlObj.hostname.includes("youtu.be")) {
      return urlObj.pathname.slice(1).split("?")[0];
    }

    // Handle YouTube Shorts: /shorts/{VIDEO_ID}
    if (urlObj.pathname.includes("/shorts/")) {
      const shortId = urlObj.pathname.split("/shorts/")[1];
      return shortId.split("?")[0]; // Remove query params if any
    }

    // Handle standard videos: ?v={VIDEO_ID}
    const videoId = urlObj.searchParams.get("v");
    if (videoId) {
      return videoId;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get video info and available formats
 */
async function getVideoInfo(url) {
  try {
    if (!validateURL(url)) {
      throw new Error("Invalid YouTube URL");
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error("Could not extract video ID from URL");
    }

    // Return basic info with YouTube thumbnail - no need to call yt-dlp for metadata
    return {
      title: "YouTube Video (" + videoId + ")",
      duration: "Unknown",
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      author: "Unknown",
      description: "Ready to download. You can select video quality (1080p/720p/480p/360p) or audio format (MP3/M4A).",
      formats: { video: [], audio: [] },
    };
  } catch (error) {
    throw new Error(`Failed to get video info: ${error.message}`);
  }
}

/**
 * Download video or audio
 */
async function downloadVideo({ url, format, quality, outputPath, onProgress }) {
  try {
    if (!validateURL(url)) {
      throw new Error("Invalid YouTube URL");
    }

    if (!fs.existsSync(path.dirname(outputPath))) {
      throw new Error("Output directory does not exist");
    }

    let startTime = Date.now();
    let downloadedBytes = 0;

    if (format === "mp4") {
      return await downloadVideoMP4(url, quality, outputPath, onProgress);
    } else if (format === "mp3" || format === "m4a") {
      return await downloadAudio(url, format, outputPath, onProgress);
    } else {
      throw new Error("Unsupported format: " + format);
    }
  } catch (error) {
    throw new Error(`Download failed: ${error.message}`);
  }
}

/**
 * Download video as MP4 - SIMPLIFIED
 */
async function downloadVideoMP4(url, quality, outputPath, onProgress) {
  return new Promise((resolve, reject) => {
    try {
      const qualityMap = {
        '1080p': '1080',
        '720p': '720',
        '480p': '480',
        '360p': '360',
        '1080': '1080',
        '720': '720',
        '480': '480',
        '360': '360'
      };

      const selectedQuality = qualityMap[quality] || '720';
      const ytdlpPath = getYtdlpPath();

      if (onProgress) {
        onProgress({
          status: 'Starting download...',
          percent: 0,
          speed: 0,
          eta: null
        });
      }

      // Format: prefer single file with both streams
      const format = `best[height<=${selectedQuality}]`;
      const args = [
        '-f', format,
        '-o', outputPath,
        '--progress-template', '[download] %(progress._percent_str)s at %(progress._speed_str)s ETA %(progress._eta_str)s',
        '--no-warnings',
        url
      ];

      const child = spawn(ytdlpPath, args, {
        env: { ...process.env, PATH: `/usr/local/bin:/opt/homebrew/bin:${process.env.PATH}` }
      });
      let lastProgress = 0;
      let hasCalledResolve = false;

      const handleOutput = (data) => {
        const output = data.toString();
        
        if (!output.includes('[download]')) {
          return;
        }

        const progressMatch = output.match(/\[download\]\s+([\d.]+)%/);
        const speedMatch = output.match(/at\s+([\d.]+\s*[KMG]iB\/s)/);
        const etaMatch = output.match(/ETA\s+(\d{1,2}:\d{2}(?::\d{2})?)/);

        if (progressMatch) {
          const percent = parseFloat(progressMatch[1]);
          
          if (percent > 0 && percent < 100 && percent >= lastProgress) {
            const speed = speedMatch ? speedMatch[1].trim() : 'calculating...';
            const eta = etaMatch ? etaMatch[1] : 'calculating...';

            if (onProgress) {
              onProgress({
                status: 'Downloading video...',
                percent: percent,
                speed: speed,
                eta: eta
              });
            }
            lastProgress = percent;
          }
        }
      };

      child.stdout.on('data', handleOutput);
      child.stderr.on('data', handleOutput);

      child.on('close', (code) => {
        if (hasCalledResolve) return;
        
        if (code !== 0) {
          hasCalledResolve = true;
          reject(new Error(`Download failed with exit code ${code}`));
          return;
        }

        // Wait for file to be written
        setTimeout(() => {
          if (hasCalledResolve) return;
          
          if (fs.existsSync(outputPath)) {
            hasCalledResolve = true;
            if (onProgress) {
              onProgress({
                status: 'Download complete!',
                percent: 100,
                speed: '0 B/s',
                eta: '0s'
              });
            }
            resolve({
              path: outputPath,
              message: 'Video downloaded successfully'
            });
          } else {
            hasCalledResolve = true;
            reject(new Error(`File not created at ${outputPath}`));
          }
        }, 2000); // Wait 2 seconds for file
      });

      child.on('error', (error) => {
        if (!hasCalledResolve) {
          hasCalledResolve = true;
          reject(new Error(`Failed to start download: ${error.message}`));
        }
      });

    } catch (error) {
      reject(new Error(`Video download setup failed: ${error.message}`));
    }
  });
}

/**
 * Download audio and convert to MP3/M4A - SIMPLIFIED
 */
async function downloadAudio(url, format, outputPath, onProgress) {
  return new Promise((resolve, reject) => {
    try {
      const dir = path.dirname(outputPath);
      const ytdlpPath = getYtdlpPath();

      if (onProgress) {
        onProgress({
          status: 'Downloading audio...',
          percent: 0,
          speed: 0,
          eta: null
        });
      }

      // Use a simple temp output path that won't conflict
      const tempAudioPath = path.join(dir, 'yt_audio_temp.m4b');

      const args = [
        '-f', 'bestaudio',
        '-o', tempAudioPath,
        '--progress-template', '[download] %(progress._percent_str)s at %(progress._speed_str)s ETA %(progress._eta_str)s',
        '--no-warnings',
        url
      ];

      const child = spawn(ytdlpPath, args, {
        env: { ...process.env, PATH: `/usr/local/bin:/opt/homebrew/bin:${process.env.PATH}` }
      });
      let lastProgress = 0;
      let hasResolved = false;

      const handleOutput = (data) => {
        const output = data.toString();
        
        if (!output.includes('[download]')) {
          return;
        }

        const progressMatch = output.match(/\[download\]\s+([\d.]+)%/);
        const speedMatch = output.match(/at\s+([\d.]+\s*[KMG]iB\/s)/);
        const etaMatch = output.match(/ETA\s+(\d{1,2}:\d{2}(?::\d{2})?)/);

        if (progressMatch) {
          const percent = parseFloat(progressMatch[1]);
          
          if (percent > 0 && percent < 100 && percent >= lastProgress) {
            const speed = speedMatch ? speedMatch[1] : 'calculating...';
            const eta = etaMatch ? etaMatch[1] : 'calculating...';

            if (onProgress) {
              onProgress({
                status: 'Downloading audio...',
                percent: Math.min(80, percent * 0.8),
                speed: speed,
                eta: eta
              });
            }
            lastProgress = percent;
          }
        }
      };

      child.stdout.on('data', handleOutput);
      child.stderr.on('data', handleOutput);

      child.on('close', (code) => {
        if (hasResolved) return;
        
        if (code !== 0) {
          hasResolved = true;
          reject(new Error(`Audio download failed with exit code ${code}`));
          return;
        }

        // Audio download is done, now convert (if needed)
        setTimeout(() => {
          if (hasResolved) return;

          if (!fs.existsSync(tempAudioPath)) {
            hasResolved = true;
            reject(new Error('Audio file was not created'));
            return;
          }

          if (format === 'mp3') {
            // Convert to MP3
            if (onProgress) {
              onProgress({
                status: 'Converting to MP3...',
                percent: 85,
                speed: 0,
                eta: null
              });
            }

            ffmpeg(tempAudioPath)
              .audioCodec('libmp3lame')
              .audioBitrate('192k')
              .toFormat('mp3')
              .on('progress', (progress) => {
                const convPercent = 85 + ((progress.percent || 0) * 0.14);
                if (onProgress && !hasResolved) {
                  onProgress({
                    status: 'Converting to MP3...',
                    percent: Math.min(99, convPercent),
                    speed: 0,
                    eta: null
                  });
                }
              })
              .on('end', () => {
                if (hasResolved) return;
                hasResolved = true;
                
                try {
                  fs.unlinkSync(tempAudioPath);
                } catch (e) {}

                if (onProgress) {
                  onProgress({
                    status: 'Download complete!',
                    percent: 100,
                    speed: 0,
                    eta: 0
                  });
                }
                resolve({
                  path: outputPath,
                  message: 'Audio converted to MP3 successfully'
                });
              })
              .on('error', (err) => {
                if (hasResolved) return;
                hasResolved = true;
                
                try {
                  fs.unlinkSync(tempAudioPath);
                  fs.unlinkSync(outputPath);
                } catch (e) {}
                
                reject(new Error(`MP3 conversion failed: ${err.message}`));
              })
              .save(outputPath);

          } else if (format === 'm4a') {
            // Rename for M4A
            if (onProgress) {
              onProgress({
                status: 'Finalizing...',
                percent: 95,
                speed: 0,
                eta: null
              });
            }

            fs.rename(tempAudioPath, outputPath, (err) => {
              if (hasResolved) return;
              hasResolved = true;
              
              if (err) {
                try {
                  fs.unlinkSync(tempAudioPath);
                } catch (e) {}
                reject(new Error(`Failed to save M4A: ${err.message}`));
                return;
              }

              if (onProgress) {
                onProgress({
                  status: 'Download complete!',
                  percent: 100,
                  speed: 0,
                  eta: 0
                });
              }
              resolve({
                path: outputPath,
                message: 'Audio saved as M4A successfully'
              });
            });
          }
        }, 1500); // Wait 1.5 seconds for file
      });

      child.on('error', (error) => {
        if (!hasResolved) {
          hasResolved = true;
          reject(new Error(`Failed to start download: ${error.message}`));
        }
      });

    } catch (error) {
      reject(new Error(`Audio download setup failed: ${error.message}`));
    }
  });
}

module.exports = {
  downloadVideo,
  getVideoInfo,
  validateURL,
};
