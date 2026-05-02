import { db } from '../database/init.js';

const CREDIT_FACTORS = {
  basicInfo: {
    weight: 0.15,
    evaluate: (borrower) => {
      let score = 60;
      const idCard = borrower.id_card || '';
      if (idCard.length === 18) {
        const birthYear = parseInt(idCard.substring(6, 10));
        const currentYear = new Date().getFullYear();
        const age = currentYear - birthYear;
        if (age >= 25 && age <= 45) score = 100;
        else if (age >= 20 && age < 25 || age > 45 && age <= 55) score = 80;
        else if (age >= 18 && age < 20 || age > 55) score = 60;
        else score = 40;
      }
      return score;
    }
  },
  creditHistory: {
    weight: 0.35,
    evaluate: (borrower, creditReportData) => {
      const baseScore = borrower.credit_score || 650;
      const reportData = creditReportData ? JSON.parse(creditReportData) : {};
      
      let score = (baseScore - 300) / 5.5;
      
      if (reportData.overdue_count) {
        if (reportData.overdue_count === 0) score = Math.min(score + 10, 100);
        else if (reportData.overdue_count <= 2) score = Math.max(score - 10, 0);
        else score = Math.max(score - 30, 0);
      }
      
      if (reportData.existing_loans) {
        const loanCount = reportData.existing_loans;
        if (loanCount === 0) score = Math.min(score + 5, 100);
        else if (loanCount <= 2) score = Math.min(score + 2, 100);
        else if (loanCount <= 5) score = Math.max(score - 5, 0);
        else score = Math.max(score - 15, 0);
      }
      
      return Math.max(0, Math.min(100, score));
    }
  },
  repaymentAbility: {
    weight: 0.30,
    evaluate: (application, borrower) => {
      let score = 70;
      const loanAmount = parseFloat(application.loan_amount) || 0;
      const loanTerm = application.loan_term || 12;
      
      const monthlyPayment = loanAmount / loanTerm * (1 + 0.0065);
      const estimatedIncome = 15000;
      const dti = monthlyPayment / estimatedIncome;
      
      if (dti <= 0.3) score = 100;
      else if (dti <= 0.5) score = 80;
      else if (dti <= 0.7) score = 60;
      else score = 40;
      
      return score;
    }
  },
  loanPurpose: {
    weight: 0.10,
    evaluate: (application) => {
      const purpose = application.purpose || '';
      const purposeScores = {
        '购房': 100,
        '购车': 90,
        '装修': 85,
        '教育': 85,
        '医疗': 80,
        '创业': 70,
        '消费': 75,
        '其他': 60
      };
      return purposeScores[purpose] || 65;
    }
  },
  relationshipLength: {
    weight: 0.10,
    evaluate: (borrower, application, historicalApps) => {
      let score = 50;
      const appCount = historicalApps?.length || 0;
      
      if (appCount === 0) {
        score = 50;
      } else {
        const repaidApps = historicalApps?.filter(a => a.status === 'repaid')?.length || 0;
        if (repaidApps >= 3) score = 100;
        else if (repaidApps >= 1) score = 80;
        else if (appCount > 0) score = 65;
      }
      
      return score;
    }
  }
};

const calculateCreditScore = async (application, borrower, creditReportData = null) => {
  const historicalApps = db.prepare(`
    SELECT * FROM loan_applications 
    WHERE borrower_id = ? AND id != ?
    ORDER BY created_at DESC
  `).all(borrower.id, application.id);

  let totalScore = 0;
  const factorScores = {};

  for (const [factorName, factor] of Object.entries(CREDIT_FACTORS)) {
    let factorScore;
    switch (factorName) {
      case 'basicInfo':
        factorScore = factor.evaluate(borrower);
        break;
      case 'creditHistory':
        factorScore = factor.evaluate(borrower, creditReportData);
        break;
      case 'repaymentAbility':
        factorScore = factor.evaluate(application, borrower);
        break;
      case 'loanPurpose':
        factorScore = factor.evaluate(application);
        break;
      case 'relationshipLength':
        factorScore = factor.evaluate(borrower, application, historicalApps);
        break;
      default:
        factorScore = 60;
    }
    
    factorScores[factorName] = {
      rawScore: factorScore,
      weightedScore: factorScore * factor.weight,
      weight: factor.weight
    };
    totalScore += factorScore * factor.weight;
  }

  const finalScore = Math.round(totalScore);

  db.prepare(`
    UPDATE loan_applications 
    SET credit_score = ?, credit_report_data = ?
    WHERE id = ?
  `).run(finalScore, creditReportData || JSON.stringify({}), application.id);

  const result = {
    creditScore: finalScore,
    creditLevel: getCreditLevel(finalScore),
    suggestion: getScoreSuggestion(finalScore),
    factorBreakdown: factorScores
  };

  return result;
};

const getCreditLevel = (score) => {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
};

const getScoreSuggestion = (score) => {
  if (score >= 85) return { action: 'auto_approve', message: '信用优秀，建议自动审批通过' };
  if (score >= 75) return { action: 'approve', message: '信用良好，建议审批通过' };
  if (score >= 65) return { action: 'review', message: '信用一般，建议人工复核' };
  if (score >= 55) return { action: 'escalate', message: '信用偏低，建议升级审批' };
  return { action: 'reject', message: '信用不足，建议拒贷' };
};

const simulateCreditReport = (idCard, borrower) => {
  const baseCredit = borrower?.credit_score || 650;
  
  const randomFactor = Math.floor(Math.random() * 41) - 20;
  const adjustedCredit = Math.max(350, Math.min(950, baseCredit + randomFactor));
  
  const overdueCount = adjustedCredit > 750 ? 0 : adjustedCredit > 650 ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 5);
  const existingLoans = adjustedCredit > 700 ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 6);
  
  return {
    credit_score: adjustedCredit,
    overdue_count: overdueCount,
    existing_loans: existingLoans,
    query_count: Math.floor(Math.random() * 10),
    credit_accounts: Math.floor(Math.random() * 8) + 1,
    report_date: new Date().toISOString().split('T')[0],
    raw_data_source: 'simulated_credit_bureau'
  };
};

export { calculateCreditScore, getCreditLevel, getScoreSuggestion, simulateCreditReport };
