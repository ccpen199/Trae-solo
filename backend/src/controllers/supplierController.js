const { validationResult } = require('express-validator');
const { query } = require('../config/database');
const ExcelJS = require('exceljs');

const getSuppliers = async (req, res) => {
  try {
    const { page = 1, page_size = 10, keyword, contact_person, phone } = req.query;
    const offset = (page - 1) * page_size;

    let queryText = `SELECT s.*, u.username as created_by_name 
                      FROM suppliers s 
                      LEFT JOIN users u ON s.created_by = u.id 
                      WHERE 1=1`;
    let queryParams = [];
    let paramIndex = 1;

    if (keyword) {
      queryText += ` AND (s.supplier_name LIKE $${paramIndex} OR s.remark LIKE $${paramIndex})`;
      queryParams.push(`%${keyword}%`);
      paramIndex++;
    }

    if (contact_person) {
      queryText += ` AND s.contact_person LIKE $${paramIndex}`;
      queryParams.push(`%${contact_person}%`);
      paramIndex++;
    }

    if (phone) {
      queryText += ` AND s.phone LIKE $${paramIndex}`;
      queryParams.push(`%${phone}%`);
      paramIndex++;
    }

    const countResult = await query(
      queryText.replace(
        'SELECT s.*, u.username as created_by_name',
        'SELECT COUNT(*)'
      ),
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    queryText += ` ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
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
    console.error('Get suppliers error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取供应商列表失败' 
    });
  }
};

const getSupplierById = async (req, res) => {
  try {
    const supplierId = parseInt(req.params.id);

    const result = await query(
      `SELECT s.*, u.username as created_by_name 
       FROM suppliers s 
       LEFT JOIN users u ON s.created_by = u.id 
       WHERE s.id = $1`,
      [supplierId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '供应商不存在' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get supplier by id error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取供应商信息失败' 
    });
  }
};

const getAllSuppliers = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, supplier_name, contact_person, phone FROM suppliers ORDER BY supplier_name'
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get all suppliers error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取供应商列表失败' 
    });
  }
};

const createSupplier = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: '参数验证失败', 
        errors: errors.array() 
      });
    }

    const { supplier_name, contact_person, phone, address, email, remark } = req.body;
    const createdBy = req.user.id;

    const result = await query(
      `INSERT INTO suppliers (supplier_name, contact_person, phone, address, email, remark, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [supplier_name, contact_person, phone, address, email, remark, createdBy]
    );

    res.status(201).json({
      success: true,
      message: '供应商添加成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ 
      success: false, 
      message: '添加供应商失败' 
    });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: '参数验证失败', 
        errors: errors.array() 
      });
    }

    const supplierId = parseInt(req.params.id);
    const { supplier_name, contact_person, phone, address, email, remark } = req.body;

    const supplierResult = await query(
      'SELECT * FROM suppliers WHERE id = $1',
      [supplierId]
    );

    if (supplierResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '供应商不存在' 
      });
    }

    const result = await query(
      `UPDATE suppliers 
       SET supplier_name = $1, contact_person = $2, phone = $3, address = $4, email = $5, remark = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [supplier_name, contact_person, phone, address, email, remark, supplierId]
    );

    res.json({
      success: true,
      message: '供应商信息更新成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新供应商信息失败' 
    });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const supplierId = parseInt(req.params.id);

    const stockInCount = await query(
      'SELECT COUNT(*) FROM stock_in WHERE supplier_id = $1',
      [supplierId]
    );

    if (parseInt(stockInCount.rows[0].count) > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '该供应商存在关联的入库记录，无法删除' 
      });
    }

    const supplierResult = await query(
      'SELECT * FROM suppliers WHERE id = $1',
      [supplierId]
    );

    if (supplierResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '供应商不存在' 
      });
    }

    await query('DELETE FROM suppliers WHERE id = $1', [supplierId]);

    res.json({
      success: true,
      message: '供应商删除成功'
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ 
      success: false, 
      message: '删除供应商失败' 
    });
  }
};

const exportSuppliers = async (req, res) => {
  try {
    const { keyword, contact_person, phone } = req.query;

    let queryText = `SELECT s.*, u.username as created_by_name 
                      FROM suppliers s 
                      LEFT JOIN users u ON s.created_by = u.id 
                      WHERE 1=1`;
    let queryParams = [];
    let paramIndex = 1;

    if (keyword) {
      queryText += ` AND (s.supplier_name LIKE $${paramIndex} OR s.remark LIKE $${paramIndex})`;
      queryParams.push(`%${keyword}%`);
      paramIndex++;
    }

    if (contact_person) {
      queryText += ` AND s.contact_person LIKE $${paramIndex}`;
      queryParams.push(`%${contact_person}%`);
      paramIndex++;
    }

    if (phone) {
      queryText += ` AND s.phone LIKE $${paramIndex}`;
      queryParams.push(`%${phone}%`);
      paramIndex++;
    }

    queryText += ' ORDER BY s.created_at DESC';

    const result = await query(queryText, queryParams);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('供应商列表');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: '供应商名称', key: 'supplier_name', width: 25 },
      { header: '联系人', key: 'contact_person', width: 15 },
      { header: '联系电话', key: 'phone', width: 20 },
      { header: '地址', key: 'address', width: 30 },
      { header: '邮箱', key: 'email', width: 25 },
      { header: '备注', key: 'remark', width: 30 },
      { header: '创建人', key: 'created_by_name', width: 15 },
      { header: '创建时间', key: 'created_at', width: 20 }
    ];

    result.rows.forEach(row => {
      worksheet.addRow({
        id: row.id,
        supplier_name: row.supplier_name,
        contact_person: row.contact_person,
        phone: row.phone,
        address: row.address,
        email: row.email,
        remark: row.remark,
        created_by_name: row.created_by_name,
        created_at: row.created_at ? new Date(row.created_at).toLocaleString('zh-CN') : ''
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=suppliers_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export suppliers error:', error);
    res.status(500).json({ 
      success: false, 
      message: '导出供应商列表失败' 
    });
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  getAllSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  exportSuppliers
};