const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { ORDER_STATUSES, STATUS_NAMES, validateTransition } = require('../utils/orderStatus');
const priceIndex = require('../engines/PriceIndex');
const lbsPickUp = require('../engines/LBSPickUp');
const greenCredit = require('../engines/GreenCredit');
const carbonModel = require('../engines/CarbonModel');

function generateOrderNo() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RC${year}${month}${day}${random}`;
}

function logOrderStatus(orderId, fromStatus, toStatus, operatorId, operatorRole, reason = '', metadata = {}) {
  return new Promise((resolve, reject) => {
    const logId = uuidv4();
    db.run(
      `INSERT INTO order_status_logs (id, order_id, from_status, to_status, operator_id, operator_role, reason, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [logId, orderId, fromStatus, toStatus, operatorId, operatorRole, reason, JSON.stringify(metadata)],
      function(err) {
        if (err) return reject(err);
        resolve({ id: logId, orderId, fromStatus, toStatus });
      }
    );
  });
}

function logAudit(userId, userRole, action, resourceType, resourceId, details = {}) {
  return new Promise((resolve, reject) => {
    const auditId = uuidv4();
    db.run(
      `INSERT INTO audit_logs (id, user_id, user_role, action, resource_type, resource_id, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [auditId, userId, userRole, action, resourceType, resourceId, JSON.stringify(details)],
      function(err) {
        if (err) return reject(err);
        resolve({ id: auditId });
      }
    );
  });
}

router.post('/create', authMiddleware, roleMiddleware('resident'), async (req, res) => {
  try {
    const { category, sub_category, latitude, longitude, address, appointment_time } = req.body;
    const residentId = req.user.id;

    if (!category || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: '品类和位置信息为必填项' });
    }

    const orderId = uuidv4();
    const orderNo = generateOrderNo();
    const qrCode = `QR-${orderNo}-${Math.random().toString(36).substring(2, 6)}`;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      db.run(
        `INSERT INTO orders 
         (id, order_no, resident_id, status, category, sub_category, 
          resident_latitude, resident_longitude, address, appointment_time, qr_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, orderNo, residentId, ORDER_STATUSES.PENDING_PICKUP, category, sub_category || null,
         latitude, longitude, address, appointment_time || null, qrCode],
        async function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ success: false, message: '创建订单失败', error: err.message });
          }

          await logOrderStatus(orderId, null, ORDER_STATUSES.PENDING_PICKUP, residentId, 'resident', '居民创建订单');
          await logAudit(residentId, 'resident', 'CREATE_ORDER', 'order', orderId, { orderNo, category });

          const nearbyRiders = await lbsPickUp.findNearbyRiders(latitude, longitude);

          db.run('COMMIT', (commitErr) => {
            if (commitErr) {
              db.run('ROLLBACK');
              return res.status(500).json({ success: false, message: '事务提交失败' });
            }

            res.json({
              success: true,
              message: '订单创建成功',
              data: {
                order_id: orderId,
                order_no: orderNo,
                status: ORDER_STATUSES.PENDING_PICKUP,
                status_name: STATUS_NAMES[ORDER_STATUSES.PENDING_PICKUP],
                qr_code: qrCode,
                nearby_riders_count: nearbyRiders.length
              }
            });
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
});

router.get('/nearby', authMiddleware, roleMiddleware('rider'), async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;
    const riderId = req.user.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: '位置信息为必填项' });
    }

    db.all(
      `SELECT o.*, u.name as resident_name, u.phone as resident_phone
       FROM orders o
       JOIN users u ON o.resident_id = u.id
       WHERE o.status = ?`,
      [ORDER_STATUSES.PENDING_PICKUP],
      async (err, orders) => {
        if (err) {
          return res.status(500).json({ success: false, message: '查询订单失败', error: err.message });
        }

        const radiusKm = parseFloat(radius) || 10.0;
        const ordersWithDistance = orders
          .map(order => {
            const distance = lbsPickUp.calculateDistance(
              parseFloat(latitude), parseFloat(longitude),
              order.resident_latitude, order.resident_longitude
            );
            return { ...order, distance_km: distance, status_name: STATUS_NAMES[order.status] };
          })
          .filter(order => order.distance_km <= radiusKm)
          .sort((a, b) => a.distance_km - b.distance_km);

        res.json({
          success: true,
          data: ordersWithDistance
        });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
});

router.post('/:orderId/accept', authMiddleware, roleMiddleware('rider'), async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const riderId = req.user.id;

    db.get('SELECT * FROM orders WHERE id = ?', [orderId], async (err, order) => {
      if (err) {
        return res.status(500).json({ success: false, message: '查询订单失败', error: err.message });
      }

      if (!order) {
        return res.status(404).json({ success: false, message: '订单不存在' });
      }

      const validation = validateTransition(order.status, ORDER_STATUSES.RIDER_ACCEPTED, 'rider');
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.reason });
      }

      if (order.rider_id && order.rider_id !== riderId) {
        return res.status(400).json({ success: false, message: '该订单已被其他骑手接单' });
      }

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
          `UPDATE orders SET rider_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [riderId, ORDER_STATUSES.RIDER_ACCEPTED, orderId],
          async function(err) {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ success: false, message: '接单失败', error: err.message });
            }

            await logOrderStatus(orderId, order.status, ORDER_STATUSES.RIDER_ACCEPTED, riderId, 'rider', '骑手接单');
            await logAudit(riderId, 'rider', 'ACCEPT_ORDER', 'order', orderId, { orderNo: order.order_no });

            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                db.run('ROLLBACK');
                return res.status(500).json({ success: false, message: '事务提交失败' });
              }

              res.json({
                success: true,
                message: '接单成功',
                data: {
                  order_id: orderId,
                  status: ORDER_STATUSES.RIDER_ACCEPTED,
                  status_name: STATUS_NAMES[ORDER_STATUSES.RIDER_ACCEPTED]
                }
              });
            });
          }
        );
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
});

router.post('/:orderId/update-status', authMiddleware, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { new_status, reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!new_status) {
      return res.status(400).json({ success: false, message: '新状态为必填项' });
    }

    db.get('SELECT * FROM orders WHERE id = ?', [orderId], async (err, order) => {
      if (err) {
        return res.status(500).json({ success: false, message: '查询订单失败', error: err.message });
      }

      if (!order) {
        return res.status(404).json({ success: false, message: '订单不存在' });
      }

      if (userRole === 'rider' && order.rider_id !== userId) {
        return res.status(403).json({ success: false, message: '无权限操作此订单' });
      }

      if (userRole === 'resident' && order.resident_id !== userId) {
        return res.status(403).json({ success: false, message: '无权限操作此订单' });
      }

      const validation = validateTransition(order.status, new_status, userRole);
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.reason });
      }

      const updateFields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
      const updateValues = [new_status];

      if (new_status === ORDER_STATUSES.ON_THE_WAY) {
        updateFields.push('pickup_time = CURRENT_TIMESTAMP');
      } else if (new_status === ORDER_STATUSES.ARRIVED) {
        updateFields.push('arrival_time = CURRENT_TIMESTAMP');
      } else if (new_status === ORDER_STATUSES.CENTER_RECEIVED) {
        updateFields.push('center_receipt_time = CURRENT_TIMESTAMP');
      }

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
          `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
          [...updateValues, orderId],
          async function(err) {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ success: false, message: '更新订单状态失败', error: err.message });
            }

            await logOrderStatus(orderId, order.status, new_status, userId, userRole, reason || '状态更新');
            await logAudit(userId, userRole, 'UPDATE_ORDER_STATUS', 'order', orderId, {
              fromStatus: order.status,
              toStatus: new_status
            });

            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                db.run('ROLLBACK');
                return res.status(500).json({ success: false, message: '事务提交失败' });
              }

              res.json({
                success: true,
                message: '状态更新成功',
                data: {
                  order_id: orderId,
                  previous_status: order.status,
                  current_status: new_status,
                  status_name: STATUS_NAMES[new_status]
                }
              });
            });
          }
        );
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
});

router.post('/:orderId/weigh', authMiddleware, roleMiddleware('rider'), async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { weight, sub_category } = req.body;
    const riderId = req.user.id;

    if (!weight || weight <= 0) {
      return res.status(400).json({ success: false, message: '请输入有效的重量' });
    }

    db.get('SELECT * FROM orders WHERE id = ?', [orderId], async (err, order) => {
      if (err) {
        return res.status(500).json({ success: false, message: '查询订单失败', error: err.message });
      }

      if (!order) {
        return res.status(404).json({ success: false, message: '订单不存在' });
      }

      if (order.rider_id !== riderId) {
        return res.status(403).json({ success: false, message: '无权限操作此订单' });
      }

      const validStatuses = [ORDER_STATUSES.ARRIVED, ORDER_STATUSES.WEIGHING];
      if (!validStatuses.includes(order.status)) {
        return res.status(400).json({ success: false, message: '当前订单状态不可称重' });
      }

      const category = order.category;
      const subCategory = sub_category || order.sub_category;

      try {
        const priceResult = await priceIndex.calculateTotal(category, subCategory, weight);
        const creditAmount = greenCredit.calculateCredit(category, weight);
        const carbonReduction = carbonModel.calculateCarbonReduction(category, weight);

        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          db.run(
            `UPDATE orders 
             SET weight = ?, unit_price = ?, total_amount = ?, 
                 green_credit_earned = ?, carbon_reduction = ?,
                 status = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [weight, priceResult.unit_price, priceResult.total_amount,
             creditAmount, carbonReduction, ORDER_STATUSES.WEIGHED, orderId],
            async function(err) {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ success: false, message: '更新订单失败', error: err.message });
              }

              await logOrderStatus(orderId, order.status, ORDER_STATUSES.WEIGHED, riderId, 'rider', `称重完成，重量: ${weight}kg`);
              await logAudit(riderId, 'rider', 'WEIGH_ORDER', 'order', orderId, {
                weight,
                unitPrice: priceResult.unit_price,
                totalAmount: priceResult.total_amount
              });

              db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ success: false, message: '事务提交失败' });
                }

                res.json({
                  success: true,
                  message: '称重完成',
                  data: {
                    order_id: orderId,
                    weight,
                    unit_price: priceResult.unit_price,
                    total_amount: priceResult.total_amount,
                    green_credit_earned: creditAmount,
                    carbon_reduction: carbonReduction,
                    status: ORDER_STATUSES.WEIGHED,
                    status_name: STATUS_NAMES[ORDER_STATUSES.WEIGHED]
                  }
                });
              });
            }
          );
        });
      } catch (calcErr) {
        res.status(400).json({ success: false, message: calcErr.message });
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
});

router.post('/:orderId/complete-credit', authMiddleware, roleMiddleware('rider'), async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const riderId = req.user.id;

    db.get('SELECT * FROM orders WHERE id = ?', [orderId], async (err, order) => {
      if (err) {
        return res.status(500).json({ success: false, message: '查询订单失败', error: err.message });
      }

      if (!order) {
        return res.status(404).json({ success: false, message: '订单不存在' });
      }

      if (order.rider_id !== riderId) {
        return res.status(403).json({ success: false, message: '无权限操作此订单' });
      }

      if (order.status !== ORDER_STATUSES.WEIGHED) {
        return res.status(400).json({ success: false, message: '当前订单状态不可发放积分' });
      }

      if (!order.weight || !order.green_credit_earned) {
        return res.status(400).json({ success: false, message: '订单称重信息不完整' });
      }

      try {
        const creditResult = await greenCredit.processOrderCredit(
          orderId, order.resident_id, order.category, order.weight
        );

        const carbonResult = await carbonModel.recordCarbonReduction(
          order.resident_id, orderId, order.category, order.weight
        );

        db.run(
          `UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [ORDER_STATUSES.IN_TRANSIT, orderId],
          async function(err) {
            if (err) {
              return res.status(500).json({ success: false, message: '更新订单状态失败', error: err.message });
            }

            await logOrderStatus(orderId, ORDER_STATUSES.WEIGHED, ORDER_STATUSES.IN_TRANSIT, riderId, 'rider', '积分已发放，运往集散中心');
            await logAudit(riderId, 'rider', 'RELEASE_CREDIT', 'order', orderId, {
              creditAmount: order.green_credit_earned,
              carbonReduction: order.carbon_reduction
            });

            res.json({
              success: true,
              message: '积分已发放至居民账户',
              data: {
                order_id: orderId,
                credit_released: creditResult.amount,
                carbon_reduction_recorded: carbonResult.carbon_reduction,
                status: ORDER_STATUSES.IN_TRANSIT,
                status_name: STATUS_NAMES[ORDER_STATUSES.IN_TRANSIT]
              }
            });
          }
        );
      } catch (processErr) {
        res.status(500).json({ success: false, message: '处理积分失败', error: processErr.message });
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
});

router.post('/:orderId/receive', authMiddleware, roleMiddleware('center'), async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { receipt_weight, center_id } = req.body;
    const centerManagerId = req.user.id;

    db.get('SELECT * FROM orders WHERE id = ?', [orderId], async (err, order) => {
      if (err) {
        return res.status(500).json({ success: false, message: '查询订单失败', error: err.message });
      }

      if (!order) {
        return res.status(404).json({ success: false, message: '订单不存在' });
      }

      const validStatuses = [ORDER_STATUSES.IN_TRANSIT, ORDER_STATUSES.ARRIVED_AT_CENTER];
      if (!validStatuses.includes(order.status)) {
        return res.status(400).json({ success: false, message: '当前订单状态不可签收' });
      }

      if (receipt_weight === undefined || receipt_weight === null || receipt_weight < 0) {
        return res.status(400).json({ success: false, message: '请输入有效的签收重量' });
      }

      const pickupWeight = order.weight || 0;
      const difference = Math.abs(pickupWeight - receipt_weight);
      const differencePercent = pickupWeight > 0 ? (difference / pickupWeight) * 100 : 0;

      const thresholdPercent = 5;
      const hasDiscrepancy = differencePercent > thresholdPercent;

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const newStatus = hasDiscrepancy ? ORDER_STATUSES.DISPUTED : ORDER_STATUSES.CENTER_RECEIVED;

        db.run(
          `UPDATE orders 
           SET status = ?, center_id = ?, center_receipt_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [newStatus, center_id || null, orderId],
          async function(err) {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ success: false, message: '更新订单失败', error: err.message });
            }

            if (hasDiscrepancy) {
              const diffId = uuidv4();
              db.run(
                `INSERT INTO weight_differences 
                 (id, order_id, pickup_weight, receipt_weight, difference, difference_percent, status, reported_by)
                 VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
                [diffId, orderId, pickupWeight, receipt_weight, difference, differencePercent, centerManagerId],
                (diffErr) => {
                  if (diffErr) {
                    console.error('记录重量差异失败:', diffErr);
                  }
                }
              );
            }

            await logOrderStatus(orderId, order.status, newStatus, centerManagerId, 'center', 
              `集散中心签收，签收重量: ${receipt_weight}kg${hasDiscrepancy ? '，重量存在差异' : ''}`);
            await logAudit(centerManagerId, 'center', 'RECEIVE_ORDER', 'order', orderId, {
              pickupWeight,
              receiptWeight: receipt_weight,
              difference,
              differencePercent,
              hasDiscrepancy
            });

            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                db.run('ROLLBACK');
                return res.status(500).json({ success: false, message: '事务提交失败' });
              }

              res.json({
                success: true,
                message: hasDiscrepancy ? '签收完成，重量存在差异，已提交运营审核' : '签收完成',
                data: {
                  order_id: orderId,
                  pickup_weight: pickupWeight,
                  receipt_weight: receipt_weight,
                  difference,
                  difference_percent: differencePercent,
                  has_discrepancy: hasDiscrepancy,
                  status: newStatus,
                  status_name: STATUS_NAMES[newStatus]
                }
              });
            });
          }
        );
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
});

router.post('/:orderId/complete', authMiddleware, roleMiddleware('operator'), async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { resolution } = req.body;
    const operatorId = req.user.id;

    db.get('SELECT * FROM orders WHERE id = ?', [orderId], async (err, order) => {
      if (err) {
        return res.status(500).json({ success: false, message: '查询订单失败', error: err.message });
      }

      if (!order) {
        return res.status(404).json({ success: false, message: '订单不存在' });
      }

      const validStatuses = [ORDER_STATUSES.CENTER_RECEIVED, ORDER_STATUSES.DISPUTED];
      if (!validStatuses.includes(order.status)) {
        return res.status(400).json({ success: false, message: '当前订单状态不可完成' });
      }

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
          `UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [ORDER_STATUSES.COMPLETED, orderId],
          async function(err) {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ success: false, message: '更新订单失败', error: err.message });
            }

            if (order.status === ORDER_STATUSES.DISPUTED) {
              db.run(
                `UPDATE weight_differences 
                 SET status = 'resolved', resolved_by = ?, resolution = ?
                 WHERE order_id = ?`,
                [operatorId, resolution || '运营审核通过', orderId]
              );
            }

            await logOrderStatus(orderId, order.status, ORDER_STATUSES.COMPLETED, operatorId, 'operator', 
              order.status === ORDER_STATUSES.DISPUTED ? '运营审核完成，订单完成' : '订单完成');
            await logAudit(operatorId, 'operator', 'COMPLETE_ORDER', 'order', orderId, { resolution });

            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                db.run('ROLLBACK');
                return res.status(500).json({ success: false, message: '事务提交失败' });
              }

              res.json({
                success: true,
                message: '订单已完成',
                data: {
                  order_id: orderId,
                  status: ORDER_STATUSES.COMPLETED,
                  status_name: STATUS_NAMES[ORDER_STATUSES.COMPLETED]
                }
              });
            });
          }
        );
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
});

router.get('/my', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, limit = 20, offset = 0 } = req.query;

    let query = '';
    let params = [];

    if (userRole === 'resident') {
      query = `SELECT o.*, u.name as rider_name, u.phone as rider_phone
               FROM orders o
               LEFT JOIN users u ON o.rider_id = u.id
               WHERE o.resident_id = ?`;
      params = [userId];
    } else if (userRole === 'rider') {
      query = `SELECT o.*, u.name as resident_name, u.phone as resident_phone, u.address as resident_address
               FROM orders o
               JOIN users u ON o.resident_id = u.id
               WHERE o.rider_id = ?`;
      params = [userId];
    } else if (userRole === 'center') {
      query = `SELECT o.*, ur.name as resident_name, ur.phone as resident_phone,
               r.name as rider_name, r.phone as rider_phone
               FROM orders o
               JOIN users ur ON o.resident_id = ur.id
               LEFT JOIN users r ON o.rider_id = r.id
               WHERE o.center_id IN (SELECT id FROM centers WHERE manager_id = ?)`;
      params = [userId];
    } else {
      query = `SELECT o.*, ur.name as resident_name, ur.phone as resident_phone,
               r.name as rider_name, r.phone as rider_phone
               FROM orders o
               JOIN users ur ON o.resident_id = ur.id
               LEFT JOIN users r ON o.rider_id = r.id`;
    }

    if (status) {
      query += ` AND o.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, orders) => {
      if (err) {
        return res.status(500).json({ success: false, message: '查询订单失败', error: err.message });
      }

      const ordersWithNames = orders.map(order => ({
        ...order,
        status_name: STATUS_NAMES[order.status]
      }));

      res.json({
        success: true,
        data: ordersWithNames
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
});

router.get('/:orderId', authMiddleware, (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.user.id;
    const userRole = req.user.role;

    db.get(
      `SELECT o.*, ur.name as resident_name, ur.phone as resident_phone, ur.address as resident_address,
       r.name as rider_name, r.phone as rider_phone,
       c.name as center_name, c.address as center_address
       FROM orders o
       JOIN users ur ON o.resident_id = ur.id
       LEFT JOIN users r ON o.rider_id = r.id
       LEFT JOIN centers c ON o.center_id = c.id
       WHERE o.id = ?`,
      [orderId],
      (err, order) => {
        if (err) {
          return res.status(500).json({ success: false, message: '查询订单失败', error: err.message });
        }

        if (!order) {
          return res.status(404).json({ success: false, message: '订单不存在' });
        }

        if (userRole === 'resident' && order.resident_id !== userId) {
          return res.status(403).json({ success: false, message: '无权限查看此订单' });
        }
        if (userRole === 'rider' && order.rider_id && order.rider_id !== userId) {
          return res.status(403).json({ success: false, message: '无权限查看此订单' });
        }

        db.all(
          `SELECT * FROM order_status_logs WHERE order_id = ? ORDER BY created_at ASC`,
          [orderId],
          (logErr, logs) => {
            if (logErr) {
              console.error('查询订单日志失败:', logErr);
            }

            res.json({
              success: true,
              data: {
                ...order,
                status_name: STATUS_NAMES[order.status],
                status_logs: logs || []
              }
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误', error: error.message });
  }
});

module.exports = router;
