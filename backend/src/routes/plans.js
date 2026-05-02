const express = require('express');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const db = require('../database');
const logger = require('../utils/logger');
const { authenticate, requirePermission, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, billingCycle } = req.query;
    
    let sql = `
      SELECT p.*, 
             (SELECT JSON_GROUP_ARRAY(
               JSON_OBJECT(
                 'id', pf.id,
                 'feature_key', pf.feature_key,
                 'feature_name', pf.feature_name,
                 'feature_value', pf.feature_value,
                 'feature_type', pf.feature_type,
                 'is_primary', pf.is_primary
               )
             ) FROM plan_features pf WHERE pf.plan_id = p.id) as features
      FROM plans p
      WHERE 1=1
    `;
    const params = [];
    
    if (!req.user || !req.user.permissions.includes('plan:create')) {
      sql += " AND p.status = 'active'";
    } else if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }
    
    if (billingCycle) {
      sql += ' AND p.billing_cycle = ?';
      params.push(billingCycle);
    }
    
    sql += ' ORDER BY p.price ASC';
    
    const plans = db.all(sql, params);
    
    const formattedPlans = plans.map(plan => ({
      ...plan,
      features: plan.features ? JSON.parse(plan.features) : []
    }));
    
    res.json({
      success: true,
      data: {
        plans: formattedPlans,
        total: formattedPlans.length
      }
    });
  } catch (error) {
    logger.error('获取套餐列表失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/:planId', optionalAuth, async (req, res) => {
  try {
    const { planId } = req.params;
    
    let sql = `
      SELECT p.*
      FROM plans p
      WHERE p.id = ?
    `;
    const params = [planId];
    
    if (!req.user || !req.user.permissions.includes('plan:create')) {
      sql += " AND p.status = 'active'";
    }
    
    const plan = db.get(sql, params);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: '套餐不存在或已下架'
      });
    }
    
    const features = db.all(`
      SELECT * FROM plan_features WHERE plan_id = ? ORDER BY sort_order
    `, [planId]);
    
    res.json({
      success: true,
      data: {
        plan,
        features
      }
    });
  } catch (error) {
    logger.error('获取套餐详情失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.post('/', authenticate, requirePermission('plan:create'), async (req, res) => {
  try {
    const {
      name,
      displayName,
      description,
      billingCycle,
      price,
      currency = 'CNY',
      trialDays = 0,
      status = 'draft',
      features = []
    } = req.body;
    
    if (!name || !displayName || !billingCycle || price === undefined) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      });
    }
    
    const existingPlan = db.get('SELECT * FROM plans WHERE name = ?', [name]);
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        error: '套餐名称已存在'
      });
    }
    
    const planId = uuidv4();
    
    db.run(`
      INSERT INTO plans (
        id, name, display_name, description, billing_cycle, 
        price, currency, status, trial_days, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      planId, name, displayName, description, billingCycle,
      price, currency, status, trialDays
    ]);
    
    if (features.length > 0) {
      let sortOrder = 0;
      for (const feature of features) {
        db.run(`
          INSERT INTO plan_features (
            id, plan_id, feature_key, feature_name, 
            feature_value, feature_type, is_primary, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          uuidv4(), planId, feature.featureKey, feature.featureName,
          feature.featureValue, feature.featureType || 'boolean',
          feature.isPrimary ? 1 : 0, sortOrder++
        ]);
      }
    }
    
    db.run(`
      INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [uuidv4(), req.user.id, 'create', 'plan', planId]);
    
    logger.info(`套餐创建成功: ${name} by ${req.user.username}`);
    
    const newPlan = db.get('SELECT * FROM plans WHERE id = ?', [planId]);
    const newFeatures = db.all('SELECT * FROM plan_features WHERE plan_id = ?', [planId]);
    
    res.json({
      success: true,
      data: {
        plan: newPlan,
        features: newFeatures
      }
    });
  } catch (error) {
    logger.error('创建套餐失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.put('/:planId', authenticate, requirePermission('plan:update'), async (req, res) => {
  try {
    const { planId } = req.params;
    const {
      displayName,
      description,
      price,
      status,
      trialDays
    } = req.body;
    
    const existingPlan = db.get('SELECT * FROM plans WHERE id = ?', [planId]);
    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        error: '套餐不存在'
      });
    }
    
    const oldValue = JSON.stringify(existingPlan);
    
    if (price !== undefined && price !== existingPlan.price) {
      db.run(`
        INSERT INTO pricing_history (
          id, plan_id, old_price, new_price, changed_by, effective_at, created_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        uuidv4(), planId, existingPlan.price, price, req.user.id
      ]);
    }
    
    const updates = [];
    const params = [];
    
    if (displayName !== undefined) {
      updates.push('display_name = ?');
      params.push(displayName);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(price);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (trialDays !== undefined) {
      updates.push('trial_days = ?');
      params.push(trialDays);
    }
    
    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(planId);
      
      db.run(`
        UPDATE plans SET ${updates.join(', ')} WHERE id = ?
      `, params);
    }
    
    const updatedPlan = db.get('SELECT * FROM plans WHERE id = ?', [planId]);
    
    db.run(`
      INSERT INTO audit_logs (
        id, user_id, action, resource_type, resource_id, 
        old_value, new_value, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      uuidv4(), req.user.id, 'update', 'plan', planId,
      oldValue, JSON.stringify(updatedPlan)
    ]);
    
    logger.info(`套餐更新成功: ${planId} by ${req.user.username}`);
    
    res.json({
      success: true,
      data: {
        plan: updatedPlan
      }
    });
  } catch (error) {
    logger.error('更新套餐失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.delete('/:planId', authenticate, requirePermission('plan:delete'), async (req, res) => {
  try {
    const { planId } = req.params;
    
    const existingPlan = db.get('SELECT * FROM plans WHERE id = ?', [planId]);
    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        error: '套餐不存在'
      });
    }
    
    const activeSubscriptions = db.get(`
      SELECT COUNT(*) as count FROM subscriptions 
      WHERE plan_id = ? AND status IN ('active', 'past_due', 'pending')
    `, [planId]);
    
    if (activeSubscriptions.count > 0) {
      return res.status(400).json({
        success: false,
        error: '该套餐存在活跃订阅，无法删除'
      });
    }
    
    db.run('DELETE FROM plan_features WHERE plan_id = ?', [planId]);
    db.run('DELETE FROM plans WHERE id = ?', [planId]);
    
    db.run(`
      INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [uuidv4(), req.user.id, 'delete', 'plan', planId]);
    
    logger.info(`套餐删除成功: ${planId} by ${req.user.username}`);
    
    res.json({
      success: true,
      message: '套餐已删除'
    });
  } catch (error) {
    logger.error('删除套餐失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

router.get('/:planId/pricing-history', authenticate, requirePermission('plan:read'), async (req, res) => {
  try {
    const { planId } = req.params;
    
    const history = db.all(`
      SELECT ph.*, u.display_name as changed_by_name
      FROM pricing_history ph
      JOIN users u ON ph.changed_by = u.id
      WHERE ph.plan_id = ?
      ORDER BY ph.effective_at DESC
    `, [planId]);
    
    res.json({
      success: true,
      data: {
        history,
        total: history.length
      }
    });
  } catch (error) {
    logger.error('获取定价历史失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

module.exports = router;
