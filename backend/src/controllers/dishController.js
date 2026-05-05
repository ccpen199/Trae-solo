const db = require('../models');
const { Op } = require('sequelize');

const getCategories = async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = {};
    if (status !== undefined && status !== '') {
      where.status = parseInt(status);
    }
    
    const categories = await db.Category.findAll({
      where,
      order: [['sort', 'ASC']]
    });
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: categories
    });
    
  } catch (error) {
    console.error('获取分类列表错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, sort, description, icon } = req.body;
    
    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '分类名称不能为空'
      });
    }
    
    const existing = await db.Category.findOne({ where: { name } });
    if (existing) {
      return res.status(400).json({
        code: 400,
        message: '分类名称已存在'
      });
    }
    
    const category = await db.Category.create({
      name,
      sort: sort || 0,
      description,
      icon
    });
    
    return res.json({
      code: 200,
      message: '创建成功',
      data: category
    });
    
  } catch (error) {
    console.error('创建分类错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sort, description, icon, status } = req.body;
    
    const category = await db.Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        code: 404,
        message: '分类不存在'
      });
    }
    
    if (name && name !== category.name) {
      const existing = await db.Category.findOne({ where: { name, id: { [Op.ne]: id } } });
      if (existing) {
        return res.status(400).json({
          code: 400,
          message: '分类名称已存在'
        });
      }
    }
    
    await category.update({
      name,
      sort,
      description,
      icon,
      status
    });
    
    return res.json({
      code: 200,
      message: '更新成功',
      data: category
    });
    
  } catch (error) {
    console.error('更新分类错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await db.Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        code: 404,
        message: '分类不存在'
      });
    }
    
    const dishCount = await db.Dish.count({ where: { categoryId: id } });
    if (dishCount > 0) {
      return res.status(400).json({
        code: 400,
        message: `该分类下有 ${dishCount} 个菜品，请先删除或转移菜品`
      });
    }
    
    await category.destroy();
    
    return res.json({
      code: 200,
      message: '删除成功'
    });
    
  } catch (error) {
    console.error('删除分类错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const getDishes = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, categoryId, status } = req.query;
    
    const where = {};
    
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (status !== undefined && status !== '') {
      where.status = parseInt(status);
    }
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    
    const { count, rows } = await db.Dish.findAndCountAll({
      where,
      include: [
        { model: db.Category, as: 'category' },
        { model: db.Inventory, as: 'inventory' }
      ],
      order: [['categoryId', 'ASC'], ['sort', 'ASC']],
      offset,
      limit
    });
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
    
  } catch (error) {
    console.error('获取菜品列表错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const getDishById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const dish = await db.Dish.findByPk(id, {
      include: [
        { model: db.Category, as: 'category' },
        { model: db.Inventory, as: 'inventory' }
      ]
    });
    
    if (!dish) {
      return res.status(404).json({
        code: 404,
        message: '菜品不存在'
      });
    }
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: dish
    });
    
  } catch (error) {
    console.error('获取菜品详情错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const createDish = async (req, res) => {
  try {
    const { name, code, categoryId, price, costPrice, unit, image, description, status, sort, isRecommend, isHot, ingredients } = req.body;
    
    if (!name || !categoryId || price === undefined) {
      return res.status(400).json({
        code: 400,
        message: '菜品名称、分类和价格不能为空'
      });
    }
    
    const category = await db.Category.findByPk(categoryId);
    if (!category) {
      return res.status(400).json({
        code: 400,
        message: '分类不存在'
      });
    }
    
    const dish = await db.Dish.create({
      name,
      code,
      categoryId,
      price,
      costPrice: costPrice || 0,
      unit: unit || '份',
      image,
      description,
      status: status ?? 1,
      sort: sort || 0,
      isRecommend: isRecommend || false,
      isHot: isHot || false,
      ingredients: ingredients || []
    });
    
    return res.json({
      code: 200,
      message: '创建成功',
      data: dish
    });
    
  } catch (error) {
    console.error('创建菜品错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const updateDish = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, categoryId, price, costPrice, unit, image, description, status, sort, isRecommend, isHot, ingredients } = req.body;
    
    const dish = await db.Dish.findByPk(id);
    if (!dish) {
      return res.status(404).json({
        code: 404,
        message: '菜品不存在'
      });
    }
    
    if (categoryId) {
      const category = await db.Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({
          code: 400,
          message: '分类不存在'
        });
      }
    }
    
    await dish.update({
      name,
      code,
      categoryId,
      price,
      costPrice,
      unit,
      image,
      description,
      status,
      sort,
      isRecommend,
      isHot,
      ingredients
    });
    
    return res.json({
      code: 200,
      message: '更新成功',
      data: dish
    });
    
  } catch (error) {
    console.error('更新菜品错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const updateDishStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (status === undefined || status === null) {
      return res.status(400).json({
        code: 400,
        message: '状态不能为空'
      });
    }
    
    const dish = await db.Dish.findByPk(id);
    if (!dish) {
      return res.status(404).json({
        code: 404,
        message: '菜品不存在'
      });
    }
    
    await dish.update({ status });
    
    return res.json({
      code: 200,
      message: '状态更新成功',
      data: dish
    });
    
  } catch (error) {
    console.error('更新菜品状态错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const deleteDish = async (req, res) => {
  try {
    const { id } = req.params;
    
    const dish = await db.Dish.findByPk(id);
    if (!dish) {
      return res.status(404).json({
        code: 404,
        message: '菜品不存在'
      });
    }
    
    await dish.destroy();
    
    return res.json({
      code: 200,
      message: '删除成功'
    });
    
  } catch (error) {
    console.error('删除菜品错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

const getMenu = async (req, res) => {
  try {
    const { categoryId } = req.query;
    
    const categoryWhere = { status: 1 };
    const dishWhere = { status: 1 };
    
    if (categoryId) {
      categoryWhere.id = categoryId;
      dishWhere.categoryId = categoryId;
    }
    
    const categories = await db.Category.findAll({
      where: categoryWhere,
      order: [['sort', 'ASC']]
    });
    
    const dishes = await db.Dish.findAll({
      where: dishWhere,
      include: [
        { model: db.Category, as: 'category' }
      ],
      order: [['categoryId', 'ASC'], ['sort', 'ASC']]
    });
    
    const categoryMap = {};
    for (const cat of categories) {
      categoryMap[cat.id] = {
        ...cat.toJSON(),
        dishes: []
      };
    }
    
    for (const dish of dishes) {
      if (categoryMap[dish.categoryId]) {
        categoryMap[dish.categoryId].dishes.push(dish);
      }
    }
    
    const menu = Object.values(categoryMap);
    
    return res.json({
      code: 200,
      message: '获取成功',
      data: menu
    });
    
  } catch (error) {
    console.error('获取菜单错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getDishes,
  getDishById,
  createDish,
  updateDish,
  updateDishStatus,
  deleteDish,
  getMenu
};
