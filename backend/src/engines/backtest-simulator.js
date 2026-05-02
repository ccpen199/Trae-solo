const { getDb } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');
const RuleEngine = require('./rule-engine');

class BacktestSimulator {
  constructor() {
    this.db = getDb();
    this.ruleEngine = new RuleEngine();
  }

  async startBacktest(ruleId, options = {}) {
    const rule = this.ruleEngine.getRuleById(ruleId);
    if (!rule) {
      throw new Error(`规则不存在: ${ruleId}`);
    }

    const backtestId = `bt_${uuidv4().slice(0, 10)}`;
    
    const stmt = this.db.prepare(`
      INSERT INTO backtest_runs (
        id, rule_id, rule_version, status, start_date, end_date
      ) VALUES (?, ?, ?, 'running', ?, ?)
    `);

    const startDate = options.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = options.endDate || new Date().toISOString();

    stmt.run(backtestId, ruleId, rule.version, startDate, endDate);

    this.ruleEngine.logAudit('analyst', 'START_BACKTEST', 'backtest', backtestId, 
      JSON.stringify({ ruleId, ruleName: rule.name }));

    setTimeout(async () => {
      try {
        await this.executeBacktest(backtestId, rule, options);
      } catch (error) {
        console.error('回测执行失败:', error);
        this.updateBacktestStatus(backtestId, 'failed');
      }
    }, 100);

    return { backtestId, status: 'running', message: '回测已开始执行' };
  }

  async executeBacktest(backtestId, rule, options) {
    const historicalDecisions = this.getHistoricalDecisions(options);
    
    let totalCount = 0;
    let passMatch = 0;
    let rejectMatch = 0;
    let reviewMatch = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    const results = [];

    for (const history of historicalDecisions) {
      totalCount++;
      
      const requestContext = this.reconstructRequestContext(history);
      
      const simulatedResult = await this.ruleEngine.executeDecision(requestContext, [rule]);
      
      const originalDecision = history.decision_result;
      const simulatedDecision = simulatedResult.decisionResult;
      
      let analysis = '';
      if (originalDecision === simulatedDecision) {
        analysis = '决策一致';
        if (simulatedDecision === 'pass') passMatch++;
        else if (simulatedDecision === 'reject') rejectMatch++;
        else if (simulatedDecision === 'review') reviewMatch++;
      } else if (originalDecision === 'reject' && simulatedDecision === 'pass') {
        analysis = '漏检: 原拒绝 -> 现通过';
        falseNegatives++;
      } else if (originalDecision === 'pass' && simulatedDecision === 'reject') {
        analysis = '误判: 原通过 -> 现拒绝';
        falsePositives++;
      } else {
        analysis = `决策变化: ${originalDecision} -> ${simulatedDecision}`;
      }

      results.push({
        backtestId,
        originalDecision,
        simulatedDecision,
        matchedRules: JSON.stringify(simulatedResult.matchedConditions),
        variablesSnapshot: JSON.stringify(simulatedResult.variablesSnapshot),
        analysisComment: analysis
      });
    }

    if (results.length > 0) {
      const insertStmt = this.db.prepare(`
        INSERT INTO backtest_results (
          backtest_id, original_decision, simulated_decision, 
          matched_rules, variables_snapshot, analysis_comment
        ) VALUES (@backtestId, @originalDecision, @simulatedDecision, 
                  @matchedRules, @variablesSnapshot, @analysisComment)
      `);

      for (const result of results) {
        insertStmt.run(result);
      }
    }

    const accuracy = totalCount > 0 ? ((passMatch + rejectMatch + reviewMatch) / totalCount * 100).toFixed(2) : 0;
    const summary = {
      totalCount,
      passMatch,
      rejectMatch,
      reviewMatch,
      falsePositives,
      falseNegatives,
      accuracy: parseFloat(accuracy),
      optimizationSuggestions: this.generateSuggestions({
        falsePositives,
        falseNegatives,
        totalCount
      }, rule)
    };

    this.db.prepare(`
      UPDATE backtest_runs 
      SET status = 'completed', result_summary = ?, completed_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(JSON.stringify(summary), backtestId);

    return summary;
  }

  getHistoricalDecisions(options) {
    const mockData = [];
    const count = options.sampleCount || 20;
    
    const decisionTypes = ['pass', 'pass', 'pass', 'review', 'reject'];
    
    for (let i = 0; i < count; i++) {
      const decision = decisionTypes[Math.floor(Math.random() * decisionTypes.length)];
      const userId = `user_${1000 + i}`;
      const ip = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      
      const snapshot = {
        user_login_count: { value: Math.floor(Math.random() * 20), weight: 1.0 },
        ip_blacklist: { value: i % 10 === 0, weight: 1.5 },
        device_new: { value: i % 8 === 0, weight: 1.2 },
        consecutive_failures: { value: Math.floor(Math.random() * 15), weight: 1.4 }
      };

      if (decision === 'reject') {
        snapshot.ip_blacklist.value = true;
        snapshot.consecutive_failures.value = Math.floor(Math.random() * 10) + 10;
      }

      mockData.push({
        id: `hist_${uuidv4().slice(0, 8)}`,
        decision_result: decision,
        score: decision === 'reject' ? 85 + Math.random() * 15 : 
               decision === 'review' ? 50 + Math.random() * 30 : Math.random() * 20,
        request_id: `req_${i}`,
        variables_snapshot: JSON.stringify(snapshot),
        context: JSON.stringify({ userId, ip })
      });
    }

    return mockData;
  }

  reconstructRequestContext(history) {
    const context = JSON.parse(history.context || '{}');
    const snapshot = JSON.parse(history.variables_snapshot || '{}');
    
    return {
      userId: context.userId || 'unknown',
      ip: context.ip || '127.0.0.1',
      deviceId: context.deviceId || 'device_default',
      _backtestSnapshot: snapshot
    };
  }

  generateSuggestions(stats, rule) {
    const suggestions = [];
    const total = stats.totalCount || 1;
    
    const fpRate = stats.falsePositives / total;
    const fnRate = stats.falseNegatives / total;

    if (fpRate > 0.1) {
      suggestions.push({
        type: 'optimization',
        priority: 'high',
        title: '降低误判率',
        description: `当前误判率 ${(fpRate * 100).toFixed(1)}%，建议调整高风险条件的阈值`,
        actions: [
          '提高 IP黑名单 条件的权重敏感度',
          '增加账户历史行为的验证条件',
          '降低连续失败次数的触发阈值'
        ]
      });
    }

    if (fnRate > 0.1) {
      suggestions.push({
        type: 'optimization',
        priority: 'high',
        title: '减少漏检风险',
        description: `当前漏检率 ${(fnRate * 100).toFixed(1)}%，建议加强关键特征的识别`,
        actions: [
          '增加设备指纹相似度检查',
          '提高新设备登录的风险权重',
          '添加交易金额异常检测'
        ]
      });
    }

    if (fpRate <= 0.05 && fnRate <= 0.05) {
      suggestions.push({
        type: 'promotion',
        priority: 'medium',
        title: '规则表现良好，可一键上线',
        description: `准确率 ${((1 - fpRate - fnRate) * 100).toFixed(1)}%，满足上线条件`,
        actions: ['一键激活此规则到生产环境']
      });
    }

    return suggestions;
  }

  updateBacktestStatus(backtestId, status) {
    this.db.prepare(`
      UPDATE backtest_runs SET status = ? WHERE id = ?
    `).run(status, backtestId);
  }

  getBacktestStatus(backtestId) {
    const stmt = this.db.prepare(`SELECT * FROM backtest_runs WHERE id = ?`);
    const run = stmt.get(backtestId);
    if (run && run.result_summary) {
      run.result_summary = JSON.parse(run.result_summary);
    }
    return run;
  }

  getBacktestResults(backtestId) {
    const stmt = this.db.prepare(`SELECT * FROM backtest_results WHERE backtest_id = ?`);
    return stmt.all(backtestId).map(r => ({
      ...r,
      matched_rules: JSON.parse(r.matched_rules || '[]'),
      variables_snapshot: JSON.parse(r.variables_snapshot || '{}')
    }));
  }

  getAllBacktests() {
    const stmt = this.db.prepare(`
      SELECT br.*, r.name as rule_name
      FROM backtest_runs br
      LEFT JOIN rules r ON br.rule_id = r.id
      ORDER BY br.created_at DESC
    `);
    return stmt.all().map(r => ({
      ...r,
      result_summary: r.result_summary ? JSON.parse(r.result_summary) : null
    }));
  }
}

module.exports = BacktestSimulator;
