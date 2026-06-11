import { Router, type Request, type Response } from 'express'
import { CityService } from '../services/CityService.js'
import type { ApiResponse, City } from '../../shared/types.js'

const router = Router()

function successResponse<T>(data: T, message = 'success'): ApiResponse<T> {
  return {
    code: 0,
    message,
    data,
    timestamp: new Date().toISOString(),
  }
}

function errorResponse(code: number, message: string): ApiResponse<null> {
  return {
    code,
    message,
    data: null,
    timestamp: new Date().toISOString(),
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!cookieHeader) return cookies
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=')
    if (name && value) {
      cookies[name] = decodeURIComponent(value)
    }
  })
  return cookies
}

function getSessionId(req: Request): string {
  const headerSid = req.headers['x-session-id'] as string | undefined;
  if (headerSid && headerSid.startsWith('sess_')) {
    return headerSid;
  }
  const cookies = parseCookies(req.headers.cookie);
  let sessionId = cookies.session_id;
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }
  return sessionId;
}

function setSessionCookie(res: Response, sessionId: string): void {
  const maxAge = 30 * 24 * 60 * 60 * 1000;
  res.setHeader('Set-Cookie', `session_id=${sessionId}; HttpOnly; SameSite=Lax; Max-Age=${maxAge / 1000}; Path=/`)
}

router.get('/', (_req: Request, res: Response): void => {
  try {
    const data = CityService.getCities()
    res.json(successResponse<City[]>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.get('/search', (req: Request, res: Response): void => {
  try {
    const { keyword } = req.query
    if (!keyword || typeof keyword !== 'string') {
      res.status(400).json(errorResponse(400, 'keyword is required'))
      return
    }
    const data = CityService.searchCity(keyword)
    res.json(successResponse<City[]>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.get('/favorites', (req: Request, res: Response): void => {
  try {
    const sessionId = getSessionId(req)
    setSessionCookie(res, sessionId)
    const data = CityService.getUserCities(sessionId)
    res.json(successResponse<City[]>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.post('/favorites/:cityId', (req: Request, res: Response): void => {
  try {
    const { cityId } = req.params
    const sessionId = getSessionId(req)
    setSessionCookie(res, sessionId)
    const result = CityService.addUserCity(sessionId, cityId)
    res.json(successResponse(result))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.delete('/favorites/:cityId', (req: Request, res: Response): void => {
  try {
    const { cityId } = req.params
    const sessionId = getSessionId(req)
    setSessionCookie(res, sessionId)
    const result = CityService.removeUserCity(sessionId, cityId)
    res.json(successResponse(result))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

export default router
