const express = require('express');
const { Category } = require('../models');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { status: 'active' },
      order: [['sort', 'ASC'], ['id', 'ASC']]
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: '获取分类失败'
    });
  }
});

module.exports = router;
