import 'reflect-metadata'
import { DataSource } from 'typeorm'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: path.join(__dirname, '../data/coupon_platform.sqlite'),
  synchronize: true,
  logging: false,
  entities: [path.join(__dirname, 'entities/*.{ts,js}')],
  migrations: [path.join(__dirname, 'migrations/*.{ts,js}')],
  subscribers: [path.join(__dirname, 'subscribers/*.{ts,js}')],
})

export const initializeDatabase = async (): Promise<DataSource> => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }
  return AppDataSource
}
