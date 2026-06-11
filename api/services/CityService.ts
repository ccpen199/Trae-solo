import { db } from '../db/database';
import type { City } from '../../shared/types';

function mapDbCityToCity(dbCity: any): City {
  return {
    id: dbCity.id,
    name: dbCity.name,
    province: dbCity.province,
    country: dbCity.country,
    latitude: dbCity.latitude,
    longitude: dbCity.longitude,
    adcode: dbCity.adcode,
  };
}

export const CityService = {
  getCities(): City[] {
    const cities = db.prepare(`
      SELECT * FROM cities 
      ORDER BY province, name
    `).all() as any[];
    return cities.map(mapDbCityToCity);
  },

  getCityById(cityId: string): City | null {
    const city = db.prepare('SELECT * FROM cities WHERE id = ?').get(cityId) as any;
    if (!city) return null;
    return mapDbCityToCity(city);
  },

  searchCity(keyword: string): City[] {
    if (!keyword || keyword.trim() === '') {
      return [];
    }
    
    const searchTerm = `%${keyword.trim()}%`;
    
    const cities = db.prepare(`
      SELECT * FROM cities 
      WHERE name LIKE ? 
         OR province LIKE ? 
         OR adcode LIKE ?
         OR id LIKE ?
      ORDER BY 
        CASE 
          WHEN name = ? THEN 0 
          WHEN name LIKE ? THEN 1 
          ELSE 2 
        END,
        province, name
      LIMIT 20
    `).all(searchTerm, searchTerm, searchTerm, searchTerm, keyword.trim(), `${keyword.trim()}%`) as any[];
    
    return cities.map(mapDbCityToCity);
  },

  getCitiesByProvince(province: string): City[] {
    const cities = db.prepare(`
      SELECT * FROM cities 
      WHERE province = ?
      ORDER BY name
    `).all(province) as any[];
    return cities.map(mapDbCityToCity);
  },

  getProvinces(): string[] {
    const provinces = db.prepare(`
      SELECT DISTINCT province 
      FROM cities 
      ORDER BY province
    `).all() as any[];
    return provinces.map(p => p.province);
  },

  getUserCities(sessionId: string): City[] {
    if (!sessionId) return [];
    
    const cities = db.prepare(`
      SELECT c.*, uc.sort_order 
      FROM user_cities uc
      JOIN cities c ON uc.city_id = c.id
      WHERE uc.user_session = ?
      ORDER BY uc.sort_order, uc.created_at
    `).all(sessionId) as any[];
    
    return cities.map(mapDbCityToCity);
  },

  addUserCity(sessionId: string, cityId: string): City | null {
    if (!sessionId || !cityId) return null;
    
    const city = this.getCityById(cityId);
    if (!city) return null;
    
    const existing = db.prepare(`
      SELECT id FROM user_cities 
      WHERE user_session = ? AND city_id = ?
    `).get(sessionId, cityId) as any;
    
    if (existing) {
      return city;
    }
    
    const maxOrder = db.prepare(`
      SELECT COALESCE(MAX(sort_order), -1) as max_order 
      FROM user_cities 
      WHERE user_session = ?
    `).get(sessionId) as any;
    
    db.prepare(`
      INSERT INTO user_cities (user_session, city_id, sort_order, created_at)
      VALUES (?, ?, ?, DATETIME('now'))
    `).run(sessionId, cityId, maxOrder.max_order + 1);
    
    return city;
  },

  removeUserCity(sessionId: string, cityId: string): boolean {
    if (!sessionId || !cityId) return false;
    
    const result = db.prepare(`
      DELETE FROM user_cities 
      WHERE user_session = ? AND city_id = ?
    `).run(sessionId, cityId);
    
    return result.changes > 0;
  },

  reorderUserCities(sessionId: string, cityIds: string[]): boolean {
    if (!sessionId || cityIds.length === 0) return false;
    
    const tx = db.transaction(() => {
      for (let i = 0; i < cityIds.length; i++) {
        db.prepare(`
          UPDATE user_cities 
          SET sort_order = ?
          WHERE user_session = ? AND city_id = ?
        `).run(i, sessionId, cityIds[i]);
      }
    });
    
    try {
      tx();
      return true;
    } catch {
      return false;
    }
  },

  addCity(city: Omit<City, 'country'> & { country?: string }): City | null {
    const existing = db.prepare('SELECT id FROM cities WHERE id = ?').get(city.id) as any;
    
    if (existing) {
      return null;
    }
    
    db.prepare(`
      INSERT INTO cities (id, name, province, country, latitude, longitude, adcode, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, DATETIME('now'), DATETIME('now'))
    `).run(
      city.id,
      city.name,
      city.province,
      city.country || '中国',
      city.latitude,
      city.longitude,
      city.adcode
    );
    
    return this.getCityById(city.id);
  },

  updateCity(cityId: string, data: Partial<Omit<City, 'id'>>): City | null {
    const existing = this.getCityById(cityId);
    if (!existing) return null;
    
    const fields: string[] = [];
    const values: any[] = [];
    
    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.province !== undefined) {
      fields.push('province = ?');
      values.push(data.province);
    }
    if (data.country !== undefined) {
      fields.push('country = ?');
      values.push(data.country);
    }
    if (data.latitude !== undefined) {
      fields.push('latitude = ?');
      values.push(data.latitude);
    }
    if (data.longitude !== undefined) {
      fields.push('longitude = ?');
      values.push(data.longitude);
    }
    if (data.adcode !== undefined) {
      fields.push('adcode = ?');
      values.push(data.adcode);
    }
    
    if (fields.length === 0) {
      return existing;
    }
    
    fields.push('updated_at = DATETIME(\'now\')');
    values.push(cityId);
    
    db.prepare(`
      UPDATE cities 
      SET ${fields.join(', ')}
      WHERE id = ?
    `).run(...values);
    
    return this.getCityById(cityId);
  },

  deleteCity(cityId: string): boolean {
    const result = db.prepare('DELETE FROM cities WHERE id = ?').run(cityId);
    return result.changes > 0;
  },

  getCityCount(): number {
    const result = db.prepare('SELECT COUNT(*) as count FROM cities').get() as any;
    return result.count;
  },

  getHotCities(limit: number = 10): City[] {
    const cities = db.prepare(`
      SELECT c.*, COUNT(uc.id) as user_count
      FROM cities c
      LEFT JOIN user_cities uc ON c.id = uc.city_id
      GROUP BY c.id
      ORDER BY user_count DESC, c.name
      LIMIT ?
    `).all(limit) as any[];
    
    return cities.map(mapDbCityToCity);
  },
};
