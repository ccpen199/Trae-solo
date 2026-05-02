const express = require('express');
const router = express.Router();
const ExceptionService = require('../services/exceptionService');

module.exports = (db) => {
  const exceptionService = new ExceptionService(db);

  router.get('/', (req, res) => {
    try {
      const { status, exception_type } = req.query;
      
      let query = 'SELECT * FROM exceptions WHERE 1=1';
      const params = [];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      if (exception_type) {
        query += ' AND exception_type = ?';
        params.push(exception_type);
      }

      query += ' ORDER BY created_at DESC';

      const exceptions = db.prepare(query).all(...params);
      res.json({ success: true, data: exceptions });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/pending', (req, res) => {
    try {
      const exceptions = exceptionService.getPendingExceptions();
      res.json({ success: true, data: exceptions });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const { id } = req.params;
      
      const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id);
      
      if (!exception) {
        return res.status(404).json({ success: false, message: '异常记录不存在' });
      }

      res.json({ success: true, data: exception });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/', (req, res) => {
    try {
      const { 
        exception_type, 
        related_type, 
        related_id, 
        description, 
        original_data 
      } = req.body;

      if (!exception_type) {
        return res.status(400).json({ 
          success: false, 
          message: '异常类型为必填项' 
        });
      }

      const result = exceptionService.createException(
        exception_type,
        related_type,
        related_id,
        description,
        original_data
      );

      res.status(201).json({ 
        success: true, 
        data: { exception_id: result.exceptionId } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/location-drift', (req, res) => {
    try {
      const { 
        container_id, 
        current_location, 
        expected_location, 
        drift_distance 
      } = req.body;

      if (!container_id) {
        return res.status(400).json({ 
          success: false, 
          message: '集装箱ID为必填项' 
        });
      }

      const result = exceptionService.handleLocationDrift(
        container_id,
        current_location,
        expected_location,
        drift_distance
      );

      res.status(201).json({ 
        success: true, 
        data: { exception_id: result.exceptionId } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/route-deviation', (req, res) => {
    try {
      const { 
        container_id, 
        current_route, 
        expected_route, 
        deviation_percentage 
      } = req.body;

      if (!container_id) {
        return res.status(400).json({ 
          success: false, 
          message: '集装箱ID为必填项' 
        });
      }

      const result = exceptionService.handleRouteDeviation(
        container_id,
        current_route,
        expected_route,
        deviation_percentage
      );

      res.status(201).json({ 
        success: true, 
        data: { exception_id: result.exceptionId } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/driver-reject', (req, res) => {
    try {
      const { task_id, driver_id, reason } = req.body;

      if (!task_id) {
        return res.status(400).json({ 
          success: false, 
          message: '任务ID为必填项' 
        });
      }

      const result = exceptionService.handleDriverReject(
        task_id,
        driver_id,
        reason
      );

      res.status(201).json({ 
        success: true, 
        data: { exception_id: result.exceptionId } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/arrival-unconfirmed', (req, res) => {
    try {
      const { container_id, expected_arrival_time, actual_time } = req.body;

      if (!container_id) {
        return res.status(400).json({ 
          success: false, 
          message: '集装箱ID为必填项' 
        });
      }

      const result = exceptionService.handleArrivalUnconfirmed(
        container_id,
        expected_arrival_time,
        actual_time
      );

      res.status(201).json({ 
        success: true, 
        data: { exception_id: result.exceptionId } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post('/map-callback-delay', (req, res) => {
    try {
      const { map_provider, callback_data, delay_seconds } = req.body;

      if (!map_provider) {
        return res.status(400).json({ 
          success: false, 
          message: '地图提供商为必填项' 
        });
      }

      const result = exceptionService.handleMapCallbackDelay(
        map_provider,
        callback_data,
        delay_seconds
      );

      res.status(201).json({ 
        success: true, 
        data: { exception_id: result.exceptionId } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.put('/:id/resolve', (req, res) => {
    try {
      const { id } = req.params;
      const { handler_id, resolution } = req.body;

      if (!handler_id) {
        return res.status(400).json({ 
          success: false, 
          message: '处理人ID为必填项' 
        });
      }

      const result = exceptionService.resolveException(id, handler_id, resolution);
      
      if (result.success === false) {
        return res.status(400).json({ success: false, message: result.message });
      }

      res.json({ 
        success: true, 
        data: { id, status: 'RESOLVED' } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get('/statistics/summary', (req, res) => {
    try {
      const statistics = exceptionService.getExceptionStatistics();
      res.json({ success: true, data: statistics });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
};
