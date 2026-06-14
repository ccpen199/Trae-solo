
const express = require('express');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/portrait/:resumeId', authenticateToken, (req, res) => {
  const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(req.params.resumeId);

  if (!resume) {
    return res.status(404).json({ error: '简历不存在' });
  }

  const portrait = generateTalentPortrait(resume);

  res.json({
    resume_id: resume.id,
    candidate_name: resume.candidate_name,
    ...portrait
  });
});

router.get('/poaching-risk/:resumeId', authenticateToken, (req, res) => {
  const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(req.params.resumeId);

  if (!resume) {
    return res.status(404).json({ error: '简历不存在' });
  }

  const risk = calculateDetailedPoachingRisk(resume);

  res.json({
    resume_id: resume.id,
    candidate_name: resume.candidate_name,
    ...risk
  });
});

router.get('/salary-band', authenticateToken, (req, res) => {
  const { city, industry, position_level, position } = req.query;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (city) {
    whereClause += ' AND city = ?';
    params.push(city);
  }
  if (industry) {
    whereClause += ' AND industry = ?';
    params.push(industry);
  }
  if (position_level) {
    whereClause += ' AND position_level = ?';
    params.push(position_level);
  }

  let bands = db.prepare(`
    SELECT * FROM salary_bands ${whereClause}
    ORDER BY updated_at DESC
  `).all(...params);

  if (position) {
    const level = detectPositionLevel(position);
    if (level && !position_level) {
      bands = bands.filter(b => b.position_level === level);
    }
  }

  if (bands.length === 0) {
    const estimated = estimateSalaryBand(city, industry, position_level || detectPositionLevel(position || ''));
    return res.json({
      source: 'estimated',
      position_level: position_level || detectPositionLevel(position || ''),
      city,
      industry,
      ...estimated,
      sample_size: 0
    });
  }

  const avgBands = {
    p10: Math.round(bands.reduce((s, b) => s + b.p10, 0) / bands.length),
    p25: Math.round(bands.reduce((s, b) => s + b.p25, 0) / bands.length),
    p50: Math.round(bands.reduce((s, b) => s + b.p50, 0) / bands.length),
    p75: Math.round(bands.reduce((s, b) => s + b.p75, 0) / bands.length),
    p90: Math.round(bands.reduce((s, b) => s + b.p90, 0) / bands.length),
    sample_size: bands.reduce((s, b) => s + b.sample_size, 0)
  };

  res.json({
    source: 'actual',
    position_level,
    city,
    industry,
    ...avgBands,
    details: bands
  });
});

router.post('/portrait-generate', authenticateToken, (req, res) => {
  const resumeData = req.body;
  const portrait = generateTalentPortrait(resumeData);

  res.json({
    portrait_tags: portrait.tags,
    skill_rating: portrait.skill_rating,
    market_value: portrait.market_value,
    career_stage: portrait.career_stage,
    growth_potential: portrait.growth_potential,
    stability_index: portrait.stability_index,
    overall_score: portrait.overall_score,
    recommendations: portrait.recommendations
  });
});

function generateTalentPortrait(resume) {
  const skills = resume.skills ? (Array.isArray(resume.skills) ? resume.skills : resume.skills.split(',')) : [];
  const tags = resume.portrait_tags ? (Array.isArray(resume.portrait_tags) ? resume.portrait_tags : JSON.parse(resume.portrait_tags)) : [];

  let skillScore = 50;
  const hotSkills = ['React', 'Vue', 'Angular', 'TypeScript', 'Node.js', 'Python', 'Java', 'Go', 'Rust', 'AI', '机器学习', '深度学习', '大模型'];
  const skillMatch = skills.filter(s => hotSkills.some(h => s.includes(h))).length;
  skillScore += skillMatch * 8;
  skillScore += Math.min(skills.length * 2, 20);
  skillScore = Math.min(skillScore, 100);

  let marketValue = '中等';
  if (resume.current_salary >= 500000) marketValue = '高';
  else if (resume.current_salary >= 300000) marketValue = '中高';
  else if (resume.current_salary >= 200000) marketValue = '中等';
  else marketValue = '中低';

  let careerStage = '成长期';
  if (resume.work_years >= 10) careerStage = '资深期';
  else if (resume.work_years >= 5) careerStage = '成熟期';
  else if (resume.work_years >= 3) careerStage = '成长期';
  else careerStage = '起步期';

  let growthPotential = 70;
  if (resume.education === '博士') growthPotential += 15;
  else if (resume.education === '硕士') growthPotential += 10;
  else if (resume.education === '本科') growthPotential += 5;

  if (resume.work_years >= 2 && resume.work_years <= 5) growthPotential += 10;
  if (skillMatch >= 2) growthPotential += 10;
  growthPotential = Math.min(growthPotential, 100);

  let stabilityIndex = 60;
  if (resume.work_years >= 8) stabilityIndex += 20;
  else if (resume.work_years >= 5) stabilityIndex += 10;
  
  const hotCompanies = ['字节', '阿里', '腾讯', '百度', '美团', '京东', '拼多多', '华为'];
  if (resume.current_company && hotCompanies.some(c => resume.current_company.includes(c))) {
    stabilityIndex -= 15;
  }
  stabilityIndex = Math.min(Math.max(stabilityIndex, 0), 100);

  const overallScore = Math.round((skillScore + growthPotential + stabilityIndex + (tags.length * 5)) / 3);

  const recommendations = [];
  if (growthPotential >= 80) recommendations.push('重点关注，适合核心岗位');
  if (skillScore >= 80) recommendations.push('技术能力突出，可考虑技术专家路线');
  if (stabilityIndex >= 80) recommendations.push('稳定性高，适合长期培养');
  if (marketValue === '高') recommendations.push('需提供有竞争力的薪酬');
  if (tags.includes('高学历')) recommendations.push('适合研发或算法类岗位');
  if (recommendations.length === 0) recommendations.push('综合评估良好，建议面试深入了解');

  return {
    tags,
    skill_rating: {
      score: skillScore,
      level: skillScore >= 80 ? 'S' : skillScore >= 65 ? 'A' : skillScore >= 50 ? 'B' : 'C',
      matched_hot_skills: skillMatch
    },
    market_value: {
      level: marketValue,
      current_salary: resume.current_salary,
      expected_min: resume.expected_salary_min,
      expected_max: resume.expected_salary_max
    },
    career_stage: careerStage,
    growth_potential: growthPotential,
    stability_index: stabilityIndex,
    overall_score: overallScore,
    recommendations
  };
}

function calculateDetailedPoachingRisk(resume) {
  let baseRisk = resume.poaching_risk || 0.5;
  const factors = [];

  if (resume.expected_salary_min && resume.current_salary) {
    const expectIncrease = (resume.expected_salary_min - resume.current_salary) / resume.current_salary;
    if (expectIncrease > 0.3) {
      factors.push({ factor: '薪资期望涨幅大', impact: 'high', score: 0.25 });
    } else if (expectIncrease > 0.15) {
      factors.push({ factor: '薪资期望有一定涨幅', impact: 'medium', score: 0.15 });
    }
  }

  if (resume.work_years >= 3 && resume.work_years <= 8) {
    factors.push({ factor: '处于职业黄金上升期', impact: 'high', score: 0.15 });
  }

  if (resume.age >= 25 && resume.age <= 32) {
    factors.push({ factor: '年龄处于高流动区间', impact: 'medium', score: 0.1 });
  }

  const hotCompanies = ['字节', '阿里', '腾讯', '百度', '美团', '京东', '拼多多', '华为'];
  if (resume.current_company && hotCompanies.some(c => resume.current_company.includes(c))) {
    factors.push({ factor: '来自头部企业', impact: 'high', score: 0.2 });
  }

  const skills = resume.skills ? (Array.isArray(resume.skills) ? resume.skills : resume.skills.split(',')) : [];
  const hotSkills = ['AI', '机器学习', '深度学习', '大模型', 'Go', 'Rust', '云原生', 'K8s'];
  const matchedHotSkills = skills.filter(s => hotSkills.some(h => s.includes(h)));
  if (matchedHotSkills.length > 0) {
    factors.push({ factor: `掌握稀缺技能(${matchedHotSkills.join(',')})`, impact: 'high', score: 0.15 });
  }

  const competitors = ['同行业', '竞品公司', '直接竞争对手'];
  const competitorRisk = competitors.some(c => resume.experience?.includes(c) || resume.current_company?.includes(c));
  if (competitorRisk) {
    factors.push({ factor: '竞对公司背景', impact: 'very_high', score: 0.3 });
  }

  const totalRiskScore = Math.min(0.3 + factors.reduce((s, f) => s + f.score, 0), 0.98);

  let riskLevel = 'low';
  let riskDescription = '挖角难度较低，成功概率较高';
  if (totalRiskScore >= 0.8) {
    riskLevel = 'very_high';
    riskDescription = '挖角难度极高，属于市场稀缺人才，建议提供有竞争力的package';
  } else if (totalRiskScore >= 0.65) {
    riskLevel = 'high';
    riskDescription = '挖角难度较高，需要有明显的薪资或职级提升';
  } else if (totalRiskScore >= 0.5) {
    riskLevel = 'medium';
    riskDescription = '挖角难度中等，需匹配合理的薪资和发展空间';
  } else if (totalRiskScore >= 0.35) {
    riskLevel = 'low';
    riskDescription = '挖角难度较低，成功概率较高';
  } else {
    riskLevel = 'very_low';
    riskDescription = '挖角难度很低，候选人流动意愿强';
  }

  const suggestions = [];
  if (matchedHotSkills.length > 0) {
    suggestions.push('候选人掌握热门稀缺技能，建议尽快联系');
  }
  if (resume.expected_salary_min) {
    suggestions.push(`薪资预算建议不低于 ${resume.expected_salary_min.toLocaleString()} 元/年`);
  }
  if (totalRiskScore >= 0.7) {
    suggestions.push('建议提供签字费、期权等额外激励');
    suggestions.push('可考虑安排高管面试，增加吸引力');
  }
  if (suggestions.length === 0) {
    suggestions.push('按正常流程推进即可');
  }

  return {
    risk_score: totalRiskScore,
    risk_level: riskLevel,
    risk_description: riskDescription,
    base_risk: baseRisk,
    factors,
    suggestions,
    poaching_index: Math.round((1 - totalRiskScore) * 100)
  };
}

function detectPositionLevel(position) {
  if (!position) return '';
  if (position.includes('资深') || position.includes('高级') || position.includes('资深') || position.includes('Sr')) {
    return '高级工程师';
  }
  if (position.includes('专家') || position.includes('架构师') || position.includes('主管') || position.includes('经理')) {
    return '高级工程师';
  }
  if (position.includes('中级') || position.includes('工程师') && !position.includes('初级')) {
    return '中级工程师';
  }
  if (position.includes('初级') || position.includes('实习') || position.includes('助理')) {
    return '初级工程师';
  }
  return '中级工程师';
}

function estimateSalaryBand(city, industry, positionLevel) {
  const baseP50 = 250000;
  let multiplier = 1;

  if (city === '北京' || city === '上海' || city === '深圳') {
    multiplier *= 1.2;
  } else if (city === '杭州' || city === '广州') {
    multiplier *= 1.1;
  }

  if (industry === '金融') {
    multiplier *= 1.15;
  } else if (industry === '互联网') {
    multiplier *= 1.1;
  }

  if (positionLevel === '高级工程师') {
    multiplier *= 1.4;
  } else if (positionLevel === '中级工程师') {
    multiplier *= 1.0;
  } else if (positionLevel === '初级工程师') {
    multiplier *= 0.7;
  }

  const p50 = Math.round(baseP50 * multiplier);

  return {
    p10: Math.round(p50 * 0.65),
    p25: Math.round(p50 * 0.8),
    p50,
    p75: Math.round(p50 * 1.25),
    p90: Math.round(p50 * 1.55)
  };
}

module.exports = router;
