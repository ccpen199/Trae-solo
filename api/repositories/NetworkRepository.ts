import { db } from '../db/index.js'
import type { Network, Vehicle, Protocol } from '../types/index.js'

export class NetworkRepository {
  private db = db

  getNetworks(): Network[] {
    return this.db.prepare('SELECT * FROM networks').all() as Network[]
  }

  getVehicles(networkId?: number): Vehicle[] {
    if (networkId) {
      return this.db.prepare(`
        SELECT v.*, n.name as network_name
        FROM vehicles v
        LEFT JOIN networks n ON v.network_id = n.id
        WHERE v.network_id = ?
      `).all(networkId) as Vehicle[]
    }
    return this.db.prepare(`
      SELECT v.*, n.name as network_name
      FROM vehicles v
      LEFT JOIN networks n ON v.network_id = n.id
    `).all() as Vehicle[]
  }

  getWeatherForecast() {
    return [
      { city: '北京', weather: '小雨', temperature: '12-18℃', risk_level: 2, affected_routes: ['北京-上海', '北京-广州'] },
      { city: '上海', weather: '多云', temperature: '18-25℃', risk_level: 1, affected_routes: [] },
      { city: '广州', weather: '雷阵雨', temperature: '25-32℃', risk_level: 3, affected_routes: ['广州-深圳', '广州-杭州'] },
      { city: '深圳', weather: '晴', temperature: '26-33℃', risk_level: 0, affected_routes: [] },
      { city: '杭州', weather: '中雨', temperature: '15-22℃', risk_level: 2, affected_routes: ['杭州-上海', '杭州-武汉'] },
      { city: '成都', weather: '雾', temperature: '14-20℃', risk_level: 2, affected_routes: ['成都-重庆', '成都-西安'] },
      { city: '武汉', weather: '晴', temperature: '20-28℃', risk_level: 0, affected_routes: [] },
      { city: '西安', weather: '沙尘', temperature: '10-18℃', risk_level: 3, affected_routes: ['西安-北京', '西安-成都'] },
    ]
  }

  getNetworkStats() {
    const result = this.db.prepare(`
      SELECT
        COUNT(*) as total_networks,
        SUM(throughput) as total_throughput,
        SUM(capacity) as total_capacity,
        SUM(CASE WHEN status = 'overloaded' THEN 1 ELSE 0 END) as overloaded,
        SUM(CASE WHEN status = 'busy' THEN 1 ELSE 0 END) as busy
      FROM networks
    `).get() as any

    const vehicleResult = this.db.prepare(`
      SELECT
        COUNT(*) as total_vehicles,
        SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) as in_transit,
        SUM(CASE WHEN status = 'loading' THEN 1 ELSE 0 END) as loading,
        SUM(CASE WHEN status = 'unloading' THEN 1 ELSE 0 END) as unloading
      FROM vehicles
    `).get() as any

    return {
      total_networks: result.total_networks || 0,
      total_throughput: result.total_throughput || 0,
      total_capacity: result.total_capacity || 0,
      overloaded: result.overloaded || 0,
      busy: result.busy || 0,
      total_vehicles: vehicleResult.total_vehicles || 0,
      in_transit: vehicleResult.in_transit || 0,
      loading: vehicleResult.loading || 0,
      unloading: vehicleResult.unloading || 0,
    }
  }

  getProtocols(): Protocol[] {
    return this.db.prepare('SELECT * FROM protocols WHERE active = 1').all() as Protocol[]
  }

  createProtocol(protocol: Omit<Protocol, 'id'>): Protocol {
    const stmt = this.db.prepare(`
      INSERT INTO protocols (name, category, requirements, temperature_range, container_spec, active)
      VALUES (@name, @category, @requirements, @temperature_range, @container_spec, @active)
    `)
    const result = stmt.run(protocol as any)
    return this.db.prepare('SELECT * FROM protocols WHERE id = ?').get(result.lastInsertRowid) as Protocol
  }

  updateProtocol(id: number, updates: Partial<Protocol>): Protocol | undefined {
    const fields = Object.keys(updates)
      .filter(k => k !== 'id')
      .map(k => `${k} = @${k}`)
      .join(', ')

    if (fields.length === 0) {
      return this.db.prepare('SELECT * FROM protocols WHERE id = ?').get(id) as Protocol | undefined
    }

    this.db.prepare(`UPDATE protocols SET ${fields} WHERE id = @id`).run({ ...updates, id })
    return this.db.prepare('SELECT * FROM protocols WHERE id = ?').get(id) as Protocol | undefined
  }
}
