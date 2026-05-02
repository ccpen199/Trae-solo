const { getAsync, allAsync, runAsync } = require('../config/database');

const RULE_TYPES = {
  MATERIAL_DEFAULT: 'material_default',
  ROTATION_LIMIT: 'rotation_limit',
  ZOOM_LIMIT: 'zoom_limit',
  HOTSPOT_RULE: 'hotspot_rule',
  VALIDATION_RULE: 'validation_rule',
  PRICING_RULE: 'pricing_rule'
};

class ModelRuleEngine {
  async createRule(ruleData) {
    const result = await runAsync(
      `INSERT INTO model_rules (
        rule_name, rule_type, model_type, conditions, 
        actions, priority, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        ruleData.ruleName,
        ruleData.ruleType,
        ruleData.modelType || null,
        JSON.stringify(ruleData.conditions || {}),
        JSON.stringify(ruleData.actions || {}),
        ruleData.priority || 0,
        ruleData.isActive !== undefined ? ruleData.isActive : 1
      ]
    );
    return result.lastID;
  }

  async getActiveRules(modelType = null, ruleType = null) {
    let sql = `SELECT * FROM model_rules WHERE is_active = 1`;
    let params = [];

    if (modelType) {
      sql += ` AND (model_type = ? OR model_type IS NULL)`;
      params.push(modelType);
    }

    if (ruleType) {
      sql += ` AND rule_type = ?`;
      params.push(ruleType);
    }

    sql += ` ORDER BY priority DESC, created_at ASC`;

    return await allAsync(sql, params);
  }

  async evaluateRules(modelType, context) {
    const rules = await this.getActiveRules(modelType);
    const results = {
      modelType,
      evaluated: [],
      actions: {},
      warnings: [],
      errors: []
    };

    for (const rule of rules) {
      const ruleResult = this.evaluateSingleRule(rule, context);
      
      if (ruleResult.matched) {
        results.evaluated.push({
          ruleId: rule.id,
          ruleName: rule.rule_name,
          ruleType: rule.rule_type,
          matched: true,
          actions: ruleResult.actions
        });

        this.applyActions(results.actions, rule.rule_type, ruleResult.actions);
      }
    }

    return results;
  }

  evaluateSingleRule(rule, context) {
    const result = {
      matched: false,
      actions: null
    };

    let conditions = {};
    try {
      conditions = JSON.parse(rule.conditions);
    } catch (e) {
      conditions = {};
    }

    let actions = {};
    try {
      actions = JSON.parse(rule.actions);
    } catch (e) {
      actions = {};
    }

    result.matched = this.checkConditions(conditions, context);
    result.actions = result.matched ? actions : null;

    return result;
  }

  checkConditions(conditions, context) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true;
    }

    for (const [key, expectedValue] of Object.entries(conditions)) {
      const actualValue = this.getNestedValue(context, key);
      
      if (!this.matchCondition(expectedValue, actualValue)) {
        return false;
      }
    }

    return true;
  }

  getNestedValue(obj, path) {
    if (!path || !obj) return undefined;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  }

  matchCondition(expected, actual) {
    if (typeof expected === 'object' && expected !== null) {
      if (expected.$gt !== undefined) return actual > expected.$gt;
      if (expected.$gte !== undefined) return actual >= expected.$gte;
      if (expected.$lt !== undefined) return actual < expected.$lt;
      if (expected.$lte !== undefined) return actual <= expected.$lte;
      if (expected.$in !== undefined) return expected.$in.includes(actual);
      if (expected.$contains !== undefined) return actual && actual.includes(expected.$contains);
      if (expected.$regex !== undefined) {
        const regex = new RegExp(expected.$regex, expected.$flags || '');
        return regex.test(actual);
      }
    }

    return expected === actual;
  }

  applyActions(actionsTarget, ruleType, actions) {
    if (!actionsTarget[ruleType]) {
      actionsTarget[ruleType] = [];
    }
    actionsTarget[ruleType].push(actions);
  }

  async getMaterialDefaults(modelType) {
    const rules = await this.getActiveRules(modelType, RULE_TYPES.MATERIAL_DEFAULT);
    
    if (rules.length === 0) {
      return { default_material: 'wood' };
    }

    const materials = rules.map(r => {
      let actions = {};
      try {
        actions = JSON.parse(r.actions);
      } catch (e) {
        actions = {};
      }
      return actions;
    });

    return materials[0];
  }

  async getRotationLimits(modelType) {
    const rules = await this.getActiveRules(modelType, RULE_TYPES.ROTATION_LIMIT);
    
    const defaults = {
      min_angle: 0,
      max_angle: 360,
      allow_vertical: true,
      allow_horizontal: true
    };

    if (rules.length === 0) {
      return defaults;
    }

    let actions = {};
    try {
      actions = JSON.parse(rules[0].actions);
    } catch (e) {
      actions = {};
    }

    return { ...defaults, ...actions };
  }

  async getZoomLimits(modelType) {
    const rules = await this.getActiveRules(modelType, RULE_TYPES.ZOOM_LIMIT);
    
    const defaults = {
      min_zoom: 0.5,
      max_zoom: 5.0,
      default_zoom: 1.0
    };

    if (rules.length === 0) {
      return defaults;
    }

    let actions = {};
    try {
      actions = JSON.parse(rules[0].actions);
    } catch (e) {
      actions = {};
    }

    return { ...defaults, ...actions };
  }

  async getHotspotRules(modelType) {
    const rules = await this.getActiveRules(modelType, RULE_TYPES.HOTSPOT_RULE);
    
    const results = rules.map(r => {
      let conditions = {};
      let actions = {};
      try {
        conditions = JSON.parse(r.conditions);
        actions = JSON.parse(r.actions);
      } catch (e) {
        conditions = {};
        actions = {};
      }
      return {
        ruleId: r.id,
        ruleName: r.rule_name,
        conditions,
        actions
      };
    });

    return results;
  }

  validateHotspot(hotspot, modelType, context) {
    const errors = [];
    const warnings = [];

    if (!hotspot.type) {
      errors.push('热点类型不能为空');
    }

    if (!hotspot.position || !Array.isArray(hotspot.position) || hotspot.position.length !== 3) {
      errors.push('热点位置必须是包含x,y,z的数组');
    }

    if (hotspot.trigger && !['click', 'hover', 'auto'].includes(hotspot.trigger)) {
      warnings.push(`未知的触发方式: ${hotspot.trigger}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  async applyModelConfig(modelType, config) {
    const rules = await this.evaluateRules(modelType, config);
    
    const finalConfig = { ...config };

    if (rules.actions[RULE_TYPES.MATERIAL_DEFAULT]) {
      const materialRules = rules.actions[RULE_TYPES.MATERIAL_DEFAULT];
      for (const mr of materialRules) {
        if (mr.default_material && !finalConfig.defaultMaterial) {
          finalConfig.defaultMaterial = mr.default_material;
        }
      }
    }

    if (rules.actions[RULE_TYPES.ROTATION_LIMIT]) {
      const rotationRules = rules.actions[RULE_TYPES.ROTATION_LIMIT];
      for (const rr of rotationRules) {
        finalConfig.rotationLimits = {
          min_angle: rr.min_angle || 0,
          max_angle: rr.max_angle || 360
        };
      }
    }

    if (rules.actions[RULE_TYPES.ZOOM_LIMIT]) {
      const zoomRules = rules.actions[RULE_TYPES.ZOOM_LIMIT];
      for (const zr of zoomRules) {
        finalConfig.zoomLimits = {
          min_zoom: zr.min_zoom || 0.5,
          max_zoom: zr.max_zoom || 5.0
        };
      }
    }

    return {
      finalConfig,
      appliedRules: rules.evaluated,
      warnings: rules.warnings
    };
  }

  async listAllRules(modelType = null) {
    let sql = `SELECT * FROM model_rules WHERE 1=1`;
    let params = [];

    if (modelType) {
      sql += ` AND (model_type = ? OR model_type IS NULL)`;
      params.push(modelType);
    }

    sql += ` ORDER BY priority DESC, created_at ASC`;

    const rules = await allAsync(sql, params);

    return rules.map(r => ({
      id: r.id,
      ruleName: r.rule_name,
      ruleType: r.rule_type,
      modelType: r.model_type,
      conditions: JSON.parse(r.conditions || '{}'),
      actions: JSON.parse(r.actions || '{}'),
      priority: r.priority,
      isActive: r.is_active === 1,
      createdAt: r.created_at
    }));
  }

  async updateRule(ruleId, updates) {
    const existing = await getAsync(
      `SELECT * FROM model_rules WHERE id = ?`,
      [ruleId]
    );

    if (!existing) {
      return { success: false, error: '规则不存在' };
    }

    const updatesSql = [];
    const updatesParams = [];

    if (updates.ruleName !== undefined) {
      updatesSql.push('rule_name = ?');
      updatesParams.push(updates.ruleName);
    }

    if (updates.conditions !== undefined) {
      updatesSql.push('conditions = ?');
      updatesParams.push(JSON.stringify(updates.conditions));
    }

    if (updates.actions !== undefined) {
      updatesSql.push('actions = ?');
      updatesParams.push(JSON.stringify(updates.actions));
    }

    if (updates.priority !== undefined) {
      updatesSql.push('priority = ?');
      updatesParams.push(updates.priority);
    }

    if (updates.isActive !== undefined) {
      updatesSql.push('is_active = ?');
      updatesParams.push(updates.isActive ? 1 : 0);
    }

    if (updatesSql.length === 0) {
      return { success: false, error: '没有要更新的字段' };
    }

    updatesParams.push(ruleId);

    await runAsync(
      `UPDATE model_rules SET ${updatesSql.join(', ')} WHERE id = ?`,
      updatesParams
    );

    return { success: true };
  }

  async deleteRule(ruleId) {
    const result = await runAsync(
      `DELETE FROM model_rules WHERE id = ?`,
      [ruleId]
    );

    return result.changes > 0;
  }
}

module.exports = new ModelRuleEngine();
