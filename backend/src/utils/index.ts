import { v4 as uuidv4 } from 'uuid';

const SENSITIVE_WORDS = ['赌博', '色情', '暴力', '毒品', '诈骗', '洗钱', '传销'];

export function filterSensitiveWords(text: string): { text: string; blocked: boolean; matchedWords: string[] } {
  const matched: string[] = [];
  let filtered = text;
  SENSITIVE_WORDS.forEach(word => {
    if (filtered.includes(word)) {
      matched.push(word);
      filtered = filtered.split(word).join('*'.repeat(word.length));
    }
  });
  return { text: filtered, blocked: matched.length > 0, matchedWords: matched };
}

export function checkMessageQuality(content: string): { score: number; issues: string[] } {
  let score = 1.0;
  const issues: string[] = [];
  if (!content || content.trim().length < 2) {
    score -= 0.5;
    issues.push('内容过短');
  }
  if (content.length > 2000) {
    score -= 0.2;
    issues.push('内容过长');
  }
  const exclaimCount = (content.match(/[!！?？]/g) || []).length;
  if (exclaimCount > 10) {
    score -= 0.2;
    issues.push('标点符号异常');
  }
  const repeatMatch = content.match(/(.{2,})\1{3,}/);
  if (repeatMatch) {
    score -= 0.3;
    issues.push('存在重复内容');
  }
  const { blocked } = filterSensitiveWords(content);
  if (blocked) {
    score -= 0.5;
    issues.push('包含敏感词');
  }
  return { score: Math.max(0, score), issues };
}

export function generateShareCode(): string {
  return uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
}

export function generateCertificateNo(): string {
  const date = new Date();
  const prefix = 'CERT' + date.getFullYear() + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
  return prefix + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function recognizeIntent(text: string): string {
  const lower = text.toLowerCase();
  if (/找工作|求职|应聘|面试/.test(lower)) return 'job_search';
  if (/招聘|招人|发布岗位/.test(lower)) return 'hiring';
  if (/学习|课程|培训|考试/.test(lower)) return 'learning';
  if (/内推|推荐|内荐/.test(lower)) return 'referral';
  if (/薪资|工资|待遇/.test(lower)) return 'salary';
  return 'general';
}
