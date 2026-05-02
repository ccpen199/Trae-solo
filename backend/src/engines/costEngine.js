const { getAsync, allAsync, runAsync } = require('../config/database');
const { STATUS, ROLES } = require('../models/initDb');

const SENSITIVE_KEYWORDS = [
  'weapon', 'gun', 'firearm', 'bomb', 'explosive',
  '武器', '枪支', '炸弹', '爆炸物',
  'drug', 'narcotic', '毒品', '麻醉品',
  'counterfeit', 'fake', '假冒', '伪造',
  'restricted', '禁止', '受限'
];

class CostEngine {
  constructor() {
    this.defaultCostLimit = parseFloat(process.env.COST_LIMIT) || 100000;
  }

  async checkCostLimit(orderId, actualCost) {
    const order = await getAsync(
      `SELECT * FROM main_orders WHERE id = ?`,
      [orderId]
    );

    if (!order) {
      return { valid: false, error: '订单不存在' };
    }

    const costLimit = order.cost_limit || this.defaultCostLimit;
    const result = {
      actualCost,
      costLimit,
      isOverLimit: actualCost > costLimit,
      valid: actualCost <= costLimit,
      percentage: (actualCost / costLimit) * 100,
      warnings: [],
      errors: []
    };

    if (result.isOverLimit) {
      result.errors.push(`成本超限：实际成本 ${actualCost} 超过限额 ${costLimit}`);
      result.degradeAction = 'request_approval';
      result.degradeReason = `成本超限 ${result.percentage.toFixed(2)}%`;
    }

    if (result.percentage > 80 && result.percentage <= 100) {
      result.warnings.push(`成本接近限额：已使用 ${result.percentage.toFixed(2)}%`);
    }

    return result;
  }

  async calculateQuoteCost(configData) {
    const baseCost = configData.baseCost || 0;
    const materialCost = this.calculateMaterialCost(configData.materials);
    const featureCost = this.calculateFeatureCost(configData.features);
    const customizationCost = this.calculateCustomizationCost(configData.customizations);
    
    const totalCost = baseCost + materialCost + featureCost + customizationCost;
    
    return {
      breakdown: {
        baseCost,
        materialCost,
        featureCost,
        customizationCost
      },
      totalCost,
      currency: 'CNY'
    };
  }

  calculateMaterialCost(materials) {
    if (!materials || !Array.isArray(materials)) return 0;

    const materialPrices = {
      'wood': 500,
      'leather': 800,
      'fabric': 300,
      'metal': 400,
      'glass': 200,
      'plastic': 150,
      'carbon_fiber': 1500,
      'rubber': 100
    };

    return materials.reduce((total, material) => {
      const basePrice = materialPrices[material.type] || 200;
      const quantity = material.quantity || 1;
      return total + (basePrice * quantity);
    }, 0);
  }

  calculateFeatureCost(features) {
    if (!features || !Array.isArray(features)) return 0;

    const featurePrices = {
      'animation': 200,
      'interactive_hotspot': 150,
      'ar_support': 500,
      'custom_lighting': 300,
      'wireframe_view': 100
    };

    return features.reduce((total, feature) => {
      return total + (featurePrices[feature] || 100);
    }, 0);
  }

  calculateCustomizationCost(customizations) {
    if (!customizations) return 0;
    
    const levelMultiplier = {
      'basic': 1,
      'standard': 1.5,
      'premium': 2.5,
      'enterprise': 4
    };

    const level = customizations.level || 'basic';
    const hours = customizations.hours || 0;
    const hourlyRate = 200;

    return hours * hourlyRate * (levelMultiplier[level] || 1);
  }

  async checkSensitiveContent(modelName, description, tags = []) {
    const result = {
      hasSensitiveContent: false,
      sensitiveItems: [],
      valid: true,
      warnings: []
    };

    const contentToCheck = [
      modelName || '',
      description || '',
      ...(Array.isArray(tags) ? tags : [])
    ].join(' ').toLowerCase();

    for (const keyword of SENSITIVE_KEYWORDS) {
      if (contentToCheck.includes(keyword.toLowerCase())) {
        result.hasSensitiveContent = true;
        result.sensitiveItems.push(keyword);
      }
    }

    if (result.hasSensitiveContent) {
      result.valid = false;
      result.degradeAction = 'block';
      result.degradeReason = `检测到敏感内容: ${result.sensitiveItems.join(', ')}`;
    }

    return result;
  }

  async checkModelStability(modelMetrics) {
    const result = {
      isStable: true,
      score: 1.0,
      warnings: [],
      errors: [],
      checks: []
    };

    if (!modelMetrics) {
      result.isStable = false;
      result.errors.push('缺少模型指标数据');
      return result;
    }

    if (modelMetrics.fileSize) {
      const check = this.checkFileSizeStability(modelMetrics.fileSize);
      result.checks.push(check);
      if (!check.pass) {
        result.isStable = false;
        if (check.level === 'error') {
          result.errors.push(check.message);
        } else {
          result.warnings.push(check.message);
        }
      }
      result.score *= check.score;
    }

    if (modelMetrics.polygonCount) {
      const check = this.checkPolygonCount(modelMetrics.polygonCount);
      result.checks.push(check);
      if (!check.pass) {
        result.isStable = false;
        if (check.level === 'error') {
          result.errors.push(check.message);
        } else {
          result.warnings.push(check.message);
        }
      }
      result.score *= check.score;
    }

    if (modelMetrics.textureCount) {
      const check = this.checkTextureCount(modelMetrics.textureCount);
      result.checks.push(check);
      if (!check.pass) {
        result.isStable = false;
        if (check.level === 'error') {
          result.errors.push(check.message);
        } else {
          result.warnings.push(check.message);
        }
      }
      result.score *= check.score;
    }

    if (modelMetrics.animationComplexity) {
      const check = this.checkAnimationComplexity(modelMetrics.animationComplexity);
      result.checks.push(check);
      if (!check.pass) {
        result.isStable = false;
        if (check.level === 'error') {
          result.errors.push(check.message);
        } else {
          result.warnings.push(check.message);
        }
      }
      result.score *= check.score;
    }

    result.valid = result.isStable;
    if (!result.isStable) {
      result.degradeAction = 'optimize';
      result.degradeReason = '模型稳定性检查不通过';
    }

    return result;
  }

  checkFileSizeStability(fileSizeMB) {
    if (fileSizeMB <= 50) {
      return { type: 'file_size', pass: true, score: 1.0, message: '文件大小正常' };
    } else if (fileSizeMB <= 100) {
      return { type: 'file_size', pass: true, score: 0.8, level: 'warning', message: '文件较大，可能影响加载性能' };
    } else {
      return { type: 'file_size', pass: false, score: 0.3, level: 'error', message: `文件过大 (${fileSizeMB}MB)，建议优化至100MB以下` };
    }
  }

  checkPolygonCount(polygonCount) {
    if (polygonCount <= 50000) {
      return { type: 'polygon_count', pass: true, score: 1.0, message: '多边形数量正常' };
    } else if (polygonCount <= 150000) {
      return { type: 'polygon_count', pass: true, score: 0.8, level: 'warning', message: '多边形数量较多，可能影响渲染性能' };
    } else {
      return { type: 'polygon_count', pass: false, score: 0.4, level: 'error', message: `多边形数量过多 (${polygonCount})，建议优化至15万以下` };
    }
  }

  checkTextureCount(textureCount) {
    if (textureCount <= 10) {
      return { type: 'texture_count', pass: true, score: 1.0, message: '纹理数量正常' };
    } else if (textureCount <= 30) {
      return { type: 'texture_count', pass: true, score: 0.9, level: 'warning', message: '纹理数量较多' };
    } else {
      return { type: 'texture_count', pass: false, score: 0.5, level: 'error', message: `纹理数量过多 (${textureCount})，建议合并或优化` };
    }
  }

  checkAnimationComplexity(complexity) {
    const levels = ['simple', 'moderate', 'complex', 'very_complex'];
    const index = levels.indexOf(complexity);

    if (index <= 1) {
      return { type: 'animation_complexity', pass: true, score: 1.0, message: '动画复杂度正常' };
    } else if (index === 2) {
      return { type: 'animation_complexity', pass: true, score: 0.85, level: 'warning', message: '动画复杂度较高' };
    } else {
      return { type: 'animation_complexity', pass: false, score: 0.6, level: 'error', message: '动画复杂度过高，建议简化' };
    }
  }

  async recordDegradation(orderId, degradeType, reason, triggerCondition, judgementBasis, operatorId, originalStatus) {
    const result = await runAsync(
      `INSERT INTO degradation_records (
        main_order_id, degrade_type, reason, trigger_condition, 
        judgement_basis, original_status, target_status, operator_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, degradeType, reason, triggerCondition, judgementBasis, originalStatus, 'degraded', operatorId]
    );

    await runAsync(
      `UPDATE main_orders SET current_status = 'degraded', updated_at = datetime('now') WHERE id = ?`,
      [orderId]
    );

    return result.lastID;
  }

  async resolveDegradation(degradationId, operatorId) {
    const degradation = await getAsync(
      `SELECT * FROM degradation_records WHERE id = ?`,
      [degradationId]
    );

    if (!degradation) {
      return { success: false, error: '降级记录不存在' };
    }

    await runAsync(
      `UPDATE degradation_records SET is_resolved = 1 WHERE id = ?`,
      [degradationId]
    );

    await runAsync(
      `UPDATE main_orders SET current_status = ?, updated_at = datetime('now') WHERE id = ?`,
      [degradation.original_status || STATUS.PENDING_MODEL_LOAD, degradation.main_order_id]
    );

    return { success: true, restoredStatus: degradation.original_status };
  }
}

module.exports = new CostEngine();
