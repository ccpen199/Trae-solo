const { validationResult } = require('express-validator');
const { query, getClient } = require('../config/database');

const generateOutNo = async () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `OUT${dateStr}${random}`;
};

const getStockOutList = async (req, res) => {
  try {
    const { page = 1, page_size = 10, keyword, status, start_date, end_date } = req.query;
    const offset = (page - 1) * page_size;

    let queryText = `SELECT so.*, u.username as warehouse_keeper_name
                      FROM stock_out so
                      LEFT JOIN users u ON so.warehouse_keeper_id = u.id
                      WHERE 1=1`;
    let queryParams = [];
    let paramIndex = 1;

    if (keyword) {
      queryText += ` AND (so.out_no LIKE $${paramIndex} OR so.receiver LIKE $${paramIndex})`;
      queryParams.push(`%${keyword}%`);
      paramIndex++;
    }

    if (status) {
      queryText += ` AND so.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (start_date) {
      queryText += ` AND so.created_at >= $${paramIndex}`;
      queryParams.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      queryText += ` AND so.created_at <= $${paramIndex}`;
      queryParams.push(end_date + ' 23:59:59');
      paramIndex++;
    }

    const countResult = await query(
      queryText.replace(
        'SELECT so.*, u.username as warehouse_keeper_name',
        'SELECT COUNT(*)'
      ),
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    queryText += ` ORDER BY so.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(page_size), offset);

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: {
        list: result.rows,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total,
          total_pages: Math.ceil(total / page_size)
        }
      }
    });
  } catch (error) {
    console.error('Get stock out list error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取出库列表失败' 
    });
  }
};

const getStockOutById = async (req, res) => {
  try {
    const stockOutId = parseInt(req.params.id);

    const stockOutResult = await query(
      `SELECT so.*, u.username as warehouse_keeper_name
       FROM stock_out so
       LEFT JOIN users u ON so.warehouse_keeper_id = u.id
       WHERE so.id = $1`,
      [stockOutId]
    );

    if (stockOutResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '出库记录不存在' 
      });
    }

    const itemsResult = await query(
      `SELECT soi.*, p.product_code, p.product_name, p.unit, p.specification, i.quantity as current_stock
       FROM stock_out_items soi
       LEFT JOIN products p ON soi.product_id = p.id
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE soi.stock_out_id = $1
       ORDER BY soi.id`,
      [stockOutId]
    );

    res.json({
      success: true,
      data: {
        ...stockOutResult.rows[0],
        items: itemsResult.rows
      }
    });
  } catch (error) {
    console.error('Get stock out by id error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取出库详情失败' 
    });
  }
};

const createStockOut = async (req, res) => {
  const client = await getClient();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: '参数验证失败', 
        errors: errors.array() 
      });
    }

    const { receiver, phone, address, items, remark } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) {
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: '请至少添加一条出库商品' 
      });
    }

    await client.query('BEGIN');

    const outNo = await generateOutNo();

    let totalQuantity = 0;
    let totalAmount = 0;

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        throw new Error('商品信息不完整或数量无效');
      }
      totalQuantity += item.quantity;
      totalAmount += (item.unit_price || 0) * item.quantity;
    }

    const stockOutResult = await client.query(
      `INSERT INTO stock_out 
       (out_no, receiver, phone, address, warehouse_keeper_id, total_quantity, total_amount, status, remark, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [outNo, receiver, phone, address, userId, totalQuantity, totalAmount, 'draft', remark, userId]
    );

    const stockOut = stockOutResult.rows[0];

    for (const item of items) {
      const productResult = await client.query(
        'SELECT id, product_name, sale_price FROM products WHERE id = $1',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`商品ID ${item.product_id} 不存在`);
      }

      const unitPrice = item.unit_price || productResult.rows[0].sale_price || 0;
      const amount = unitPrice * item.quantity;

      await client.query(
        `INSERT INTO stock_out_items 
         (stock_out_id, product_id, quantity, unit_price, amount, remark)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [stockOut.id, item.product_id, item.quantity, unitPrice, amount, item.remark]
      );
    }

    await client.query('COMMIT');
    client.release();

    res.status(201).json({
      success: true,
      message: '出库单创建成功',
      data: stockOut
    });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Create stock out error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || '创建出库单失败' 
    });
  }
};

const updateStockOut = async (req, res) => {
  const client = await getClient();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: '参数验证失败', 
        errors: errors.array() 
      });
    }

    const stockOutId = parseInt(req.params.id);
    const { receiver, phone, address, items, remark } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) {
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: '请至少添加一条出库商品' 
      });
    }

    await client.query('BEGIN');

    const stockOutResult = await client.query(
      'SELECT * FROM stock_out WHERE id = $1',
      [stockOutId]
    );

    if (stockOutResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ 
        success: false, 
        message: '出库记录不存在' 
      });
    }

    const stockOut = stockOutResult.rows[0];

    if (stockOut.status === 'completed') {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: '已完成的出库单不能修改，请先取消' 
      });
    }

    if (stockOut.status === 'cancelled') {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: '已取消的出库单不能修改' 
      });
    }

    let totalQuantity = 0;
    let totalAmount = 0;

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        throw new Error('商品信息不完整或数量无效');
      }
      totalQuantity += item.quantity;
      totalAmount += (item.unit_price || 0) * item.quantity;
    }

    await client.query(
      `UPDATE stock_out 
       SET receiver = $1, phone = $2, address = $3, total_quantity = $4, total_amount = $5, remark = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [receiver, phone, address, totalQuantity, totalAmount, remark, stockOutId]
    );

    await client.query(
      'DELETE FROM stock_out_items WHERE stock_out_id = $1',
      [stockOutId]
    );

    for (const item of items) {
      const productResult = await client.query(
        'SELECT id, product_name, sale_price FROM products WHERE id = $1',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`商品ID ${item.product_id} 不存在`);
      }

      const unitPrice = item.unit_price || productResult.rows[0].sale_price || 0;
      const amount = unitPrice * item.quantity;

      await client.query(
        `INSERT INTO stock_out_items 
         (stock_out_id, product_id, quantity, unit_price, amount, remark)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [stockOutId, item.product_id, item.quantity, unitPrice, amount, item.remark]
      );
    }

    await client.query('COMMIT');
    client.release();

    res.json({
      success: true,
      message: '出库单更新成功'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Update stock out error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || '更新出库单失败' 
    });
  }
};

const completeStockOut = async (req, res) => {
  const client = await getClient();
  
  try {
    const stockOutId = parseInt(req.params.id);
    const userId = req.user.id;

    await client.query('BEGIN');

    const stockOutResult = await client.query(
      'SELECT * FROM stock_out WHERE id = $1',
      [stockOutId]
    );

    if (stockOutResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ 
        success: false, 
        message: '出库记录不存在' 
      });
    }

    const stockOut = stockOutResult.rows[0];

    if (stockOut.status === 'completed') {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: '该出库单已完成' 
      });
    }

    if (stockOut.status === 'cancelled') {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: '已取消的出库单不能完成' 
      });
    }

    const itemsResult = await client.query(
      'SELECT * FROM stock_out_items WHERE stock_out_id = $1',
      [stockOutId]
    );

    for (const item of itemsResult.rows) {
      const inventoryResult = await client.query(
        'SELECT * FROM inventory WHERE product_id = $1 FOR UPDATE',
        [item.product_id]
      );

      if (inventoryResult.rows.length === 0 || inventoryResult.rows[0].quantity < item.quantity) {
        const productResult = await client.query(
          'SELECT product_name FROM products WHERE id = $1',
          [item.product_id]
        );
        const productName = productResult.rows[0]?.product_name || `ID:${item.product_id}`;
        const currentStock = inventoryResult.rows[0]?.quantity || 0;
        
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ 
          success: false, 
          message: `商品 [${productName}] 库存不足，当前库存: ${currentStock}，需要出库: ${item.quantity}` 
        });
      }

      const inventory = inventoryResult.rows[0];
      await client.query(
        `UPDATE inventory 
         SET quantity = quantity - $1, total_out = total_out + $1, last_out_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    await client.query(
      `UPDATE stock_out 
       SET status = 'completed', warehouse_keeper_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [userId, stockOutId]
    );

    await client.query('COMMIT');
    client.release();

    res.json({
      success: true,
      message: '出库完成，库存已更新'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Complete stock out error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || '完成出库失败' 
    });
  }
};

const cancelStockOut = async (req, res) => {
  const client = await getClient();
  
  try {
    const stockOutId = parseInt(req.params.id);

    await client.query('BEGIN');

    const stockOutResult = await client.query(
      'SELECT * FROM stock_out WHERE id = $1',
      [stockOutId]
    );

    if (stockOutResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ 
        success: false, 
        message: '出库记录不存在' 
      });
    }

    const stockOut = stockOutResult.rows[0];

    if (stockOut.status === 'cancelled') {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: '该出库单已取消' 
      });
    }

    if (stockOut.status === 'completed') {
      const itemsResult = await client.query(
        'SELECT * FROM stock_out_items WHERE stock_out_id = $1',
        [stockOutId]
      );

      for (const item of itemsResult.rows) {
        await client.query(
          `UPDATE inventory 
           SET quantity = quantity + $1, total_out = total_out - $1, updated_at = CURRENT_TIMESTAMP
           WHERE product_id = $2`,
          [item.quantity, item.product_id]
        );
      }
    }

    await client.query(
      `UPDATE stock_out 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [stockOutId]
    );

    await client.query('COMMIT');
    client.release();

    res.json({
      success: true,
      message: '出库单已取消' + (stockOut.status === 'completed' ? '，库存已回滚' : '')
    });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Cancel stock out error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || '取消出库失败' 
    });
  }
};

module.exports = {
  getStockOutList,
  getStockOutById,
  createStockOut,
  updateStockOut,
  completeStockOut,
  cancelStockOut
};