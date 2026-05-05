const express = require('express');
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { logOperation } = require('../services/logService');
const { generateProductNo, generateStockInNo, generateCheckNo } = require('../utils/orderNoGenerator');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      keyword,
      brandId,
      categoryId,
      isOnSale,
      warehouseId
    } = req.query;

    let whereConditions = ['1=1'];
    let params = [];

    if (keyword) {
      whereConditions.push('(p.name LIKE ? OR p.product_no LIKE ?)');
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm);
    }

    if (brandId) {
      whereConditions.push('p.brand_id = ?');
      params.push(brandId);
    }

    if (categoryId) {
      whereConditions.push('p.category_id = ?');
      params.push(categoryId);
    }

    if (isOnSale !== undefined && isOnSale !== '') {
      whereConditions.push('p.is_on_sale = ?');
      params.push(isOnSale === 'true' ? 1 : 0);
    }

    const whereClause = whereConditions.join(' AND ');
    
    const countSql = `
      SELECT COUNT(*) as total 
      FROM products p
      WHERE ${whereClause}
    `;
    
    const listSql = `
      SELECT 
        p.*,
        b.name as brand_name,
        b.code as brand_code,
        pc.name as category_name,
        pc.code as category_code
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countResult = db.prepare(countSql).get(...params);
    const total = countResult.total;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const list = db.prepare(listSql).all(...params, parseInt(pageSize), offset);

    if (warehouseId) {
      for (const product of list) {
        const inventory = db.prepare(
          'SELECT quantity, locked_quantity FROM inventory WHERE product_id = ? AND warehouse_id = ?'
        ).get(product.id, warehouseId);
        product.inventory = inventory || { quantity: 0, locked_quantity: 0 };
      }
    }

    res.json({
      success: true,
      data: {
        list,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: '获取产品列表失败',
      error: error.message
    });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const product = db.prepare(`
      SELECT 
        p.*,
        b.name as brand_name,
        b.code as brand_code,
        pc.name as category_name,
        pc.code as category_code
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.id = ?
    `).get(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    const inventories = db.prepare(`
      SELECT 
        i.*,
        w.name as warehouse_name,
        w.code as warehouse_code
      FROM inventory i
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE i.product_id = ?
    `).all(id);

    product.inventories = inventories;

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product detail error:', error);
    res.status(500).json({
      success: false,
      message: '获取产品详情失败',
      error: error.message
    });
  }
});

router.post('/', authMiddleware, roleMiddleware('super_admin', 'warehouse'), (req, res) => {
  try {
    const {
      name,
      brandId,
      categoryId,
      unit,
      purchasePrice,
      salePrice,
      usageType,
      description,
      imageUrl,
      videoUrl,
      isOnSale,
      minStock,
      maxStock
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '产品名称不能为空'
      });
    }

    const productNo = generateProductNo();

    const insertProduct = db.prepare(`
      INSERT INTO products 
      (product_no, name, brand_id, category_id, unit, purchase_price, sale_price, 
       usage_type, description, image_url, video_url, is_on_sale, min_stock, max_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertProduct.run(
      productNo,
      name,
      brandId || null,
      categoryId || null,
      unit,
      purchasePrice || 0,
      salePrice || 0,
      usageType,
      description,
      imageUrl,
      videoUrl,
      isOnSale !== false ? 1 : 0,
      minStock || 0,
      maxStock || 999999
    );

    logOperation({
      user: req.user,
      module: '产品管理',
      action: '添加产品',
      targetType: 'product',
      targetId: result.lastInsertRowid,
      detail: { name, productNo, salePrice },
      ip: req.ip
    });

    res.json({
      success: true,
      message: '添加产品成功',
      data: {
        id: result.lastInsertRowid,
        productNo
      }
    });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({
      success: false,
      message: '添加产品失败',
      error: error.message
    });
  }
});

router.put('/:id', authMiddleware, roleMiddleware('super_admin', 'warehouse'), (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      brandId,
      categoryId,
      unit,
      purchasePrice,
      salePrice,
      usageType,
      description,
      imageUrl,
      videoUrl,
      isOnSale,
      minStock,
      maxStock,
      status
    } = req.body;

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name); }
    if (brandId !== undefined) { updateFields.push('brand_id = ?'); updateValues.push(brandId); }
    if (categoryId !== undefined) { updateFields.push('category_id = ?'); updateValues.push(categoryId); }
    if (unit !== undefined) { updateFields.push('unit = ?'); updateValues.push(unit); }
    if (purchasePrice !== undefined) { updateFields.push('purchase_price = ?'); updateValues.push(purchasePrice); }
    if (salePrice !== undefined) { updateFields.push('sale_price = ?'); updateValues.push(salePrice); }
    if (usageType !== undefined) { updateFields.push('usage_type = ?'); updateValues.push(usageType); }
    if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }
    if (imageUrl !== undefined) { updateFields.push('image_url = ?'); updateValues.push(imageUrl); }
    if (videoUrl !== undefined) { updateFields.push('video_url = ?'); updateValues.push(videoUrl); }
    if (isOnSale !== undefined) { updateFields.push('is_on_sale = ?'); updateValues.push(isOnSale ? 1 : 0); }
    if (minStock !== undefined) { updateFields.push('min_stock = ?'); updateValues.push(minStock); }
    if (maxStock !== undefined) { updateFields.push('max_stock = ?'); updateValues.push(maxStock); }
    if (status !== undefined) { updateFields.push('status = ?'); updateValues.push(status); }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有需要更新的字段'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const sql = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...updateValues);

    logOperation({
      user: req.user,
      module: '产品管理',
      action: '修改产品',
      targetType: 'product',
      targetId: id,
      detail: { updateFields },
      ip: req.ip
    });

    res.json({
      success: true,
      message: '更新产品成功'
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: '更新产品失败',
      error: error.message
    });
  }
});

router.get('/inventory/list', authMiddleware, (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      keyword,
      productId,
      warehouseId,
      isOnSale
    } = req.query;

    let whereConditions = ['1=1'];
    let params = [];

    if (keyword) {
      whereConditions.push('(p.name LIKE ? OR p.product_no LIKE ?)');
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm);
    }

    if (productId) {
      whereConditions.push('i.product_id = ?');
      params.push(productId);
    }

    if (warehouseId) {
      whereConditions.push('i.warehouse_id = ?');
      params.push(warehouseId);
    }

    if (isOnSale !== undefined && isOnSale !== '') {
      whereConditions.push('p.is_on_sale = ?');
      params.push(isOnSale === 'true' ? 1 : 0);
    }

    const whereClause = whereConditions.join(' AND ');
    
    const countSql = `
      SELECT COUNT(*) as total 
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE ${whereClause}
    `;
    
    const listSql = `
      SELECT 
        i.*,
        p.name as product_name,
        p.product_no,
        p.unit,
        p.sale_price,
        p.is_on_sale,
        b.name as brand_name,
        pc.name as category_name,
        w.name as warehouse_name,
        w.code as warehouse_code
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE ${whereClause}
      ORDER BY i.updated_at DESC
      LIMIT ? OFFSET ?
    `;

    const countResult = db.prepare(countSql).get(...params);
    const total = countResult.total;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const list = db.prepare(listSql).all(...params, parseInt(pageSize), offset);

    res.json({
      success: true,
      data: {
        list,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Get inventory list error:', error);
    res.status(500).json({
      success: false,
      message: '获取库存列表失败',
      error: error.message
    });
  }
});

router.post('/:id/inventory-check', authMiddleware, roleMiddleware('super_admin', 'warehouse'), (req, res) => {
  const transaction = db.transaction(() => {
    try {
      const { id } = req.params;
      const { warehouseId, newQuantity, reason } = req.body;

      if (!warehouseId || newQuantity === undefined || newQuantity < 0) {
        throw new Error('仓库ID、新数量不能为空，数量不能为负数');
      }

      if (!reason || reason.trim() === '') {
        throw new Error('请填写修改原因');
      }

      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
      if (!product) {
        throw new Error('产品不存在');
      }

      let inventory = db.prepare(
        'SELECT * FROM inventory WHERE product_id = ? AND warehouse_id = ?'
      ).get(id, warehouseId);

      const originalQuantity = inventory ? inventory.quantity : 0;
      const difference = newQuantity - originalQuantity;

      const checkNo = generateCheckNo();
      const checkDate = new Date().toISOString().split('T')[0];

      db.prepare(`
        INSERT INTO inventory_checks
        (check_no, product_id, warehouse_id, original_quantity, new_quantity, difference, reason, operator_id, check_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        checkNo,
        id,
        warehouseId,
        originalQuantity,
        newQuantity,
        difference,
        reason,
        req.user.id,
        checkDate
      );

      if (inventory) {
        db.prepare(`
          UPDATE inventory 
          SET quantity = ?, last_check_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE product_id = ? AND warehouse_id = ?
        `).run(newQuantity, id, warehouseId);
      } else {
        db.prepare(`
          INSERT INTO inventory (product_id, warehouse_id, quantity, last_check_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `).run(id, warehouseId, newQuantity);
      }

      logOperation({
        user: req.user,
        module: '库存盘点',
        action: '库存调整',
        targetType: 'inventory',
        targetId: id,
        detail: { 
          productName: product.name,
          warehouseId,
          originalQuantity,
          newQuantity,
          difference,
          reason,
          checkNo
        },
        ip: req.ip
      });

      return true;
    } catch (error) {
      throw error;
    }
  });

  try {
    transaction();
    res.json({
      success: true,
      message: '库存盘点完成'
    });
  } catch (error) {
    console.error('Inventory check error:', error);
    res.status(500).json({
      success: false,
      message: '库存盘点失败',
      error: error.message
    });
  }
});

router.get('/inventory-checks/list', authMiddleware, (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      productId,
      warehouseId,
      isOnSale,
      startDate,
      endDate
    } = req.query;

    let whereConditions = ['1=1'];
    let params = [];

    if (productId) {
      whereConditions.push('ic.product_id = ?');
      params.push(productId);
    }

    if (warehouseId) {
      whereConditions.push('ic.warehouse_id = ?');
      params.push(warehouseId);
    }

    if (isOnSale !== undefined && isOnSale !== '') {
      whereConditions.push('p.is_on_sale = ?');
      params.push(isOnSale === 'true' ? 1 : 0);
    }

    if (startDate) {
      whereConditions.push('DATE(ic.created_at) >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('DATE(ic.created_at) <= ?');
      params.push(endDate);
    }

    const whereClause = whereConditions.join(' AND ');
    
    const countSql = `
      SELECT COUNT(*) as total 
      FROM inventory_checks ic
      LEFT JOIN products p ON ic.product_id = p.id
      LEFT JOIN warehouses w ON ic.warehouse_id = w.id
      WHERE ${whereClause}
    `;
    
    const listSql = `
      SELECT 
        ic.*,
        p.name as product_name,
        p.product_no,
        p.unit,
        w.name as warehouse_name,
        w.code as warehouse_code,
        u.name as operator_name
      FROM inventory_checks ic
      LEFT JOIN products p ON ic.product_id = p.id
      LEFT JOIN warehouses w ON ic.warehouse_id = w.id
      LEFT JOIN users u ON ic.operator_id = u.id
      WHERE ${whereClause}
      ORDER BY ic.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countResult = db.prepare(countSql).get(...params);
    const total = countResult.total;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const list = db.prepare(listSql).all(...params, parseInt(pageSize), offset);

    res.json({
      success: true,
      data: {
        list,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Get inventory checks error:', error);
    res.status(500).json({
      success: false,
      message: '获取库存盘点记录失败',
      error: error.message
    });
  }
});

router.post('/stock-in', authMiddleware, roleMiddleware('super_admin', 'warehouse'), (req, res) => {
  const transaction = db.transaction(() => {
    try {
      const {
        type,
        purchaseNo,
        supplierName,
        warehouseId,
        items,
        remark
      } = req.body;

      if (!warehouseId || !items || items.length === 0) {
        throw new Error('仓库和入库商品不能为空');
      }

      const stockInNo = generateStockInNo();
      
      let totalQuantity = 0;
      let totalAmount = 0;

      for (const item of items) {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId);
        if (!product) {
          throw new Error(`商品ID ${item.productId} 不存在`);
        }
        if (item.quantity <= 0) {
          throw new Error('入库数量必须大于0');
        }
        totalQuantity += item.quantity;
        totalAmount += (item.unitPrice || 0) * item.quantity;
      }

      const insertStockIn = db.prepare(`
        INSERT INTO stock_in_orders 
        (stock_in_no, type, purchase_no, supplier_name, warehouse_id, total_quantity, total_amount, operator_id, remark, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insertStockIn.run(
        stockInNo,
        type || 'purchase',
        purchaseNo,
        supplierName,
        warehouseId,
        totalQuantity,
        totalAmount,
        req.user.id,
        remark,
        'completed'
      );

      const stockInOrderId = result.lastInsertRowid;

      const insertStockInItem = db.prepare(`
        INSERT INTO stock_in_items
        (stock_in_order_id, product_id, production_date, expiry_date, quantity, unit_price, total_price, batch_no, remark)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        const unitPrice = item.unitPrice || 0;
        const totalPrice = unitPrice * item.quantity;

        insertStockInItem.run(
          stockInOrderId,
          item.productId,
          item.productionDate || null,
          item.expiryDate || null,
          item.quantity,
          unitPrice,
          totalPrice,
          item.batchNo,
          item.remark
        );

        let inventory = db.prepare(
          'SELECT * FROM inventory WHERE product_id = ? AND warehouse_id = ?'
        ).get(item.productId, warehouseId);

        if (inventory) {
          db.prepare(`
            UPDATE inventory 
            SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
            WHERE product_id = ? AND warehouse_id = ?
          `).run(item.quantity, item.productId, warehouseId);
        } else {
          db.prepare(`
            INSERT INTO inventory (product_id, warehouse_id, quantity)
            VALUES (?, ?, ?)
          `).run(item.productId, warehouseId, item.quantity);
        }
      }

      logOperation({
        user: req.user,
        module: '仓储管理',
        action: '产品入库',
        targetType: 'stock_in_order',
        targetId: stockInOrderId,
        detail: { stockInNo, warehouseId, totalQuantity, totalAmount, type },
        ip: req.ip
      });

      return { stockInOrderId, stockInNo };
    } catch (error) {
      throw error;
    }
  });

  try {
    const result = transaction();
    res.json({
      success: true,
      message: '产品入库成功',
      data: result
    });
  } catch (error) {
    console.error('Stock in error:', error);
    res.status(500).json({
      success: false,
      message: '产品入库失败',
      error: error.message
    });
  }
});

router.get('/stock-in/list', authMiddleware, (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      keyword,
      warehouseId,
      type,
      startDate,
      endDate
    } = req.query;

    let whereConditions = ['1=1'];
    let params = [];

    if (keyword) {
      whereConditions.push('(so.stock_in_no LIKE ? OR so.purchase_no LIKE ? OR so.supplier_name LIKE ?)');
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (warehouseId) {
      whereConditions.push('so.warehouse_id = ?');
      params.push(warehouseId);
    }

    if (type) {
      whereConditions.push('so.type = ?');
      params.push(type);
    }

    if (startDate) {
      whereConditions.push('DATE(so.created_at) >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('DATE(so.created_at) <= ?');
      params.push(endDate);
    }

    const whereClause = whereConditions.join(' AND ');
    
    const countSql = `
      SELECT COUNT(*) as total 
      FROM stock_in_orders so
      WHERE ${whereClause}
    `;
    
    const listSql = `
      SELECT 
        so.*,
        w.name as warehouse_name,
        u.name as operator_name
      FROM stock_in_orders so
      LEFT JOIN warehouses w ON so.warehouse_id = w.id
      LEFT JOIN users u ON so.operator_id = u.id
      WHERE ${whereClause}
      ORDER BY so.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countResult = db.prepare(countSql).get(...params);
    const total = countResult.total;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const list = db.prepare(listSql).all(...params, parseInt(pageSize), offset);

    res.json({
      success: true,
      data: {
        list,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Get stock in list error:', error);
    res.status(500).json({
      success: false,
      message: '获取入库记录失败',
      error: error.message
    });
  }
});

router.get('/stock-out/list', authMiddleware, (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      keyword,
      warehouseId,
      type,
      startDate,
      endDate
    } = req.query;

    let whereConditions = ['1=1'];
    let params = [];

    if (keyword) {
      whereConditions.push('(so.stock_out_no LIKE ? OR o.order_no LIKE ?)');
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm);
    }

    if (warehouseId) {
      whereConditions.push('so.warehouse_id = ?');
      params.push(warehouseId);
    }

    if (type) {
      whereConditions.push('so.type = ?');
      params.push(type);
    }

    if (startDate) {
      whereConditions.push('DATE(so.created_at) >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('DATE(so.created_at) <= ?');
      params.push(endDate);
    }

    const whereClause = whereConditions.join(' AND ');
    
    const countSql = `
      SELECT COUNT(*) as total 
      FROM stock_out_orders so
      WHERE ${whereClause}
    `;
    
    const listSql = `
      SELECT 
        so.*,
        w.name as warehouse_name,
        u.name as operator_name,
        o.order_no
      FROM stock_out_orders so
      LEFT JOIN warehouses w ON so.warehouse_id = w.id
      LEFT JOIN users u ON so.operator_id = u.id
      LEFT JOIN orders o ON so.order_id = o.id
      WHERE ${whereClause}
      ORDER BY so.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countResult = db.prepare(countSql).get(...params);
    const total = countResult.total;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const list = db.prepare(listSql).all(...params, parseInt(pageSize), offset);

    res.json({
      success: true,
      data: {
        list,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Get stock out list error:', error);
    res.status(500).json({
      success: false,
      message: '获取出库记录失败',
      error: error.message
    });
  }
});

module.exports = router;
