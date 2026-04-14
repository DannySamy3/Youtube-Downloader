const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { downloadVideo, getVideoInfo } = require("./services/downloader");

let mainWindow;

// Check if running in development mode
const isDev =
  process.env.NODE_ENV === "development" || process.argv.includes("--dev");

// Create application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      sandbox: true,
    },
    icon: path.join(__dirname, "assets", "icon.png"),
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// App event listeners
app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle(
  "download-video",
  async (event, { url, format, quality, outputPath }) => {
    try {
      return await downloadVideo({
        url,
        format,
        quality,
        outputPath,
        onProgress: (progress) => {
          // Send progress updates to renderer
          mainWindow.webContents.send("download-progress", progress);
        },
      });
    } catch (error) {
      throw new Error(error.message);
    }
  },
);

ipcMain.handle("show-save-dialog", async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: app.getPath("downloads"),
    filters: [{ name: "All Files", extensions: ["*"] }],
  });
  return result;
});

ipcMain.handle("validate-url", async (event, url) => {
  // Basic URL validation
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
});

ipcMain.handle("get-video-info", async (event, url) => {
  try {
    const info = await getVideoInfo(url);
    return info;
  } catch (error) {
    throw new Error(error.message);
  }
});

module.exports = { mainWindow };
