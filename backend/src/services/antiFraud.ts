import { getDB } from '../db/init';

export function checkDeviceFingerprint(userId: number, fingerprint: string | null): { valid: boolean; reason?: string } {
  if (!fingerprint) {
    return { valid: false, reason: 'Device fingerprint required' };
  }
  const db = getDB();
  const user = db.prepare('SELECT device_fingerprint FROM users WHERE id = ?').get(userId) as { device_fingerprint: string | null } | undefined;
  if (!user) {
    return { valid: false, reason: 'User not found' };
  }
  if (!user.device_fingerprint) {
    db.prepare('UPDATE users SET device_fingerprint = ? WHERE id = ?').run(fingerprint, userId);
    return { valid: true };
  }
  if (user.device_fingerprint !== fingerprint) {
    return { valid: false, reason: 'Device fingerprint mismatch' };
  }
  return { valid: true };
}

export function checkIpFrequency(ip: string, action: string, maxPerMinute: number = 10): { allowed: boolean; count: number } {
  const db = getDB();
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM user_behaviors
    WHERE ip_address = ? AND action = ? AND created_at > datetime('now', '-1 minute')
  `).get(ip, action) as { count: number };

  return { allowed: result.count < maxPerMinute, count: result.count };
}

export function analyzeBehaviorSequence(userId: number): { suspicious: boolean; score: number; reasons: string[] } {
  const db = getDB();
  const reasons: string[] = [];
  let score = 0;

  const recentBehaviors = db.prepare(`
    SELECT * FROM user_behaviors WHERE user_id = ? ORDER BY created_at DESC LIMIT 100
  `).all(userId) as any[];

  if (recentBehaviors.length > 50) {
    const timeSpan = new Date(recentBehaviors[0].created_at).getTime() - new Date(recentBehaviors[recentBehaviors.length - 1].created_at).getTime();
    const avgInterval = timeSpan / recentBehaviors.length;
    if (avgInterval < 500) {
      score += 30;
      reasons.push('Behavior too frequent');
    }
  }

  const likeActions = recentBehaviors.filter(b => b.action === 'like');
  if (likeActions.length > 20) {
    const likeTimeSpan = likeActions.length > 1
      ? new Date(likeActions[0].created_at).getTime() - new Date(likeActions[likeActions.length - 1].created_at).getTime()
      : 0;
    if (likeTimeSpan < 60000 && likeActions.length > 10) {
      score += 25;
      reasons.push('Like spam detected');
    }
  }

  const viewActions = recentBehaviors.filter(b => b.action === 'view');
  const shortViews = viewActions.filter(b => b.dwell_time < 500);
  if (shortViews.length > 15) {
    score += 20;
    reasons.push('Too many short views');
  }

  const uniqueTargets = new Set(recentBehaviors.map(b => b.target_id)).size;
  if (recentBehaviors.length > 20 && uniqueTargets / recentBehaviors.length < 0.3) {
    score += 15;
    reasons.push('Low target diversity');
  }

  return { suspicious: score >= 40, score, reasons };
}

export function validateTaskCompletion(userId: number, taskId: number, fingerprint?: string, ipAddress?: string): { valid: boolean; reason?: string } {
  const db = getDB();

  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND status = ?').get(taskId, 'active') as any;
  if (!task) {
    return { valid: false, reason: 'Task not found or not active' };
  }

  const now = new Date();
  if (task.end_time && new Date(task.end_time) < now) {
    return { valid: false, reason: 'Task has expired' };
  }
  if (task.start_time && new Date(task.start_time) > now) {
    return { valid: false, reason: 'Task not started yet' };
  }

  if (task.current_completions >= task.max_completions) {
    return { valid: false, reason: 'Task max completions reached' };
  }

  const existing = db.prepare('SELECT * FROM user_tasks WHERE user_id = ? AND task_id = ?').get(userId, taskId) as any;
  if (existing) {
    return { valid: false, reason: 'Task already completed by user' };
  }

  if (fingerprint) {
    const deviceCheck = checkDeviceFingerprint(userId, fingerprint);
    if (!deviceCheck.valid) {
      return { valid: false, reason: deviceCheck.reason };
    }
  }

  if (ipAddress) {
    const ipCheck = checkIpFrequency(ipAddress, 'task_complete', 5);
    if (!ipCheck.allowed) {
      return { valid: false, reason: 'IP frequency limit exceeded' };
    }
  }

  const behaviorAnalysis = analyzeBehaviorSequence(userId);
  if (behaviorAnalysis.suspicious) {
    return { valid: false, reason: `Suspicious behavior detected: ${behaviorAnalysis.reasons.join(', ')}` };
  }

  try {
    const rules = JSON.parse(task.anti_cheat_rules || '{}');
    if (rules.new_user_only) {
      const user = db.prepare('SELECT created_at FROM users WHERE id = ?').get(userId) as any;
      if (user && (now.getTime() - new Date(user.created_at).getTime()) > 7 * 86400000) {
        return { valid: false, reason: 'New user only task' };
      }
    }
    if (rules.max_per_day) {
      const todayCompletions = db.prepare(`
        SELECT COUNT(*) as count FROM user_tasks
        WHERE user_id = ? AND task_id = ? AND date(completed_at) = date('now')
      `).get(userId, taskId) as { count: number };
      if (todayCompletions.count >= rules.max_per_day) {
        return { valid: false, reason: 'Daily completion limit reached' };
      }
    }
  } catch {}

  return { valid: true };
}

export function detectAnomalousPatterns(userId: number): { anomalous: boolean; patterns: string[] } {
  const db = getDB();
  const patterns: string[] = [];

  const recentActions = db.prepare(`
    SELECT action, COUNT(*) as count FROM user_behaviors
    WHERE user_id = ? AND created_at > datetime('now', '-1 hour')
    GROUP BY action
  `).all(userId) as any[];

  for (const ra of recentActions) {
    if (ra.action === 'like' && ra.count > 30) {
      patterns.push(`Excessive likes: ${ra.count} in last hour`);
    }
    if (ra.action === 'share' && ra.count > 20) {
      patterns.push(`Excessive shares: ${ra.count} in last hour`);
    }
    if (ra.action === 'comment' && ra.count > 15) {
      patterns.push(`Excessive comments: ${ra.count} in last hour`);
    }
  }

  const todayTasks = db.prepare(`
    SELECT COUNT(*) as count FROM user_tasks
    WHERE user_id = ? AND date(completed_at) = date('now')
  `).get(userId) as { count: number };
  if (todayTasks.count > 10) {
    patterns.push(`Too many tasks completed today: ${todayTasks.count}`);
  }

  const deviceChanges = db.prepare(`
    SELECT COUNT(DISTINCT device_fingerprint) as count FROM user_behaviors
    WHERE user_id = ? AND created_at > datetime('now', '-1 day') AND device_fingerprint IS NOT NULL
  `).get(userId) as { count: number };
  if (deviceChanges.count > 3) {
    patterns.push(`Multiple devices used: ${deviceChanges.count}`);
  }

  return { anomalous: patterns.length > 0, patterns };
}
