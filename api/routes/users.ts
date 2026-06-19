import { Router, type Request, type Response } from 'express';
import { currentUserProfile } from '../data/mockData.js';
import type { UserProfile } from '../../shared/types/index.js';

const router = Router();

let userProfile: UserProfile = { ...currentUserProfile };

router.get('/profile', (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: userProfile });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.put('/profile', (req: Request, res: Response) => {
  try {
    const updates = req.body as Partial<UserProfile>;
    userProfile = { ...userProfile, ...updates };
    if (updates.jobseekerProfile) {
      userProfile.jobseekerProfile = { ...userProfile.jobseekerProfile, ...updates.jobseekerProfile };
    }
    res.json({ success: true, data: userProfile });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/growth-timeline', (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    let timeline = userProfile.growthTimeline;
    if (type) {
      timeline = timeline.filter(n => n.type === type);
    }
    const sorted = [...timeline].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ success: true, data: sorted, achievements: userProfile.achievements });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
