import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import eventStore, { EventTypes, AggregateTypes } from '../core/event-store.js';

const RiskLevelMapping = {
  1: { name: '保守型', minScore: 0, maxScore: 20, maxProductRisk: 1 },
  2: { name: '稳健型', minScore: 21, maxScore: 40, maxProductRisk: 2 },
  3: { name: '平衡型', minScore: 41, maxScore: 60, maxProductRisk: 3 },
  4: { name: '成长型', minScore: 61, maxScore: 80, maxProductRisk: 4 },
  5: { name: '激进型', minScore: 81, maxScore: 100, maxProductRisk: 5 },
};

const RiskQuestions = [
  {
    id: 'q1',
    question: '您的投资年限计划为：',
    options: [
      { value: 'A', text: '1年以内', score: 5 },
      { value: 'B', text: '1-3年', score: 10 },
      { value: 'C', text: '3-5年', score: 15 },
      { value: 'D', text: '5年以上', score: 20 },
    ]
  },
  {
    id: 'q2',
    question: '当投资亏损20%时，您的反应是：',
    options: [
      { value: 'A', text: '立即全部赎回', score: 5 },
      { value: 'B', text: '部分赎回止损', score: 10 },
      { value: 'C', text: '继续持有观望', score: 15 },
      { value: 'D', text: '追加投资摊低成本', score: 20 },
    ]
  },
  {
    id: 'q3',
    question: '您可接受的最大亏损比例是：',
    options: [
      { value: 'A', text: '5%以内', score: 5 },
      { value: 'B', text: '5%-10%', score: 10 },
      { value: 'C', text: '10%-20%', score: 15 },
      { value: 'D', text: '20%以上', score: 20 },
    ]
  },
  {
    id: 'q4',
    question: '您的投资经验年限是：',
    options: [
      { value: 'A', text: '无经验', score: 5 },
      { value: 'B', text: '1-2年', score: 10 },
      { value: 'C', text: '3-5年', score: 15 },
      { value: 'D', text: '5年以上', score: 20 },
    ]
  },
  {
    id: 'q5',
    question: '如果必须选择一种，您更倾向于：',
    options: [
      { value: 'A', text: '保本为主，收益次之', score: 5 },
      { value: 'B', text: '收益与风险平衡', score: 10 },
      { value: 'C', text: '追求较高收益，承担一定风险', score: 15 },
      { value: 'D', text: '追求高收益，可承受较大波动', score: 20 },
    ]
  },
];

class RiskProfilingEngine {
  getQuestions() {
    return RiskQuestions;
  }

  calculateScore(answers) {
    let totalScore = 0;
    
    for (const question of RiskQuestions) {
      const answer = answers[question.id];
      if (answer) {
        const option = question.options.find(o => o.value === answer);
        if (option) {
          totalScore += option.score;
        }
      }
    }
    
    return totalScore;
  }

  determineRiskLevel(score) {
    for (let level = 1; level <= 5; level++) {
      const mapping = RiskLevelMapping[level];
      if (score >= mapping.minScore && score <= mapping.maxScore) {
        return level;
      }
    }
    return 1;
  }

  getMaxProductRisk(riskLevel) {
    return RiskLevelMapping[riskLevel]?.maxProductRisk || 1;
  }

  canPurchaseProduct(userRiskLevel, productRiskLevel) {
    const maxAllowed = this.getMaxProductRisk(userRiskLevel);
    return productRiskLevel <= maxAllowed;
  }

  submitAssessment(userId, answers) {
    const assessmentId = uuidv4();
    const score = this.calculateScore(answers);
    const riskLevel = this.determineRiskLevel(score);
    const now = new Date().toISOString();
    const expiredAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    eventStore.append(
      AggregateTypes.ASSESSMENT,
      assessmentId,
      EventTypes.RISK_ASSESSMENT_SUBMITTED,
      {
        userId,
        answers,
        score,
        riskLevel,
        submittedAt: now
      },
      { source: 'RiskProfilingEngine' }
    );

    const insertStmt = db.prepare(`
      INSERT INTO risk_assessments (id, user_id, answers, score, risk_level, status, submitted_at, expired_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(assessmentId, userId, JSON.stringify(answers), score, riskLevel, 'submitted', now, expiredAt);

    const updateStmt = db.prepare(`
      UPDATE users SET risk_level = ?, risk_assessment_at = ? WHERE id = ?
    `);
    updateStmt.run(riskLevel, now, userId);

    eventStore.append(
      AggregateTypes.USER,
      userId,
      EventTypes.RISK_ASSESSMENT_COMPLETED,
      {
        assessmentId,
        score,
        riskLevel,
        expiredAt
      },
      { source: 'RiskProfilingEngine' }
    );

    return {
      id: assessmentId,
      userId,
      score,
      riskLevel,
      riskLevelName: RiskLevelMapping[riskLevel].name,
      expiredAt
    };
  }

  getUserAssessment(userId) {
    const stmt = db.prepare(`
      SELECT * FROM risk_assessments WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 1
    `);
    const row = stmt.get(userId);
    
    if (row) {
      return {
        ...row,
        answers: JSON.parse(row.answers),
        riskLevelName: RiskLevelMapping[row.risk_level]?.name
      };
    }
    return null;
  }

  isAssessmentValid(assessment) {
    if (!assessment) return false;
    const now = new Date();
    const expiredAt = new Date(assessment.expired_at);
    return now < expiredAt;
  }

  checkPurchaseEligibility(userId, productRiskLevel) {
    const assessment = this.getUserAssessment(userId);
    
    if (!assessment) {
      return {
        eligible: false,
        reason: '未完成风险测评',
        userRiskLevel: null,
        productRiskLevel
      };
    }

    if (!this.isAssessmentValid(assessment)) {
      return {
        eligible: false,
        reason: '风险测评已过期，请重新测评',
        userRiskLevel: assessment.risk_level,
        productRiskLevel
      };
    }

    const canPurchase = this.canPurchaseProduct(assessment.risk_level, productRiskLevel);
    
    return {
      eligible: canPurchase,
      reason: canPurchase ? '风险等级匹配' : '风险等级不匹配，禁止申购该产品',
      userRiskLevel: assessment.risk_level,
      userRiskLevelName: RiskLevelMapping[assessment.risk_level]?.name,
      productRiskLevel
    };
  }
}

export default new RiskProfilingEngine();
export { RiskLevelMapping, RiskQuestions };
