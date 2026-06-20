import { Request, Response } from 'express';
import db from '../db';

function haversineDistance(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getVehicleTypeMatchScore(orderReq: string | null | undefined, driverType: string | null | undefined): number {
  if (!orderReq || !driverType) return 0.5;
  if (orderReq === driverType) return 1.0;
  const orderLower = orderReq.toLowerCase();
  const driverLower = driverType.toLowerCase();
  if (orderLower.includes('货车') && driverLower.includes('货车')) return 0.7;
  if (orderLower.includes('厢式') && driverLower.includes('厢式')) return 0.9;
  return 0.3;
}

export const getOrders = (req: Request, res: Response) => {
  try {
    const { keyword, status, page = '1', pageSize = '10' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const pageSizeNum = parseInt(pageSize as string, 10) || 10;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (keyword) {
      whereClauses.push('(order_no LIKE ? OR customer_name LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const total = (db.prepare(`SELECT COUNT(*) as count FROM orders ${whereStr}`).get(...params) as { count: number }).count;
    const orders = db.prepare(`
      SELECT o.*, d.name as driver_name
      FROM orders o
      LEFT JOIN drivers d ON o.assigned_driver_id = d.id
      ${whereStr}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSizeNum, (pageNum - 1) * pageSizeNum);

    res.success({ list: orders, total, page: pageNum, pageSize: pageSizeNum });
  } catch (error) {
    res.error('Failed to fetch orders');
  }
};

export const getOrderById = (req: Request, res: Response) => {
  try {
    const order = db.prepare(`
      SELECT o.*, d.name as driver_name
      FROM orders o
      LEFT JOIN drivers d ON o.assigned_driver_id = d.id
      WHERE o.id = ?
    `).get(req.params.id);
    if (!order) {
      return res.error('Order not found');
    }
    res.success(order);
  } catch (error) {
    res.error('Failed to fetch order');
  }
};

export const createOrder = (req: Request, res: Response) => {
  try {
    const {
      order_no, cargo_volume, cargo_weight, loading_requirement,
      time_window_start, time_window_end, customer_name, customer_phone,
      customer_credit_score, pickup_address, delivery_address,
      pickup_lng, pickup_lat, delivery_lng, delivery_lat
    } = req.body;

    const generatedOrderNo = order_no || `ORD${Date.now()}`;

    const info = db.prepare(`
      INSERT INTO orders (order_no, cargo_volume, cargo_weight, loading_requirement, time_window_start, time_window_end, customer_name, customer_phone, customer_credit_score, pickup_address, delivery_address, pickup_lng, pickup_lat, delivery_lng, delivery_lat)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      generatedOrderNo, cargo_volume, cargo_weight, loading_requirement,
      time_window_start, time_window_end, customer_name, customer_phone,
      customer_credit_score || 100, pickup_address, delivery_address,
      pickup_lng, pickup_lat, delivery_lng, delivery_lat
    );

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(info.lastInsertRowid);
    res.success(order);
  } catch (error) {
    res.error('Failed to create order');
  }
};

export const assignOrder = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { driver_id } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.error('Order not found');
    }

    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driver_id);
    if (!driver) {
      return res.error('Driver not found');
    }

    db.prepare('UPDATE orders SET assigned_driver_id = ?, status = ? WHERE id = ?').run(driver_id, 'assigned', id);

    const updatedOrder = db.prepare(`
      SELECT o.*, d.name as driver_name
      FROM orders o
      LEFT JOIN drivers d ON o.assigned_driver_id = d.id
      WHERE o.id = ?
    `).get(id);
    res.success(updatedOrder);
  } catch (error) {
    res.error('Failed to assign order');
  }
};

export const autoDispatchOrder = (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) {
      return res.error('Order not found');
    }

    const availableDrivers = db.prepare(`
      SELECT d.*, dc.on_time_rate, dc.service_score, dc.violation_count, dc.credit_score
      FROM drivers d
      LEFT JOIN driver_credit dc ON d.id = dc.driver_id
      WHERE d.status = 'available'
    `).all() as any[];

    if (availableDrivers.length === 0) {
      return res.error('No available drivers');
    }

    const scoredDrivers = availableDrivers.map((driver) => {
      const distance = haversineDistance(
        order.pickup_lng || 0,
        order.pickup_lat || 0,
        116.4 + Math.random() * 0.1,
        39.9 + Math.random() * 0.1
      );

      const maxDistance = 50;
      const distanceScore = Math.max(0, 1 - distance / maxDistance);
      const onTimeRate = driver.on_time_rate || 90;
      const onTimeScore = onTimeRate / 100;
      const vehicleMatchScore = getVehicleTypeMatchScore(order.loading_requirement, driver.vehicle_type);
      const serviceScore = (driver.service_score || 4.0) / 5;
      const totalScore = distanceScore * 0.4 + onTimeScore * 0.25 + vehicleMatchScore * 0.2 + serviceScore * 0.15;

      return {
        ...driver,
        distance: parseFloat(distance.toFixed(2)),
        total_score: parseFloat(totalScore.toFixed(4)),
      };
    });

    scoredDrivers.sort((a, b) => b.total_score - a.total_score);
    const bestDriver = scoredDrivers[0];

    db.prepare('UPDATE orders SET assigned_driver_id = ?, status = ? WHERE id = ?').run(bestDriver.id, 'assigned', id);
    db.prepare('UPDATE drivers SET status = ? WHERE id = ?').run('busy', bestDriver.id);

    const updatedOrder = db.prepare(`
      SELECT o.*, d.name as driver_name
      FROM orders o
      LEFT JOIN drivers d ON o.assigned_driver_id = d.id
      WHERE o.id = ?
    `).get(id);
    res.success(updatedOrder);
  } catch (error) {
    res.error('Failed to auto dispatch order');
  }
};

export const autoDispatch = (_req: Request, res: Response) => {
  try {
    const pendingOrders = db.prepare("SELECT * FROM orders WHERE status = 'pending'").all() as any[];
    const availableDrivers = db.prepare("SELECT * FROM drivers WHERE status = 'available'").all() as any[];

    let success = 0;
    let failed = 0;

    const assignTransaction = db.transaction(() => {
      for (let i = 0; i < Math.min(pendingOrders.length, availableDrivers.length); i++) {
        db.prepare('UPDATE orders SET assigned_driver_id = ?, status = ? WHERE id = ?').run(availableDrivers[i].id, 'assigned', pendingOrders[i].id);
        db.prepare('UPDATE drivers SET status = ? WHERE id = ?').run('busy', availableDrivers[i].id);
        success++;
      }
      failed = pendingOrders.length - success;
    });

    assignTransaction();

    res.success({ success, failed, message: `批量派单完成：成功${success}个，失败${failed}个` });
  } catch (error) {
    res.error('Failed to auto dispatch');
  }
};

export const acceptOrder = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { driver_id } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) {
      return res.error('Order not found');
    }
    if (order.status !== 'pending' && order.status !== 'assigned') {
      return res.error('Order cannot be accepted');
    }
    if (order.assigned_driver_id && order.assigned_driver_id !== driver_id) {
      return res.error('Order already assigned to another driver');
    }

    db.prepare('UPDATE orders SET assigned_driver_id = ?, status = ? WHERE id = ?').run(driver_id, 'accepted', id);
    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    res.success(updatedOrder);
  } catch (error) {
    res.error('Failed to accept order');
  }
};

export const pickupOrder = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) {
      return res.error('Order not found');
    }
    if (order.status !== 'accepted') {
      return res.error('Order cannot be picked up');
    }
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('in_transit', id);
    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    res.success(updatedOrder);
  } catch (error) {
    res.error('Failed to pickup order');
  }
};

export const deliverOrder = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) {
      return res.error('Order not found');
    }
    if (order.status !== 'in_transit') {
      return res.error('Order cannot be delivered');
    }
    db.prepare("UPDATE orders SET status = ?, finished_at = datetime('now') WHERE id = ?").run('completed', id);
    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    res.success(updatedOrder);
  } catch (error) {
    res.error('Failed to deliver order');
  }
};

export const getPendingOrders = (_req: Request, res: Response) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, d.name as driver_name
      FROM orders o
      LEFT JOIN drivers d ON o.assigned_driver_id = d.id
      WHERE o.status = 'pending'
      ORDER BY o.created_at DESC
    `).all();
    res.success({ list: orders, total: orders.length });
  } catch (error) {
    res.error('Failed to fetch pending orders');
  }
};
