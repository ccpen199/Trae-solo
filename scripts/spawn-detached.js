#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const [, , cwd, logFile, pidFile, command, ...args] = process.argv;

if (!cwd || !logFile || !pidFile || !command) {
  console.error("Usage: spawn-detached.js <cwd> <logFile> <pidFile> <command> [...args]");
  process.exit(1);
}

fs.mkdirSync(path.dirname(logFile), { recursive: true });
fs.mkdirSync(path.dirname(pidFile), { recursive: true });

const out = fs.openSync(logFile, "a");
const child = spawn(command, args, {
  cwd,
  detached: true,
  env: process.env,
  stdio: ["ignore", out, out],
});

fs.writeFileSync(pidFile, String(child.pid));
child.unref();
fs.closeSync(out);

console.log(child.pid);
