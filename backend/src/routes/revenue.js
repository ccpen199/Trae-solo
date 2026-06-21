const express = require('express');
const router = express.Router();
const models = require('../models');

router.get('/daily', (req, res) => {
  try {
    const { start_date, end_date, station_id } = req.query;
    
    const now = new Date();
    const defaultEnd = now.toISOString().split('T')[0];
    const defaultStart = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
    
    const startDate = start_date || defaultStart;
    const endDate = end_date || defaultEnd;
    
    let data = models.getDailyRevenue.all(startDate, endDate);
    
    if (station_id) {
      data = data.filter(d => d.station_id === parseInt(station_id));
    }
    
    const summary = {
      total_orders: data.reduce((sum, d) => sum + d.total_orders, 0),
      total_energy: Math.round(data.reduce((sum, d) => sum + d.total_energy, 0) * 100) / 100,
      total_amount: Math.round(data.reduce((sum, d) => sum + d.total_amount, 0) * 100) / 100,
      peak_energy: Math.round(data.reduce((sum, d) => sum + d.peak_energy, 0) * 100) / 100,
      flat_energy: Math.round(data.reduce((sum, d) => sum + d.flat_energy, 0) * 100) / 100,
      valley_energy: Math.round(data.reduce((sum, d) => sum + d.valley_energy, 0) * 100) / 100,
      peak_amount: Math.round(data.reduce((sum, d) => sum + d.peak_amount, 0) * 100) / 100,
      flat_amount: Math.round(data.reduce((sum, d) => sum + d.flat_amount, 0) * 100) / 100,
      valley_amount: Math.round(data.reduce((sum, d) => sum + d.valley_amount, 0) * 100) / 100,
      service_fee: Math.round(data.reduce((sum, d) => sum + d.service_fee, 0) * 100) / 100,
      days: data.length
    };
    
    const stationGroups = {};
    data.forEach(d => {
      if (!stationGroups[d.station_id]) {
        stationGroups[d.station_id] = {
          station_id: d.station_id,
          station_name: d.station_name,
          city: d.city,
          total_orders: 0,
          total_energy: 0,
          total_amount: 0,
          service_fee: 0
        };
      }
      stationGroups[d.station_id].total_orders += d.total_orders;
      stationGroups[d.station_id].total_energy += d.total_energy;
      stationGroups[d.station_id].total_amount += d.total_amount;
      stationGroups[d.station_id].service_fee += d.service_fee;
    });
    
    const byStation = Object.values(stationGroups).map(s => ({
      ...s,
      total_energy: Math.round(s.total_energy * 100) / 100,
      total_amount: Math.round(s.total_amount * 100) / 100,
      service_fee: Math.round(s.service_fee * 100) / 100
    }));
    
    const chartData = [];
    const dateMap = {};
    data.forEach(d => {
      if (!dateMap[d.report_date]) {
        dateMap[d.report_date] = {
          date: d.report_date,
          total_orders: 0,
          total_energy: 0,
          total_amount: 0
        };
      }
      dateMap[d.report_date].total_orders += d.total_orders;
      dateMap[d.report_date].total_energy += d.total_energy;
      dateMap[d.report_date].total_amount += d.total_amount;
    });
    
    Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date)).forEach(d => {
      chartData.push({
        date: d.date,
        total_orders: d.total_orders,
        total_energy: Math.round(d.total_energy * 100) / 100,
        total_amount: Math.round(d.total_amount * 100) / 100
      });
    });
    
    res.json({
      success: true,
      data: {
        list: data,
        summary,
        by_station: byStation,
        chart_data: chartData
      },
      total: data.length
    });
  } catch (err) {
    console.error('获取日报表失败:', err);
    res.status(500).json({
      success: false,
      message: '获取日报表失败'
    });
  }
});

router.get('/monthly', (req, res) => {
  try {
    const { report_month, station_id } = req.query;
    
    const now = new Date();
    const defaultMonth = now.toISOString().slice(0, 7);
    const month = report_month || defaultMonth;
    
    let data = models.getMonthlyRevenue.all(month);
    
    if (station_id) {
      data = data.filter(d => d.station_id === parseInt(station_id));
    }
    
    const summary = {
      report_month: month,
      total_orders: data.reduce((sum, d) => sum + d.total_orders, 0),
      total_energy: Math.round(data.reduce((sum, d) => sum + d.total_energy, 0) * 100) / 100,
      total_amount: Math.round(data.reduce((sum, d) => sum + d.total_amount, 0) * 100) / 100,
      service_fee: Math.round(data.reduce((sum, d) => sum + d.service_fee, 0) * 100) / 100,
      stations_count: data.length
    };
    
    res.json({
      success: true,
      data: {
        list: data,
        summary
      },
      total: data.length
    });
  } catch (err) {
    console.error('获取月报表失败:', err);
    res.status(500).json({
      success: false,
      message: '获取月报表失败'
    });
  }
});

router.get('/summary', (req, res) => {
  try {
    const stats = models.getSummaryStats.get();
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const todayData = models.getDailyRevenue.all(today, today);
    
    const todaySummary = {
      total_orders: todayData.reduce((sum, d) => sum + d.total_orders, 0),
      total_energy: Math.round(todayData.reduce((sum, d) => sum + d.total_energy, 0) * 100) / 100,
      total_amount: Math.round(todayData.reduce((sum, d) => sum + d.total_amount, 0) * 100) / 100
    };
    
    res.json({
      success: true,
      data: {
        ...stats,
        today: todaySummary,
        online_rate: stats.total_chargers > 0 ? Math.round(stats.online_chargers / stats.total_chargers * 100) : 0
      }
    });
  } catch (err) {
    console.error('获取统计数据失败:', err);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
});

module.exports = router;
