import type {
  Resume,
  TemplateCategory,
  DiagnosisResult,
  EmptyPhraseIssue,
  TimelineConflict,
  MissingKeywordIssue,
} from '../types';
import { normalizeResumeForChecks } from './resumeNormalize';

const WEAK_VERBS = ['负责', '参与', '协助', '做了', '完成', '跟进', '处理', '进行', '支持', '配合'];

const STRONG_VERBS_MAP: Record<string, string[]> = {
  负责: ['主导', '统筹', '牵头', '管理', '把控'],
  参与: ['核心参与', '深度参与', '负责', '推动', '执行'],
  协助: ['支撑', '赋能', '推动', '优化', '促进'],
  做了: ['实现', '搭建', '开发', '设计', '构建'],
  完成: ['落地', '交付', '上线', '达成', '攻克'],
  跟进: ['推进', '驱动', '督导', '追踪', '协调'],
  处理: ['解决', '攻克', '优化', '治理', '化解'],
  进行: ['开展', '实施', '推进', '执行', '落地'],
  支持: ['支撑', '保障', '赋能', '助力', '推动'],
  配合: ['协同', '联动', '对接', '整合', '协调'],
};

const QUANTIFIERS_PATTERN = /\d+[%％倍个万kKmMgG吨人天月年小时]|提升|降低|增长|减少|优化|节省|新增|覆盖/;

const INDUSTRY_KEYWORDS: Record<TemplateCategory, string[]> = {
  tech: ['React', 'Vue', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'Git', 'Webpack', 'Vite', 'API', '微服务', '算法', '数据结构', 'Linux', 'Nginx'],
  design: ['Figma', 'Sketch', 'UI', 'UX', 'Photoshop', 'Illustrator', '原型设计', '交互设计', '视觉设计', '用户研究', '设计系统', '移动端', '响应式', '动效设计', '图标设计', '品牌设计'],
  function: ['项目管理', '数据分析', 'Excel', 'PPT', 'SQL', 'Python', 'OKR', 'KPI', '流程优化', '跨部门协作', '风险管理', '预算管理', '团队管理', '客户关系', '商务谈判', '市场调研'],
};

function detectEmptyPhrases(resume: Resume): EmptyPhraseIssue[] {
  const issues: EmptyPhraseIssue[] = [];

  const checkText = (text: string, location: string) => {
    for (const verb of WEAK_VERBS) {
      const regex = new RegExp(verb, 'g');
      const matches = text.match(regex);
      if (matches) {
        const hasQuantifier = QUANTIFIERS_PATTERN.test(text);
        if (!hasQuantifier) {
          const strongVerbs = STRONG_VERBS_MAP[verb] || ['优化', '推动', '实现'];
          const strongVerb = strongVerbs[0];
          issues.push({
            text,
            location,
            suggestion: `建议将"${verb}"替换为"${strongVerbs.join('/')}"，并补充量化数据`,
            strongVerb,
            starTemplate: `S: 面临的背景与挑战\nT: 具体目标与任务\nA: ${strongVerb}的具体行动与方法\nR: 可量化的成果与影响（如：提升XX%、节省XX万、覆盖XX人）`,
          });
          break;
        }
      }
    }
  };

  if (resume.summary) {
    checkText(resume.summary, '个人简介');
  }

  resume.experience?.forEach((work, idx) => {
    if (work.description) {
      checkText(work.description, `工作经历-${work.company || idx + 1}-描述`);
    }
    work.highlights?.forEach((highlight, hlIdx) => {
      checkText(highlight, `工作经历-${work.company || idx + 1}-亮点${hlIdx + 1}`);
    });
  });

  resume.projects?.forEach((project, idx) => {
    if (project.description) {
      checkText(project.description, `项目经历-${project.name || idx + 1}-描述`);
    }
    project.highlights?.forEach((highlight, hlIdx) => {
      checkText(highlight, `项目经历-${project.name || idx + 1}-亮点${hlIdx + 1}`);
    });
  });

  return issues;
}

function parseDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const cleaned = dateStr.replace(/[年月.]/g, '-').replace(/日/g, '').replace(/--/g, '-').replace(/-$/, '');
  const parts = cleaned.split('-').map(p => parseInt(p.trim(), 10));
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return new Date(parts[0], parts[1] - 1, parts[2] || 1);
  }
  const simple = new Date(cleaned);
  return isNaN(simple.getTime()) ? null : simple;
}

function detectTimelineConflicts(resume: Resume): TimelineConflict[] {
  const conflicts: TimelineConflict[] = [];
  const allRanges: Array<{ start: Date | null; end: Date | null; location: string; item: { startDate?: string; endDate?: string } }> = [];

  resume.education?.forEach((edu, idx) => {
    const location = `教育经历-${edu.school || idx + 1}`;
    const start = parseDate(edu.startDate);
    const end = parseDate(edu.endDate);
    allRanges.push({ start, end, location, item: edu });

    if (start && end && end < start) {
      conflicts.push({
        type: 'invalid',
        location,
        startDate: edu.startDate || '',
        endDate: edu.endDate || '',
        message: `${location}：结束日期早于开始日期`,
      });
    }
  });

  resume.experience?.forEach((work, idx) => {
    const location = `工作经历-${work.company || idx + 1}`;
    const start = parseDate(work.startDate);
    const end = parseDate(work.endDate);
    allRanges.push({ start, end, location, item: work });

    if (start && end && end < start) {
      conflicts.push({
        type: 'invalid',
        location,
        startDate: work.startDate || '',
        endDate: work.endDate || '',
        message: `${location}：结束日期早于开始日期`,
      });
    }
  });

  resume.projects?.forEach((project, idx) => {
    const location = `项目经历-${project.name || idx + 1}`;
    const start = parseDate(project.startDate);
    const end = parseDate(project.endDate);
    allRanges.push({ start, end, location, item: project });

    if (start && end && end < start) {
      conflicts.push({
        type: 'invalid',
        location,
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        message: `${location}：结束日期早于开始日期`,
      });
    }
  });

  for (let i = 0; i < allRanges.length; i++) {
    for (let j = i + 1; j < allRanges.length; j++) {
      const a = allRanges[i];
      const b = allRanges[j];
      if (a.start && a.end && b.start && b.end) {
        if (a.start <= b.end && b.start <= a.end) {
          conflicts.push({
            type: 'overlap',
            location: `${a.location} 与 ${b.location}`,
            startDate: `${a.item.startDate || '?'} ~ ${a.item.endDate || '?'}`,
            endDate: `${b.item.startDate || '?'} ~ ${b.item.endDate || '?'}`,
            message: `时间重叠：${a.location}(${a.item.startDate}~${a.item.endDate}) 与 ${b.location}(${b.item.startDate}~${b.item.endDate})`,
          });
        }
      }
    }
  }

  return conflicts;
}

function extractAllText(resume: Resume): string {
  const parts: string[] = [];
  if (resume.summary) parts.push(resume.summary);
  if (resume.skills) parts.push(resume.skills.join(' '));
  if (resume.name) parts.push(resume.name);
  if (resume.location) parts.push(resume.location);
  resume.education?.forEach(edu => {
    if (edu.description) parts.push(edu.description);
    if (edu.field) parts.push(edu.field);
    if (edu.degree) parts.push(edu.degree);
    if (edu.school) parts.push(edu.school);
  });
  resume.experience?.forEach(work => {
    if (work.description) parts.push(work.description);
    if (work.highlights) parts.push(...work.highlights);
    if (work.position) parts.push(work.position);
    if (work.company) parts.push(work.company);
  });
  resume.projects?.forEach(project => {
    if (project.description) parts.push(project.description);
    if (project.highlights) parts.push(...project.highlights);
    if (project.name) parts.push(project.name);
    if (project.role) parts.push(project.role);
    if (project.technologies) parts.push(...project.technologies);
  });
  return parts.join(' ').toLowerCase();
}

function detectMissingKeywords(resume: Resume, templateCategory: TemplateCategory): MissingKeywordIssue {
  const keywords = INDUSTRY_KEYWORDS[templateCategory] || [];
  const text = extractAllText(resume);
  const existing: string[] = [];
  const missing: string[] = [];

  keywords.forEach(kw => {
    if (text.includes(kw.toLowerCase())) {
      existing.push(kw);
    } else {
      missing.push(kw);
    }
  });

  return {
    category: templateCategory,
    missingKeywords: missing,
    existingKeywords: existing,
  };
}

export function diagnoseResume(resume: Resume, templateCategory: TemplateCategory = 'tech'): DiagnosisResult {
  const normalizedResume = normalizeResumeForChecks(resume);
  const emptyPhraseIssues = detectEmptyPhrases(normalizedResume);
  const timelineConflicts = detectTimelineConflicts(normalizedResume);
  const missingKeywordIssues = detectMissingKeywords(normalizedResume, templateCategory);

  let score = 100;

  if (emptyPhraseIssues.length > 0) {
    score -= Math.min(emptyPhraseIssues.length * 5, 30);
  }

  if (timelineConflicts.length > 0) {
    score -= Math.min(timelineConflicts.length * 10, 30);
  }

  const totalKeywords = missingKeywordIssues.existingKeywords.length + missingKeywordIssues.missingKeywords.length;
  const keywordCoverage = totalKeywords > 0 ? missingKeywordIssues.existingKeywords.length / totalKeywords : 0;
  if (!isNaN(keywordCoverage)) {
    score -= Math.round((1 - keywordCoverage) * 25);
  }

  score = Math.max(0, Math.min(100, score));

  const suggestions: string[] = [];

  if (emptyPhraseIssues.length > 0) {
    suggestions.push(`检测到${emptyPhraseIssues.length}处空洞表述，建议使用强动词并补充量化数据，参考STAR法则`);
  }

  if (timelineConflicts.length > 0) {
    suggestions.push(`检测到${timelineConflicts.length}处时间问题，请核对并修正教育/工作/项目经历的时间区间`);
  }

  if (missingKeywordIssues.missingKeywords.length > 0) {
    const topMissing = missingKeywordIssues.missingKeywords.slice(0, 5).join('、');
    suggestions.push(`建议补充核心技能关键词：${topMissing}等，提高简历匹配度`);
  }

  if (score >= 80) {
    suggestions.push('简历整体质量良好，可进一步优化细节提升专业度');
  } else if (score >= 60) {
    suggestions.push('简历有一定基础，建议根据以上建议重点优化表述和内容完整性');
  } else {
    suggestions.push('简历需要大幅优化，建议优先修正时间问题、补充量化成果和核心技能');
  }

  return {
    score,
    emptyPhraseIssues,
    timelineConflicts,
    missingKeywordIssues,
    suggestions,
  };
}
