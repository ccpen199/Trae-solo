import { Router } from 'express';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.js';
import { success, error, paginated } from '../utils/response.js';
import { queryMany, queryOne, execute } from '../db.js';
import type { RiskAlert, SpeechLog, WithdrawRequest, GeoFence } from '../../shared/types.js';

const router = Router();

const SENSITIVE_WORDS = ['包治百病', '根治', '治愈', '保证', '百分百', '月入', '暴富', '躺赚', '零风险', '高回报'];

function detectSensitiveWords(content: string): { words: string[]; score: number } {
  const found: string[] = [];
  for (const word of SENSITIVE_WORDS) {
    if (content.includes(word)) {
      found.push(word);
    }
  }
  let score = 0;
  if (found.length >= 3) score = 95;
  else if (found.length === 2) score = 80;
  else if (found.length === 1) score = 60;
  return { words: found, score };
}

function assessWithdrawRisk(amount: number, userId: number): { level: string; reasons: string[] } {
  const reasons: string[] = [];
  
  if (amount > 100000) reasons.push('单笔金额超过10万');
  if (amount > 50000) reasons.push('单笔金额超过5万，需反洗钱核查');
  
  const recentCount = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM withdraw_requests WHERE user_id = ? AND created_at >= datetime("now", "-7 days")',
    [userId]
  );
  
  if ((recentCount?.count || 0) >= 3) reasons.push('本周提现超过3次');
  
  let level = 'normal';
  if (reasons.length >= 2) level = 'high_risk';
  else if (reasons.length === 1) level = 'warning';
  
  return { level, reasons };
}

router.get('/alerts', authMiddleware, roleMiddleware(['operator', 'admin']), (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const level = req.query.level as string;
    const status = req.query.status as string;

    let whereClause = '';
    const params: unknown[] = [];

    if (level) {
      whereClause += 'WHERE level = ?';
      params.push(level);
    }
    if (status) {
      whereClause += whereClause ? ' AND status = ?' : 'WHERE status = ?';
      params.push(status);
    }

    const offset = (page - 1) * pageSize;

    const alerts = queryMany<RiskAlert>(
      `SELECT * FROM risk_alerts ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const countResult = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM risk_alerts ${whereClause}`,
      params
    );

    res.json(paginated(alerts, countResult?.count || 0, page, pageSize));
  } catch {
    res.status(500).json(error('获取风控告警失败', 500));
  }
});

router.get('/speech/logs', authMiddleware, roleMiddleware(['operator', 'admin']), (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const auditStatus = req.query.auditStatus as string;

    let whereClause = '';
    const params: unknown[] = [];

    if (auditStatus) {
      whereClause = 'WHERE audit_status = ?';
      params.push(auditStatus);
    }

    const offset = (page - 1) * pageSize;

    const logs = queryMany<SpeechLog>(
      `SELECT sl.*, 
        s.real_name as sender_name,
        r.real_name as receiver_name
       FROM speech_logs sl
       LEFT JOIN users s ON sl.sender_id = s.id
       LEFT JOIN users r ON sl.receiver_id = r.id
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const countResult = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM speech_logs ${whereClause}`,
      params
    );

    const transformed = logs.map(l => ({
      ...l,
      senderName: (l as unknown as { sender_name: string }).sender_name,
      receiverName: (l as unknown as { receiver_name: string }).receiver_name,
      sensitiveWords: (l as unknown as { sensitive_words: string }).sensitive_words ? JSON.parse((l as unknown as { sensitive_words: string }).sensitive_words) : [],
      auditStatus: (l as unknown as { audit_status: string }).audit_status as 'pending' | 'approved' | 'rejected',
      createdAt: (l as unknown as { created_at: string }).created_at,
    }));

    res.json(paginated(transformed, countResult?.count || 0, page, pageSize));
  } catch {
    res.status(500).json(error('获取话术记录失败', 500));
  }
});

router.post('/speech/audit', authMiddleware, roleMiddleware(['operator', 'admin']), (req: AuthRequest, res) => {
  try {
    const { logId, auditStatus, auditNotes } = req.body;
    const userId = req.user?.userId;

    execute(
      'UPDATE speech_logs SET audit_status = ?, audit_notes = ? WHERE id = ?',
      [auditStatus, auditNotes || null, logId]
    );

    const log = queryOne<{ risk_score: number; sender_id: number; sender_name: string; content: string }>(
      `SELECT sl.*, u.real_name as sender_name 
       FROM speech_logs sl LEFT JOIN users u ON sl.sender_id = u.id 
       WHERE sl.id = ?`,
      [logId]
    );

    if (auditStatus === 'rejected' && log) {
      execute(
        'INSERT INTO risk_alerts (type, level, title, description, user_id, user_name, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['speech', log.risk_score >= 80 ? 'high' : 'medium', '敏感话术违规', log.content, log.sender_id, log.sender_name, 'pending']
      );
    }

    res.json(success({ audited: true }, '审核完成'));
  } catch {
    res.status(500).json(error('审核失败', 500));
  }
});

router.get('/withdraw/pending', authMiddleware, roleMiddleware(['operator', 'admin']), (req, res) => {
  try {
    const requests = queryMany<WithdrawRequest>(
      'SELECT * FROM withdraw_requests WHERE status = ? ORDER BY created_at DESC',
      ['pending']
    );

    const transformed = requests.map(w => ({
      ...w,
      userId: (w as unknown as { user_id: number }).user_id,
      userName: (w as unknown as { user_name: string }).user_name,
      bankInfo: (w as unknown as { bank_info: string }).bank_info,
      riskLevel: (w as unknown as { risk_level: string }).risk_level as 'normal' | 'warning' | 'high_risk',
      riskReasons: (w as unknown as { risk_reasons: string }).risk_reasons ? JSON.parse((w as unknown as { risk_reasons: string }).risk_reasons) : [],
      createdAt: (w as unknown as { created_at: string }).created_at,
    }));

    res.json(success(transformed));
  } catch {
    res.status(500).json(error('获取提现申请失败', 500));
  }
});

router.post('/withdraw/audit', authMiddleware, roleMiddleware(['operator', 'admin']), (req: AuthRequest, res) => {
  try {
    const { requestId, status, auditNotes } = req.body;
    const userId = req.user?.userId;

    execute(
      'UPDATE withdraw_requests SET status = ?, audited_by = ?, audited_at = CURRENT_TIMESTAMP, audit_notes = ? WHERE id = ?',
      [status, userId, auditNotes || null, requestId]
    );

    res.json(success({ audited: true }, `提现${status === 'approved' ? '通过' : '拒绝'}`));
  } catch {
    res.status(500).json(error('审核失败', 500));
  }
});

router.get('/geofence', authMiddleware, roleMiddleware(['operator', 'admin']), (req, res) => {
  try {
    const fences = queryMany<GeoFence>(
      'SELECT * FROM geofences ORDER BY created_at DESC'
    );

    const transformed = fences.map(f => ({
      ...f,
      coordinates: JSON.parse((f as unknown as { coordinates: string }).coordinates),
      allowedRoles: JSON.parse((f as unknown as { allowed_roles_json: string }).allowed_roles_json),
      isActive: !!(f as unknown as { is_active: number }).is_active,
    }));

    res.json(success(transformed));
  } catch {
    res.status(500).json(error('获取地理围栏失败', 500));
  }
});

router.post('/geofence/check', authMiddleware, roleMiddleware(['sales', 'store_owner']), (req: AuthRequest, res) => {
  try {
    const { lat, lng } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const fences = queryMany<{ id: number; name: string; region: string; coordinates_json: string; allowed_roles_json: string }>(
      'SELECT * FROM geofences WHERE is_active = 1'
    );

    let allowed = true;
    let violatedFence: string | null = null;

    for (const fence of fences) {
      const coords = JSON.parse(fence.coordinates_json);
      const allowedRoles = JSON.parse(fence.allowed_roles_json);
      
      if (allowedRoles.includes(userRole)) {
        const inside = isPointInPolygon(lat, lng, coords);
        if (!inside) {
          allowed = false;
          violatedFence = fence.name;
          
          const user = queryOne<{ real_name: string }>('SELECT real_name FROM users WHERE id = ?', [userId]);
          execute(
            'INSERT INTO risk_alerts (type, level, title, description, user_id, user_name, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['geofence', 'medium', '越界展业告警', `检测到在${fence.name}非授权区域展业`, userId, user?.real_name, 'pending']
          );
          break;
        }
      }
    }

    res.json(success({ allowed, violatedFence }, allowed ? '在授权区域内' : '越界告警已记录'));
  } catch {
    res.status(500).json(error('检查失败', 500));
  }
});

function isPointInPolygon(lat: number, lng: number, polygon: Array<{ lat: number; lng: number }>): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    
    if (((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

router.post('/speech/analyze', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { content, receiverId } = req.body;
    const senderId = req.user?.userId;

    const { words, score } = detectSensitiveWords(content);
    const conversationId = 'conv_' + Date.now().toString(36);

    execute(
      'INSERT INTO speech_logs (conversation_id, sender_id, receiver_id, content, sensitive_words, risk_score) VALUES (?, ?, ?, ?, ?, ?)',
      [conversationId, senderId, receiverId || null, content, JSON.stringify(words), score]
    );

    if (score >= 60) {
      const user = queryOne<{ real_name: string }>('SELECT real_name FROM users WHERE id = ?', [senderId]);
      execute(
        'INSERT INTO risk_alerts (type, level, title, description, user_id, user_name, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          'speech', 
          score >= 80 ? 'high' : 'medium', 
          '敏感话术检测告警', 
          `检测到敏感词：${words.join('、')}`, 
          senderId, 
          user?.real_name, 
          'pending'
        ]
      );
    }

    res.json(success({
      riskScore: score,
      sensitiveWords: words,
      isViolation: score >= 60,
    }));
  } catch {
    res.status(500).json(error('分析失败', 500));
  }
});

export default router;
