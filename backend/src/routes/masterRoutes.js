const express = require('express');
const router = express.Router();

const masterReviews = [];
let reviewIdCounter = 1;

const masterAccounts = [
  { id: 1, name: '玄空子', title: '首席命理师', experience: 30, specialty: ['八字', '姓名学', '风水'] },
  { id: 2, name: '了然大师', title: '资深命理师', experience: 25, specialty: ['姓名学', '周易', '择日'] },
  { id: 3, name: '清风居士', title: '命理顾问', experience: 20, specialty: ['八字', '紫微斗数', '起名'] }
];

router.get('/masters', (req, res) => {
  res.json({
    success: true,
    data: masterAccounts
  });
});

router.post('/submit-review', (req, res) => {
  try {
    const {
      nameId,
      fullName,
      surname,
      name,
      birthday,
      birthHour,
      gender,
      masterId,
      userContact,
      userNote
    } = req.body;
    
    const review = {
      id: reviewIdCounter++,
      nameId,
      fullName,
      surname,
      name,
      birthday,
      birthHour,
      gender,
      masterId,
      masterName: masterAccounts.find(m => m.id === masterId)?.name || '待分配',
      userContact,
      userNote,
      status: 'pending',
      createdAt: new Date().toISOString(),
      masterComment: '',
      masterScore: 0,
      suggestions: [],
      completedAt: null
    };
    
    masterReviews.push(review);
    
    res.json({
      success: true,
      message: '已提交命理师复核申请',
      data: {
        reviewId: review.id,
        status: 'pending'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '提交失败',
      error: error.message
    });
  }
});

router.get('/reviews/:id', (req, res) => {
  try {
    const { id } = req.params;
    const review = masterReviews.find(r => r.id === parseInt(id));
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: '复核申请不存在'
      });
    }
    
    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查询失败',
      error: error.message
    });
  }
});

router.post('/reviews/:id/complete', (req, res) => {
  try {
    const { id } = req.params;
    const { masterComment, masterScore, suggestions } = req.body;
    
    const review = masterReviews.find(r => r.id === parseInt(id));
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: '复核申请不存在'
      });
    }
    
    review.status = 'completed';
    review.masterComment = masterComment || '';
    review.masterScore = masterScore || 0;
    review.suggestions = suggestions || [];
    review.completedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: '复核已完成',
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '操作失败',
      error: error.message
    });
  }
});

router.get('/reviews', (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let filtered = [...masterReviews];
    
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }
    
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + parseInt(limit));
    
    res.json({
      success: true,
      data: {
        reviews: paginated,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查询失败',
      error: error.message
    });
  }
});

module.exports = router;
