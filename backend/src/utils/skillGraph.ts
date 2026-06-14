import { SkillCategory } from '../entities/Skill';

export interface SkillNode {
  name: string;
  category: SkillCategory;
  aliases: string[];
  relatedSkills: string[];
  weight: number;
}

export interface SkillMatchResult {
  skill: string;
  matchedSkill: string;
  similarity: number;
  category: SkillCategory;
}

const SKILL_GRAPH: Record<string, SkillNode> = {
  'Photoshop': {
    name: 'Photoshop',
    category: 'prepress',
    aliases: ['PS', 'ps', 'Adobe Photoshop', 'photoshop'],
    relatedSkills: ['Illustrator', 'InDesign', 'CorelDRAW'],
    weight: 1.0
  },
  'Illustrator': {
    name: 'Illustrator',
    category: 'prepress',
    aliases: ['AI', 'ai', 'Adobe Illustrator', 'illustrator'],
    relatedSkills: ['Photoshop', 'InDesign', 'CorelDRAW'],
    weight: 1.0
  },
  'CorelDRAW': {
    name: 'CorelDRAW',
    category: 'prepress',
    aliases: ['CDR', 'cdr', 'Corel Draw', 'coreldraw'],
    relatedSkills: ['Photoshop', 'Illustrator', 'InDesign'],
    weight: 0.9
  },
  'InDesign': {
    name: 'InDesign',
    category: 'prepress',
    aliases: ['ID', 'id', 'Adobe InDesign', 'indesign'],
    relatedSkills: ['Photoshop', 'Illustrator', '排版设计'],
    weight: 0.8
  },
  'CTP制版': {
    name: 'CTP制版',
    category: 'prepress',
    aliases: ['CTP', 'ctp', '计算机直接制版', '晒版'],
    relatedSkills: ['PS版', '菲林输出', '拼版'],
    weight: 1.0
  },
  'PS版': {
    name: 'PS版',
    category: 'prepress',
    aliases: ['ps版', 'PS版制作'],
    relatedSkills: ['CTP制版', '晒版', '菲林输出'],
    weight: 0.9
  },
  '拼版': {
    name: '拼版',
    category: 'prepress',
    aliases: ['拼大版', '组版', '排版'],
    relatedSkills: ['CTP制版', '菲林输出'],
    weight: 0.8
  },
  '色彩管理': {
    name: '色彩管理',
    category: 'prepress',
    aliases: ['色彩控制', '颜色管理', 'ICC', '色彩校正'],
    relatedSkills: ['印刷工艺', '调墨'],
    weight: 1.0
  },
  '海德堡': {
    name: '海德堡',
    category: 'printing',
    aliases: ['Heidelberg', 'heidelberg', '海德堡印刷机'],
    relatedSkills: ['小森', '罗兰', '胶印'],
    weight: 1.0
  },
  '小森': {
    name: '小森',
    category: 'printing',
    aliases: ['Komori', 'komori', '小森印刷机'],
    relatedSkills: ['海德堡', '罗兰', '胶印'],
    weight: 0.95
  },
  '罗兰': {
    name: '罗兰',
    category: 'printing',
    aliases: ['Roland', 'roland', '曼罗兰', 'Manroland', '罗兰印刷机'],
    relatedSkills: ['海德堡', '小森', '胶印'],
    weight: 0.95
  },
  '胶印': {
    name: '胶印',
    category: 'printing',
    aliases: ['平版印刷', 'offset', 'Offset'],
    relatedSkills: ['海德堡', '小森', '罗兰', '凹印', '柔印'],
    weight: 1.0
  },
  '凹印': {
    name: '凹印',
    category: 'printing',
    aliases: ['凹版印刷', 'gravure', 'Gravure'],
    relatedSkills: ['胶印', '柔印', '凹印机操作'],
    weight: 1.0
  },
  '柔印': {
    name: '柔印',
    category: 'printing',
    aliases: ['柔性版印刷', 'flexo', 'Flexo', '柔版印刷'],
    relatedSkills: ['胶印', '凹印', '柔印机操作'],
    weight: 0.9
  },
  '调墨': {
    name: '调墨',
    category: 'printing',
    aliases: ['配墨', '油墨调配'],
    relatedSkills: ['色彩管理', '印刷工艺'],
    weight: 0.9
  },
  '印刷工艺': {
    name: '印刷工艺',
    category: 'printing',
    aliases: ['印刷技术', '印刷流程'],
    relatedSkills: ['调墨', '色彩管理', '质量控制'],
    weight: 1.0
  },
  '模切': {
    name: '模切',
    category: 'postpress',
    aliases: ['die cutting', 'Die Cutting'],
    relatedSkills: ['烫金', '覆膜', '裱纸'],
    weight: 1.0
  },
  '烫金': {
    name: '烫金',
    category: 'postpress',
    aliases: ['烫印', 'hot stamping', 'Hot Stamping'],
    relatedSkills: ['模切', '覆膜', '击凸'],
    weight: 0.95
  },
  '覆膜': {
    name: '覆膜',
    category: 'postpress',
    aliases: ['过胶', 'lamination', 'Lamination'],
    relatedSkills: ['模切', '烫金', '裱纸'],
    weight: 0.9
  },
  '裱纸': {
    name: '裱纸',
    category: 'postpress',
    aliases: ['覆面', '对裱', 'mounting', 'Mounting'],
    relatedSkills: ['模切', '覆膜'],
    weight: 0.85
  },
  '装订': {
    name: '装订',
    category: 'postpress',
    aliases: ['胶装', '骑马钉', '精装'],
    relatedSkills: ['模切', '覆膜'],
    weight: 0.9
  },
  '质量管理': {
    name: '质量管理',
    category: 'management',
    aliases: ['质量控制', 'QC', 'qc', '品质管理'],
    relatedSkills: ['ISO9001', 'ISO14001', '生产管理'],
    weight: 1.0
  },
  'ISO9001': {
    name: 'ISO9001',
    category: 'management',
    aliases: ['ISO 9001', 'iso9001', '质量管理体系'],
    relatedSkills: ['ISO14001', 'ISO45001', '质量管理'],
    weight: 1.0
  },
  'ISO14001': {
    name: 'ISO14001',
    category: 'management',
    aliases: ['ISO 14001', 'iso14001', '环境管理体系'],
    relatedSkills: ['ISO9001', 'ISO45001', '环境管理'],
    weight: 0.95
  },
  '生产管理': {
    name: '生产管理',
    category: 'management',
    aliases: ['生产调度', '车间管理'],
    relatedSkills: ['质量管理', '设备维护'],
    weight: 0.9
  },
  '设备维护': {
    name: '设备维护',
    category: 'management',
    aliases: ['设备保养', '设备维修'],
    relatedSkills: ['生产管理', '印刷工艺'],
    weight: 0.85
  }
};

const SKILL_NAME_NORMALIZATION: Record<string, string> = {};
Object.values(SKILL_GRAPH).forEach(node => {
  SKILL_NAME_NORMALIZATION[node.name.toLowerCase()] = node.name;
  node.aliases.forEach(alias => {
    SKILL_NAME_NORMALIZATION[alias.toLowerCase()] = node.name;
  });
});

export function normalizeSkillName(skillName: string): string {
  const normalized = SKILL_NAME_NORMALIZATION[skillName.toLowerCase().trim()];
  return normalized || skillName.trim();
}

export function getSkillCategory(skillName: string): SkillCategory {
  const normalized = normalizeSkillName(skillName);
  const node = SKILL_GRAPH[normalized];
  return node?.category || 'printing';
}

export function calculateSkillSimilarity(skill1: string, skill2: string): number {
  const norm1 = normalizeSkillName(skill1);
  const norm2 = normalizeSkillName(skill2);

  if (norm1 === norm2) {
    return 1.0;
  }

  const node1 = SKILL_GRAPH[norm1];
  const node2 = SKILL_GRAPH[norm2];

  if (!node1 || !node2) {
    return 0;
  }

  if (node1.relatedSkills.includes(norm2) || node2.relatedSkills.includes(norm1)) {
    return 0.6;
  }

  if (node1.category === node2.category) {
    return 0.3;
  }

  return 0.1;
}

export function calculateSkillMatchScore(
  jobSkills: string[],
  resumeSkills: string[]
): {
  overallScore: number;
  matchedSkills: SkillMatchResult[];
  matchedCount: number;
  totalRequired: number;
} {
  if (!jobSkills || jobSkills.length === 0) {
    return {
      overallScore: 0,
      matchedSkills: [],
      matchedCount: 0,
      totalRequired: 0
    };
  }

  const normalizedJobSkills = jobSkills.map(s => normalizeSkillName(s));
  const normalizedResumeSkills = resumeSkills ? resumeSkills.map(s => normalizeSkillName(s)) : [];

  const matchedSkills: SkillMatchResult[] = [];
  let totalScore = 0;

  normalizedJobSkills.forEach(jobSkill => {
    let bestMatch: { skill: string; similarity: number } = {
      skill: '',
      similarity: 0
    };

    normalizedResumeSkills.forEach(resumeSkill => {
      const similarity = calculateSkillSimilarity(jobSkill, resumeSkill);
      if (similarity > bestMatch.similarity) {
        bestMatch = { skill: resumeSkill, similarity };
      }
    });

    if (bestMatch.similarity > 0) {
      const node = SKILL_GRAPH[jobSkill];
      const weight = node?.weight || 0.5;
      const weightedScore = bestMatch.similarity * weight;
      totalScore += weightedScore;

      matchedSkills.push({
        skill: jobSkill,
        matchedSkill: bestMatch.skill,
        similarity: bestMatch.similarity,
        category: getSkillCategory(jobSkill)
      });
    }
  });

  const totalWeight = normalizedJobSkills.reduce((sum, skill) => {
    const node = SKILL_GRAPH[skill];
    return sum + (node?.weight || 0.5);
  }, 0);

  const overallScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

  return {
    overallScore,
    matchedSkills,
    matchedCount: matchedSkills.filter(m => m.similarity >= 0.6).length,
    totalRequired: normalizedJobSkills.length
  };
}

export function getSkillsByCategory(category: SkillCategory): string[] {
  return Object.values(SKILL_GRAPH)
    .filter(node => node.category === category)
    .map(node => node.name);
}

export function getAllSkills(): string[] {
  return Object.keys(SKILL_GRAPH);
}

export function getSkillGraph(): Record<string, SkillNode> {
  return { ...SKILL_GRAPH };
}

export const skillGraph = {
  normalizeSkillName,
  getSkillCategory,
  calculateSkillSimilarity,
  calculateSkillMatchScore,
  getSkillsByCategory,
  getAllSkills,
  getSkillGraph
};
