import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { DailyLog, Evaluation, User, Department } from '../models';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../types';

export const createDailyLog = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const { date, content, planTomorrow, issues, isPlanCompleted, relatedFees } = req.body;

    if (!date || !content) {
      return res.status(400).json({ message: '日期和日志内容不能为空' });
    }

    const existingLog = await DailyLog.findOne({
      where: {
        userId: req.user.id,
        date: date
      }
    });

    if (existingLog) {
      return res.status(400).json({ message: '该日期的日志已存在，可选择编辑' });
    }

    const newLog = await DailyLog.create({
      userId: req.user.id,
      date,
      content,
      planTomorrow: planTomorrow || '',
      issues: issues || '',
      isPlanCompleted: isPlanCompleted || false,
      relatedFees: relatedFees || 0,
      status: 'draft'
    });

    res.status(201).json({
      message: '日志创建成功',
      dailyLog: newLog
    });
  } catch (error) {
    console.error('创建日志错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const getDailyLogs = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const { startDate, endDate, status, page = 1, limit = 20 } = req.query;

    const where: any = { userId: req.user.id };

    if (startDate && endDate) {
      where.date = {
        [Op.between]: [startDate, endDate]
      };
    }

    if (status) {
      where.status = status;
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const { count, rows } = await DailyLog.findAndCountAll({
      where,
      include: [
        {
          model: Evaluation,
          as: 'evaluations',
          include: [
            {
              model: User,
              as: 'evaluator',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['date', 'DESC']],
      limit: parseInt(limit as string),
      offset
    });

    res.status(200).json({
      total: count,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      data: rows
    });
  } catch (error) {
    console.error('获取日志列表错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const getDailyLogById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const { id } = req.params;

    const log = await DailyLog.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'username', 'role']
        },
        {
          model: Evaluation,
          as: 'evaluations',
          include: [
            {
              model: User,
              as: 'evaluator',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!log) {
      return res.status(404).json({ message: '日志不存在' });
    }

    const isOwner = log.userId === req.user.id;
    const isAdmin = req.user.role === UserRole.ADMIN || req.user.role === UserRole.GM;
    const isDeptManager = req.user.role === UserRole.DEPT_MANAGER;

    if (!isOwner && !isAdmin && !isDeptManager) {
      return res.status(403).json({ message: '无权限查看此日志' });
    }

    res.status(200).json(log);
  } catch (error) {
    console.error('获取日志详情错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const updateDailyLog = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const { id } = req.params;
    const { content, planTomorrow, issues, isPlanCompleted, relatedFees, status, date } = req.body;

    const log = await DailyLog.findByPk(id);

    if (!log) {
      return res.status(404).json({ message: '日志不存在' });
    }

    if (log.userId !== req.user.id) {
      return res.status(403).json({ message: '无权限编辑此日志' });
    }

    if (log.status === 'reviewed') {
      return res.status(400).json({ message: '已评价的日志无法编辑' });
    }

    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (planTomorrow !== undefined) updateData.planTomorrow = planTomorrow;
    if (issues !== undefined) updateData.issues = issues;
    if (isPlanCompleted !== undefined) updateData.isPlanCompleted = isPlanCompleted;
    if (relatedFees !== undefined) updateData.relatedFees = relatedFees;
    if (status !== undefined) updateData.status = status;
    if (date !== undefined) updateData.date = date;

    const updatedLog = await log.update(updateData);

    res.status(200).json({
      message: '日志更新成功',
      dailyLog: updatedLog
    });
  } catch (error) {
    console.error('更新日志错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const deleteDailyLog = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const { id } = req.params;

    const log = await DailyLog.findByPk(id);

    if (!log) {
      return res.status(404).json({ message: '日志不存在' });
    }

    if (log.userId !== req.user.id) {
      return res.status(403).json({ message: '无权限删除此日志' });
    }

    if (log.status === 'reviewed') {
      return res.status(400).json({ message: '已评价的日志无法删除' });
    }

    await log.destroy();

    res.status(200).json({ message: '日志删除成功' });
  } catch (error) {
    console.error('删除日志错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const submitDailyLog = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const { id } = req.params;

    const log = await DailyLog.findByPk(id);

    if (!log) {
      return res.status(404).json({ message: '日志不存在' });
    }

    if (log.userId !== req.user.id) {
      return res.status(403).json({ message: '无权限提交此日志' });
    }

    if (log.status !== 'draft') {
      return res.status(400).json({ message: '只有草稿状态的日志可以提交' });
    }

    const updatedLog = await log.update({ status: 'submitted' });

    res.status(200).json({
      message: '日志提交成功',
      dailyLog: updatedLog
    });
  } catch (error) {
    console.error('提交日志错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const getDailyLogsByDateRange = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const { type } = req.params;
    const { date } = req.query;

    let startDate: string;
    let endDate: string;
    const targetDate = date ? new Date(date as string) : new Date();

    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const day = targetDate.getDate();
    const dayOfWeek = targetDate.getDay();

    switch (type) {
      case 'day':
        startDate = endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        break;
      case 'week':
        const monday = new Date(targetDate);
        monday.setDate(day - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        startDate = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
        endDate = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
        break;
      case 'month':
        startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        endDate = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;
        break;
      default:
        return res.status(400).json({ message: '无效的时间范围类型' });
    }

    const logs = await DailyLog.findAll({
      where: {
        userId: req.user.id,
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Evaluation,
          as: 'evaluations',
          include: [
            {
              model: User,
              as: 'evaluator',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['date', 'ASC']]
    });

    res.status(200).json({
      startDate,
      endDate,
      type,
      data: logs
    });
  } catch (error) {
    console.error('获取日期范围日志错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};
