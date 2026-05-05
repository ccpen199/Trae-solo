const { query } = require('../config/database');

const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;

    const productCheck = await query(
      'SELECT id, user_id FROM products WHERE id = $1 AND status = $2',
      [productId, 'active']
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: '商品不存在' });
    }

    const favoriteCheck = await query(
      'SELECT id FROM favorites WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    if (favoriteCheck.rows.length > 0) {
      await query(
        'DELETE FROM favorites WHERE user_id = $1 AND product_id = $2',
        [userId, productId]
      );
      
      await query(
        'UPDATE products SET favorite_count = MAX(0, favorite_count - 1) WHERE id = $1',
        [productId]
      );

      res.json({ message: '已取消收藏', is_favorite: false });
    } else {
      await query(
        'INSERT INTO favorites (user_id, product_id, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
        [userId, productId]
      );
      
      await query(
        'UPDATE products SET favorite_count = favorite_count + 1 WHERE id = $1',
        [productId]
      );

      res.json({ message: '收藏成功', is_favorite: true });
    }
  } catch (error) {
    console.error('收藏操作错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const getMyFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT f.id as favorite_id, f.created_at as favorite_at, p.*, 
              c.name as category_name, u.username as seller_name, u.nickname as seller_nickname
       FROM favorites f
       LEFT JOIN products p ON f.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE f.user_id = $1 AND p.status = 'active'
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total 
       FROM favorites f
       LEFT JOIN products p ON f.product_id = p.id
       WHERE f.user_id = $1 AND p.status = 'active'`,
      [userId]
    );

    const favorites = result.rows.map(p => {
      if (p.images) {
        try {
          p.images = JSON.parse(p.images);
        } catch {
          p.images = [];
        }
      }
      return p;
    });

    res.json({
      favorites,
      total: parseInt(countResult.rows[0]?.total || 0),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('获取收藏列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  toggleFavorite,
  getMyFavorites
};
