import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { User, Department, DailyLog, Project, Evaluation, ProjectFeedback } from '../models';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../types';
import { hashPassword } from '../utils/auth';

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const isAdmin = req.user.role === UserRole.ADMIN;
    const isGM = req.user.role === UserRole.GM;

    if (!isAdmin && !isGM) {
      return res.status(403).json({ message: '无权限管理用户' });
    }

    const { departmentId, role, isActive, search, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (departmentId) {
      where.departmentId = departmentId;
    }
    if (role) {
      where.role = role;
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
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
    console.error('获取用户列表错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    if (req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: '只有管理员可以创建用户' });
    }

    const { username, password, name, email, phone, departmentId, role } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ message: '用户名、密码和姓名不能为空' });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      name,
      email,
      phone,
      departmentId,
      role: role || UserRole.EMPLOYEE,
      isActive: true
    });

    const { password: _, ...userWithoutPassword } = newUser.toJSON();

    res.status(201).json({
      message: '用户创建成功',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const isAdmin = req.user.role === UserRole.ADMIN;

    const { id } = req.params;
    const { name, email, phone, departmentId, role, isActive, password } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const isSelf = req.user.id === parseInt(id);

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: '无权限修改此用户' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    if (isAdmin) {
      if (departmentId !== undefined) updateData.departmentId = departmentId;
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
    }

    if (password) {
      updateData.password = await hashPassword(password);
    }

    const updatedUser = await user.update(updateData);

    const { password: _, ...userWithoutPassword } = updatedUser.toJSON();

    res.status(200).json({
      message: '用户更新成功',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    if (req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: '只有管理员可以删除用户' });
    }

    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ message: '不能删除自己的账户' });
    }

    await user.update({ isActive: false });

    res.status(200).json({ message: '用户已禁用' });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const getDepartments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const departments = await Department.findAll({
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.status(200).json(departments);
  } catch (error) {
    console.error('获取部门列表错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    if (req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: '只有管理员可以创建部门' });
    }

    const { name, description, managerId } = req.body;

    if (!name) {
      return res.status(400).json({ message: '部门名称不能为空' });
    }

    const existingDept = await Department.findOne({ where: { name } });
    if (existingDept) {
      return res.status(400).json({ message: '部门名称已存在' });
    }

    const department = await Department.create({
      name,
      description,
      managerId
    });

    res.status(201).json({
      message: '部门创建成功',
      department
    });
  } catch (error) {
    console.error('创建部门错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

export const getStatistics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '未授权' });
    }

    const isGM = req.user.role === UserRole.GM;
    const isAdmin = req.user.role === UserRole.ADMIN;

    if (!isGM && !isAdmin) {
      return res.status(403).json({ message: '无权限查看统计数据' });
    }

    const { startDate, endDate, departmentId, userId, projectId } = req.query;

    const userWhere: any = {};
    if (departmentId) userWhere.departmentId = departmentId;
    if (userId) userWhere.id = userId;

    const logWhere: any = {};
    if (startDate && endDate) {
      logWhere.date = { [Op.between]: [startDate, endDate] };
    }

    const totalUsers = await User.count({ where: { isActive: true, ...userWhere } });

    const totalLogs = await DailyLog.count({
      include: [
        {
          model: User,
          as: 'user',
          where: userWhere,
          attributes: []
        }
      ],
      where: logWhere
    });

    const submittedLogs = await DailyLog.count({
      include: [
        {
          model: User,
          as: 'user',
          where: userWhere,
          attributes: []
        }
      ],
      where: { ...logWhere, status: { [Op.in]: ['submitted', 'reviewed'] } }
    });

    const reviewedLogs = await DailyLog.count({
      include: [
        {
          model: User,
          as: 'user',
          where: userWhere,
          attributes: []
        }
      ],
      where: { ...logWhere, status: 'reviewed' }
    });

    const totalProjects = await Project.count();
    const ongoingProjects = await Project.count({ where: { status: 'ongoing' } });

    const totalFeedbacks = await ProjectFeedback.count();
    const reportedFeedbacks = await ProjectFeedback.count({ where: { isReported: true } });

    res.status(200).json({
      summary: {
        totalUsers,
        totalLogs,
        submittedLogs,
        reviewedLogs,
        totalProjects,
        ongoingProjects,
        totalFeedbacks,
        reportedFeedbacks
      }
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};
