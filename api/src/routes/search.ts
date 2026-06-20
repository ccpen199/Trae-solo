import { Router, Request, Response } from 'express';
import { z } from 'zod';
import type { SearchCriteria, MatchResult, CastingRequirement } from '../../../shared/types';
import { mockArtists, mockSchedules } from '../data/mockData';
import { calculateMatchScore, filterArtists } from '../utils/matching';

const router = Router();

const matchSchema = z.object({
  gender: z.string().optional(),
  ageMin: z.number().optional(),
  ageMax: z.number().optional(),
  heightMin: z.number().optional(),
  heightMax: z.number().optional(),
  weightMin: z.number().optional(),
  weightMax: z.number().optional(),
  location: z.string().optional(),
  radius: z.number().optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  contractStatus: z.string().optional(),
  availableFrom: z.string().optional().transform(v => v ? new Date(v) : undefined),
  availableTo: z.string().optional().transform(v => v ? new Date(v) : undefined),
  tags: z.array(z.string()).optional(),
  requirements: z.array(z.object({
    field: z.string(),
    operator: z.enum(['eq', 'gte', 'lte', 'in', 'between']),
    value: z.any(),
  })).default([]),
  minScore: z.number().min(0).max(100).default(0),
  sortBy: z.enum(['score', 'age', 'height']).default('score'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

router.post('/match', (req: Request, res: Response): void => {
  try {
    const validated = matchSchema.parse(req.body);

    const criteria: SearchCriteria = {
      gender: validated.gender,
      ageMin: validated.ageMin,
      ageMax: validated.ageMax,
      heightMin: validated.heightMin,
      heightMax: validated.heightMax,
      weightMin: validated.weightMin,
      weightMax: validated.weightMax,
      location: validated.location,
      radius: validated.radius,
      skills: validated.skills,
      languages: validated.languages,
      contractStatus: validated.contractStatus,
      availableFrom: validated.availableFrom,
      availableTo: validated.availableTo,
      tags: validated.tags,
    };

    let filteredArtists = filterArtists(mockArtists, criteria);

    const matchResults: MatchResult[] = filteredArtists.map(artist => {
      const artistSchedules = mockSchedules.filter(s => s.artistProfileId === artist.id);
      return calculateMatchScore(artist, validated.requirements as CastingRequirement[], criteria, artistSchedules);
    });

    let results = matchResults.filter(r => r.score >= validated.minScore);

    results.sort((a, b) => {
      let diff = 0;
      switch (validated.sortBy) {
        case 'age':
          diff = a.artist.age - b.artist.age;
          break;
        case 'height':
          diff = a.artist.height - b.artist.height;
          break;
        case 'score':
        default:
          diff = a.score - b.score;
      }
      return validated.sortOrder === 'asc' ? diff : -diff;
    });

    const avgScore = results.length > 0
      ? results.reduce((sum, r) => sum + r.score, 0) / results.length
      : 0;

    const highMatchCount = results.filter(r => r.score >= 80).length;
    const mediumMatchCount = results.filter(r => r.score >= 60 && r.score < 80).length;
    const lowMatchCount = results.filter(r => r.score < 60).length;

    res.status(200).json({
      success: true,
      data: results,
      summary: {
        total: results.length,
        averageScore: Math.round(avgScore * 10) / 10,
        highMatchCount,
        mediumMatchCount,
        lowMatchCount,
      },
      criteria: validated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: '搜索条件验证失败',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
      return;
    }
    res.status(500).json({ error: '匹配搜索失败', code: 'SERVER_ERROR' });
  }
});

router.get('/suggestions', (req: Request, res: Response): void => {
  try {
    const { q } = req.query;
    const query = typeof q === 'string' ? q.toLowerCase() : '';

    if (!query) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const allSkills = new Set<string>();
    const allLanguages = new Set<string>();
    const allLocations = new Set<string>();
    const allTags = new Set<string>();

    mockArtists.forEach(artist => {
      artist.skills.forEach(s => allSkills.add(s));
      artist.languages.forEach(l => allLanguages.add(l));
      allLocations.add(artist.location);
      artist.tags.forEach(t => allTags.add(t.tag));
    });

    const suggestions = {
      skills: Array.from(allSkills).filter(s => s.toLowerCase().includes(query)).slice(0, 5),
      languages: Array.from(allLanguages).filter(l => l.toLowerCase().includes(query)).slice(0, 5),
      locations: Array.from(allLocations).filter(l => l.toLowerCase().includes(query)).slice(0, 5),
      tags: Array.from(allTags).filter(t => t.toLowerCase().includes(query)).slice(0, 5),
    };

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    res.status(500).json({ error: '获取建议失败', code: 'SERVER_ERROR' });
  }
});

export default router;
