const fs = require('fs')
const path = require('path')
const { execFileSync, spawn } = require('child_process')

const rootDir = path.resolve(__dirname, '..')
const backendDir = path.join(rootDir, 'backend')
const logPath = path.join(rootDir, 'backend.log')
const pidPath = path.join(rootDir, 'backend.pid')
const preferredNode = '/Users/chen/.nvm/versions/node/v22.22.0/bin/node'
const nodeBin = fs.existsSync(preferredNode) ? preferredNode : process.execPath
const envPath = path.join(rootDir, '.env')
const envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
const backendPort = (envText.match(/^BACKEND_PORT=(\d+)/m) || [])[1] || '59028'

function listeningPid() {
  try {
    return execFileSync('lsof', ['-nP', `-iTCP:${backendPort}`, '-sTCP:LISTEN', '-t'], {
      encoding: 'utf8'
    }).trim().split(/\s+/)[0]
  } catch {
    return ''
  }
}

const logFd = fs.openSync(logPath, 'a')
fs.writeSync(logFd, `\n[start-backend-detached] ${new Date().toISOString()}\n`)

const currentPid = listeningPid()
if (currentPid) {
  fs.writeFileSync(pidPath, `${currentPid}\n`)
  fs.writeSync(logFd, `port ${backendPort} already listening on pid ${currentPid}\n`)
  console.log(`backend already listening pid ${currentPid}`)
  process.exit(0)
}

const child = spawn(nodeBin, ['src/server.js'], {
  cwd: backendDir,
  env: process.env,
  detached: true,
  stdio: ['ignore', logFd, logFd]
})

fs.writeFileSync(pidPath, `${child.pid}\n`)
child.unref()

console.log(`started backend pid ${child.pid}`)
