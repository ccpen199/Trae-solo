const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { optionalAuth, isVip } = require('../middleware/auth');

const calculatePrice = (product, user) => {
  let displayPrice = product.original_price;
  
  const userIsVip = isVip(user);

  if (product.activity_price !== null && product.activity_price !== undefined) {
    displayPrice = product.activity_price;
  } else if (userIsVip && product.member_price !== null && product.member_price !== undefined) {
    displayPrice = product.member_price;
  }

  return displayPrice;
};

router.get('/', (req, res) => {
  const db = getDb();
  
  const channels = db.prepare(`
    SELECT * FROM channels 
    WHERE status = 1 
    ORDER BY sort_order ASC, id ASC
  `).all();

  res.json({
    success: true,
    data: channels
  });
});

router.get('/:channelCode/featured', optionalAuth, (req, res) => {
  const { channelCode } = req.params;
  const { limit = 10 } = req.query;
  const db = getDb();
  const user = req.user;

  let products;

  switch (channelCode) {
    case 'recommend':
      products = db.prepare(`
        SELECT * FROM products 
        WHERE is_on_sale = 1 AND stock > 0
        ORDER BY is_hot DESC, sales_count DESC, created_at DESC
        LIMIT ?
      `).all(parseInt(limit));
      break;
    
    case 'new':
      products = db.prepare(`
        SELECT * FROM products 
        WHERE is_on_sale = 1 AND stock > 0 AND is_new = 1
        ORDER BY created_at DESC
        LIMIT ?
      `).all(parseInt(limit));
      break;
    
    case 'crowdfunding':
      return res.json({
        success: true,
        data: {
          type: 'crowdfunding',
          message: '请访问众筹专区'
        }
      });
    
    case 'welfare':
      products = db.prepare(`
        SELECT * FROM products 
        WHERE is_on_sale = 1 AND stock > 0 AND activity_price IS NOT NULL
        ORDER BY activity_price ASC
        LIMIT ?
      `).all(parseInt(limit));
      break;
    
    case 'flash':
      products = db.prepare(`
        SELECT * FROM products 
        WHERE is_on_sale = 1 AND stock > 0 AND activity_price IS NOT NULL
        ORDER BY (original_price - activity_price) DESC
        LIMIT ?
      `).all(parseInt(limit));
      break;
    
    default:
      products = db.prepare(`
        SELECT * FROM products 
        WHERE is_on_sale = 1 AND stock > 0
        ORDER BY RANDOM()
        LIMIT ?
      `).all(parseInt(limit));
  }

  res.json({
    success: true,
    data: products.map(p => ({
      id: p.id,
      name: p.name,
      subtitle: p.subtitle,
      original_price: p.original_price,
      display_price: calculatePrice(p, user),
      member_price: p.member_price,
      activity_price: p.activity_price,
      stock: p.stock,
      sales_count: p.sales_count,
      images: p.images,
      is_new: p.is_new,
      is_hot: p.is_hot,
      can_buy: true,
      stock_warning: p.stock <= 10 ? p.stock : null
    }))
  });
});

router.get('/recommend/modules', optionalAuth, (req, res) => {
  const db = getDb();
  const user = req.user;

  const guessLike = db.prepare(`
    SELECT * FROM products 
    WHERE is_on_sale = 1 AND stock > 0
    ORDER BY RANDOM()
    LIMIT 6
  `).all();

  const hotProducts = db.prepare(`
    SELECT * FROM products 
    WHERE is_on_sale = 1 AND stock > 0 AND is_hot = 1
    ORDER BY sales_count DESC
    LIMIT 10
  `).all();

  const brandDirect = db.prepare(`
    SELECT * FROM products 
    WHERE is_on_sale = 1 AND stock > 0 AND brand IS NOT NULL
    ORDER BY sales_count DESC
    LIMIT 6
  `).all();

  const formatProduct = (p) => ({
    id: p.id,
    name: p.name,
    subtitle: p.subtitle,
    original_price: p.original_price,
    display_price: calculatePrice(p, user),
    member_price: p.member_price,
    activity_price: p.activity_price,
    stock: p.stock,
    sales_count: p.sales_count,
    images: p.images,
    is_new: p.is_new,
    is_hot: p.is_hot,
    can_buy: true
  });

  res.json({
    success: true,
    data: {
      modules: [
        {
          id: 'personalized',
          name: '私人订制',
          description: '根据您的偏好推荐',
          icon: '🎨',
          products: guessLike.slice(0, 3).map(formatProduct)
        },
        {
          id: 'guess-like',
          name: '猜你喜欢',
          description: '为您精选推荐',
          icon: '❤️',
          products: guessLike.map(formatProduct)
        },
        {
          id: 'hot-ranking',
          name: '人气榜',
          description: '大家都在买',
          icon: '🔥',
          products: hotProducts.map(formatProduct)
        },
        {
          id: 'brand-direct',
          name: '品牌制造商直供',
          description: '大牌品质，工厂价格',
          icon: '🏭',
          products: brandDirect.map(formatProduct)
        },
        {
          id: 'group-buy',
          name: '严选一起拼',
          description: '拼团更优惠',
          icon: '👥',
          products: hotProducts.slice(0, 4).map(formatProduct)
        },
        {
          id: 'points-center',
          name: '积分中心',
          description: '积分当钱花',
          icon: '💎',
          link: '/points'
        },
        {
          id: 'member-club',
          name: '会员俱乐部',
          description: '尊享会员权益',
          icon: '👑',
          link: '/member'
        }
      ]
    }
  });
});

module.exports = router;
