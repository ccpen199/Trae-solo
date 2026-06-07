import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()

interface AuthRequest extends Request {
  user?: any
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || parseInt(req.query.page_size as string) || 10
    const property_type = req.query.property_type as string || req.query.propertyType as string
    const listing_type = req.query.listing_type as string || req.query.listingType as string
    const city = req.query.city as string
    const district = req.query.district as string
    const min_price = req.query.min_price as string || req.query.minPrice as string
    const max_price = req.query.max_price as string || req.query.maxPrice as string
    const layout = req.query.layout as string

    let whereClauses = ['status = ?']
    let params: any[] = ['active']

    if (property_type) {
      whereClauses.push('property_type = ?')
      params.push(property_type)
    }
    if (listing_type) {
      whereClauses.push('listing_type = ?')
      params.push(listing_type)
    }
    if (city) {
      whereClauses.push('city = ?')
      params.push(city)
    }
    if (district) {
      whereClauses.push('district = ?')
      params.push(district)
    }
    if (min_price) {
      whereClauses.push('price >= ?')
      params.push(parseFloat(min_price))
    }
    if (max_price) {
      whereClauses.push('price <= ?')
      params.push(parseFloat(max_price))
    }
    if (layout) {
      whereClauses.push('layout LIKE ?')
      params.push(`%${layout}%`)
    }

    const whereSql = 'WHERE ' + whereClauses.join(' AND ')

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM properties ${whereSql}`)
    const total = (countStmt.get(...params) as any).count

    const offset = (page - 1) * pageSize
    const propsStmt = db.prepare(`
      SELECT p.*, u.nickname as publisher_name, u.avatar as publisher_avatar
      FROM properties p
      LEFT JOIN users u ON p.publisher_id = u.id
      ${whereSql}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `)
    const properties = propsStmt.all(...params, pageSize, offset) as any[]

    const propertiesWithImages = properties.map(prop => ({
      ...prop,
      images: prop.images ? JSON.parse(prop.images) : []
    }))

    res.status(200).json({
      success: true,
      data: {
        list: propertiesWithImages,
        total,
        page,
        pageSize
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取房源列表失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const stmt = db.prepare(`
      SELECT p.*, u.nickname as publisher_name, u.avatar as publisher_avatar, u.certification_type, u.certification_status
      FROM properties p
      LEFT JOIN users u ON p.publisher_id = u.id
      WHERE p.id = ?
    `)
    const property = stmt.get(id) as any

    if (!property) {
      res.status(404).json({ success: false, error: '房源不存在' })
      return
    }

    property.images = property.images ? JSON.parse(property.images) : []
    property.vr_data = property.vr_data ? JSON.parse(property.vr_data) : null

    res.status(200).json({
      success: true,
      data: {
        detail: property
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取房源详情失败' })
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      property_type,
      listing_type,
      price,
      area,
      layout,
      floor_info,
      orientation,
      decoration_status,
      address,
      city,
      district,
      community,
      images,
      vr_data,
      description
    } = req.body

    if (!title || !property_type || !listing_type || !price) {
      res.status(400).json({ success: false, error: '必填字段不能为空' })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO properties (
        publisher_id, title, property_type, listing_type, price, area, layout,
        floor_info, orientation, decoration_status, address, city, district,
        community, images, vr_data, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      req.user.id,
      title,
      property_type,
      listing_type,
      price,
      area,
      layout,
      floor_info,
      orientation,
      decoration_status,
      address,
      city,
      district,
      community,
      JSON.stringify(images || []),
      JSON.stringify(vr_data || null),
      description
    )

    const newProperty = db.prepare(`
      SELECT p.*, u.nickname as publisher_name, u.avatar as publisher_avatar
      FROM properties p
      LEFT JOIN users u ON p.publisher_id = u.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid) as any

    newProperty.images = newProperty.images ? JSON.parse(newProperty.images) : []

    res.status(201).json({
      success: true,
      data: {
        property: newProperty
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '发布房源失败' })
  }
})

router.get('/:id/vr', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const stmt = db.prepare('SELECT vr_data FROM properties WHERE id = ?')
    const property = stmt.get(id) as any

    if (!property) {
      res.status(404).json({ success: false, error: '房源不存在' })
      return
    }

    const vrData = property.vr_data ? JSON.parse(property.vr_data) : {
      scenes: [
        {
          id: 'living_room',
          name: '客厅',
          panorama: 'https://example.com/vr/living_room.jpg',
          hotspots: [
            { id: 'h1', type: 'info', text: '客厅全景', yaw: 0, pitch: 0 },
            { id: 'h2', type: 'nav', text: '前往卧室', targetScene: 'bedroom', yaw: 90, pitch: 0 }
          ]
        },
        {
          id: 'bedroom',
          name: '卧室',
          panorama: 'https://example.com/vr/bedroom.jpg',
          hotspots: [
            { id: 'h3', type: 'nav', text: '返回客厅', targetScene: 'living_room', yaw: -90, pitch: 0 }
          ]
        }
      ],
      defaultScene: 'living_room'
    }

    res.status(200).json({
      success: true,
      data: {
        vrData
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取VR数据失败' })
  }
})

export default router
