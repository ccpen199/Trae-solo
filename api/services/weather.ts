import { WeatherData, DailyForecast } from '../../shared/types'

const cities = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安',
  '南京', '重庆', '天津', '苏州', '长沙', '郑州', '青岛', '沈阳',
  '宁波', '东莞', '无锡', '合肥', '福州', '厦门', '济南', '哈尔滨'
]

const weatherTypes = [
  { weather: '晴', icon: '☀️' },
  { weather: '多云', icon: '⛅' },
  { weather: '阴', icon: '☁️' },
  { weather: '小雨', icon: '🌧️' },
  { weather: '中雨', icon: '🌧️' },
  { weather: '雷阵雨', icon: '⛈️' },
  { weather: '小雪', icon: '🌨️' },
  { weather: '雾', icon: '🌫️' }
]

const carWashIndexes = ['适宜', '较适宜', '不宜']

const dressingAdvices = [
  '天气寒冷，建议穿羽绒服、毛衣等厚衣服',
  '气温较低，建议穿外套、长裤',
  '温度适中，建议穿衬衫、薄外套',
  '天气较热，建议穿短袖、短裤',
  '天气炎热，建议穿轻薄透气的衣物，注意防晒',
  '有雨，建议携带雨具，穿防滑鞋'
]

function getLocationByIP(ip?: string): string {
  const seed = ip ? ip.split('.').reduce((sum, part) => sum + parseInt(part || '0'), 0) : Date.now()
  return cities[seed % cities.length]
}

function generateWeatherData(city: string): WeatherData {
  const now = new Date()
  const month = now.getMonth() + 1

  let baseTemp: number
  if (month >= 6 && month <= 8) {
    baseTemp = 25 + Math.random() * 10
  } else if (month >= 12 || month <= 2) {
    baseTemp = -5 + Math.random() * 10
  } else if (month >= 3 && month <= 5) {
    baseTemp = 15 + Math.random() * 10
  } else {
    baseTemp = 10 + Math.random() * 15
  }

  const temperature = Math.round(baseTemp)
  const feelsLike = temperature + Math.round(Math.random() * 4 - 2)
  const humidity = Math.round(40 + Math.random() * 50)
  const windSpeed = Math.round(Math.random() * 30 * 10) / 10
  const uvIndex = Math.round(Math.random() * 11)

  const weatherIndex = Math.floor(Math.random() * weatherTypes.length)
  const currentWeather = weatherTypes[weatherIndex]

  const carWashIndex = rainLevel(currentWeather.weather) === 0
    ? carWashIndexes[0]
    : rainLevel(currentWeather.weather) === 1
      ? carWashIndexes[1]
      : carWashIndexes[2]

  let adviceIndex: number
  if (temperature < 5) {
    adviceIndex = 0
  } else if (temperature < 15) {
    adviceIndex = 1
  } else if (temperature < 25) {
    adviceIndex = 2
  } else if (temperature < 32) {
    adviceIndex = 3
  } else {
    adviceIndex = 4
  }

  if (rainLevel(currentWeather.weather) > 0) {
    adviceIndex = 5
  }

  const umbrellaReminder = rainLevel(currentWeather.weather) > 0

  const forecast: DailyForecast[] = []
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  for (let i = 0; i < 7; i++) {
    const forecastDate = new Date(now)
    forecastDate.setDate(now.getDate() + i)

    const forecastWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)]
    const tempVariation = Math.random() * 6 - 3
    const high = Math.round(temperature + tempVariation + Math.random() * 5)
    const low = Math.round(temperature + tempVariation - Math.random() * 5)

    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      dayOfWeek: dayNames[forecastDate.getDay()],
      high,
      low,
      weather: forecastWeather.weather,
      weatherIcon: forecastWeather.icon
    })
  }

  return {
    city,
    temperature,
    feelsLike,
    humidity,
    windSpeed,
    weather: currentWeather.weather,
    weatherIcon: currentWeather.icon,
    uvIndex,
    carWashIndex,
    dressingAdvice: dressingAdvices[adviceIndex],
    umbrellaReminder,
    forecast
  }
}

function rainLevel(weather: string): number {
  if (weather.includes('雨') || weather.includes('雷') || weather.includes('雪')) {
    if (weather.includes('小')) return 1
    if (weather.includes('中') || weather.includes('大')) return 2
    return 1
  }
  return 0
}

export async function getCurrentWeather(ip?: string): Promise<WeatherData> {
  await new Promise(resolve => setTimeout(resolve, 100))

  const city = getLocationByIP(ip)
  return generateWeatherData(city)
}

export async function getWeatherByCity(city: string): Promise<WeatherData> {
  await new Promise(resolve => setTimeout(resolve, 100))

  const targetCity = cities.includes(city) ? city : cities[0]
  return generateWeatherData(targetCity)
}

export function getAvailableCities(): string[] {
  return cities
}

export default {
  getCurrentWeather,
  getWeatherByCity,
  getAvailableCities
}
