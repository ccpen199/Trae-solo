import { Response } from 'express';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction';
import Diary from '../models/Diary';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { CONSTRUCTION_STAGES } from '../config/constants';

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const {
      diaryId,
      designerId,
      totalAmount,
      depositPercentage = 20,
      projectName,
      paymentMethod = 'alipay'
    } = req.body;

    const diary = await Diary.findById(diaryId);
    if (!diary) {
      return res.status(404).json({ success: false, message: '装修日记不存在' });
    }
    if (diary.userId.toString() !== req.user?._id) {
      return res.status(403).json({ success: false, message: '仅日记作者可发起交易' });
    }

    const designer = await User.findById(designerId);
    if (!designer || designer.role !== 'designer' || designer.designerStatus !== 'approved') {
      return res.status(400).json({ success: false, message: '无效的设计师' });
    }

    const depositAmount = Math.round(totalAmount * (depositPercentage / 100));
    const remainingAmount = totalAmount - depositAmount;

    const stages = CONSTRUCTION_STAGES.map((stage, index) => {
      const stageAmount = Math.round(remainingAmount * (stage.percentage / 100));
      return {
        stageName: stage.label,
        stageIndex: index,
        percentage: stage.percentage,
        amount: stageAmount,
        status: 'pending' as const
      };
    });

    const transaction = await Transaction.create({
      diaryId: new mongoose.Types.ObjectId(diaryId),
      homeownerId: new mongoose.Types.ObjectId(req.user?._id),
      designerId: new mongoose.Types.ObjectId(designerId),
      projectName: projectName || diary.title,
      totalAmount,
      depositAmount,
      depositStatus: 'pending',
      stages,
      paymentMethod,
      status: 'pending',
      escrowAccount: process.env.ESCROW_ACCOUNT || 'escrow@deco-platform.com'
    });

    res.status(201).json({
      success: true,
      message: '交易创建成功，请支付定金',
      data: transaction
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建交易失败：' + (error as Error).message });
  }
};

export const payDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: '交易不存在' });
    }
    if (transaction.homeownerId.toString() !== req.user?._id) {
      return res.status(403).json({ success: false, message: '仅业主可支付定金' });
    }
    if (transaction.depositStatus !== 'pending') {
      return res.status(400).json({ success: false, message: '定金状态不允许支付' });
    }

    transaction.depositStatus = 'held';
    transaction.depositPaidAt = new Date();
    transaction.status = 'deposit_paid';
    if (!transaction.messages) transaction.messages = [];
    transaction.messages.push({
      userId: new mongoose.Types.ObjectId(req.user?._id),
      content: `业主已支付定金 ¥${transaction.depositAmount.toLocaleString()}，款项已由平台托管`,
      timestamp: new Date()
    });

    await transaction.save();

    res.json({
      success: true,
      message: `定金 ¥${transaction.depositAmount.toLocaleString()} 已支付并托管至平台`,
      data: {
        transactionId: transaction._id,
        depositStatus: transaction.depositStatus,
        status: transaction.status,
        depositPaidAt: transaction.depositPaidAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '支付失败' });
  }
};

export const requestStagePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { stageIndex, description } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: '交易不存在' });
    }
    if (transaction.designerId.toString() !== req.user?._id) {
      return res.status(403).json({ success: false, message: '仅设计师可申请阶段付款' });
    }
    if (transaction.status !== 'deposit_paid' && transaction.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: '当前交易状态不允许申请' });
    }

    const stage = transaction.stages.find(s => s.stageIndex === stageIndex);
    if (!stage) {
      return res.status(404).json({ success: false, message: '阶段不存在' });
    }
    if (stage.status === 'released') {
      return res.status(400).json({ success: false, message: '该阶段款项已释放' });
    }

    const previousStages = transaction.stages.filter(s => s.stageIndex < stageIndex);
    const allPreviousReleased = previousStages.every(s => s.status === 'released');
    if (!allPreviousReleased) {
      return res.status(400).json({ success: false, message: '请先完成之前阶段的验收' });
    }

    stage.status = 'held';
    stage.requestedAt = new Date();
    transaction.status = 'in_progress';
    if (!transaction.messages) transaction.messages = [];
    transaction.messages.push({
      userId: new mongoose.Types.ObjectId(req.user?._id),
      content: `设计师申请「${stage.stageName}」阶段验收，金额 ¥${stage.amount.toLocaleString()}。${description || ''}`,
      timestamp: new Date()
    });

    await transaction.save();

    res.json({
      success: true,
      message: `已提交「${stage.stageName}」阶段验收申请，等待业主确认`,
      data: stage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '申请失败' });
  }
};

export const confirmStageAndRelease = async (req: AuthRequest, res: Response) => {
  try {
    const { stageIndex, acceptanceImages, description, signature, rating } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: '交易不存在' });
    }
    if (transaction.homeownerId.toString() !== req.user?._id) {
      return res.status(403).json({ success: false, message: '仅业主可确认验收' });
    }

    const stage = transaction.stages.find(s => s.stageIndex === stageIndex);
    if (!stage || stage.status !== 'held') {
      return res.status(400).json({ success: false, message: '阶段状态不允许确认' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } || {};
    const uploadedImages = files.acceptanceImages?.map(f => `/uploads/documents/${f.filename}`) || [];

    stage.status = 'released';
    stage.confirmedByHomeownerAt = new Date();
    stage.releasedAt = new Date();
    stage.acceptanceReport = {
      images: [...(acceptanceImages || []), ...uploadedImages],
      description: description || '',
      signature: {
        homeownerSignature: signature?.homeownerSignature || '',
        designerSignature: signature?.designerSignature || '',
        signedAt: new Date()
      },
      rating: rating || 5
    };

    const isLastStage = stageIndex === transaction.stages.length - 1;
    const allStagesReleased = transaction.stages.every(s => s.status === 'released');

    if (allStagesReleased && isLastStage) {
      transaction.status = 'completed';
      transaction.depositStatus = 'released';
      
      const designer = await User.findById(transaction.designerId);
      if (designer && designer.statistics) {
        designer.statistics.completedProjects += 1;
        if (rating) {
          const total = designer.statistics.rating * designer.statistics.reviewCount + rating;
          designer.statistics.reviewCount += 1;
          designer.statistics.rating = Math.round((total / designer.statistics.reviewCount) * 10) / 10;
        }
        await designer.save();
      }
    } else {
      transaction.status = 'stage_completed';
    }

    if (!transaction.messages) transaction.messages = [];
    transaction.messages.push({
      userId: new mongoose.Types.ObjectId(req.user?._id),
      content: `业主已确认「${stage.stageName}」验收通过！款项 ¥${stage.amount.toLocaleString()} 已释放给设计师。`,
      timestamp: new Date()
    });

    await transaction.save();

    res.json({
      success: true,
      message: `验收通过！¥${stage.amount.toLocaleString()} 已释放${allStagesReleased ? '，项目全部完成！' : ''}`,
      data: {
        stage,
        transactionStatus: transaction.status,
        isCompleted: allStagesReleased
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '确认失败' });
  }
};

export const getMyTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { status, role } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user?._id);

    const query: any = {
      $or: [
        { homeownerId: userId },
        { designerId: userId }
      ]
    };

    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .populate('homeownerId', 'username avatar nickname')
      .populate('designerId', 'username avatar nickname serviceAreas statistics')
      .populate('diaryId', 'title coverImage constructionStage');

    const userRole = role || (
      transactions[0]?.homeownerId._id.toString() === req.user?._id ? 'homeowner' : 'designer'
    );

    res.json({
      success: true,
      data: {
        transactions,
        userRole
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取交易列表失败' });
  }
};

export const getTransactionById = async (req: AuthRequest, res: Response) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('homeownerId', 'username avatar nickname phone')
      .populate('designerId', 'username avatar nickname phone serviceAreas statistics')
      .populate('diaryId', 'title coverImage houseArea address constructionStage')
      .populate('messages.userId', 'username avatar nickname');

    if (!transaction) {
      return res.status(404).json({ success: false, message: '交易不存在' });
    }

    const userId = req.user?._id;
    if (
      transaction.homeownerId._id.toString() !== userId &&
      transaction.designerId._id.toString() !== userId &&
      req.user?.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: '无权查看此交易' });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取交易详情失败' });
  }
};

export const raiseDispute = async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: '交易不存在' });
    }
    if (
      transaction.homeownerId.toString() !== req.user?._id &&
      transaction.designerId.toString() !== req.user?._id
    ) {
      return res.status(403).json({ success: false, message: '仅交易双方可发起争议' });
    }

    transaction.status = 'disputed';
    transaction.dispute = {
      reason,
      raisedBy: new mongoose.Types.ObjectId(req.user?._id),
      raisedAt: new Date(),
      status: 'open'
    };

    await transaction.save();

    res.json({
      success: true,
      message: '争议已提交，平台客服将在24小时内介入处理',
      data: transaction.dispute
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '提交争议失败' });
  }
};
