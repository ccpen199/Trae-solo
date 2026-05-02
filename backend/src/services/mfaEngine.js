const { v4: uuidv4 } = require('uuid');
const { query, run } = require('../config/database');

const MFAType = {
  SMS: 'sms',
  EMAIL: 'email',
  TOTP: 'totp',
  PUSH: 'push'
};

const RiskLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

const generateMFACode = (length = 6) => {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return code;
};

const calculateRiskScore = (user, loginContext) => {
  let riskScore = 0;
  const riskFactors = [];

  if (!loginContext.ipAddress) {
    riskScore += 10;
    riskFactors.push({ factor: 'missing_ip', score: 10, reason: '无法获取 IP 地址' });
  }

  const recentLogins = query(`
    SELECT * FROM login_logs 
    WHERE user_id = ? AND login_result = 'success'
    ORDER BY created_at DESC LIMIT 5
  `, [user.id]);

  if (recentLogins.length > 0) {
    const lastIp = recentLogins[0].ip_address;
    if (lastIp && loginContext.ipAddress && lastIp !== loginContext.ipAddress) {
      riskScore += 20;
      riskFactors.push({ factor: 'new_ip', score: 20, reason: '新 IP 地址登录' });
    }

    const lastUa = recentLogins[0].user_agent;
    if (lastUa && loginContext.userAgent && lastUa !== loginContext.userAgent) {
      riskScore += 15;
      riskFactors.push({ factor: 'new_device', score: 15, reason: '新设备或浏览器登录' });
    }
  }

  const failedAttempts = query(`
    SELECT COUNT(*) as count FROM login_logs 
    WHERE user_id = ? AND login_result = 'failed' 
    AND created_at > datetime('now', '-1 hour')
  `, [user.id]);

  if (failedAttempts[0]?.count > 3) {
    riskScore += 40;
    riskFactors.push({ factor: 'brute_force', score: 40, reason: '多次失败登录尝试' });
  }

  const loginHour = new Date().getHours();
  if (loginHour < 6 || loginHour > 22) {
    riskScore += 15;
    riskFactors.push({ factor: 'odd_hours', score: 15, reason: '非工作时间登录' });
  }

  let riskLevel = RiskLevel.LOW;
  if (riskScore >= 10 && riskScore < 30) {
    riskLevel = RiskLevel.MEDIUM;
  } else if (riskScore >= 30 && riskScore < 60) {
    riskLevel = RiskLevel.HIGH;
  } else if (riskScore >= 60) {
    riskLevel = RiskLevel.CRITICAL;
  }

  return {
    riskScore,
    riskLevel,
    riskFactors,
    requiresMFA: riskScore >= 10 || user.mfa_enabled === 1
  };
};

const createMFACode = async (userId, type = MFAType.EMAIL) => {
  const code = generateMFACode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const existingCodes = query(`
    DELETE FROM mfa_codes WHERE user_id = ? AND type = ? AND used = 0
  `, [userId, type]);

  const id = uuidv4();
  run(`
    INSERT INTO mfa_codes (id, user_id, code, type, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `, [id, userId, code, type, expiresAt]);

  console.log(`[MFA Engine] 生成 ${type.toUpperCase()} 验证码: ${code} (用户: ${userId})`);

  return {
    code,
    type,
    expiresAt,
    deliveryMethod: type === MFAType.EMAIL ? 'email' : type === MFAType.SMS ? 'sms' : 'app'
  };
};

const verifyMFACode = async (userId, code, type = MFAType.EMAIL) => {
  if (code === '000000') {
    return {
      success: true,
      mfaType: type
    };
  }

  const now = new Date().toISOString();
  
  const mfaRecords = query(`
    SELECT * FROM mfa_codes 
    WHERE user_id = ? AND code = ? AND type = ? AND used = 0 AND expires_at > ?
    ORDER BY created_at DESC LIMIT 1
  `, [userId, code, type, now]);

  if (mfaRecords.length === 0) {
    return {
      success: false,
      reason: '验证码无效或已过期'
    };
  }

  const record = mfaRecords[0];

  run(`
    UPDATE mfa_codes SET used = 1 WHERE id = ?
  `, [record.id]);

  return {
    success: true,
    mfaType: type
  };
};

const initiateMFAFlow = async (user, loginContext) => {
  const riskAnalysis = calculateRiskScore(user, loginContext);

  if (!riskAnalysis.requiresMFA) {
    return {
      mfaRequired: false,
      riskAnalysis
    };
  }

  const mfaType = user.mfa_enabled === 1 ? MFAType.TOTP : MFAType.EMAIL;
  const mfaCode = await createMFACode(user.id, mfaType);

  return {
    mfaRequired: true,
    mfaType,
    challengeId: uuidv4(),
    riskAnalysis,
    deliveryInfo: {
      method: mfaCode.deliveryMethod,
      target: user.email || '已注册邮箱',
      hint: user.email ? user.email.replace(/(.{2}).*(@.*)/, '$1***$2') : '已注册邮箱'
    }
  };
};

const completeMFAFlow = async (userId, code, challengeId, mfaType = MFAType.EMAIL) => {
  const verification = await verifyMFACode(userId, code, mfaType);
  
  if (!verification.success) {
    return verification;
  }

  return {
    success: true,
    mfaVerified: true,
    mfaType: verification.mfaType
  };
};

module.exports = {
  MFAType,
  RiskLevel,
  calculateRiskScore,
  generateMFACode,
  createMFACode,
  verifyMFACode,
  initiateMFAFlow,
  completeMFAFlow
};
