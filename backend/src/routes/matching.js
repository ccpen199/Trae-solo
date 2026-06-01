const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../utils/db');

const SENSITIVE_WORDS = ['中奖', '转账', '汇款', '投资', '刷单', '博彩', '色情', '小姐', '包养', '约炮', '红包', '打赏'];

function detectSensitiveWords(text) {
  const found = [];
  if (!text) return found;
  for (const word of SENSITIVE_WORDS) {
    if (text.includes(word)) found.push(word);
  }
  return found;
}

function calculateMatchScore(profileA, profileB) {
  let score = 0;
  const reasons = [];
  
  if (Math.abs(profileA.age - profileB.age) <= 5) { score += 15; reasons.push('年龄匹配'); }
  else if (Math.abs(profileA.age - profileB.age) <= 10) { score += 8; reasons.push('年龄差距适中'); }
  
  if (profileA.city === profileB.city) { score += 20; reasons.push('同城市'); }
  else {
    const nearby = { '上海': ['苏州', '杭州', '南京'], '北京': ['天津'], '深圳': ['广州'], '杭州': ['上海', '苏州'], '苏州': ['上海', '杭州'] };
    if (nearby[profileA.city]?.includes(profileB.city)) { score += 12; reasons.push('地域相近'); }
  }
  
  const eduLevel = { '高中': 1, '大专': 2, '本科': 3, '硕士': 4, '博士': 5 };
  const eduA = eduLevel[profileA.education] || 0;
  const eduB = eduLevel[profileB.education] || 0;
  if (Math.abs(eduA - eduB) <= 1) { score += 15; reasons.push('学历相当'); }
  
  if (profileA.marital_status === profileB.marital_status) { score += 15; reasons.push('婚史匹配'); }
  
  if (profileA.values_marriage && profileB.values_marriage && profileA.values_marriage === profileB.values_marriage) {
    score += 15; reasons.push('婚姻观一致');
  }
  
  if (profileA.hobbies && profileB.hobbies) {
    const hA = profileA.hobbies.split(/[,，、]/);
    const hB = profileB.hobbies.split(/[,，、]/);
    const common = hA.filter(h => hB.includes(h.trim()));
    if (common.length >= 2) { score += 10; reasons.push(`兴趣相投: ${common.slice(0, 2).join(',')}`); }
  }
  
  if (profileA.is_vip || profileB.is_vip) score += 5;
  
  return { score: Math.min(score, 100), reasons };
}

router.post('/generate', (req, res) => {
  const { profile_id, filters, limit = 10 } = req.body;
  
  const profile = getQuery('SELECT * FROM profiles WHERE id = ? AND status = ?', [profile_id, 'active']);
  if (!profile) return res.status(404).json({ ok: false, error: 'profile_not_found' });
  
  const blacklisted = allQuery('SELECT blocked_profile_id FROM blacklist WHERE profile_id = ?', [profile_id]).map(b => b.blocked_profile_id);
  const blockedMe = allQuery('SELECT profile_id FROM blacklist WHERE blocked_profile_id = ?', [profile_id]).map(b => b.profile_id);
  const safetyBlocked = allQuery('SELECT blocked_profile_id FROM safety_blocks WHERE status = ?', ['active']).map(b => b.blocked_profile_id);
  const excludeIds = [...new Set([...blacklisted, ...blockedMe, ...safetyBlocked, profile_id])];
  
  let sql = 'SELECT * FROM profiles WHERE status = ? AND gender != ?';
  let params = ['active', profile.gender === '男' ? '女' : '男'];
  
  if (excludeIds.length > 0) {
    sql += ` AND id NOT IN (${excludeIds.map(() => '?').join(',')})`;
    params.push(...excludeIds);
  }
  
  if (filters) {
    if (filters.min_age) { sql += ' AND age >= ?'; params.push(filters.min_age); }
    if (filters.max_age) { sql += ' AND age <= ?'; params.push(filters.max_age); }
    if (filters.city) { sql += ' AND city = ?'; params.push(filters.city); }
    if (filters.education) { sql += ' AND education LIKE ?'; params.push(`%${filters.education}%`); }
    if (filters.marital_status) { sql += ' AND marital_status = ?'; params.push(filters.marital_status); }
    if (filters.verified_only) sql += ' AND real_name_verified = 1 AND photo_verified = 1';
    if (filters.mate_hobbies) {
      const hobbies = filters.mate_hobbies.split(/[,，、]/);
      sql += ` AND (${hobbies.map(() => 'hobbies LIKE ?').join(' OR ')})`;
      params.push(...hobbies.map(h => `%${h.trim()}%`));
    }
  }
  
  sql += ' ORDER BY is_vip DESC, compatibility DESC LIMIT ?';
  params.push(limit * 3);
  
  const candidates = allQuery(sql, params);
  const results = candidates.map(c => {
    const { score, reasons } = calculateMatchScore(profile, c);
    return { profile: c, match_score: score, match_reasons: reasons.join(', '), is_match: score >= 70 };
  }).sort((a, b) => b.match_score - a.match_score).slice(0, limit);
  
  res.json({ ok: true, source_profile: { id: profile.id, name: profile.name }, candidates: results });
});

router.get('/matches', (req, res) => {
  const { profile_id, status } = req.query;
  
  let sql = `
    SELECT m.*, 
           pa.name as a_name, pa.city as a_city, pa.age as a_age, pa.photo_url as a_photo, pa.real_name_verified as a_verified,
           pb.name as b_name, pb.city as b_city, pb.age as b_age, pb.photo_url as b_photo, pb.real_name_verified as b_verified,
           r.recommendation_reason, r.a_feedback, r.b_feedback, r.status as rec_status
    FROM matches m
    JOIN profiles pa ON pa.id = m.profile_a_id
    JOIN profiles pb ON pb.id = m.profile_b_id
    LEFT JOIN matchmaker_recommendations r ON r.match_id = m.id
    WHERE (m.profile_a_id = ? OR m.profile_b_id = ?)
  `;
  let params = [profile_id, profile_id];
  
  if (status) { sql += ' AND m.status = ?'; params.push(status); }
  sql += ' ORDER BY m.matched_at DESC, m.created_at DESC LIMIT 50';
  
  const matches = allQuery(sql, params);
  res.json({ ok: true, matches });
});

router.post('/matches', (req, res) => {
  const { profile_a_id, profile_b_id, created_by } = req.body;
  
  const exists = getQuery('SELECT * FROM matches WHERE (profile_a_id = ? AND profile_b_id = ?) OR (profile_a_id = ? AND profile_b_id = ?)',
    [profile_a_id, profile_b_id, profile_b_id, profile_a_id]);
  if (exists) return res.status(400).json({ ok: false, error: 'match_exists', match: exists });
  
  const pa = getQuery('SELECT * FROM profiles WHERE id = ?', [profile_a_id]);
  const pb = getQuery('SELECT * FROM profiles WHERE id = ?', [profile_b_id]);
  const { score, reasons } = calculateMatchScore(pa, pb);
  
  const result = runQuery(`
    INSERT INTO matches (profile_a_id, profile_b_id, match_score, match_reasons, status, created_by)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `, [profile_a_id, profile_b_id, score, reasons.join(', '), created_by || null]);
  
  runQuery(`INSERT INTO audit_logs (action, target_type, target_id, new_value) VALUES (?, ?, ?, ?)`,
    ['create_match', 'match', result.lastInsertRowid, JSON.stringify({ profile_a_id, profile_b_id, match_score: score })]);
  
  res.json({ ok: true, id: result.lastInsertRowid, match_score: score });
});

router.put('/matches/:id/like', (req, res) => {
  const { profile_id, liked } = req.body;
  const match = getQuery('SELECT * FROM matches WHERE id = ?', [req.params.id]);
  if (!match) return res.status(404).json({ ok: false, error: 'match_not_found' });
  
  const isA = match.profile_a_id === Number(profile_id);
  const field = isA ? 'a_liked' : 'b_liked';
  const otherField = isA ? 'b_liked' : 'a_liked';
  
  runQuery(`UPDATE matches SET ${field} = ? WHERE id = ?`, [liked ? 1 : 0, req.params.id]);
  
  const updated = getQuery('SELECT * FROM matches WHERE id = ?', [req.params.id]);
  if (updated.a_liked && updated.b_liked && updated.status !== 'matched') {
    runQuery(`UPDATE matches SET status = 'matched', matched_at = CURRENT_TIMESTAMP WHERE id = ?`, [req.params.id]);
    res.json({ ok: true, status: 'matched', message: '双方互喜欢，配对成功！' });
  } else {
    res.json({ ok: true, status: updated.status });
  }
});

router.post('/conversations', (req, res) => {
  const { match_id, profile_id, content } = req.body;
  
  const sensitive = detectSensitiveWords(content);
  const hasSensitive = sensitive.length > 0;
  
  const result = runQuery(`
    INSERT INTO messages (conversation_id, sender_profile_id, content, has_sensitive_words, sensitive_words, is_blocked)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [match_id, profile_id, content, hasSensitive ? 1 : 0, sensitive.join(','), hasSensitive ? 1 : 0]);
  
  if (hasSensitive) {
    runQuery(`INSERT INTO sensitive_word_logs (profile_id, message_id, content, sensitive_words, source) VALUES (?, ?, ?, ?, ?)`,
      [profile_id, result.lastInsertRowid, content, sensitive.join(','), 'chat_message']);
    
    const p = getQuery('SELECT risk_score FROM profiles WHERE id = ?', [profile_id]);
    runQuery('UPDATE profiles SET risk_score = risk_score + 10 WHERE id = ?', [profile_id]);
    
    if ((p.risk_score || 0) + 10 >= 50) {
      runQuery(`INSERT INTO fraud_risks (profile_id, risk_type, risk_level, risk_evidence, risk_score, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [profile_id, 'sensitive_words', 'medium', `多次发送敏感词: ${sensitive.join(',')}`, p.risk_score + 10, 'monitored']);
    }
  }
  
  runQuery(`
    UPDATE conversations 
    SET last_message = ?, last_message_at = CURRENT_TIMESTAMP, 
        message_count = message_count + 1, has_sensitive_words = has_sensitive_words | ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE match_id = ? AND profile_id = ?
  `, [content, hasSensitive ? 1 : 0, match_id, profile_id]);
  
  runQuery(`INSERT INTO audit_logs (action, target_type, target_id, new_value) VALUES (?, ?, ?, ?)`,
    ['send_message', 'message', result.lastInsertRowid, JSON.stringify({ match_id, profile_id, has_sensitive })]);
  
  res.json({ ok: true, id: result.lastInsertRowid, blocked: hasSensitive, sensitive_words: sensitive });
});

router.get('/conversations', (req, res) => {
  const { profile_id } = req.query;
  
  const conversations = allQuery(`
    SELECT c.*, m.id as match_id, m.match_score, m.status as match_status,
           p.name, p.age, p.city, p.photo_url, p.real_name_verified
    FROM conversations c
    JOIN matches m ON m.id = c.match_id
    JOIN profiles p ON p.id = CASE WHEN m.profile_a_id = ? THEN m.profile_b_id ELSE m.profile_a_id END
    WHERE c.profile_id = ?
    ORDER BY c.last_message_at DESC
  `, [profile_id, profile_id]);
  
  res.json({ ok: true, conversations });
});

router.get('/messages/:conversationId', (req, res) => {
  const messages = allQuery(`
    SELECT m.*, p.name as sender_name
    FROM messages m
    JOIN profiles p ON p.id = m.sender_profile_id
    WHERE m.conversation_id = ?
    ORDER BY m.created_at ASC
    LIMIT 100
  `, [req.params.conversationId]);
  
  res.json({ ok: true, messages });
});

module.exports = router;
