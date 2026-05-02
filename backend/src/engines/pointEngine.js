const { db } = require('../database/init');

class PointRuleEngine {
  constructor() {
    this.conditionEvaluators = {
      'win': this.evaluateWinCondition,
      'kills': this.evaluateKillsCondition,
      'deaths': this.evaluateDeathsCondition,
      'assists': this.evaluateAssistsCondition,
      'performance_score': this.evaluatePerformanceCondition,
      'consecutive_wins': this.evaluateConsecutiveWinsCondition,
      'is_mvp': this.evaluateMvpCondition
    };
  }

  getActiveRules(gameMode = 'default', matchType = 'any') {
    const rules = db.prepare(`
      SELECT * FROM point_rules 
      WHERE status = 'active' 
        AND (game_mode = ? OR game_mode = 'default')
        AND (match_type = ? OR match_type = 'any')
      ORDER BY priority ASC, id ASC
    `).all(gameMode, matchType);

    return rules;
  }

  evaluateCondition(condition, playerStats, context = {}) {
    if (!condition) return true;

    const [key, operator, valueStr] = condition.split(/\s+/);
    const value = this.parseValue(valueStr);
    const statValue = this.getStatValue(playerStats, key, context);

    switch (operator) {
      case '=':
      case '==':
        return statValue === value;
      case '!=':
        return statValue !== value;
      case '>':
        return statValue > value;
      case '>=':
        return statValue >= value;
      case '<':
        return statValue < value;
      case '<=':
        return statValue <= value;
      default:
        return false;
    }
  }

  parseValue(str) {
    if (str === 'true') return true;
    if (str === 'false') return false;
    if (!isNaN(Number(str))) return Number(str);
    return str;
  }

  getStatValue(playerStats, key, context) {
    if (key in playerStats) {
      return playerStats[key];
    }
    
    if (key === 'consecutive_wins') {
      return context.consecutiveWins || 0;
    }
    
    if (key === 'is_mvp') {
      return context.isMvp || false;
    }

    return null;
  }

  calculatePoints(playerStats, gameMode = 'default', matchType = 'any', context = {}) {
    const rules = this.getActiveRules(gameMode, matchType);
    const calculations = {
      basePoints: 0,
      performancePoints: 0,
      bonusPoints: 0,
      totalMultiplier: 1.0,
      appliedRules: [],
      breakdown: []
    };

    for (const rule of rules) {
      if (!this.evaluateCondition(rule.condition, playerStats, context)) {
        continue;
      }

      const ruleResult = this.applyRule(rule, playerStats, context);
      
      calculations.appliedRules.push(rule.id);
      calculations.breakdown.push({
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.rule_type,
        points: ruleResult.points,
        multiplier: ruleResult.multiplier
      });

      switch (rule.rule_type) {
        case 'base':
          calculations.basePoints += ruleResult.points;
          break;
        case 'performance':
          calculations.performancePoints += ruleResult.points;
          break;
        case 'bonus':
          calculations.bonusPoints += ruleResult.points;
          if (ruleResult.multiplier > 1) {
            calculations.totalMultiplier *= ruleResult.multiplier;
          }
          break;
      }
    }

    const baseTotal = calculations.basePoints + calculations.performancePoints;
    const bonusFromMultiplier = baseTotal * (calculations.totalMultiplier - 1);
    calculations.totalPoints = Math.floor(baseTotal * calculations.totalMultiplier + calculations.bonusPoints);
    calculations.breakdown.push({
      ruleName: '最终计算',
      baseTotal,
      multiplier: calculations.totalMultiplier,
      bonusPoints: calculations.bonusPoints,
      totalPoints: calculations.totalPoints
    });

    return calculations;
  }

  applyRule(rule, playerStats, context) {
    let points = rule.points;
    let multiplier = rule.multiplier;

    if (rule.rule_type === 'performance') {
      if (rule.condition?.startsWith('kills')) {
        points = (playerStats.kills || 0) * rule.points;
      } else if (rule.condition?.startsWith('assists')) {
        points = (playerStats.assists || 0) * rule.points;
      }
    }

    return { points, multiplier };
  }

  getConsecutiveWins(userId, seasonId) {
    const matches = db.prepare(`
      SELECT pms.win, mr.created_at
      FROM player_match_stats pms
      JOIN match_records mr ON pms.match_record_id = mr.id
      WHERE pms.user_id = ? AND mr.season_id = ? AND mr.status = 'completed'
      ORDER BY mr.created_at DESC
      LIMIT 20
    `).all(userId, seasonId);

    let consecutiveWins = 0;
    for (const match of matches) {
      if (match.win) {
        consecutiveWins++;
      } else {
        break;
      }
    }

    return consecutiveWins;
  }

  findPlayerRank(totalPoints, seasonConfig) {
    const ranks = seasonConfig?.rankSystem?.ranks || [
      { name: '青铜', minPoints: 0 },
      { name: '白银', minPoints: 1000 },
      { name: '黄金', minPoints: 2000 },
      { name: '铂金', minPoints: 3500 },
      { name: '钻石', minPoints: 5000 },
      { name: '大师', minPoints: 7500 },
      { name: '王者', minPoints: 10000 }
    ];

    let currentRank = ranks[0];
    for (const rank of ranks) {
      if (totalPoints >= rank.minPoints) {
        currentRank = rank;
      }
    }

    return currentRank;
  }
}

module.exports = new PointRuleEngine();
