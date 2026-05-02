const express = require('express');
const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, authorizeRoles, logOperation } = require('../middleware/auth');
const {
  SESSION_STATUS,
  SESSION_STEPS,
  generateSessionNo,
  updateSessionStatus,
  getNextResponsible,
  createMessage,
  createSessionDetail,
  lockFloorPlan,
  unlockFloorPlan,
  createConflictRecord,
  getUserTodoCount
} = require('../utils/sessionUtils');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, step, page = 1, pageSize = 10 } = req.query;
    const user = req.user;

    let conditions = [];
    let params = [];

    if (user.role === 'buyer') {
      conditions.push('vs.buyer_id = ?');
      params.push(user.id);
    } else if (user.role === 'agent') {
      conditions.push('vs.agent_id = ?');
      params.push(user.id);
    }

    if (status) {
      conditions.push('vs.status = ?');
      params.push(status);
    }

    if (step) {
      conditions.push('vs.current_step = ?');
      params.push(step);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countQuery = `SELECT COUNT(*) as total FROM viewing_sessions vs ${whereClause}`;
    const countResult = db.prepare(countQuery).get(...params);
    const total = countResult.total;

    const offset = (page - 1) * pageSize;
    params.push(parseInt(pageSize), offset);

    const query = `
      SELECT vs.*,
             h.name as house_name,
             h.house_no,
             h.address,
             h.area,
             h.rooms,
             h.price,
             ub.name as buyer_name,
             ua.name as agent_name
      FROM viewing_sessions vs
      LEFT JOIN houses h ON vs.house_id = h.id
      LEFT JOIN users ub ON vs.buyer_id = ub.id
      LEFT JOIN users ua ON vs.agent_id = ua.id
      ${whereClause}
      ORDER BY vs.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const sessions = db.prepare(query).all(...params);

    const enrichedSessions = sessions.map(session => {
      const availableActions = getAvailableActions(session, user);
      return {
        ...session,
        availableActions
      };
    });

    res.json({
      sessions: enrichedSessions,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('获取看房会话列表失败:', error);
    res.status(500).json({ error: '获取看房会话列表失败' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const session = db.prepare(`
      SELECT vs.*,
             h.name as house_name,
             h.house_no,
             h.address,
             h.area,
             h.rooms,
             h.price,
             ub.name as buyer_name,
             ub.phone as buyer_phone,
             ua.name as agent_name,
             pi.name as panoramic_name,
             pi.file_path as panoramic_path,
             fp.name as floor_plan_name,
             fp.file_path as floor_plan_path,
             fp.is_locked,
             fp.locked_by
      FROM viewing_sessions vs
      LEFT JOIN houses h ON vs.house_id = h.id
      LEFT JOIN users ub ON vs.buyer_id = ub.id
      LEFT JOIN users ua ON vs.agent_id = ua.id
      LEFT JOIN panoramic_images pi ON vs.panoramic_id = pi.id
      LEFT JOIN floor_plans fp ON vs.floor_plan_id = fp.id
      WHERE vs.id = ?
    `).get(id);

    if (!session) {
      return res.status(404).json({ error: '看房会话不存在' });
    }

    const details = db.prepare(`
      SELECT sd.*, u.name as operator_name
      FROM session_details sd
      LEFT JOIN users u ON sd.created_by = u.id
      WHERE sd.session_id = ?
      ORDER BY sd.created_at
    `).all(id);

    const statusFlows = db.prepare(`
      SELECT sf.*, u.name as operator_name
      FROM status_flow sf
      LEFT JOIN users u ON sf.operator_id = u.id
      WHERE sf.session_id = ?
      ORDER BY sf.created_at
    `).all(id);

    const hotspots = session.panoramic_id ? db.prepare(`
      SELECT * FROM hotspots WHERE panoramic_id = ? AND status = 'active'
    `).all(session.panoramic_id) : [];

    const navigationPoints = session.panoramic_id ? db.prepare(`
      SELECT * FROM navigation_points WHERE panoramic_id = ? AND status = 'active'
    `).all(session.panoramic_id) : [];

    const availableActions = getAvailableActions(session, req.user);

    res.json({
      session,
      details,
      statusFlows,
      hotspots,
      navigationPoints,
      availableActions
    });
  } catch (error) {
    console.error('获取看房会话详情失败:', error);
    res.status(500).json({ error: '获取看房会话详情失败' });
  }
});

router.post('/', authenticateToken, logOperation('sessions'), async (req, res) => {
  try {
    const { house_id, expected_completion_time } = req.body;
    const user = req.user;

    if (!house_id) {
      return res.status(400).json({ error: '房源ID为必填项' });
    }

    const house = db.prepare('SELECT * FROM houses WHERE id = ?').get(house_id);
    if (!house) {
      return res.status(404).json({ error: '房源不存在' });
    }

    const existingSession = db.prepare(`
      SELECT * FROM viewing_sessions 
      WHERE house_id = ? AND buyer_id = ? AND status NOT IN ('completed', 'cancelled')
    `).get(house_id, user.id);

    if (existingSession) {
      return res.status(400).json({ 
        error: '该房源已有进行中的看房会话',
        existingSessionId: existingSession.id 
      });
    }

    const sessionId = uuidv4();
    const sessionNo = generateSessionNo();

    const agent = db.prepare(`
      SELECT u.id FROM users u 
      WHERE u.role = 'agent' AND u.status = 'active'
      ORDER BY u.created_at LIMIT 1
    `).get();

    db.prepare(`
      INSERT INTO viewing_sessions (
        id, session_no, house_id, buyer_id, agent_id, 
        status, current_step, expected_completion_time,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      sessionId,
      sessionNo,
      house_id,
      user.id,
      agent ? agent.id : null,
      SESSION_STATUS.PENDING_3D_SPACE,
      SESSION_STEPS.HOUSE_SELECTION,
      expected_completion_time
    );

    createSessionDetail(sessionId, SESSION_STEPS.HOUSE_SELECTION, 'completed', {
      house_id,
      house_name: house.name,
      expected_completion_time
    }, user.id);

    if (agent) {
      createMessage(
        agent.id,
        sessionId,
        'system',
        '新的看房会话待处理',
        `用户 ${user.name} 选择了房源 ${house.name}，请处理3D空间准备`
      );
    }

    const session = db.prepare(`
      SELECT vs.*,
             h.name as house_name,
             h.house_no
      FROM viewing_sessions vs
      LEFT JOIN houses h ON vs.house_id = h.id
      WHERE vs.id = ?
    `).get(sessionId);

    res.status(201).json({
      session,
      message: '看房会话创建成功，已进入选择房源完成状态'
    });
  } catch (error) {
    console.error('创建看房会话失败:', error);
    res.status(500).json({ error: '创建看房会话失败' });
  }
});

router.post('/:id/enter-3d-space', authenticateToken, logOperation('sessions'), async (req, res) => {
  try {
    const { id } = req.params;
    const { panoramic_id, floor_plan_id } = req.body;
    const user = req.user;

    const session = db.prepare('SELECT * FROM viewing_sessions WHERE id = ?').get(id);
    if (!session) {
      return res.status(404).json({ error: '看房会话不存在' });
    }

    if (session.status !== SESSION_STATUS.PENDING_3D_SPACE) {
      return res.status(400).json({ error: '当前状态不允许进入3D空间操作' });
    }

    if (floor_plan_id) {
      const lockResult = lockFloorPlan(floor_plan_id, user.id);
      if (!lockResult.success) {
        return res.status(409).json({ error: lockResult.error });
      }
    }

    db.prepare(`
      UPDATE viewing_sessions 
      SET panoramic_id = ?, floor_plan_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(panoramic_id, floor_plan_id, id);

    updateSessionStatus(
      id,
      SESSION_STATUS.PENDING_HOTSPOT_VIEW,
      SESSION_STEPS.THREE_D_SPACE,
      user.id,
      'enter_3d_space',
      `已进入3D空间，全景图: ${panoramic_id}, 户型图: ${floor_plan_id}`
    );

    createSessionDetail(id, SESSION_STEPS.THREE_D_SPACE, 'completed', {
      panoramic_id,
      floor_plan_id,
      locked_by: user.id
    }, user.id);

    if (session.buyer_id) {
      createMessage(
        session.buyer_id,
        id,
        'system',
        '3D空间已准备就绪',
        '经纪人已为您准备好3D看房空间，请点击查看热点'
      );
    }

    const updatedSession = db.prepare(`
      SELECT vs.*,
             h.name as house_name,
             h.house_no,
             pi.name as panoramic_name,
             fp.name as floor_plan_name
      FROM viewing_sessions vs
      LEFT JOIN houses h ON vs.house_id = h.id
      LEFT JOIN panoramic_images pi ON vs.panoramic_id = pi.id
      LEFT JOIN floor_plans fp ON vs.floor_plan_id = fp.id
      WHERE vs.id = ?
    `).get(id);

    res.json({
      session: updatedSession,
      message: '成功进入3D空间，户型图已锁定'
    });
  } catch (error) {
    console.error('进入3D空间失败:', error);
    res.status(500).json({ error: '进入3D空间失败' });
  }
});

router.post('/:id/view-hotspot', authenticateToken, logOperation('sessions'), async (req, res) => {
  try {
    const { id } = req.params;
    const { hotspot_id, action, remark } = req.body;
    const user = req.user;

    const session = db.prepare('SELECT * FROM viewing_sessions WHERE id = ?').get(id);
    if (!session) {
      return res.status(404).json({ error: '看房会话不存在' });
    }

    if (session.status !== SESSION_STATUS.PENDING_HOTSPOT_VIEW) {
      return res.status(400).json({ error: '当前状态不允许热点查看操作' });
    }

    if (hotspot_id) {
      const hotspot = db.prepare('SELECT * FROM hotspots WHERE id = ?').get(hotspot_id);
      if (!hotspot) {
        return res.status(404).json({ error: '热点不存在' });
      }

      db.prepare(`
        UPDATE viewing_sessions 
        SET hotspot_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(hotspot_id, id);
    }

    const validActions = ['approve', 'reject', 'request_info'];
    if (action && !validActions.includes(action)) {
      return res.status(400).json({ error: '无效的操作类型' });
    }

    let newStatus = session.status;
    let newStep = session.current_step;

    if (action === 'approve') {
      newStatus = SESSION_STATUS.PENDING_CONSULTATION;
      newStep = SESSION_STEPS.HOTSPOT_VIEW;

      createSessionDetail(id, SESSION_STEPS.HOTSPOT_VIEW, 'approved', {
        hotspot_id,
        remark
      }, user.id);

      if (session.agent_id) {
        createMessage(
          session.agent_id,
          id,
          'system',
          '热点查看已完成',
          '购房者已完成热点查看，等待咨询预约'
        );
      }
    } else if (action === 'reject') {
      newStatus = SESSION_STATUS.PENDING_3D_SPACE;
      newStep = SESSION_STEPS.THREE_D_SPACE;

      createSessionDetail(id, SESSION_STEPS.HOTSPOT_VIEW, 'rejected', {
        hotspot_id,
        remark
      }, user.id);

      if (session.agent_id) {
        createMessage(
          session.agent_id,
          id,
          'system',
          '热点查看被驳回',
          `购房者驳回了热点查看: ${remark}`
        );
      }
    } else if (action === 'request_info') {
      createSessionDetail(id, SESSION_STEPS.HOTSPOT_VIEW, 'pending_info', {
        hotspot_id,
        remark
      }, user.id);

      if (session.agent_id) {
        createMessage(
          session.agent_id,
          id,
          'system',
          '需要补充信息',
          `购房者要求补充信息: ${remark}`
        );
      }
    }

    if (action !== 'request_info') {
      updateSessionStatus(
        id,
        newStatus,
        newStep,
        user.id,
        `hotspot_${action}`,
        remark
      );
    }

    const updatedSession = db.prepare(`
      SELECT vs.*,
             h.name as house_name,
             h.house_no
      FROM viewing_sessions vs
      LEFT JOIN houses h ON vs.house_id = h.id
      WHERE vs.id = ?
    `).get(id);

    res.json({
      session: updatedSession,
      message: action === 'approve' ? '热点查看已完成，进入咨询预约阶段' :
               action === 'reject' ? '热点查看被驳回，返回3D空间阶段' :
               '已提交信息补充请求'
    });
  } catch (error) {
    console.error('处理热点查看失败:', error);
    res.status(500).json({ error: '处理热点查看失败' });
  }
});

router.post('/:id/consultation', authenticateToken, logOperation('sessions'), async (req, res) => {
  try {
    const { id } = req.params;
    const { action, appointment_time, contact_name, contact_phone, remark, assigned_agent_id } = req.body;
    const user = req.user;

    const session = db.prepare('SELECT * FROM viewing_sessions WHERE id = ?').get(id);
    if (!session) {
      return res.status(404).json({ error: '看房会话不存在' });
    }

    if (session.status !== SESSION_STATUS.PENDING_CONSULTATION) {
      return res.status(400).json({ error: '当前状态不允许咨询预约操作' });
    }

    const validActions = ['approve', 'reject', 'request_info', 'reassign'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: '无效的操作类型' });
    }

    let appointmentId = null;

    if (action === 'approve') {
      if (!appointment_time || !contact_name || !contact_phone) {
        return res.status(400).json({ error: '预约时间、联系人和联系电话为必填项' });
      }

      appointmentId = uuidv4();
      db.prepare(`
        INSERT INTO appointments (id, session_id, appointment_time, contact_name, contact_phone, status, remark, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'confirmed', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(appointmentId, id, appointment_time, contact_name, contact_phone, remark);

      db.prepare(`
        UPDATE viewing_sessions 
        SET appointment_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(appointmentId, id);

      updateSessionStatus(
        id,
        SESSION_STATUS.PENDING_LEAD_CAPTURE,
        SESSION_STEPS.CONSULTATION,
        user.id,
        'consultation_approve',
        remark || '咨询预约已确认'
      );

      createSessionDetail(id, SESSION_STEPS.CONSULTATION, 'approved', {
        appointment_time,
        contact_name,
        contact_phone,
        remark
      }, user.id);

      createMessage(
        session.buyer_id,
        id,
        'system',
        '预约已确认',
        `您的看房预约已确认，时间: ${appointment_time}，请完成留资`
      );
    } else if (action === 'reject') {
      updateSessionStatus(
        id,
        SESSION_STATUS.REJECTED,
        session.current_step,
        user.id,
        'consultation_reject',
        remark || '咨询预约被驳回'
      );

      createSessionDetail(id, SESSION_STEPS.CONSULTATION, 'rejected', { remark }, user.id);

      createMessage(
        session.buyer_id,
        id,
        'system',
        '咨询预约被驳回',
        `您的咨询预约被驳回: ${remark}`
      );
    } else if (action === 'request_info') {
      createSessionDetail(id, SESSION_STEPS.CONSULTATION, 'pending_info', { remark }, user.id);

      createMessage(
        session.buyer_id,
        id,
        'system',
        '需要补充信息',
        `经纪人要求补充信息: ${remark}`
      );
    } else if (action === 'reassign') {
      if (!assigned_agent_id) {
        return res.status(400).json({ error: '转派需要指定新的经纪人' });
      }

      const newAgent = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(assigned_agent_id, 'agent');
      if (!newAgent) {
        return res.status(404).json({ error: '目标经纪人不存在' });
      }

      db.prepare(`
        UPDATE viewing_sessions 
        SET agent_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(assigned_agent_id, id);

      createSessionDetail(id, SESSION_STEPS.CONSULTATION, 'reassigned', {
        old_agent_id: session.agent_id,
        new_agent_id: assigned_agent_id,
        remark
      }, user.id);

      createMessage(
        assigned_agent_id,
        id,
        'system',
        '新的看房会话转派给您',
        `系统将看房会话转派给您处理，请及时查看`
      );

      if (session.agent_id) {
        createMessage(
          session.agent_id,
          id,
          'system',
          '看房会话已转派',
          `您负责的看房会话已转派给其他经纪人`
        );
      }
    }

    const updatedSession = db.prepare(`
      SELECT vs.*,
             h.name as house_name,
             h.house_no,
             a.appointment_time,
             a.contact_name,
             a.contact_phone
      FROM viewing_sessions vs
      LEFT JOIN houses h ON vs.house_id = h.id
      LEFT JOIN appointments a ON vs.appointment_id = a.id
      WHERE vs.id = ?
    `).get(id);

    res.json({
      session: updatedSession,
      message: action === 'approve' ? '咨询预约已确认，进入留资阶段' :
               action === 'reject' ? '咨询预约已驳回' :
               action === 'reassign' ? '会话已转派' :
               '已提交信息补充请求'
    });
  } catch (error) {
    console.error('处理咨询预约失败:', error);
    res.status(500).json({ error: '处理咨询预约失败' });
  }
});

router.post('/:id/capture-lead', authenticateToken, logOperation('sessions'), async (req, res) => {
  try {
    const { id } = req.params;
    const { buyer_name, buyer_phone, buyer_email, interest_level, remark } = req.body;
    const user = req.user;

    const session = db.prepare('SELECT * FROM viewing_sessions WHERE id = ?').get(id);
    if (!session) {
      return res.status(404).json({ error: '看房会话不存在' });
    }

    if (session.status !== SESSION_STATUS.PENDING_LEAD_CAPTURE) {
      return res.status(400).json({ error: '当前状态不允许留资操作' });
    }

    if (!buyer_name || !buyer_phone) {
      return res.status(400).json({ error: '购房人姓名和电话为必填项' });
    }

    const leadId = uuidv4();
    db.prepare(`
      INSERT INTO leads (id, session_id, buyer_name, buyer_phone, buyer_email, interest_level, remark, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'qualified', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(leadId, id, buyer_name, buyer_phone, buyer_email, interest_level, remark);

    updateSessionStatus(
      id,
      SESSION_STATUS.COMPLETED,
      SESSION_STEPS.LEAD_CAPTURE,
      user.id,
      'lead_captured',
      remark || '留资完成'
    );

    createSessionDetail(id, SESSION_STEPS.LEAD_CAPTURE, 'completed', {
      buyer_name,
      buyer_phone,
      buyer_email,
      interest_level,
      remark
    }, user.id);

    if (session.agent_id) {
      createMessage(
        session.agent_id,
        id,
        'system',
        '看房会话已完成',
        `购房者 ${buyer_name} 已完成留资，看房会话结束`
      );
    }

    if (session.floor_plan_id) {
      unlockFloorPlan(session.floor_plan_id);
    }

    const updatedSession = db.prepare(`
      SELECT vs.*,
             h.name as house_name,
             h.house_no,
             l.buyer_name,
             l.buyer_phone,
             l.interest_level
      FROM viewing_sessions vs
      LEFT JOIN houses h ON vs.house_id = h.id
      LEFT JOIN leads l ON l.session_id = vs.id
      WHERE vs.id = ?
    `).get(id);

    res.json({
      session: updatedSession,
      message: '留资完成，看房会话已结束'
    });
  } catch (error) {
    console.error('处理留资失败:', error);
    res.status(500).json({ error: '处理留资失败' });
  }
});

router.post('/:id/cancel', authenticateToken, logOperation('sessions'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user;

    const session = db.prepare('SELECT * FROM viewing_sessions WHERE id = ?').get(id);
    if (!session) {
      return res.status(404).json({ error: '看房会话不存在' });
    }

    if (['completed', 'cancelled', 'rejected'].includes(session.status)) {
      return res.status(400).json({ error: '该会话已结束，无法撤销' });
    }

    updateSessionStatus(
      id,
      SESSION_STATUS.CANCELLED,
      session.current_step,
      user.id,
      'cancelled',
      reason || '用户撤销'
    );

    if (session.floor_plan_id) {
      unlockFloorPlan(session.floor_plan_id);
    }

    res.json({
      message: '会话已撤销'
    });
  } catch (error) {
    console.error('撤销会话失败:', error);
    res.status(500).json({ error: '撤销会话失败' });
  }
});

function getAvailableActions(session, user) {
  const actions = [];

  if (user.role === 'buyer') {
    switch (session.status) {
      case SESSION_STATUS.PENDING_HOTSPOT_VIEW:
        actions.push({ action: 'view_hotspot', label: '查看热点', type: 'primary' });
        break;
      case SESSION_STATUS.PENDING_LEAD_CAPTURE:
        actions.push({ action: 'capture_lead', label: '完成留资', type: 'primary' });
        break;
    }
  } else if (user.role === 'agent') {
    switch (session.status) {
      case SESSION_STATUS.PENDING_3D_SPACE:
        actions.push({ action: 'enter_3d_space', label: '进入3D空间', type: 'primary' });
        break;
      case SESSION_STATUS.PENDING_CONSULTATION:
        actions.push(
          { action: 'consultation_approve', label: '确认预约', type: 'primary' },
          { action: 'consultation_reject', label: '驳回', type: 'danger' },
          { action: 'consultation_request', label: '补充资料', type: 'warning' },
          { action: 'reassign', label: '转派', type: 'secondary' }
        );
        break;
    }
  }

  if (!['completed', 'cancelled', 'rejected'].includes(session.status)) {
    actions.push({ action: 'cancel', label: '撤销', type: 'danger' });
  }

  return actions;
}

module.exports = router;
