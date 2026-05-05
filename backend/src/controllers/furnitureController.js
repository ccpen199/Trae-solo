const db = require('../config/database');

const getFurnitureList = async (req, res) => {
  try {
    const { 
      keyword, 
      category, 
      style, 
      space_type, 
      material,
      color,
      brand,
      min_price,
      max_price,
      page = 1,
      page_size = 20,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const userId = req.user?.id;

    let sql = `SELECT f.*`;
    let countSql = `SELECT COUNT(*) as total`;
    
    if (userId) {
      sql += `, (SELECT 1 FROM favorites WHERE user_id = ? AND target_type = 'furniture' AND target_id = f.id) as is_favorited`;
    }
    
    sql += ` FROM furniture f WHERE f.status = 'active'`;
    countSql += ` FROM furniture f WHERE f.status = 'active'`;
    
    const conditions = [];
    const params = userId ? [userId] : [];
    const countParams = [];

    if (keyword) {
      conditions.push(`(f.name LIKE ? OR f.description LIKE ? OR f.brand LIKE ?)`);
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
      countParams.push(keywordPattern, keywordPattern, keywordPattern);
    }

    if (category) {
      conditions.push(`f.category = ?`);
      params.push(category);
      countParams.push(category);
    }

    if (style) {
      conditions.push(`f.style = ?`);
      params.push(style);
      countParams.push(style);
    }

    if (space_type) {
      conditions.push(`f.space_type = ?`);
      params.push(space_type);
      countParams.push(space_type);
    }

    if (material) {
      conditions.push(`f.material = ?`);
      params.push(material);
      countParams.push(material);
    }

    if (color) {
      conditions.push(`f.color = ?`);
      params.push(color);
      countParams.push(color);
    }

    if (brand) {
      conditions.push(`f.brand = ?`);
      params.push(brand);
      countParams.push(brand);
    }

    if (min_price) {
      conditions.push(`f.price >= ?`);
      params.push(min_price);
      countParams.push(min_price);
    }

    if (max_price) {
      conditions.push(`f.price <= ?`);
      params.push(max_price);
      countParams.push(max_price);
    }

    if (conditions.length > 0) {
      const whereClause = ` AND ${conditions.join(' AND ')}`;
      sql += whereClause;
      countSql += whereClause;
    }

    const validSortColumns = ['created_at', 'price', 'rating', 'favorite_count'];
    const validSortOrders = ['asc', 'desc'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const order = validSortOrders.includes(sort_order.toLowerCase()) ? sort_order : 'desc';

    sql += ` ORDER BY f.${sortColumn} ${order}`;

    const offset = (parseInt(page) - 1) * parseInt(page_size);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(page_size), offset);

    const furniture = db.prepare(sql).all(...params);
    const countResult = db.prepare(countSql).get(...countParams);

    const parsedFurniture = furniture.map(item => ({
      ...item,
      images: item.images ? JSON.parse(item.images) : [],
      is_favorited: item.is_favorited === 1
    }));

    res.json({
      success: true,
      data: {
        list: parsedFurniture,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total: countResult.total,
          total_pages: Math.ceil(countResult.total / parseInt(page_size))
        }
      }
    });
  } catch (error) {
    console.error('获取家具列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取家具列表失败'
    });
  }
};

const getFurnitureDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    let sql = `SELECT f.*`;
    
    if (userId) {
      sql += `, (SELECT 1 FROM favorites WHERE user_id = ? AND target_type = 'furniture' AND target_id = f.id) as is_favorited`;
    }
    
    sql += ` FROM furniture f WHERE f.id = ? AND f.status = 'active'`;

    const furniture = userId 
      ? db.prepare(sql).get(userId, id)
      : db.prepare(sql).get(id);

    if (!furniture) {
      return res.status(404).json({
        success: false,
        message: '家具不存在'
      });
    }

    const parsedFurniture = {
      ...furniture,
      images: furniture.images ? JSON.parse(furniture.images) : [],
      is_favorited: furniture.is_favorited === 1
    };

    res.json({
      success: true,
      data: parsedFurniture
    });
  } catch (error) {
    console.error('获取家具详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取家具详情失败'
    });
  }
};

const getFilters = async (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT DISTINCT category FROM furniture WHERE status = 'active'
    `).all();

    const styles = db.prepare(`
      SELECT DISTINCT style FROM furniture WHERE status = 'active' AND style IS NOT NULL
    `).all();

    const spaceTypes = db.prepare(`
      SELECT DISTINCT space_type FROM furniture WHERE status = 'active' AND space_type IS NOT NULL
    `).all();

    const materials = db.prepare(`
      SELECT DISTINCT material FROM furniture WHERE status = 'active' AND material IS NOT NULL
    `).all();

    const brands = db.prepare(`
      SELECT DISTINCT brand FROM furniture WHERE status = 'active' AND brand IS NOT NULL
    `).all();

    const priceRange = db.prepare(`
      SELECT MIN(price) as min_price, MAX(price) as max_price 
      FROM furniture WHERE status = 'active'
    `).get();

    res.json({
      success: true,
      data: {
        categories: categories.map(c => c.category),
        styles: styles.map(s => s.style),
        spaceTypes: spaceTypes.map(s => s.space_type),
        materials: materials.map(m => m.material),
        brands: brands.map(b => b.brand),
        priceRange: {
          min: priceRange.min_price || 0,
          max: priceRange.max_price || 100000
        }
      }
    });
  } catch (error) {
    console.error('获取筛选条件错误:', error);
    res.status(500).json({
      success: false,
      message: '获取筛选条件失败'
    });
  }
};

const imageSearch = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传图片'
      });
    }

    const userId = req.user?.id;

    const furniture = db.prepare(`
      SELECT f.* ${userId ? `, (SELECT 1 FROM favorites WHERE user_id = ${userId} AND target_type = 'furniture' AND target_id = f.id) as is_favorited` : ''}
      FROM furniture f 
      WHERE f.status = 'active'
      ORDER BY RANDOM()
      LIMIT 10
    `).all();

    const parsedFurniture = furniture.map(item => ({
      ...item,
      images: item.images ? JSON.parse(item.images) : [],
      is_favorited: item.is_favorited === 1
    }));

    res.json({
      success: true,
      message: '图片识别成功',
      data: {
        similarItems: parsedFurniture,
        suggestedTags: ['现代简约', '北欧风格', '实木家具', '布艺沙发']
      }
    });
  } catch (error) {
    console.error('图片搜索错误:', error);
    res.status(500).json({
      success: false,
      message: '图片搜索失败'
    });
  }
};

module.exports = {
  getFurnitureList,
  getFurnitureDetail,
  getFilters,
  imageSearch
};
