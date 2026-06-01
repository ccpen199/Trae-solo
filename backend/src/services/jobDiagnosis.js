const { db } = require('../database');

function analyzeJobTitle(title) {
  const suggestions = [];
  const keywords = ['高级', '资深', '经理', '主管', '工程师', '开发', '专员', '助理'];
  const hasKeyword = keywords.some(kw => title.includes(kw));
  
  if (!hasKeyword) {
    suggestions.push({
      type: 'warning',
      message: '建议添加职位级别关键词（如：高级、资深、经理等）',
      examples: ['高级前端工程师', '资深产品经理']
    });
  }

  if (title.length < 5) {
    suggestions.push({
      type: 'error',
      message: '职位标题过短，建议包含明确的职能描述',
      examples: ['Java后端开发工程师', '市场营销专员']
    });
  }

  const score = hasKeyword ? 80 : 50;
  return { score, suggestions };
}

function analyzeSalary(salaryMin, salaryMax, location, jobTitle) {
  const suggestions = [];
  const benchmarks = {
    '北京': { dev: 15000, manager: 25000 },
    '上海': { dev: 14000, manager: 24000 },
    '深圳': { dev: 14000, manager: 24000 },
    '杭州': { dev: 12000, manager: 20000 },
    'default': { dev: 10000, manager: 18000 }
  };

  if (!salaryMin || !salaryMax) {
    return {
      score: 40,
      suggestions: [{
        type: 'error',
        message: '请填写明确的薪资区间',
        examples: ['15000-25000']
      }]
    };
  }

  if (salaryMax <= salaryMin) {
    suggestions.push({
      type: 'error',
      message: '薪资上限必须大于薪资下限'
    });
  }

  const range = salaryMax - salaryMin;
  if (range < salaryMin * 0.2) {
    suggestions.push({
      type: 'warning',
      message: '薪资区间过窄，建议扩大范围以吸引更多候选人'
    });
  }

  const benchmark = benchmarks[location] || benchmarks['default'];
  const isManager = jobTitle.includes('经理') || jobTitle.includes('主管');
  const expectedMin = isManager ? benchmark.manager : benchmark.dev;

  if (salaryMax < expectedMin * 0.8) {
    suggestions.push({
      type: 'warning',
      message: `薪资低于${location || '该地区'}市场平均水平，可能影响招聘效果`,
      marketRate: expectedMin
    });
  }

  const score = suggestions.length === 0 ? 90 : Math.max(50, 80 - suggestions.length * 15);
  return { score, suggestions };
}

function analyzeJDDescription(description) {
  const suggestions = [];
  const requiredSections = ['岗位职责', '任职要求', '技能要求', '工作内容'];

  if (!description || description.length < 100) {
    return {
      score: 30,
      suggestions: [{
        type: 'error',
        message: '职位描述内容过短，建议详细描述岗位职责和任职要求'
      }]
    };
  }

  const hasSections = requiredSections.some(s => description.includes(s));
  if (!hasSections) {
    suggestions.push({
      type: 'warning',
      message: '建议包含"岗位职责"和"任职要求"等结构化章节'
    });
  }

  const benefitKeywords = ['五险一金', '年终奖', '带薪年假', '股票期权', '弹性工作'];
  const hasBenefits = benefitKeywords.some(kw => description.includes(kw));
  if (!hasBenefits) {
    suggestions.push({
      type: 'info',
      message: '建议添加公司福利描述以增加吸引力'
    });
  }

  const score = 60 + (hasSections ? 20 : 0) + (hasBenefits ? 20 : 0);
  return { score, suggestions };
}

function complianceCheck(title, description) {
  const violations = [];
  const discriminatoryTerms = {
    '年龄限制': ['35岁以下', '不超过30岁', '年轻团队', '应届生'],
    '性别歧视': ['限男性', '限女性', '男生优先', '女生优先'],
    '地域歧视': ['北京户口', '上海户口', '本地人优先'],
    '健康歧视': ['身体健康', '无传染病', '形象气质佳']
  };

  const fullText = (title + ' ' + description).toLowerCase();

  for (const [category, terms] of Object.entries(discriminatoryTerms)) {
    for (const term of terms) {
      if (fullText.includes(term.toLowerCase())) {
        violations.push({
          category,
          term,
          suggestion: `建议移除"${term}"等可能涉及${category}的表述`
        });
      }
    }
  }

  const salaryPattern = /(\d+)[kK万]/g;
  const hasSalaryMention = salaryPattern.test(fullText);

  return {
    passed: violations.length === 0,
    violations,
    salaryVerified: hasSalaryMention
  };
}

function diagnoseJob(jobData) {
  const titleAnalysis = analyzeJobTitle(jobData.title);
  const salaryAnalysis = analyzeSalary(
    jobData.salary_min,
    jobData.salary_max,
    jobData.location,
    jobData.title
  );
  const jdAnalysis = analyzeJDDescription(jobData.description);
  const compliance = complianceCheck(jobData.title, jobData.description);

  const overallScore = Math.round(
    (titleAnalysis.score * 0.25) +
    (salaryAnalysis.score * 0.25) +
    (jdAnalysis.score * 0.25) +
    (compliance.passed ? 100 : 50) * 0.25
  );

  const result = {
    overallScore,
    titleAnalysis,
    salaryAnalysis,
    jdAnalysis,
    compliance,
    recommendations: [
      ...titleAnalysis.suggestions,
      ...salaryAnalysis.suggestions,
      ...jdAnalysis.suggestions,
      ...compliance.violations.map(v => ({ type: 'error', message: v.suggestion }))
    ],
    canPublish: overallScore >= 60 && compliance.passed
  };

  return result;
}

function saveDiagnosis(jobId, diagnosisResult) {
  const stmt = db.prepare(`
    UPDATE jobs 
    SET diagnosis_result = ?, compliance_score = ?, status = ?
    WHERE id = ?
  `);
  
  stmt.run(
    JSON.stringify(diagnosisResult),
    diagnosisResult.overallScore,
    diagnosisResult.canPublish ? 'reviewed' : 'draft',
    jobId
  );
}

module.exports = {
  diagnoseJob,
  saveDiagnosis,
  analyzeJobTitle,
  analyzeSalary,
  analyzeJDDescription,
  complianceCheck
};
