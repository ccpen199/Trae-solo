const express = require('express');
const router = express.Router();
const trafficBalanceService = require('../services/trafficBalanceService');

router.get('/search', async (req, res) => {
  try {
    const { latitude, longitude, radius, connectorType } = req.query;
    
    const lat = latitude ? parseFloat(latitude) : null;
    const lng = longitude ? parseFloat(longitude) : null;
    const r = radius ? parseFloat(radius) : 5;
    
    const result = trafficBalanceService.searchStations(lat, lng, r, connectorType);
    
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

router.get('/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    
    const station = trafficBalanceService.getStationDetail(stationId);
    
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }
    
    res.json({
      success: true,
      data: station
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:stationId/chargers/:chargerId/lock', async (req, res) => {
  try {
    const { stationId, chargerId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const result = trafficBalanceService.lockCharger(chargerId, userId);
    
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

router.post('/:stationId/chargers/:chargerId/unlock', async (req, res) => {
  try {
    const { stationId, chargerId } = req.params;
    
    const result = trafficBalanceService.unlockCharger(chargerId);
    
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
