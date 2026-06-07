const { Order, Engineer } = require('../models');
const { generateOrderNo, generateTraceCode, generateHash } = require('../utils/hash');
const dispatchService = require('../services/dispatchService');
const logger = require('../utils/logger');

class OrderController {
  async createOrder(req, res) {
    try {
      const orderData = req.body;
      orderData.order_no = generateOrderNo();
      orderData.status = 0;

      if (orderData.predicted_faults && typeof orderData.predicted_faults === 'object') {
        orderData.predicted_faults = JSON.stringify(orderData.predicted_faults);
      }

      const order = await Order.create(orderData);
      logger.info('创建订单', { orderNo: order.order_no, userId: orderData.user_name });
      
      res.status(201).json(order);
    } catch (error) {
      logger.error('创建订单失败', error);
      res.status(500).json({ error: '创建订单失败' });
    }
  }

  async getOrders(req, res) {
    try {
      const { status, engineerId, page = 1, pageSize = 20 } = req.query;
      const where = {};
      
      if (status !== undefined) where.status = status;
      if (engineerId) where.engineer_id = engineerId;

      const { count, rows } = await Order.findAndCountAll({
        where,
        include: [{
          model: Engineer,
          as: 'Engineer',
          attributes: ['id', 'name', 'phone', 'certificate_level', 'success_rate', 'service_radius', 'equipment_id', 'avg_rating']
        }],
        order: [['created_at', 'DESC']],
        limit: parseInt(pageSize),
        offset: (parseInt(page) - 1) * parseInt(pageSize)
      });

      const orders = rows.map(order => {
        const orderJson = order.toJSON();
        try {
          if (orderJson.predicted_faults) {
            orderJson.predicted_faults = JSON.parse(orderJson.predicted_faults);
          }
        } catch (e) {}
        return orderJson;
      });

      res.json({
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        list: orders
      });
    } catch (error) {
      logger.error('获取订单列表失败', error);
      res.status(500).json({ error: '获取失败' });
    }
  }

  async getOrder(req, res) {
    try {
      const order = await Order.findByPk(req.params.id, {
        include: [{
          model: Engineer,
          as: 'Engineer',
          attributes: ['id', 'name', 'phone', 'certificate_level', 'success_rate', 'service_radius', 'equipment_id', 'avg_rating']
        }]
      });
      
      if (!order) {
        return res.status(404).json({ error: '订单不存在' });
      }

      const orderJson = order.toJSON();
      try {
        if (orderJson.predicted_faults) {
          orderJson.predicted_faults = JSON.parse(orderJson.predicted_faults);
        }
      } catch (e) {}

      res.json(orderJson);
    } catch (error) {
      logger.error('获取订单详情失败', error);
      res.status(500).json({ error: '获取失败' });
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const order = await Order.findByPk(req.params.id);
      if (!order) {
        return res.status(404).json({ error: '订单不存在' });
      }

      const { status, ...otherData } = req.body;
      
      if (status !== undefined) {
        const statusMap = {
          1: '已接单',
          2: '维修中',
          3: '待确认',
          4: '已完成',
          5: '已评价'
        };
        logger.info(`订单状态变更: ${order.order_no} -> ${statusMap[status] || status}`);
      }

      await order.update({ status, ...otherData });
      res.json(order);
    } catch (error) {
      logger.error('更新订单状态失败', error);
      res.status(500).json({ error: '更新失败' });
    }
  }

  async assignEngineer(req, res) {
    try {
      const order = await Order.findByPk(req.params.id);
      if (!order) {
        return res.status(404).json({ error: '订单不存在' });
      }

      const { engineerId } = req.body;
      const engineer = await Engineer.findByPk(engineerId);
      
      if (!engineer) {
        return res.status(404).json({ error: '工程师不存在' });
      }

      await order.update({
        engineer_id: engineerId,
        status: 1
      });

      await engineer.update({ status: 2 });

      logger.info('指派工程师', { orderNo: order.order_no, engineer: engineer.name });
      res.json({ success: true, order, engineer });
    } catch (error) {
      logger.error('指派工程师失败', error);
      res.status(500).json({ error: '指派失败' });
    }
  }

  async getSuitableEngineers(req, res) {
    try {
      const { lat, lng, skills } = req.query;
      const engineers = await dispatchService.findSuitableEngineers(
        parseFloat(lat) || 31.2304,
        parseFloat(lng) || 121.4737,
        skills ? skills.split(',') : []
      );
      res.json(engineers);
    } catch (error) {
      logger.error('获取推荐工程师失败', error);
      res.status(500).json({ error: '获取失败' });
    }
  }

  async uploadEvidence(req, res) {
    try {
      const order = await Order.findByPk(req.params.id);
      if (!order) {
        return res.status(404).json({ error: '订单不存在' });
      }

      const { beforeImage, afterImage, videoUrl, videoSummary } = req.body;
      
      const updateData = {};
      if (beforeImage) {
        updateData.before_image_hash = generateHash(beforeImage);
      }
      if (afterImage) {
        updateData.after_image_hash = generateHash(afterImage);
      }
      if (videoUrl) {
        updateData.video_url = videoUrl;
      }
      if (videoSummary) {
        updateData.video_summary = JSON.stringify(videoSummary);
      }

      await order.update(updateData);
      logger.info('上传维修凭证', { orderNo: order.order_no });
      res.json({ success: true, order });
    } catch (error) {
      logger.error('上传凭证失败', error);
      res.status(500).json({ error: '上传失败' });
    }
  }

  async addRating(req, res) {
    try {
      const order = await Order.findByPk(req.params.id);
      if (!order) {
        return res.status(404).json({ error: '订单不存在' });
      }

      const { rating, comment } = req.body;
      await order.update({
        rating,
        comment,
        status: 5
      });

      logger.info('订单评价完成', { orderNo: order.order_no, rating });
      res.json({ success: true, order });
    } catch (error) {
      logger.error('评价失败', error);
      res.status(500).json({ error: '评价失败' });
    }
  }
}

module.exports = new OrderController();
