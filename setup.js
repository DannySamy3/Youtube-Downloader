#!/usr/bin/env node

/**
 * YouTube Downloader - Quick Start Script
 * This script guides users through the first-time setup
 */

const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
const { version } = require("./package.json");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✖${colors.reset} ${msg}`),
  title: (msg) =>
    console.log(`\n${colors.green}═══ ${msg} ═══${colors.reset}\n`),
};

const checkNodeVersion = () => {
  const version = process.version.slice(1).split(".")[0];
  if (parseInt(version) < 16) {
    log.error(`Node.js v16+ required. Current: ${process.version}`);
    process.exit(1);
  }
  log.success(`Node.js ${process.version} detected`);
};

const checkDependencyFile = () => {
  if (!fs.existsSync("package.json")) {
    log.error("package.json not found. Run this script from project root.");
    process.exit(1);
  }
  log.success("package.json found");
};

const installDependencies = () => {
  return new Promise((resolve) => {
    log.info("Installing dependencies (this may take a minute)...");

    exec("npm install", (error, stdout, stderr) => {
      if (error) {
        log.error(`Installation failed: ${error.message}`);
        process.exit(1);
      }
      log.success("Dependencies installed");
      resolve();
    });
  });
};

const displayNextSteps = () => {
  log.title("Setup Complete!");

  console.log(`${colors.green}YouTube Downloader v${version}${colors.reset}\n`);

  console.log("📌 Next steps:\n");
  console.log(`  ${colors.blue}Run the app:${colors.reset}`);
  console.log("    npm start\n");

  console.log(`  ${colors.blue}Build installers:${colors.reset}`);
  console.log("    npm run build\n");

  console.log(`  ${colors.blue}Build for specific platform:${colors.reset}`);
  console.log("    npm run dist:mac");
  console.log("    npm run dist:win\n");

  console.log(`  ${colors.blue}Documentation:${colors.reset}`);
  console.log("    cat README.md\n");
};

const main = async () => {
  log.title("YouTube Downloader - Setup");

  console.log("This script will install all dependencies for you.\n");

  checkNodeVersion();
  checkDependencyFile();

  await installDependencies();

  displayNextSteps();
};

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
