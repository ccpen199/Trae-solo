const { Op } = require('sequelize');
const { Product, ProductCategory } = require('../models');

const getProducts = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, categoryId, isRecommended, isNew, isHot, sort } = req.query;
    
    const where = { status: 'active' };
    
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { summary: { [Op.like]: `%${keyword}%` } },
        { keywords: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    if (categoryId) {
      where.category_id = categoryId;
    }
    
    if (isRecommended === 'true') {
      where.is_recommended = true;
    }
    
    if (isNew === 'true') {
      where.is_new = true;
    }
    
    if (isHot === 'true') {
      where.is_hot = true;
    }
    
    let order = [['sort', 'ASC'], ['created_at', 'DESC']];
    if (sort === 'newest') {
      order = [['created_at', 'DESC']];
    } else if (sort === 'price-asc') {
      order = [['price', 'ASC']];
    } else if (sort === 'price-desc') {
      order = [['price', 'DESC']];
    } else if (sort === 'hot') {
      order = [['view_count', 'DESC']];
    }
    
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);
    
    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [{ model: ProductCategory, as: 'category', attributes: ['id', 'name'] }],
      order,
      offset,
      limit
    });
    
    res.json({
      success: true,
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('获取产品列表错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id, {
      include: [{ model: ProductCategory, as: 'category', attributes: ['id', 'name'] }]
    });
    
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }
    
    await product.increment('view_count');
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('获取产品详情错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const getRecommendedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const products = await Product.findAll({
      where: {
        status: 'active',
        is_recommended: true
      },
      include: [{ model: ProductCategory, as: 'category', attributes: ['id', 'name'] }],
      order: [['sort', 'ASC'], ['created_at', 'DESC']],
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('获取推荐产品错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const getCategories = async (req, res) => {
  try {
    const { parentId } = req.query;
    
    const where = { status: 'active' };
    if (parentId) {
      where.parent_id = parentId;
    } else {
      where.parent_id = { [Op.is]: null };
    }
    
    const categories = await ProductCategory.findAll({
      where,
      include: [{ model: ProductCategory, as: 'children' }],
      order: [['sort', 'ASC']]
    });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('获取产品分类错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await ProductCategory.findAll({
      where: { status: 'active' },
      order: [['sort', 'ASC']]
    });
    
    const buildTree = (parentId = null) => {
      return categories
        .filter(cat => (parentId === null ? !cat.parent_id : cat.parent_id === parentId))
        .map(cat => ({
          ...cat.toJSON(),
          children: buildTree(cat.id)
        }));
    };
    
    const categoryTree = buildTree();
    
    res.json({
      success: true,
      data: categoryTree
    });
  } catch (error) {
    console.error('获取所有产品分类错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const createProduct = async (req, res) => {
  try {
    const {
      title, code, categoryId, summary, description, mainImage, images,
      price, originalPrice, stock, unit, specifications, keywords,
      isRecommended, isNew, isHot, sort, status
    } = req.body;
    
    const product = await Product.create({
      title,
      code,
      category_id: categoryId,
      summary,
      description,
      main_image: mainImage,
      images,
      price,
      original_price: originalPrice,
      stock,
      unit,
      specifications,
      keywords,
      is_recommended: isRecommended,
      is_new: isNew,
      is_hot: isHot,
      sort: sort || 0,
      status: status || 'active',
      publish_at: status === 'active' ? new Date() : null
    });
    
    res.status(201).json({
      success: true,
      message: '产品创建成功',
      data: product
    });
  } catch (error) {
    console.error('创建产品错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, code, categoryId, summary, description, mainImage, images,
      price, originalPrice, stock, unit, specifications, keywords,
      isRecommended, isNew, isHot, sort, status
    } = req.body;
    
    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }
    
    await product.update({
      title,
      code,
      category_id: categoryId,
      summary,
      description,
      main_image: mainImage,
      images,
      price,
      original_price: originalPrice,
      stock,
      unit,
      specifications,
      keywords,
      is_recommended: isRecommended,
      is_new: isNew,
      is_hot: isHot,
      sort,
      status,
      publish_at: status === 'active' && !product.publish_at ? new Date() : product.publish_at
    });
    
    res.json({
      success: true,
      message: '产品更新成功',
      data: product
    });
  } catch (error) {
    console.error('更新产品错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: '产品不存在' });
    }
    
    await product.destroy();
    
    res.json({
      success: true,
      message: '产品删除成功'
    });
  } catch (error) {
    console.error('删除产品错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getRecommendedProducts,
  getCategories,
  getAllCategories,
  createProduct,
  updateProduct,
  deleteProduct
};