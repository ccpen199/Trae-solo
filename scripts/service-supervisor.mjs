import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const root = path.resolve(path.dirname(__filename), '..')
const nodeBin = process.execPath

const services = [
  {
    name: 'backend',
    command: nodeBin,
    args: ['node_modules/tsx/dist/cli.mjs', 'scripts/stable-backend.ts'],
    logFile: path.join(root, 'backend.log'),
  },
  {
    name: 'frontend',
    command: nodeBin,
    args: ['node_modules/vite/bin/vite.js', '--port', '48943', '--strictPort', '--host', '127.0.0.1'],
    logFile: path.join(root, 'frontend.log'),
  },
]

const env = {
  ...process.env,
  HOST: '127.0.0.1',
  PORT: '58943',
  BACKEND_PORT: '58943',
  VITE_API_BASE_URL: 'http://127.0.0.1:58943',
  PATH: `${path.dirname(nodeBin)}:${process.env.PATH || ''}`,
}

const children = new Map()
let stopping = false

function write(logFile, message) {
  fs.appendFileSync(logFile, message)
}

function start(service) {
  const log = fs.createWriteStream(service.logFile, { flags: 'a' })
  write(service.logFile, `\n[supervisor] starting ${service.name}: ${service.command} ${service.args.join(' ')}\n`)

  const child = spawn(service.command, service.args, {
    cwd: root,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  children.set(service.name, child)
  child.stdout.pipe(log, { end: false })
  child.stderr.pipe(log, { end: false })

  child.on('exit', (code, signal) => {
    children.delete(service.name)
    write(service.logFile, `[supervisor] ${service.name} exited code=${code ?? ''} signal=${signal ?? ''}\n`)
    log.end()
    if (!stopping) {
      setTimeout(() => start(service), 1000)
    }
  })
}

for (const service of services) {
  start(service)
}

function shutdown() {
  stopping = true
  for (const child of children.values()) {
    child.kill('SIGTERM')
  }
  setTimeout(() => process.exit(0), 1500).unref()
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
