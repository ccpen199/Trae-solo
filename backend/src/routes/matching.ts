import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { recognizeIntent } from '../utils';

const router = Router();

router.get('/skills', authMiddleware, (_req: AuthRequest, res) => {
  const skills = db.prepare('SELECT * FROM skill_tags ORDER BY category, weight DESC').all();
  const grouped = skills.reduce((acc: any, s: any) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});
  res.json({ skills, grouped });
});

function calculateMatchScore(userSkills: string[], requiredSkills: string[], skillWeights: Map<string, number>): { score: number; matched: string[]; missing: string[]; confidence: number } {
  if (!requiredSkills || requiredSkills.length === 0) return { score: 0.5, matched: [], missing: [], confidence: 0.5 };
  const matched: string[] = [];
  const missing: string[] = [];
  let totalWeight = 0;
  let matchedWeight = 0;
  requiredSkills.forEach(rs => {
    const weight = skillWeights.get(rs) || 1;
    totalWeight += weight;
    if (userSkills.includes(rs)) { matched.push(rs); matchedWeight += weight; }
    else missing.push(rs);
  });
  const score = totalWeight > 0 ? matchedWeight / totalWeight : 0;
  const coverage = matched.length / requiredSkills.length;
  const confidence = Math.min(1, (coverage * 0.6 + score * 0.4) + (userSkills.length > 5 ? 0.1 : 0));
  return { score, matched, missing, confidence };
}

function generateMatchReasons(score: number, matched: string[], missing: string[], experience: number, requiredExp: string): string[] {
  const reasons: string[] = [];
  if (score >= 0.8) reasons.push('技能高度匹配，核心技能全部覆盖');
  else if (score >= 0.5) reasons.push(`技能匹配度良好，已匹配 ${matched.length} 项核心技能`);
  else reasons.push(`技能匹配度一般，建议补充学习：${missing.slice(0, 3).join('、')}`);
  if (matched.length > 0) reasons.push(`已具备技能：${matched.slice(0, 5).join('、')}`);
  if (missing.length > 0) reasons.push(`待提升技能：${missing.slice(0, 3).join('、')}`);
  return reasons;
}

router.get('/jobs/recommend', authMiddleware, (req: AuthRequest, res) => {
  const resume = db.prepare('SELECT * FROM resumes WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1').get(req.user!.id) as any;
  if (!resume) return res.json({ recommendations: [] });
  const userSkills: string[] = resume.skills ? JSON.parse(resume.skills) : [];
  const skillTags = db.prepare('SELECT name, weight FROM skill_tags').all() as { name: string; weight: number }[];
  const skillWeights = new Map(skillTags.map(s => [s.name, s.weight]));
  const jobs = db.prepare('SELECT * FROM jobs WHERE status = ?').all('open') as any[];
  const results = jobs.map(job => {
    const jobSkills: string[] = job.skills ? JSON.parse(job.skills) : [];
    const { score, matched, missing, confidence } = calculateMatchScore(userSkills, jobSkills, skillWeights);
    const reasons = generateMatchReasons(score, matched, missing, resume.experience || 0, job.experience_level || '');
    return { id: job.id, job, score: Math.round(score * 100) / 100, confidence: Math.round(confidence * 100) / 100, matched, missing, reasons };
  }).filter(r => r.score > 0.2).sort((a, b) => b.score - a.score).slice(0, 20);
  results.forEach(r => {
    const exist = db.prepare('SELECT id FROM match_recommendations WHERE source_type = ? AND source_id = ? AND target_type = ? AND target_id = ?').get('resume', resume.id, 'job', r.id);
    if (!exist) {
      db.prepare('INSERT INTO match_recommendations (id, tenant_id, source_type, source_id, target_type, target_id, score, confidence, reasons) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), req.user!.tenantId, 'resume', resume.id, 'job', r.id, r.score, r.confidence, JSON.stringify(r.reasons));
    }
  });
  res.json({ recommendations: results, userSkills });
});

router.get('/resumes/recommend/:jobId', authMiddleware, (req: AuthRequest, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.jobId) as any;
  if (!job) return res.status(404).json({ error: '岗位不存在' });
  const jobSkills: string[] = job.skills ? JSON.parse(job.skills) : [];
  const skillTags = db.prepare('SELECT name, weight FROM skill_tags').all() as { name: string; weight: number }[];
  const skillWeights = new Map(skillTags.map(s => [s.name, s.weight]));
  const resumes = db.prepare('SELECT r.*, u.name as user_name FROM resumes r LEFT JOIN users u ON r.user_id = u.id WHERE r.is_public = 1').all() as any[];
  const results = resumes.map(r => {
    const userSkills: string[] = r.skills ? JSON.parse(r.skills) : [];
    const { score, matched, missing, confidence } = calculateMatchScore(userSkills, jobSkills, skillWeights);
    const reasons = generateMatchReasons(score, matched, missing, r.experience || 0, job.experience_level || '');
    return { id: r.id, resume: { ...r, user_name: r.user_name }, score: Math.round(score * 100) / 100, confidence: Math.round(confidence * 100) / 100, matched, missing, reasons };
  }).filter(r => r.score > 0.2).sort((a, b) => b.score - a.score).slice(0, 20);
  res.json({ recommendations: results });
});

router.post('/analyze-intent', authMiddleware, (req: AuthRequest, res) => {
  const { text } = req.body;
  const intent = recognizeIntent(text || '');
  const intents: Record<string, { label: string; description: string; actions: string[] }> = {
    job_search: { label: '求职意向', description: '用户正在寻找工作机会', actions: ['推荐岗位', '完善简历', '查看招聘会'] },
    hiring: { label: '招聘意向', description: '用户需要发布或管理招聘信息', actions: ['发布岗位', '搜索简历', '查看申请'] },
    learning: { label: '学习意向', description: '用户希望参加培训或学习课程', actions: ['推荐课程', '查看学习进度', '获取证书'] },
    referral: { label: '内推意向', description: '用户希望进行内部推荐', actions: ['查看内推岗位', '生成推荐链接'] },
    salary: { label: '薪资咨询', description: '用户关注薪资待遇信息', actions: ['查看薪资报告', '对比行业水平'] },
    general: { label: '通用咨询', description: '一般咨询或其他需求', actions: ['查看帮助中心', '联系客服'] }
  };
  res.json({ intent, intentInfo: intents[intent] || intents.general });
});

router.get('/skill-graph', authMiddleware, (_req: AuthRequest, res) => {
  const tags = db.prepare('SELECT * FROM skill_tags ORDER BY category, weight DESC').all() as any[];
  const nodes: any[] = tags.map((t, i) => ({ id: t.id, name: t.name, category: t.category, value: t.weight, index: i }));
  const categoryMap = new Map<string, number>();
  nodes.forEach(n => { if (!categoryMap.has(n.category)) categoryMap.set(n.category, categoryMap.size); n.categoryIndex = categoryMap.get(n.category)!; });
  const categories = Array.from(categoryMap.keys()).map(name => ({ name }));
  const links: any[] = [];
  for (let i = 0; i < tags.length; i++) {
    for (let j = i + 1; j < tags.length; j++) {
      if (tags[i].category === tags[j].category && Math.random() > 0.6) {
        links.push({ source: tags[i].id, target: tags[j].id });
      }
    }
  }
  res.json({ nodes, links, categories });
});

export default router;
