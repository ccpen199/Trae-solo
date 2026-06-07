import 'express'

declare module 'express' {
  interface Request {
    user?: {
      id: number
      username: string
      role: string
      org_id: number
    }
  }
}
