const { db, generateOrderNo, generateDetailNo, generateId } = require('../database/memoryDb');
const { 
  ORDER_STATUSES, 
  ROLES, 
  canPerformAction, 
  getAvailableActions,
  STATUS_DISPLAY_NAMES
} = require('../core/stateMachine');
const { locationRules, routeRules, poiRules, etaCorrectionRules, calculateDistance } = require('../core/rulesEngine');

const orderService = {
  async createOrder(orderData) {
    const { 
      user_id, 
      user_role,
      origin_lat, 
      origin_lng, 
      origin_address,
      dest_lat,
      dest_lng,
      dest_address,
      expected_arrival_time
    } = orderData;

    if (!user_id || !user_role) {
      throw new Error('用户ID和角色不能为空');
    }

    const originValidation = locationRules.validateLocation(origin_lat, origin_lng);
    const destValidation = locationRules.validateLocation(dest_lat, dest_lng);
    const errors = [];
    
    if (!originValidation.valid) errors.push(...originValidation.errors);
    if (!destValidation.valid) errors.push(...destValidation.errors);
    
    if (errors.length > 0) {
      throw new Error('位置验证失败: ' + errors.join(', '));
    }

    const orderNo = generateOrderNo();
    const distance = calculateDistance(origin_lat, origin_lng, dest_lat, dest_lng);
    const eta = locationRules.calculateETA(distance);

    const now = new Date().toISOString();
    const order = {
      id: db.mainOrders.length + 1,
      order_no: orderNo,
      status: ORDER_STATUSES.PENDING_LOCATION,
      user_id,
      user_role,
      origin_lat,
      origin_lng,
      origin_address: origin_address || '',
      dest_lat,
      dest_lng,
      dest_address: dest_address || '',
      expected_arrival_time: expected_arrival_time || null,
      current_responsible_role: ROLES.DISPATCHER,
      current_responsible_id: null,
      eta_seconds: eta.etaSeconds,
      distance_meters: Math.round(distance),
      is_deleted: 0,
      created_at: now,
      updated_at: now
    };
    db.mainOrders.push(order);

    const detailNo = generateDetailNo(orderNo, 1);
    const detail = {
      id: db.orderDetails.length + 1,
      order_no: orderNo,
      detail_no: detailNo,
      status: ORDER_STATUSES.PENDING_LOCATION,
      sequence: 1,
      poi_type: 'DESTINATION',
      poi_name: dest_address || '目的地',
      poi_lat: dest_lat,
      poi_lng: dest_lng,
      poi_address: dest_address || '',
      eta_seconds: eta.etaSeconds,
      created_at: now,
      updated_at: now
    };
    db.orderDetails.push(detail);

    await this.createMessage({
      orderNo,
      targetRole: ROLES.DISPATCHER,
      targetId: null,
      messageType: 'TODO',
      title: '新导航订单待处理',
      content: `订单 ${orderNo} 已创建，等待输入位置信息`,
      actionRequired: 'submit_location'
    });

    await this.createTimelineEvent({
      orderNo,
      eventType: 'ORDER_CREATED',
      title: '订单创建',
      content: `订单 ${orderNo} 已创建，初始状态：待输入位置`,
      actorRole: user_role,
      actorId: user_id
    });

    return {
      orderNo,
      status: ORDER_STATUSES.PENDING_LOCATION,
      statusName: STATUS_DISPLAY_NAMES[ORDER_STATUSES.PENDING_LOCATION],
      distanceMeters: Math.round(distance),
      etaSeconds: eta.etaSeconds
    };
  },

  async getOrderByNo(orderNo) {
    const order = db.mainOrders.find(o => o.order_no === orderNo && o.is_deleted === 0);
    if (!order) return null;

    const details = db.orderDetails.filter(d => d.order_no === orderNo).sort((a, b) => a.sequence - b.sequence);
    const timeline = db.timelineEvents.filter(e => e.order_no === orderNo).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const logs = db.operationLogs.filter(l => l.order_no === orderNo).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const messages = db.messages.filter(m => m.order_no === orderNo).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return {
      ...order,
      statusName: STATUS_DISPLAY_NAMES[order.status] || order.status,
      details,
      timeline,
      logs,
      messages
    };
  },

  async getOrders(filter = {}) {
    let orders = db.mainOrders.filter(o => o.is_deleted === 0);

    if (filter.status) {
      orders = orders.filter(o => o.status === filter.status);
    }

    if (filter.userRole) {
      orders = orders.filter(o => o.user_role === filter.userRole);
    }

    if (filter.currentResponsibleRole) {
      orders = orders.filter(o => o.current_responsible_role === filter.currentResponsibleRole);
    }

    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (filter.limit) {
      orders = orders.slice(0, filter.limit);
    }

    return orders.map(o => ({
      ...o,
      statusName: STATUS_DISPLAY_NAMES[o.status] || o.status
    }));
  },

  async submitLocation(orderNo, locationData, operatorRole, operatorId) {
    const order = await this.getOrderByNo(orderNo);
    if (!order) throw new Error('订单不存在');

    const actionCheck = canPerformAction(order.status, 'submit_location', operatorRole);
    if (!actionCheck.allowed) {
      throw new Error(actionCheck.reason);
    }

    const { origin_lat, origin_lng, dest_lat, dest_lng } = locationData;
    
    const originValidation = locationRules.validateLocation(origin_lat, origin_lng);
    const destValidation = locationRules.validateLocation(dest_lat, dest_lng);
    const errors = [];
    
    if (!originValidation.valid) errors.push(...originValidation.errors);
    if (!destValidation.valid) errors.push(...destValidation.errors);
    
    if (errors.length > 0) {
      throw new Error('位置验证失败: ' + errors.join(', '));
    }

    const distance = calculateDistance(origin_lat, origin_lng, dest_lat, dest_lng);
    const eta = locationRules.calculateETA(distance);

    const orderIndex = db.mainOrders.findIndex(o => o.order_no === orderNo);
    if (orderIndex !== -1) {
      db.mainOrders[orderIndex] = {
        ...db.mainOrders[orderIndex],
        origin_lat,
        origin_lng,
        dest_lat,
        dest_lng,
        eta_seconds: eta.etaSeconds,
        distance_meters: Math.round(distance),
        status: ORDER_STATUSES.PENDING_ROUTE_PLANNING,
        current_responsible_role: ROLES.MAP_PROVIDER,
        updated_at: new Date().toISOString()
      };
    }

    await this.createOperationLog({
      orderNo,
      operatorRole,
      operatorId,
      action: 'submit_location',
      fromStatus: order.status,
      toStatus: ORDER_STATUSES.PENDING_ROUTE_PLANNING,
      comment: '提交位置信息'
    });

    await this.createTimelineEvent({
      orderNo,
      eventType: 'LOCATION_SUBMITTED',
      title: '位置信息已提交',
      content: `起点: (${origin_lat}, ${origin_lng}), 终点: (${dest_lat}, ${dest_lng})`,
      actorRole: operatorRole,
      actorId: operatorId
    });

    await this.createMessage({
      orderNo,
      targetRole: ROLES.MAP_PROVIDER,
      targetId: null,
      messageType: 'TODO',
      title: '订单等待路线规划',
      content: `订单 ${orderNo} 已提交位置信息，等待路线规划`,
      actionRequired: 'approve_route'
    });

    return {
      orderNo,
      fromStatus: order.status,
      toStatus: ORDER_STATUSES.PENDING_ROUTE_PLANNING,
      distanceMeters: Math.round(distance),
      etaSeconds: eta.etaSeconds
    };
  },

  async planRoute(orderNo) {
    const order = await this.getOrderByNo(orderNo);
    if (!order) throw new Error('订单不存在');

    if (order.origin_lat === null || order.dest_lat === null) {
      throw new Error('请先提交位置信息');
    }

    const routePlan = routeRules.planRoute(
      order.origin_lat, order.origin_lng,
      order.dest_lat, order.dest_lng
    );

    const now = new Date().toISOString();
    for (const route of routePlan.routes) {
      db.routeSelections.push({
        id: db.routeSelections.length + 1,
        route_id: route.routeId,
        order_no: orderNo,
        route_type: route.routeType,
        distance_meters: route.distanceMeters,
        duration_seconds: route.durationSeconds,
        traffic_level: route.trafficLevel,
        route_summary: route.routeSummary,
        is_selected: 0,
        created_at: now
      });
    }

    await this.createTimelineEvent({
      orderNo,
      eventType: 'ROUTE_PLANNED',
      title: '路线已规划',
      content: `已生成 ${routePlan.routes.length} 条可选路线`,
      actorRole: ROLES.MAP_PROVIDER,
      actorId: 'SYSTEM'
    });

    return routePlan;
  },

  async getRouteSelections(orderNo) {
    return db.routeSelections
      .filter(r => r.order_no === orderNo)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  },

  async approveRoute(orderNo, routeId, driverId, operatorRole, operatorId) {
    const order = await this.getOrderByNo(orderNo);
    if (!order) throw new Error('订单不存在');

    const actionCheck = canPerformAction(order.status, 'approve_route', operatorRole);
    if (!actionCheck.allowed) {
      throw new Error(actionCheck.reason);
    }

    const route = db.routeSelections.find(r => r.route_id === routeId && r.order_no === orderNo);
    if (!route) throw new Error('路线不存在');

    for (const r of db.routeSelections) {
      if (r.order_no === orderNo) {
        r.is_selected = 0;
      }
    }

    const routeIndex = db.routeSelections.findIndex(r => r.route_id === routeId);
    if (routeIndex !== -1) {
      db.routeSelections[routeIndex] = {
        ...db.routeSelections[routeIndex],
        is_selected: 1,
        selected_by_role: operatorRole,
        selected_by_id: operatorId,
        selected_at: new Date().toISOString()
      };
    }

    const orderIndex = db.mainOrders.findIndex(o => o.order_no === orderNo);
    if (orderIndex !== -1) {
      db.mainOrders[orderIndex] = {
        ...db.mainOrders[orderIndex],
        status: ORDER_STATUSES.NAVIGATION_EXECUTING,
        current_responsible_role: ROLES.DRIVER,
        current_responsible_id: driverId,
        eta_seconds: route.duration_seconds,
        distance_meters: route.distance_meters,
        updated_at: new Date().toISOString()
      };
    }

    await this.createOperationLog({
      orderNo,
      operatorRole,
      operatorId,
      action: 'approve_route',
      fromStatus: order.status,
      toStatus: ORDER_STATUSES.NAVIGATION_EXECUTING,
      comment: `已选择路线: ${route.route_summary}`
    });

    await this.createTimelineEvent({
      orderNo,
      eventType: 'ROUTE_APPROVED',
      title: '路线已确认',
      content: `选择路线: ${route.route_summary}, 司机ID: ${driverId}`,
      actorRole: operatorRole,
      actorId: operatorId
    });

    await this.createMessage({
      orderNo,
      targetRole: ROLES.DRIVER,
      targetId: driverId,
      messageType: 'TODO',
      title: '新导航任务',
      content: `您已被分配导航订单 ${orderNo}，请开始导航`,
      actionRequired: 'update_location'
    });

    return {
      orderNo,
      fromStatus: order.status,
      toStatus: ORDER_STATUSES.NAVIGATION_EXECUTING,
      selectedRoute: route
    };
  },

  async rejectRoute(orderNo, rejectReason, operatorRole, operatorId) {
    const order = await this.getOrderByNo(orderNo);
    if (!order) throw new Error('订单不存在');

    const actionCheck = canPerformAction(order.status, 'reject_route', operatorRole);
    if (!actionCheck.allowed) {
      throw new Error(actionCheck.reason);
    }

    const orderIndex = db.mainOrders.findIndex(o => o.order_no === orderNo);
    if (orderIndex !== -1) {
      db.mainOrders[orderIndex] = {
        ...db.mainOrders[orderIndex],
        status: ORDER_STATUSES.PENDING_LOCATION,
        current_responsible_role: ROLES.USER,
        updated_at: new Date().toISOString()
      };
    }

    await this.createOperationLog({
      orderNo,
      operatorRole,
      operatorId,
      action: 'reject_route',
      fromStatus: order.status,
      toStatus: ORDER_STATUSES.PENDING_LOCATION,
      comment: `驳回原因: ${rejectReason}`
    });

    await this.createTimelineEvent({
      orderNo,
      eventType: 'ROUTE_REJECTED',
      title: '路线被驳回',
      content: `驳回原因: ${rejectReason}`,
      actorRole: operatorRole,
      actorId: operatorId
    });

    await this.createMessage({
      orderNo,
      targetRole: ROLES.USER,
      targetId: order.user_id,
      messageType: 'NOTIFICATION',
      title: '路线被驳回',
      content: `您的订单 ${orderNo} 路线被驳回，原因: ${rejectReason}，请重新提交位置信息`,
      actionRequired: 'submit_location'
    });

    return {
      orderNo,
      fromStatus: order.status,
      toStatus: ORDER_STATUSES.PENDING_LOCATION,
      rejectReason
    };
  },

  async updateLocation(orderNo, locationData, operatorRole, operatorId) {
    const order = await this.getOrderByNo(orderNo);
    if (!order) throw new Error('订单不存在');

    const actionCheck = canPerformAction(order.status, 'update_location', operatorRole);
    if (!actionCheck.allowed) {
      throw new Error(actionCheck.reason);
    }

    const { lat, lng, speed_kmh, heading_deg, accuracy_meters, timestamp } = locationData;
    
    const locationValidation = locationRules.validateLocation(lat, lng);
    if (!locationValidation.valid) {
      throw new Error('位置验证失败: ' + locationValidation.errors.join(', '));
    }

    const previousTrajectories = db.trajectories
      .filter(t => t.order_no === orderNo)
      .sort((a, b) => b.sequence - a.sequence)
      .slice(0, 1);

    const sequence = previousTrajectories.length > 0 ? previousTrajectories[0].sequence + 1 : 1;

    let isAbnormal = 0;
    let abnormalType = null;

    if (order.dest_lat !== null && order.dest_lat !== undefined) {
      const driftCheck = locationRules.checkDrift(
        lat, lng,
        order.origin_lat, order.origin_lng,
        200
      );
    }

    const trajectoryId = generateId();
    const now = new Date().toISOString();
    db.trajectories.push({
      id: db.trajectories.length + 1,
      trajectory_id: trajectoryId,
      order_no: orderNo,
      driver_id: operatorId,
      lat,
      lng,
      speed_kmh: speed_kmh || 0,
      heading_deg: heading_deg || 0,
      accuracy_meters: accuracy_meters || 0,
      timestamp: timestamp || now,
      sequence,
      is_abnormal: isAbnormal,
      abnormal_type: abnormalType,
      created_at: now
    });

    if (isAbnormal) {
      await this.createException({
        orderNo,
        exceptionType: abnormalType,
        severity: 'MEDIUM',
        originalTrajectory: JSON.stringify({
          lat, lng, speed_kmh, heading_deg, accuracy_meters, timestamp
        }),
        assignedRole: ROLES.DISPATCHER
      });
    }

    const allTrajectories = db.trajectories
      .filter(t => t.order_no === orderNo)
      .sort((a, b) => a.sequence - b.sequence);

    if (isAbnormal) {
      await this.createTimelineEvent({
        orderNo,
        eventType: 'ABNORMAL_LOCATION',
        title: '位置异常',
        content: `检测到位置异常: ${abnormalType}，当前位置: (${lat}, ${lng})`,
        actorRole: operatorRole,
        actorId: operatorId
      });
    }

    return {
      trajectoryId,
      sequence,
      isAbnormal,
      abnormalType
    };
  },

  async getTrajectories(orderNo) {
    return db.trajectories
      .filter(t => t.order_no === orderNo)
      .sort((a, b) => a.sequence - b.sequence);
  },

  async completeNavigation(orderNo, arrivalData, operatorRole, operatorId) {
    const order = await this.getOrderByNo(orderNo);
    if (!order) throw new Error('订单不存在');

    const actionCheck = canPerformAction(order.status, 'complete_navigation', operatorRole);
    if (!actionCheck.allowed) {
      throw new Error(actionCheck.reason);
    }

    const { arrival_lat, arrival_lng, arrival_time } = arrivalData;

    const orderIndex = db.mainOrders.findIndex(o => o.order_no === orderNo);
    if (orderIndex !== -1) {
      db.mainOrders[orderIndex] = {
        ...db.mainOrders[orderIndex],
        status: ORDER_STATUSES.PENDING_TRAJECTORY,
        current_responsible_role: ROLES.DISPATCHER,
        updated_at: new Date().toISOString()
      };
    }

    await this.createOperationLog({
      orderNo,
      operatorRole,
      operatorId,
      action: 'complete_navigation',
      fromStatus: order.status,
      toStatus: ORDER_STATUSES.PENDING_TRAJECTORY,
      comment: `导航完成，到达位置: (${arrival_lat}, ${arrival_lng})`
    });

    await this.createTimelineEvent({
      orderNo,
      eventType: 'NAVIGATION_COMPLETED',
      title: '导航完成',
      content: `导航已完成，等待轨迹记录确认`,
      actorRole: operatorRole,
      actorId: operatorId
    });

    await this.createMessage({
      orderNo,
      targetRole: ROLES.DISPATCHER,
      targetId: null,
      messageType: 'TODO',
      title: '订单等待轨迹确认',
      content: `订单 ${orderNo} 导航已完成，等待轨迹记录和到达确认`,
      actionRequired: 'confirm_arrival'
    });

    return {
      orderNo,
      fromStatus: order.status,
      toStatus: ORDER_STATUSES.PENDING_TRAJECTORY,
      arrivalTime: arrival_time || new Date().toISOString()
    };
  },

  async lockPOI(orderNo, poiId, operatorRole, operatorId) {
    const poi = db.pois.find(p => p.poi_id === poiId);
    if (!poi) throw new Error('POI不存在');

    const lockCheck = poiRules.canLockPOI(poi, orderNo);
    if (!lockCheck.canLock) {
      throw new Error(lockCheck.reason);
    }

    if (poi.is_locked !== 1 || poi.locked_by_order !== orderNo) {
      const poiIndex = db.pois.findIndex(p => p.poi_id === poiId);
      if (poiIndex !== -1) {
        const now = new Date().toISOString();
        db.pois[poiIndex] = {
          ...db.pois[poiIndex],
          is_locked: 1,
          locked_by_order: orderNo,
          locked_at: now,
          updated_at: now
        };
      }

      await this.createTimelineEvent({
        orderNo,
        eventType: 'POI_LOCKED',
        title: 'POI已锁定',
        content: `POI ${poi.name} 已被订单 ${orderNo} 锁定`,
        actorRole: operatorRole,
        actorId: operatorId
      });
    }

    return {
      poiId,
      isLocked: true,
      lockedBy: orderNo
    };
  },

  async unlockPOI(orderNo, poiId, operatorRole, operatorId) {
    const poi = db.pois.find(p => p.poi_id === poiId);
    if (!poi) throw new Error('POI不存在');

    if (poi.is_locked === 1 && poi.locked_by_order === orderNo) {
      const poiIndex = db.pois.findIndex(p => p.poi_id === poiId);
      if (poiIndex !== -1) {
        db.pois[poiIndex] = {
          ...db.pois[poiIndex],
          is_locked: 0,
          locked_by_order: null,
          locked_at: null,
          updated_at: new Date().toISOString()
        };
      }

      await this.createTimelineEvent({
        orderNo,
        eventType: 'POI_UNLOCKED',
        title: 'POI已解锁',
        content: `POI ${poi.name} 已解锁`,
        actorRole: operatorRole,
        actorId: operatorId
      });
    }

    return {
      poiId,
      isLocked: false
    };
  },

  async confirmArrival(orderNo, confirmData, operatorRole, operatorId) {
    const order = await this.getOrderByNo(orderNo);
    if (!order) throw new Error('订单不存在');

    const actionCheck = canPerformAction(order.status, 'confirm_arrival', operatorRole);
    if (!actionCheck.allowed) {
      throw new Error(actionCheck.reason);
    }

    const confirmTime = confirmData.confirm_time || new Date().toISOString();

    const orderIndex = db.mainOrders.findIndex(o => o.order_no === orderNo);
    if (orderIndex !== -1) {
      db.mainOrders[orderIndex] = {
        ...db.mainOrders[orderIndex],
        status: ORDER_STATUSES.ARRIVAL_CONFIRMED,
        current_responsible_role: ROLES.OPERATOR,
        current_responsible_id: null,
        updated_at: new Date().toISOString()
      };
    }

    for (let i = 0; i < db.orderDetails.length; i++) {
      if (db.orderDetails[i].order_no === orderNo) {
        db.orderDetails[i] = {
          ...db.orderDetails[i],
          status: ORDER_STATUSES.ARRIVAL_CONFIRMED,
          arrival_time_actual: confirmTime,
          updated_at: new Date().toISOString()
        };
      }
    }

    for (let i = 0; i < db.messages.length; i++) {
      if (db.messages[i].order_no === orderNo && db.messages[i].is_read === 0) {
        db.messages[i] = {
          ...db.messages[i],
          is_read: 1,
          read_at: new Date().toISOString()
        };
      }
    }

    const lockedPOIs = db.pois.filter(p => p.locked_by_order === orderNo && p.is_locked === 1);
    for (const poi of lockedPOIs) {
      await this.unlockPOI(orderNo, poi.poi_id, operatorRole, operatorId);
    }

    await this.createOperationLog({
      orderNo,
      operatorRole,
      operatorId,
      action: 'confirm_arrival',
      fromStatus: order.status,
      toStatus: ORDER_STATUSES.ARRIVAL_CONFIRMED,
      comment: `到达确认时间: ${confirmTime}`
    });

    await this.createTimelineEvent({
      orderNo,
      eventType: 'ARRIVAL_CONFIRMED',
      title: '到达已确认',
      content: `订单 ${orderNo} 已确认到达，流程完成`,
      actorRole: operatorRole,
      actorId: operatorId
    });

    await this.createMessage({
      orderNo,
      targetRole: ROLES.USER,
      targetId: order.user_id,
      messageType: 'NOTIFICATION',
      title: '订单已完成',
      content: `您的订单 ${orderNo} 已确认到达，感谢使用服务`,
      actionRequired: null
    });

    return {
      orderNo,
      fromStatus: order.status,
      toStatus: ORDER_STATUSES.ARRIVAL_CONFIRMED,
      confirmTime
    };
  },

  async cancelOrder(orderNo, cancelReason, operatorRole, operatorId) {
    const order = await this.getOrderByNo(orderNo);
    if (!order) throw new Error('订单不存在');

    if (order.status === ORDER_STATUSES.CANCELLED || order.status === ORDER_STATUSES.ARRIVAL_CONFIRMED) {
      throw new Error('当前订单状态无法取消');
    }

    const orderIndex = db.mainOrders.findIndex(o => o.order_no === orderNo);
    if (orderIndex !== -1) {
      db.mainOrders[orderIndex] = {
        ...db.mainOrders[orderIndex],
        status: ORDER_STATUSES.CANCELLED,
        current_responsible_role: ROLES.OPERATOR,
        updated_at: new Date().toISOString()
      };
    }

    for (let i = 0; i < db.orderDetails.length; i++) {
      if (db.orderDetails[i].order_no === orderNo) {
        db.orderDetails[i] = {
          ...db.orderDetails[i],
          status: ORDER_STATUSES.CANCELLED,
          updated_at: new Date().toISOString()
        };
      }
    }

    const lockedPOIs = db.pois.filter(p => p.locked_by_order === orderNo && p.is_locked === 1);
    for (const poi of lockedPOIs) {
      await this.unlockPOI(orderNo, poi.poi_id, operatorRole, operatorId);
    }

    await this.createOperationLog({
      orderNo,
      operatorRole,
      operatorId,
      action: 'cancel_order',
      fromStatus: order.status,
      toStatus: ORDER_STATUSES.CANCELLED,
      comment: `取消原因: ${cancelReason}`
    });

    await this.createTimelineEvent({
      orderNo,
      eventType: 'ORDER_CANCELLED',
      title: '订单已取消',
      content: `取消原因: ${cancelReason}`,
      actorRole: operatorRole,
      actorId: operatorId
    });

    return {
      orderNo,
      fromStatus: order.status,
      toStatus: ORDER_STATUSES.CANCELLED,
      cancelReason
    };
  },

  async createException(exceptionData) {
    const { 
      orderNo, 
      exceptionType, 
      severity, 
      originalTrajectory,
      compensationData,
      assignedRole,
      assignedId
    } = exceptionData;

    const exceptionId = generateId();
    const now = new Date().toISOString();
    db.exceptionQueues.push({
      id: db.exceptionQueues.length + 1,
      exception_id: exceptionId,
      order_no: orderNo,
      exception_type: exceptionType,
      severity: severity || 'MEDIUM',
      status: 'PENDING',
      original_trajectory_json: originalTrajectory,
      compensation_data_json: JSON.stringify(compensationData || {}),
      retry_count: 0,
      max_retries: 3,
      assigned_role: assignedRole,
      assigned_id: assignedId,
      created_at: now,
      updated_at: now
    });

    return exceptionId;
  },

  async getExceptions(filter = {}) {
    let exceptions = [...db.exceptionQueues];

    if (filter.status) {
      exceptions = exceptions.filter(e => e.status === filter.status);
    }

    if (filter.orderNo) {
      exceptions = exceptions.filter(e => e.order_no === filter.orderNo);
    }

    exceptions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return exceptions;
  },

  async resolveException(exceptionId, resolution, targetStatus, operatorRole, operatorId) {
    const exception = db.exceptionQueues.find(e => e.exception_id === exceptionId);
    if (!exception) throw new Error('异常记录不存在');

    if (exception.status === 'RESOLVED') {
      throw new Error('该异常已被处理');
    }

    const exIndex = db.exceptionQueues.findIndex(e => e.exception_id === exceptionId);
    if (exIndex !== -1) {
      const now = new Date().toISOString();
      db.exceptionQueues[exIndex] = {
        ...db.exceptionQueues[exIndex],
        status: 'RESOLVED',
        resolved_at: now,
        resolution_comment: resolution,
        updated_at: now
      };
    }

    const orderIndex = db.mainOrders.findIndex(o => o.order_no === exception.order_no);
    if (orderIndex !== -1) {
      db.mainOrders[orderIndex] = {
        ...db.mainOrders[orderIndex],
        status: targetStatus,
        updated_at: new Date().toISOString()
      };
    }

    await this.createTimelineEvent({
      orderNo: exception.order_no,
      eventType: 'EXCEPTION_RESOLVED',
      title: '异常已解决',
      content: `异常 ${exception.exception_type} 已解决: ${resolution}`,
      actorRole: operatorRole,
      actorId: operatorId
    });

    return {
      exceptionId,
      status: 'RESOLVED',
      targetStatus
    };
  },

  async retryException(exceptionId, operatorRole, operatorId) {
    const exception = db.exceptionQueues.find(e => e.exception_id === exceptionId);
    if (!exception) throw new Error('异常记录不存在');

    if (exception.retry_count >= exception.max_retries) {
      throw new Error('已达到最大重试次数，需要手动处理');
    }

    const exIndex = db.exceptionQueues.findIndex(e => e.exception_id === exceptionId);
    if (exIndex !== -1) {
      db.exceptionQueues[exIndex] = {
        ...db.exceptionQueues[exIndex],
        retry_count: exception.retry_count + 1,
        updated_at: new Date().toISOString()
      };
    }

    const orderIndex = db.mainOrders.findIndex(o => o.order_no === exception.order_no);
    if (orderIndex !== -1) {
      db.mainOrders[orderIndex] = {
        ...db.mainOrders[orderIndex],
        status: ORDER_STATUSES.NAVIGATION_EXECUTING,
        updated_at: new Date().toISOString()
      };
    }

    await this.createTimelineEvent({
      orderNo: exception.order_no,
      eventType: 'EXCEPTION_RETRY',
      title: '异常重试',
      content: `第 ${exception.retry_count + 1} 次重试`,
      actorRole: operatorRole,
      actorId: operatorId
    });

    return {
      exceptionId,
      retryCount: exception.retry_count + 1,
      maxRetries: exception.max_retries
    };
  },

  async createMessage(messageData) {
    const { 
      orderNo, 
      targetRole, 
      targetId, 
      messageType,
      title,
      content,
      actionRequired
    } = messageData;

    const messageId = generateId();
    db.messages.push({
      id: db.messages.length + 1,
      message_id: messageId,
      order_no: orderNo,
      target_role: targetRole,
      target_id: targetId,
      message_type: messageType,
      title,
      content,
      action_required: actionRequired,
      is_read: 0,
      created_at: new Date().toISOString()
    });

    return messageId;
  },

  async getMessages(role, userId, unreadOnly = true) {
    let messages = db.messages.filter(m => m.target_role === role);

    if (userId) {
      messages = messages.filter(m => m.target_id === userId);
    }

    if (unreadOnly) {
      messages = messages.filter(m => m.is_read === 0);
    }

    messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return messages;
  },

  async markMessageRead(messageId) {
    const msgIndex = db.messages.findIndex(m => m.message_id === messageId);
    if (msgIndex !== -1) {
      db.messages[msgIndex] = {
        ...db.messages[msgIndex],
        is_read: 1,
        read_at: new Date().toISOString()
      };
    }
    return true;
  },

  async createOperationLog(logData) {
    const { 
      orderNo, 
      operatorRole, 
      operatorId, 
      action,
      fromStatus,
      toStatus,
      comment
    } = logData;

    const logId = generateId();
    db.operationLogs.push({
      id: db.operationLogs.length + 1,
      log_id: logId,
      order_no: orderNo,
      operator_role: operatorRole,
      operator_id: operatorId,
      action,
      from_status: fromStatus,
      to_status: toStatus,
      comment,
      created_at: new Date().toISOString()
    });

    return logId;
  },

  async createTimelineEvent(eventData) {
    const { 
      orderNo, 
      eventType, 
      title, 
      content,
      actorRole,
      actorId,
      attachments
    } = eventData;

    const eventId = generateId();
    db.timelineEvents.push({
      id: db.timelineEvents.length + 1,
      event_id: eventId,
      order_no: orderNo,
      event_type: eventType,
      title,
      content,
      actor_role: actorRole,
      actor_id: actorId,
      attachments_json: JSON.stringify(attachments || []),
      created_at: new Date().toISOString()
    });

    return eventId;
  },

  async getPOIs(filter = {}) {
    let pois = [...db.pois];

    if (filter.is_locked !== undefined) {
      pois = pois.filter(p => p.is_locked === (filter.is_locked ? 1 : 0));
    }

    if (filter.locked_by_order) {
      pois = pois.filter(p => p.locked_by_order === filter.locked_by_order);
    }

    pois.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return pois;
  },

  async getStatistics() {
    const totalOrders = db.mainOrders.filter(o => o.is_deleted === 0).length;

    const statusCounts = {};
    for (const order of db.mainOrders) {
      if (order.is_deleted === 0) {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      }
    }
    const statusStats = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      statusName: STATUS_DISPLAY_NAMES[status] || status,
      count
    }));

    const exceptionCounts = {};
    for (const ex of db.exceptionQueues) {
      exceptionCounts[ex.status] = (exceptionCounts[ex.status] || 0) + 1;
    }
    const exceptionStats = Object.entries(exceptionCounts).map(([status, count]) => ({
      status,
      count
    }));

    const unreadMessages = db.messages.filter(m => m.is_read === 0).length;

    return {
      totalOrders,
      statusStats,
      exceptionStats,
      unreadMessages
    };
  },

  async getReport(reportType, params = {}) {
    switch (reportType) {
      case 'order_summary':
        return await this.getOrderSummaryReport(params);
      case 'exception_analysis':
        return await this.getExceptionAnalysisReport(params);
      case 'trajectory_review':
        return await this.getTrajectoryReviewReport(params);
      default:
        throw new Error('未知的报表类型');
    }
  },

  async getOrderSummaryReport(params) {
    const { startDate, endDate, status, role } = params;
    
    let orders = db.mainOrders.filter(o => o.is_deleted === 0);

    if (startDate) {
      orders = orders.filter(o => o.created_at >= startDate);
    }
    if (endDate) {
      orders = orders.filter(o => o.created_at <= endDate + 'T23:59:59');
    }
    if (status) {
      orders = orders.filter(o => o.status === status);
    }
    if (role) {
      orders = orders.filter(o => o.user_role === role);
    }

    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return orders.map(o => {
      const trajectoryCount = db.trajectories.filter(t => t.order_no === o.order_no).length;
      const exceptionCount = db.exceptionQueues.filter(e => e.order_no === o.order_no).length;
      return {
        ...o,
        statusName: STATUS_DISPLAY_NAMES[o.status] || o.status,
        trajectory_count: trajectoryCount,
        exception_count: exceptionCount
      };
    });
  },

  async getExceptionAnalysisReport(params) {
    const { startDate, endDate, status, exceptionType } = params;
    
    let exceptions = [...db.exceptionQueues];

    if (startDate) {
      exceptions = exceptions.filter(e => e.created_at >= startDate);
    }
    if (endDate) {
      exceptions = exceptions.filter(e => e.created_at <= endDate + 'T23:59:59');
    }
    if (status) {
      exceptions = exceptions.filter(e => e.status === status);
    }
    if (exceptionType) {
      exceptions = exceptions.filter(e => e.exception_type === exceptionType);
    }

    exceptions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return exceptions.map(e => {
      const order = db.mainOrders.find(o => o.order_no === e.order_no);
      return {
        ...e,
        order_status: order ? order.status : null,
        user_role: order ? order.user_role : null,
        origin_address: order ? order.origin_address : null,
        dest_address: order ? order.dest_address : null
      };
    });
  },

  async getTrajectoryReviewReport(params) {
    const { orderNo } = params;
    
    if (!orderNo) {
      throw new Error('请指定订单号');
    }

    const trajectories = db.trajectories
      .filter(t => t.order_no === orderNo)
      .sort((a, b) => a.sequence - b.sequence);

    const order = await this.getOrderByNo(orderNo);

    return {
      order,
      trajectories,
      totalPoints: trajectories.length,
      abnormalPoints: trajectories.filter(t => t.is_abnormal === 1).length,
      timeRange: trajectories.length > 0 ? {
        start: trajectories[0].timestamp,
        end: trajectories[trajectories.length - 1].timestamp
      } : null
    };
  }
};

module.exports = orderService;
