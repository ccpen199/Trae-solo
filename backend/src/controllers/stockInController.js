const { validationResult } = require('express-validator');
const { query, getClient } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const generateInNo = async () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `IN${dateStr}${random}`;
};

const getStockInList = async (req, res) => {
  try {
    const { page = 1, page_size = 10, keyword, supplier_id, status, start_date, end_date } = req.query;
    const offset = (page - 1) * page_size;

    let queryText = `SELECT si.*, s.supplier_name, u.username as warehouse_keeper_name
                      FROM stock_in si
                      LEFT JOIN suppliers s ON si.supplier_id = s.id
                      LEFT JOIN users u ON si.warehouse_keeper_id = u.id
                      WHERE 1=1`;
    let queryParams = [];
    let paramIndex = 1;

    if (keyword) {
      queryText += ` AND (si.in_no LIKE $${paramIndex} OR s.supplier_name LIKE $${paramIndex})`;
      queryParams.push(`%${keyword}%`);
      paramIndex++;
    }

    if (supplier_id) {
      queryText += ` AND si.supplier_id = $${paramIndex}`;
      queryParams.push(parseInt(supplier_id));
      paramIndex++;
    }

    if (status) {
      queryText += ` AND si.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (start_date) {
      queryText += ` AND si.created_at >= $${paramIndex}`;
      queryParams.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      queryText += ` AND si.created_at <= $${paramIndex}`;
      queryParams.push(end_date + ' 23:59:59');
      paramIndex++;
    }

    const countResult = await query(
      queryText.replace(
        'SELECT si.*, s.supplier_name, u.username as warehouse_keeper_name',
        'SELECT COUNT(*)'
      ),
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    queryText += ` ORDER BY si.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
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
    console.error('Get stock in list error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取入库列表失败' 
    });
  }
};

const getStockInById = async (req, res) => {
  try {
    const stockInId = parseInt(req.params.id);

    const stockInResult = await query(
      `SELECT si.*, s.supplier_name, s.contact_person, s.phone as supplier_phone, s.address as supplier_address,
              u.username as warehouse_keeper_name
       FROM stock_in si
       LEFT JOIN suppliers s ON si.supplier_id = s.id
       LEFT JOIN users u ON si.warehouse_keeper_id = u.id
       WHERE si.id = $1`,
      [stockInId]
    );

    if (stockInResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '入库记录不存在' 
      });
    }

    const itemsResult = await query(
      `SELECT sii.*, p.product_code, p.product_name, p.unit, p.specification
       FROM stock_in_items sii
       LEFT JOIN products p ON sii.product_id = p.id
       WHERE sii.stock_in_id = $1
       ORDER BY sii.id`,
      [stockInId]
    );

    res.json({
      success: true,
      data: {
        ...stockInResult.rows[0],
        items: itemsResult.rows
      }
    });
  } catch (error) {
    console.error('Get stock in by id error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取入库详情失败' 
    });
  }
};

const createStockIn = async (req, res) => {
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

    const { supplier_id, items, remark } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) {
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: '请至少添加一条入库商品' 
      });
    }

    await client.query('BEGIN');

    const inNo = await generateInNo();

    let totalQuantity = 0;
    let totalAmount = 0;

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        throw new Error('商品信息不完整或数量无效');
      }
      totalQuantity += item.quantity;
      totalAmount += (item.unit_price || 0) * item.quantity;
    }

    const stockInResult = await client.query(
      `INSERT INTO stock_in 
       (in_no, supplier_id, warehouse_keeper_id, total_quantity, total_amount, status, remark, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [inNo, supplier_id, userId, totalQuantity, totalAmount, 'draft', remark, userId]
    );

    const stockIn = stockInResult.rows[0];

    for (const item of items) {
      const productResult = await client.query(
        'SELECT id, product_name, purchase_price FROM products WHERE id = $1',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`商品ID ${item.product_id} 不存在`);
      }

      const unitPrice = item.unit_price || productResult.rows[0].purchase_price || 0;
      const amount = unitPrice * item.quantity;

      await client.query(
        `INSERT INTO stock_in_items 
         (stock_in_id, product_id, quantity, unit_price, amount, remark)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [stockIn.id, item.product_id, item.quantity, unitPrice, amount, item.remark]
      );
    }

    await client.query('COMMIT');
    client.release();

    res.status(201).json({
      success: true,
      message: '入库单创建成功',
      data: stockIn
    });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Create stock in error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || '创建入库单失败' 
    });
  }
};

const updateStockIn = async (req, res) => {
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

    const stockInId = parseInt(req.params.id);
    const { supplier_id, items, remark } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) {
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: '请至少添加一条入库商品' 
      });
    }

    await client.query('BEGIN');

    const stockInResult = await client.query(
      'SELECT * FROM stock_in WHERE id = $1',
      [stockInId]
    );

    if (stockInResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ 
        success: false, 
        message: '入库记录不存在' 
      });
    }

    const stockIn = stockInResult.rows[0];

    if (stockIn.status === 'completed') {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: '已完成的入库单不能修改，请先取消' 
      });
    }

    if (stockIn.status === 'cancelled') {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: '已取消的入库单不能修改' 
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
      `UPDATE stock_in 
       SET supplier_id = $1, total_quantity = $2, total_amount = $3, remark = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [supplier_id, totalQuantity, totalAmount, remark, stockInId]
    );

    await client.query(
      'DELETE FROM stock_in_items WHERE stock_in_id = $1',
      [stockInId]
    );

    for (const item of items) {
      const productResult = await client.query(
        'SELECT id, product_name, purchase_price FROM products WHERE id = $1',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`商品ID ${item.product_id} 不存在`);
      }

      const unitPrice = item.unit_price || productResult.rows[0].purchase_price || 0;
      const amount = unitPrice * item.quantity;

      await client.query(
        `INSERT INTO stock_in_items 
         (stock_in_id, product_id, quantity, unit_price, amount, remark)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [stockInId, item.product_id, item.quantity, unitPrice, amount, item.remark]
      );
    }

    await client.query('COMMIT');
    client.release();

    res.json({
      success: true,
      message: '入库单更新成功'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Update stock in error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || '更新入库单失败' 
    });
  }
};

const completeStockIn = async (req, res) => {
  const client = await getClient();
  
  try {
    const stockInId = parseInt(req.params.id);
    const userId = req.user.id;

    await client.query('BEGIN');

    const stockInResult = await client.query(
      'SELECT * FROM stock_in WHERE id = $1',
      [stockInId]
    );

    if (stockInResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ 
        success: false, 
        message: '入库记录不存在' 
      });
    }

    const stockIn = stockInResult.rows[0];

    if (stockIn.status === 'completed') {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: '该入库单已完成' 
      });
    }

    if (stockIn.status === 'cancelled') {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: '已取消的入库单不能完成' 
      });
    }

    const itemsResult = await client.query(
      'SELECT * FROM stock_in_items WHERE stock_in_id = $1',
      [stockInId]
    );

    for (const item of itemsResult.rows) {
      const inventoryResult = await client.query(
        'SELECT * FROM inventory WHERE product_id = $1 FOR UPDATE',
        [item.product_id]
      );

      if (inventoryResult.rows.length === 0) {
        await client.query(
          `INSERT INTO inventory (product_id, quantity, total_in, total_out, last_in_time)
           VALUES ($1, $2, $2, 0, CURRENT_TIMESTAMP)`,
          [item.product_id, item.quantity]
        );
      } else {
        const inventory = inventoryResult.rows[0];
        await client.query(
          `UPDATE inventory 
           SET quantity = quantity + $1, total_in = total_in + $1, last_in_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE product_id = $2`,
          [item.quantity, item.product_id]
        );
      }
    }

    await client.query(
      `UPDATE stock_in 
       SET status = 'completed', warehouse_keeper_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [userId, stockInId]
    );

    await client.query('COMMIT');
    client.release();

    res.json({
      success: true,
      message: '入库完成，库存已更新'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Complete stock in error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || '完成入库失败' 
    });
  }
};

const cancelStockIn = async (req, res) => {
  const client = await getClient();
  
  try {
    const stockInId = parseInt(req.params.id);

    await client.query('BEGIN');

    const stockInResult = await client.query(
      'SELECT * FROM stock_in WHERE id = $1',
      [stockInId]
    );

    if (stockInResult.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ 
        success: false, 
        message: '入库记录不存在' 
      });
    }

    const stockIn = stockInResult.rows[0];

    if (stockIn.status === 'cancelled') {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ 
        success: false, 
        message: '该入库单已取消' 
      });
    }

    if (stockIn.status === 'completed') {
      const itemsResult = await client.query(
        'SELECT * FROM stock_in_items WHERE stock_in_id = $1',
        [stockInId]
      );

      for (const item of itemsResult.rows) {
        const inventoryResult = await client.query(
          'SELECT * FROM inventory WHERE product_id = $1 FOR UPDATE',
          [item.product_id]
        );

        if (inventoryResult.rows.length > 0) {
          const inventory = inventoryResult.rows[0];
          
          if (inventory.quantity < item.quantity) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(400).json({ 
              success: false, 
              message: `商品ID ${item.product_id} 库存不足，无法取消入库` 
            });
          }

          await client.query(
            `UPDATE inventory 
             SET quantity = quantity - $1, total_in = total_in - $1, updated_at = CURRENT_TIMESTAMP
             WHERE product_id = $2`,
            [item.quantity, item.product_id]
          );
        }
      }
    }

    await client.query(
      `UPDATE stock_in 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [stockInId]
    );

    await client.query('COMMIT');
    client.release();

    res.json({
      success: true,
      message: '入库单已取消' + (stockIn.status === 'completed' ? '，库存已回滚' : '')
    });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Cancel stock in error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || '取消入库失败' 
    });
  }
};

module.exports = {
  getStockInList,
  getStockInById,
  createStockIn,
  updateStockIn,
  completeStockIn,
  cancelStockIn
};