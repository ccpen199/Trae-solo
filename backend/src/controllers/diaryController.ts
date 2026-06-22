import { Response } from 'express';
import mongoose from 'mongoose';
import Diary, { IDiary, ConstructionStage } from '../models/Diary';
import { AuthRequest } from '../middleware/authMiddleware';
import { CONSTRUCTION_STAGES } from '../config/constants';
import { isDbConnected } from '../config/database';
import { MOCK_DIARIES, MOCK_TRANSACTIONS, MOCK_REPORTS, MOCK_USERS, findMockUserById, getApprovedDesigners } from '../utils/mockData';

const STAGE_LABELS: Record<ConstructionStage, string> = {
  planning: '方案设计',
  demolition: '拆改阶段',
  plumbing_electrical: '水电阶段',
  masonry_carpentry: '泥木阶段',
  painting: '油漆阶段',
  installation: '安装阶段',
  acceptance: '竣工验收'
};

const getMockDiariesList = (req: AuthRequest) => {
  const {
    page = 1,
    limit = 20,
    stage,
    style,
    material,
    city,
    minArea,
    maxArea,
    minBudget,
    maxBudget,
    sort = 'latest',
    userId
  } = req.query;

  let filtered = [...MOCK_DIARIES];

  if (stage) {
    filtered = filtered.filter(d => d.constructionStage === stage);
  }
  if (style) {
    const styleArr = Array.isArray(style) ? style : [style];
    filtered = filtered.filter(d => styleArr.some(s => d.styleTags?.includes(s)));
  }
  if (material) {
    const materialArr = Array.isArray(material) ? material : [material];
    filtered = filtered.filter(d => materialArr.some(m => d.materialTags?.includes(m)));
  }
  if (city) {
    filtered = filtered.filter(d => d.address?.city === city);
  }
  if (minArea) {
    filtered = filtered.filter(d => d.houseArea >= Number(minArea));
  }
  if (maxArea) {
    filtered = filtered.filter(d => d.houseArea <= Number(maxArea));
  }
  if (minBudget) {
    filtered = filtered.filter(d => d.budget?.totalEstimated >= Number(minBudget));
  }
  if (maxBudget) {
    filtered = filtered.filter(d => d.budget?.totalEstimated <= Number(maxBudget));
  }
  if (userId) {
    filtered = filtered.filter(d => {
      const diaryUserId = d.userId;
      if (typeof diaryUserId === 'string') {
        return diaryUserId === userId;
      }
      return diaryUserId?._id === userId;
    });
  }

  if (sort === 'latest') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sort === 'popular') {
    filtered.sort((a, b) => {
      if (b.views !== a.views) return (b.views || 0) - (a.views || 0);
      return (b.likesCount || 0) - (a.likesCount || 0);
    });
  } else if (sort === 'budget_low') {
    filtered.sort((a, b) => (a.budget?.totalEstimated || 0) - (b.budget?.totalEstimated || 0));
  } else if (sort === 'budget_high') {
    filtered.sort((a, b) => (b.budget?.totalEstimated || 0) - (a.budget?.totalEstimated || 0));
  }

  const total = filtered.length;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;
  const diaries = filtered.slice(skip, skip + limitNum);

  return {
    diaries,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

export const createDiary = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      houseType,
      houseArea,
      constructionStage,
      address,
      budget,
      styleTags,
      materialTags
    } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } || {};
    
    const images = files.images?.map(f => `/uploads/diaries/${f.filename}`) || [];
    const coverImage = images[0] || '';
    
    let floorPlan = {} as any;
    if (files.floorPlanImage?.[0]) {
      floorPlan.image = `/uploads/floorplans/${files.floorPlanImage[0].filename}`;
    }
    if (files.sketchupFile?.[0]) {
      floorPlan.sketchupFile = `/uploads/floorplans/${files.sketchupFile[0].filename}`;
    }
    if (req.body.floorPlanMetadata) {
      floorPlan.metadata = JSON.parse(req.body.floorPlanMetadata);
    }

    const stageHistory = [{
      stage: constructionStage,
      startedAt: new Date(),
      description: `进入${STAGE_LABELS[constructionStage as ConstructionStage]}`
    }];

    let parsedBudget = budget;
    if (typeof budget === 'string') {
      parsedBudget = JSON.parse(budget);
    }

    const diary = await Diary.create({
      userId: new mongoose.Types.ObjectId(req.user?._id),
      title,
      description,
      coverImage,
      images,
      floorPlan,
      houseType,
      houseArea,
      address: typeof address === 'string' ? JSON.parse(address) : address,
      constructionStage,
      stageHistory,
      budget: parsedBudget,
      styleTags: typeof styleTags === 'string' ? JSON.parse(styleTags) : (styleTags || []),
      materialTags: typeof materialTags === 'string' ? JSON.parse(materialTags) : (materialTags || [])
    });

    await diary.populate('userId', 'username avatar nickname');

    res.status(201).json({
      success: true,
      message: '装修日记创建成功',
      data: diary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建日记失败：' + (error as Error).message
    });
  }
};

export const getDiaries = async (req: AuthRequest, res: Response) => {
  try {
    if (!isDbConnected()) {
      const result = getMockDiariesList(req);
      return res.json({ success: true, data: result });
    }

    const {
      page = 1,
      limit = 20,
      stage,
      style,
      material,
      city,
      minArea,
      maxArea,
      minBudget,
      maxBudget,
      sort = 'latest',
      userId
    } = req.query;

    const query: any = { isPublished: true };

    if (stage) query.constructionStage = stage;
    if (style) query.styleTags = { $in: Array.isArray(style) ? style : [style] };
    if (material) query.materialTags = { $in: Array.isArray(material) ? material : [material] };
    if (city) query['address.city'] = city;
    if (minArea || maxArea) {
      query.houseArea = {};
      if (minArea) query.houseArea.$gte = Number(minArea);
      if (maxArea) query.houseArea.$lte = Number(maxArea);
    }
    if (minBudget || maxBudget) {
      query['budget.totalEstimated'] = {};
      if (minBudget) query['budget.totalEstimated'].$gte = Number(minBudget);
      if (maxBudget) query['budget.totalEstimated'].$lte = Number(maxBudget);
    }
    if (userId) query.userId = new mongoose.Types.ObjectId(userId as string);

    let sortOption: any = { createdAt: -1 };
    if (sort === 'popular') {
      sortOption = { views: -1, likes: -1 };
    } else if (sort === 'budget_low') {
      sortOption = { 'budget.totalEstimated': 1 };
    } else if (sort === 'budget_high') {
      sortOption = { 'budget.totalEstimated': -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [diaries, total] = await Promise.all([
      Diary.find(query)
        .populate('userId', 'username avatar nickname')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Diary.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        diaries,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    const result = getMockDiariesList(req);
    res.json({ success: true, data: result });
  }
};

export const getDiaryById = async (req: AuthRequest, res: Response) => {
  try {
    if (!isDbConnected()) {
      const id = req.params.id;
      const diary = MOCK_DIARIES.find(d => d._id === id);
      if (!diary) return res.status(404).json({ success: false, message: '日记不存在' });
      return res.json({ success: true, data: diary });
    }

    const diary = await Diary.findById(req.params.id)
      .populate('userId', 'username avatar nickname bio statistics')
      .populate('matchedDesigners', 'username avatar nickname serviceAreas statistics portfolio');

    if (!diary) {
      return res.status(404).json({
        success: false,
        message: '日记不存在'
      });
    }

    diary.views += 1;
    await diary.save();

    res.json({
      success: true,
      data: diary
    });
  } catch (error) {
    const id = req.params.id;
    if (id.startsWith('demo-diary')) {
      const diary = MOCK_DIARIES.find(d => d._id === id);
      if (!diary) {
        return res.status(404).json({
          success: false,
          message: '日记不存在'
        });
      }
      return res.json({
        success: true,
        data: diary
      });
    }
    res.status(404).json({
      success: false,
      message: '日记不存在'
    });
  }
};

export const updateDiary = async (req: AuthRequest, res: Response) => {
  try {
    const diary = await Diary.findById(req.params.id);

    if (!diary) {
      return res.status(404).json({ success: false, message: '日记不存在' });
    }

    if (diary.userId.toString() !== req.user?._id) {
      return res.status(403).json({ success: false, message: '无权修改此日记' });
    }

    const allowedUpdates = [
      'title', 'description', 'constructionStage', 'address',
      'budget', 'styleTags', 'materialTags'
    ];

    const updates: any = {};
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = typeof req.body[field] === 'string' && (field === 'budget' || field === 'styleTags' || field === 'materialTags' || field === 'address')
          ? JSON.parse(req.body[field])
          : req.body[field];
      }
    }

    if (updates.constructionStage && updates.constructionStage !== diary.constructionStage) {
      const oldStage = diary.stageHistory[diary.stageHistory.length - 1];
      if (oldStage) oldStage.completedAt = new Date();
      
      diary.stageHistory.push({
        stage: updates.constructionStage,
        startedAt: new Date(),
        description: `进入${STAGE_LABELS[updates.constructionStage as ConstructionStage]}`
      });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } || {};
    if (files.images) {
      const newImages = files.images.map(f => `/uploads/diaries/${f.filename}`);
      updates.images = [...(diary.images || []), ...newImages];
      if (!diary.coverImage) updates.coverImage = newImages[0];
    }

    const updated = await Diary.findByIdAndUpdate(
      req.params.id,
      { ...updates, stageHistory: diary.stageHistory },
      { new: true, runValidators: true }
    ).populate('userId', 'username avatar nickname');

    res.json({
      success: true,
      message: '日记更新成功',
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新日记失败：' + (error as Error).message
    });
  }
};

export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    const diary = await Diary.findById(req.params.id);
    if (!diary) {
      return res.status(404).json({ success: false, message: '日记不存在' });
    }

    const userId = new mongoose.Types.ObjectId(req.user?._id);
    const likeIndex = diary.likes.findIndex(l => l.toString() === userId.toString());

    let liked = false;
    if (likeIndex === -1) {
      diary.likes.push(userId);
      liked = true;
    } else {
      diary.likes.splice(likeIndex, 1);
    }

    await diary.save();

    res.json({
      success: true,
      data: {
        liked,
        likeCount: diary.likes.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '操作失败' });
  }
};

export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: '评论内容不能为空' });
    }

    const diary = await Diary.findById(req.params.id);
    if (!diary) {
      return res.status(404).json({ success: false, message: '日记不存在' });
    }

    diary.comments.push({
      userId: new mongoose.Types.ObjectId(req.user?._id),
      content,
      createdAt: new Date(),
      likes: 0
    });
    diary.commentCount = diary.comments.length;

    await diary.save();
    await diary.populate('comments.userId', 'username avatar nickname');

    res.json({
      success: true,
      message: '评论成功',
      data: diary.comments[diary.comments.length - 1]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '评论失败' });
  }
};

export const addBudgetItem = async (req: AuthRequest, res: Response) => {
  try {
    const diary = await Diary.findById(req.params.id);
    if (!diary) {
      return res.status(404).json({ success: false, message: '日记不存在' });
    }
    if (diary.userId.toString() !== req.user?._id) {
      return res.status(403).json({ success: false, message: '无权操作' });
    }

    const item = req.body;
    diary.budget.items.push(item);
    diary.budget.totalActual = diary.budget.items
      .filter(i => i.actualAmount)
      .reduce((sum, i) => sum + (i.actualAmount || 0), 0);

    await diary.save();

    res.json({
      success: true,
      message: '预算条目已添加',
      data: diary.budget
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '操作失败' });
  }
};

export const getMyDiaries = async (req: AuthRequest, res: Response) => {
  try {
    if (!isDbConnected()) {
      const userId = req.user?._id;
      const userDiaries = MOCK_DIARIES.filter(d => {
        const diaryUserId = d.userId;
        if (typeof diaryUserId === 'string') {
          return diaryUserId === userId;
        }
        return diaryUserId?._id === userId;
      });
      return res.json({
        success: true,
        data: userDiaries.length > 0 ? userDiaries : MOCK_DIARIES
      });
    }

    const diaries = await Diary.find({ userId: req.user?._id })
      .sort({ createdAt: -1 })
      .populate('userId', 'username avatar nickname');

    res.json({
      success: true,
      data: diaries
    });
  } catch (error) {
    const userId = req.user?._id;
    const userDiaries = MOCK_DIARIES.filter(d => {
      const diaryUserId = typeof d.userId;
      if (typeof diaryUserId === 'string') {
        return diaryUserId === userId;
      }
      return diaryUserId?._id === userId;
    });
    res.json({
      success: true,
      data: userDiaries.length > 0 ? userDiaries : MOCK_DIARIES
    });
  }
};
