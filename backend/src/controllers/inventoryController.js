const { query } = require('../config/database');
const ExcelJS = require('exceljs');

const getInventoryList = async (req, res) => {
  try {
    const { page = 1, page_size = 10, keyword, type_id, min_quantity, max_quantity } = req.query;
    const offset = (page - 1) * page_size;

    let baseQuery = `FROM inventory i
                      LEFT JOIN products p ON i.product_id = p.id
                      LEFT JOIN product_types pt ON p.type_id = pt.id
                      WHERE 1=1`;
    let queryParams = [];
    let paramIndex = 1;

    if (keyword) {
      baseQuery += ` AND (p.product_name LIKE $${paramIndex} OR p.product_code LIKE $${paramIndex})`;
      queryParams.push(`%${keyword}%`);
      paramIndex++;
    }

    if (type_id) {
      baseQuery += ` AND p.type_id = $${paramIndex}`;
      queryParams.push(parseInt(type_id));
      paramIndex++;
    }

    if (min_quantity !== undefined && min_quantity !== '') {
      baseQuery += ` AND i.quantity >= $${paramIndex}`;
      queryParams.push(parseInt(min_quantity));
      paramIndex++;
    }

    if (max_quantity !== undefined && max_quantity !== '') {
      baseQuery += ` AND i.quantity <= $${paramIndex}`;
      queryParams.push(parseInt(max_quantity));
      paramIndex++;
    }

    const countResult = await query(`SELECT COUNT(*) as count ${baseQuery}`, queryParams);
    const total = parseInt(countResult.rows[0].count);

    const selectQuery = `SELECT i.*, p.product_code, p.product_name, p.unit, p.specification, 
                            p.min_stock, p.max_stock, pt.type_name
                          ${baseQuery}
                          ORDER BY i.updated_at DESC, i.id DESC 
                          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(page_size), offset);

    const result = await query(selectQuery, queryParams);

    const list = result.rows.map(row => ({
      ...row,
      stock_status: getStockStatus(row.quantity, row.min_stock, row.max_stock)
    }));

    res.json({
      success: true,
      data: {
        list,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total,
          total_pages: Math.ceil(total / page_size)
        }
      }
    });
  } catch (error) {
    console.error('Get inventory list error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取库存列表失败' 
    });
  }
};

const getStockStatus = (quantity, minStock, maxStock) => {
  if (quantity === 0) return 'out_of_stock';
  if (minStock && quantity < minStock) return 'low_stock';
  if (maxStock && quantity > maxStock) return 'over_stock';
  return 'normal';
};

const getInventoryStatistics = async (req, res) => {
  try {
    const { type_id } = req.query;

    let queryText = `SELECT 
                      COUNT(DISTINCT i.product_id) as total_products,
                      SUM(i.quantity) as total_quantity,
                      SUM(i.total_in) as total_in_quantity,
                      SUM(i.total_out) as total_out_quantity
                    FROM inventory i
                    LEFT JOIN products p ON i.product_id = p.id
                    WHERE 1=1`;
    let queryParams = [];
    let paramIndex = 1;

    if (type_id) {
      queryText += ` AND p.type_id = $${paramIndex}`;
      queryParams.push(parseInt(type_id));
      paramIndex++;
    }

    const summaryResult = await query(queryText, queryParams);

    let categoryQuery = `SELECT 
                          pt.id, pt.type_name,
                          COUNT(DISTINCT i.product_id) as product_count,
                          SUM(i.quantity) as total_quantity
                        FROM inventory i
                        LEFT JOIN products p ON i.product_id = p.id
                        LEFT JOIN product_types pt ON p.type_id = pt.id
                        WHERE 1=1`;
    let categoryParams = [];
    let categoryParamIndex = 1;

    if (type_id) {
      categoryQuery += ` AND p.type_id = $${categoryParamIndex}`;
      categoryParams.push(parseInt(type_id));
      categoryParamIndex++;
    }

    categoryQuery += ' GROUP BY pt.id, pt.type_name ORDER BY total_quantity DESC';

    const categoryResult = await query(categoryQuery, categoryParams);

    const warningQuery = `SELECT 
                            p.id, p.product_code, p.product_name, p.unit,
                            i.quantity, p.min_stock, p.max_stock
                          FROM inventory i
                          LEFT JOIN products p ON i.product_id = p.id
                          WHERE i.quantity = 0 OR (p.min_stock IS NOT NULL AND i.quantity < p.min_stock)
                          ORDER BY i.quantity ASC`;

    const warningResult = await query(warningQuery);

    const lowStockCount = warningResult.rows.filter(r => r.quantity > 0 && r.min_stock && r.quantity < r.min_stock).length;
    const outOfStockCount = warningResult.rows.filter(r => r.quantity === 0).length;

    res.json({
      success: true,
      data: {
        summary: {
          total_products: parseInt(summaryResult.rows[0].total_products) || 0,
          total_quantity: parseInt(summaryResult.rows[0].total_quantity) || 0,
          total_in_quantity: parseInt(summaryResult.rows[0].total_in_quantity) || 0,
          total_out_quantity: parseInt(summaryResult.rows[0].total_out_quantity) || 0,
          low_stock_count: lowStockCount,
          out_of_stock_count: outOfStockCount
        },
        by_category: categoryResult.rows,
        warning_items: warningResult.rows
      }
    });
  } catch (error) {
    console.error('Get inventory statistics error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取库存统计失败' 
    });
  }
};

const getInventoryDetail = async (req, res) => {
  try {
    const productId = parseInt(req.params.product_id);

    const inventoryResult = await query(
      `SELECT i.*, p.product_code, p.product_name, p.unit, p.specification, 
              p.min_stock, p.max_stock, pt.type_name
       FROM inventory i
       LEFT JOIN products p ON i.product_id = p.id
       LEFT JOIN product_types pt ON p.type_id = pt.id
       WHERE i.product_id = $1`,
      [productId]
    );

    if (inventoryResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '库存记录不存在' 
      });
    }

    const inventory = inventoryResult.rows[0];

    const recentInResult = await query(
      `SELECT si.id, si.in_no, si.created_at, sii.quantity, sii.unit_price, sii.amount
       FROM stock_in_items sii
       LEFT JOIN stock_in si ON sii.stock_in_id = si.id
       WHERE sii.product_id = $1 AND si.status = 'completed'
       ORDER BY si.created_at DESC
       LIMIT 10`,
      [productId]
    );

    const recentOutResult = await query(
      `SELECT so.id, so.out_no, so.created_at, soi.quantity, soi.unit_price, soi.amount, so.receiver
       FROM stock_out_items soi
       LEFT JOIN stock_out so ON soi.stock_out_id = so.id
       WHERE soi.product_id = $1 AND so.status = 'completed'
       ORDER BY so.created_at DESC
       LIMIT 10`,
      [productId]
    );

    res.json({
      success: true,
      data: {
        ...inventory,
        stock_status: getStockStatus(inventory.quantity, inventory.min_stock, inventory.max_stock),
        recent_in: recentInResult.rows,
        recent_out: recentOutResult.rows
      }
    });
  } catch (error) {
    console.error('Get inventory detail error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取库存详情失败' 
    });
  }
};

const exportInventory = async (req, res) => {
  try {
    const { keyword, type_id, min_quantity, max_quantity } = req.query;

    let queryText = `SELECT i.*, p.product_code, p.product_name, p.unit, p.specification, 
                            p.min_stock, p.max_stock, pt.type_name
                      FROM inventory i
                      LEFT JOIN products p ON i.product_id = p.id
                      LEFT JOIN product_types pt ON p.type_id = pt.id
                      WHERE 1=1`;
    let queryParams = [];
    let paramIndex = 1;

    if (keyword) {
      queryText += ` AND (p.product_name LIKE $${paramIndex} OR p.product_code LIKE $${paramIndex})`;
      queryParams.push(`%${keyword}%`);
      paramIndex++;
    }

    if (type_id) {
      queryText += ` AND p.type_id = $${paramIndex}`;
      queryParams.push(parseInt(type_id));
      paramIndex++;
    }

    if (min_quantity !== undefined && min_quantity !== '') {
      queryText += ` AND i.quantity >= $${paramIndex}`;
      queryParams.push(parseInt(min_quantity));
      paramIndex++;
    }

    if (max_quantity !== undefined && max_quantity !== '') {
      queryText += ` AND i.quantity <= $${paramIndex}`;
      queryParams.push(parseInt(max_quantity));
      paramIndex++;
    }

    queryText += ' ORDER BY i.updated_at DESC, i.id DESC';

    const result = await query(queryText, queryParams);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('库存列表');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: '商品编码', key: 'product_code', width: 20 },
      { header: '商品名称', key: 'product_name', width: 25 },
      { header: '商品类型', key: 'type_name', width: 15 },
      { header: '单位', key: 'unit', width: 10 },
      { header: '规格', key: 'specification', width: 20 },
      { header: '当前库存', key: 'quantity', width: 15 },
      { header: '累计入库', key: 'total_in', width: 15 },
      { header: '累计出库', key: 'total_out', width: 15 },
      { header: '最低库存', key: 'min_stock', width: 15 },
      { header: '最高库存', key: 'max_stock', width: 15 },
      { header: '库存状态', key: 'stock_status', width: 15 },
      { header: '最后入库时间', key: 'last_in_time', width: 20 },
      { header: '最后出库时间', key: 'last_out_time', width: 20 }
    ];

    const statusMap = {
      'out_of_stock': '缺货',
      'low_stock': '库存不足',
      'over_stock': '库存过高',
      'normal': '正常'
    };

    result.rows.forEach(row => {
      worksheet.addRow({
        id: row.id,
        product_code: row.product_code,
        product_name: row.product_name,
        type_name: row.type_name,
        unit: row.unit,
        specification: row.specification,
        quantity: row.quantity,
        total_in: row.total_in,
        total_out: row.total_out,
        min_stock: row.min_stock,
        max_stock: row.max_stock,
        stock_status: statusMap[getStockStatus(row.quantity, row.min_stock, row.max_stock)] || '未知',
        last_in_time: row.last_in_time ? new Date(row.last_in_time).toLocaleString('zh-CN') : '-',
        last_out_time: row.last_out_time ? new Date(row.last_out_time).toLocaleString('zh-CN') : '-'
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=inventory_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export inventory error:', error);
    res.status(500).json({ 
      success: false, 
      message: '导出库存列表失败' 
    });
  }
};

module.exports = {
  getInventoryList,
  getInventoryStatistics,
  getInventoryDetail,
  exportInventory
};