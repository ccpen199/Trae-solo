const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const bookingService = require('../services/bookingService');
const userService = require('../services/userService');
const { STATUS_LABELS, ROLES, BOOKING_STATUSES } = require('../utils/constants');
const { transformBooking, transformBookings, convertKeysToCamel, statusToUpperCase } = require('../utils/helpers');

const getCurrentUser = (req) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  if (!userId || !userRole) {
    return null;
  }
  return {
    id: parseInt(userId),
    role: userRole,
  };
};

router.get('/', [
  query('status').optional(),
  query('searchText').optional(),
  query('mainNo').optional(),
  query('shipperName').optional(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数校验失败',
        errors: errors.array(),
      });
    }

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const { status, searchText, mainNo, shipperName, page = 1, pageSize = 10 } = req.query;
    const limit = pageSize;
    const offset = (page - 1) * pageSize;

    const options = {
      status,
      searchText: searchText || mainNo || shipperName,
      limit,
      offset,
    };

    let result;
    if (user.role === ROLES.CONSIGNOR || user.role === ROLES.FORWARDER || user.role === ROLES.SHIPPING_COMPANY) {
      result = bookingService.getBookingsByRole(user.id, user.role, options);
    } else {
      result = bookingService.getBookings(options);
    }

    const transformedData = transformBookings(result.data);

    res.json({
      success: true,
      data: {
        list: transformedData,
        total: result.total,
        page,
        pageSize,
      },
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/statistics', (req, res) => {
  try {
    const user = getCurrentUser(req);
    const options = user ? { userId: user.id, userRole: user.role } : {};
    
    const stats = bookingService.getStatistics(options);
    
    const statsWithLabels = {};
    for (const [key, value] of Object.entries(stats)) {
      const upperKey = statusToUpperCase(key);
      statsWithLabels[upperKey] = {
        count: value,
        label: STATUS_LABELS[key] || key,
      };
    }

    res.json({
      success: true,
      data: statsWithLabels,
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const booking = bookingService.getBookingById(parseInt(id));
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: '订舱单不存在',
      });
    }

    const details = bookingService.getBookingDetails(parseInt(id));
    const transitions = bookingService.getStatusTransitions(parseInt(id));

    const transformedBooking = transformBooking(booking);
    const transformedDetails = convertKeysToCamel(details);
    const transformedTransitions = convertKeysToCamel(transitions).map(t => ({
      ...t,
      fromStatus: statusToUpperCase(t.fromStatus),
      toStatus: statusToUpperCase(t.toStatus),
    }));

    res.json({
      success: true,
      data: {
        ...transformedBooking,
        details: transformedDetails,
        transitions: transformedTransitions,
      },
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/', [
  body('cargoName').notEmpty().withMessage('货物名称不能为空'),
  body('containerCount').optional().isInt({ min: 0 }).toInt(),
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数校验失败',
        errors: errors.array(),
      });
    }

    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const {
      scheduleId,
      cargoName,
      cargoWeight,
      cargoVolume,
      containerCount,
      containerType,
      departurePort,
      arrivalPort,
      pol,
      pod,
      expectedDepartureDate,
      expectedArrivalDate,
      deadline,
      expectedCompleteTime,
      responsiblePerson,
      attachments,
      remark,
      details,
    } = req.body;

    const actualDeparturePort = departurePort || pol;
    const actualArrivalPort = arrivalPort || pod;
    const actualDeadline = deadline || expectedCompleteTime;

    const result = bookingService.createBooking(
      {
        scheduleId: scheduleId ? parseInt(scheduleId) : null,
        cargoName,
        cargoWeight: cargoWeight ? parseFloat(cargoWeight) : null,
        cargoVolume: cargoVolume ? parseFloat(cargoVolume) : null,
        containerCount,
        containerType,
        departurePort: actualDeparturePort,
        arrivalPort: actualArrivalPort,
        expectedDepartureDate,
        expectedArrivalDate,
        deadline: actualDeadline,
        responsiblePerson,
        attachments,
        remark,
        details,
      },
      user.id,
      user.role
    );

    if (result.success && result.data) {
      result.data.status = statusToUpperCase(result.data.status);
    }

    res.json(result);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/:id/action', [
  body('action').notEmpty().withMessage('操作类型不能为空'),
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数校验失败',
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const { action, detailId, comment, attachments, reason } = req.body;

    const result = bookingService.transitionStatus({
      mainId: parseInt(id),
      detailId: detailId ? parseInt(detailId) : null,
      action,
      userId: user.id,
      userRole: user.role,
      comment,
      attachments,
      reason,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Booking action error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/:id/submit', (req, res) => {
  try {
    const { id } = req.params;
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const { comment } = req.body;

    const result = bookingService.transitionStatus({
      mainId: parseInt(id),
      action: 'submit_booking',
      userId: user.id,
      userRole: user.role,
      comment,
    });

    if (result.success) {
      res.json({ ...result, data: { ...result.data, toStatus: statusToUpperCase(result.data?.toStatus) } });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Submit booking error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/:id/approve', (req, res) => {
  try {
    const { id } = req.params;
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const { comment } = req.body;

    const result = bookingService.transitionStatus({
      mainId: parseInt(id),
      action: 'approve_port_entry',
      userId: user.id,
      userRole: user.role,
      comment,
    });

    if (result.success) {
      res.json({ ...result, data: { ...result.data, toStatus: statusToUpperCase(result.data?.toStatus) } });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Approve booking error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const { comment, reason } = req.body;

    const result = bookingService.transitionStatus({
      mainId: parseInt(id),
      action: 'reject',
      userId: user.id,
      userRole: user.role,
      comment,
      reason,
    });

    if (result.success) {
      res.json({ ...result, data: { ...result.data, toStatus: statusToUpperCase(result.data?.toStatus) } });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/:id/port-entry', (req, res) => {
  try {
    const { id } = req.params;
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const { comment, actionType } = req.body;

    let action = 'approve_port_entry';
    if (actionType === 'REJECT') {
      action = 'reject';
    } else if (actionType === 'SUPPLEMENT') {
      action = 'request_additional_info';
    } else if (actionType === 'REASSIGN') {
      action = 'reassign';
    }

    const result = bookingService.transitionStatus({
      mainId: parseInt(id),
      action,
      userId: user.id,
      userRole: user.role,
      comment,
    });

    if (result.success) {
      res.json({ ...result, data: { ...result.data, toStatus: statusToUpperCase(result.data?.toStatus) } });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Port entry booking error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/:id/loading', (req, res) => {
  try {
    const { id } = req.params;
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const { comment } = req.body;

    const result = bookingService.transitionStatus({
      mainId: parseInt(id),
      action: 'complete_loading',
      userId: user.id,
      userRole: user.role,
      comment,
    });

    if (result.success) {
      res.json({ ...result, data: { ...result.data, toStatus: statusToUpperCase(result.data?.toStatus) } });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Loading booking error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.post('/:id/release-bol', (req, res) => {
  try {
    const { id } = req.params;
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
      });
    }

    const { comment } = req.body;

    const result = bookingService.transitionStatus({
      mainId: parseInt(id),
      action: 'release_bill',
      userId: user.id,
      userRole: user.role,
      comment,
    });

    if (result.success) {
      res.json({ ...result, data: { ...result.data, toStatus: statusToUpperCase(result.data?.toStatus) } });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Release BOL error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

router.get('/order-no/:orderNo', (req, res) => {
  try {
    const { orderNo } = req.params;
    const booking = bookingService.getBookingByOrderNo(orderNo);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: '订舱单不存在',
      });
    }

    const transformedBooking = transformBooking(booking);

    res.json({
      success: true,
      data: transformedBooking,
    });
  } catch (error) {
    console.error('Get booking by orderNo error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
});

module.exports = router;
