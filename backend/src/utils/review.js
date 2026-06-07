const db = require('../models/database');

function aiReview(contentId, title, body) {
  const sensitiveWords = db.prepare(
    'SELECT word, severity, category FROM sensitive_words WHERE is_enabled = 1'
  ).all();

  const textToCheck = (title || '') + ' ' + (body || '');
  const found = [];

  for (const sw of sensitiveWords) {
    if (textToCheck.includes(sw.word)) {
      found.push(sw);
    }
  }

  const hasHigh = found.some(f => f.severity === 'high');
  const hasMedium = found.some(f => f.severity === 'medium');

  let action = 'approve';
  let note = 'AI审核通过';

  if (hasHigh) {
    action = 'reject';
    note = `AI审核拦截：检测到高危敏感词 [${found.filter(f => f.severity === 'high').map(f => f.word).join(', ')}]`;
  } else if (hasMedium) {
    action = 'flag';
    note = `AI审核标记：检测到中危敏感词 [${found.filter(f => f.severity === 'medium').map(f => f.word).join(', ')}]，需人工复审`;
  } else if (found.some(f => f.severity === 'low')) {
    action = 'approve';
    note = `AI审核通过（含低危词：${found.filter(f => f.severity === 'low').map(f => f.word).join(', ')}）`;
  }

  const { v4: uuidv4 } = require('uuid');
  const logId = uuidv4();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO review_logs (id, content_id, reviewer_id, review_type, action, note, created_at) VALUES (?, ?, NULL, \'ai\', ?, ?, ?)'
  ).run(logId, contentId, action, note, now);

  let reviewStatus = 'ai_approved';
  if (action === 'reject') {
    reviewStatus = 'rejected';
  } else if (action === 'flag') {
    reviewStatus = 'pending';
  }

  db.prepare(
    'UPDATE contents SET review_status = ?, review_note = ?, reviewed_at = ? WHERE id = ?'
  ).run(reviewStatus, note, now, contentId);

  return { action, note, reviewStatus };
}

module.exports = { aiReview };
