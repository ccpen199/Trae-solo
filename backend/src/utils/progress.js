const db = require('./db');

function calculateKRProgress(krId) {
  const kr = db.prepare('SELECT target_value, current_value FROM key_results WHERE id = ?').get(krId);
  if (!kr) return 0;
  
  const milestoneCount = db.prepare('SELECT COUNT(*) as total, SUM(is_completed) as completed FROM milestones WHERE key_result_id = ?').get(krId);
  const executionRecords = db.prepare('SELECT SUM(progress_value) as total FROM execution_records WHERE key_result_id = ?').get(krId);
  
  let progress = 0;
  let weightSum = 0;
  
  if (kr.target_value && kr.target_value > 0) {
    const valueProgress = Math.min(100, (kr.current_value / kr.target_value) * 100);
    progress += valueProgress * 0.5;
    weightSum += 0.5;
  }
  
  if (milestoneCount.total > 0) {
    const milestoneProgress = milestoneCount.completed ? (milestoneCount.completed / milestoneCount.total) * 100 : 0;
    progress += milestoneProgress * 0.3;
    weightSum += 0.3;
  }
  
  const taskCount = db.prepare(`
    SELECT COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM weekly_tasks WHERE key_result_id = ?
  `).get(krId);
  
  if (taskCount.total > 0) {
    const taskProgress = taskCount.completed ? (taskCount.completed / taskCount.total) * 100 : 0;
    progress += taskProgress * 0.2;
    weightSum += 0.2;
  }
  
  if (weightSum > 0) {
    progress = progress / weightSum;
  }
  
  return Math.round(Math.min(100, Math.max(0, progress)));
}

function calculateGoalProgress(goalId) {
  const krs = db.prepare('SELECT id, weight FROM key_results WHERE goal_id = ?').all(goalId);
  if (!krs || krs.length === 0) return 0;
  
  let totalWeight = 0;
  let weightedProgress = 0;
  
  for (const kr of krs) {
    const krProgress = calculateKRProgress(kr.id);
    const weight = kr.weight || 1;
    totalWeight += weight;
    weightedProgress += krProgress * weight;
  }
  
  return totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;
}

function updateKRStatus(krId) {
  const progress = calculateKRProgress(krId);
  let status = 'pending';
  
  if (progress >= 100) {
    status = 'completed';
  } else if (progress > 0) {
    status = 'in_progress';
  }
  
  db.prepare('UPDATE key_results SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, krId);
  return status;
}

function updateGoalStatus(goalId) {
  const progress = calculateGoalProgress(goalId);
  let status = 'pending';
  
  if (progress >= 100) {
    status = 'completed';
  } else if (progress > 0) {
    status = 'in_progress';
  }
  
  db.prepare('UPDATE goals SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, goalId);
  return status;
}

module.exports = {
  calculateKRProgress,
  calculateGoalProgress,
  updateKRStatus,
  updateGoalStatus
};
