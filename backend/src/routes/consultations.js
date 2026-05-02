const express = require('express');
const router = express.Router();
const { authenticateToken, requireClient, requireLawyer, requireLawyerOrSupport } = require('../middlewares/auth');
const consultationService = require('../services/ConsultationService');
const consultationRouter = require('../engines/ConsultationRouter');
const billingGate = require('../engines/BillingGate');
const { run, get } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

router.post('/', authenticateToken, requireClient, async (req, res) => {
  try {
    const { title, description, category, urgency, budgetAmount } = req.body;

    if (!title || !description || !category || !budgetAmount) {
      return res.status(400).json({ 
        success: false, 
        message: '标题、描述、分类和预算为必填项' 
      });
    }

    const result = await consultationService.createConsultation(req.user.id, {
      title,
      description,
      category,
      urgency,
      budgetAmount
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('创建咨询单错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.post('/:id/pay', authenticateToken, requireClient, async (req, res) => {
  try {
    const consultationId = req.params.id;
    const { paymentMethod = 'online' } = req.body;

    const consultation = await get(
      'SELECT * FROM consultations WHERE id = ? AND user_id = ?',
      [consultationId, req.user.id]
    );

    if (!consultation) {
      return res.status(404).json({ success: false, message: '咨询单不存在' });
    }

    if (consultation.status !== 'pending_payment') {
      return res.status(400).json({ success: false, message: '咨询单当前状态不可支付' });
    }

    const paymentResult = await billingGate.processPayment(
      consultationId,
      req.user.id,
      consultation.budget_amount,
      paymentMethod
    );

    if (!paymentResult.success) {
      return res.status(400).json(paymentResult);
    }

    await run(
      'UPDATE consultations SET payment_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [paymentResult.paymentId, 'pending_accept', consultationId]
    );

    const routingResult = await consultationRouter.routeConsultation(consultation);

    if (routingResult.success) {
      await run(
        'UPDATE consultations SET lawyer_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [routingResult.lawyer_id, consultationId]
      );
    }

    res.json({
      success: true,
      consultationId,
      payment: paymentResult,
      routing: routingResult.success ? {
        lawyerId: routingResult.lawyer_id,
        score: routingResult.score
      } : null
    });
  } catch (error) {
    console.error('支付错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/my', authenticateToken, async (req, res) => {
  try {
    const { status, category, limit = 20, offset = 0 } = req.query;

    const result = await consultationService.getMyConsultations(
      req.user.id,
      req.user.role,
      {
        status,
        category,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    );

    res.json(result);
  } catch (error) {
    console.error('获取咨询单列表错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await consultationService.getConsultationById(
      req.params.id,
      req.user.id,
      req.user.role
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('获取咨询单详情错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.post('/:id/accept', authenticateToken, requireLawyer, async (req, res) => {
  try {
    const result = await consultationService.acceptConsultation(
      req.params.id,
      req.user.id
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('接单错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.post('/:id/suggestion', authenticateToken, requireLawyer, async (req, res) => {
  try {
    const { summary, detailedAdvice, legalBasis, recommendedActions, followUpNeeded } = req.body;

    if (!summary || !detailedAdvice) {
      return res.status(400).json({ 
        success: false, 
        message: '摘要和详细建议为必填项' 
      });
    }

    const result = await consultationService.submitSuggestion(
      req.params.id,
      req.user.id,
      {
        summary,
        detailedAdvice,
        legalBasis,
        recommendedActions,
        followUpNeeded
      }
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('提交建议错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.post('/:id/confirm', authenticateToken, requireClient, async (req, res) => {
  try {
    const result = await consultationService.confirmSuggestion(
      req.params.id,
      req.user.id
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('确认建议错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.post('/:id/review', authenticateToken, requireClient, async (req, res) => {
  try {
    const { rating, comment, isAnonymous } = req.body;

    if (rating === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: '评分为必填项' 
      });
    }

    const result = await consultationService.submitReview(
      req.params.id,
      req.user.id,
      {
        rating,
        comment,
        isAnonymous
      }
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('提交评价错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/lawyer/pending', authenticateToken, requireLawyer, async (req, res) => {
  try {
    const result = await consultationService.getPendingAssignments(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('获取待分配咨询单错误:', error);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

module.exports = router;
