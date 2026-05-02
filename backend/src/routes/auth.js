const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query, run } = require('../config/database');
const { initiateMFAFlow, completeMFAFlow, MFAType } = require('../services/mfaEngine');
const { generateMenuForUser, getUserPermissions } = require('../services/authorizationEngine');
const { logLogin, logAudit, ActionType, ResourceType } = require('../services/auditEngine');

const router = express.Router();

const getClientInfo = (req) => ({
  ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
  userAgent: req.get('User-Agent') || 'unknown',
  deviceFingerprint: req.headers['x-device-fingerprint'] || null
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientInfo = getClientInfo(req);

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名和密码不能为空'
      });
    }

    const users = query(`
      SELECT * FROM users WHERE username = ?
    `, [username]);

    if (users.length === 0) {
      logLogin({
        userId: null,
        username,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        loginResult: 'failed',
        failureReason: '用户不存在',
        riskScore: 10
      });

      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }

    const user = users[0];

    if (user.status === 'disabled') {
      logLogin({
        userId: user.id,
        username,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        loginResult: 'failed',
        failureReason: '账号已禁用',
        riskScore: 20
      });

      return res.status(403).json({
        success: false,
        error: '账号已被禁用，请联系管理员'
      });
    }

    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        error: '账号尚未激活，请先激活账号',
        requireActivation: true
      });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      logLogin({
        userId: user.id,
        username,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        loginResult: 'failed',
        failureReason: '密码错误',
        riskScore: 15
      });

      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }

    const mfaResult = await initiateMFAFlow(user, clientInfo);

    if (mfaResult.mfaRequired) {
      logAudit({
        userId: user.id,
        username: user.username,
        action: ActionType.MFA_INITIATE,
        resourceType: ResourceType.SESSION,
        details: { 
          mfaType: mfaResult.mfaType,
          riskLevel: mfaResult.riskAnalysis.riskLevel,
          riskScore: mfaResult.riskAnalysis.riskScore
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      return res.json({
        success: true,
        mfaRequired: true,
        mfaType: mfaResult.mfaType,
        challengeId: mfaResult.challengeId,
        deliveryInfo: mfaResult.deliveryInfo,
        riskAnalysis: mfaResult.riskAnalysis
      });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const token = jwt.sign(
      { userId: user.id, username: user.username, mfaVerified: false },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const sessionId = uuidv4();
    run(`
      INSERT INTO login_sessions (
        id, user_id, token, ip_address, user_agent,
        risk_score, mfa_verified, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
    `, [
      sessionId, user.id, token, clientInfo.ipAddress, clientInfo.userAgent,
      mfaResult.riskAnalysis.riskScore, 0, expiresAt
    ]);

    logLogin({
      userId: user.id,
      username: user.username,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      loginResult: 'success',
      riskScore: mfaResult.riskAnalysis.riskScore,
      mfaUsed: false
    });

    run(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`, [user.id]);

    const menuInfo = generateMenuForUser(user.id);
    const userAuth = getUserPermissions(user.id);

    res.json({
      success: true,
      mfaRequired: false,
      token,
      user: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        organizationId: user.organization_id,
        mfaEnabled: user.mfa_enabled === 1
      },
      menus: menuInfo.menus,
      permissions: menuInfo.permissions,
      roles: menuInfo.roles,
      session: {
        id: sessionId,
        expiresAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: '登录失败，请稍后重试'
    });
  }
});

router.post('/mfa/verify', async (req, res) => {
  try {
    const { username, password, code, challengeId, mfaType = MFAType.EMAIL } = req.body;
    const clientInfo = getClientInfo(req);

    if (!username || !password || !code) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      });
    }

    const users = query(`SELECT * FROM users WHERE username = ?`, [username]);
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }

    const user = users[0];
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }

    const verification = await completeMFAFlow(user.id, code, challengeId, mfaType);

    if (!verification.success) {
      logLogin({
        userId: user.id,
        username: user.username,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        loginResult: 'failed',
        failureReason: `MFA验证失败: ${verification.reason}`,
        riskScore: 25
      });

      return res.status(401).json({
        success: false,
        error: verification.reason || '验证码无效'
      });
    }

    logAudit({
      userId: user.id,
      username: user.username,
      action: ActionType.MFA_COMPLETE,
      resourceType: ResourceType.SESSION,
      details: { mfaType, verificationMethod: mfaType },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const token = jwt.sign(
      { userId: user.id, username: user.username, mfaVerified: true },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const sessionId = uuidv4();
    run(`
      INSERT INTO login_sessions (
        id, user_id, token, ip_address, user_agent,
        risk_score, mfa_verified, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
    `, [
      sessionId, user.id, token, clientInfo.ipAddress, clientInfo.userAgent,
      15, 1, expiresAt
    ]);

    logLogin({
      userId: user.id,
      username: user.username,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      loginResult: 'success',
      riskScore: 15,
      mfaUsed: true
    });

    run(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`, [user.id]);

    const menuInfo = generateMenuForUser(user.id);

    res.json({
      success: true,
      mfaVerified: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        organizationId: user.organization_id,
        mfaEnabled: user.mfa_enabled === 1
      },
      menus: menuInfo.menus,
      permissions: menuInfo.permissions,
      roles: menuInfo.roles,
      session: {
        id: sessionId,
        expiresAt
      }
    });

  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({
      success: false,
      error: '验证失败，请稍后重试'
    });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.decode(token);
      if (decoded?.userId) {
        run(`
          UPDATE login_sessions SET revoked_at = datetime('now') 
          WHERE user_id = ? AND revoked_at IS NULL
        `, [decoded.userId]);

        logAudit({
          userId: decoded.userId,
          action: ActionType.LOGOUT,
          resourceType: ResourceType.SESSION
        });
      }
    }

    res.json({
      success: true,
      message: '已成功登出'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: '登出失败'
    });
  }
});

router.post('/activate', async (req, res) => {
  try {
    const { username, activationCode, newPassword } = req.body;

    if (!username || !newPassword) {
      return res.status(400).json({
        success: false,
        error: '用户名和新密码不能为空'
      });
    }

    const users = query(`SELECT * FROM users WHERE username = ?`, [username]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    const user = users[0];

    if (user.status === 'active') {
      return res.status(400).json({
        success: false,
        error: '账号已激活'
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    run(`
      UPDATE users 
      SET password_hash = ?, status = 'active', updated_at = datetime('now')
      WHERE id = ?
    `, [passwordHash, user.id]);

    logAudit({
      userId: user.id,
      username: user.username,
      action: ActionType.USER_STATUS_CHANGE,
      resourceType: ResourceType.USER,
      resourceId: user.id,
      details: { oldStatus: user.status, newStatus: 'active', reason: '账号激活' }
    });

    res.json({
      success: true,
      message: '账号激活成功，请登录'
    });

  } catch (error) {
    console.error('Activation error:', error);
    res.status(500).json({
      success: false,
      error: '激活失败，请稍后重试'
    });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: '未登录'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const users = query(`SELECT * FROM users WHERE id = ?`, [decoded.userId]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    const user = users[0];
    const menuInfo = generateMenuForUser(user.id);
    const loginLogs = query(`
      SELECT * FROM login_logs 
      WHERE user_id = ? AND login_result = 'success'
      ORDER BY created_at DESC LIMIT 10
    `, [user.id]);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        organizationId: user.organization_id,
        mfaEnabled: user.mfa_enabled === 1,
        lastLoginAt: user.last_login_at
      },
      menus: menuInfo.menus,
      permissions: menuInfo.permissions,
      roles: menuInfo.roles,
      recentLoginLogs: loginLogs
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token 无效或已过期'
      });
    }
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: '获取用户信息失败'
    });
  }
});

module.exports = router;
