import { Router, type Request, type Response } from 'express'

const router = Router()

const weatherData = {
  current: {
    city: '北京市',
    temperature: 24,
    feelsLike: 26,
    condition: '多云',
    icon: 'https://img.icons8.com/color/96/partly-cloudy-day--v1.png',
    humidity: 65,
    windDirection: '东南风',
    windSpeed: 3,
    airQuality: {
      level: '良',
      aqi: 72,
      description: '空气质量可接受，某些污染物可能对极少数异常敏感人群健康有较弱影响',
    },
    uvIndex: {
      level: '中等',
      value: 5,
      suggestion: '建议涂抹防晒霜，戴帽子和太阳镜',
    },
    carWashIndex: {
      level: '较适宜',
      suggestion: '天气较好，适合洗车，但24小时内有降水可能',
    },
    dressingAdvice: '建议穿薄外套或牛仔裤等服装，早晚温差较大注意增减衣物',
    umbrellaAdvice: {
      need: false,
      reason: '今天天气晴朗，无需带伞',
    },
  },
  hourly: [
    { time: '06:00', temperature: 18, condition: '晴', icon: 'https://img.icons8.com/color/96/sun--v1.png' },
    { time: '07:00', temperature: 19, condition: '晴', icon: 'https://img.icons8.com/color/96/sun--v1.png' },
    { time: '08:00', temperature: 21, condition: '晴', icon: 'https://img.icons8.com/color/96/sun--v1.png' },
    { time: '09:00', temperature: 22, condition: '多云', icon: 'https://img.icons8.com/color/96/partly-cloudy-day--v1.png' },
    { time: '10:00', temperature: 24, condition: '多云', icon: 'https://img.icons8.com/color/96/partly-cloudy-day--v1.png' },
    { time: '11:00', temperature: 25, condition: '多云', icon: 'https://img.icons8.com/color/96/partly-cloudy-day--v1.png' },
    { time: '12:00', temperature: 27, condition: '多云', icon: 'https://img.icons8.com/color/96/partly-cloudy-day--v1.png' },
    { time: '13:00', temperature: 28, condition: '晴', icon: 'https://img.icons8.com/color/96/sun--v1.png' },
    { time: '14:00', temperature: 28, condition: '晴', icon: 'https://img.icons8.com/color/96/sun--v1.png' },
    { time: '15:00', temperature: 27, condition: '多云', icon: 'https://img.icons8.com/color/96/partly-cloudy-day--v1.png' },
    { time: '16:00', temperature: 26, condition: '多云', icon: 'https://img.icons8.com/color/96/partly-cloudy-day--v1.png' },
    { time: '17:00', temperature: 24, condition: '阴', icon: 'https://img.icons8.com/color/96/clouds.png' },
    { time: '18:00', temperature: 22, condition: '阴', icon: 'https://img.icons8.com/color/96/clouds.png' },
    { time: '19:00', temperature: 20, condition: '小雨', icon: 'https://img.icons8.com/color/96/rain.png' },
    { time: '20:00', temperature: 19, condition: '小雨', icon: 'https://img.icons8.com/color/96/rain.png' },
    { time: '21:00', temperature: 18, condition: '小雨', icon: 'https://img.icons8.com/color/96/rain.png' },
    { time: '22:00', temperature: 17, condition: '阴', icon: 'https://img.icons8.com/color/96/clouds.png' },
    { time: '23:00', temperature: 16, condition: '阴', icon: 'https://img.icons8.com/color/96/clouds.png' },
    { time: '00:00', temperature: 16, condition: '多云', icon: 'https://img.icons8.com/color/96/partly-cloudy-night.png' },
    { time: '01:00', temperature: 15, condition: '多云', icon: 'https://img.icons8.com/color/96/partly-cloudy-night.png' },
    { time: '02:00', temperature: 15, condition: '多云', icon: 'https://img.icons8.com/color/96/partly-cloudy-night.png' },
    { time: '03:00', temperature: 14, condition: '晴', icon: 'https://img.icons8.com/color/96/moon.png' },
    { time: '04:00', temperature: 14, condition: '晴', icon: 'https://img.icons8.com/color/96/moon.png' },
    { time: '05:00', temperature: 15, condition: '晴', icon: 'https://img.icons8.com/color/96/sun--v1.png' },
  ],
  daily: [
    {
      date: '今天',
      dayCondition: '多云',
      nightCondition: '小雨',
      dayIcon: 'https://img.icons8.com/color/96/partly-cloudy-day--v1.png',
      nightIcon: 'https://img.icons8.com/color/96/rain.png',
      highTemp: 28,
      lowTemp: 16,
    },
    {
      date: '明天',
      dayCondition: '晴',
      nightCondition: '晴',
      dayIcon: 'https://img.icons8.com/color/96/sun--v1.png',
      nightIcon: 'https://img.icons8.com/color/96/moon.png',
      highTemp: 30,
      lowTemp: 18,
    },
    {
      date: '周六',
      dayCondition: '晴',
      nightCondition: '多云',
      dayIcon: 'https://img.icons8.com/color/96/sun--v1.png',
      nightIcon: 'https://img.icons8.com/color/96/partly-cloudy-night.png',
      highTemp: 31,
      lowTemp: 19,
    },
    {
      date: '周日',
      dayCondition: '多云',
      nightCondition: '阴',
      dayIcon: 'https://img.icons8.com/color/96/partly-cloudy-day--v1.png',
      nightIcon: 'https://img.icons8.com/color/96/clouds.png',
      highTemp: 29,
      lowTemp: 18,
    },
    {
      date: '周一',
      dayCondition: '阴',
      nightCondition: '小雨',
      dayIcon: 'https://img.icons8.com/color/96/clouds.png',
      nightIcon: 'https://img.icons8.com/color/96/rain.png',
      highTemp: 26,
      lowTemp: 17,
    },
    {
      date: '周二',
      dayCondition: '小雨',
      nightCondition: '中雨',
      dayIcon: 'https://img.icons8.com/color/96/rain.png',
      nightIcon: 'https://img.icons8.com/color/96/rain.png',
      highTemp: 24,
      lowTemp: 16,
    },
    {
      date: '周三',
      dayCondition: '中雨',
      nightCondition: '小雨',
      dayIcon: 'https://img.icons8.com/color/96/rain.png',
      nightIcon: 'https://img.icons8.com/color/96/rain.png',
      highTemp: 23,
      lowTemp: 15,
    },
  ],
}

const indicesData = {
  airConditioner: { level: '较少开启', suggestion: '您将感到很舒适，一般不需要开启空调。' },
  sport: { level: '较适宜', suggestion: '天气较好，户外运动请注意防晒。推荐您进行室内运动。' },
  tourist: { level: '较适宜', suggestion: '天气较好，温度适宜，是个好天气哦。但紫外线较强，外出旅游要注意防晒。' },
  fishing: { level: '较适宜', suggestion: '较适合垂钓，但天气稍热，会对垂钓产生一定的影响。' },
  makeup: { level: '控油', suggestion: '天气较热，建议使用露类护肤品，化妆品选择淡妆为宜。' },
  ultraviolet: { level: '中等', suggestion: '建议涂抹防晒霜，戴帽子和太阳镜。' },
  clothes: { level: '舒适', suggestion: '建议穿薄外套或牛仔裤等服装，早晚温差较大注意增减衣物。' },
  hair: { level: '一般', suggestion: '头发需要保持清洁，建议使用滋润型洗发水。' },
  carWash: { level: '较适宜', suggestion: '天气较好，适合洗车，但24小时内有降水可能。' },
  pollution: { level: '良', suggestion: '空气质量可接受，某些污染物可能对极少数异常敏感人群健康有较弱影响。' },
}

router.get('/current', (req: Request, res: Response): void => {
  res.json({
    success: true,
    message: '获取当前天气成功',
    data: weatherData.current,
  })
})

router.get('/forecast', (req: Request, res: Response): void => {
  res.json({
    success: true,
    message: '获取天气预报成功',
    data: {
      hourly: weatherData.hourly,
      daily: weatherData.daily,
    },
  })
})

router.get('/indices', (req: Request, res: Response): void => {
  res.json({
    success: true,
    message: '获取生活指数成功',
    data: indicesData,
  })
})

export default router
