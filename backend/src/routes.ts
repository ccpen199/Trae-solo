import { Router, Request, Response } from 'express';
import { db } from './database';
import { findMatchingVoyages, findMatchingCargos, predictEmptyRate, getFreightIndexTrend } from './matchingEngine';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

function parseJSONField<T>(value: string | null | undefined, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

router.get('/users', (req: Request, res: Response) => {
  const { role } = req.query;
  let query = 'SELECT * FROM users';
  const params: any[] = [];
  
  if (role) {
    query += ' WHERE role = ?';
    params.push(role);
  }
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/users/:id', (req: Request, res: Response) => {
  db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json(row);
  });
});

router.get('/vessels', (req: Request, res: Response) => {
  const { type, status, owner_id } = req.query;
  let query = 'SELECT * FROM vessels WHERE 1=1';
  const params: any[] = [];
  
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (owner_id) {
    query += ' AND owner_id = ?';
    params.push(owner_id);
  }
  
  query += ' ORDER BY created_at DESC';
  
  db.all(query, params, (err, rows: any[]) => {
    if (err) return res.status(500).json({ error: err.message });
    const result = rows.map(r => ({
      ...r,
      specs: parseJSONField(r.specs, {})
    }));
    res.json(result);
  });
});

router.get('/vessels/:id', (req: Request, res: Response) => {
  db.get('SELECT * FROM vessels WHERE id = ?', [req.params.id], (err, row: any) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Vessel not found' });
    row.specs = parseJSONField(row.specs, {});
    res.json(row);
  });
});

router.post('/vessels', (req: Request, res: Response) => {
  const id = uuidv4();
  const { name, imo, type, dwt, teu, built_year, flag, speed, status, owner_id, current_port, latitude, longitude, specs } = req.body;
  
  db.run(`INSERT INTO vessels (id, name, imo, type, dwt, teu, built_year, flag, speed, status, owner_id, current_port, latitude, longitude, specs)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, imo, type, dwt, teu, built_year, flag, speed, status || 'available', owner_id, current_port, latitude, longitude, JSON.stringify(specs || {})],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, ...req.body });
    }
  );
});

router.get('/voyages', (req: Request, res: Response) => {
  const { origin_port, destination_port, status, vessel_id } = req.query;
  let query = `
    SELECT v.*, ves.name as vessel_name, ves.type as vessel_type, ves.flag, ves.speed
    FROM voyages v
    JOIN vessels ves ON v.vessel_id = ves.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (origin_port) {
    query += ' AND v.origin_port = ?';
    params.push(origin_port);
  }
  if (destination_port) {
    query += ' AND v.destination_port = ?';
    params.push(destination_port);
  }
  if (status) {
    query += ' AND v.status = ?';
    params.push(status);
  }
  if (vessel_id) {
    query += ' AND v.vessel_id = ?';
    params.push(vessel_id);
  }
  
  query += ' ORDER BY v.etd ASC';
  
  db.all(query, params, (err, rows: any[]) => {
    if (err) return res.status(500).json({ error: err.message });
    const result = rows.map(r => ({
      ...r,
      container_types: parseJSONField(r.container_types, []),
      compliance_certificates: parseJSONField(r.compliance_certificates, [])
    }));
    res.json(result);
  });
});

router.get('/voyages/:id', (req: Request, res: Response) => {
  db.get(`
    SELECT v.*, ves.name as vessel_name, ves.type as vessel_type, ves.teu as vessel_teu, ves.dwt as vessel_dwt, ves.flag
    FROM voyages v
    JOIN vessels ves ON v.vessel_id = ves.id
    WHERE v.id = ?
  `, [req.params.id], (err, row: any) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Voyage not found' });
    row.container_types = parseJSONField(row.container_types, []);
    row.compliance_certificates = parseJSONField(row.compliance_certificates, []);
    res.json(row);
  });
});

router.post('/voyages', (req: Request, res: Response) => {
  const id = uuidv4();
  const { vessel_id, voyage_number, origin_port, destination_port, etd, eta, available_teu, available_weight, container_types, base_rate, carbon_estimate, compliance_certificates } = req.body;
  
  db.run(`INSERT INTO voyages (id, vessel_id, voyage_number, origin_port, destination_port, etd, eta, status, available_teu, available_weight, container_types, base_rate, carbon_estimate, compliance_certificates)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?, ?, ?, ?)`,
    [id, vessel_id, voyage_number, origin_port, destination_port, etd, eta, available_teu, available_weight, JSON.stringify(container_types || []), base_rate, carbon_estimate, JSON.stringify(compliance_certificates || [])],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, ...req.body, status: 'published' });
    }
  );
});

router.get('/voyages/:id/match-cargos', async (req: Request, res: Response) => {
  try {
    const voyage = await new Promise<any>((resolve, reject) => {
      db.get('SELECT * FROM voyages WHERE id = ?', [req.params.id], (err, row) => {
        if (err) reject(err);
        else resolve(row as any);
      });
    });

    if (!voyage) return res.status(404).json({ error: 'Voyage not found' });

    const matches = await findMatchingCargos(voyage);
    res.json(matches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/voyages/:id/empty-rate-prediction', async (req: Request, res: Response) => {
  try {
    const prediction = await predictEmptyRate(req.params.id);
    res.json(prediction);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cargo-bookings', (req: Request, res: Response) => {
  const { status, cargo_owner_id } = req.query;
  let query = `
    SELECT cb.*, u.name as owner_name, u.company as owner_company
    FROM cargo_bookings cb
    JOIN users u ON cb.cargo_owner_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (status) {
    query += ' AND cb.status = ?';
    params.push(status);
  }
  if (cargo_owner_id) {
    query += ' AND cb.cargo_owner_id = ?';
    params.push(cargo_owner_id);
  }
  
  query += ' ORDER BY cb.created_at DESC';
  
  db.all(query, params, (err, rows: any[]) => {
    if (err) return res.status(500).json({ error: err.message });
    const result = rows.map(r => ({
      ...r,
      special_requirements: parseJSONField(r.special_requirements, []),
      compliance_docs: parseJSONField(r.compliance_docs, [])
    }));
    res.json(result);
  });
});

router.get('/cargo-bookings/:id', (req: Request, res: Response) => {
  db.get(`
    SELECT cb.*, u.name as owner_name, u.company as owner_company
    FROM cargo_bookings cb
    JOIN users u ON cb.cargo_owner_id = u.id
    WHERE cb.id = ?
  `, [req.params.id], (err, row: any) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Booking not found' });
    row.special_requirements = parseJSONField(row.special_requirements, []);
    row.compliance_docs = parseJSONField(row.compliance_docs, []);
    res.json(row);
  });
});

router.post('/cargo-bookings', (req: Request, res: Response) => {
  const id = uuidv4();
  const { cargo_owner_id, voyage_id, cargo_type, weight, teu, origin_port, destination_port, earliest_departure, latest_arrival, budget_rate, special_requirements, compliance_docs } = req.body;
  
  db.run(`INSERT INTO cargo_bookings (id, cargo_owner_id, voyage_id, cargo_type, weight, teu, origin_port, destination_port, earliest_departure, latest_arrival, budget_rate, status, special_requirements, compliance_docs)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'inquiry', ?, ?)`,
    [id, cargo_owner_id, voyage_id || null, cargo_type, weight, teu, origin_port, destination_port, earliest_departure || null, latest_arrival || null, budget_rate || null, JSON.stringify(special_requirements || []), JSON.stringify(compliance_docs || [])],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, ...req.body, status: 'inquiry' });
    }
  );
});

router.get('/cargo-bookings/:id/match-voyages', async (req: Request, res: Response) => {
  try {
    const bookingRow = await new Promise<any>((resolve, reject) => {
      db.get('SELECT * FROM cargo_bookings WHERE id = ?', [req.params.id], (err, row) => {
        if (err) reject(err);
        else resolve(row as any);
      });
    });

    if (!bookingRow) return res.status(404).json({ error: 'Booking not found' });

    const booking = {
      ...bookingRow,
      special_requirements: parseJSONField(bookingRow.special_requirements, []),
      compliance_docs: parseJSONField(bookingRow.compliance_docs, [])
    };

    const matches = await findMatchingVoyages(booking);
    res.json(matches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vessel-listings', (req: Request, res: Response) => {
  const { status } = req.query;
  let query = `
    SELECT vl.*, v.name as vessel_name, v.type as vessel_type, v.teu, v.dwt, v.built_year, v.flag,
           u.name as seller_name, u.company as seller_company
    FROM vessel_listings vl
    JOIN vessels v ON vl.vessel_id = v.id
    JOIN users u ON vl.seller_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (status) {
    query += ' AND vl.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY vl.created_at DESC';
  
  db.all(query, params, (err, rows: any[]) => {
    if (err) return res.status(500).json({ error: err.message });
    const result = rows.map(r => ({
      ...r,
      due_diligence_docs: parseJSONField(r.due_diligence_docs, [])
    }));
    res.json(result);
  });
});

router.get('/vessel-listings/:id', (req: Request, res: Response) => {
  db.get(`
    SELECT vl.*, v.name as vessel_name, v.type as vessel_type, v.teu, v.dwt, v.built_year, v.flag, v.specs,
           u.name as seller_name, u.company as seller_company
    FROM vessel_listings vl
    JOIN vessels v ON vl.vessel_id = v.id
    JOIN users u ON vl.seller_id = u.id
    WHERE vl.id = ?
  `, [req.params.id], (err, row: any) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Listing not found' });
    row.due_diligence_docs = parseJSONField(row.due_diligence_docs, []);
    row.specs = parseJSONField(row.specs, {});
    res.json(row);
  });
});

router.post('/vessel-listings', (req: Request, res: Response) => {
  const id = uuidv4();
  const { vessel_id, seller_id, price, currency, description, due_diligence_docs, inspection_date } = req.body;
  
  db.run(`INSERT INTO vessel_listings (id, vessel_id, seller_id, price, currency, description, status, due_diligence_docs, inspection_date)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
    [id, vessel_id, seller_id, price, currency || 'USD', description, JSON.stringify(due_diligence_docs || []), inspection_date || null],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, ...req.body, status: 'active' });
    }
  );
});

router.get('/vessel-listings/:id/negotiations', (req: Request, res: Response) => {
  db.all(`
    SELECT nr.*, u.name as buyer_name, u.company as buyer_company
    FROM negotiation_records nr
    JOIN users u ON nr.buyer_id = u.id
    WHERE nr.listing_id = ?
    ORDER BY nr.created_at DESC
  `, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/vessel-listings/:id/negotiations', (req: Request, res: Response) => {
  const id = uuidv4();
  const { buyer_id, proposed_price, message } = req.body;
  
  db.run(`INSERT INTO negotiation_records (id, listing_id, buyer_id, proposed_price, status, message)
    VALUES (?, ?, ?, ?, 'pending', ?)`,
    [id, req.params.id, buyer_id, proposed_price, message],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, ...req.body, status: 'pending' });
    }
  );
});

router.put('/negotiations/:id/respond', (req: Request, res: Response) => {
  const { counter_price, status } = req.body;
  
  db.run('UPDATE negotiation_records SET counter_price = ?, status = ? WHERE id = ?',
    [counter_price || null, status, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Negotiation not found' });
      res.json({ success: true });
    }
  );
});

router.get('/containers', (req: Request, res: Response) => {
  const { status, type, operator_id } = req.query;
  let query = 'SELECT * FROM containers WHERE 1=1';
  const params: any[] = [];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (operator_id) {
    query += ' AND operator_id = ?';
    params.push(operator_id);
  }
  
  query += ' ORDER BY created_at DESC';
  
  db.all(query, params, (err, rows: any[]) => {
    if (err) return res.status(500).json({ error: err.message });
    const result = rows.map(r => ({
      ...r,
      features: parseJSONField(r.features, [])
    }));
    res.json(result);
  });
});

router.get('/liner-schedules', (req: Request, res: Response) => {
  const { origin_port, destination_port } = req.query;
  let query = `
    SELECT ls.*, u.name as operator_name, u.company as operator_company
    FROM liner_schedules ls
    LEFT JOIN users u ON ls.operator_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (origin_port) {
    query += ' AND ls.origin_port = ?';
    params.push(origin_port);
  }
  if (destination_port) {
    query += ' AND ls.destination_port = ?';
    params.push(destination_port);
  }
  
  query += ' ORDER BY ls.created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/spot-containers', (req: Request, res: Response) => {
  const { status, schedule_id } = req.query;
  let query = `
    SELECT sc.*, c.size as container_size, c.type as container_type, c.teu,
           ls.route_code, ls.origin_port, ls.destination_port, ls.transit_days
    FROM spot_containers sc
    JOIN containers c ON sc.container_id = c.id
    LEFT JOIN liner_schedules ls ON sc.schedule_id = ls.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (status) {
    query += ' AND sc.status = ?';
    params.push(status);
  }
  if (schedule_id) {
    query += ' AND sc.schedule_id = ?';
    params.push(schedule_id);
  }
  
  query += ' ORDER BY sc.departure_date ASC';
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/spot-containers/:id/book', (req: Request, res: Response) => {
  db.run('UPDATE spot_containers SET status = ? WHERE id = ? AND status = ?',
    ['booked', req.params.id, 'available'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(400).json({ error: 'Container not available' });
      res.json({ success: true });
    }
  );
});

router.get('/bid-slots', (req: Request, res: Response) => {
  const { status } = req.query;
  let query = `
    SELECT bs.*, v.voyage_number, v.origin_port, v.destination_port, v.etd, v.eta,
           ves.name as vessel_name
    FROM bid_slots bs
    JOIN voyages v ON bs.voyage_id = v.id
    JOIN vessels ves ON v.vessel_id = ves.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (status) {
    query += ' AND bs.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY bs.bid_start ASC';
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/special-equipment', (req: Request, res: Response) => {
  const { status, type } = req.query;
  let query = `
    SELECT se.*, u.name as owner_name, u.company as owner_company
    FROM special_equipment se
    JOIN users u ON se.owner_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (status) {
    query += ' AND se.status = ?';
    params.push(status);
  }
  if (type) {
    query += ' AND se.type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY se.created_at DESC';
  
  db.all(query, params, (err, rows: any[]) => {
    if (err) return res.status(500).json({ error: err.message });
    const result = rows.map(r => ({
      ...r,
      parameters: parseJSONField(r.parameters, {}),
      certificates: parseJSONField(r.certificates, [])
    }));
    res.json(result);
  });
});

router.get('/special-equipment/:id', (req: Request, res: Response) => {
  db.get(`
    SELECT se.*, u.name as owner_name, u.company as owner_company
    FROM special_equipment se
    JOIN users u ON se.owner_id = u.id
    WHERE se.id = ?
  `, [req.params.id], (err, row: any) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Equipment not found' });
    row.parameters = parseJSONField(row.parameters, {});
    row.certificates = parseJSONField(row.certificates, []);
    res.json(row);
  });
});

router.get('/rental-orders', (req: Request, res: Response) => {
  const { status, renter_id } = req.query;
  let query = `
    SELECT ro.*, se.name as equipment_name, se.type as equipment_type,
           u.name as owner_name, u.company as owner_company
    FROM rental_orders ro
    JOIN special_equipment se ON ro.equipment_id = se.id
    JOIN users u ON se.owner_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (status) {
    query += ' AND ro.status = ?';
    params.push(status);
  }
  if (renter_id) {
    query += ' AND ro.renter_id = ?';
    params.push(renter_id);
  }
  
  query += ' ORDER BY ro.created_at DESC';
  
  db.all(query, params, (err, rows: any[]) => {
    if (err) return res.status(500).json({ error: err.message });
    const result = rows.map(r => ({
      ...r,
      monitoring_data: parseJSONField(r.monitoring_data, {})
    }));
    res.json(result);
  });
});

router.post('/rental-orders', (req: Request, res: Response) => {
  const id = uuidv4();
  const { equipment_id, renter_id, start_date, end_date, delivery_address } = req.body;
  
  db.run(`INSERT INTO rental_orders (id, equipment_id, renter_id, start_date, end_date, status, delivery_address)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    [id, equipment_id, renter_id, start_date, end_date, delivery_address],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, ...req.body, status: 'pending' });
    }
  );
});

router.get('/orders', (req: Request, res: Response) => {
  const { status, buyer_id, seller_id, order_type } = req.query;
  let query = `
    SELECT o.*, 
           ub.name as buyer_name, ub.company as buyer_company,
           us.name as seller_name, us.company as seller_company
    FROM orders o
    JOIN users ub ON o.buyer_id = ub.id
    JOIN users us ON o.seller_id = us.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (status) {
    query += ' AND o.status = ?';
    params.push(status);
  }
  if (buyer_id) {
    query += ' AND o.buyer_id = ?';
    params.push(buyer_id);
  }
  if (seller_id) {
    query += ' AND o.seller_id = ?';
    params.push(seller_id);
  }
  if (order_type) {
    query += ' AND o.order_type = ?';
    params.push(order_type);
  }
  
  query += ' ORDER BY o.created_at DESC';
  
  db.all(query, params, (err, rows: any[]) => {
    if (err) return res.status(500).json({ error: err.message });
    const result = rows.map(r => ({
      ...r,
      tracking_data: parseJSONField(r.tracking_data, {})
    }));
    res.json(result);
  });
});

router.get('/orders/:id', (req: Request, res: Response) => {
  db.get(`
    SELECT o.*,
           ub.name as buyer_name, ub.company as buyer_company,
           us.name as seller_name, us.company as seller_company
    FROM orders o
    JOIN users ub ON o.buyer_id = ub.id
    JOIN users us ON o.seller_id = us.id
    WHERE o.id = ?
  `, [req.params.id], (err, row: any) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Order not found' });
    row.tracking_data = parseJSONField(row.tracking_data, {});
    res.json(row);
  });
});

router.get('/orders/:id/tracking', (req: Request, res: Response) => {
  db.all('SELECT * FROM tracking_events WHERE order_id = ? ORDER BY timestamp DESC',
    [req.params.id],
    (err, rows: any[]) => {
      if (err) return res.status(500).json({ error: err.message });
      const result = rows.map(r => ({
        ...r,
        geo_data: parseJSONField(r.geo_data, {})
      }));
      res.json(result);
    }
  );
});

router.get('/alerts', (req: Request, res: Response) => {
  const { status, severity } = req.query;
  let query = 'SELECT * FROM alerts WHERE 1=1';
  const params: any[] = [];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (severity) {
    query += ' AND severity = ?';
    params.push(severity);
  }
  
  query += ' ORDER BY created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.put('/alerts/:id/resolve', (req: Request, res: Response) => {
  db.run('UPDATE alerts SET status = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?',
    ['resolved', req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Alert not found' });
      res.json({ success: true });
    }
  );
});

router.get('/freight-index/trend', async (req: Request, res: Response) => {
  try {
    const route = req.query.route as string || '上海-洛杉矶';
    const trend = await getFreightIndexTrend(route);
    res.json(trend);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard/overview', (req: Request, res: Response) => {
  db.serialize(() => {
    const stats: any = {};
    
    db.get('SELECT COUNT(*) as count FROM vessels', (err, row: any) => {
      stats.totalVessels = row?.count || 0;
    });
    
    db.get('SELECT COUNT(*) as count FROM voyages WHERE status IN (?, ?)', ['published', 'loading'], (err, row: any) => {
      stats.activeVoyages = row?.count || 0;
    });
    
    db.get('SELECT COUNT(*) as count FROM cargo_bookings WHERE status = ?', ['inquiry'], (err, row: any) => {
      stats.pendingBookings = row?.count || 0;
    });
    
    db.get('SELECT COUNT(*) as count FROM vessel_listings WHERE status = ?', ['active'], (err, row: any) => {
      stats.activeListings = row?.count || 0;
    });
    
    db.get('SELECT COUNT(*) as count FROM orders', (err, row: any) => {
      stats.totalOrders = row?.count || 0;
    });
    
    db.get('SELECT COUNT(*) as count FROM alerts WHERE status = ?', ['active'], (err, row: any) => {
      stats.activeAlerts = row?.count || 0;
      
      res.json(stats);
    });
  });
});

router.get('/dashboard/heatmap-data', (req: Request, res: Response) => {
  db.all(`
    SELECT v.current_port as port, COUNT(*) as vessel_count, SUM(v.teu) as total_teu,
           v.latitude, v.longitude
    FROM vessels v
    WHERE v.status IN ('available', 'in_transit')
    GROUP BY v.current_port, v.latitude, v.longitude
    ORDER BY vessel_count DESC
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/dashboard/compliance-rate', (req: Request, res: Response) => {
  const mockData = {
    overallRate: 87.5,
    byRoute: [
      { route: '上海-洛杉矶', rate: 92.3, totalVoyages: 45, delayed: 3 },
      { route: '上海-鹿特丹', rate: 85.1, totalVoyages: 38, delayed: 6 },
      { route: '宁波-汉堡', rate: 89.7, totalVoyages: 32, delayed: 3 },
      { route: '深圳-新加坡', rate: 95.2, totalVoyages: 58, delayed: 3 },
      { route: '釜山-纽约', rate: 82.4, totalVoyages: 28, delayed: 5 },
    ],
    reasons: [
      { reason: '恶劣天气', count: 12, percentage: 35.3 },
      { reason: '港口拥堵', count: 10, percentage: 29.4 },
      { reason: '集装箱短缺', count: 6, percentage: 17.6 },
      { reason: '单证问题', count: 4, percentage: 11.8 },
      { reason: '其他', count: 2, percentage: 5.9 },
    ]
  };
  res.json(mockData);
});

export default router;
