import { Router, type Request, type Response } from 'express';
import { mockPolicies, mockPolicyMatches, type ApiResponse, type Policy, type PolicyMatch } from '../../data/mockData.js';
import { authMiddleware, requireAdmin, type AuthRequest } from '../../middleware/auth.js';

const router = Router();

let policiesData = [...mockPolicies];
let policyMatchesData = [...mockPolicyMatches];

router.get('/', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, keyword, page = 1, pageSize = 10 } = req.query;

    let policies = [...policiesData];

    if (category) {
      policies = policies.filter(p => p.category === category);
    }

    if (keyword) {
      const keywordStr = String(keyword).toLowerCase();
      policies = policies.filter(p => 
        p.title.toLowerCase().includes(keywordStr) || 
        p.content.toLowerCase().includes(keywordStr)
      );
    }

    const pageNum = Number(page);
    const size = Number(pageSize);
    const total = policies.length;
    const startIndex = (pageNum - 1) * size;
    const paginatedPolicies = policies.slice(startIndex, startIndex + size);

    res.status(200).json({
      success: true,
      data: {
        list: paginatedPolicies,
        total,
        page: pageNum,
        pageSize: size,
        totalPages: Math.ceil(total / size),
      },
      message: '获取政策列表成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取政策列表失败',
    } as ApiResponse);
  }
});

router.post('/', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const policyData = req.body;

    if (!policyData.title || !policyData.content) {
      res.status(400).json({
        success: false,
        message: '政策标题和内容不能为空',
      } as ApiResponse);
      return;
    }

    const newPolicy: Policy = {
      id: `policy_${Date.now()}`,
      title: policyData.title,
      category: policyData.category || '其他',
      content: policyData.content,
      eligibilityCriteria: policyData.eligibilityCriteria || {},
      effectiveDate: new Date(policyData.effectiveDate || new Date()),
      expiryDate: new Date(policyData.expiryDate || new Date('9999-12-31')),
    };

    policiesData.unshift(newPolicy);

    res.status(201).json({
      success: true,
      data: newPolicy,
      message: '创建政策成功',
    } as ApiResponse<Policy>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建政策失败',
    } as ApiResponse);
  }
});

router.get('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const policy = policiesData.find(p => p.id === id);

    if (!policy) {
      res.status(404).json({
        success: false,
        message: '政策不存在',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: policy,
      message: '获取政策详情成功',
    } as ApiResponse<Policy>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取政策详情失败',
    } as ApiResponse);
  }
});

router.put('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const index = policiesData.findIndex(p => p.id === id);

    if (index === -1) {
      res.status(404).json({
        success: false,
        message: '政策不存在',
      } as ApiResponse);
      return;
    }

    policiesData[index] = {
      ...policiesData[index],
      ...updateData,
    };

    res.status(200).json({
      success: true,
      data: policiesData[index],
      message: '更新政策成功',
    } as ApiResponse<Policy>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新政策失败',
    } as ApiResponse);
  }
});

router.delete('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const index = policiesData.findIndex(p => p.id === id);

    if (index === -1) {
      res.status(404).json({
        success: false,
        message: '政策不存在',
      } as ApiResponse);
      return;
    }

    policiesData.splice(index, 1);

    res.status(200).json({
      success: true,
      message: '删除政策成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除政策失败',
    } as ApiResponse);
  }
});

router.post('/match', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userProfile, userId = '1' } = req.body;

    if (!userProfile) {
      res.status(400).json({
        success: false,
        message: '请提供用户画像数据',
      } as ApiResponse);
      return;
    }

    const matches: PolicyMatch[] = policiesData.map(policy => {
      let score = 50;

      if (policy.category === '就业创业' && userProfile.education) {
        score += 20;
      }
      if (policy.category === '企业扶持' && userProfile.enterprise_type) {
        score += 25;
      }
      if (policy.category === '计划生育' && userProfile.has_only_child) {
        score += 30;
      }
      if (userProfile.age !== undefined) {
        if (policy.eligibilityCriteria.age?.$lte !== undefined && userProfile.age <= policy.eligibilityCriteria.age.$lte) {
          score += 15;
        }
        if (policy.eligibilityCriteria.age?.$gte !== undefined && userProfile.age >= policy.eligibilityCriteria.age.$gte) {
          score += 15;
        }
      }

      score = Math.min(score + Math.random() * 10, 100);

      return {
        id: `pm_${Date.now()}_${policy.id}`,
        userId,
        policyId: policy.id,
        policy,
        matchScore: Math.round(score * 10) / 10,
        matchedCriteria: userProfile,
        matchedAt: new Date(),
      } as PolicyMatch;
    }).sort((a, b) => b.matchScore - a.matchScore);

    const highConfidenceMatches = matches.filter(m => m.matchScore >= 70);

    res.status(200).json({
      success: true,
      data: {
        matches: highConfidenceMatches,
        totalMatched: highConfidenceMatches.length,
        totalPolicies: policiesData.length,
      },
      message: '政策匹配成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '政策匹配失败',
    } as ApiResponse);
  }
});

router.get('/matches/user/:userId', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const matches = policyMatchesData.filter(m => m.userId === userId);

    res.status(200).json({
      success: true,
      data: matches,
      message: '获取用户政策匹配记录成功',
    } as ApiResponse<PolicyMatch[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户政策匹配记录失败',
    } as ApiResponse);
  }
});

router.get('/categories', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = [
      { key: '就业创业', name: '就业创业', count: policiesData.filter(p => p.category === '就业创业').length },
      { key: '企业扶持', name: '企业扶持', count: policiesData.filter(p => p.category === '企业扶持').length },
      { key: '计划生育', name: '计划生育', count: policiesData.filter(p => p.category === '计划生育').length },
      { key: '社会保障', name: '社会保障', count: 5 },
      { key: '住房保障', name: '住房保障', count: 3 },
      { key: '其他', name: '其他', count: 2 },
    ];

    res.status(200).json({
      success: true,
      data: categories,
      message: '获取政策分类成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取政策分类失败',
    } as ApiResponse);
  }
});

router.post('/batch-match', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      res.status(400).json({
        success: false,
        message: '请提供用户ID列表',
      } as ApiResponse);
      return;
    }

    const results = userIds.map(userId => ({
      userId,
      matchedCount: Math.floor(Math.random() * 3) + 1,
      totalPolicies: policiesData.length,
      matches: policyMatchesData.filter(m => m.userId === userId),
    }));

    res.status(200).json({
      success: true,
      data: {
        results,
        totalUsers: userIds.length,
        totalMatches: results.reduce((sum, r) => sum + r.matchedCount, 0),
      },
      message: '批量政策匹配成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '批量政策匹配失败',
    } as ApiResponse);
  }
});

export default router;
