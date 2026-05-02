import db from '../config/database.js';
import eventStore, { EventTypes, AggregateTypes } from '../core/event-store.js';

class NetValueEngine {
  getLatestNav(productId) {
    const stmt = db.prepare(`SELECT nav, nav_updated_at FROM fund_products WHERE id = ?`);
    const row = stmt.get(productId);
    return row ? { nav: row.nav, updatedAt: row.nav_updated_at } : null;
  }

  calculateShares(amount, productId) {
    const navData = this.getLatestNav(productId);
    if (!navData) {
      throw new Error('产品净值不存在');
    }
    
    const shares = amount / navData.nav;
    return {
      shares: Math.floor(shares * 10000) / 10000,
      nav: navData.nav,
      navUpdatedAt: navData.updatedAt
    };
  }

  calculateAmount(shares, productId) {
    const navData = this.getLatestNav(productId);
    if (!navData) {
      throw new Error('产品净值不存在');
    }
    
    const amount = shares * navData.nav;
    return {
      amount: Math.floor(amount * 100) / 100,
      nav: navData.nav,
      navUpdatedAt: navData.updatedAt
    };
  }

  updateNav(productId, newNav, updatedAt = new Date().toISOString()) {
    const navData = this.getLatestNav(productId);
    
    eventStore.append(
      AggregateTypes.PRODUCT,
      productId,
      EventTypes.NAV_UPDATED,
      {
        oldNav: navData?.nav,
        newNav,
        updatedAt
      },
      { source: 'NetValueEngine' }
    );

    const stmt = db.prepare(`UPDATE fund_products SET nav = ?, nav_updated_at = ? WHERE id = ?`);
    const result = stmt.run(newNav, updatedAt, productId);

    return {
      productId,
      oldNav: navData?.nav,
      newNav,
      updatedAt,
      changes: result.changes
    };
  }

  batchUpdateNav(updates) {
    const results = [];
    for (const update of updates) {
      const result = this.updateNav(update.productId, update.nav, update.updatedAt);
      results.push(result);
    }
    return results;
  }

  getHistoricalNav(productId, startDate, endDate) {
    const stmt = db.prepare(`
      SELECT * FROM events 
      WHERE aggregate_type = ? AND aggregate_id = ? AND event_type = ?
      AND occurred_at >= ? AND occurred_at <= ?
      ORDER BY occurred_at ASC
    `);
    const rows = stmt.all(AggregateTypes.PRODUCT, productId, EventTypes.NAV_UPDATED, startDate, endDate);
    
    return rows.map(row => ({
      nav: JSON.parse(row.payload).newNav,
      updatedAt: row.occurred_at
    }));
  }
}

export default new NetValueEngine();
