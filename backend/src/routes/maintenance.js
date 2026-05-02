const express = require('express');
const router = express.Router();
const maintenanceService = require('../services/maintenanceService');

router.get('/', async (req, res) => {
  try {
    const { status, assignedTo, chargerId, priority } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (assignedTo) filters.assignedTo = assignedTo;
    if (chargerId) filters.chargerId = chargerId;
    if (priority) filters.priority = priority;
    
    const result = maintenanceService.getMaintenanceOrders(filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const result = maintenanceService.getMaintenanceOrderDetail(orderId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance order not found'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/create', async (req, res) => {
  try {
    const { chargerId, stationId, userId, type, description, priority } = req.body;
    
    if (!chargerId) {
      return res.status(400).json({
        success: false,
        message: 'Charger ID is required'
      });
    }
    
    const result = maintenanceService.createMaintenanceOrder(
      chargerId,
      stationId,
      userId,
      type || 'MANUAL',
      description || 'Manual maintenance order',
      priority || 'normal'
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:orderId/assign', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { maintainerId } = req.body;
    
    if (!maintainerId) {
      return res.status(400).json({
        success: false,
        message: 'Maintainer ID is required'
      });
    }
    
    const result = maintenanceService.assignMaintenanceOrder(orderId, maintainerId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:orderId/start', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { maintainerId } = req.body;
    
    if (!maintainerId) {
      return res.status(400).json({
        success: false,
        message: 'Maintainer ID is required'
      });
    }
    
    const result = maintenanceService.startMaintenance(orderId, maintainerId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:orderId/complete', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { maintainerId, notes } = req.body;
    
    const result = maintenanceService.completeMaintenance(orderId, maintainerId, notes);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
