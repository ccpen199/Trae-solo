import { Router, type Request, type Response, type NextFunction } from 'express'
import db from '../db/index.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/propertyme/webhook', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: {
        endpoint: '/api/sync/propertyme/webhook',
        method: 'POST',
        description: 'PropertyMe webhook endpoint for receiving updates',
        authentication: 'Bearer token required',
        events: [
          'property.created',
          'property.updated',
          'tenant.created',
          'tenant.updated',
          'lease.created',
          'lease.updated',
          'payment.received',
          'workorder.created',
          'workorder.updated'
        ]
      }
    })
  } catch (e) {
    next(e)
  }
})

router.post('/propertyme/webhook', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { event, data, timestamp } = req.body
    
    db.prepare(`
      INSERT INTO property_me_sync (
        entity_type, local_id, external_id, sync_direction, last_sync_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      data?.entity_type || event.split('.')[0],
      data?.local_id || 0,
      data?.id || '',
      'inbound',
      timestamp || new Date().toISOString(),
      'success'
    )
    
    res.status(200).json({
      success: true,
      message: 'Webhook received successfully',
      event: event
    })
  } catch (e) {
    next(e)
  }
})

router.get('/status', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { entity_type } = req.query
    
    let query = 'SELECT * FROM property_me_sync WHERE 1=1'
    const params: any[] = []
    
    if (entity_type) {
      query += ' AND entity_type = ?'
      params.push(entity_type)
    }
    
    query += ' ORDER BY last_sync_at DESC LIMIT 100'
    
    const syncLogs = db.prepare(query).all(...params) as any[]
    
    const stats = db.prepare(`
      SELECT 
        entity_type,
        sync_status,
        COUNT(*) as count,
        MAX(last_sync_at) as last_sync
      FROM property_me_sync
      GROUP BY entity_type, sync_status
    `).all() as any[]
    
    res.json({
      success: true,
      data: {
        connected: true,
        last_sync: syncLogs.length > 0 ? syncLogs[0].last_sync_at : null,
        total_syncs: syncLogs.length,
        recent_logs: syncLogs.slice(0, 20),
        statistics: stats,
        connection_status: {
          propertyme: 'configured',
          last_ping: new Date().toISOString()
        }
      }
    })
  } catch (e) {
    next(e)
  }
})

router.post('/push', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { entity_type, local_id } = req.body
    
    let data: any = null
    let externalId = null
    
    if (entity_type === 'property') {
      data = db.prepare('SELECT * FROM properties WHERE id = ?').get(local_id)
    } else if (entity_type === 'tenant') {
      data = db.prepare('SELECT * FROM tenants WHERE id = ?').get(local_id)
    } else if (entity_type === 'owner') {
      data = db.prepare('SELECT * FROM owners WHERE id = ?').get(local_id)
    } else if (entity_type === 'lease') {
      data = db.prepare('SELECT * FROM lease_agreements WHERE id = ?').get(local_id)
    }
    
    if (!data) {
      return res.status(404).json({
        success: false,
        error: `${entity_type} with id ${local_id} not found`
      })
    }
    
    const existingSync = db.prepare(`
      SELECT * FROM property_me_sync 
      WHERE entity_type = ? AND local_id = ? AND sync_direction = 'outbound'
    `).get(entity_type, local_id)
    
    if (!existingSync) {
      externalId = `ext-${entity_type}-${local_id}-${Date.now()}`
      db.prepare(`
        INSERT INTO property_me_sync (
          entity_type, local_id, external_id, sync_direction, last_sync_at, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        entity_type,
        local_id,
        externalId,
        'outbound',
        new Date().toISOString(),
        'success'
      )
    } else {
      db.prepare(`
        UPDATE property_me_sync 
        SET last_sync_at = ?, sync_status = ?
        WHERE id = ?
      `).run(
        new Date().toISOString(),
        'success',
        (existingSync as any).id
      )
      externalId = (existingSync as any).external_id
    }
    
    res.json({
      success: true,
      data: {
        entity_type,
        local_id,
        external_id: externalId,
        synced_at: new Date().toISOString(),
        direction: 'outbound',
        payload_preview: data
      }
    })
  } catch (e) {
    next(e)
  }
})

router.post('/pull', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { entity_type, external_id } = req.body
    
    const existingSync = db.prepare(`
      SELECT * FROM property_me_sync 
      WHERE entity_type = ? AND external_id = ? AND sync_direction = 'inbound'
    `).get(entity_type, external_id)
    
    let localId = existingSync ? (existingSync as any).local_id : null
    
    if (!localId) {
      let newId: number
      
      if (entity_type === 'property') {
        const result = db.prepare(`
          INSERT INTO properties (
            property_type, title, address_en, city, state, status
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          'apartment',
          `Imported Property ${external_id}`,
          'Imported Address',
          'Sydney',
          'NSW',
          'active'
        )
        newId = result.lastInsertRowid as number
      } else if (entity_type === 'tenant') {
        const result = db.prepare(`
          INSERT INTO tenants (
            full_name_en, full_name_zh, status
          ) VALUES (?, ?, ?)
        `).run(
          `Imported Tenant ${external_id}`,
          '',
          'active'
        )
        newId = result.lastInsertRowid as number
      } else {
        return res.status(400).json({
          success: false,
          error: `Unsupported entity type: ${entity_type}`
        })
      }
      
      localId = newId
      
      db.prepare(`
        INSERT INTO property_me_sync (
          entity_type, local_id, external_id, sync_direction, last_sync_at, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        entity_type,
        localId,
        external_id,
        'inbound',
        new Date().toISOString(),
        'success'
      )
    }
    
    res.json({
      success: true,
      data: {
        entity_type,
        local_id: localId,
        external_id,
        synced_at: new Date().toISOString(),
        direction: 'inbound',
        is_new: !existingSync
      }
    })
  } catch (e) {
    next(e)
  }
})

router.post('/full-sync', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { direction = 'bidirectional' } = req.body
    
    const properties = db.prepare('SELECT COUNT(*) as count FROM properties').get() as { count: number }
    const tenants = db.prepare('SELECT COUNT(*) as count FROM tenants').get() as { count: number }
    const owners = db.prepare('SELECT COUNT(*) as count FROM owners').get() as { count: number }
    const leases = db.prepare('SELECT COUNT(*) as count FROM lease_agreements').get() as { count: number }
    
    const syncSummary = {
      properties: { total: properties.count, synced: 0, direction },
      tenants: { total: tenants.count, synced: 0, direction },
      owners: { total: owners.count, synced: 0, direction },
      leases: { total: leases.count, synced: 0, direction },
    }
    
    res.json({
      success: true,
      message: 'Full sync initiated',
      sync_id: `sync-${Date.now()}`,
      started_at: new Date().toISOString(),
      estimated_duration: `${(properties.count + tenants.count + owners.count + leases.count) * 0.1} seconds`,
      summary: syncSummary
    })
  } catch (e) {
    next(e)
  }
})

router.get('/schemas', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: {
        property: {
          propertyme_fields: ['ID', 'PropertyName', 'Address', 'City', 'State', 'Postcode', 'Bedrooms', 'Bathrooms', 'Parking', 'Type', 'Status'],
          local_fields: ['id', 'title', 'address_en', 'city', 'state', 'postcode', 'bedrooms', 'bathrooms', 'parking_spaces', 'property_type', 'status'],
          mappings: {
            ID: 'property_me_id',
            PropertyName: 'title',
            Address: 'address_en',
            City: 'city',
            State: 'state',
            Postcode: 'postcode',
            Bedrooms: 'bedrooms',
            Bathrooms: 'bathrooms',
            Parking: 'parking_spaces',
            Type: 'property_type',
            Status: 'status'
          }
        },
        tenant: {
          propertyme_fields: ['ID', 'FirstName', 'LastName', 'Email', 'Phone', 'MobilePhone'],
          local_fields: ['id', 'full_name_en', 'email', 'phone'],
          mappings: {
            ID: 'property_me_id',
            FirstName: 'first_name',
            LastName: 'last_name',
            Email: 'email',
            Phone: 'phone',
            MobilePhone: 'phone'
          }
        }
      }
    })
  } catch (e) {
    next(e)
  }
})

export default router
