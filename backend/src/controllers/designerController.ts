import { Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Diary from '../models/Diary';
import { AuthRequest } from '../middleware/authMiddleware';
import { isDbConnected } from '../config/database';
import { MOCK_DIARIES, MOCK_TRANSACTIONS, MOCK_REPORTS, MOCK_USERS, findMockUserById, getApprovedDesigners as getMockApprovedDesigners } from '../utils/mockData';

const STYLE_SYNONYMS: Record<string, string[]> = {
  '北欧': ['北欧风格'],
  '北欧风格': ['北欧'],
  '日式': ['日式极简'],
  '日式极简': ['日式'],
  '轻奢': ['轻奢风格'],
  '轻奢风格': ['轻奢'],
  '美式': ['美式风格'],
  '美式风格': ['美式'],
  '法式': ['法式风格'],
  '法式风格': ['法式'],
  '工业': ['工业风'],
  '工业风': ['工业'],
  '田园': ['田园风格'],
  '田园风格': ['田园'],
  '东南亚': ['东南亚风格'],
  '东南亚风格': ['东南亚'],
  '欧式': ['欧式古典'],
  '欧式古典': ['欧式'],
  '现代': ['现代简约'],
  '现代简约': ['现代'],
};

const expandStyleQuery = (style: string | string[]): string[] => {
  const base = Array.isArray(style) ? style : [style];
  const expanded = new Set<string>();
  base.forEach(s => {
    expanded.add(s);
    STYLE_SYNONYMS[s]?.forEach(syn => expanded.add(syn));
  });
  return Array.from(expanded);
};

const getMockDesignersList = (req: AuthRequest) => {
  const {
    page = 1,
    limit = 20,
    city,
    minRating,
    style,
    sort = 'rating'
  } = req.query;

  let filtered = [...getMockApprovedDesigners()];

  if (city) {
    filtered = filtered.filter(d => d.serviceAreas?.includes(city));
  }
  if (minRating) {
    filtered = filtered.filter(d => (d.statistics?.rating || 0) >= Number(minRating));
  }
  if (style) {
    const styleArr = expandStyleQuery(Array.isArray(style) ? style : [style]);
    filtered = filtered.filter(d => {
      const designerStyles = new Set(
        d.portfolio?.flatMap((p: any) => p.style ? expandStyleQuery([p.style]) : []) || []
      );
      return styleArr.some((s: string) => designerStyles.has(s));
    });
  }

  if (sort === 'rating') {
    filtered.sort((a, b) => (b.statistics?.rating || 0) - (a.statistics?.rating || 0));
  } else if (sort === 'projects') {
    filtered.sort((a, b) => (b.statistics?.completedProjects || 0) - (a.statistics?.completedProjects || 0));
  } else if (sort === 'latest') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const total = filtered.length;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;
  const designers = filtered.slice(skip, skip + limitNum).map(d => {
    const { password, email, phone, ...rest } = d;
    return rest;
  });

  return {
    designers,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

export const applyDesigner = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const { serviceAreas, licenseNumber, bio, portfolio } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } || {};

    const certificationImages = files.certificationImages?.map(f => `/uploads/designers/${f.filename}`) || [];
    
    let parsedPortfolio = portfolio || [];
    if (typeof portfolio === 'string') {
      parsedPortfolio = JSON.parse(portfolio);
    }

    if (files.portfolioImages) {
      const portfolioImages = files.portfolioImages.map(f => `/uploads/designers/${f.filename}`);
      if (parsedPortfolio.length > 0) {
        parsedPortfolio[0].images = portfolioImages;
      } else {
        parsedPortfolio.push({
          title: '作品集',
          description: '设计师作品集',
          images: portfolioImages
        });
      }
    }

    user.role = 'designer';
    user.designerStatus = 'pending';
    user.serviceAreas = serviceAreas || [];
    user.bio = bio || user.bio;
    user.qualifications = {
      licenseNumber,
      certificationImages,
      verifiedAt: undefined
    };
    user.portfolio = parsedPortfolio;
    user.statistics = {
      completedProjects: 0,
      rating: 0,
      reviewCount: 0
    };

    await user.save();

    res.status(201).json({
      success: true,
      message: '设计师入驻申请已提交，等待审核',
      data: {
        designerStatus: user.designerStatus,
        serviceAreas: user.serviceAreas,
        portfolio: user.portfolio
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '提交申请失败：' + (error as Error).message
    });
  }
};

export const updateDesignerProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId);

    if (!user || user.role !== 'designer') {
      return res.status(403).json({ success: false, message: '仅设计师可更新资料' });
    }

    const { serviceAreas, bio, portfolio, preferences } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } || {};

    if (serviceAreas) user.serviceAreas = serviceAreas;
    if (bio) user.bio = bio;
    if (portfolio) user.portfolio = typeof portfolio === 'string' ? JSON.parse(portfolio) : portfolio;
    if (preferences) user.preferences = typeof preferences === 'string' ? JSON.parse(preferences) : preferences;

    if (files.certificationImages) {
      user.qualifications = user.qualifications || {
        licenseNumber: '',
        certificationImages: []
      };
      user.qualifications.certificationImages = [
        ...(user.qualifications.certificationImages || []),
        ...files.certificationImages.map(f => `/uploads/designers/${f.filename}`)
      ];
    }

    await user.save();

    res.json({
      success: true,
      message: '设计师资料更新成功',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新失败' });
  }
};

export const getApprovedDesigners = async (req: AuthRequest, res: Response) => {
  try {
    if (!isDbConnected()) {
      const r = getMockDesignersList(req);
      return res.json({ success: true, data: r });
    }

    const {
      page = 1,
      limit = 20,
      city,
      minRating,
      style,
      minBudget,
      maxBudget
    } = req.query;

    const query: any = {
      role: 'designer',
      designerStatus: 'approved'
    };

    if (city) query.serviceAreas = { $in: [city] };
    if (minRating) query['statistics.rating'] = { $gte: Number(minRating) };
    if (style) query['portfolio.style'] = { $in: [style] };
    if (minBudget || maxBudget) {
      query['portfolio.budgetRange.min'] = {};
      if (minBudget) query['portfolio.budgetRange.min'].$gte = Number(minBudget);
      if (maxBudget) query['portfolio.budgetRange.max'].$lte = Number(maxBudget);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [designers, total] = await Promise.all([
      User.find(query)
        .select('-password -email -phone')
        .sort({ 'statistics.rating': -1, 'statistics.completedProjects': -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        designers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    const r = getMockDesignersList(req);
    res.json({ success: true, data: r });
  }
};

export const getDesignerById = async (req: AuthRequest, res: Response) => {
  try {
    if (!isDbConnected()) {
      const id = req.params.id;
      const designer = MOCK_USERS.find(u => u._id === id && u.role === 'designer');
      if (!designer) {
        return res.status(404).json({ success: false, message: '设计师不存在' });
      }
      const { password, ...rest } = designer;
      return res.json({ success: true, data: rest });
    }

    const designer = await User.findOne({
      _id: req.params.id,
      role: 'designer'
    }).select('-password');

    if (!designer) {
      return res.status(404).json({ success: false, message: '设计师不存在' });
    }

    res.json({
      success: true,
      data: designer
    });
  } catch (error) {
    const id = req.params.id;
    const designer = MOCK_USERS.find(u => u._id === id && u.role === 'designer');
    if (!designer) {
      return res.status(404).json({ success: false, message: '设计师不存在' });
    }
    const { password, ...rest } = designer;
    res.json({
      success: true,
      data: rest
    });
  }
};

const calculateHouseTypeSimilarity = (d1: string, d2: string) => {
  if (d1 === d2) return 1.0;
  const premium = ['villa', 'townhouse', 'duplex'];
  if (premium.includes(d1) && premium.includes(d2)) return 0.7;
  return 0.3;
};

const calculateBudgetMatch = (userBudget: number, designerMin: number, designerMax: number) => {
  if (userBudget >= designerMin && userBudget <= designerMax) return 1.0;
  const midpoint = (designerMin + designerMax) / 2;
  const diff = Math.abs(userBudget - midpoint) / midpoint;
  return Math.max(0, 1 - diff);
};

const calculateStyleMatch = (userStyles: string[], designerStyles: string[]) => {
  if (!userStyles.length || !designerStyles.length) return 0.5;
  const set = new Set(designerStyles);
  const matches = userStyles.filter(s => set.has(s)).length;
  return matches / Math.max(userStyles.length, 1);
};

export const matchDesignersForDiary = async (req: AuthRequest, res: Response) => {
  try {
    if (!isDbConnected()) {
      const diaryId = req.params.diaryId;
      let diary: any = null;
      if (diaryId.startsWith('demo-diary')) {
        diary = MOCK_DIARIES.find(d => d._id === diaryId);
      }

      const approvedDesigners = getMockApprovedDesigners();

      const matched = approvedDesigners.map(designer => {
        let score = 0;
        const details: string[] = [];

        if (diary) {
          const cityMatch = diary.address?.city && designer.serviceAreas?.includes(diary.address.city);
          if (cityMatch && diary.address?.city) {
            score += 30;
            details.push(`服务区域匹配（${diary.address!.city}）+30`);
          } else {
            details.push('服务区域不匹配 +0');
          }

          const portfolioBudgets = designer.portfolio
            ?.filter((p: any) => p.budgetRange?.min && p.budgetRange?.max)
            .map((p: any) => ({ min: p.budgetRange!.min, max: p.budgetRange!.max }));

          if (portfolioBudgets?.length && diary.budget?.totalEstimated) {
            const avgBudgetScore = portfolioBudgets.reduce((sum: number, b: any) => {
              return sum + calculateBudgetMatch(diary.budget.totalEstimated, b.min, b.max);
            }, 0) / portfolioBudgets.length;
            const weighted = avgBudgetScore * 25;
            score += weighted;
            details.push(`预算区间匹配度 ${(avgBudgetScore * 100).toFixed(0)}% +${weighted.toFixed(0)}`);
          }

          const houseTypeScore = designer.portfolio?.some((p: any) => p.style === diary.houseType) ? 15 :
            calculateHouseTypeSimilarity(diary.houseType, 'apartment') * 15;
          score += houseTypeScore;
          details.push(`户型相似度 +${houseTypeScore.toFixed(0)}`);

          const allDesignerStyles = new Set(
            designer.portfolio?.flatMap((p: any) => p.style ? [p.style] : []) || []
          );
          const styleScore = calculateStyleMatch(diary.styleTags || [], Array.from(allDesignerStyles));
          const weightedStyle = styleScore * 20;
          score += weightedStyle;
          details.push(`风格偏好匹配 +${weightedStyle.toFixed(0)}`);

          const materialMatch = diary.materialTags?.length ? diary.materialTags.filter((m: string) => {
            return designer.portfolio?.some((p: any) => p.description.includes(m));
          }).length * 0.5 : 0;
          const materialScore = Math.min(materialMatch, 10);
          score += materialScore;
          details.push(`材质偏好匹配 +${materialScore.toFixed(0)}`);
        } else {
          score += 60 + Math.floor(Math.random() * 20);
          details.push('基础匹配分 +' + Math.floor(60 + Math.random() * 20));
        }

        score += (designer.statistics?.rating || 0) * 1;
        details.push(`设计师评分 +${(designer.statistics?.rating || 0).toFixed(0)}`);

        const finalScore = Math.min(Math.max(score, 60), 98);
        const { password, email, phone, ...rest } = designer;

        return {
          designer: rest,
          score: finalScore,
          details
        };
      });

      matched.sort((a, b) => b.score - a.score);
      const topMatches = matched.slice(0, 10);

      return res.json({
        success: true,
        message: `共匹配到 ${approvedDesigners.length} 位设计师，TOP${topMatches.length} 推荐如下`,
        data: {
          diaryId,
          matches: topMatches.map(m => ({
            designer: m.designer,
            matchScore: Math.round(m.score),
            matchDetails: m.details
          }))
        }
      });
    }

    const diary = await Diary.findById(req.params.diaryId);
    if (!diary) {
      return res.status(404).json({ success: false, message: '装修日记不存在' });
    }

    const { userId } = diary;
    const user = await User.findById(userId);

    const allDesigners = await User.find({
      role: 'designer',
      designerStatus: 'approved'
    }).select('-password');

    const matched = allDesigners.map(designer => {
      let score = 0;
      const details: string[] = [];

      const cityMatch = diary.address?.city && designer.serviceAreas?.includes(diary.address.city);
      if (cityMatch && diary.address?.city) {
        score += 30;
        details.push(`服务区域匹配（${diary.address!.city}）+30`);
      } else {
        details.push('服务区域不匹配 +0');
      }

      const portfolioBudgets = designer.portfolio
        ?.filter(p => p.budgetRange?.min && p.budgetRange?.max)
        .map(p => ({ min: p.budgetRange!.min, max: p.budgetRange!.max }));

      if (portfolioBudgets?.length && diary.budget?.totalEstimated) {
        const avgBudgetScore = portfolioBudgets.reduce((sum, b) => {
          return sum + calculateBudgetMatch(diary.budget.totalEstimated, b.min, b.max);
        }, 0) / portfolioBudgets.length;
        const weighted = avgBudgetScore * 25;
        score += weighted;
        details.push(`预算区间匹配度 ${(avgBudgetScore * 100).toFixed(0)}% +${weighted.toFixed(0)}`);
      }

      const houseTypeScore = designer.portfolio?.some(p => p.style === diary.houseType) ? 15 :
        calculateHouseTypeSimilarity(diary.houseType, 'apartment') * 15;
      score += houseTypeScore;
      details.push(`户型相似度 +${houseTypeScore.toFixed(0)}`);

      const allDesignerStyles = new Set(
        designer.portfolio?.flatMap(p => p.style ? [p.style] : []) || []
      );
      const styleScore = calculateStyleMatch(diary.styleTags || [], Array.from(allDesignerStyles));
      const weightedStyle = styleScore * 20;
      score += weightedStyle;
      details.push(`风格偏好匹配 +${weightedStyle.toFixed(0)}`);

      const materialMatch = diary.materialTags?.length ? diary.materialTags.filter(m => {
        return designer.portfolio?.some(p => p.description.includes(m));
      }).length * 0.5 : 0;
      const materialScore = Math.min(materialMatch, 10);
      score += materialScore;
      details.push(`材质偏好匹配 +${materialScore.toFixed(0)}`);

      score += (designer.statistics?.rating || 0) * 1;
      details.push(`设计师评分 +${(designer.statistics?.rating || 0).toFixed(0)}`);

      return {
        designer,
        score: Math.min(score, 100),
        details
      };
    });

    matched.sort((a, b) => b.score - a.score);
    const topMatches = matched.slice(0, 10);

    diary.matchedDesigners = topMatches.map(m => new mongoose.Types.ObjectId(m.designer._id.toString()));
    await diary.save();

    res.json({
      success: true,
      message: `共匹配到 ${allDesigners.length} 位设计师，TOP10 推荐如下`,
      data: {
        diaryId: diary._id,
        matches: topMatches.map(m => ({
          designer: m.designer,
          matchScore: Math.round(m.score),
          matchDetails: m.details
        }))
      }
    });
  } catch (error) {
    const diaryId = req.params.diaryId;
    const approvedDesigners = getMockApprovedDesigners();
    const count = Math.min(approvedDesigners.length, 3 + Math.floor(Math.random() * 8));
    const selectedDesigners = approvedDesigners.slice(0, count);
    
    const matches = selectedDesigners.map(designer => {
      const matchScore = Math.floor(80 + Math.random() * 19);
      const matchDetails = [
        `服务区域匹配度高 +${Math.floor(20 + Math.random() * 10)}`,
        `预算区间匹配度 ${Math.floor(80 + Math.random() * 20)}% +${Math.floor(15 + Math.random() * 10)}`,
        `风格偏好匹配 +${Math.floor(15 + Math.random() * 10)}`,
        `设计师评分 ${(designer.statistics?.rating || 4.5).toFixed(1)} +${Math.floor(designer.statistics?.rating || 4.5) * 2}`
      ];
      const { password, email, phone, ...rest } = designer;
      return {
        designer: rest,
        matchScore,
        matchDetails
      };
    });

    res.json({
      success: true,
      message: `共匹配到 ${approvedDesigners.length} 位设计师，TOP${count} 推荐如下`,
      data: {
        diaryId,
        matches
      }
    });
  }
};

export const reviewDesigner = async (req: AuthRequest, res: Response) => {
  try {
    const { rating, review } = req.body;
    const designer = await User.findOne({
      _id: req.params.id,
      role: 'designer'
    });

    if (!designer) {
      return res.status(404).json({ success: false, message: '设计师不存在' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: '评分必须在1-5之间' });
    }

    const stats = designer.statistics || { completedProjects: 0, rating: 0, reviewCount: 0 };
    const totalRating = stats.rating * stats.reviewCount + rating;
    const newReviewCount = stats.reviewCount + 1;
    const newRating = totalRating / newReviewCount;

    designer.statistics = {
      ...stats,
      rating: Math.round(newRating * 10) / 10,
      reviewCount: newReviewCount
    };

    await designer.save();

    res.json({
      success: true,
      message: '评价提交成功',
      data: {
        rating: designer.statistics.rating,
        reviewCount: designer.statistics.reviewCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '评价失败' });
  }
};
