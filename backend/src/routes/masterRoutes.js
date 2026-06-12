const express = require('express');
const router = express.Router();

const masterReviews = [];
const reviewStatusLogs = {};
let reviewIdCounter = 1;

const masterAccounts = [
  { 
    id: 1, 
    name: '玄空子', 
    title: '首席命理师', 
    experience: 30, 
    specialty: ['八字', '姓名学', '风水'],
    avatar: '👤',
    description: '传承道家姓名学，精研三命通会，从业30年，命名案例过万。',
    signature: '✍️ 玄空子印',
    available: true
  },
  { 
    id: 2, 
    name: '了然大师', 
    title: '资深命理师', 
    experience: 25, 
    specialty: ['姓名学', '周易', '择日'],
    avatar: '👨‍🏫',
    description: '师承台湾命理名师，擅长五格剖象与周易卦象结合起名。',
    signature: '✍️ 了然',
    available: true
  },
  { 
    id: 3, 
    name: '清风居士', 
    title: '命理顾问', 
    experience: 20, 
    specialty: ['八字', '紫微斗数', '起名'],
    avatar: '🧙',
    description: '专注子平八字与姓名能量学研究，命名注重五行平衡与音形义。',
    signature: '✍️ 清风',
    available: false
  }
];

const STATUS_FLOW = {
  pending: { label: '待审核', color: '#faad14', next: ['reviewing', 'rejected'] },
  reviewing: { label: '审核中', color: '#1890ff', next: ['approved', 'rejected', 'pending'] },
  approved: { label: '已通过', color: '#52c41a', next: [] },
  rejected: { label: '已驳回', color: '#f5222d', next: ['reviewing'] }
};

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
      userNote,
      nameAnalysis,
      baziInfo
    } = req.body;
    
    const master = masterAccounts.find(m => m.id === masterId);
    
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
      masterName: master?.name || '待分配',
      masterTitle: master?.title || '',
      masterSignature: master?.signature || '',
      userContact,
      userNote,
      nameAnalysis: nameAnalysis || null,
      baziInfo: baziInfo || null,
      status: 'pending',
      statusLabel: STATUS_FLOW.pending.label,
      statusColor: STATUS_FLOW.pending.color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      masterComment: '',
      masterScore: 0,
      suggestions: [],
      alternativeNames: [],
      completedAt: null,
      signature: null,
      signatureDate: null,
      reviewHistory: [],
      attachments: [],
      priority: userNote && userNote.length > 50 ? 'high' : 'normal',
      estimatedCompleteTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    masterReviews.push(review);
    
    reviewStatusLogs[review.id] = [{
      status: 'pending',
      label: STATUS_FLOW.pending.label,
      timestamp: review.createdAt,
      operator: '用户',
      remark: '提交复核申请'
    }];
    
    review.reviewHistory = reviewStatusLogs[review.id];
    
    res.json({
      success: true,
      message: '已提交命理师复核申请',
      data: {
        reviewId: review.id,
        status: review.status,
        statusLabel: review.statusLabel,
        masterName: review.masterName,
        estimatedCompleteTime: review.estimatedCompleteTime,
        reviewCode: 'MX' + String(review.id).padStart(6, '0')
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
      data: {
        ...review,
        availableActions: STATUS_FLOW[review.status].next.map(action => ({
          action,
          label: STATUS_FLOW[action].label,
          color: STATUS_FLOW[action].color
        })),
        statusFlow: Object.entries(STATUS_FLOW).map(([key, value]) => ({
          status: key,
          label: value.label,
          color: value.color,
          isCurrent: key === review.status
        }))
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

router.post('/reviews/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, operator, remark, masterComment, masterScore, suggestions, alternativeNames } = req.body;
    
    if (!STATUS_FLOW[status]) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }
    
    const review = masterReviews.find(r => r.id === parseInt(id));
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: '复核申请不存在'
      });
    }
    
    if (!STATUS_FLOW[review.status].next.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `无法从"${review.statusLabel}"转换为"${STATUS_FLOW[status].label}"`
      });
    }
    
    const oldStatus = review.status;
    review.status = status;
    review.statusLabel = STATUS_FLOW[status].label;
    review.statusColor = STATUS_FLOW[status].color;
    review.updatedAt = new Date().toISOString();
    
    if (masterComment !== undefined) review.masterComment = masterComment;
    if (masterScore !== undefined) review.masterScore = masterScore;
    if (suggestions !== undefined) review.suggestions = suggestions;
    if (alternativeNames !== undefined) review.alternativeNames = alternativeNames;
    
    if (status === 'approved' || status === 'rejected') {
      review.completedAt = new Date().toISOString();
      review.signature = review.masterSignature;
      review.signatureDate = review.completedAt;
    }
    
    const logEntry = {
      status,
      label: STATUS_FLOW[status].label,
      oldStatus,
      oldLabel: STATUS_FLOW[oldStatus].label,
      timestamp: review.updatedAt,
      operator: operator || '系统',
      remark: remark || `状态从${STATUS_FLOW[oldStatus].label}变更为${STATUS_FLOW[status].label}`
    };
    
    if (!reviewStatusLogs[review.id]) {
      reviewStatusLogs[review.id] = [];
    }
    reviewStatusLogs[review.id].push(logEntry);
    review.reviewHistory = reviewStatusLogs[review.id];
    
    res.json({
      success: true,
      message: `状态已更新为：${STATUS_FLOW[status].label}`,
      data: {
        reviewId: review.id,
        status: review.status,
        statusLabel: review.statusLabel,
        statusColor: review.statusColor,
        updatedAt: review.updatedAt,
        completedAt: review.completedAt,
        signature: review.signature,
        signatureDate: review.signatureDate,
        historyEntry: logEntry
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '状态更新失败',
      error: error.message
    });
  }
});

router.post('/reviews/:id/complete', (req, res) => {
  try {
    const { id } = req.params;
    const { result, masterComment, masterScore, suggestions, alternativeNames } = req.body;
    
    const review = masterReviews.find(r => r.id === parseInt(id));
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: '复核申请不存在'
      });
    }
    
    if (review.status !== 'reviewing') {
      return res.status(400).json({
        success: false,
        message: '当前状态不允许完成复核，请先开始审核'
      });
    }
    
    const finalStatus = result === 'approve' ? 'approved' : 'rejected';
    
    review.status = finalStatus;
    review.statusLabel = STATUS_FLOW[finalStatus].label;
    review.statusColor = STATUS_FLOW[finalStatus].color;
    review.masterComment = masterComment || '';
    review.masterScore = masterScore || 0;
    review.suggestions = suggestions || [];
    review.alternativeNames = alternativeNames || [];
    review.completedAt = new Date().toISOString();
    review.updatedAt = review.completedAt;
    review.signature = review.masterSignature;
    review.signatureDate = review.completedAt;
    
    const logEntry = {
      status: finalStatus,
      label: STATUS_FLOW[finalStatus].label,
      oldStatus: 'reviewing',
      oldLabel: STATUS_FLOW.reviewing.label,
      timestamp: review.updatedAt,
      operator: review.masterName,
      remark: result === 'approve' ? '✅ 复核通过，已签章' : '❌ 复核驳回，请参考建议修改'
    };
    
    if (!reviewStatusLogs[review.id]) {
      reviewStatusLogs[review.id] = [];
    }
    reviewStatusLogs[review.id].push(logEntry);
    review.reviewHistory = reviewStatusLogs[review.id];
    
    res.json({
      success: true,
      message: `复核已${STATUS_FLOW[finalStatus].label}`,
      data: {
        reviewId: review.id,
        status: review.status,
        statusLabel: review.statusLabel,
        statusColor: review.statusColor,
        completedAt: review.completedAt,
        signature: review.signature,
        signatureDate: review.signatureDate,
        masterComment: review.masterComment,
        masterScore: review.masterScore,
        suggestions: review.suggestions,
        historyEntry: logEntry
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '操作失败',
      error: error.message
    });
  }
});

router.post('/reviews/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    const { reason, operator } = req.body;
    
    const review = masterReviews.find(r => r.id === parseInt(id));
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: '复核申请不存在'
      });
    }
    
    review.status = 'rejected';
    review.statusLabel = STATUS_FLOW.rejected.label;
    review.statusColor = STATUS_FLOW.rejected.color;
    review.updatedAt = new Date().toISOString();
    review.completedAt = review.updatedAt;
    
    const logEntry = {
      status: 'rejected',
      label: STATUS_FLOW.rejected.label,
      timestamp: review.updatedAt,
      operator: operator || '系统',
      remark: reason || '申请被驳回'
    };
    
    if (!reviewStatusLogs[review.id]) {
      reviewStatusLogs[review.id] = [];
    }
    reviewStatusLogs[review.id].push(logEntry);
    review.reviewHistory = reviewStatusLogs[review.id];
    
    res.json({
      success: true,
      message: '已驳回复核申请',
      data: {
        reviewId: review.id,
        status: review.status,
        statusLabel: review.statusLabel,
        updatedAt: review.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '驳回失败',
      error: error.message
    });
  }
});

router.post('/reviews/:id/sign', (req, res) => {
  try {
    const { id } = req.params;
    const { signer, password, verificationCode } = req.body;
    
    const review = masterReviews.find(r => r.id === parseInt(id));
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: '复核申请不存在'
      });
    }
    
    if (review.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: '仅审核通过的申请可以签章'
      });
    }
    
    const master = masterAccounts.find(m => m.name === signer || m.id === review.masterId);
    
    review.signature = master?.signature || '✍️ 已签章';
    review.signatureDate = new Date().toISOString();
    review.signatureVerified = true;
    review.updatedAt = review.signatureDate;
    
    const logEntry = {
      status: 'approved',
      label: '已签章',
      timestamp: review.signatureDate,
      operator: signer || review.masterName,
      remark: '🔏 电子签章已生效'
    };
    
    if (!reviewStatusLogs[review.id]) {
      reviewStatusLogs[review.id] = [];
    }
    reviewStatusLogs[review.id].push(logEntry);
    review.reviewHistory = reviewStatusLogs[review.id];
    
    res.json({
      success: true,
      message: '签章成功',
      data: {
        reviewId: review.id,
        signature: review.signature,
        signatureDate: review.signatureDate,
        signatureVerified: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '签章失败',
      error: error.message
    });
  }
});

router.get('/reviews', (req, res) => {
  try {
    const { status, page = 1, limit = 10, masterId, fullName } = req.query;
    
    let filtered = [...masterReviews];
    
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }
    
    if (masterId) {
      filtered = filtered.filter(r => r.masterId === parseInt(masterId));
    }
    
    if (fullName) {
      filtered = filtered.filter(r => r.fullName && r.fullName.includes(fullName));
    }
    
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + parseInt(limit));
    
    const statusStats = {
      pending: masterReviews.filter(r => r.status === 'pending').length,
      reviewing: masterReviews.filter(r => r.status === 'reviewing').length,
      approved: masterReviews.filter(r => r.status === 'approved').length,
      rejected: masterReviews.filter(r => r.status === 'rejected').length,
      total: masterReviews.length
    };
    
    res.json({
      success: true,
      data: {
        reviews: paginated,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        statusStats,
        statusDefinitions: STATUS_FLOW
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

router.get('/reviews/:id/timeline', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!reviewStatusLogs[id]) {
      return res.status(404).json({
        success: false,
        message: '暂无审核记录'
      });
    }
    
    res.json({
      success: true,
      data: {
        reviewId: parseInt(id),
        timeline: reviewStatusLogs[id],
        currentStatus: reviewStatusLogs[id][reviewStatusLogs[id].length - 1]
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
