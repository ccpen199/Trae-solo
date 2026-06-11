import { Router, Request, Response } from 'express';
import db from '../database';
import { success, error, parseJsonField } from '../utils/common';
import { auth, requireEmployer, requireProvider } from '../middleware/auth';

const router = Router();

const calculateMatchScore = (task: any, provider: any) => {
  let score = 0;

  if (task.categoryId === provider.categoryId) {
    score += 30;
  } else {
    score += 15;
  }

  const taskSkills = parseJsonField(task.skillsRequired, []);
  const providerSkills = parseJsonField(provider.skills, []);

  if (taskSkills.length > 0 && providerSkills.length > 0) {
    const matchedSkills = taskSkills.filter((skill: string) =>
      providerSkills.some((ps: string) => ps.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(ps.toLowerCase()))
    );
    const skillMatchRate = matchedSkills.length / taskSkills.length;
    score += Math.round(30 * skillMatchRate);
  } else {
    score += 15;
  }

  const ratingScore = Math.round((provider.rating / 5.0) * 20);
  score += ratingScore;

  const avgBudget = (task.budgetMin + task.budgetMax) / 2;
  if (avgBudget > 0) {
    const typicalBid = avgBudget * 0.9;
    const budgetDiff = Math.abs(typicalBid - avgBudget);
    const budgetScore = Math.max(0, 20 - (budgetDiff / avgBudget * 20));
    score += Math.round(budgetScore);
  } else {
    score += 10;
  }

  return Math.min(100, score);
};

router.get('/task/:taskId/providers', auth, requireEmployer, async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.taskId);

    const task = db.prepare(`
      SELECT t.*, c.name as categoryName
      FROM tasks t
      LEFT JOIN categories c ON t.categoryId = c.id
      WHERE t.id = ?
    `).get(taskId) as any;

    if (!task) {
      return res.json(error('任务不存在', 404));
    }

    if (task.status !== 'published' && task.status !== 'bidding') {
      return res.json(error('只有发布或招标中的任务才能匹配服务商', 400));
    }

    const providers = db.prepare(`
      SELECT p.*, u.name, u.email, u.avatar, c.name as categoryName
      FROM providers p
      LEFT JOIN users u ON p.userId = u.id
      LEFT JOIN categories c ON p.categoryId = c.id
      WHERE p.verificationStatus = 'verified'
    `).all() as any[];

    const scoredProviders = providers.map(provider => {
      const matchScore = calculateMatchScore(task, provider);
      return {
        ...provider,
        skills: parseJsonField(provider.skills, []),
        matchScore,
        matchDetails: {
          categoryMatch: task.categoryId === provider.categoryId ? 30 : 15,
          skillMatch: Math.round(30 * (parseJsonField(task.skillsRequired, []).filter((s: string) => parseJsonField(provider.skills, []).some((ps: string) => ps.includes(s) || s.includes(ps))).length / Math.max(1, parseJsonField(task.skillsRequired, []).length))),
          ratingMatch: Math.round((provider.rating / 5.0) * 20),
          budgetMatch: 20
        }
      };
    });

    scoredProviders.sort((a, b) => b.matchScore - a.matchScore);

    res.json(success({
      task: {
        id: task.id,
        title: task.title,
        categoryName: task.categoryName,
        budgetMin: task.budgetMin,
        budgetMax: task.budgetMax,
        skillsRequired: parseJsonField(task.skillsRequired, []),
        status: task.status
      },
      providers: scoredProviders.slice(0, 10)
    }, '匹配推荐成功'));
  } catch (err: any) {
    res.json(error(err.message || '匹配推荐失败', 500));
  }
});

router.get('/provider/:providerId/tasks', auth, requireProvider, async (req: Request, res: Response) => {
  try {
    const providerId = Number(req.params.providerId);

    const provider = db.prepare(`
      SELECT p.*, u.name, c.name as categoryName
      FROM providers p
      LEFT JOIN users u ON p.userId = u.id
      LEFT JOIN categories c ON p.categoryId = c.id
      WHERE p.id = ?
    `).get(providerId) as any;

    if (!provider) {
      return res.json(error('服务商不存在', 404));
    }

    const tasks = db.prepare(`
      SELECT t.*, c.name as categoryName,
             u.name as employerName, u.avatar as employerAvatar
      FROM tasks t
      LEFT JOIN categories c ON t.categoryId = c.id
      LEFT JOIN users u ON t.employerId = u.id
      WHERE t.status IN ('published', 'bidding')
    `).all() as any[];

    const scoredTasks = tasks.map(task => {
      const matchScore = calculateMatchScore(task, provider);
      return {
        ...task,
        skillsRequired: parseJsonField(task.skillsRequired, []),
        attachments: parseJsonField(task.attachments, []),
        matchScore,
        matchDetails: {
          categoryMatch: task.categoryId === provider.categoryId ? 30 : 15,
          skillMatch: Math.round(30 * (parseJsonField(task.skillsRequired, []).filter((s: string) => parseJsonField(provider.skills, []).some((ps: string) => ps.includes(s) || s.includes(ps))).length / Math.max(1, parseJsonField(task.skillsRequired, []).length))),
          ratingMatch: Math.round((provider.rating / 5.0) * 20),
          budgetMatch: 20
        }
      };
    });

    scoredTasks.sort((a, b) => b.matchScore - a.matchScore);

    res.json(success({
      provider: {
        id: provider.id,
        name: provider.name,
        categoryName: provider.categoryName,
        skills: parseJsonField(provider.skills, []),
        rating: provider.rating,
        level: provider.level
      },
      tasks: scoredTasks.slice(0, 10)
    }, '匹配推荐成功'));
  } catch (err: any) {
    res.json(error(err.message || '匹配推荐失败', 500));
  }
});

export default router;
