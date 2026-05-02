class YardRuleEngine {
  constructor(db) {
    this.db = db;
  }

  findAvailableYardLocation(container) {
    const { size_type, weight } = container;
    
    let sizeCondition = "1=1";
    let weightCondition = "1=1";

    if (size_type) {
      const size = parseInt(size_type.slice(0, 2));
      if (size === 40) {
        sizeCondition = "CAST(bay AS INTEGER) % 2 = 1";
      } else {
        sizeCondition = "1=1";
      }
    }

    if (weight && weight > 20) {
      weightCondition = "CAST(tier AS INTEGER) <= 2";
    }

    const query = `
      SELECT * FROM yard_locations 
      WHERE status = 'AVAILABLE' 
      AND ${sizeCondition}
      AND ${weightCondition}
      ORDER BY CAST(bay AS INTEGER), CAST(row AS INTEGER), CAST(tier AS INTEGER)
      LIMIT 1
    `;

    return this.db.prepare(query).get();
  }

  validateYardAllocation(container, yardLocation) {
    const errors = [];

    if (yardLocation.status !== 'AVAILABLE') {
      errors.push('堆场位置已被占用');
    }

    const { size_type } = container;
    if (size_type) {
      const size = parseInt(size_type.slice(0, 2));
      const bay = parseInt(yardLocation.bay);
      
      if (size === 40 && bay % 2 !== 1) {
        errors.push('40尺集装箱必须分配到奇数贝位');
      }
    }

    const { weight } = container;
    const tier = parseInt(yardLocation.tier);
    if (weight && weight > 20 && tier > 2) {
      errors.push('重量超过20吨的集装箱不能放在第3层及以上');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  lockYardLocation(locationId) {
    const update = this.db.prepare(`
      UPDATE yard_locations 
      SET status = 'LOCKED' 
      WHERE id = ? AND status = 'AVAILABLE'
    `);
    const result = update.run(locationId);
    return result.changes > 0;
  }

  unlockYardLocation(locationId) {
    const update = this.db.prepare(`
      UPDATE yard_locations 
      SET status = 'AVAILABLE' 
      WHERE id = ? AND status = 'LOCKED'
    `);
    const result = update.run(locationId);
    return result.changes > 0;
  }

  allocateContainer(containerId, locationId) {
    const transaction = this.db.transaction(() => {
      const yardLocation = this.db.prepare('SELECT * FROM yard_locations WHERE id = ?').get(locationId);
      
      if (!yardLocation || yardLocation.status !== 'AVAILABLE') {
        throw new Error('堆场位置不可用');
      }

      this.db.prepare(`
        UPDATE yard_locations 
        SET status = 'OCCUPIED', container_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(containerId, locationId);

      this.db.prepare(`
        UPDATE containers 
        SET status = 'IN_YARD', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(containerId);

      return true;
    });

    try {
      return transaction();
    } catch (error) {
      console.error('堆场分配失败:', error);
      return false;
    }
  }

  getYardOccupancyReport() {
    return this.db.prepare(`
      SELECT 
        yard_code,
        COUNT(*) as total_locations,
        SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'OCCUPIED' THEN 1 ELSE 0 END) as occupied,
        SUM(CASE WHEN status = 'LOCKED' THEN 1 ELSE 0 END) as locked
      FROM yard_locations
      GROUP BY yard_code
    `).all();
  }
}

module.exports = YardRuleEngine;
