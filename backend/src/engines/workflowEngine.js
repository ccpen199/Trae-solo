const { db } = require('../database/init');
const pointEngine = require('./pointEngine');
const leaderboardEngine = require('./leaderboardEngine');
const { v4: uuidv4 } = require('uuid');

const MATCH_STATES = {
  MATCH_CREATED: 'match_created',
  MATCH_IN_PROGRESS: 'match_in_progress',
  MATCH_COMPLETED: 'match_completed',
  REPORT_PENDING: 'report_pending',
  REPORT_RECEIVED: 'report_received',
  REPORT_VERIFIED: 'report_verified',
  POINTS_CALCULATED: 'points_calculated',
  LEADERBOARD_UPDATED: 'leaderboard_updated',
  REWARDS_ELIGIBLE: 'rewards_eligible',
  COMPLETED: 'completed'
};

const MATCH_TRANSITIONS = {
  [MATCH_STATES.MATCH_CREATED]: {
    allowedTo: [MATCH_STATES.MATCH_IN_PROGRESS],
    permissions: ['player', 'operator'],
    action: 'start_match'
  },
  [MATCH_STATES.MATCH_IN_PROGRESS]: {
    allowedTo: [MATCH_STATES.MATCH_COMPLETED],
    permissions: ['player', 'operator'],
    action: 'end_match'
  },
  [MATCH_STATES.MATCH_COMPLETED]: {
    allowedTo: [MATCH_STATES.REPORT_PENDING],
    permissions: ['player', 'operator'],
    action: 'init_report'
  },
  [MATCH_STATES.REPORT_PENDING]: {
    allowedTo: [MATCH_STATES.REPORT_RECEIVED],
    permissions: ['player', 'operator'],
    action: 'submit_report'
  },
  [MATCH_STATES.REPORT_RECEIVED]: {
    allowedTo: [MATCH_STATES.REPORT_VERIFIED],
    permissions: ['operator', 'admin'],
    action: 'verify_report',
    autoVerify: true
  },
  [MATCH_STATES.REPORT_VERIFIED]: {
    allowedTo: [MATCH_STATES.POINTS_CALCULATED],
    permissions: ['system'],
    action: 'calculate_points',
    autoTransition: true
  },
  [MATCH_STATES.POINTS_CALCULATED]: {
    allowedTo: [MATCH_STATES.LEADERBOARD_UPDATED],
    permissions: ['system'],
    action: 'update_leaderboard',
    autoTransition: true
  },
  [MATCH_STATES.LEADERBOARD_UPDATED]: {
    allowedTo: [MATCH_STATES.REWARDS_ELIGIBLE],
    permissions: ['system'],
    action: 'check_rewards',
    autoTransition: true
  },
  [MATCH_STATES.REWARDS_ELIGIBLE]: {
    allowedTo: [MATCH_STATES.COMPLETED],
    permissions: ['system'],
    action: 'complete_workflow',
    autoTransition: true
  }
};

class WorkflowEngine {
  constructor() {
    this.actionHandlers = {
      start_match: this.handleStartMatch.bind(this),
      end_match: this.handleEndMatch.bind(this),
      init_report: this.handleInitReport.bind(this),
      submit_report: this.handleSubmitReport.bind(this),
      verify_report: this.handleVerifyReport.bind(this),
      calculate_points: this.handleCalculatePoints.bind(this),
      update_leaderboard: this.handleUpdateLeaderboard.bind(this),
      check_rewards: this.handleCheckRewards.bind(this),
      complete_workflow: this.handleCompleteWorkflow.bind(this)
    };
  }

  getCurrentState(entityType, entityId) {
    return db.prepare(`
      SELECT * FROM workflow_states 
      WHERE entity_type = ? AND entity_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(entityType, entityId);
  }

  canTransition(currentState, targetState, userRole) {
    const transitionConfig = MATCH_TRANSITIONS[currentState];
    
    if (!transitionConfig) {
      return { allowed: false, reason: '当前状态不允许转换' };
    }

    if (!transitionConfig.allowedTo.includes(targetState)) {
      return { 
        allowed: false, 
        reason: `不允许从 ${currentState} 转换到 ${targetState}` 
      };
    }

    if (!transitionConfig.permissions.includes(userRole) && 
        !transitionConfig.permissions.includes('system')) {
      return { allowed: false, reason: '权限不足' };
    }

    return { allowed: true };
  }

  transition(entityType, entityId, targetState, user, transitionData = {}) {
    const currentStateRecord = this.getCurrentState(entityType, entityId);
    const currentState = currentStateRecord?.current_state || MATCH_STATES.MATCH_CREATED;

    const check = this.canTransition(currentState, targetState, user?.role || 'system');
    if (!check.allowed) {
      throw new Error(check.reason);
    }

    const transitionConfig = MATCH_TRANSITIONS[currentState];
    const handler = this.actionHandlers[transitionConfig.action];

    let handlerResult = null;
    if (handler) {
      handlerResult = handler(entityId, transitionData, user);
    }

    db.prepare(`
      INSERT INTO workflow_states 
        (entity_type, entity_id, current_state, previous_state, transition_data, actor_id, actor_role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      entityType,
      entityId,
      targetState,
      currentState,
      JSON.stringify(transitionData),
      user?.id || null,
      user?.role || 'system'
    );

    if (MATCH_TRANSITIONS[targetState]?.autoTransition) {
      const nextState = MATCH_TRANSITIONS[targetState].allowedTo[0];
      if (nextState) {
        setTimeout(() => {
          this.transition(entityType, entityId, nextState, null, transitionData);
        }, 100);
      }
    }

    return {
      success: true,
      from: currentState,
      to: targetState,
      handlerResult,
      transitionData
    };
  }

  handleStartMatch(matchId, data, user) {
    return db.prepare(`
      UPDATE match_records 
      SET start_time = CURRENT_TIMESTAMP, status = 'in_progress', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(matchId);
  }

  handleEndMatch(matchId, data, user) {
    return db.prepare(`
      UPDATE match_records 
      SET end_time = CURRENT_TIMESTAMP, status = 'completed', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(matchId);
  }

  handleInitReport(matchId, data, user) {
    return db.prepare(`
      UPDATE match_records 
      SET status = 'report_pending', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(matchId);
  }

  handleSubmitReport(matchId, data, user) {
    const { playerStats, reportData } = data;

    db.prepare(`
      UPDATE match_records 
      SET report_data = ?, status = 'report_received', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(JSON.stringify(reportData), matchId);

    if (playerStats && Array.isArray(playerStats)) {
      const insertStat = db.prepare(`
        INSERT OR REPLACE INTO player_match_stats 
          (match_record_id, user_id, team_id, position, kills, deaths, assists, 
           damage_dealt, damage_taken, gold_earned, win, performance_score, extra_stats)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const stat of playerStats) {
        insertStat.run(
          matchId,
          stat.user_id,
          stat.team_id || null,
          stat.position || null,
          stat.kills || 0,
          stat.deaths || 0,
          stat.assists || 0,
          stat.damage_dealt || 0,
          stat.damage_taken || 0,
          stat.gold_earned || 0,
          stat.win ? 1 : 0,
          stat.performance_score || 0,
          stat.extra_stats ? JSON.stringify(stat.extra_stats) : null
        );
      }
    }

    return { matchId, playerStatsCount: playerStats?.length || 0 };
  }

  handleVerifyReport(matchId, data, user) {
    const match = db.prepare('SELECT * FROM match_records WHERE id = ?').get(matchId);
    const playerStats = db.prepare('SELECT * FROM player_match_stats WHERE match_record_id = ?').all(matchId);

    const issues = [];
    if (playerStats.length === 0) {
      issues.push('没有玩家数据');
    }

    if (issues.length > 0) {
      throw new Error(`报告验证失败: ${issues.join(', ')}`);
    }

    db.prepare(`
      UPDATE match_records 
      SET status = 'verified', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(matchId);

    return { verified: true, playerCount: playerStats.length };
  }

  handleCalculatePoints(matchId, data, user) {
    const match = db.prepare('SELECT * FROM match_records WHERE id = ?').get(matchId);
    const playerStats = db.prepare('SELECT * FROM player_match_stats WHERE match_record_id = ?').all(matchId);
    const activeSeason = db.prepare('SELECT id, config FROM seasons WHERE status = ?').get('active');

    if (!activeSeason) {
      throw new Error('没有活动的赛季');
    }

    const seasonConfig = activeSeason.config ? JSON.parse(activeSeason.config) : {};
    const results = [];

    const teamWins = {};
    for (const stat of playerStats) {
      if (stat.team_id && stat.win) {
        teamWins[stat.team_id] = true;
      }
    }

    let mvpUserId = null;
    let maxPerformance = -1;
    for (const stat of playerStats) {
      if (stat.performance_score > maxPerformance) {
        maxPerformance = stat.performance_score;
        mvpUserId = stat.user_id;
      }
    }

    for (const stat of playerStats) {
      const consecutiveWins = pointEngine.getConsecutiveWins(stat.user_id, activeSeason.id);
      const isMvp = stat.user_id === mvpUserId;

      const context = {
        consecutiveWins,
        isMvp,
        matchType: match.match_type
      };

      const pointCalculation = pointEngine.calculatePoints(
        stat, 
        match.game_mode, 
        match.match_type,
        context
      );

      let userPoints = db.prepare(`
        SELECT * FROM user_season_points WHERE user_id = ? AND season_id = ?
      `).get(stat.user_id, activeSeason.id);

      if (!userPoints) {
        db.prepare(`
          INSERT INTO user_season_points 
            (user_id, season_id, total_points, wins, losses, matches_played, win_rate, rank, rank_points)
          VALUES (?, ?, 0, 0, 0, 0, 0, '青铜', 0)
        `).run(stat.user_id, activeSeason.id);
        
        userPoints = db.prepare(`
          SELECT * FROM user_season_points WHERE user_id = ? AND season_id = ?
        `).get(stat.user_id, activeSeason.id);
      }

      const balanceBefore = userPoints.total_points;
      const balanceAfter = balanceBefore + pointCalculation.totalPoints;
      const newWins = userPoints.wins + (stat.win ? 1 : 0);
      const newLosses = userPoints.losses + (stat.win ? 0 : 1);
      const newMatchesPlayed = userPoints.matches_played + 1;
      const newWinRate = newMatchesPlayed > 0 ? (newWins / newMatchesPlayed) * 100 : 0;
      const newRank = pointEngine.findPlayerRank(balanceAfter, seasonConfig);

      db.prepare(`
        INSERT INTO point_transactions 
          (user_id, season_id, match_record_id, transaction_type, points_change, 
           balance_before, balance_after, reason, rule_ids)
        VALUES (?, ?, ?, 'match_result', ?, ?, ?, ?, ?)
      `).run(
        stat.user_id,
        activeSeason.id,
        matchId,
        pointCalculation.totalPoints,
        balanceBefore,
        balanceAfter,
        `比赛积分计算: ${match.match_type}`,
        JSON.stringify(pointCalculation.appliedRules)
      );

      db.prepare(`
        UPDATE user_season_points 
        SET total_points = ?, wins = ?, losses = ?, matches_played = ?, 
            win_rate = ?, rank = ?, rank_points = ?, last_match_id = ?, last_updated = CURRENT_TIMESTAMP
        WHERE user_id = ? AND season_id = ?
      `).run(
        balanceAfter,
        newWins,
        newLosses,
        newMatchesPlayed,
        newWinRate,
        newRank.name,
        balanceAfter,
        matchId,
        stat.user_id,
        activeSeason.id
      );

      results.push({
        userId: stat.user_id,
        pointsChange: pointCalculation.totalPoints,
        balanceBefore,
        balanceAfter,
        newRank: newRank.name,
        breakdown: pointCalculation.breakdown
      });
    }

    return results;
  }

  handleUpdateLeaderboard(matchId, data, user) {
    return leaderboardEngine.refreshAllLeaderboards();
  }

  handleCheckRewards(matchId, data, user) {
    const activeSeason = db.prepare('SELECT id FROM seasons WHERE status = ?').get('active');
    if (!activeSeason) return [];

    const rewards = db.prepare(`
      SELECT * FROM rewards 
      WHERE season_id = ? AND status = 'active'
    `).all(activeSeason.id);

    const results = [];
    for (const reward of rewards) {
      const eligibleUsers = this.findEligibleUsers(reward, activeSeason.id);
      
      for (const user of eligibleUsers) {
        const existing = db.prepare(`
          SELECT id FROM user_rewards WHERE user_id = ? AND reward_id = ?
        `).get(user.user_id, reward.id);

        if (!existing) {
          db.prepare(`
            INSERT INTO user_rewards (user_id, reward_id, season_id, status)
            VALUES (?, ?, ?, 'eligible')
          `).run(user.user_id, reward.id, activeSeason.id);
          
          results.push({ userId: user.user_id, rewardId: reward.id, eligible: true });
        }
      }
    }

    return results;
  }

  findEligibleUsers(reward, seasonId) {
    switch (reward.condition_type) {
      case 'rank':
        const minRank = parseInt(reward.condition_value);
        return db.prepare(`
          SELECT user_id FROM user_season_points 
          WHERE season_id = ? AND total_points >= ?
        `).all(seasonId, minRank);
      
      case 'wins':
        const minWins = parseInt(reward.condition_value);
        return db.prepare(`
          SELECT user_id FROM user_season_points 
          WHERE season_id = ? AND wins >= ?
        `).all(seasonId, minWins);
      
      case 'matches_played':
        const minMatches = parseInt(reward.condition_value);
        return db.prepare(`
          SELECT user_id FROM user_season_points 
          WHERE season_id = ? AND matches_played >= ?
        `).all(seasonId, minMatches);
      
      default:
        return [];
    }
  }

  handleCompleteWorkflow(matchId, data, user) {
    return db.prepare(`
      UPDATE match_records 
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(matchId);
  }

  createMatch(matchData, user) {
    const matchId = uuidv4();
    const activeSeason = db.prepare('SELECT id FROM seasons WHERE status = ?').get('active');

    if (!activeSeason) {
      throw new Error('没有活动的赛季');
    }

    const result = db.prepare(`
      INSERT INTO match_records 
        (match_id, season_id, game_mode, match_type, status, start_time)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      matchId,
      activeSeason.id,
      matchData.game_mode || 'default',
      matchData.match_type || 'ranked',
      'pending'
    );

    const newMatchId = result.lastInsertRowid;

    this.transition('match', newMatchId, MATCH_STATES.MATCH_CREATED, user, matchData);

    return {
      id: newMatchId,
      matchId,
      seasonId: activeSeason.id,
      state: MATCH_STATES.MATCH_CREATED
    };
  }
}

module.exports = {
  WorkflowEngine,
  MATCH_STATES,
  MATCH_TRANSITIONS,
  workflowEngine: new WorkflowEngine()
};
