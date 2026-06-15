import { Router, type Request, type Response } from 'express';
import { ApiResponse, JobSeeker, Resume, MatchResult } from '../../shared/types/index.js';
import {
  MOCK_SEEKERS,
  MOCK_RESUMES,
  MOCK_JOBS,
  getJobSeekerById,
  getResumeById,
} from '../mock/mockData.js';
import { batchCalculateMatches, calculateMatch } from '../services/matchingService.js';
import { parseResumeText, buildResumeFromParsed } from '../services/resumeParserService.js';
type ParsedResumeResult = any;

const router = Router();

const DEFAULT_SEEKER_ID = 'js_00001';

function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

function fail(error: string, statusCode: number = 400): ApiResponse {
  return { success: false, error };
}

router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  const seekerId = (req.query.seekerId as string) || DEFAULT_SEEKER_ID;
  const seeker = getJobSeekerById(seekerId) || MOCK_SEEKERS[0];

  if (!seeker) {
    res.status(404).json(fail('求职者不存在', 404));
    return;
  }

  res.json(ok<JobSeeker>(seeker));
});

router.get('/resume', async (req: Request, res: Response): Promise<void> => {
  const seekerId = (req.query.seekerId as string) || DEFAULT_SEEKER_ID;
  const seeker = getJobSeekerById(seekerId) || MOCK_SEEKERS[0];

  if (!seeker) {
    res.status(404).json(fail('求职者不存在', 404));
    return;
  }

  const resume = getResumeById(seeker.resumeId) || MOCK_RESUMES[0];
  res.json(ok<Resume>(resume));
});

router.put('/resume', async (req: Request, res: Response): Promise<void> => {
  const seekerId = (req.query.seekerId as string) || DEFAULT_SEEKER_ID;
  const resumeData = req.body as Partial<Resume>;
  const seeker = getJobSeekerById(seekerId) || MOCK_SEEKERS[0];

  if (!seeker) {
    res.status(404).json(fail('求职者不存在', 404));
    return;
  }

  const existingResume = getResumeById(seeker.resumeId) || MOCK_RESUMES[0];
  const updatedResume: Resume = {
    ...existingResume,
    ...resumeData,
    basicInfo: { ...existingResume.basicInfo, ...(resumeData.basicInfo || {}) },
    lastUpdated: new Date().toISOString(),
  };

  res.json(ok<Resume>(updatedResume, '简历更新成功'));
});

router.post('/resume/parse', async (req: Request, res: Response): Promise<void> => {
  const { text, fileType } = req.body as { text?: string; fileType?: string };
  const seekerId = (req.query.seekerId as string) || DEFAULT_SEEKER_ID;

  if (!text || text.trim().length < 20) {
    res.status(400).json(fail('请提供有效的简历文本内容', 400));
    return;
  }

  const parsed: ParsedResumeResult = parseResumeText(text);
  const seeker = getJobSeekerById(seekerId);
  const existingResume = seeker ? getResumeById(seeker.resumeId) : undefined;
  const builtResume = buildResumeFromParsed(parsed, existingResume);

  res.json(ok<{ parsed: ParsedResumeResult; preview: Resume }>({
    parsed,
    preview: builtResume,
  }, `简历解析完成，置信度${parsed.confidence}%`));
});

router.get('/matches', async (req: Request, res: Response): Promise<void> => {
  const seekerId = (req.query.seekerId as string) || DEFAULT_SEEKER_ID;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 15;
  const minScore = parseInt(req.query.minScore as string) || 0;

  const seeker = getJobSeekerById(seekerId) || MOCK_SEEKERS[0];
  if (!seeker) {
    res.status(404).json(fail('求职者不存在', 404));
    return;
  }

  const resume = getResumeById(seeker.resumeId) || MOCK_RESUMES[0];
  const activeJobs = MOCK_JOBS.filter(j => j.status === '招聘中');

  let matches: MatchResult[] = batchCalculateMatches(resume, activeJobs, 100);

  if (minScore > 0) {
    matches = matches.filter(m => m.totalScore >= minScore);
  }

  if (req.query.township) {
    const townshipCode = req.query.township as string;
    matches = matches.filter(m => {
      const job = MOCK_JOBS.find(j => j.id === m.positionId);
      return job?.township === townshipCode;
    });
  }

  const total = matches.length;
  const startIdx = (page - 1) * pageSize;
  const paginatedMatches = matches.slice(startIdx, startIdx + pageSize);
  const totalPages = Math.ceil(total / pageSize);

  res.json({
    success: true,
    data: paginatedMatches,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  });
});

export default router;
