const db = require('../database/config');

const getScheduleById = (id) => {
  const stmt = db.prepare(`
    SELECT * FROM shipping_schedules WHERE id = ?
  `);

  return stmt.get(id);
};

const getSchedules = (options = {}) => {
  const {
    status,
    departurePort,
    arrivalPort,
    startDate,
    endDate,
    searchText,
    limit = 20,
    offset = 0,
  } = options;

  let conditions = ['1=1'];
  let params = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (departurePort) {
    conditions.push('departure_port LIKE ?');
    params.push(`%${departurePort}%`);
  }
  if (arrivalPort) {
    conditions.push('arrival_port LIKE ?');
    params.push(`%${arrivalPort}%`);
  }
  if (startDate) {
    conditions.push('departure_date >= ?');
    params.push(startDate);
  }
  if (endDate) {
    conditions.push('departure_date <= ?');
    params.push(endDate);
  }
  if (searchText) {
    conditions.push('(vessel_name LIKE ? OR voyage_number LIKE ? OR schedule_code LIKE ?)');
    params.push(`%${searchText}%`, `%${searchText}%`, `%${searchText}%`);
  }

  const whereClause = conditions.join(' AND ');

  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM shipping_schedules WHERE ${whereClause}
  `);
  const countResult = countStmt.get(...params);
  const total = countResult.total;

  params.push(limit, offset);
  const dataStmt = db.prepare(`
    SELECT * FROM shipping_schedules
    WHERE ${whereClause}
    ORDER BY departure_date ASC
    LIMIT ? OFFSET ?
  `);

  const data = dataStmt.all(...params);

  return {
    total,
    data,
    limit,
    offset,
  };
};

const getAvailableSchedules = (options = {}) => {
  return getSchedules({ ...options, status: 'available' });
};

const createSchedule = (scheduleData) => {
  const {
    scheduleCode,
    vesselName,
    voyageNumber,
    departurePort,
    arrivalPort,
    departureDate,
    arrivalDate,
    shippingCompany,
    status,
  } = scheduleData;

  const stmt = db.prepare(`
    INSERT INTO shipping_schedules (
      schedule_code, vessel_name, voyage_number, departure_port, arrival_port,
      departure_date, arrival_date, shipping_company, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const result = stmt.run(
    scheduleCode,
    vesselName,
    voyageNumber,
    departurePort,
    arrivalPort,
    departureDate,
    arrivalDate,
    shippingCompany || null,
    status || 'available'
  );

  return {
    success: true,
    data: {
      id: result.lastInsertRowid,
      scheduleCode,
    },
  };
};

const updateSchedule = (id, scheduleData) => {
  const {
    vesselName,
    voyageNumber,
    departurePort,
    arrivalPort,
    departureDate,
    arrivalDate,
    shippingCompany,
    status,
  } = scheduleData;

  const schedule = getScheduleById(id);
  if (!schedule) {
    return { success: false, message: '船期不存在' };
  }

  const stmt = db.prepare(`
    UPDATE shipping_schedules 
    SET vessel_name = ?, voyage_number = ?, departure_port = ?, arrival_port = ?,
        departure_date = ?, arrival_date = ?, shipping_company = ?, status = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `);

  const result = stmt.run(
    vesselName || schedule.vessel_name,
    voyageNumber || schedule.voyage_number,
    departurePort || schedule.departure_port,
    arrivalPort || schedule.arrival_port,
    departureDate || schedule.departure_date,
    arrivalDate || schedule.arrival_date,
    shippingCompany !== undefined ? shippingCompany : schedule.shipping_company,
    status || schedule.status,
    id
  );

  return {
    success: result.changes > 0,
    data: {
      id,
      updated: result.changes > 0,
    },
  };
};

const deleteSchedule = (id) => {
  const schedule = getScheduleById(id);
  if (!schedule) {
    return { success: false, message: '船期不存在' };
  }

  const checkUsage = db.prepare(`
    SELECT COUNT(*) as count FROM booking_mains WHERE schedule_id = ?
  `);
  const usageResult = checkUsage.get(id);

  if (usageResult.count > 0) {
    return { 
      success: false, 
      message: `该船期已被 ${usageResult.count} 个订舱单使用，无法删除` 
    };
  }

  const stmt = db.prepare(`DELETE FROM shipping_schedules WHERE id = ?`);
  const result = stmt.run(id);

  return {
    success: result.changes > 0,
    data: {
      id,
      deleted: result.changes > 0,
    },
  };
};

const getPorts = () => {
  const stmt = db.prepare(`
    SELECT DISTINCT departure_port as port_name FROM shipping_schedules
    UNION
    SELECT DISTINCT arrival_port as port_name FROM shipping_schedules
    ORDER BY port_name
  `);

  return stmt.all().map(row => row.port_name);
};

const getShippingCompanies = () => {
  const stmt = db.prepare(`
    SELECT DISTINCT shipping_company FROM shipping_schedules
    WHERE shipping_company IS NOT NULL AND shipping_company != ''
    ORDER BY shipping_company
  `);

  return stmt.all().map(row => row.shipping_company);
};

module.exports = {
  getScheduleById,
  getSchedules,
  getAvailableSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getPorts,
  getShippingCompanies,
};
