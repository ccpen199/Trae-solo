const { getAsync, allAsync, runAsync } = require('../config/database');

class PromptEngine {
  async createVersion(version, promptText, modelType, createdBy) {
    const result = await runAsync(
      `INSERT INTO prompt_versions (version, prompt_text, model_type, created_by) VALUES (?, ?, ?, ?)`,
      [version, promptText, modelType, createdBy]
    );
    return result.lastID;
  }

  async getActiveVersion(modelType = null) {
    let sql = `SELECT * FROM prompt_versions WHERE is_active = 1`;
    let params = [];
    
    if (modelType) {
      sql += ` AND (model_type = ? OR model_type IS NULL)`;
      params.push(modelType);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT 1`;
    
    return await getAsync(sql, params);
  }

  async activateVersion(versionId) {
    await runAsync(`UPDATE prompt_versions SET is_active = 0`);
    await runAsync(
      `UPDATE prompt_versions SET is_active = 1 WHERE id = ?`,
      [versionId]
    );
    return true;
  }

  async evaluatePrompt(promptVersionId, mainOrderId, score, evaluationData, evaluatorId) {
    const result = await runAsync(
      `INSERT INTO prompt_evaluations (prompt_version_id, main_order_id, score, evaluation_data, evaluator_id) VALUES (?, ?, ?, ?, ?)`,
      [promptVersionId, mainOrderId, score, JSON.stringify(evaluationData), evaluatorId]
    );
    return result.lastID;
  }

  async getVersionEvaluations(versionId) {
    return await allAsync(
      `SELECT pe.*, u.name as evaluator_name, mo.order_no 
       FROM prompt_evaluations pe 
       LEFT JOIN users u ON pe.evaluator_id = u.id 
       LEFT JOIN main_orders mo ON pe.main_order_id = mo.id 
       WHERE pe.prompt_version_id = ? 
       ORDER BY pe.created_at DESC`,
      [versionId]
    );
  }

  async listVersions(modelType = null) {
    let sql = `SELECT * FROM prompt_versions WHERE 1=1`;
    let params = [];
    
    if (modelType) {
      sql += ` AND (model_type = ? OR model_type IS NULL)`;
      params.push(modelType);
    }
    
    sql += ` ORDER BY created_at DESC`;
    
    return await allAsync(sql, params);
  }

  async generatePrompt(modelType, context) {
    const activeVersion = await this.getActiveVersion(modelType);
    if (!activeVersion) {
      return this.getDefaultPrompt(modelType);
    }

    let prompt = activeVersion.prompt_text;
    
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
    }

    return {
      prompt,
      versionId: activeVersion.id,
      version: activeVersion.version
    };
  }

  getDefaultPrompt(modelType) {
    const prompts = {
      furniture: `请描述这个家具3D模型的材质、颜色和配置选项。重点关注：
1. 主要材质类型（木材、皮革、布料等）
2. 可选颜色方案
3. 配置选项（尺寸、配件等）
4. 交互热点位置`,
      car: `请描述这个汽车3D模型的外观和内饰配置。重点关注：
1. 外观颜色选项
2. 轮毂样式
3. 内饰材质
4. 配置套餐`,
      equipment: `请描述这个设备3D模型的技术参数和配置。重点关注：
1. 核心功能模块
2. 可选配件
3. 技术参数规格
4. 操作说明`
    };

    return {
      prompt: prompts[modelType] || prompts.furniture,
      versionId: null,
      version: 'default'
    };
  }
}

module.exports = new PromptEngine();
