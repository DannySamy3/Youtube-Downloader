// Global state
let videoData = null;
let selectedFormat = null;
let selectedQuality = null;
let unsubscribeProgress = null;

// DOM elements
const urlInput = document.getElementById("urlInput");
const loadBtn = document.getElementById("loadBtn");
const urlError = document.getElementById("urlError");

const previewSection = document.getElementById("previewSection");
const thumbnail = document.getElementById("thumbnail");
const videoTitle = document.getElementById("videoTitle");
const videoDuration = document.getElementById("videoDuration");
const videoDescription = document.getElementById("videoDescription");

const formatSection = document.getElementById("formatSection");
const formatBtns = document.querySelectorAll(".format-btn");
const selectedFormatText = document.getElementById("selectedFormatText");

const downloadSection = document.getElementById("downloadSection");
const downloadBtn = document.getElementById("downloadBtn");

const progressSection = document.getElementById("progressSection");
const downloadStatus = document.getElementById("downloadStatus");
const downloadPercent = document.getElementById("downloadPercent");
const progressFill = document.getElementById("progressFill");
const downloadSpeed = document.getElementById("downloadSpeed");
const downloadETA = document.getElementById("downloadETA");

const messageSection = document.getElementById("messageSection");
const messageBox = document.getElementById("messageBox");

// Format button click handlers
formatBtns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    // Remove active class from all buttons
    formatBtns.forEach((b) => b.classList.remove("active"));

    // Add active class to clicked button
    btn.classList.add("active");

    // Store selection
    selectedFormat = btn.dataset.format;
    selectedQuality = btn.dataset.quality;

    // Update selected format text
    const formatLabel = selectedFormat.toUpperCase();
    const qualityLabel =
      selectedQuality === "audio" ? "Audio" : selectedQuality + "p";
    selectedFormatText.textContent = `${formatLabel} - ${qualityLabel}`;

    // Show download button when format is selected
    downloadSection.style.display = "block";
  });
});

// Load video button click handler
loadBtn.addEventListener("click", async () => {
  const url = urlInput.value.trim();

  // Clear previous errors
  urlError.textContent = "";
  clearMessage();

  if (!url) {
    urlError.textContent = "Please enter a YouTube URL";
    return;
  }

  try {
    loadBtn.disabled = true;
    loadBtn.textContent = "Loading...";

    // Validate URL
    const validation = await window.electronAPI.validateUrl(url);

    if (!validation.valid) {
      throw new Error(validation.error || "Invalid URL");
    }

    showMessage("Fetching video information...", "info");

    // Fetch actual video data
    const info = await window.electronAPI.getVideoInfo(url);

    videoData = {
      url,
      title: info.title,
      duration: info.duration,
      thumbnail: info.thumbnail,
      author: info.author,
      description: info.description,
    };

    displayVideoPreview();

    showMessage("Video loaded successfully!", "success");
  } catch (error) {
    urlError.textContent = error.message || "Failed to load video";
    showMessage("Error: " + error.message, "error");
  } finally {
    loadBtn.disabled = false;
    loadBtn.textContent = "Load Video";
  }
});

// Display video preview
function displayVideoPreview() {
  thumbnail.src = videoData.thumbnail;
  videoTitle.textContent = videoData.title;

  // Format duration (convert seconds to MM:SS if it's a number)
  let durationText = videoData.duration;
  if (typeof videoData.duration === "string" && !isNaN(videoData.duration)) {
    const seconds = parseInt(videoData.duration);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    durationText = `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  videoDuration.textContent = "⏱️ Duration: " + durationText;
  videoDescription.textContent =
    videoData.description || "No description available";

  previewSection.style.display = "block";
  formatSection.style.display = "block";
  downloadSection.style.display = "block";
}

// Download button click handler
downloadBtn.addEventListener("click", async () => {
  if (!videoData) {
    showMessage("Please load a video first", "warning");
    return;
  }

  if (!selectedFormat || !selectedQuality) {
    showMessage("Please select a format and quality", "warning");
    return;
  }

  try {
    downloadBtn.disabled = true;

    // Show save dialog
    const result = await window.electronAPI.showSaveDialog();

    if (result.canceled) {
      downloadBtn.disabled = false;
      return;
    }

    let outputPath = result.filePath;

    // Add file extension
    if (selectedFormat === "mp4") {
      if (!outputPath.toLowerCase().endsWith(".mp4")) {
        outputPath += ".mp4";
      }
    } else if (selectedFormat === "mp3") {
      if (!outputPath.toLowerCase().endsWith(".mp3")) {
        outputPath += ".mp3";
      }
    } else if (selectedFormat === "m4a") {
      if (!outputPath.toLowerCase().endsWith(".m4a")) {
        outputPath += ".m4a";
      }
    }

    // Show progress section
    progressSection.style.display = "block";
    messageSection.style.display = "none";

    // Setup progress listener
    if (unsubscribeProgress) {
      unsubscribeProgress();
    }

    unsubscribeProgress = window.electronAPI.onDownloadProgress((progress) => {
      updateProgress(progress);
    });

    // Trigger download
    const result_dl = await window.electronAPI.downloadVideo({
      url: videoData.url,
      format: selectedFormat,
      quality: selectedQuality,
      outputPath,
    });

    // Download complete
    progressSection.style.display = "none";
    showMessage(`✅ Download complete! Saved to: ${result_dl.path}`, "success");

    // Clean up progress listener
    if (unsubscribeProgress) {
      unsubscribeProgress();
      unsubscribeProgress = null;
    }
  } catch (error) {
    progressSection.style.display = "none";
    const errorMsg = error.message || "Unknown error";

    // Show helpful messages based on error type
    if (errorMsg.includes("playable formats")) {
      showMessage(
        "⚠️ No video formats available. This video may be region-restricted, age-restricted, or unavailable. Try downloading as audio (MP3/M4A) instead.",
        "warning",
      );
    } else if (errorMsg.includes("audio")) {
      showMessage(
        "⚠️ Audio download failed: " +
          errorMsg +
          " Try downloading as video instead.",
        "warning",
      );
    } else {
      showMessage("❌ Download failed: " + errorMsg, "error");
    }
  } finally {
    downloadBtn.disabled = false;
  }
});

// Update progress bar
function updateProgress(progress) {
  const { percent, speed, eta, status } = progress;

  downloadPercent.textContent = Math.round(percent) + "%";
  progressFill.style.width = percent + "%";

  // Speed and ETA are now pre-formatted strings from yt-dlp
  downloadSpeed.textContent = speed && speed !== 'calculating...'
    ? `Speed: ${speed}`
    : "Speed: calculating...";

  downloadETA.textContent = eta && eta !== 'calculating...'
    ? `Time remaining: ${eta}`
    : "Time remaining: calculating...";

  downloadStatus.textContent = status || "Downloading...";
}

// Show message
function showMessage(text, type = "info") {
  messageBox.textContent = text;
  messageBox.className = "message-box " + type;
  messageSection.style.display = "block";
}

// Clear message
function clearMessage() {
  messageBox.textContent = "";
  messageBox.className = "message-box";
  messageSection.style.display = "none";
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  console.log("YouTube Downloader loaded");

  // Test if Electron API is available
  if (!window.electronAPI) {
    showMessage(
      "Error: Electron API not available. Running in browser mode?",
      "error",
    );
  }
});
