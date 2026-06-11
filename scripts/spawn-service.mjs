import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const projectRoot = path.resolve(path.dirname(__filename), '..')

const services = {
  backend: {
    args: ['scripts/start-backend.sh'],
    log: 'backend.log',
    pid: '.backend.pid',
  },
  frontend: {
    args: ['scripts/start-frontend.sh'],
    log: 'frontend.log',
    pid: '.frontend.pid',
  },
}

const serviceName = process.argv[2]
const service = services[serviceName]

if (!service) {
  console.error('Usage: node scripts/spawn-service.mjs <backend|frontend>')
  process.exit(2)
}

const logPath = path.join(projectRoot, service.log)
const pidPath = path.join(projectRoot, service.pid)
const logFd = fs.openSync(logPath, 'a')

fs.writeSync(logFd, `\n===== spawn ${new Date().toISOString()} ${serviceName} =====\n`)

const child = spawn('/bin/bash', service.args, {
  cwd: projectRoot,
  detached: true,
  stdio: ['ignore', logFd, logFd],
  env: {
    ...process.env,
    HOST: process.env.HOST || '127.0.0.1',
  },
})

fs.writeFileSync(pidPath, `${child.pid}\n`)
child.unref()
fs.closeSync(logFd)

console.log(`${serviceName} spawned pid ${child.pid}`)
