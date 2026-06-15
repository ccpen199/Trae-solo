import {
  SkillItem,
  RequiredSkill,
  Resume,
  JobPosition,
  MatchDimension,
  MatchResult,
  TownshipCode,
} from '../../shared/types/index.js';

const TOWNSHIP_DATA: any[] = [];
function getTownship(code: TownshipCode): any { return null; }

const EDUCATION_RANK: Record<string, number> = {
  '不限': 0,
  '初中': 1,
  '高中': 2,
  '中专': 2,
  '大专': 3,
  '本科': 4,
  '硕士': 5,
  '博士': 6,
};

const EXPERIENCE_RANK: Record<string, [number, number]> = {
  '不限': [0, 50],
  '应届生': [0, 1],
  '1-3年': [1, 3],
  '3-5年': [3, 5],
  '5-10年': [5, 10],
  '10年+': [10, 50],
};

const DIMENSION_WEIGHTS = {
  skillMatch: 0.35,
  experienceMatch: 0.20,
  educationMatch: 0.15,
  locationMatch: 0.15,
  salaryMatch: 0.15,
};

export function calculateSkillMatch(
  skillList: SkillItem[],
  requiredSkills: RequiredSkill[]
): number {
  if (!requiredSkills || requiredSkills.length === 0) return 85;
  if (!skillList || skillList.length === 0) return 20;

  const skillNames = new Set(skillList.map(s => s.name));
  let totalWeight = 0;
  let matchedWeight = 0;
  let requiredWeight = 0;

  requiredSkills.forEach(req => {
    totalWeight += req.weight;
    if (req.required) requiredWeight += req.weight;

    const hasSkill = skillNames.has(req.name);
    if (hasSkill) {
      const skill = skillList.find(s => s.name === req.name)!;
      const levelBonus = ((skill as any).proficiency / 5) * 0.2 + 0.8;
      matchedWeight += req.weight * levelBonus;
    }
  });

  if (totalWeight === 0) return 85;

  const baseScore = (matchedWeight / totalWeight) * 100;
  const extraSkills = Math.max(0, skillList.length - requiredSkills.length);
  const extraBonus = Math.min(extraSkills * 1.5, 10);

  return Math.min(100, Math.round(baseScore + extraBonus));
}

export function calculateExperienceMatch(
  workYears: number,
  requiredExperience: JobPosition['experience']
): number {
  const range = EXPERIENCE_RANK[requiredExperience] || [0, 50];

  if (requiredExperience === '不限') return 100;

  const [min, max] = range;

  if (workYears >= min && workYears <= max) {
    return 100;
  }

  if (workYears < min) {
    const gap = min - workYears;
    return Math.max(40, 100 - gap * 15);
  }

  const overage = workYears - max;
  return Math.max(70, 100 - overage * 3);
}

export function calculateEducationMatch(
  education: Resume['basicInfo'] extends infer T ? T extends { education: infer E } ? E : any : any,
  requiredEducation: JobPosition['education']
): number {
  if (requiredEducation === '不限') return 100;

  const seekerRank = EDUCATION_RANK[education as string] || 0;
  const requiredRank = EDUCATION_RANK[requiredEducation] || 0;

  if (seekerRank >= requiredRank) {
    const excess = seekerRank - requiredRank;
    return Math.min(100, 100 + excess * 3);
  }

  const gap = requiredRank - seekerRank;
  if (gap === 1) return 70;
  if (gap === 2) return 50;
  return Math.max(20, 40 - (gap - 2) * 15);
}

export function calculateLocationMatch(
  township1: TownshipCode,
  township2: TownshipCode
): number {
  if (township1 === township2) return 100;

  const t1 = getTownship(township1);
  const t2 = getTownship(township2);

  if (!t1 || !t2) return 50;

  if (t1.adjacentTownships.includes(township2) || t2.adjacentTownships.includes(township1)) {
    return 80;
  }

  return 50;
}

export function calculateSalaryMatch(
  salaryRange1: [number, number],
  salaryRange2: [number, number]
): number {
  const [min1, max1] = salaryRange1;
  const [min2, max2] = salaryRange2;

  const overlapStart = Math.max(min1, min2);
  const overlapEnd = Math.min(max1, max2);
  const overlap = Math.max(0, overlapEnd - overlapStart);

  const range1 = max1 - min1;
  const range2 = max2 - min2;

  if (range1 === 0 && range2 === 0) {
    return min1 === min2 ? 100 : 0;
  }

  const smallerRange = Math.min(range1, range2) || 1;
  const overlapRatio = overlap / smallerRange;

  if (overlap > 0) {
    return Math.min(100, Math.round(overlapRatio * 100));
  }

  const minDistance = Math.abs(min1 - max2) || Math.abs(min2 - max1);
  const avgRange = (range1 + range2) / 2 || 1;
  const distancePenalty = Math.min(minDistance / avgRange, 1);

  return Math.max(20, Math.round(100 * (1 - distancePenalty * 0.8)));
}

export function calculateTotalMatch(
  resume: Resume,
  position: JobPosition
): any {
  const skillList = (resume as any).skillList || resume.skills || [];
  const basicInfo = resume.basicInfo || {
    workYears: (resume as any).workExperienceList?.length || 2,
    education: '大专' as const,
    location: TownshipCode.XL,
  };
  const salaryRange = (position as any).salaryRange || [position.salaryMin || 4000, position.salaryMax || 8000];

  const dimensions: any = {
    skillMatch: calculateSkillMatch(skillList, position.requiredSkills),
    experienceMatch: calculateExperienceMatch(basicInfo.workYears, position.experience),
    educationMatch: calculateEducationMatch(basicInfo.education, position.education),
    locationMatch: calculateLocationMatch(basicInfo.location, position.township),
    salaryMatch: calculateSalaryMatch(
      [basicInfo.workYears * 800 + 3500, basicInfo.workYears * 1500 + 6000],
      salaryRange as [number, number]
    ),
  };

  const totalScore = Math.round(
    dimensions.skillMatch * DIMENSION_WEIGHTS.skillMatch +
    dimensions.experienceMatch * DIMENSION_WEIGHTS.experienceMatch +
    dimensions.educationMatch * DIMENSION_WEIGHTS.educationMatch +
    dimensions.locationMatch * DIMENSION_WEIGHTS.locationMatch +
    dimensions.salaryMatch * DIMENSION_WEIGHTS.salaryMatch
  );

  return {
    id: `match_${Date.now()}_${position.id}`,
    jobSeekerId: resume.jobSeekerId,
    overallScore: totalScore,
    totalScore,
    dimensions,
    gaps: [],
    strengths: [],
    matchedAt: new Date().toISOString(),
    recommended: totalScore >= 70,
  };
}

export function generateGapAnalysis(
  dimensions: any,
  resume: Resume,
  position: JobPosition
): any {
  const skillList = (resume as any).skillList || resume.skills || [];
  const missingSkills: string[] = [];
  const suggestions: string[] = [];

  const resumeSkillNames = new Set(skillList.map((s: any) => typeof s.name === 'string' ? s.name : String(s.name || '')));
  position.requiredSkills.forEach(req => {
    if (!resumeSkillNames.has(req.name)) {
      missingSkills.push(req.name);
    }
  });

  if (missingSkills.length > 0) {
    suggestions.push(`建议补充以下技能：${missingSkills.join('、')}`);
  } else {
    suggestions.push('技能要求已全部满足');
  }

  if (dimensions.experienceMatch < 80) {
    suggestions.push('工作经验略短，可重点突出项目实操能力');
  }

  if (dimensions.educationMatch < 80) {
    suggestions.push('建议通过学历提升通道获取更高学历');
  }

  if (dimensions.locationMatch < 80) {
    suggestions.push('工作地点距离稍远，可考虑附近镇街相似职位');
  }

  if (dimensions.salaryMatch < 70) {
    suggestions.push('薪资期望与岗位区间略有差异，可协商或关注企业其他福利');
  }

  const lowSkills = skillList.filter((s: any) => ((s as any).level || s.proficiency || 3) <= 2);
  if (lowSkills.length > 0 && position.requiredSkills.some(r => lowSkills.some((l: any) => typeof l.name === 'string' && l.name === r.name))) {
    suggestions.push('部分核心技能熟练度有待提升，建议通过项目实践加强');
  }

  if (dimensions.skillMatch >= 90 && dimensions.experienceMatch >= 80) {
    suggestions.push('核心竞争力匹配度高，建议尽快投递并准备面试');
  }

  const gaps: any[] = [];
  const dimKeys: any[] = ['skillMatch', 'experienceMatch', 'educationMatch', 'locationMatch', 'salaryMatch'];
  dimKeys.forEach(key => {
    if (dimensions[key] < 80) {
      gaps.push({
        dimension: key,
        score: dimensions[key],
        description: `${String(key)} 匹配度偏低`,
        suggestion: suggestions.shift() || '建议综合提升',
      });
    }
  });

  return {
    gaps,
    missingSkills,
    suggestions: suggestions.slice(0, 5),
  };
}

export function calculateMatch(
  resume: Resume,
  position: JobPosition
): any {
  const result = calculateTotalMatch(resume, position);
  const gapResult = generateGapAnalysis(result.dimensions, resume, position);

  return {
    id: result.id,
    jobSeekerId: resume.jobSeekerId,
    positionId: position.id,
    jobPositionId: position.id,
    positionTitle: position.title,
    enterpriseName: (position as any).enterpriseName,
    resumeId: resume.id,
    overallScore: result.overallScore,
    totalScore: result.totalScore,
    dimensions: result.dimensions,
    matchDimensions: result.dimensions,
    gaps: gapResult.gaps,
    gapAnalysis: gapResult.gaps,
    missingSkills: gapResult.missingSkills,
    improvementSuggestions: gapResult.suggestions,
    strengths: [
      result.dimensions.skillMatch >= 80 ? '技能匹配良好' : '',
      result.dimensions.experienceMatch >= 80 ? '经验匹配良好' : '',
    ].filter(Boolean),
    matchedAt: result.matchedAt,
    updatedAt: new Date().toISOString(),
    recommended: result.recommended,
    jobPosition: position,
  } as MatchResult;
}

export function batchCalculateMatches(
  resume: Resume,
  positions: JobPosition[],
  limit: number = 20
): MatchResult[] {
  return positions
    .map(p => calculateMatch(resume, p))
    .sort((a, b) => (b as any).totalScore - (a as any).totalScore)
    .slice(0, limit);
}
