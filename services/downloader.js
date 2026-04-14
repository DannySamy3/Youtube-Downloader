const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static");

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

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
 * Download video as MP4
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

      // Format: prefer single file with both streams, no merging needed
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

      const handleOutput = (data) => {
        const output = data.toString();
        
        // Only match progress lines that have "[download]" prefix to avoid false matches
        if (!output.includes('[download]')) {
          return;
        }

        // Parse: [download] 23.5% of ~234.56MiB at 1.23MiB/s ETA 00:45
        const progressMatch = output.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
        const speedMatch = output.match(/at\s+([\d.]+\s*[KMG]iB\/s)/);
        const etaMatch = output.match(/ETA\s+(\d{1,2}:\d{2}(?::\d{2})?)/);

        if (progressMatch) {
          const percent = parseFloat(progressMatch[1]);
          
          // Only update if progress is valid and moves forward (don't go past 99% during download)
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
        if (code !== 0) {
          reject(new Error(`Download failed with exit code ${code}`));
          return;
        }

        // Now that download is complete, report 100%
        if (onProgress) {
          onProgress({
            status: 'Download complete!',
            percent: 100,
            speed: '0 B/s',
            eta: 'Done'
          });
        }

        // Give file system a moment to settle
        setTimeout(() => {
          // Check if output file exists at exact path
          if (fs.existsSync(outputPath)) {
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
              message: 'Video downloaded successfully with audio'
            });
            return;
          }

          // If not found at exact path, search directory for video files
          const dir = path.dirname(outputPath);
          
          try {
            const files = fs.readdirSync(dir);
            // Find video files, skip .part files and format code files (like 00.f140)
            const videoFiles = files.filter(f => 
              (f.endsWith('.mp4') || f.endsWith('.mkv') || f.endsWith('.webm') || f.endsWith('.m4a')) && 
              !f.includes('temp_') && 
              !f.startsWith('.') &&
              !f.includes('.part') && // Skip incomplete downloads
              !f.match(/^\d+\.f\d+/) && // Skip format-code files like 00.f398
              f.includes(path.basename(outputPath).split('.')[0]) // Only files matching the output name
            ).sort();

            if (videoFiles.length > 0) {
              // Single file found - use it
              const foundPath = path.join(dir, videoFiles[0]);
              
              fs.rename(foundPath, outputPath, (err) => {
                if (err) {
                  reject(new Error(`Could not rename file: ${err.message}`));
                } else {
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
                }
              });
            } else {
              reject(new Error('Video file was not created after download'));
            }
          } catch (err) {
            reject(new Error(`Failed to find video file: ${err.message}`));
          }
        }, 500); // Wait 500ms for file system
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to start download: ${error.message}`));
      });

    } catch (error) {
      reject(new Error(`Video download setup failed: ${error.message}`));
    }
  });
}

/**
 * Download audio and convert to MP3/M4A
 */
async function downloadAudio(url, format, outputPath, onProgress) {
  return new Promise((resolve, reject) => {
    try {
      const tempDir = path.dirname(outputPath);
      const tempFile = path.join(tempDir, 'temp_audio.m4a');
      const outputTemplate = tempFile.replace(/\.m4a$/, '');
      const ytdlpPath = getYtdlpPath();

      if (onProgress) {
        onProgress({
          status: 'Starting audio download...',
          percent: 0,
          speed: 0,
          eta: null
        });
      }

      const args = [
        '-f', 'bestaudio',
        '-o', outputTemplate,
        '--progress-template', '[download] %(progress._percent_str)s at %(progress._speed_str)s ETA %(progress._eta_str)s',
        '--no-warnings',
        url
      ];

      const child = spawn(ytdlpPath, args, {
        env: { ...process.env, PATH: `/usr/local/bin:/opt/homebrew/bin:${process.env.PATH}` }
      });
      let lastProgress = 0;

      const handleOutput = (data) => {
        const output = data.toString();
        
        // Only match progress lines that have "[download]" prefix
        if (!output.includes('[download]')) {
          return;
        }

        const progressMatch = output.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
        const speedMatch = output.match(/at\s+([\d.]+\s*[KMG]iB\/s)/);
        const etaMatch = output.match(/ETA\s+(\d{1,2}:\d{2}(?::\d{2})?)/);

        if (progressMatch) {
          const percent = parseFloat(progressMatch[1]);
          
          // Only update if progress is valid and moves forward (0-90% for audio download)
          if (percent > 0 && percent < 100 && percent >= lastProgress) {
            const speed = speedMatch ? speedMatch[1].trim() : 'calculating...';
            const eta = etaMatch ? etaMatch[1] : 'calculating...';

            if (onProgress) {
              onProgress({
                status: 'Downloading audio...',
                percent: Math.min(90, percent * 0.9),
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
        if (code !== 0) {
          reject(new Error(`Audio download failed with exit code ${code}`));
          return;
        }

        // Report initial completion (90% - audio download done)
        if (onProgress) {
          onProgress({
            status: 'Audio download complete, formatting...',
            percent: 90,
            speed: 0,
            eta: null
          });
        }

        // Give file system a moment to settle
        setTimeout(() => {
          // Search for any audio file created in the directory
          const dir = path.dirname(tempFile);
          
          try {
            const files = fs.readdirSync(dir);
            // Find any audio files (not just recent ones)
            const audioFiles = files.filter(f => 
              (f.endsWith('.m4a') || f.endsWith('.webm') || f.endsWith('.mp3') || 
               f.endsWith('.aac') || f.endsWith('.opus')) && 
              !f.includes('temp_') && 
              !f.startsWith('.')
            );

            if (audioFiles.length === 0) {
              reject(new Error('Audio file was not created'));
              return;
            }

            // Use the first audio file (or largest if multiple)
            const selectedFile = audioFiles.length === 1
              ? audioFiles[0]
              : audioFiles.reduce((prev, current) => {
                  const prevSize = fs.statSync(path.join(dir, prev)).size;
                  const currSize = fs.statSync(path.join(dir, current)).size;
                  return currSize > prevSize ? current : prev;
                });

            const downloadedPath = path.join(dir, selectedFile);

            if (format === 'mp3') {
              if (onProgress) {
                onProgress({
                  status: 'Converting to MP3...',
                  percent: 50,
                  speed: 0,
                  eta: null
                });
              }

              ffmpeg(downloadedPath)
                .toFormat('mp3')
                .audioCodec('libmp3lame')
                .audioBitrate('192k')
                .on('progress', (progress) => {
                  if (onProgress) {
                    onProgress({
                      status: 'Converting to MP3...',
                      percent: 50 + ((progress.percent || 0) / 2),
                      speed: 0,
                      eta: null
                    });
                  }
                })
                .on('end', () => {
                  fs.unlink(downloadedPath, () => {});
                  if (onProgress) {
                    onProgress({
                      status: 'Conversion complete!',
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
                  fs.unlink(downloadedPath, () => {});
                  fs.unlink(outputPath, () => {});
                  reject(new Error(`Conversion error: ${err.message}`));
                })
                .save(outputPath);
            } else {
              fs.rename(downloadedPath, outputPath, (err) => {
                if (err) {
                  fs.unlink(downloadedPath, () => {});
                  reject(new Error(`File save error: ${err.message}`));
                } else {
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
                    message: 'Audio downloaded successfully'
                  });
                }
              });
            }
          } catch (err) {
            reject(new Error(`Failed to find audio file: ${err.message}`));
          }
        }, 500); // Wait 500ms for file system
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to start audio download: ${error.message}`));
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
