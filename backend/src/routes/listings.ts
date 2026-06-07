import { Router, Request, Response } from 'express';
import db from '../db/init';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      pageSize = '10',
      type,
      price_min,
      price_max,
      area_min,
      area_max,
      rooms,
      building_id,
      district,
      search,
      school_district,
      subway
    } = req.query;
    const pageNum = Number(page);
    const sizeNum = Number(pageSize);
    const offset = (pageNum - 1) * sizeNum;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (type) { where += ' AND l.type = ?'; params.push(type); }
    if (price_min) { where += ' AND l.price >= ?'; params.push(Number(price_min)); }
    if (price_max) { where += ' AND l.price <= ?'; params.push(Number(price_max)); }
    if (area_min) { where += ' AND l.area >= ?'; params.push(Number(area_min)); }
    if (area_max) { where += ' AND l.area <= ?'; params.push(Number(area_max)); }
    if (rooms) { where += ' AND l.rooms LIKE ?'; params.push(`%${rooms}%`); }
    if (building_id) { where += ' AND l.building_id = ?'; params.push(Number(building_id)); }
    if (district) { where += ' AND b.district = ?'; params.push(district); }
    if (school_district) { where += " AND b.school_district IS NOT NULL AND b.school_district != ''"; }
    if (subway) { where += " AND b.subway_lines IS NOT NULL AND b.subway_lines != ''"; }
    if (search) {
      where += ` AND (
        l.title LIKE ? OR l.description LIKE ? OR b.name LIKE ? OR b.address LIKE ?
        OR b.district LIKE ? OR b.school_district LIKE ? OR b.subway_lines LIKE ?
      )`;
      const like = `%${search}%`;
      params.push(like, like, like, like, like, like, like);
    }

    const total = (db.prepare(`SELECT COUNT(*) as cnt FROM listings l LEFT JOIN buildings b ON l.building_id = b.id ${where}`).get(...params) as any).cnt;
    const rows = db.prepare(`
      SELECT l.*, b.name as building_name, b.district, b.address as building_address,
        b.lat, b.lng, b.school_district, b.subway_lines
      FROM listings l LEFT JOIN buildings b ON l.building_id = b.id ${where}
      ORDER BY l.id DESC LIMIT ? OFFSET ?
    `).all(...params, sizeNum, offset);

    res.json({ code: 0, data: { list: rows, total, page: pageNum, pageSize: sizeNum }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.get('/nearby', (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = '3' } = req.query;
    if (!lat || !lng) { res.json({ code: -1, message: '缺少 lat/lng 参数' }); return; }

    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radiusNum = Number(radius);

    const allRows = db.prepare(`
      SELECT l.*, b.name as building_name, b.district, b.lat, b.lng,
        (6371 * ACOS(COS(RADIANS(?)) * COS(RADIANS(b.lat)) * COS(RADIANS(b.lng) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(b.lat)))) AS distance
      FROM listings l
      JOIN buildings b ON l.building_id = b.id
      WHERE l.status = '在售'
      ORDER BY distance ASC
    `).all(latNum, lngNum, latNum) as any[];

    const rows = allRows.filter(r => r.distance <= radiusNum).slice(0, 20);

    res.json({ code: 0, data: rows, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const listing = db.prepare(`
      SELECT l.*, b.name as building_name, b.district, b.address as building_address, b.lat, b.lng, b.school_district, b.subway_lines
      FROM listings l LEFT JOIN buildings b ON l.building_id = b.id WHERE l.id = ?
    `).get(req.params.id) as any;
    if (!listing) { res.json({ code: -1, message: '房源不存在' }); return; }

    let agent = null;
    if (listing.agent_id) {
      agent = db.prepare('SELECT id, name, phone, avatar, agency, rating, specialties FROM agents WHERE id = ?').get(listing.agent_id);
    }

    const reviews = db.prepare(`
      SELECT r.* FROM reviews r WHERE r.building_id = ? ORDER BY r.created_at DESC LIMIT 5
    `).all(listing.building_id);

    res.json({ code: 0, data: { listing, agent, reviews }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const l = req.body;
    const type = l.type || l.listing_type || '二手房';
    const buildingId = Number(l.building_id || 1);
    const area = Number(l.area || 0);
    const price = Number(l.price || 0);
    const rooms = typeof l.rooms === 'number' ? `${l.rooms}室1厅` : (l.rooms || '2室1厅');
    const unit_price = area && price ? Math.round(price * 10000 / area) : (l.unit_price || 0);

    const result = db.prepare(`
      INSERT INTO listings (building_id, title, type, price, area, unit_price, rooms, floor, orientation, decoration, vr_url, property_status, transaction_history, agent_id, owner_name, owner_phone, description, images, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      buildingId, l.title, type, price, area, unit_price,
      rooms, l.floor || '中层', l.orientation || '南', l.decoration || '精装', l.vr_url || '',
      l.property_status || 'pending', l.transaction_history ? JSON.stringify(l.transaction_history) : JSON.stringify([]),
      l.agent_id || 1, l.owner_name || '业主', l.owner_phone || '138****0000', l.description || '',
      l.images ? JSON.stringify(l.images) : null, l.status || '在售'
    );

    res.json({ code: 0, data: { id: result.lastInsertRowid }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const l = req.body;
    let unit_price = l.unit_price;
    if (l.price && l.area) { unit_price = Math.round(l.price * 10000 / l.area); }

    db.prepare(`
      UPDATE listings SET building_id=COALESCE(?,building_id), title=COALESCE(?,title), type=COALESCE(?,type),
        price=COALESCE(?,price), area=COALESCE(?,area), unit_price=COALESCE(?,unit_price),
        rooms=COALESCE(?,rooms), floor=COALESCE(?,floor), orientation=COALESCE(?,orientation),
        decoration=COALESCE(?,decoration), vr_url=COALESCE(?,vr_url), property_status=COALESCE(?,property_status),
        transaction_history=COALESCE(?,transaction_history), agent_id=COALESCE(?,agent_id),
        owner_name=COALESCE(?,owner_name), owner_phone=COALESCE(?,owner_phone),
        description=COALESCE(?,description), images=COALESCE(?,images),
        status=COALESCE(?,status), updated_at=datetime('now','localtime')
      WHERE id = ?
    `).run(
      l.building_id, l.title, l.type, l.price, l.area, unit_price,
      l.rooms, l.floor, l.orientation, l.decoration, l.vr_url, l.property_status,
      l.transaction_history ? JSON.stringify(l.transaction_history) : undefined,
      l.agent_id, l.owner_name, l.owner_phone, l.description,
      l.images ? JSON.stringify(l.images) : undefined, l.status, req.params.id
    );

    res.json({ code: 0, data: { id: req.params.id }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.post('/:id/verify-property', (req: Request, res: Response) => {
  try {
    const listing = db.prepare('SELECT id, property_status, owner_name, building_id FROM listings WHERE id = ?').get(req.params.id) as any;
    if (!listing) {
      res.json({ code: -1, message: '房源不存在' });
      return;
    }

    const { property_certificate_no, has_mortgage, has_seizure, verification_conclusion, reviewer_name, reviewer_id, notes } = req.body;

    const result = db.prepare(`
      INSERT INTO property_verifications (listing_id, property_certificate_no, has_mortgage, has_seizure, verification_conclusion, reviewer_name, reviewer_id, verification_time, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'), 'verified', ?)
    `).run(
      req.params.id,
      property_certificate_no || '',
      has_mortgage ? 1 : 0,
      has_seizure ? 1 : 0,
      verification_conclusion || '',
      reviewer_name || '系统审核',
      reviewer_id || null,
      notes || ''
    );

    const newStatus = has_mortgage || has_seizure ? 'mortgaged' : 'verified';
    db.prepare("UPDATE listings SET property_status = ?, updated_at = datetime('now','localtime') WHERE id = ?").run(newStatus, req.params.id);

    const verification = db.prepare('SELECT * FROM property_verifications WHERE id = ?').get(result.lastInsertRowid);

    res.json({ code: 0, data: { id: req.params.id, property_status: newStatus, verification }, message: '产权核验完成' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.get('/:id/verifications', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT pv.*, l.title as listing_title
      FROM property_verifications pv
      LEFT JOIN listings l ON pv.listing_id = l.id
      WHERE pv.listing_id = ?
      ORDER BY pv.created_at DESC
    `).all(req.params.id);

    res.json({ code: 0, data: { list: rows, total: rows.length }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.get('/:id/annotations', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT va.*, a.name as creator_name
      FROM vr_annotations va
      LEFT JOIN agents a ON va.created_by = a.id
      WHERE va.listing_id = ?
      ORDER BY va.created_at DESC
    `).all(req.params.id);

    res.json({ code: 0, data: { list: rows, total: rows.length }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.post('/:id/annotations', (req: Request, res: Response) => {
  try {
    const { name, position_x, position_y, description, room, created_by } = req.body;
    if (!name || position_x === undefined || position_y === undefined) {
      res.json({ code: -1, message: '缺少必填参数' });
      return;
    }

    const result = db.prepare(`
      INSERT INTO vr_annotations (listing_id, name, position_x, position_y, description, room, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.params.id,
      name,
      Number(position_x),
      Number(position_y),
      description || '',
      room || '',
      created_by || null
    );

    const annotation = db.prepare('SELECT * FROM vr_annotations WHERE id = ?').get(result.lastInsertRowid);

    res.json({ code: 0, data: annotation, message: '标注添加成功' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.delete('/annotations/:id', (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM vr_annotations WHERE id = ?').run(req.params.id);
    res.json({ code: 0, data: null, message: '标注已删除' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.get('/:id/shares', (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT vs.*, l.title as listing_title, a.name as agent_name
      FROM vr_shares vs
      LEFT JOIN listings l ON vs.listing_id = l.id
      LEFT JOIN agents a ON vs.agent_id = a.id
      WHERE vs.listing_id = ?
      ORDER BY vs.created_at DESC
    `).all(req.params.id);

    res.json({ code: 0, data: { list: rows, total: rows.length }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.post('/:id/shares', (req: Request, res: Response) => {
  try {
    const { share_type, agent_id, client_name, client_phone, expires_at, can_annotate, created_by } = req.body;

    const shareCode = `VR-${Date.now().toString(36).toUpperCase()}`;
    const defaultExpires = new Date();
    defaultExpires.setDate(defaultExpires.getDate() + 30);

    const result = db.prepare(`
      INSERT INTO vr_shares (listing_id, share_code, share_type, agent_id, client_name, client_phone, expires_at, can_annotate, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.params.id,
      shareCode,
      share_type || 'public',
      agent_id || null,
      client_name || '',
      client_phone || '',
      expires_at || defaultExpires.toISOString().slice(0, 19).replace('T', ' '),
      can_annotate ? 1 : 0,
      created_by || null
    );

    const share = db.prepare('SELECT * FROM vr_shares WHERE id = ?').get(result.lastInsertRowid);

    res.json({ code: 0, data: share, message: '分享链接已生成' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.post('/shares/:code/view', (req: Request, res: Response) => {
  try {
    const share = db.prepare('SELECT * FROM vr_shares WHERE share_code = ?').get(req.params.code) as any;
    if (!share) {
      res.json({ code: -1, message: '分享链接无效' });
      return;
    }

    const now = new Date();
    if (share.expires_at && new Date(share.expires_at) < now) {
      res.json({ code: -1, message: '分享链接已过期' });
      return;
    }

    db.prepare("UPDATE vr_shares SET view_count = view_count + 1, last_viewed_at = datetime('now','localtime') WHERE share_code = ?").run(req.params.code);

    const updatedShare = db.prepare('SELECT * FROM vr_shares WHERE share_code = ?').get(req.params.code);

    res.json({ code: 0, data: updatedShare, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

router.get('/:id/deals-history', (req: Request, res: Response) => {
  try {
    const listing = db.prepare('SELECT deals_history FROM listings WHERE id = ?').get(req.params.id) as any;
    if (!listing) {
      res.json({ code: -1, message: '房源不存在' });
      return;
    }

    let history: any[] = [];
    if (listing.deals_history) {
      try {
        history = typeof listing.deals_history === 'string'
          ? JSON.parse(listing.deals_history)
          : listing.deals_history;
      } catch {
        history = [];
      }
    }

    res.json({ code: 0, data: { list: history, total: history.length }, message: 'success' });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

export default router;
