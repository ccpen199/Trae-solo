const { Op } = require('sequelize');
const initModels = require('../models');

const getMySchedules = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, type, status } = req.query;
    const { Schedule, User, Organization } = initModels();

    const where = {
      [Op.or]: [
        { creatorId: userId },
        { 
          [Op.and]: [
            { visibility: { [Op.in]: ['public', 'department'] } },
            { orgId: req.user.orgId }
          ]
        }
      ]
    };

    if (startDate) {
      where.startTime = { [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      where.endTime = { [Op.lte]: new Date(endDate) };
    }
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    const schedules = await Schedule.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'realName', 'username']
        },
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name']
        }
      ],
      order: [['startTime', 'ASC']]
    });

    res.json({
      code: 200,
      data: schedules
    });
  } catch (error) {
    console.error('获取我的日程错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取日程失败'
    });
  }
};

const getDepartmentSchedules = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const { startDate, endDate, status } = req.query;
    const { Schedule, User, Organization } = initModels();

    if (!orgId) {
      return res.json({
        code: 200,
        data: []
      });
    }

    const where = {
      orgId,
      visibility: { [Op.in]: ['public', 'department'] }
    };

    if (startDate) {
      where.startTime = { [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      where.endTime = { [Op.lte]: new Date(endDate) };
    }
    if (status) {
      where.status = status;
    }

    const schedules = await Schedule.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'realName', 'username']
        },
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name']
        }
      ],
      order: [['startTime', 'ASC']]
    });

    res.json({
      code: 200,
      data: schedules
    });
  } catch (error) {
    console.error('获取部门日程错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取日程失败'
    });
  }
};

const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { Schedule, User, Organization } = initModels();

    const schedule = await Schedule.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'realName', 'username']
        },
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!schedule) {
      return res.status(404).json({
        code: 404,
        message: '日程不存在'
      });
    }

    const canView = 
      schedule.creatorId === userId ||
      schedule.visibility === 'public' ||
      (schedule.visibility === 'department' && schedule.orgId === req.user.orgId);

    if (!canView) {
      return res.status(403).json({
        code: 403,
        message: '无权查看此日程'
      });
    }

    res.json({
      code: 200,
      data: schedule
    });
  } catch (error) {
    console.error('获取日程详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '获取日程详情失败'
    });
  }
};

const createSchedule = async (req, res) => {
  try {
    const { 
      title, description, type, startTime, endTime, 
      isAllDay, location, reminder, color, 
      recurrenceType, recurrenceRule, visibility
    } = req.body;
    const { Schedule } = initModels();

    if (!title || !startTime || !endTime) {
      return res.status(400).json({
        code: 400,
        message: '标题、开始时间和结束时间不能为空'
      });
    }

    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({
        code: 400,
        message: '结束时间必须大于开始时间'
      });
    }

    const schedule = await Schedule.create({
      title,
      description,
      type: type || 'personal',
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isAllDay: isAllDay || false,
      location,
      reminder: reminder || 0,
      color: color || '#409EFF',
      recurrenceType: recurrenceType || 'none',
      recurrenceRule,
      status: 'pending',
      visibility: visibility || 'private',
      creatorId: req.user.id,
      orgId: req.user.orgId
    });

    res.json({
      code: 200,
      message: '创建成功',
      data: schedule
    });
  } catch (error) {
    console.error('创建日程错误:', error);
    res.status(500).json({
      code: 500,
      message: '创建日程失败'
    });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { 
      title, description, type, startTime, endTime, 
      isAllDay, location, reminder, color, 
      recurrenceType, recurrenceRule, status, visibility
    } = req.body;
    const { Schedule } = initModels();

    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({
        code: 404,
        message: '日程不存在'
      });
    }

    if (schedule.creatorId !== userId) {
      return res.status(403).json({
        code: 403,
        message: '无权修改此日程'
      });
    }

    if (startTime && endTime) {
      if (new Date(startTime) >= new Date(endTime)) {
        return res.status(400).json({
          code: 400,
          message: '结束时间必须大于开始时间'
        });
      }
    }

    await schedule.update({
      title: title || schedule.title,
      description: description !== undefined ? description : schedule.description,
      type: type || schedule.type,
      startTime: startTime ? new Date(startTime) : schedule.startTime,
      endTime: endTime ? new Date(endTime) : schedule.endTime,
      isAllDay: isAllDay !== undefined ? isAllDay : schedule.isAllDay,
      location: location !== undefined ? location : schedule.location,
      reminder: reminder !== undefined ? reminder : schedule.reminder,
      color: color || schedule.color,
      recurrenceType: recurrenceType || schedule.recurrenceType,
      recurrenceRule: recurrenceRule !== undefined ? recurrenceRule : schedule.recurrenceRule,
      status: status || schedule.status,
      visibility: visibility || schedule.visibility
    });

    res.json({
      code: 200,
      message: '更新成功',
      data: schedule
    });
  } catch (error) {
    console.error('更新日程错误:', error);
    res.status(500).json({
      code: 500,
      message: '更新日程失败'
    });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { Schedule } = initModels();

    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({
        code: 404,
        message: '日程不存在'
      });
    }

    if (schedule.creatorId !== userId) {
      return res.status(403).json({
        code: 403,
        message: '无权删除此日程'
      });
    }

    await schedule.destroy();

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除日程错误:', error);
    res.status(500).json({
      code: 500,
      message: '删除日程失败'
    });
  }
};

const searchSchedules = async (req, res) => {
  try {
    const { keyword, startDate, endDate, type } = req.query;
    const userId = req.user.id;
    const orgId = req.user.orgId;
    const { Schedule, User } = initModels();

    const where = {
      [Op.or]: [
        { creatorId: userId },
        { 
          [Op.and]: [
            { visibility: { [Op.in]: ['public', 'department'] } },
            { orgId }
          ]
        }
      ]
    };

    if (keyword) {
      where[Op.and] = [
        {
          [Op.or]: [
            { title: { [Op.like]: `%${keyword}%` } },
            { description: { [Op.like]: `%${keyword}%` } },
            { location: { [Op.like]: `%${keyword}%` } }
          ]
        }
      ];
    }
    if (startDate) {
      where.startTime = { [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      where.endTime = { [Op.lte]: new Date(endDate) };
    }
    if (type) {
      where.type = type;
    }

    const schedules = await Schedule.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'realName', 'username']
        }
      ],
      order: [['startTime', 'ASC']]
    });

    res.json({
      code: 200,
      data: schedules
    });
  } catch (error) {
    console.error('搜索日程错误:', error);
    res.status(500).json({
      code: 500,
      message: '搜索日程失败'
    });
  }
};

module.exports = {
  getMySchedules,
  getDepartmentSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  searchSchedules
};
