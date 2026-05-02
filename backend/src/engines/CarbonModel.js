const db = require('../database');
const { v4: uuidv4 } = require('uuid');

class CarbonModelEngine {
  constructor() {
    this.carbonFactors = {
      paper: 2.5,
      plastic: 6.0,
      metal: 8.0,
      glass: 0.8,
      electronics: 15.0,
      clothes: 3.0,
      battery: 12.0,
      organic: 0.3
    };
  }

  calculateCarbonReduction(category, weight) {
    const co2PerKg = this.carbonFactors[category] || 1.0;
    const carbonReduction = weight * co2PerKg;
    return parseFloat(carbonReduction.toFixed(4));
  }

  async recordCarbonReduction(userId, orderId, category, weight) {
    const carbonReduction = this.calculateCarbonReduction(category, weight);
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.get(
          `SELECT carbon_reduction FROM users WHERE id = ?`,
          [userId],
          (err, user) => {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            
            if (!user) {
              db.run('ROLLBACK');
              return reject(new Error('用户不存在'));
            }

            const newTotal = (user.carbon_reduction || 0) + carbonReduction;

            db.run(
              `UPDATE users SET carbon_reduction = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
              [newTotal, userId],
              function(err) {
                if (err) {
                  db.run('ROLLBACK');
                  return reject(err);
                }

                const recordId = uuidv4();
                const description = `回收${this.getCategoryName(category)}${weight}kg，减少碳排放${carbonReduction}kg`;

                db.run(
                  `INSERT INTO carbon_records 
                   (id, user_id, order_id, category, weight, carbon_reduction, description)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [recordId, userId, orderId, category, weight, carbonReduction, description],
                  function(err) {
                    if (err) {
                      db.run('ROLLBACK');
                      return reject(err);
                    }

                    db.run('COMMIT', (commitErr) => {
                      if (commitErr) {
                        db.run('ROLLBACK');
                        return reject(commitErr);
                      }
                      resolve({
                        record_id: recordId,
                        category,
                        weight,
                        carbon_reduction: carbonReduction,
                        total_carbon: newTotal,
                        co2_per_kg: this.carbonFactors[category] || 1.0
                      });
                    });
                  }
                );
              }
            );
          }
        );
      });
    });
  }

  async getUserCarbonStats(userId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          carbon_reduction as total_reduction,
          (SELECT COUNT(*) FROM carbon_records WHERE user_id = ?) as records_count,
          (SELECT COALESCE(SUM(weight), 0) FROM carbon_records WHERE user_id = ?) as total_weight
         FROM users WHERE id = ?`,
        [userId, userId, userId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row || { total_reduction: 0, records_count: 0, total_weight: 0 });
        }
      );
    });
  }

  async getCarbonHistory(userId, limit = 50) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM carbon_records 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [userId, limit],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  async getGreenFootprint(userId) {
    const stats = await this.getUserCarbonStats(userId);
    const history = await this.getCarbonHistory(userId, 10);
    
    const treeEquivalent = this.calculateTreeEquivalent(stats.total_reduction);
    const carKmEquivalent = this.calculateCarKmEquivalent(stats.total_reduction);
    
    return {
      summary: {
        total_carbon_reduction_kg: stats.total_reduction,
        total_recycled_weight_kg: stats.total_weight,
        total_orders: stats.records_count,
        tree_equivalent: treeEquivalent,
        car_km_equivalent: carKmEquivalent
      },
      recent_records: history
    };
  }

  calculateTreeEquivalent(co2Kg) {
    const co2PerTreePerYear = 21.77;
    return parseFloat((co2Kg / co2PerTreePerYear).toFixed(2));
  }

  calculateCarKmEquivalent(co2Kg) {
    const co2PerKm = 0.21;
    return Math.floor(co2Kg / co2PerKm);
  }

  getCategoryName(category) {
    const names = {
      paper: '废纸',
      plastic: '塑料',
      metal: '金属',
      glass: '玻璃',
      electronics: '电子产品',
      clothes: '旧衣物',
      battery: '废电池',
      organic: '厨余垃圾'
    };
    return names[category] || '其他';
  }

  async getPlatformCarbonStats() {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          COALESCE(SUM(c.carbon_reduction), 0) as total_platform_reduction,
          COALESCE(SUM(c.weight), 0) as total_platform_weight,
          COUNT(DISTINCT c.user_id) as participating_users,
          COUNT(*) as total_records
         FROM carbon_records c`,
        (err, row) => {
          if (err) return reject(err);
          resolve({
            ...row,
            tree_equivalent: this.calculateTreeEquivalent(row.total_platform_reduction),
            car_km_equivalent: this.calculateCarKmEquivalent(row.total_platform_reduction)
          });
        }
      );
    });
  }
}

module.exports = new CarbonModelEngine();
