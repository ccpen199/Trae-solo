import { Router, type Request, type Response } from 'express';
import type { AuthResponse, UserProfile } from '@shared/types';

const router = Router();

const generateToken = (userId: string): string => {
  return `token_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const createMockUserProfile = (
  id: string,
  name: string,
  email: string,
  role: 'jobseeker' | 'hr',
  extra?: Partial<UserProfile>
): UserProfile => {
  const base: UserProfile = {
    id,
    role,
    name,
    email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    growthTimeline: [
      {
        date: new Date().toISOString(),
        type: 'diagnosis',
        title: '注册成功',
        description: '欢迎加入 CareerGraph',
      },
    ],
    achievements: [],
    ...extra,
  };

  if (role === 'jobseeker') {
    base.jobseekerProfile = {
      yearsOfExperience: 2,
      skills: [
        { id: 's1', name: 'JavaScript', level: 3 },
        { id: 's2', name: 'React', level: 3 },
        { id: 's3', name: 'Node.js', level: 2 },
      ],
      certifications: [],
      ...extra?.jobseekerProfile,
    };
  }

  if (role === 'hr') {
    base.hrProfile = {
      companyId: 'comp_001',
      companyName: '示例科技有限公司',
      position: '高级招聘经理',
      verified: true,
      ...extra?.hrProfile,
    };
  }

  return base;
};

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, companyName, position } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ message: '请填写所有必填项' });
      return;
    }

    if (role !== 'jobseeker' && role !== 'hr') {
      res.status(400).json({ message: '无效的角色类型' });
      return;
    }

    const userId = `user_${Date.now()}`;
    const token = generateToken(userId);

    const extra: Partial<UserProfile> = {};
    if (role === 'hr' && companyName) {
      extra.hrProfile = {
        companyId: `comp_${Date.now()}`,
        companyName,
        position: position || '招聘专员',
        verified: false,
      };
    }

    const user = createMockUserProfile(userId, name, email, role, extra);

    const response: AuthResponse = {
      token,
      user,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: '注册失败，请稍后重试' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: '请输入邮箱和密码' });
      return;
    }

    const userRole = role === 'hr' ? 'hr' : 'jobseeker';

    let mockUser: UserProfile;
    if (userRole === 'jobseeker') {
      mockUser = createMockUserProfile(
        'user_demo_jobseeker',
        '李明',
        email,
        'jobseeker',
        {
          jobseekerProfile: {
            currentJob: '前端工程师',
            currentLevel: 'junior',
            yearsOfExperience: 2,
            skills: [
              { id: 'hs1', name: 'JavaScript', level: 3 },
              { id: 'hs2', name: 'React', level: 3 },
              { id: 'hs3', name: 'TypeScript', level: 2 },
              { id: 'hs4', name: 'Node.js', level: 2 },
            ],
            certifications: [],
            targetJobId: 'job_frontend_senior',
          },
        }
      );
    } else {
      mockUser = createMockUserProfile(
        'user_demo_hr',
        '张HR',
        email,
        'hr',
        {
          hrProfile: {
            companyId: 'comp_demo',
            companyName: '星辰科技有限公司',
            position: '高级招聘经理',
            verified: true,
          },
        }
      );
    }

    const token = generateToken(mockUser.id);

    const response: AuthResponse = {
      token,
      user: mockUser,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '登录失败，请稍后重试' });
  }
});

router.post('/logout', async (_req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ message: '退出成功' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: '退出失败' });
  }
});

export default router;
