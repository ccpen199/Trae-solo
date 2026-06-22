import { Response } from 'express';
import mongoose from 'mongoose';
import Diary, { IDiary, ConstructionStage } from '../models/Diary';
import { AuthRequest } from '../middleware/authMiddleware';
import { CONSTRUCTION_STAGES } from '../config/constants';

const STAGE_LABELS: Record<ConstructionStage, string> = {
  planning: '方案设计',
  demolition: '拆改阶段',
  plumbing_electrical: '水电阶段',
  masonry_carpentry: '泥木阶段',
  painting: '油漆阶段',
  installation: '安装阶段',
  acceptance: '竣工验收'
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
    res.status(500).json({
      success: false,
      message: '获取日记列表失败：' + (error as Error).message
    });
  }
};

export const getDiaryById = async (req: AuthRequest, res: Response) => {
  try {
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
    res.status(500).json({
      success: false,
      message: '获取日记详情失败'
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
    const diaries = await Diary.find({ userId: req.user?._id })
      .sort({ createdAt: -1 })
      .populate('userId', 'username avatar nickname');

    res.json({
      success: true,
      data: diaries
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败' });
  }
};
