const { mockProducts, mockNews, mockProductCategories, mockNewsCategories, mockUsers } = require('../utils/mockData');
const jwt = require('jsonwebtoken');

const getMockProducts = (req, res) => {
  const { page = 1, limit = 10, keyword, category_id, is_recommended, is_new, is_hot } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  let filtered = [...mockProducts];
  
  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(lowerKeyword) || 
      p.summary.toLowerCase().includes(lowerKeyword) ||
      p.description.toLowerCase().includes(lowerKeyword)
    );
  }
  
  if (is_recommended === 'true') {
    filtered = filtered.filter(p => p.is_recommended);
  }
  
  if (is_new === 'true') {
    filtered = filtered.filter(p => p.is_new);
  }
  
  if (is_hot === 'true') {
    filtered = filtered.filter(p => p.is_hot);
  }
  
  const total = filtered.length;
  const start = (pageNum - 1) * limitNum;
  const end = start + limitNum;
  const data = filtered.slice(start, end);
  
  res.json({
    success: true,
    data: {
      list: data,
      total,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(total / limitNum)
    }
  });
};

const getMockProductDetail = (req, res) => {
  const { id } = req.params;
  const product = mockProducts.find(p => p.id === id);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: '产品不存在'
    });
  }
  
  res.json({
    success: true,
    data: product
  });
};

const getMockRecommendedProducts = (req, res) => {
  const { limit = 4 } = req.query;
  const recommended = mockProducts
    .filter(p => p.is_recommended)
    .slice(0, parseInt(limit));
  
  res.json({
    success: true,
    data: recommended
  });
};

const getMockNewProducts = (req, res) => {
  const { limit = 8 } = req.query;
  const newProducts = mockProducts
    .filter(p => p.is_new)
    .slice(0, parseInt(limit));
  
  res.json({
    success: true,
    data: newProducts
  });
};

const getMockHotProducts = (req, res) => {
  const { limit = 8 } = req.query;
  const hotProducts = mockProducts
    .filter(p => p.is_hot)
    .slice(0, parseInt(limit));
  
  res.json({
    success: true,
    data: hotProducts
  });
};

const getMockProductCategories = (req, res) => {
  res.json({
    success: true,
    data: mockProductCategories
  });
};

const getMockNews = (req, res) => {
  const { page = 1, limit = 10, keyword, category_id, is_recommended, is_top } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  let filtered = [...mockNews];
  
  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    filtered = filtered.filter(n => 
      n.title.toLowerCase().includes(lowerKeyword) || 
      n.summary.toLowerCase().includes(lowerKeyword)
    );
  }
  
  if (is_recommended === 'true') {
    filtered = filtered.filter(n => n.is_recommended);
  }
  
  if (is_top === 'true') {
    filtered = filtered.filter(n => n.is_top);
  }
  
  const total = filtered.length;
  const start = (pageNum - 1) * limitNum;
  const end = start + limitNum;
  const data = filtered.slice(start, end);
  
  res.json({
    success: true,
    data: {
      list: data,
      total,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(total / limitNum)
    }
  });
};

const getMockNewsDetail = (req, res) => {
  const { id } = req.params;
  const news = mockNews.find(n => n.id === id);
  
  if (!news) {
    return res.status(404).json({
      success: false,
      message: '新闻不存在'
    });
  }
  
  res.json({
    success: true,
    data: news
  });
};

const getMockLatestNews = (req, res) => {
  const { limit = 5 } = req.query;
  const latest = [...mockNews]
    .sort((a, b) => new Date(b.publish_at) - new Date(a.publish_at))
    .slice(0, parseInt(limit));
  
  res.json({
    success: true,
    data: latest
  });
};

const getMockRecommendedNews = (req, res) => {
  const { limit = 5 } = req.query;
  const recommended = mockNews
    .filter(n => n.is_recommended)
    .slice(0, parseInt(limit));
  
  res.json({
    success: true,
    data: recommended
  });
};

const getMockNewsCategories = (req, res) => {
  res.json({
    success: true,
    data: mockNewsCategories
  });
};

const mockLogin = (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign({ id: mockUsers[0].id, username: 'admin' }, process.env.JWT_SECRET || 'jwt_secret_key', { expiresIn: '7d' });
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          ...mockUsers[0],
          password: undefined
        }
      }
    });
  } else if (username === 'test' && password === 'test123') {
    const token = jwt.sign({ id: mockUsers[1].id, username: 'test' }, process.env.JWT_SECRET || 'jwt_secret_key', { expiresIn: '7d' });
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          ...mockUsers[1],
          password: undefined
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }
};

const mockRegister = (req, res) => {
  const { username, email, password, phone } = req.body;
  
  res.json({
    success: true,
    message: '注册成功',
    data: {
      id: 'new-user-id',
      username,
      email,
      phone,
      nickname: username,
      user_type: 'member',
      status: 'pending'
    }
  });
};

const getMockCurrentUser = (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未登录'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret_key');
    const user = mockUsers.find(u => u.username === decoded.username);
    
    if (user) {
      res.json({
        success: true,
        data: {
          ...user,
          password: undefined
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token 无效'
    });
  }
};

module.exports = {
  getMockProducts,
  getMockProductDetail,
  getMockRecommendedProducts,
  getMockNewProducts,
  getMockHotProducts,
  getMockProductCategories,
  getMockNews,
  getMockNewsDetail,
  getMockLatestNews,
  getMockRecommendedNews,
  getMockNewsCategories,
  mockLogin,
  mockRegister,
  getMockCurrentUser
};