import fs from 'node:fs'
import { spawn } from 'node:child_process'

const host = process.env.VITE_HOST || '127.0.0.1'
const port = process.env.VITE_PORT || '49132'
const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://127.0.0.1:59132'

const logFile = fs.openSync('frontend.log', 'w')
const child = spawn(
  './node_modules/.bin/vite',
  ['--host', host, '--port', port, '--strictPort'],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HOST: process.env.HOST || '127.0.0.1',
      VITE_HOST: host,
      VITE_PORT: port,
      VITE_API_BASE_URL: apiBaseUrl,
    },
    stdio: ['pipe', logFile, logFile],
  },
)

fs.writeFileSync('frontend.pid', `${process.pid}\n`)
fs.writeFileSync('frontend.child.pid', `${child.pid}\n`)

const stop = () => {
  if (!child.killed) {
    child.kill('SIGTERM')
  }
  setTimeout(() => process.exit(0), 700).unref()
}

process.on('SIGTERM', stop)
process.on('SIGINT', stop)
process.on('SIGHUP', () => {})

child.on('error', (error) => {
  fs.appendFileSync(
    'frontend.wrapper.log',
    `[frontend-supervisor] failed to start vite: ${error.message}\n`,
  )
  process.exit(1)
})

child.on('exit', (code, signal) => {
  fs.appendFileSync(
    'frontend.wrapper.log',
    `[frontend-supervisor] vite exited code=${code ?? ''} signal=${signal ?? ''}\n`,
  )
  process.exit(code ?? 0)
})

setInterval(() => {}, 60_000)
