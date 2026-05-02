const { getAsync, allAsync, runAsync } = require('../config/database');
const { STATUS } = require('../models/initDb');

const REVIEW_ACTIONS = {
  APPROVE: 'approve',
  REJECT: 'reject',
  SUPPLEMENT: 'supplement',
  TRANSFER: 'transfer'
};

class ReviewEngine {
  async calculateMaterialValidation(orderId, materialData) {
    const order = await getAsync(
      `SELECT * FROM main_orders WHERE id = ?`,
      [orderId]
    );

    if (!order) {
      return { valid: false, error: '订单不存在' };
    }

    const results = {
      modelType: order.model_type,
      checks: [],
      overallScore: 0,
      warnings: [],
      errors: []
    };

    if (!materialData || Object.keys(materialData).length === 0) {
      results.errors.push('未提供材质数据');
      return { ...results, valid: false };
    }

    if (materialData.textureQuality) {
      const qualityScore = this.evaluateTextureQuality(materialData.textureQuality);
      results.checks.push({
        type: 'texture_quality',
        score: qualityScore,
        label: '纹理质量'
      });
      results.overallScore += qualityScore * 0.3;
    }

    if (materialData.materialType) {
      const compatibilityScore = this.evaluateMaterialCompatibility(
        order.model_type, 
        materialData.materialType
      );
      results.checks.push({
        type: 'material_compatibility',
        score: compatibilityScore,
        label: '材质兼容性'
      });
      results.overallScore += compatibilityScore * 0.3;
    }

    if (materialData.fileSize) {
      const sizeScore = this.evaluateFileSize(materialData.fileSize);
      results.checks.push({
        type: 'file_size',
        score: sizeScore,
        label: '文件大小'
      });
      results.overallScore += sizeScore * 0.2;
    }

    if (materialData.resolution) {
      const resolutionScore = this.evaluateResolution(materialData.resolution);
      results.checks.push({
        type: 'resolution',
        score: resolutionScore,
        label: '分辨率'
      });
      results.overallScore += resolutionScore * 0.2;
    }

    results.overallScore = Math.round(results.overallScore * 100) / 100;

    results.valid = results.overallScore >= 0.6;

    if (results.overallScore < 0.8) {
      results.warnings.push('材质评分低于推荐标准，建议优化');
    }

    if (materialData.hasWatermark) {
      results.errors.push('材质文件包含水印，请移除后重新上传');
      results.valid = false;
    }

    if (materialData.hasCopyrightIssue) {
      results.errors.push('材质文件存在版权问题');
      results.valid = false;
    }

    return results;
  }

  evaluateTextureQuality(quality) {
    const qualityMap = {
      'excellent': 1.0,
      'good': 0.8,
      'average': 0.6,
      'poor': 0.3
    };
    return qualityMap[quality] || 0.5;
  }

  evaluateMaterialCompatibility(modelType, materialType) {
    const compatibleMaterials = {
      furniture: ['wood', 'leather', 'fabric', 'metal', 'glass'],
      car: ['metal', 'plastic', 'leather', 'fabric', 'carbon_fiber'],
      equipment: ['metal', 'plastic', 'rubber', 'glass']
    };

    const materials = compatibleMaterials[modelType] || compatibleMaterials.furniture;
    return materials.includes(materialType) ? 1.0 : 0.5;
  }

  evaluateFileSize(fileSizeMB) {
    if (fileSizeMB <= 10) return 1.0;
    if (fileSizeMB <= 50) return 0.8;
    if (fileSizeMB <= 100) return 0.6;
    return 0.3;
  }

  evaluateResolution(resolution) {
    if (resolution >= 4096) return 1.0;
    if (resolution >= 2048) return 0.8;
    if (resolution >= 1024) return 0.6;
    return 0.4;
  }

  async processReviewAction(orderId, action, reviewerId, data) {
    const order = await getAsync(
      `SELECT * FROM main_orders WHERE id = ?`,
      [orderId]
    );

    if (!order) {
      return { success: false, error: '订单不存在' };
    }

    if (order.current_status !== STATUS.PENDING_INTERACTION) {
      return { success: false, error: '当前状态不允许执行审核操作' };
    }

    const result = {
      action,
      orderId,
      reviewerId,
      timestamp: new Date().toISOString(),
      data: {}
    };

    switch (action) {
      case REVIEW_ACTIONS.APPROVE:
        result.data = {
          comment: data.comment || '审核通过',
          validationResult: data.validationResult || null
        };
        result.nextStatus = STATUS.PENDING_CONFIG_SELECTION;
        result.success = true;
        break;

      case REVIEW_ACTIONS.REJECT:
        if (!data.reason) {
          return { success: false, error: '驳回必须填写原因' };
        }
        result.data = {
          reason: data.reason,
          rejectItems: data.rejectItems || []
        };
        result.nextStatus = STATUS.REJECTED;
        result.success = true;
        break;

      case REVIEW_ACTIONS.SUPPLEMENT:
        if (!data.supplementRequest) {
          return { success: false, error: '必须指定需要补充的资料' };
        }
        result.data = {
          supplementRequest: data.supplementRequest,
          deadline: data.deadline || null
        };
        result.nextStatus = STATUS.PENDING_INTERACTION;
        result.keepInCurrentStatus = true;
        result.success = true;
        break;

      case REVIEW_ACTIONS.TRANSFER:
        if (!data.newResponsibleId) {
          return { success: false, error: '转派必须指定新的负责人' };
        }
        result.data = {
          newResponsibleId: data.newResponsibleId,
          transferReason: data.transferReason || ''
        };
        result.keepInCurrentStatus = true;
        result.success = true;
        break;

      default:
        return { success: false, error: `未知的审核操作: ${action}` };
    }

    return result;
  }

  async getReviewTimeline(orderId) {
    return await allAsync(
      `SELECT * FROM timeline_events 
       WHERE main_order_id = ? AND event_type IN ('review', 'approval', 'rejection', 'supplement')
       ORDER BY created_at DESC`,
      [orderId]
    );
  }

  async getPendingReviews(role, userId = null) {
    let sql = `SELECT mo.*, u.name as responsible_name 
               FROM main_orders mo 
               LEFT JOIN users u ON mo.responsible_user_id = u.id 
               WHERE mo.current_status = ? `;
    let params = [STATUS.PENDING_INTERACTION];

    if (userId) {
      sql += `AND mo.responsible_user_id = ? `;
      params.push(userId);
    }

    sql += `ORDER BY mo.created_at ASC`;

    return await allAsync(sql, params);
  }
}

module.exports = new ReviewEngine();
