import type {
  Resume,
  AtsCheckResult,
  FontSafetyIssue,
  TableStructureIssue,
  LinkValidityIssue,
  KeywordDensityResult,
} from '../types';

const ATS_SAFE_FONTS = ['Arial', 'Calibri', 'Georgia', 'Times New Roman', 'Helvetica', 'Garamond'];
const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

function checkFontSafety(fontFamily?: string): FontSafetyIssue {
  const font = fontFamily || '';
  const fontLower = font.toLowerCase();
  const isSafe = ATS_SAFE_FONTS.some(f => f.toLowerCase() === fontLower);
  const safeAlternatives = ATS_SAFE_FONTS;

  return {
    font,
    isSafe,
    safeAlternatives,
  };
}

function checkTableStructure(resume: Resume): TableStructureIssue[] {
  const issues: TableStructureIssue[] = [];

  const sections = [
    { name: '个人信息', data: { name: resume.name, email: resume.email, phone: resume.phone, location: resume.location } },
    { name: '教育经历', data: resume.education },
    { name: '工作经历', data: resume.experience },
    { name: '项目经历', data: resume.projects },
    { name: '技能', data: resume.skills },
    { name: '个人简介', data: resume.summary },
  ];

  sections.forEach(section => {
    if (section.data && typeof section.data === 'object') {
      const keys = Object.keys(section.data);
      if (keys.length > 20) {
        issues.push({
          location: section.name,
          issue: '字段过多，可能导致ATS解析困难',
          suggestion: '建议将内容拆分为更简单扁平的结构，减少嵌套层级',
        });
      }

      if (Array.isArray(section.data)) {
        section.data.forEach((item: any, idx: number) => {
          if (item && typeof item === 'object') {
            const itemKeys = Object.keys(item);
            itemKeys.forEach(key => {
              if (item[key] && typeof item[key] === 'object' && !Array.isArray(item[key])) {
                const subKeys = Object.keys(item[key]);
                if (subKeys.length > 5) {
                  issues.push({
                    location: `${section.name}[${idx + 1}].${key}`,
                    issue: '存在深层嵌套对象',
                    suggestion: '建议扁平化数据结构，避免超过两层嵌套',
                  });
                }
              }
              if (Array.isArray(item[key]) && item[key].length > 0) {
                item[key].forEach((sub: any, subIdx: number) => {
                  if (sub && typeof sub === 'object' && !Array.isArray(sub)) {
                    const subObjKeys = Object.keys(sub);
                    if (subObjKeys.length > 3) {
                      issues.push({
                        location: `${section.name}[${idx + 1}].${key}[${subIdx + 1}]`,
                        issue: '数组元素存在复杂对象嵌套',
                        suggestion: '建议将数组元素简化为纯文本或简单结构',
                      });
                    }
                  }
                });
              }
            });
          }
        });
      }
    }
  });

  return issues;
}

function checkLinkValidity(resume: Resume): LinkValidityIssue[] {
  const issues: LinkValidityIssue[] = [];
  const links: string[] = [];

  if (resume.email) {
    const email = resume.email;
    if (email.startsWith('http://') || email.startsWith('https://')) {
      links.push(email);
    }
  }

  resume.experience?.forEach((work: any) => {
    const checkText = (text: string) => {
      const urlMatches = text.match(/https?:\/\/[^\s]+/g);
      if (urlMatches) {
        links.push(...urlMatches);
      }
    };
    if (work.description) checkText(work.description);
    work.highlights?.forEach((hl: string) => checkText(hl));
  });

  resume.projects?.forEach((project: any) => {
    const checkText = (text: string) => {
      const urlMatches = text.match(/https?:\/\/[^\s]+/g);
      if (urlMatches) {
        links.push(...urlMatches);
      }
    };
    if (project.description) checkText(project.description);
    project.highlights?.forEach((hl: string) => checkText(hl));
  });

  if (resume.summary) {
    const urlMatches = resume.summary.match(/https?:\/\/[^\s]+/g);
    if (urlMatches) {
      links.push(...urlMatches);
    }
  }

  const uniqueLinks = [...new Set(links)];

  uniqueLinks.forEach(url => {
    const isValid = URL_REGEX.test(url);
    issues.push({
      url,
      isValid,
      message: isValid ? '链接格式有效' : '链接格式无效，建议使用标准http/https格式',
    });
  });

  return issues;
}

function extractTextForDensity(resume: Resume): string {
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
  return parts.join(' ');
}

function checkKeywordDensity(resume: Resume): KeywordDensityResult[] {
  const results: KeywordDensityResult[] = [];
  const text = extractTextForDensity(resume);
  const totalWords = text.length;

  if (totalWords === 0) return results;

  const allKeywords: string[] = [
    ...(resume.skills || []),
    ...(resume.experience?.flatMap(w => {
      const items: string[] = [];
      if (w.description) {
        const matches = w.description.match(/[\u4e00-\u9fa5A-Za-z0-9+./#]{2,}/g) || [];
        items.push(...matches);
      }
      w.highlights?.forEach(hl => {
        const matches = hl.match(/[\u4e00-\u9fa5A-Za-z0-9+./#]{2,}/g) || [];
        items.push(...matches);
      });
      return items;
    }) || []),
    ...(resume.projects?.flatMap(p => p.technologies || []) || []),
  ];

  const keywordCounts: Record<string, number> = {};
  allKeywords.forEach(kw => {
    const normalized = kw.trim().toLowerCase();
    if (normalized.length >= 2) {
      keywordCounts[normalized] = (keywordCounts[normalized] || 0) + 1;
    }
  });

  Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([keyword]) => {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const occurrences = (text.toLowerCase().match(new RegExp(escapedKeyword, 'g')) || []).length;
      const density = totalWords > 0 ? (occurrences / totalWords) * 100 : 0;
      const isOptimal = density >= 0.5 && density <= 3;

      let suggestion = '';
      if (density < 0.5) {
        suggestion = `关键词出现频率较低（${density.toFixed(2)}%），建议在简历中适当增加相关表述`;
      } else if (density > 3) {
        suggestion = `关键词密度过高（${density.toFixed(2)}%），可能被ATS判定为堆砌，建议减少重复使用`;
      } else {
        suggestion = `关键词密度合理（${density.toFixed(2)}%），处于0.5%-3%的最优区间`;
      }

      results.push({
        keyword,
        count: occurrences,
        density: parseFloat(density.toFixed(2)),
        isOptimal,
        suggestion,
      });
    });

  return results;
}

export function checkAtsCompatibility(resume: Resume, fontFamily?: string): AtsCheckResult {
  const fontSafety = checkFontSafety(fontFamily);
  const tableStructure = checkTableStructure(resume);
  const linkValidity = checkLinkValidity(resume);
  const keywordDensity = checkKeywordDensity(resume);

  let score = 100;

  if (!fontSafety.isSafe) {
    score -= 20;
  }

  if (tableStructure.length > 0) {
    score -= Math.min(tableStructure.length * 5, 25);
  }

  const invalidLinks = linkValidity.filter(l => !l.isValid);
  if (invalidLinks.length > 0) {
    score -= Math.min(invalidLinks.length * 5, 15);
  }

  const suboptimalKeywords = keywordDensity.filter(k => !k.isOptimal);
  if (suboptimalKeywords.length > 0) {
    const penalty = Math.min(suboptimalKeywords.length * 2, 20);
    score -= penalty;
  }

  score = Math.max(0, Math.min(100, score));

  const suggestions: string[] = [];

  if (!fontSafety.isSafe) {
    suggestions.push(`当前字体"${fontSafety.font}"不是ATS安全字体，建议更换为：${fontSafety.safeAlternatives.join('、')}`);
  } else if (fontSafety.font) {
    suggestions.push(`字体"${fontSafety.font}"符合ATS兼容性要求`);
  }

  if (tableStructure.length > 0) {
    suggestions.push(`检测到${tableStructure.length}处结构问题，建议扁平化数据结构，避免深层嵌套`);
  } else {
    suggestions.push('简历结构简单扁平，有利于ATS解析');
  }

  if (invalidLinks.length > 0) {
    suggestions.push(`检测到${invalidLinks.length}个无效链接，请确保所有链接使用标准http/https格式`);
  } else if (linkValidity.length > 0) {
    suggestions.push(`${linkValidity.length}个链接格式均有效`);
  }

  if (suboptimalKeywords.length > 0) {
    suggestions.push(`有${suboptimalKeywords.length}个关键词密度不在0.5%-3%的最优区间，建议调整`);
  } else if (keywordDensity.length > 0) {
    suggestions.push('关键词密度整体合理');
  }

  if (score >= 85) {
    suggestions.push('简历ATS兼容性优秀，解析成功率高');
  } else if (score >= 65) {
    suggestions.push('简历ATS兼容性良好，可针对性优化细节提升解析率');
  } else {
    suggestions.push('简历ATS兼容性需要优化，建议优先修正字体、结构和链接问题');
  }

  return {
    score,
    fontSafety,
    tableStructure,
    linkValidity,
    keywordDensity,
    suggestions,
  };
}
