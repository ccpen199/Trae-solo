import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { DailyLog, Evaluation, User, Department, Project, ProjectFeedback, MissingLogRecord } from '../models';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../types';

export const getDepartmentLogs = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const isDeptManager = req.user.role === UserRole.DEPT_MANAGER;
    const isGM = req.user.role === UserRole.GM;
    const isAdmin = req.user.role === UserRole.ADMIN;

    if (!isDeptManager && !isGM && !isAdmin) {
      return res.status(403).json({ message: '无权限查看部门日志' });
    }

    const { departmentId, startDate, endDate, status, userId, page = 1, limit = 20 } = req.query;

    const userWhere: any = {};
    if (isDeptManager && req.user.departmentId) {
      userWhere.departmentId = req.user.departmentId;
    }
    if (departmentId) {
      userWhere.departmentId = departmentId;
    }
    if (userId) {
      userWhere.id = userId;
    }

    const logWhere: any = {};
    if (startDate && endDate) {
      logWhere.date = { [Op.between]: [startDate, endDate] };
    }
    if (status) {
      logWhere.status = status;
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const { count, rows } = await DailyLog.findAndCountAll({
      where: logWhere,
      include: [
        {
          model: User,
          as: 'user',
          where: userWhere,
          attributes: ['id', 'name', 'username', 'role', 'departmentId'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name']
            }
          ]
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
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
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
    console.error('获取部门日志错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const evaluateDailyLog = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const isDeptManager = req.user.role === UserRole.DEPT_MANAGER;
    const isGM = req.user.role === UserRole.GM;
    const isSupervisor = req.user.role === UserRole.SUPERVISOR;

    if (!isDeptManager && !isGM && !isSupervisor) {
      return res.status(403).json({ message: '无权限评价日志' });
    }

    const { logId } = req.params;
    const { score, comment } = req.body;

    const log = await DailyLog.findByPk(logId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'departmentId']
        }
      ]
    });

    if (!log) {
      return res.status(404).json({ message: '日志不存在' });
    }

    if (log.status !== 'submitted') {
      return res.status(400).json({ message: '只能评价已提交的日志' });
    }

    if (isDeptManager && req.user.departmentId && log.user?.departmentId !== req.user.departmentId) {
      return res.status(403).json({ message: '无权限评价其他部门员工的日志' });
    }

    const existingEvaluation = await Evaluation.findOne({
      where: {
        dailyLogId: logId,
        evaluatorId: req.user.id
      }
    });

    if (existingEvaluation) {
      return res.status(400).json({ message: '您已评价过此日志' });
    }

    const evaluation = await Evaluation.create({
      dailyLogId: parseInt(logId),
      evaluatorId: req.user.id,
      score: score || null,
      comment: comment || ''
    });

    await log.update({ status: 'reviewed' });

    res.status(201).json({
      message: '评价成功',
      evaluation
    });
  } catch (error) {
    console.error('评价日志错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const getProjectFeedbacks = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const isDeptManager = req.user.role === UserRole.DEPT_MANAGER;
    const isGM = req.user.role === UserRole.GM;
    const isAdmin = req.user.role === UserRole.ADMIN;

    if (!isDeptManager && !isGM && !isAdmin) {
      return res.status(403).json({ message: '无权限查看项目反馈' });
    }

    const { projectId, startDate, endDate, isReported, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }
    if (isReported !== undefined) {
      where.isReported = isReported === 'true';
    }
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const { count, rows } = await ProjectFeedback.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'username'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status']
        },
        {
          model: DailyLog,
          as: 'dailyLog',
          attributes: ['id', 'date', 'content']
        }
      ],
      order: [['createdAt', 'DESC']],
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
    console.error('获取项目反馈错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const reportToGM = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const isDeptManager = req.user.role === UserRole.DEPT_MANAGER;

    if (!isDeptManager) {
      return res.status(403).json({ message: '只有部门经理可以上报信息' });
    }

    const { feedbackId } = req.params;

    const feedback = await ProjectFeedback.findByPk(feedbackId);

    if (!feedback) {
      return res.status(404).json({ message: '项目反馈不存在' });
    }

    if (feedback.isReported) {
      return res.status(400).json({ message: '该反馈已上报过' });
    }

    await feedback.update({ isReported: true });

    res.status(200).json({
      message: '已上报给总经理',
      feedback
    });
  } catch (error) {
    console.error('上报反馈错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const getMissingLogs = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const isDeptManager = req.user.role === UserRole.DEPT_MANAGER;
    const isGM = req.user.role === UserRole.GM;
    const isAdmin = req.user.role === UserRole.ADMIN;

    if (!isDeptManager && !isGM && !isAdmin) {
      return res.status(403).json({ message: '无权限查看缺失日志' });
    }

    const { date, departmentId, logType, isNotified, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (date) {
      where.date = date;
    }
    if (logType) {
      where.logType = logType;
    }
    if (isNotified !== undefined) {
      where.isNotified = isNotified === 'true';
    }

    const userWhere: any = {};
    if (isDeptManager && req.user.departmentId) {
      userWhere.departmentId = req.user.departmentId;
    }
    if (departmentId) {
      userWhere.departmentId = departmentId;
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const { count, rows } = await MissingLogRecord.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          where: userWhere,
          attributes: ['id', 'name', 'username'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
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
    console.error('获取缺失日志记录错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};
