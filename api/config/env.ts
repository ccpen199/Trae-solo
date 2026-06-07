import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

export interface EnvConfig {
  FRONTEND_PORT: number
  BACKEND_PORT: number
  JWT_SECRET: string
  DB_PATH: string
  UPLOAD_DIR: string
  VITE_API_BASE_URL: string
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key]
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue
    }
    throw new Error(`Environment variable ${key} is not set`)
  }
  return value
}

const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = getEnv(key, defaultValue?.toString())
  const num = parseInt(value, 10)
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} must be a number`)
  }
  return num
}

export const env: EnvConfig = {
  FRONTEND_PORT: getEnvNumber('FRONTEND_PORT', 49011),
  BACKEND_PORT: getEnvNumber('BACKEND_PORT', 59011),
  JWT_SECRET: getEnv('JWT_SECRET', 'traffic-admin-secret-key-2024'),
  DB_PATH: getEnv('DB_PATH', './data/app.sqlite'),
  UPLOAD_DIR: getEnv('UPLOAD_DIR', './uploads'),
  VITE_API_BASE_URL: getEnv('VITE_API_BASE_URL', 'http://127.0.0.1:59011/api'),
}

export default env
