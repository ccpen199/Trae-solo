
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const db = require('./database');

const app = express();
const PORT = process.env.BACKEND_PORT || 58791;
const JWT_SECRET = 'freight-platform-secret-key';

app.use(cors({ origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48791}` }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Healthy' });
});

app.post('/api/auth/shipper/register', (req, res) => {
  const { username, password, companyName, contactPerson, phone, address } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run(
    `INSERT INTO shippers (username, password, company_name, contact_person, phone, address) VALUES (?, ?, ?, ?, ?, ?)`,
    [username, hashedPassword, companyName, contactPerson, phone, address],
    function(err) {
      if (err) return res.status(400).json({ error: 'Username already exists' });
      const token = jwt.sign({ id: this.lastID, role: 'shipper' }, JWT_SECRET);
      res.json({ token, user: { id: this.lastID, username, role: 'shipper', companyName, contactPerson, phone, address } });
    }
  );
});

app.post('/api/auth/shipper/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM shippers WHERE username = ?`, [username], (err, user) => {
    if (err || !user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: 'shipper' }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username, role: 'shipper', companyName: user.company_name, contactPerson: user.contact_person, phone: user.phone, address: user.address } });
  });
});

app.post('/api/auth/driver/register', (req, res) => {
  const { username, password, realName, phone, idCard, licensePlate, vehicleType } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run(
    `INSERT INTO drivers (username, password, real_name, phone, id_card, license_plate, vehicle_type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [username, hashedPassword, realName, phone, idCard, licensePlate, vehicleType],
    function(err) {
      if (err) return res.status(400).json({ error: 'Username already exists' });
      const token = jwt.sign({ id: this.lastID, role: 'driver' }, JWT_SECRET);
      res.json({ token, user: { id: this.lastID, username, role: 'driver', realName, phone, vehicleType, verified: 0, rating: 5.0 } });
    }
  );
});

app.post('/api/auth/driver/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM drivers WHERE username = ?`, [username], (err, user) => {
    if (err || !user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: 'driver' }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username, role: 'driver', realName: user.real_name, phone: user.phone, vehicleType: user.vehicle_type, verified: user.verified, rating: user.rating } });
  });
});

app.post('/api/auth/admin/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM admins WHERE username = ?`, [username], (err, user) => {
    if (err || !user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: 'admin' }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username, role: 'admin' } });
  });
});

app.post('/api/orders', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'shipper') return res.status(403).json({ error: 'Forbidden' });
    
    const { sourceLocation, destinationLocation, cargoDescription, cargoWeight, vehicleType, serviceType, basePrice } = req.body;
    
    db.run(
      `INSERT INTO orders (shipper_id, source_location, destination_location, cargo_description, cargo_weight, vehicle_type, service_type, base_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [decoded.id, sourceLocation, destinationLocation, cargoDescription, cargoWeight, vehicleType, serviceType, basePrice],
      function(err) {
        if (err) return res.status(400).json({ error: 'Failed to create order' });
        res.json({ id: this.lastID, ...req.body, status: 'published', shipperId: decoded.id });
      }
    );
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.get('/api/orders', (req, res) => {
  const { vehicleType, serviceType, status } = req.query;
  let query = `SELECT o.*, s.company_name as shipper_name FROM orders o JOIN shippers s ON o.shipper_id = s.id WHERE 1=1`;
  const params = [];
  
  if (vehicleType) { query += ' AND o.vehicle_type = ?'; params.push(vehicleType); }
  if (serviceType) { query += ' AND o.service_type = ?'; params.push(serviceType); }
  if (status) { query += ' AND o.status = ?'; params.push(status); }
  
  query += ' ORDER BY o.created_at DESC';
  
  db.all(query, params, (err, orders) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(orders);
  });
});

app.get('/api/orders/:id', (req, res) => {
  db.get(
    `SELECT o.*, s.company_name as shipper_name FROM orders o JOIN shippers s ON o.shipper_id = s.id WHERE o.id = ?`,
    [req.params.id],
    (err, order) => {
      if (err || !order) return res.status(404).json({ error: 'Order not found' });
      res.json(order);
    }
  );
});

app.get('/api/shipments', (req, res) => {
  db.all(
    `SELECT sh.*, o.*, d.real_name as driver_name, d.license_plate, d.vehicle_type FROM shipments sh 
     JOIN orders o ON sh.order_id = o.id 
     LEFT JOIN drivers d ON sh.driver_id = d.id 
     ORDER BY sh.created_at DESC`,
    [],
    (err, shipments) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(shipments);
    }
  );
});

app.post('/api/shipments', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'driver') return res.status(403).json({ error: 'Forbidden' });
    
    const { orderId, negotiatedPrice } = req.body;
    
    db.run(
      `INSERT INTO shipments (order_id, driver_id, status) VALUES (?, ?, 'accepted')`,
      [orderId, decoded.id],
      function(err) {
        if (err) return res.status(400).json({ error: 'Failed to create shipment' });
        
        db.run(
          `UPDATE orders SET status = 'accepted', negotiated_price = ? WHERE id = ?`,
          [negotiatedPrice, orderId],
          (updateErr) => {
            if (updateErr) return res.status(400).json({ error: 'Failed to update order' });
            res.json({ id: this.lastID, orderId, driverId: decoded.id, status: 'accepted' });
          }
        );
      }
    );
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.put('/api/shipments/:id/status', (req, res) => {
  const { status, pickupTime, deliveryTime } = req.body;
  db.run(
    `UPDATE shipments SET status = ?, pickup_time = COALESCE(?, pickup_time), delivery_time = COALESCE(?, delivery_time) WHERE id = ?`,
    [status, pickupTime || null, deliveryTime || null, req.params.id],
    (err) => {
      if (err) return res.status(400).json({ error: 'Failed to update shipment' });
      
      db.get(
        `SELECT order_id FROM shipments WHERE id = ?`,
        [req.params.id],
        (err, shipment) => {
          if (shipment) {
            db.run(
              `UPDATE orders SET status = ? WHERE id = ?`,
              [status, shipment.order_id]
            );
          }
          res.json({ id: req.params.id, status });
        }
      );
    }
  );
});

app.get('/api/dashboard/stats', (req, res) => {
  Promise.all([
    new Promise((resolve) => {
      db.get(`SELECT COUNT(*) as count FROM orders WHERE status = 'published'`, [], (err, row) => resolve(row.count));
    }),
    new Promise((resolve) => {
      db.get(`SELECT COUNT(*) as count FROM orders WHERE status IN ('accepted', 'picked_up', 'in_transit')`, [], (err, row) => resolve(row.count));
    }),
    new Promise((resolve) => {
      db.get(`SELECT COUNT(*) as count FROM drivers WHERE verified = 1`, [], (err, row) => resolve(row.count));
    }),
    new Promise((resolve) => {
      db.get(`SELECT AVG(rating) as avg FROM drivers`, [], (err, row) => resolve(row.avg || 0));
    })
  ]).then(([pendingOrders, activeOrders, verifiedDrivers, avgRating]) => {
    res.json({
      pendingOrders,
      activeOrders,
      verifiedDrivers,
      avgRating: parseFloat(avgRating.toFixed(2))
    });
  });
});

app.get('/api/drivers', (req, res) => {
  db.all(`SELECT * FROM drivers ORDER BY created_at DESC`, [], (err, drivers) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(drivers);
  });
});

app.put('/api/drivers/:id/verify', (req, res) => {
  db.run(`UPDATE drivers SET verified = 1 WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(400).json({ error: 'Failed to verify driver' });
    res.json({ id: req.params.id, verified: 1 });
  });
});

app.get('/api/shippers', (req, res) => {
  db.all(`SELECT * FROM shippers ORDER BY created_at DESC`, [], (err, shippers) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(shippers);
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
