const db = require('../database');
const { v4: uuidv4 } = require('uuid');

class PriceIndexEngine {
  constructor() {
    this.defaultRules = [
      { category: 'paper', sub_category: '废纸', price_per_kg: 1.2 },
      { category: 'plastic', sub_category: '塑料瓶', price_per_kg: 0.8 },
      { category: 'metal', sub_category: '废铁', price_per_kg: 2.5 },
      { category: 'metal', sub_category: '废铝', price_per_kg: 8.0 },
      { category: 'metal', sub_category: '废铜', price_per_kg: 35.0 },
      { category: 'glass', sub_category: '玻璃瓶', price_per_kg: 0.3 },
      { category: 'electronics', sub_category: '旧家电', price_per_kg: 5.0 },
      { category: 'clothes', sub_category: '旧衣物', price_per_kg: 0.5 },
      { category: 'battery', sub_category: '废电池', price_per_kg: 3.0 },
      { category: 'organic', sub_category: '厨余垃圾', price_per_kg: 0.1 }
    ];
  }

  async initializeDefaultRules() {
    return new Promise((resolve, reject) => {
      db.all('SELECT COUNT(*) as count FROM price_rules', (err, rows) => {
        if (err) return reject(err);
        
        if (rows[0].count === 0) {
          const insertPromises = this.defaultRules.map(rule => 
            this.createRule(rule.category, rule.sub_category, rule.price_per_kg)
          );
          Promise.all(insertPromises).then(resolve).catch(reject);
        } else {
          resolve();
        }
      });
    });
  }

  async createRule(category, subCategory, pricePerKg, unit = 'kg') {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      db.run(
        `INSERT INTO price_rules (id, category, sub_category, price_per_kg, unit, status)
         VALUES (?, ?, ?, ?, ?, 'active')`,
        [id, category, subCategory, pricePerKg, unit],
        function(err) {
          if (err) return reject(err);
          resolve({ id, category, sub_category: subCategory, price_per_kg: pricePerKg, unit });
        }
      );
    });
  }

  async getPrice(category, subCategory = null) {
    return new Promise((resolve, reject) => {
      let query = `SELECT * FROM price_rules WHERE category = ? AND status = 'active'`;
      let params = [category];

      if (subCategory) {
        query += ` AND sub_category = ?`;
        params.push(subCategory);
      }

      query += ` ORDER BY effective_date DESC LIMIT 1`;

      db.get(query, params, (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }

  async getAllActivePrices() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM price_rules WHERE status = 'active' ORDER BY category, sub_category`,
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  async calculateTotal(category, subCategory, weight) {
    const priceRule = await this.getPrice(category, subCategory);
    if (!priceRule) {
      throw new Error(`未找到 ${category} - ${subCategory || ''} 的计价规则`);
    }

    const totalAmount = weight * priceRule.price_per_kg;
    return {
      category,
      sub_category: subCategory,
      weight,
      unit_price: priceRule.price_per_kg,
      total_amount: parseFloat(totalAmount.toFixed(2)),
      price_rule_id: priceRule.id
    };
  }

  async updatePrice(category, subCategory, newPrice) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE price_rules SET price_per_kg = ? WHERE category = ? AND sub_category = ? AND status = 'active'`,
        [newPrice, category, subCategory],
        function(err) {
          if (err) return reject(err);
          if (this.changes === 0) {
            reject(new Error('未找到对应的计价规则'));
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  }

  async getPriceHistory(category, subCategory = null) {
    return new Promise((resolve, reject) => {
      let query = `SELECT * FROM price_rules WHERE category = ?`;
      let params = [category];

      if (subCategory) {
        query += ` AND sub_category = ?`;
        params.push(subCategory);
      }

      query += ` ORDER BY effective_date DESC`;

      db.all(query, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }
}

module.exports = new PriceIndexEngine();
