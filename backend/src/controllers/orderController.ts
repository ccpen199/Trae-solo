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

export const getOrders = (_req: Request, res: Response) => {
  try {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const getOrderById = (req: Request, res: Response) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

export const createOrder = (req: Request, res: Response) => {
  try {
    const {
      order_no, cargo_volume, cargo_weight, loading_requirement,
      time_window_start, time_window_end, customer_name, customer_phone,
      pickup_address, delivery_address, pickup_lng, pickup_lat, delivery_lng, delivery_lat
    } = req.body;

    const info = db.prepare(`
      INSERT INTO orders (order_no, cargo_volume, cargo_weight, loading_requirement, time_window_start, time_window_end, customer_name, customer_phone, pickup_address, delivery_address, pickup_lng, pickup_lat, delivery_lng, delivery_lat)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order_no, cargo_volume, cargo_weight, loading_requirement,
      time_window_start, time_window_end, customer_name, customer_phone,
      pickup_address, delivery_address, pickup_lng, pickup_lat, delivery_lng, delivery_lat
    );

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
};

export const assignOrder = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { driver_id } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driver_id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    db.prepare('UPDATE orders SET assigned_driver_id = ?, status = ? WHERE id = ?').run(driver_id, 'assigned', id);

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign order' });
  }
};

export const autoDispatchOrder = (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const availableDrivers = db.prepare(`
      SELECT d.*, dc.on_time_rate, dc.service_score, dc.violation_count, dc.credit_score
      FROM drivers d
      LEFT JOIN driver_credit dc ON d.id = dc.driver_id
      WHERE d.status = 'available'
    `).all() as any[];

    if (availableDrivers.length === 0) {
      return res.status(400).json({ error: 'No available drivers' });
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
        distance_score: parseFloat(distanceScore.toFixed(4)),
        on_time_score: parseFloat(onTimeScore.toFixed(4)),
        vehicle_match_score: parseFloat(vehicleMatchScore.toFixed(4)),
        service_score_factor: parseFloat(serviceScore.toFixed(4)),
        total_score: parseFloat(totalScore.toFixed(4)),
      };
    });

    scoredDrivers.sort((a, b) => b.total_score - a.total_score);

    res.json({
      order_id: order.id,
      recommended_drivers: scoredDrivers,
      algorithm: {
        distance_weight: 0.4,
        on_time_rate_weight: 0.25,
        vehicle_match_weight: 0.2,
        service_score_weight: 0.15,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to auto dispatch order' });
  }
};

export const acceptOrder = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { driver_id } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending' && order.status !== 'assigned') {
      return res.status(400).json({ error: 'Order cannot be accepted' });
    }

    if (order.assigned_driver_id && order.assigned_driver_id !== driver_id) {
      return res.status(400).json({ error: 'Order already assigned to another driver' });
    }

    db.prepare('UPDATE orders SET assigned_driver_id = ?, status = ? WHERE id = ?').run(driver_id, 'accepted', id);

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept order' });
  }
};

export const pickupOrder = (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'accepted') {
      return res.status(400).json({ error: 'Order cannot be picked up' });
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('in_transit', id);

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to pickup order' });
  }
};

export const deliverOrder = (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'in_transit') {
      return res.status(400).json({ error: 'Order cannot be delivered' });
    }

    db.prepare("UPDATE orders SET status = ?, finished_at = datetime('now') WHERE id = ?").run('completed', id);

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to deliver order' });
  }
};
