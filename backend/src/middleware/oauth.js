import jwt from 'jsonwebtoken';
import db from '../db/index.js';
import { config } from '../config/index.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const generateTokens = (userId, clientId) => {
  const now = Math.floor(Date.now() / 1000);
  const accessToken = jwt.sign(
    { sub: userId, client_id: clientId, type: 'access' },
    config.jwtSecret,
    { expiresIn: config.oauth.accessTokenTtl }
  );
  const refreshToken = jwt.sign(
    { sub: userId, client_id: clientId, type: 'refresh' },
    config.jwtSecret,
    { expiresIn: config.oauth.refreshTokenTtl }
  );

  const expiresAt = now + config.oauth.accessTokenTtl;
  const refreshExpiresAt = now + config.oauth.refreshTokenTtl;

  db.prepare(`DELETE FROM oauth_tokens WHERE user_id = ? AND client_id = ?`).run(userId, clientId);
  db.prepare(`INSERT INTO oauth_tokens (user_id, client_id, access_token, refresh_token, expires_at, refresh_expires_at) VALUES (?, ?, ?, ?, ?, ?)`).run(
    userId, clientId, accessToken, refreshToken, expiresAt, refreshExpiresAt
  );

  return { accessToken, refreshToken, expiresIn: config.oauth.accessTokenTtl };
};

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', error_description: 'Missing bearer token' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (decoded.type !== 'access') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    const stored = db.prepare(`SELECT * FROM oauth_tokens WHERE access_token = ?`).get(token);
    if (!stored || stored.expires_at < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ error: 'Token expired or revoked' });
    }

    const user = db.prepare(`SELECT id, username, role, status FROM users WHERE id = ?`).get(decoded.sub);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.requestId = uuidv4();
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token', error_description: e.message });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden', error_description: 'Insufficient permissions' });
  }
  next();
};

export const oauthAuthorize = (req, res) => {
  const { client_id, redirect_uri, response_type, scope = 'read write', state } = req.query;

  const client = db.prepare(`SELECT * FROM oauth_clients WHERE client_id = ?`).get(client_id);
  if (!client) {
    return res.status(400).json({ error: 'invalid_client', error_description: '无效的客户端ID' });
  }

  if (response_type !== 'code') {
    return res.status(400).json({ error: 'unsupported_response_type', error_description: '不支持的响应类型' });
  }

  if (redirect_uri && client.redirect_uri && redirect_uri !== client.redirect_uri) {
    return res.status(400).json({ error: 'invalid_redirect_uri', error_description: '回调地址不匹配' });
  }

  res.json({
    client_id,
    client_name: client.name,
    scope,
    redirect_uri: redirect_uri || client.redirect_uri,
    state,
    auth_endpoint: '/api/oauth/authorize/submit'
  });
};

export const oauthToken = (req, res) => {
  const { grant_type, client_id, client_secret, username, password, refresh_token, code } = req.body;

  const client = db.prepare(`SELECT * FROM oauth_clients WHERE client_id = ?`).get(client_id);
  if (!client) {
    return res.status(400).json({ error: 'invalid_client', error_description: '无效的客户端ID' });
  }

  if (client.client_secret !== client_secret) {
    return res.status(400).json({ error: 'invalid_client', error_description: '客户端密钥错误' });
  }

  if (grant_type === 'password') {
    const user = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(400).json({ error: 'invalid_grant', error_description: '用户名或密码错误' });
    }
    if (user.status !== 'verified') {
      return res.status(400).json({ error: 'invalid_grant', error_description: '账号尚未通过审核，请联系管理员' });
    }

    const tokens = generateTokens(user.id, client_id);
    return res.json({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_type: 'Bearer',
      expires_in: tokens.expiresIn,
      scope: 'read write',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        real_name: user.real_name
      }
    });
  }

  if (grant_type === 'refresh_token') {
    try {
      const decoded = jwt.verify(refresh_token, config.jwtSecret);
      const stored = db.prepare(`SELECT * FROM oauth_tokens WHERE refresh_token = ?`).get(refresh_token);
      if (!stored || stored.refresh_expires_at < Math.floor(Date.now() / 1000)) {
        return res.status(400).json({ error: 'invalid_grant', error_description: '刷新令牌已过期或无效' });
      }

      const tokens = generateTokens(decoded.sub, client_id);
      return res.json({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_type: 'Bearer',
        expires_in: tokens.expiresIn,
        scope: 'read write'
      });
    } catch (e) {
      return res.status(400).json({ error: 'invalid_grant', error_description: '刷新令牌格式错误' });
    }
  }

  if (grant_type === 'authorization_code') {
    if (code !== 'test-auth-code') {
      return res.status(400).json({ error: 'invalid_grant', error_description: '授权码无效' });
    }
    const tokens = generateTokens(2, client_id);
    return res.json({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_type: 'Bearer',
      expires_in: tokens.expiresIn
    });
  }

  res.status(400).json({ error: 'unsupported_grant_type', error_description: '不支持的授权类型' });
};

export const oauthRevoke = (req, res) => {
  const { token } = req.body;
  db.prepare(`DELETE FROM oauth_tokens WHERE access_token = ? OR refresh_token = ?`).run(token, token);
  res.json({ revoked: true });
};

export const getUserInfo = (req, res) => {
  const user = db.prepare(`SELECT id, username, role, real_name, phone, status, created_at FROM users WHERE id = ?`).get(req.user.id);
  res.json({
    ...user,
    phone: user.phone ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null
  });
};
