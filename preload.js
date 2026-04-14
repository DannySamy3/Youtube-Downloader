const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  downloadVideo: (options) => {
    // Validate inputs
    if (!options || typeof options !== "object") {
      throw new Error("Invalid options");
    }
    if (!options.url || typeof options.url !== "string") {
      throw new Error("URL is required");
    }
    if (!options.format || typeof options.format !== "string") {
      throw new Error("Format is required");
    }
    if (!options.quality || typeof options.quality !== "string") {
      throw new Error("Quality is required");
    }
    if (!options.outputPath || typeof options.outputPath !== "string") {
      throw new Error("Output path is required");
    }

    return ipcRenderer.invoke("download-video", options);
  },

  showSaveDialog: () => {
    return ipcRenderer.invoke("show-save-dialog");
  },

  validateUrl: (url) => {
    if (!url || typeof url !== "string") {
      throw new Error("URL must be a string");
    }
    return ipcRenderer.invoke("validate-url", url);
  },

  getVideoInfo: (url) => {
    if (!url || typeof url !== "string") {
      throw new Error("URL must be a string");
    }
    return ipcRenderer.invoke("get-video-info", url);
  },

  onDownloadProgress: (callback) => {
    const listener = (event, progress) => {
      if (typeof callback === "function") {
        callback(progress);
      }
    };
    ipcRenderer.on("download-progress", listener);

    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener("download-progress", listener);
    };
  },
});
