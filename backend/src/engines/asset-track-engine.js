import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import eventStore, { EventTypes, AggregateTypes } from '../core/event-store.js';
import netValueEngine from './net-value-engine.js';

class AssetTrackEngine {
  getUserAssets(userId) {
    const stmt = db.prepare(`
      SELECT ua.*, fp.name as product_name, fp.code as product_code, 
              fp.nav as current_nav, fp.risk_level, fp.type as product_type
       FROM user_assets ua
       LEFT JOIN fund_products fp ON ua.product_id = fp.id
       WHERE ua.user_id = ? AND ua.total_shares > 0
    `);
    const rows = stmt.all(userId);
    
    return rows.map(asset => {
      const marketValue = asset.total_shares * (asset.current_nav || 1);
      const profit = marketValue - asset.total_invested + asset.total_redeemed + asset.total_dividend;
      const profitRate = asset.total_invested > 0 ? (profit / asset.total_invested) * 100 : 0;
      
      return {
        ...asset,
        marketValue: Math.floor(marketValue * 100) / 100,
        profit: Math.floor(profit * 100) / 100,
        profitRate: Math.floor(profitRate * 100) / 100
      };
    });
  }

  getAsset(userId, productId) {
    const stmt = db.prepare(`
      SELECT ua.*, fp.name as product_name, fp.code as product_code, 
              fp.nav as current_nav, fp.risk_level, fp.type as product_type
       FROM user_assets ua
       LEFT JOIN fund_products fp ON ua.product_id = fp.id
       WHERE ua.user_id = ? AND ua.product_id = ?
    `);
    return stmt.get(userId, productId);
  }

  addPurchase(userId, productId, shares, costPrice, investedAmount, nav) {
    const now = new Date().toISOString();
    
    const existingAsset = this.getAsset(userId, productId);
    
    let assetId;
    let totalShares;
    let totalInvested;
    let newCostPrice;
    
    if (existingAsset) {
      assetId = existingAsset.id;
      totalShares = existingAsset.total_shares + shares;
      totalInvested = existingAsset.total_invested + investedAmount;
      newCostPrice = (existingAsset.total_shares * existingAsset.cost_price + shares * nav) / totalShares;
      
      eventStore.append(
        AggregateTypes.ASSET,
        assetId,
        EventTypes.ASSET_UPDATED,
        {
          userId,
          productId,
          action: 'purchase',
          addedShares: shares,
          newTotalShares: totalShares,
          costPrice: newCostPrice,
          totalInvested,
          nav,
          updatedAt: now
        },
        { source: 'AssetTrackEngine' }
      );
    } else {
      assetId = uuidv4();
      totalShares = shares;
      totalInvested = investedAmount;
      newCostPrice = nav;
      
      eventStore.append(
        AggregateTypes.ASSET,
        assetId,
        EventTypes.ASSET_UPDATED,
        {
          userId,
          productId,
          action: 'new_position',
          shares,
          costPrice: newCostPrice,
          totalInvested,
          nav,
          createdAt: now
        },
        { source: 'AssetTrackEngine' }
      );
    }

    const stmt = db.prepare(`
      INSERT INTO user_assets (id, user_id, product_id, total_shares, available_shares, 
                                 frozen_shares, cost_price, total_invested, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, product_id) DO UPDATE SET
         total_shares = ?,
         available_shares = ?,
         cost_price = ?,
         total_invested = ?,
         updated_at = ?
    `);
    
    stmt.run(
      assetId, userId, productId, totalShares, totalShares, 0, newCostPrice, totalInvested, now, now,
      totalShares, totalShares, newCostPrice, totalInvested, now
    );

    return {
      id: assetId,
      userId,
      productId,
      totalShares,
      availableShares: totalShares,
      frozenShares: 0,
      costPrice: newCostPrice,
      totalInvested
    };
  }

  addRedemption(userId, productId, shares, redeemedAmount, feeAmount) {
    const now = new Date().toISOString();
    
    const existingAsset = this.getAsset(userId, productId);
    
    if (!existingAsset) {
      throw new Error('资产记录不存在');
    }
    
    if (existingAsset.available_shares < shares) {
      throw new Error('可用份额不足');
    }
    
    const totalShares = existingAsset.total_shares - shares;
    const availableShares = existingAsset.available_shares - shares;
    const totalRedeemed = existingAsset.total_redeemed + redeemedAmount;
    
    eventStore.append(
      AggregateTypes.ASSET,
      existingAsset.id,
      EventTypes.ASSET_UPDATED,
      {
        userId,
        productId,
        action: 'redemption',
        redeemedShares: shares,
        newTotalShares: totalShares,
        redeemedAmount,
        feeAmount,
        totalRedeemed,
        updatedAt: now
      },
      { source: 'AssetTrackEngine' }
    );

    const stmt = db.prepare(`
      UPDATE user_assets SET
         total_shares = ?,
         available_shares = ?,
         total_redeemed = ?,
         updated_at = ?
       WHERE user_id = ? AND product_id = ?
    `);
    stmt.run(totalShares, availableShares, totalRedeemed, now, userId, productId);

    return {
      userId,
      productId,
      totalShares,
      availableShares,
      totalRedeemed,
      redeemedAmount,
      feeAmount
    };
  }

  addDividend(userId, productId, shares, dividendAmount, distributionType = 'cash') {
    const now = new Date().toISOString();
    
    const existingAsset = this.getAsset(userId, productId);
    
    if (!existingAsset) {
      throw new Error('资产记录不存在');
    }
    
    const totalDividend = existingAsset.total_dividend + dividendAmount;
    let totalShares = existingAsset.total_shares;
    let availableShares = existingAsset.available_shares;
    
    if (distributionType === 'reinvest') {
      const navData = netValueEngine.getLatestNav(productId);
      const reinvestedShares = dividendAmount / navData.nav;
      const roundedShares = Math.floor(reinvestedShares * 10000) / 10000;
      totalShares += roundedShares;
      availableShares += roundedShares;
    }
    
    eventStore.append(
      AggregateTypes.ASSET,
      existingAsset.id,
      EventTypes.ASSET_UPDATED,
      {
        userId,
        productId,
        action: 'dividend',
        shares,
        dividendAmount,
        distributionType,
        totalDividend,
        updatedAt: now
      },
      { source: 'AssetTrackEngine' }
    );

    const stmt = db.prepare(`
      UPDATE user_assets SET
         total_shares = ?,
         available_shares = ?,
         total_dividend = ?,
         updated_at = ?
       WHERE user_id = ? AND product_id = ?
    `);
    stmt.run(totalShares, availableShares, totalDividend, now, userId, productId);

    return {
      userId,
      productId,
      totalShares,
      availableShares,
      totalDividend,
      dividendAmount,
      distributionType
    };
  }

  freezeShares(userId, productId, shares) {
    const now = new Date().toISOString();
    const existingAsset = this.getAsset(userId, productId);
    
    if (!existingAsset) {
      throw new Error('资产记录不存在');
    }
    
    if (existingAsset.available_shares < shares) {
      throw new Error('可用份额不足');
    }
    
    const availableShares = existingAsset.available_shares - shares;
    const frozenShares = existingAsset.frozen_shares + shares;

    const stmt = db.prepare(`
      UPDATE user_assets SET
         available_shares = ?,
         frozen_shares = ?,
         updated_at = ?
       WHERE user_id = ? AND product_id = ?
    `);
    stmt.run(availableShares, frozenShares, now, userId, productId);

    return {
      userId,
      productId,
      availableShares,
      frozenShares
    };
  }

  unfreezeShares(userId, productId, shares) {
    const now = new Date().toISOString();
    const existingAsset = this.getAsset(userId, productId);
    
    if (!existingAsset) {
      throw new Error('资产记录不存在');
    }
    
    if (existingAsset.frozen_shares < shares) {
      throw new Error('冻结份额不足');
    }
    
    const availableShares = existingAsset.available_shares + shares;
    const frozenShares = existingAsset.frozen_shares - shares;

    const stmt = db.prepare(`
      UPDATE user_assets SET
         available_shares = ?,
         frozen_shares = ?,
         updated_at = ?
       WHERE user_id = ? AND product_id = ?
    `);
    stmt.run(availableShares, frozenShares, now, userId, productId);

    return {
      userId,
      productId,
      availableShares,
      frozenShares
    };
  }

  getAssetSummary(userId) {
    const assets = this.getUserAssets(userId);
    
    const totalMarketValue = assets.reduce((sum, a) => sum + a.marketValue, 0);
    const totalProfit = assets.reduce((sum, a) => sum + a.profit, 0);
    const totalInvested = assets.reduce((sum, a) => sum + a.total_invested, 0);
    
    const profitRate = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
    
    return {
      totalAssets: assets.length,
      totalMarketValue: Math.floor(totalMarketValue * 100) / 100,
      totalProfit: Math.floor(totalProfit * 100) / 100,
      totalInvested: Math.floor(totalInvested * 100) / 100,
      profitRate: Math.floor(profitRate * 100) / 100,
      assets
    };
  }
}

export default new AssetTrackEngine();
