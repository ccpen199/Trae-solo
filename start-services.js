const fs = require("fs");
const path = require("path");
const { execFileSync, spawn, spawnSync } = require("child_process");

const projectRoot = __dirname;
const envPath = path.join(projectRoot, ".env");

function readEnv() {
  const values = {};
  if (!fs.existsSync(envPath)) {
    return values;
  }
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator !== -1) {
      values[trimmed.slice(0, separator)] = trimmed.slice(separator + 1);
    }
  }
  return values;
}

function writeEnv(values) {
  const current = readEnv();
  const merged = { ...current, ...values };
  const preferredOrder = [
    "PROJECT_NAME",
    "FRONTEND_PORT",
    "BACKEND_PORT",
    "VITE_API_BASE_URL",
    "API_BASE_URL",
    "DATABASE_URL",
    "NODE_ENV",
  ];
  const keys = [
    ...preferredOrder.filter((key) => Object.prototype.hasOwnProperty.call(merged, key)),
    ...Object.keys(merged).filter((key) => !preferredOrder.includes(key)),
  ];
  fs.writeFileSync(envPath, `${keys.map((key) => `${key}=${merged[key]}`).join("\n")}\n`);
}

function commandOutput(command, args) {
  try {
    return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function pidsOnPort(port) {
  const output = commandOutput("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"]);
  return output.split(/\s+/).filter(Boolean);
}

function cwdForPid(pid) {
  const output = commandOutput("lsof", ["-a", "-p", String(pid), "-d", "cwd", "-Fn"]);
  const line = output.split(/\r?\n/).find((value) => value.startsWith("n"));
  return line ? line.slice(1) : "";
}

function belongsToProject(pid) {
  const cwd = cwdForPid(pid);
  return cwd === projectRoot || cwd.startsWith(`${projectRoot}${path.sep}`);
}

function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function reclaimProjectPort(port) {
  const pids = pidsOnPort(port);
  if (!pids.length) {
    return true;
  }
  for (const pid of pids) {
    if (!belongsToProject(pid)) {
      console.log(`port ${port} is occupied by an external process, trying another slot`);
      return false;
    }
  }
  for (const pid of pids) {
    try {
      process.kill(Number(pid), "SIGTERM");
    } catch {
      // The process may already have exited.
    }
  }
  sleepMs(800);
  for (const pid of pids) {
    try {
      process.kill(Number(pid), 0);
      process.kill(Number(pid), "SIGKILL");
    } catch {
      // Already stopped.
    }
  }
  return true;
}

function selectPorts() {
  const env = readEnv();
  const currentFrontend = Number(env.FRONTEND_PORT || 43464);
  const currentBackend = Number(env.BACKEND_PORT || 53464);
  const tail4 = currentBackend % 10000;
  const currentSlot = Math.max(0, Math.floor((currentFrontend - 40000 - tail4) / 1000));

  for (let slot = currentSlot; slot < currentSlot + 6; slot += 1) {
    const frontendPort = 40000 + slot * 1000 + tail4;
    const backendPort = 50000 + slot * 1000 + tail4;
    if (reclaimProjectPort(frontendPort) && reclaimProjectPort(backendPort)) {
      writeEnv({
        FRONTEND_PORT: String(frontendPort),
        BACKEND_PORT: String(backendPort),
        VITE_API_BASE_URL: `http://127.0.0.1:${backendPort}/api`,
        API_BASE_URL: `http://127.0.0.1:${backendPort}/api`,
      });
      return { frontendPort, backendPort };
    }
  }
  throw new Error("No available same-project port slot found");
}

function ensureDependencies(name, cwd) {
  if (fs.existsSync(path.join(cwd, "node_modules"))) {
    if (name === "backend") {
      const probe = spawnSync(process.execPath, ["-e", "require('better-sqlite3')"], { cwd, stdio: "ignore" });
      if (probe.status !== 0) {
        console.log("backend native dependency ABI mismatch, running npm rebuild better-sqlite3");
        const rebuild = spawnSync("npm", ["rebuild", "better-sqlite3"], { cwd, stdio: "inherit" });
        if (rebuild.status !== 0) {
          throw new Error("backend npm rebuild better-sqlite3 failed");
        }
      }
    }
    return;
  }
  console.log(`${name} dependencies missing, running npm install`);
  const result = spawnSync("npm", ["install"], { cwd, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`${name} npm install failed`);
  }
}

function startService(name, cwd, command, args, logFile, pidFile, extraEnv) {
  const logPath = path.join(projectRoot, logFile);
  const output = fs.openSync(logPath, "w");
  const child = spawn(command, args, {
    cwd,
    detached: true,
    stdio: ["ignore", output, output],
    env: {
      ...process.env,
      ...readEnv(),
      ...extraEnv,
      FORCE_COLOR: "0",
    },
  });

  fs.writeFileSync(path.join(projectRoot, pidFile), `${child.pid}\n`);
  child.unref();
  console.log(`${name} pid ${child.pid}, log ${logFile}`);
}

const { frontendPort, backendPort } = selectPorts();
ensureDependencies("backend", path.join(projectRoot, "backend"));
ensureDependencies("frontend", path.join(projectRoot, "frontend"));

startService(
  "backend",
  path.join(projectRoot, "backend"),
  process.execPath,
  ["src/server.js"],
  "backend.log",
  "backend.pid",
  { BACKEND_PORT: String(backendPort), FRONTEND_PORT: String(frontendPort) }
);

startService(
  "frontend",
  path.join(projectRoot, "frontend"),
  process.execPath,
  ["server.js"],
  "frontend.log",
  "frontend.pid",
  { BACKEND_PORT: String(backendPort), FRONTEND_PORT: String(frontendPort) }
);

console.log(`frontend http://127.0.0.1:${frontendPort}/`);
console.log(`backend http://127.0.0.1:${backendPort}/api/health`);
