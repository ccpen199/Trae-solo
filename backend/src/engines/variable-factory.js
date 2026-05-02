const { getDb } = require('../database/connection');
const _ = require('lodash');

class VariableFactory {
  constructor() {
    this.db = getDb();
    this.mockDataSources = {
      user_activity: {
        login_count: (userId) => userId === 'user_999' ? 15 : Math.floor(Math.random() * 5),
        last_login_ip: () => '192.168.1.100'
      },
      ip_security: {
        is_blacklisted: (ip) => ip === '10.0.0.1' ? true : false,
        risk_score: (ip) => ip === '10.0.0.1' ? 95 : 20
      },
      device_info: {
        is_new_device: (deviceId) => deviceId === 'device_new_001' ? true : false,
        device_count: () => 3
      },
      user_profile: {
        account_age_days: (userId) => userId === 'user_new' ? 1 : 365,
        is_verified: (userId) => userId === 'user_verified' ? true : true
      },
      geo_ip: {
        is_high_risk_region: (ip) => ip.startsWith('192.168.') ? false : true,
        country: (ip) => 'CN'
      },
      security_events: {
        consecutive_failures: (userId) => userId === 'user_hacked' ? 10 : 0,
        password_change_days: () => 30
      }
    };
  }

  getAllVariables() {
    const stmt = this.db.prepare(`SELECT * FROM variables ORDER BY created_at DESC`);
    return stmt.all();
  }

  getVariableByCode(code) {
    const stmt = this.db.prepare(`SELECT * FROM variables WHERE code = ?`);
    return stmt.get(code);
  }

  async resolveVariables(requestContext, variableCodes) {
    const results = {};
    const snapshot = {};

    for (const code of variableCodes) {
      const variable = this.getVariableByCode(code);
      if (!variable) continue;

      const value = await this.resolveSingleVariable(variable, requestContext);
      results[code] = {
        variable,
        value,
        resolvedAt: new Date().toISOString()
      };
      snapshot[code] = {
        value,
        variableId: variable.id,
        name: variable.name,
        type: variable.type,
        weight: variable.weight
      };
    }

    return { values: results, snapshot };
  }

  async resolveSingleVariable(variable, requestContext) {
    const sourceConfig = JSON.parse(variable.source_config || '{}');
    const sourceType = variable.source_type;

    switch (sourceType) {
      case 'request':
        return _.get(requestContext, sourceConfig.field, null);
      case 'realtime':
      case 'profile':
        return this.fetchFromMockSource(sourceConfig.source, sourceConfig.field, requestContext);
      default:
        return null;
    }
  }

  fetchFromMockSource(sourceName, fieldName, requestContext) {
    const source = this.mockDataSources[sourceName];
    if (!source || !source[fieldName]) {
      return this.generateDefaultValue(fieldName);
    }

    const params = this.extractSourceParams(requestContext, sourceName);
    return source[fieldName](...params);
  }

  extractSourceParams(requestContext, sourceName) {
    const userId = requestContext.userId || requestContext.user_id || 'default_user';
    const ip = requestContext.ip || requestContext.ipAddress || '127.0.0.1';
    const deviceId = requestContext.deviceId || requestContext.device_id || 'default_device';

    switch (sourceName) {
      case 'user_activity':
      case 'user_profile':
      case 'security_events':
        return [userId];
      case 'ip_security':
      case 'geo_ip':
        return [ip];
      case 'device_info':
        return [deviceId];
      default:
        return [userId, ip, deviceId];
    }
  }

  generateDefaultValue(fieldName) {
    if (fieldName.includes('count') || fieldName.includes('age') || fieldName.includes('days')) {
      return Math.floor(Math.random() * 10);
    }
    if (fieldName.includes('is_') || fieldName.startsWith('new_')) {
      return false;
    }
    if (fieldName.includes('amount') || fieldName.includes('score')) {
      return Math.floor(Math.random() * 1000);
    }
    return null;
  }

  updateVariableWeight(variableId, newWeight) {
    const stmt = this.db.prepare(`
      UPDATE variables 
      SET weight = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    const result = stmt.run(newWeight, variableId);
    return result.changes > 0;
  }
}

module.exports = VariableFactory;
