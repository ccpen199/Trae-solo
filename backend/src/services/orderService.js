const { v4: uuidv4 } = require('uuid');
const db = require('../database/init');
const { 
  ORDER_STATUS, 
  STATUS_NAMES, 
  STATE_TRANSITIONS, 
  ACTION_TYPES,
  ROLE_NAMES,
  EXCEPTION_TYPES,
} = require('../utils/constants');
const positioningEngine = require('../engines/positioningEngine');
const routeEngine = require('../engines/routeEngine');
const poiEngine = require('../engines/poiEngine');
const etaEngine = require('../engines/etaEngine');

class OrderService {
  generateOrderNo() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `NAV${dateStr}${random}`;
  }

  createOrder(userId, orderData) {
    const orderNo = this.generateOrderNo();
    const orderId = uuidv4();

    const validation = this.validateOrderData(orderData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join('; '));
    }

    const insertOrder = db.prepare(`
      INSERT INTO navigation_orders (
        id, order_no, user_id, status,
        origin_lat, origin_lng, origin_address,
        dest_lat, dest_lng, dest_address,
        expected_arrival_time,
        assigned_driver_id, po_id,
        priority, attachments, remark,
        created_at, updated_at
      ) VALUES (@id, @orderNo, @userId, @status,
        @originLat, @originLng, @originAddress,
        @destLat, @destLng, @destAddress,
        @expectedArrivalTime,
        @assignedDriverId, @poId,
        @priority, @attachments, @remark,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const insertDetail = db.prepare(`
      INSERT INTO order_details (id, order_id, seq, status, action_type, created_at)
      VALUES (@id, @orderId, @seq, @status, @actionType, CURRENT_TIMESTAMP)
    `);

    const insertTimeAxis = db.prepare(`
      INSERT INTO time_axis (
        id, order_id, operator_id, operator_name,
        operator_role, action_type, action_name,
        status_before, status_after, remark,
        created_at
      ) VALUES (@id, @orderId, @operatorId, @operatorName,
        @operatorRole, @actionType, @actionName,
        @statusBefore, @statusAfter, @remark,
        CURRENT_TIMESTAMP)
    `);

    const transaction = db.transaction(() => {
      insertOrder.run({
        id: orderId,
        orderNo,
        userId,
        status: ORDER_STATUS.PENDING_LOCATION,
        originLat: orderData.origin_lat,
        originLng: orderData.origin_lng,
        originAddress: orderData.origin_address,
        destLat: orderData.dest_lat,
        destLng: orderData.dest_lng,
        destAddress: orderData.dest_address,
        expectedArrivalTime: orderData.expected_arrival_time,
        assignedDriverId: orderData.assigned_driver_id,
        poId: orderData.po_id,
        priority: orderData.priority || 0,
        attachments: orderData.attachments ? JSON.stringify(orderData.attachments) : null,
        remark: orderData.remark,
      });

      insertDetail.run({
        id: uuidv4(),
        orderId,
        seq: 1,
        status: 'PENDING',
        actionType: ACTION_TYPES.SUBMIT_LOCATION,
      });

      insertTimeAxis.run({
        id: uuidv4(),
        orderId,
        operatorId: userId,
        operatorName: orderData.userName || '用户',
        operatorRole: orderData.userRole || 'USER',
        actionType: ACTION_TYPES.SUBMIT_LOCATION,
        actionName: '创建订单',
        statusBefore: null,
        statusAfter: ORDER_STATUS.PENDING_LOCATION,
        remark: '订单创建成功',
      });

      if (orderData.assigned_driver_id) {
        this.createMessage(
          orderId,
          orderData.assigned_driver_id,
          'TODO',
          `您有新的导航任务待处理：订单号 ${orderNo}`
        );
      }
    });

    transaction();

    return {
      id: orderId,
      order_no: orderNo,
      status: ORDER_STATUS.PENDING_LOCATION,
      statusName: STATUS_NAMES[ORDER_STATUS.PENDING_LOCATION],
    };
  }

  validateOrderData(orderData) {
    const errors = [];

    if (!orderData.origin_address && (!orderData.origin_lat || !orderData.origin_lng)) {
      errors.push('起点地址或坐标不能为空');
    }

    if (!orderData.dest_address && (!orderData.dest_lat || !orderData.dest_lng)) {
      errors.push('终点地址或坐标不能为空');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  submitLocation(orderId, userId, locationData) {
    const getOrder = db.prepare('SELECT * FROM navigation_orders WHERE id = ?');
    const order = getOrder.get(orderId);

    if (!order) {
      throw new Error('订单不存在');
    }

    const stateConfig = STATE_TRANSITIONS[order.status];
    if (!stateConfig.allowedActions.includes(ACTION_TYPES.SUBMIT_LOCATION)) {
      throw new Error(`当前状态不允许提交位置: ${STATUS_NAMES[order.status]}`);
    }

    const location = {
      lat: locationData.origin_lat || order.origin_lat,
      lng: locationData.origin_lng || order.origin_lng,
      accuracy: locationData.accuracy,
    };

    const locationValidation = positioningEngine.validateLocation(location);
    if (!locationValidation.isValid) {
      throw new Error(`位置验证失败: ${locationValidation.issues.join('; ')}`);
    }

    if (locationValidation.isDrift) {
      this.createException(
        orderId,
        EXCEPTION_TYPES.LOCATION_DRIFT,
        '定位漂移检测',
        JSON.stringify({ location, corrections: locationValidation.corrections })
      );
    }

    const updateOrder = db.prepare(`
      UPDATE navigation_orders SET
        status = @status,
        origin_lat = @originLat,
        origin_lng = @originLng,
        origin_address = @originAddress,
        dest_lat = @destLat,
        dest_lng = @destLng,
        dest_address = @destAddress,
        current_lat = @currentLat,
        current_lng = @currentLng,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @orderId
    `);

    const insertDetail = db.prepare(`
      INSERT INTO order_details (id, order_id, seq, status, action_type, created_at)
      VALUES (@id, @orderId, @seq, @status, @actionType, CURRENT_TIMESTAMP)
    `);

    const transaction = db.transaction(() => {
      const newStatus = ORDER_STATUS.PENDING_ROUTE_PLAN;

      updateOrder.run({
        status: newStatus,
        originLat: locationData.origin_lat || order.origin_lat,
        originLng: locationData.origin_lng || order.origin_lng,
        originAddress: locationData.origin_address || order.origin_address,
        destLat: locationData.dest_lat || order.dest_lat,
        destLng: locationData.dest_lng || order.dest_lng,
        destAddress: locationData.dest_address || order.dest_address,
        currentLat: locationData.origin_lat || order.origin_lat,
        currentLng: locationData.origin_lng || order.origin_lng,
        orderId,
      });

      this.updateOrderDetail(orderId, 1, 'COMPLETED', userId, locationData.userRole);

      insertDetail.run({
        id: uuidv4(),
        orderId,
        seq: 2,
        status: 'PENDING',
        actionType: ACTION_TYPES.APPROVE_ROUTE,
      });

      this.addTimeAxis({
        orderId,
        operatorId: userId,
        operatorName: locationData.userName || '用户',
        operatorRole: locationData.userRole || 'USER',
        actionType: ACTION_TYPES.SUBMIT_LOCATION,
        actionName: '提交位置信息',
        statusBefore: order.status,
        statusAfter: newStatus,
        remark: locationData.remark || '位置信息提交完成',
      });

      if (order.assigned_driver_id) {
        this.createMessage(
          orderId,
          order.assigned_driver_id,
          'TODO',
          `订单 ${order.order_no} 位置已确认，等待路线规划`
        );
      }
    });

    transaction();

    return {
      id: orderId,
      status: ORDER_STATUS.PENDING_ROUTE_PLAN,
      statusName: STATUS_NAMES[ORDER_STATUS.PENDING_ROUTE_PLAN],
      locationValidation,
    };
  }

  planRoute(orderId, userId, routeOptions) {
    const getOrder = db.prepare('SELECT * FROM navigation_orders WHERE id = ?');
    const order = getOrder.get(orderId);

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== ORDER_STATUS.PENDING_ROUTE_PLAN && 
        order.status !== ORDER_STATUS.NAVIGATING) {
      throw new Error(`当前状态不允许路线规划: ${STATUS_NAMES[order.status]}`);
    }

    const origin = { lat: order.origin_lat, lng: order.origin_lng };
    const destination = { lat: order.dest_lat, lng: order.dest_lng };

    const routeResult = routeEngine.calculateRoutes(origin, destination, {
      routeTypes: routeOptions.routeTypes,
    });

    const deleteOldRoutes = db.prepare('DELETE FROM routes WHERE order_id = ?');
    const insertRoute = db.prepare(`
      INSERT INTO routes (
        id, order_id, route_type, waypoints,
        distance, duration, polyline, is_selected,
        created_at
      ) VALUES (@id, @orderId, @routeType, @waypoints,
        @distance, @duration, @polyline, @isSelected,
        CURRENT_TIMESTAMP)
    `);
    const updateOrder = db.prepare(`
      UPDATE navigation_orders SET
        route_distance = @distance,
        route_duration = @duration,
        eta_seconds = @eta,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @orderId
    `);

    const transaction = db.transaction(() => {
      deleteOldRoutes.run(orderId);

      routeResult.routes.forEach((route, index) => {
        insertRoute.run({
          id: uuidv4(),
          orderId,
          routeType: route.routeType,
          waypoints: JSON.stringify(route.waypoints),
          distance: route.distance,
          duration: route.duration,
          polyline: route.polyline,
          isSelected: index === 0 ? 1 : 0,
        });
      });

      const recommendedRoute = routeResult.routes[0];
      updateOrder.run({
        distance: recommendedRoute.distance,
        duration: recommendedRoute.duration,
        eta: recommendedRoute.eta,
        orderId,
      });

      this.addTimeAxis({
        orderId,
        operatorId: userId,
        operatorName: routeOptions.userName || '系统',
        operatorRole: routeOptions.userRole || 'SYSTEM',
        actionType: 'ROUTE_PLAN',
        actionName: '路线规划',
        statusBefore: order.status,
        statusAfter: order.status,
        remark: `已规划 ${routeResult.routes.length} 条路线，推荐路线距离 ${recommendedRoute.distance}m，预计 ${recommendedRoute.duration}秒`,
      });
    });

    transaction();

    return {
      orderId,
      routes: routeResult.routes,
      recommended: routeResult.recommended,
      totalRoutes: routeResult.totalRoutes,
    };
  }

  approveRoute(orderId, userId, approvalData) {
    const getOrder = db.prepare('SELECT * FROM navigation_orders WHERE id = ?');
    const order = getOrder.get(orderId);

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== ORDER_STATUS.PENDING_ROUTE_PLAN) {
      throw new Error(`当前状态不允许审批路线: ${STATUS_NAMES[order.status]}`);
    }

    const getRoutes = db.prepare('SELECT * FROM routes WHERE order_id = ? ORDER BY is_selected DESC, created_at');
    const routes = getRoutes.all(orderId);

    const selectedRoute = routes.find(r => r.is_selected === 1) || routes[0];
    if (!selectedRoute) {
      throw new Error('没有可用路线数据');
    }

    const updateOrder = db.prepare(`
      UPDATE navigation_orders SET
        status = @status,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @orderId
    `);

    const insertDetail = db.prepare(`
      INSERT INTO order_details (id, order_id, seq, status, action_type, created_at)
      VALUES (@id, @orderId, @seq, @status, @actionType, CURRENT_TIMESTAMP)
    `);

    const transaction = db.transaction(() => {
      const newStatus = ORDER_STATUS.NAVIGATING;

      updateOrder.run({
        status: newStatus,
        orderId,
      });

      this.updateOrderDetail(orderId, 2, 'COMPLETED', userId, approvalData.userRole);

      insertDetail.run({
        id: uuidv4(),
        orderId,
        seq: 3,
        status: 'IN_PROGRESS',
        actionType: ACTION_TYPES.START_NAVIGATION,
      });

      this.addTimeAxis({
        orderId,
        operatorId: userId,
        operatorName: approvalData.userName || '调度员',
        operatorRole: approvalData.userRole || 'DISPATCHER',
        actionType: ACTION_TYPES.APPROVE_ROUTE,
        actionName: '审批通过',
        statusBefore: order.status,
        statusAfter: newStatus,
        remark: approvalData.remark || '路线规划完成，进入导航执行阶段',
      });

      if (order.assigned_driver_id) {
        this.createMessage(
          orderId,
          order.assigned_driver_id,
          'TODO',
          `订单 ${order.order_no} 路线已规划，您可以开始导航`
        );
      }
    });

    transaction();

    return {
      id: orderId,
      status: ORDER_STATUS.NAVIGATING,
      statusName: STATUS_NAMES[ORDER_STATUS.NAVIGATING],
      selectedRoute,
    };
  }

  rejectRoute(orderId, userId, rejectionData) {
    const getOrder = db.prepare('SELECT * FROM navigation_orders WHERE id = ?');
    const order = getOrder.get(orderId);

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== ORDER_STATUS.PENDING_ROUTE_PLAN) {
      throw new Error(`当前状态不允许驳回: ${STATUS_NAMES[order.status]}`);
    }

    this.addTimeAxis({
      orderId,
      operatorId: userId,
      operatorName: rejectionData.userName || '调度员',
      operatorRole: rejectionData.userRole || 'DISPATCHER',
      actionType: ACTION_TYPES.REJECT_ROUTE,
      actionName: '驳回路线',
      statusBefore: order.status,
      statusAfter: ORDER_STATUS.PENDING_LOCATION,
      remark: rejectionData.remark || '路线被驳回，请重新提交位置',
    });

    this.createMessage(
      orderId,
      order.user_id,
      'WARNING',
      `订单 ${order.order_no} 路线被驳回：${rejectionData.remark || '请重新提交位置信息'}`
    );

    return {
      id: orderId,
      status: ORDER_STATUS.PENDING_LOCATION,
      statusName: STATUS_NAMES[ORDER_STATUS.PENDING_LOCATION],
      rejected: true,
    };
  }

  startNavigation(orderId, userId, navigationData) {
    const getOrder = db.prepare('SELECT * FROM navigation_orders WHERE id = ?');
    const order = getOrder.get(orderId);

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== ORDER_STATUS.NAVIGATING) {
      throw new Error(`当前状态不允许开始导航: ${STATUS_NAMES[order.status]}`);
    }

    const getRoute = db.prepare('SELECT * FROM routes WHERE order_id = ? AND is_selected = 1');
    const selectedRoute = getRoute.get(orderId);

    if (!selectedRoute) {
      throw new Error('没有选中的路线数据');
    }

    const waypoints = JSON.parse(selectedRoute.waypoints || '[]');
    const currentLocation = waypoints[0] || { lat: order.origin_lat, lng: order.origin_lng };

    const eta = etaEngine.calculateETA(
      currentLocation,
      { lat: order.dest_lat, lng: order.dest_lng },
      { routeType: selectedRoute.route_type }
    );

    this.addTimeAxis({
      orderId,
      operatorId: userId,
      operatorName: navigationData.userName || '司机',
      operatorRole: navigationData.userRole || 'DRIVER',
      actionType: ACTION_TYPES.START_NAVIGATION,
      actionName: '开始导航',
      statusBefore: order.status,
      statusAfter: order.status,
      remark: `导航已开始，预计 ${eta.etaText}，距离 ${eta.distanceText}`,
    });

    return {
      id: orderId,
      status: order.status,
      statusName: STATUS_NAMES[order.status],
      eta,
      route: selectedRoute,
    };
  }

  submitTrack(orderId, userId, trackData) {
    const getOrder = db.prepare('SELECT * FROM navigation_orders WHERE id = ?');
    const order = getOrder.get(orderId);

    if (!order) {
      throw new Error('订单不存在');
    }

    const validStatuses = [ORDER_STATUS.NAVIGATING, ORDER_STATUS.PENDING_TRACK_RECORD];
    if (!validStatuses.includes(order.status)) {
      throw new Error(`当前状态不允许提交轨迹: ${STATUS_NAMES[order.status]}`);
    }

    const getRoute = db.prepare('SELECT * FROM routes WHERE order_id = ? AND is_selected = 1');
    const selectedRoute = getRoute.get(orderId);

    const waypoints = selectedRoute ? JSON.parse(selectedRoute.waypoints || '[]') : [];

    const location = {
      lat: trackData.lat,
      lng: trackData.lng,
      accuracy: trackData.accuracy,
      timestamp: trackData.timestamp || new Date().toISOString(),
    };

    const getPrevTrack = db.prepare('SELECT * FROM tracks WHERE order_id = ? ORDER BY created_at DESC LIMIT 1');
    const prevTrack = getPrevTrack.get(orderId);

    const locationValidation = positioningEngine.validateLocation(
      location,
      prevTrack ? {
        lat: prevTrack.lat,
        lng: prevTrack.lng,
        timestamp: prevTrack.timestamp,
      } : null
    );

    let isDeviating = false;
    if (waypoints.length > 0) {
      const deviationCheck = routeEngine.checkRouteDeviation(location, waypoints);
      isDeviating = deviationCheck.isDeviating;

      if (isDeviating) {
        this.createException(
          orderId,
          EXCEPTION_TYPES.ROUTE_DEVIATION,
          '路线偏离检测',
          JSON.stringify({ location, deviationCheck })
        );
      }
    }

    const insertTrack = db.prepare(`
      INSERT INTO tracks (
        id, order_id, lat, lng, accuracy,
        speed, bearing, timestamp, is_drift,
        source, created_at
      ) VALUES (@id, @orderId, @lat, @lng, @accuracy,
        @speed, @bearing, @timestamp, @isDrift,
        @source, CURRENT_TIMESTAMP)
    `);

    const updateOrder = db.prepare(`
      UPDATE navigation_orders SET
        current_lat = @lat,
        current_lng = @lng,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @orderId
    `);

    const transaction = db.transaction(() => {
      insertTrack.run({
        id: uuidv4(),
        orderId,
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
        speed: trackData.speed,
        bearing: trackData.bearing,
        timestamp: location.timestamp,
        isDrift: locationValidation.isDrift ? 1 : 0,
        source: trackData.source || 'GPS',
      });

      updateOrder.run({
        lat: location.lat,
        lng: location.lng,
        orderId,
      });

      if (order.status === ORDER_STATUS.NAVIGATING) {
        const updateDetail = db.prepare(`
          UPDATE order_details SET
            status = 'IN_PROGRESS'
          WHERE order_id = ? AND seq = 3
        `);
        updateDetail.run(orderId);
      }
    });

    transaction();

    return {
      orderId,
      trackId: uuidv4(),
      locationValidation,
      isDeviating,
    };
  }

  confirmArrival(orderId, userId, arrivalData) {
    const getOrder = db.prepare('SELECT * FROM navigation_orders WHERE id = ?');
    const order = getOrder.get(orderId);

    if (!order) {
      throw new Error('订单不存在');
    }

    const validStatuses = [ORDER_STATUS.NAVIGATING, ORDER_STATUS.PENDING_TRACK_RECORD];
    if (!validStatuses.includes(order.status)) {
      throw new Error(`当前状态不允许确认到达: ${STATUS_NAMES[order.status]}`);
    }

    const destination = {
      lat: order.dest_lat,
      lng: order.dest_lng,
    };

    const currentLocation = arrivalData.currentLocation || {
      lat: order.current_lat || order.dest_lat,
      lng: order.current_lng || order.dest_lng,
    };

    const arrivalCheck = etaEngine.checkGeofenceArrival(
      currentLocation,
      destination,
      arrivalData.geofenceRadius || 100
    );

    if (!arrivalCheck.isArrived && !arrivalData.forceConfirm) {
      throw new Error(
        `距离目的地尚有 ${arrivalCheck.distanceToDestination}米，未到达目的地范围(${arrivalCheck.geofenceRadius}米内)`
      );
    }

    const getLockedPOIs = db.prepare('SELECT * FROM pois WHERE is_locked = 1 AND lock_order_id = ?');
    const lockedPOIs = getLockedPOIs.all(orderId);

    const updateOrder = db.prepare(`
      UPDATE navigation_orders SET
        status = @status,
        actual_arrival_time = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @orderId
    `);

    const updateDetails = db.prepare(`
      UPDATE order_details SET
        status = 'COMPLETED'
      WHERE order_id = ?
    `);

    const unlockPOI = db.prepare(`
      UPDATE pois SET
        is_locked = 0,
        lock_order_id = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE lock_order_id = ?
    `);

    const updateMessages = db.prepare(`
      UPDATE messages SET
        is_read = 1,
        read_at = CURRENT_TIMESTAMP
      WHERE order_id = ? AND message_type = 'TODO'
    `);

    const transaction = db.transaction(() => {
      const newStatus = ORDER_STATUS.ARRIVED;

      updateOrder.run({
        status: newStatus,
        orderId,
      });

      updateDetails.run(orderId);

      if (lockedPOIs.length > 0) {
        unlockPOI.run(orderId);
      }

      this.addTimeAxis({
        orderId,
        operatorId: userId,
        operatorName: arrivalData.userName || '司机',
        operatorRole: arrivalData.userRole || 'DRIVER',
        actionType: ACTION_TYPES.CONFIRM_ARRIVAL,
        actionName: '确认到达',
        statusBefore: order.status,
        statusAfter: newStatus,
        remark: arrivalData.remark || `已到达目的地，距离 ${arrivalCheck.distanceToDestination}米`,
      });

      updateMessages.run(orderId);

      this.createMessage(
        orderId,
        order.user_id,
        'NOTIFICATION',
        `订单 ${order.order_no} 已确认到达`
      );
    });

    transaction();

    return {
      id: orderId,
      status: ORDER_STATUS.ARRIVED,
      statusName: STATUS_NAMES[ORDER_STATUS.ARRIVED],
      arrivalCheck,
    };
  }

  cancelOrder(orderId, userId, cancelData) {
    const getOrder = db.prepare('SELECT * FROM navigation_orders WHERE id = ?');
    const order = getOrder.get(orderId);

    if (!order) {
      throw new Error('订单不存在');
    }

    const terminalStatuses = [ORDER_STATUS.ARRIVED, ORDER_STATUS.CANCELLED];
    if (terminalStatuses.includes(order.status)) {
      throw new Error(`订单已结束状态不允许取消: ${STATUS_NAMES[order.status]}`);
    }

    const updateOrder = db.prepare(`
      UPDATE navigation_orders SET
        status = @status,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @orderId
    `);

    const unlockPOI = db.prepare(`
      UPDATE pois SET
        is_locked = 0,
        lock_order_id = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE lock_order_id = ?
    `);

    const updateMessages = db.prepare(`
      UPDATE messages SET
        is_read = 1,
        read_at = CURRENT_TIMESTAMP
      WHERE order_id = ? AND message_type = 'TODO'
    `);

    const transaction = db.transaction(() => {
      const newStatus = ORDER_STATUS.CANCELLED;

      updateOrder.run({
        status: newStatus,
        orderId,
      });

      unlockPOI.run(orderId);

      this.addTimeAxis({
        orderId,
        operatorId: userId,
        operatorName: cancelData.userName || '用户',
        operatorRole: cancelData.userRole || 'USER',
        actionType: ACTION_TYPES.CANCEL_ORDER,
        actionName: '取消订单',
        statusBefore: order.status,
        statusAfter: newStatus,
        remark: cancelData.remark || '订单已取消',
      });

      updateMessages.run(orderId);
    });

    transaction();

    return {
      id: orderId,
      status: ORDER_STATUS.CANCELLED,
      statusName: STATUS_NAMES[ORDER_STATUS.CANCELLED],
    };
  }

  updateOrderDetail(orderId, seq, status, operatorId, operatorRole) {
    const updateStmt = db.prepare(`
      UPDATE order_details SET
        status = @status,
        operator_id = @operatorId,
        operator_role = @operatorRole,
        action_time = CURRENT_TIMESTAMP
      WHERE order_id = @orderId AND seq = @seq
    `);
    updateStmt.run({
      status,
      operatorId,
      operatorRole,
      orderId,
      seq,
    });
  }

  addTimeAxis(data) {
    const insertStmt = db.prepare(`
      INSERT INTO time_axis (
        id, order_id, operator_id, operator_name,
        operator_role, action_type, action_name,
        status_before, status_after, remark,
        attachments, created_at
      ) VALUES (@id, @orderId, @operatorId, @operatorName,
        @operatorRole, @actionType, @actionName,
        @statusBefore, @statusAfter, @remark,
        @attachments, CURRENT_TIMESTAMP)
    `);
    insertStmt.run({
      id: uuidv4(),
      orderId: data.orderId,
      operatorId: data.operatorId,
      operatorName: data.operatorName,
      operatorRole: data.operatorRole,
      actionType: data.actionType,
      actionName: data.actionName,
      statusBefore: data.statusBefore,
      statusAfter: data.statusAfter,
      remark: data.remark,
      attachments: data.attachments ? JSON.stringify(data.attachments) : null,
    });
  }

  createMessage(orderId, userId, messageType, content) {
    const insertStmt = db.prepare(`
      INSERT INTO messages (
        id, order_id, user_id, message_type, content,
        is_read, created_at
      ) VALUES (@id, @orderId, @userId, @messageType, @content,
        0, CURRENT_TIMESTAMP)
    `);
    insertStmt.run({
      id: uuidv4(),
      orderId,
      userId,
      messageType,
      content,
    });
  }

  createException(orderId, exceptionType, message, originalData) {
    const insertStmt = db.prepare(`
      INSERT INTO exception_queue (
        id, order_id, exception_type, exception_message,
        original_data, retry_count, max_retry, status,
        next_retry_at, created_at
      ) VALUES (@id, @orderId, @exceptionType, @exceptionMessage,
        @originalData, 0, 3, 'PENDING',
        DATETIME(CURRENT_TIMESTAMP, '+5 minutes'), CURRENT_TIMESTAMP)
    `);
    insertStmt.run({
      id: uuidv4(),
      orderId,
      exceptionType,
      exceptionMessage: message,
      originalData,
    });
  }

  getOrderById(orderId) {
    const getOrder = db.prepare('SELECT * FROM navigation_orders WHERE id = ?');
    const order = getOrder.get(orderId);

    if (!order) {
      throw new Error('订单不存在');
    }

    const getDetails = db.prepare('SELECT * FROM order_details WHERE order_id = ? ORDER BY seq');
    const details = getDetails.all(orderId);

    const getTimeAxis = db.prepare('SELECT * FROM time_axis WHERE order_id = ? ORDER BY created_at');
    const timeAxis = getTimeAxis.all(orderId);

    const getRoutes = db.prepare('SELECT * FROM routes WHERE order_id = ? ORDER BY is_selected DESC');
    const routes = getRoutes.all(orderId);

    const getTracks = db.prepare('SELECT * FROM tracks WHERE order_id = ? ORDER BY created_at');
    const tracks = getTracks.all(orderId);

    return {
      ...order,
      statusName: STATUS_NAMES[order.status],
      details,
      timeAxis,
      routes,
      tracks,
    };
  }

  getOrders(filters = {}, pagination = { page: 1, pageSize: 20 }) {
    let whereClauses = [];
    let params = {};

    if (filters.status) {
      whereClauses.push('status = @status');
      params.status = filters.status;
    }

    if (filters.user_id) {
      whereClauses.push('user_id = @userId');
      params.userId = filters.user_id;
    }

    if (filters.assigned_driver_id) {
      whereClauses.push('assigned_driver_id = @assignedDriverId');
      params.assignedDriverId = filters.assigned_driver_id;
    }

    if (filters.order_no) {
      whereClauses.push('order_no LIKE @orderNo');
      params.orderNo = `%${filters.order_no}%`;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM navigation_orders ${whereSql}`;
    const countStmt = db.prepare(countSql);
    const countResult = countStmt.get(params);

    const offset = (pagination.page - 1) * pagination.pageSize;
    const limit = pagination.pageSize;

    const selectSql = `SELECT * FROM navigation_orders ${whereSql} ORDER BY created_at DESC LIMIT @limit OFFSET @offset`;
    const selectStmt = db.prepare(selectSql);
    const orders = selectStmt.all({ ...params, limit, offset });

    const ordersWithNames = orders.map(order => ({
      ...order,
      statusName: STATUS_NAMES[order.status],
    }));

    return {
      total: countResult.total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(countResult.total / pagination.pageSize),
      data: ordersWithNames,
    };
  }
}

module.exports = new OrderService();
