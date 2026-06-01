const db = require('../models/database');
const fraudDetection = require('../services/fraudDetection');

exports.createListing = (req, res) => {
  const {
    category_id, category_code, title, description,
    price_min, price_max, price_unit,
    location, latitude, longitude, city, district,
    images, videos, cert_files,
    area, rooms, bathrooms, floor,
    car_brand, car_model, car_year, car_mileage, car_transmission,
    job_title, job_salary_min, job_salary_max, job_experience, job_education,
    service_type, service_hours,
    valid_to, custom_fields
  } = req.body;

  if (!category_id || !title) {
    return res.status(400).json({ error: '分类和标题不能为空' });
  }

  const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ? AND is_approved = 1').get(req.user.id);

  const validToDate = valid_to || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const result = db.prepare(`
    INSERT INTO listings (
      user_id, merchant_id, category_id, category_code,
      title, description, price_min, price_max, price_unit,
      location, latitude, longitude, city, district,
      images, videos, cert_files,
      area, rooms, bathrooms, floor,
      car_brand, car_model, car_year, car_mileage, car_transmission,
      job_title, job_salary_min, job_salary_max, job_experience, job_education,
      service_type, service_hours,
      is_verified, valid_to
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    merchant?.id || null,
    category_id, category_code,
    title, description, price_min, price_max, price_unit,
    location, latitude, longitude, city, district,
    images ? JSON.stringify(images) : null,
    videos ? JSON.stringify(videos) : null,
    cert_files ? JSON.stringify(cert_files) : null,
    area, rooms, bathrooms, floor,
    car_brand, car_model, car_year, car_mileage, car_transmission,
    job_title, job_salary_min, job_salary_max, job_experience, job_education,
    service_type, service_hours,
    merchant ? 1 : 0,
    validToDate
  );

  const listingId = result.lastInsertRowid;

  if (custom_fields && Array.isArray(custom_fields)) {
    const insertField = db.prepare('INSERT INTO listing_fields (listing_id, field_key, field_value) VALUES (?, ?, ?)');
    custom_fields.forEach(field => {
      insertField.run(listingId, field.key, field.value);
    });
  }

  const fraudResult = fraudDetection.runFullCheck({ id: listingId, title, description, images });
  db.prepare(`
    INSERT INTO fraud_detections (listing_id, detection_type, score, details, is_flagged)
    VALUES (?, ?, ?, ?, ?)
  `).run(listingId, 'full_check', fraudResult.totalScore, JSON.stringify(fraudResult.checks), fraudResult.isFlagged ? 1 : 0);

  if (fraudResult.isFlagged) {
    db.prepare('UPDATE listings SET status = ? WHERE id = ?').run('rejected', listingId);
  }

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listingId);
  res.status(201).json({ listing });
};

exports.getListings = (req, res) => {
  const {
    keyword, category_code, category_id,
    city, district, min_price, max_price,
    lat, lng, radius = 5,
    is_verified, is_urgent,
    days_ago, area_min, area_max, rooms, house_type,
    car_brand, car_year, car_mileage, car_transmission,
    job_education, job_experience, job_salary_min, job_salary_max,
    service_type,
    page = 1, page_size = 20,
    sort_by = 'created_at', sort_order = 'DESC'
  } = req.query;

  let query = "SELECT l.*, u.nickname as author_name, u.avatar as author_avatar, m.company_name as merchant_name, m.level as merchant_level, m.rating as merchant_rating, m.business_license, m.total_deals, m.response_rate, m.avg_response_time, m.is_approved FROM listings l LEFT JOIN users u ON l.user_id = u.id LEFT JOIN merchants m ON l.merchant_id = m.id WHERE l.status = 'active'";
  const params = [];

  if (keyword) {
    query += ' AND (l.title LIKE ? OR l.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (category_code) {
    query += ' AND l.category_code = ?';
    params.push(category_code);
  }

  if (category_id) {
    query += ' AND l.category_id = ?';
    params.push(category_id);
  }

  if (city) {
    query += ' AND l.city LIKE ?';
    params.push(`%${city}%`);
  }

  if (district) {
    query += ' AND l.district LIKE ?';
    params.push(`%${district}%`);
  }

  if (min_price) {
    query += ' AND l.price_min >= ?';
    params.push(min_price);
  }

  if (max_price) {
    query += ' AND l.price_max <= ?';
    params.push(max_price);
  }

  if (is_verified === '1') {
    query += ' AND l.is_verified = 1';
  }

  if (is_urgent === '1') {
    query += ' AND l.is_urgent = 1';
  }

  if (days_ago) {
    query += " AND l.created_at >= datetime('now', ?)";
    params.push(`-${days_ago} days`);
  }

  if (area_min) {
    query += ' AND l.area >= ?';
    params.push(area_min);
  }

  if (area_max) {
    query += ' AND l.area <= ?';
    params.push(area_max);
  }

  if (rooms) {
    query += ' AND l.rooms = ?';
    const roomNum = rooms.replace(/[^0-9]/g, '');
    params.push(roomNum);
  }

  if (house_type) {
    query += ' AND l.house_type = ?';
    params.push(house_type);
  }

  if (car_brand) {
    query += ' AND l.car_brand LIKE ?';
    params.push(`%${car_brand}%`);
  }

  if (car_year) {
    const now = new Date().getFullYear();
    if (car_year === '1年以内') {
      query += ' AND l.car_year >= ?';
      params.push(now - 1);
    } else if (car_year === '1-3年') {
      query += ' AND l.car_year BETWEEN ? AND ?';
      params.push(now - 3, now - 1);
    } else if (car_year === '3-5年') {
      query += ' AND l.car_year BETWEEN ? AND ?';
      params.push(now - 5, now - 3);
    } else if (car_year === '5-8年') {
      query += ' AND l.car_year BETWEEN ? AND ?';
      params.push(now - 8, now - 5);
    } else if (car_year === '8年以上') {
      query += ' AND l.car_year <= ?';
      params.push(now - 8);
    }
  }

  if (car_mileage) {
    if (car_mileage === '1万公里内') {
      query += ' AND l.car_mileage <= 1';
    } else if (car_mileage === '1-3万公里') {
      query += ' AND l.car_mileage BETWEEN 1 AND 3';
    } else if (car_mileage === '3-6万公里') {
      query += ' AND l.car_mileage BETWEEN 3 AND 6';
    } else if (car_mileage === '6-10万公里') {
      query += ' AND l.car_mileage BETWEEN 6 AND 10';
    } else if (car_mileage === '10万公里以上') {
      query += ' AND l.car_mileage >= 10';
    }
  }

  if (car_transmission) {
    query += ' AND l.car_transmission = ?';
    params.push(car_transmission);
  }

  if (job_salary_min) {
    query += ' AND l.job_salary_min >= ?';
    params.push(job_salary_min);
  }

  if (job_salary_max) {
    query += ' AND l.job_salary_max <= ?';
    params.push(job_salary_max);
  }

  if (job_education) {
    query += ' AND l.job_education = ?';
    params.push(job_education);
  }

  if (job_experience) {
    query += ' AND l.job_experience = ?';
    params.push(job_experience);
  }

  if (service_type) {
    query += ' AND l.service_type LIKE ?';
    params.push(`%${service_type}%`);
  }

  const sortFields = ['created_at', 'price_min', 'view_count', 'updated_at'];
  const sortField = sortFields.includes(sort_by) ? sort_by : 'created_at';
  query += ` ORDER BY l.${sortField} ${sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}`;
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

  const listings = db.prepare(query).all(...params);

  const countQuery = query.split(' ORDER BY')[0].replace('SELECT l.*, u.nickname as author_name, u.avatar as author_avatar, m.company_name as merchant_name, m.level as merchant_level, m.rating as merchant_rating, m.business_license, m.total_deals, m.response_rate, m.avg_response_time, m.is_approved', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countQuery).get(...params.slice(0, params.length - 2));

  listings.forEach(listing => {
    if (listing.images) listing.images = JSON.parse(listing.images);
    if (listing.videos) listing.videos = JSON.parse(listing.videos);
  });

  res.json({ listings, total, page: parseInt(page), page_size: parseInt(page_size) });
};

exports.getListing = (req, res) => {
  const { id } = req.params;

  const listing = db.prepare(`
    SELECT l.*, u.nickname as author_name, u.avatar as author_avatar, u.phone as author_phone,
           m.company_name as merchant_name, m.level as merchant_level, m.rating as merchant_rating,
           m.business_license, m.license_image, m.total_deals, m.response_rate, m.avg_response_time,
           m.is_approved, m.created_at as merchant_created_at
    FROM listings l 
    LEFT JOIN users u ON l.user_id = u.id
    LEFT JOIN merchants m ON l.merchant_id = m.id
    WHERE l.id = ?
  `).get(id);

  if (!listing) {
    return res.status(404).json({ error: '信息不存在' });
  }

  if (listing.images) listing.images = JSON.parse(listing.images);
  if (listing.videos) listing.videos = JSON.parse(listing.videos);
  if (listing.cert_files) listing.cert_files = JSON.parse(listing.cert_files);

  listing.custom_fields = db.prepare('SELECT field_key, field_value FROM listing_fields WHERE listing_id = ?').all(id);

  const fraudCheck = db.prepare('SELECT * FROM fraud_detections WHERE listing_id = ? ORDER BY created_at DESC LIMIT 1').get(id);
  if (fraudCheck) {
    listing.fraud_check = {
      score: fraudCheck.score,
      is_flagged: fraudCheck.is_flagged === 1,
      details: fraudCheck.details ? JSON.parse(fraudCheck.details) : null
    };
  }

  db.prepare('UPDATE listings SET view_count = view_count + 1 WHERE id = ?').run(id);

  if (req.user) {
    db.prepare('INSERT OR IGNORE INTO browse_history (user_id, listing_id) VALUES (?, ?)').run(req.user.id, id);
  }

  res.json({ listing });
};

exports.updateListing = (req, res) => {
  const { id } = req.params;
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(id);

  if (!listing) {
    return res.status(404).json({ error: '信息不存在' });
  }

  if (listing.user_id !== req.user.id && req.user.user_type !== 'admin') {
    return res.status(403).json({ error: '无权限修改' });
  }

  const { title, description, price_min, price_max, status } = req.body;

  db.prepare(`
    UPDATE listings SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      price_min = COALESCE(?, price_min),
      price_max = COALESCE(?, price_max),
      status = COALESCE(?, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, description, price_min, price_max, status, id);

  const updated = db.prepare('SELECT * FROM listings WHERE id = ?').get(id);
  res.json({ listing: updated });
};

exports.deleteListing = (req, res) => {
  const { id } = req.params;
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(id);

  if (!listing) {
    return res.status(404).json({ error: '信息不存在' });
  }

  if (listing.user_id !== req.user.id && req.user.user_type !== 'admin') {
    return res.status(403).json({ error: '无权限删除' });
  }

  db.prepare("UPDATE listings SET status = 'deleted' WHERE id = ?").run(id);
  res.json({ success: true });
};

exports.getMyListings = (req, res) => {
  const { status, page = 1, page_size = 20 } = req.query;

  let query = 'SELECT * FROM listings WHERE user_id = ?';
  const params = [req.user.id];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

  const listings = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as total FROM listings WHERE user_id = ?' + (status ? ' AND status = ?' : '')).get(...params.slice(0, params.length - 2));

  listings.forEach(l => {
    if (l.images) l.images = JSON.parse(l.images);
  });

  res.json({ listings, total: total.total });
};

exports.getBrowseHistory = (req, res) => {
  const { page = 1, page_size = 20 } = req.query;

  const rows = db.prepare(`
    SELECT l.*, u.nickname as author_name, bh.browsed_at
    FROM browse_history bh
    INNER JOIN listings l ON bh.listing_id = l.id
    LEFT JOIN users u ON l.user_id = u.id
    WHERE bh.user_id = ?
    ORDER BY bh.browsed_at DESC
    LIMIT ? OFFSET ?
  `).all(req.user.id, parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

  rows.forEach(l => {
    if (l.images) l.images = JSON.parse(l.images);
  });

  res.json({ listings: rows });
};
