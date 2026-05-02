const dayjs = require('dayjs');

class AutoUnderwritingEngine {
  constructor() {
    this.rules = this.initializeRules();
    this.thresholds = {
      autoApprove: 30,
      manualReview: 60,
      autoReject: 80
    };
  }

  initializeRules() {
    return [
      {
        id: 'AGE_001',
        name: '年龄限制检查',
        category: 'basic',
        evaluate: (context) => {
          const age = context.age;
          if (age < 18) return { passed: false, risk: 0, reason: '投保人需年满18岁', action: 'reject' };
          if (age > 65) return { passed: false, risk: 50, reason: '超过65岁需人工核保', action: 'manual' };
          return { passed: true, risk: 0, reason: '年龄符合要求' };
        }
      },
      {
        id: 'HEALTH_001',
        name: '重大疾病史检查',
        category: 'health',
        evaluate: (context) => {
          const diseases = context.healthDeclaration?.pastDiseases || [];
          const highRiskDiseases = ['癌症', '心脏病', '中风', '肾衰竭', '肝硬化'];
          
          const hasHighRisk = diseases.some(d => highRiskDiseases.includes(d));
          
          if (hasHighRisk) {
            return { passed: false, risk: 70, reason: '有重大疾病史需人工核保', action: 'manual' };
          }
          return { passed: true, risk: 0, reason: '无重大疾病史' };
        }
      },
      {
        id: 'HEALTH_002',
        name: '慢性病检查',
        category: 'health',
        evaluate: (context) => {
          const diseases = context.healthDeclaration?.chronicDiseases || [];
          const chronicDiseases = ['高血压', '糖尿病', '哮喘'];
          
          const hasChronic = diseases.some(d => chronicDiseases.includes(d));
          
          if (hasChronic) {
            return { passed: true, risk: 25, reason: '有慢性病，风险增加' };
          }
          return { passed: true, risk: 0, reason: '无慢性病' };
        }
      },
      {
        id: 'OCCUPATION_001',
        name: '职业风险检查',
        category: 'occupation',
        evaluate: (context) => {
          const occupation = context.occupation;
          const highRiskOccupations = ['高空作业', '矿工', '消防员', '特警', '潜水员'];
          const mediumRiskOccupations = ['建筑工人', '司机', '厨师'];
          
          if (highRiskOccupations.includes(occupation)) {
            return { passed: false, risk: 60, reason: '高风险职业需人工核保', action: 'manual' };
          }
          if (mediumRiskOccupations.includes(occupation)) {
            return { passed: true, risk: 15, reason: '中等风险职业' };
          }
          return { passed: true, risk: 0, reason: '一般职业风险' };
        }
      },
      {
        id: 'LIFESTYLE_001',
        name: '生活习惯检查',
        category: 'lifestyle',
        evaluate: (context) => {
          const lifestyle = context.lifestyle || {};
          let risk = 0;
          const reasons = [];
          
          if (lifestyle.smoker) {
            risk += 15;
            reasons.push('吸烟');
          }
          if (lifestyle.heavyDrinker) {
            risk += 20;
            reasons.push('重度饮酒');
          }
          if (lifestyle.highRiskHobbies) {
            risk += 25;
            reasons.push('高风险爱好');
          }
          
          if (risk > 0) {
            return { passed: true, risk, reason: '生活习惯风险因素: ' + reasons.join(', ') };
          }
          return { passed: true, risk: 0, reason: '生活习惯良好' };
        }
      },
      {
        id: 'COVERAGE_001',
        name: '保额合理性检查',
        category: 'coverage',
        evaluate: (context) => {
          const sumAssured = context.sumAssured;
          const annualIncome = context.annualIncome || 0;
          
          if (annualIncome > 0 && sumAssured > annualIncome * 10) {
            return { passed: false, risk: 40, reason: '保额过高需人工核保', action: 'manual' };
          }
          if (sumAssured > 5000000) {
            return { passed: false, risk: 35, reason: '大额保单需人工核保', action: 'manual' };
          }
          return { passed: true, risk: 0, reason: '保额合理' };
        }
      },
      {
        id: 'BMI_001',
        name: 'BMI指数检查',
        category: 'health',
        evaluate: (context) => {
          const height = context.height;
          const weight = context.weight;
          
          if (!height || !weight) {
            return { passed: true, risk: 0, reason: 'BMI数据不完整' };
          }
          
          const bmi = weight / Math.pow((height / 100), 2);
          
          if (bmi >= 35 || bmi < 16) {
            return { passed: false, risk: 30, reason: 'BMI异常需人工核保', action: 'manual' };
          }
          if (bmi >= 30 || bmi < 18.5) {
            return { passed: true, risk: 15, reason: 'BMI偏高或偏低' };
          }
          return { passed: true, risk: 0, reason: 'BMI正常' };
        }
      }
    ];
  }

  evaluate(context) {
    const results = [];
    let totalRisk = 0;
    const actions = {
      autoApprove: true,
      manualReview: false,
      reject: false
    };

    for (const rule of this.rules) {
      try {
        const result = rule.evaluate(context);
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          ...result
        });
        
        totalRisk += result.risk;
        
        if (result.action === 'reject') {
          actions.reject = true;
          actions.autoApprove = false;
        }
        if (result.action === 'manual') {
          actions.manualReview = true;
          actions.autoApprove = false;
        }
      } catch (error) {
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          passed: false,
          risk: 0,
          reason: '规则执行错误: ' + error.message,
          error: true
        });
      }
    }

    let decision;
    let decisionReason;

    if (actions.reject) {
      decision = 'reject';
      decisionReason = '触发拒保规则';
    } else if (actions.manualReview) {
      decision = 'manual';
      decisionReason = '需要人工核保';
    } else if (totalRisk <= this.thresholds.autoApprove) {
      decision = 'approve';
      decisionReason = '低风险，自动通过';
    } else if (totalRisk <= this.thresholds.manualReview) {
      decision = 'manual';
      decisionReason = '中等风险，建议人工核保';
    } else {
      decision = 'manual';
      decisionReason = '高风险，必须人工核保';
    }

    return {
      engineVersion: '1.0.0',
      evaluatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      totalRisk,
      decision,
      decisionReason,
      thresholds: this.thresholds,
      rules: results,
      summary: {
        totalRules: this.rules.length,
        passedRules: results.filter(r => r.passed).length,
        failedRules: results.filter(r => !r.passed && !r.error).length,
        errorRules: results.filter(r => r.error).length
      }
    };
  }

  evaluateHealthDeclaration(healthDeclaration) {
    const context = {
      age: healthDeclaration.age,
      healthDeclaration,
      occupation: healthDeclaration.occupation,
      lifestyle: {
        smoker: healthDeclaration.smoker,
        heavyDrinker: healthDeclaration.heavyDrinker,
        highRiskHobbies: healthDeclaration.highRiskHobbies
      },
      height: healthDeclaration.height,
      weight: healthDeclaration.weight,
      sumAssured: healthDeclaration.sumAssured,
      annualIncome: healthDeclaration.annualIncome
    };

    return this.evaluate(context);
  }
}

module.exports = new AutoUnderwritingEngine();
