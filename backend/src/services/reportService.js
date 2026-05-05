const { query } = require('../config/database');
const ExcelJS = require('exceljs');

const getOverallStats = async () => {
  const dormitoryStats = await query(`
    SELECT COUNT(*) as total_dormitories FROM dormitories WHERE status = 'active'
  `);

  const roomStats = await query(`
    SELECT 
      COUNT(*) as total_rooms,
      COUNT(CASE WHEN status = 'available' THEN 1 END) as available_rooms,
      COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_rooms,
      COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_rooms
    FROM rooms
  `);

  const bedStats = await query(`
    SELECT 
      COUNT(*) as total_beds,
      COUNT(CASE WHEN status = 'available' THEN 1 END) as available_beds,
      COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_beds,
      COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_beds
    FROM beds
  `);

  const studentStats = await query(`
    SELECT 
      COUNT(*) as total_students,
      COUNT(CASE WHEN s.id IN (SELECT student_id FROM check_in_records WHERE status = 'active') THEN 1 END) as checked_in_students,
      COUNT(CASE WHEN s.id NOT IN (SELECT student_id FROM check_in_records WHERE status = 'active') THEN 1 END) as not_checked_in_students
    FROM students s
    WHERE s.status = 'active'
  `);

  const checkInStats = await query(`
    SELECT 
      COUNT(*) as total_check_ins,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_check_ins,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_check_ins
    FROM check_in_records
  `);

  const maintenanceStats = await query(`
    SELECT 
      COUNT(*) as total_tickets,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tickets,
      COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_tickets,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tickets
    FROM maintenance_tickets
  `);

  return {
    dormitories: dormitoryStats.rows[0],
    rooms: roomStats.rows[0],
    beds: bedStats.rows[0],
    students: studentStats.rows[0],
    checkIns: checkInStats.rows[0],
    maintenance: maintenanceStats.rows[0],
  };
};

const getDormitoryOccupancyStats = async () => {
  const result = await query(`
    SELECT 
      d.id, d.building_code, d.building_name, d.gender_type,
      COUNT(DISTINCT r.id) as total_rooms,
      COUNT(DISTINCT b.id) as total_beds,
      COUNT(DISTINCT CASE WHEN b.status = 'occupied' THEN b.id END) as occupied_beds,
      COUNT(DISTINCT CASE WHEN b.status = 'available' THEN b.id END) as available_beds,
      ROUND(
        CASE WHEN COUNT(DISTINCT b.id) > 0 
             THEN (COUNT(DISTINCT CASE WHEN b.status = 'occupied' THEN b.id END)::decimal / COUNT(DISTINCT b.id)::decimal) * 100 
             ELSE 0 
        END, 2
      ) as occupancy_rate
    FROM dormitories d
    LEFT JOIN rooms r ON d.id = r.dormitory_id
    LEFT JOIN beds b ON r.id = b.room_id
    WHERE d.status = 'active'
    GROUP BY d.id
    ORDER BY d.building_code
  `);

  return result.rows;
};

const getGenderDistribution = async () => {
  const result = await query(`
    SELECT 
      gender,
      COUNT(*) as count,
      ROUND(COUNT(*)::decimal / (SELECT COUNT(*) FROM students WHERE status = 'active')::decimal * 100, 2) as percentage
    FROM students
    WHERE status = 'active' AND gender IS NOT NULL
    GROUP BY gender
    ORDER BY count DESC
  `);

  return result.rows;
};

const getMajorDistribution = async () => {
  const result = await query(`
    SELECT 
      major,
      COUNT(*) as count,
      ROUND(COUNT(*)::decimal / (SELECT COUNT(*) FROM students WHERE status = 'active')::decimal * 100, 2) as percentage
    FROM students
    WHERE status = 'active' AND major IS NOT NULL
    GROUP BY major
    ORDER BY count DESC
  `);

  return result.rows;
};

const getRoomChangeStats = async (filters = {}) => {
  let queryText = `
    SELECT 
      COUNT(*) as total_changes,
      COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_changes,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_changes,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_changes
    FROM room_change_records
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (filters.startDate) {
    queryText += ` AND created_at >= $${paramIndex++}`;
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    queryText += ` AND created_at <= $${paramIndex++}`;
    params.push(filters.endDate);
  }

  const result = await query(queryText, params);
  return result.rows[0];
};

const getMonthlyCheckInStats = async (year) => {
  const targetYear = year || new Date().getFullYear();
  
  const result = await query(`
    SELECT 
      EXTRACT(MONTH FROM check_in_date) as month,
      COUNT(*) as count
    FROM check_in_records
    WHERE EXTRACT(YEAR FROM check_in_date) = $1
    GROUP BY EXTRACT(MONTH FROM check_in_date)
    ORDER BY month
  `, [targetYear]);

  const monthlyStats = Array(12).fill(0);
  result.rows.forEach(row => {
    monthlyStats[parseInt(row.month) - 1] = parseInt(row.count);
  });

  return {
    year: targetYear,
    months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    data: monthlyStats,
  };
};

const getMonthlyMaintenanceStats = async (year) => {
  const targetYear = year || new Date().getFullYear();
  
  const result = await query(`
    SELECT 
      EXTRACT(MONTH FROM created_at) as month,
      status,
      COUNT(*) as count
    FROM maintenance_tickets
    WHERE EXTRACT(YEAR FROM created_at) = $1
    GROUP BY EXTRACT(MONTH FROM created_at), status
    ORDER BY month
  `, [targetYear]);

  const monthlyData = {};
  for (let i = 1; i <= 12; i++) {
    monthlyData[i] = { pending: 0, processing: 0, completed: 0, rejected: 0 };
  }

  result.rows.forEach(row => {
    const month = parseInt(row.month);
    if (monthlyData[month]) {
      monthlyData[month][row.status] = parseInt(row.count);
    }
  });

  return {
    year: targetYear,
    months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    data: monthlyData,
  };
};

const exportToExcel = async (data, options = {}) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(options.sheetName || '报表');

  if (options.columns && options.columns.length > 0) {
    worksheet.columns = options.columns;
  }

  if (data && data.length > 0) {
    data.forEach(row => {
      worksheet.addRow(row);
    });
  }

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  return workbook;
};

module.exports = {
  getOverallStats,
  getDormitoryOccupancyStats,
  getGenderDistribution,
  getMajorDistribution,
  getRoomChangeStats,
  getMonthlyCheckInStats,
  getMonthlyMaintenanceStats,
  exportToExcel,
};