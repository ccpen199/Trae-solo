const database = require('../database');
const { v4: uuidv4 } = require('uuid');
const ruleEngine = require('./rule-engine');
const variableFactory = require('./variable-factory');

function generateTestData(count = 100) {
  const testData = [];
  
  for (let i = 0; i < count; i++) {
    const isRisky = Math.random() > 0.7;
    
    testData.push({
      id: `test-${i + 1}`,
      ip_risk_level: isRisky ? Math.floor(Math.random() * 3) + 8 : Math.floor(Math.random() * 7),
      login_frequency: isRisky ? Math.floor(Math.random() * 50) + 15 : Math.floor(Math.random() * 10),
      device_fingerprint_similarity: isRisky ? Math.random() * 0.5 : 0.7 + Math.random() * 0.3,
      account_balance: Math.floor(Math.random() * 100000),
      chargeback_count: isRisky ? Math.floor(Math.random() * 5) : 0,
      ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      user_id: `user-${1000 + i}`,
      session_id: `sess-${uuidv4()}`,
      expected_result: isRisky ? 'reject' : 'pass',
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return testData;
}

function createBacktestTask(data) {
  const db = database.getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO backtest_tasks (id, rule_id, name, status, test_data_source, test_config, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    data.ruleId,
    data.name,
    'pending',
    data.testDataSource || 'generated',
    JSON.stringify(data.testConfig || {}),
    data.createdBy || 'system',
    now
  );
  
  return getBacktestTaskById(id);
}

function getBacktestTaskById(id) {
  const db = database.getDb();
  const task = db.prepare('SELECT * FROM backtest_tasks WHERE id = ?').get(id);
  if (!task) return null;
  
  return {
    ...task,
    test_config: task.test_config ? JSON.parse(task.test_config) : null,
    result_report: task.result_report ? JSON.parse(task.result_report) : null,
    optimization_suggestions: task.optimization_suggestions ? JSON.parse(task.optimization_suggestions) : null
  };
}

function getAllBacktestTasks(options = {}) {
  const db = database.getDb();
  let sql = 'SELECT * FROM backtest_tasks';
  const conditions = [];
  const params = [];
  
  if (options.ruleId) {
    conditions.push('rule_id = ?');
    params.push(options.ruleId);
  }
  if (options.status) {
    conditions.push('status = ?');
    params.push(options.status);
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  sql += ' ORDER BY created_at DESC';
  
  if (options.limit) {
    sql += ` LIMIT ${options.limit}`;
  }
  
  const tasks = db.prepare(sql).all(...params);
  return tasks.map(t => ({
    ...t,
    test_config: t.test_config ? JSON.parse(t.test_config) : null,
    result_report: t.result_report ? JSON.parse(t.result_report) : null,
    optimization_suggestions: t.optimization_suggestions ? JSON.parse(t.optimization_suggestions) : null
  }));
}

function runBacktest(taskId) {
  const db = database.getDb();
  const task = getBacktestTaskById(taskId);
  
  if (!task) {
    throw new Error(`回测任务 ${taskId} 不存在`);
  }
  
  const rule = ruleEngine.getRuleById(task.rule_id);
  if (!rule) {
    throw new Error(`规则 ${task.rule_id} 不存在`);
  }
  
  const testConfig = task.test_config || {};
  const testData = generateTestData(testConfig.sampleSize || 100);
  
  const results = {
    total: testData.length,
    truePositives: 0,
    trueNegatives: 0,
    falsePositives: 0,
    falseNegatives: 0,
    details: []
  };
  
  testData.forEach(data => {
    const variables = variableFactory.collectAllVariables(data);
    const evaluation = ruleEngine.evaluate(rule.logic_topology, variables);
    
    const result = {
      testCaseId: data.id,
      variables,
      expected: data.expected_result,
      actual: evaluation.result,
      score: evaluation.score,
      isCorrect: false
    };
    
    if (evaluation.result === data.expected_result) {
      if (data.expected_result === 'reject') {
        results.truePositives++;
      } else {
        results.trueNegatives++;
      }
      result.isCorrect = true;
    } else {
      if (evaluation.result === 'reject' && data.expected_result === 'pass') {
        results.falsePositives++;
      } else {
        results.falseNegatives++;
      }
    }
    
    results.details.push(result);
  });
  
  const accuracy = ((results.truePositives + results.trueNegatives) / results.total) * 100;
  const precision = results.truePositives / (results.truePositives + results.falsePositives) || 0;
  const recall = results.truePositives / (results.truePositives + results.falseNegatives) || 0;
  const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
  
  const report = {
    summary: {
      total: results.total,
      correct: results.truePositives + results.trueNegatives,
      incorrect: results.falsePositives + results.falseNegatives,
      accuracy: Number(accuracy.toFixed(2)),
      precision: Number((precision * 100).toFixed(2)),
      recall: Number((recall * 100).toFixed(2)),
      f1Score: Number((f1Score * 100).toFixed(2))
    },
    confusionMatrix: {
      truePositives: results.truePositives,
      trueNegatives: results.trueNegatives,
      falsePositives: results.falsePositives,
      falseNegatives: results.falseNegatives
    },
    testCases: results.details.slice(0, 50)
  };
  
  const suggestions = generateOptimizationSuggestions(report, rule, testConfig);
  
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE backtest_tasks 
    SET status = ?, result_report = ?, optimization_suggestions = ?, completed_at = ?
    WHERE id = ?
  `);
  
  stmt.run('completed', JSON.stringify(report), JSON.stringify(suggestions), now, taskId);
  
  return {
    taskId,
    report,
    suggestions
  };
}

function generateOptimizationSuggestions(report, rule, testConfig) {
  const suggestions = [];
  const { summary, confusionMatrix } = report;
  
  if (summary.accuracy < 70) {
    suggestions.push({
      type: 'accuracy',
      priority: 'high',
      title: '准确率偏低',
      description: `当前准确率为 ${summary.accuracy}%，建议优化规则逻辑或增加特征变量`,
      actions: [
        '增加更多特征变量',
        '调整阈值条件',
        '考虑使用加权评分替代二元判定'
      ]
    });
  }
  
  if (confusionMatrix.falsePositives > 0) {
    suggestions.push({
      type: 'false_positive',
      priority: 'medium',
      title: '存在误判（误拦截）',
      description: `有 ${confusionMatrix.falsePositives} 个正常用户被误判为风险用户`,
      actions: [
        '降低风险阈值',
        '增加二次验证机制',
        '优化规则条件组合'
      ]
    });
  }
  
  if (confusionMatrix.falseNegatives > 0) {
    suggestions.push({
      type: 'false_negative',
      priority: 'high',
      title: '存在漏判（放过风险）',
      description: `有 ${confusionMatrix.falseNegatives} 个风险用户被误判为正常用户`,
      actions: [
        '提高风险检测灵敏度',
        '增加更多风险特征',
        '考虑引入机器学习模型'
      ]
    });
  }
  
  if (summary.precision < 80 && summary.precision > 0) {
    suggestions.push({
      type: 'precision',
      priority: 'medium',
      title: '精确率需要优化',
      description: `精确率为 ${summary.precision}%，建议优化规则条件减少误判`,
      actions: [
        '添加更多验证条件',
        '使用复合条件而非单一条件',
        '调整权重分配'
      ]
    });
  }
  
  if (suggestions.length === 0) {
    suggestions.push({
      type: 'optimized',
      priority: 'low',
      title: '规则表现良好',
      description: '当前规则各项指标表现良好，可以考虑上线',
      actions: [
        '一键上线到生产环境',
        '继续监控运行效果',
        '定期进行回测验证'
      ]
    });
  }
  
  return {
    overallScore: summary.accuracy,
    suggestions,
    recommendedAction: summary.accuracy >= 85 ? 'deploy' : 'optimize',
    deployable: summary.accuracy >= 85
  };
}

module.exports = {
  generateTestData,
  createBacktestTask,
  getBacktestTaskById,
  getAllBacktestTasks,
  runBacktest,
  generateOptimizationSuggestions
};
