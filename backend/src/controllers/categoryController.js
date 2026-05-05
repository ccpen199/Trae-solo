const { query, getLastInsertId } = require('../config/database');

const getCategories = async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'active') as product_count
       FROM categories c
       WHERE c.status = 'active'
       ORDER BY c.sort_order ASC, c.id ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('获取分类列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, sort_order } = req.body;

    if (!name) {
      return res.status(400).json({ message: '分类名称为必填项' });
    }

    await query(
      `INSERT INTO categories (name, description, sort_order, created_at) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [name, description, sort_order || 0]
    );

    const categoryId = await getLastInsertId('categories');
    const result = await query('SELECT * FROM categories WHERE id = $1', [categoryId]);

    res.status(201).json({
      message: '分类创建成功',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('创建分类错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name, description, sort_order, status } = req.body;

    await query(
      `UPDATE categories 
       SET name = $1, description = $2, sort_order = $3, status = $4 
       WHERE id = $5`,
      [name, description, sort_order, status, categoryId]
    );

    const result = await query('SELECT * FROM categories WHERE id = $1', [categoryId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '分类不存在' });
    }

    res.json({
      message: '分类更新成功',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('更新分类错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const productCheck = await query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1 AND status = $2',
      [categoryId, 'active']
    );

    if (parseInt(productCheck.rows[0]?.count || 0) > 0) {
      return res.status(400).json({ message: '该分类下还有商品，无法删除' });
    }

    const result = await query('DELETE FROM categories WHERE id = $1', [categoryId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: '分类不存在' });
    }

    res.json({ message: '分类删除成功' });
  } catch (error) {
    console.error('删除分类错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
