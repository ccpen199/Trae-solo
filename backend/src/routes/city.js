const express = require('express');
const { getDb } = require('../models/database');

const router = express.Router();

router.get('/weather', (req, res) => {
  const { city = '默认城市' } = req.query;
  
  const weatherTypes = ['晴', '多云', '阴', '小雨', '中雨', '雷阵雨'];
  const windDirections = ['东风', '南风', '西风', '北风', '东南风', '西北风'];
  
  const weather = {
    city,
    temperature: Math.round(15 + Math.random() * 20),
    weather: weatherTypes[Math.floor(Math.random() * weatherTypes.length)],
    humidity: Math.round(40 + Math.random() * 40),
    windDirection: windDirections[Math.floor(Math.random() * windDirections.length)],
    windSpeed: Math.round(Math.random() * 15 * 10) / 10,
    updateTime: new Date().toISOString(),
    forecast: [
      { date: '今天', high: 28, low: 18, weather: '晴' },
      { date: '明天', high: 26, low: 17, weather: '多云' },
      { date: '后天', high: 24, low: 16, weather: '小雨' }
    ],
    airQuality: {
      level: '优',
      aqi: Math.round(30 + Math.random() * 50),
      pm25: Math.round(10 + Math.random() * 30)
    }
  };
  
  res.json(weather);
});

router.get('/government-map', (req, res) => {
  const departments = [
    { id: 1, name: '政务服务中心', address: '政务路1号', phone: '12345', distance: '0.5km', type: 'comprehensive' },
    { id: 2, name: '公安局办事大厅', address: '平安街2号', phone: '110', distance: '1.2km', type: 'police' },
    { id: 3, name: '社保局服务大厅', address: '民生路3号', phone: '12333', distance: '1.8km', type: 'hrss' },
    { id: 4, name: '医保局服务中心', address: '健康路4号', phone: '12393', distance: '2.1km', type: 'medical' },
    { id: 5, name: '不动产登记中心', address: '房产街5号', phone: '12345-1', distance: '2.5km', type: 'housing' },
    { id: 6, name: '税务局办税服务厅', address: '财税路6号', phone: '12366', distance: '3.0km', type: 'tax' }
  ];
  
  res.json({
    departments,
    mapCenter: { lat: 39.9042, lng: 116.4074 },
    zoom: 12
  });
});

router.get('/service-outlets', (req, res) => {
  const outlets = [
    { id: 1, name: '市民之家', address: '中心广场1号', businessHours: '周一至周五 9:00-17:00', services: 128, windows: 30 },
    { id: 2, name: '东区政务服务中心', address: '东区大道100号', businessHours: '周一至周五 9:00-17:00', services: 86, windows: 20 },
    { id: 3, name: '西区政务服务中心', address: '西区大道200号', businessHours: '周一至周五 9:00-17:00', services: 78, windows: 18 },
    { id: 4, name: '南区政务服务中心', address: '南区大道300号', businessHours: '周一至周五 9:00-17:00', services: 65, windows: 15 }
  ];
  
  res.json(outlets);
});

router.get('/emergency-contacts', (req, res) => {
  const contacts = [
    { name: '报警电话', number: '110', description: '刑事案件、治安案件、紧急求助' },
    { name: '火警电话', number: '119', description: '火灾报警、消防救援' },
    { name: '急救电话', number: '120', description: '医疗急救' },
    { name: '交通事故', number: '122', description: '交通事故报警' },
    { name: '政务服务热线', number: '12345', description: '政务咨询、投诉建议' },
    { name: '社保热线', number: '12333', description: '社会保险咨询' },
    { name: '医保热线', number: '12393', description: '医疗保险咨询' },
    { name: '税务热线', number: '12366', description: '税务咨询服务' }
  ];
  
  res.json(contacts);
});

module.exports = router;
