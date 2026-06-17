import { type Request, type Response, type NextFunction } from 'express'

const SONGJIANG_BOUNDARY: [number, number][] = [
  [121.05, 31.00],
  [121.25, 31.00],
  [121.30, 31.05],
  [121.35, 31.10],
  [121.30, 31.15],
  [121.25, 31.20],
  [121.15, 31.22],
  [121.05, 31.20],
  [121.00, 31.15],
  [120.98, 31.10],
  [121.00, 31.05],
]

function pointInPolygon(lng: number, lat: number, polygon: [number, number][]): boolean {
  let inside = false
  const n = polygon.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1]
    const xj = polygon[j][0], yj = polygon[j][1]
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  return inside
}

export function geofence(req: Request, res: Response, next: NextFunction): void {
  const lng = parseFloat(req.query.lng as string || req.body?.lng as string || '')
  const lat = parseFloat(req.query.lat as string || req.body?.lat as string || '')

  if (isNaN(lng) || isNaN(lat)) {
    next()
    return
  }

  const inside = pointInPolygon(lng, lat, SONGJIANG_BOUNDARY)

  if (!inside) {
    res.status(403).json({
      code: 403,
      message: '当前位置不在松江区服务范围内',
      data: { geofence: 'songjiang', inside: false, lng, lat },
    })
    return
  }

  next()
}

export { pointInPolygon, SONGJIANG_BOUNDARY }
