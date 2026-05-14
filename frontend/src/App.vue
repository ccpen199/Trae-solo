<template>
  <div class="app-container">
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-text">去哪儿</span>
          <span class="logo-sub">QUNAR</span>
        </div>
        <nav class="main-nav">
          <a 
            href="#" 
            class="nav-item" 
            :class="{ active: currentService === 'flight' }"
            @click.prevent="switchService('flight')"
          >机票</a>
          <a 
            href="#" 
            class="nav-item" 
            :class="{ active: currentService === 'hotel' }"
            @click.prevent="switchService('hotel')"
          >酒店</a>
          <a 
            href="#" 
            class="nav-item" 
            :class="{ active: currentService === 'travel' }"
            @click.prevent="switchService('travel')"
          >旅行</a>
          <a 
            href="#" 
            class="nav-item" 
            :class="{ active: currentService === 'guide' }"
            @click.prevent="switchService('guide')"
          >攻略</a>
        </nav>
        <div class="header-right">
          <a href="#" class="login-btn">登录</a>
          <a href="#" class="register-btn">注册</a>
        </div>
      </div>
    </header>

    <div class="order-query">
      <div class="order-query-content">
        <div class="query-item" @mouseenter="showOrderHover = true" @mouseleave="showOrderHover = false">
          <span class="query-icon">📋</span>
          <span>订单查询</span>
          <span class="arrow">›</span>
          <div v-if="showOrderHover" class="order-dropdown">
            <a href="#" @click="openOrderModal('ticket')">出票状态查询</a>
            <a href="#" @click="openOrderModal('refund')">退票改签</a>
          </div>
        </div>
        <div class="divider"></div>
        <div class="query-item">
          <span class="query-icon">💳</span>
          <span>优惠券</span>
        </div>
        <div class="divider"></div>
        <div class="query-item">
          <span class="query-icon">ℹ️</span>
          <span>帮助中心</span>
        </div>
      </div>
    </div>

    <!-- 机票页面 -->
    <div v-if="currentService === 'flight'" class="flight-search-section">
      <div class="flight-tabs">
        <div 
          class="tab-item" 
          :class="{ active: flightType === 'domestic' }"
          @click="flightType = 'domestic'"
        >
          国内机票
        </div>
        <div 
          class="tab-item" 
          :class="{ active: flightType === 'international' }"
          @click="flightType = 'international'"
        >
          国际/港澳台
        </div>
      </div>

      <div class="search-panel">
        <div class="trip-type">
          <div 
            class="trip-item" 
            :class="{ active: tripType === 'oneway' }"
            @click="tripType = 'oneway'"
          >
            单程
          </div>
          <div 
            class="trip-item" 
            :class="{ active: tripType === 'roundtrip' }"
            @click="tripType = 'roundtrip'"
          >
            往返
          </div>
          <div 
            class="trip-item" 
            :class="{ active: tripType === 'multi' }"
            @click="tripType = 'multi'"
          >
            多程
          </div>
        </div>

        <div class="search-form">
          <div class="city-input-wrap">
            <label>出发地</label>
            <CitySelector 
              v-model="fromCity" 
              :type="flightType"
              @select="handleFromSelect"
            />
          </div>

          <div class="swap-btn" @click="swapCities">
            ↔
          </div>

          <div class="city-input-wrap">
            <label>目的地</label>
            <CitySelector 
              v-model="toCity" 
              :type="flightType"
              @select="handleToSelect"
            />
          </div>

          <div class="date-input-wrap">
            <label>出发日期</label>
            <DatePicker v-model="departDate" @change="handleDateChange" />
          </div>

          <div class="date-input-wrap" :class="{ disabled: tripType === 'oneway' }">
            <label>返程日期</label>
            <DatePicker 
              v-model="returnDate" 
              :disabled="tripType === 'oneway'"
              @change="handleReturnDateChange"
            />
          </div>

          <button class="search-btn" @click="searchFlights">
            搜索机票
          </button>
        </div>

        <div v-if="showPriceTrend" class="price-trend-box">
          <div class="trend-header">
            <span>💰 价格趋势</span>
            <button @click="showPriceTrend = false">关闭</button>
          </div>
          <PriceTrend :from="fromCity" :to="toCity" />
        </div>

        <div class="extra-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="options.dateRange"> 日期范围搜索
          </label>
          <template v-if="options.dateRange">
            <div class="date-range-inputs">
              <span class="range-label">从</span>
              <DatePicker v-model="dateRangeStart" />
              <span class="range-label">到</span>
              <DatePicker v-model="dateRangeEnd" />
            </div>
          </template>
          <label class="checkbox-label">
            <input type="checkbox" v-model="options.direct"> 直飞
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="options.morning"> 早班机
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="options.evening"> 晚班机
          </label>
          <button class="trend-btn" @click="togglePriceTrend">📈 价格趋势</button>
        </div>
      </div>
    </div>

    <div v-if="currentService === 'flight' && tripType === 'multi'" class="multi-flight-panel">
      <MultiFlight @search="searchMultiFlights" />
    </div>

    <div v-if="currentService === 'flight' && flightType === 'international'" class="international-options">
      <div class="tag-search">
        <label>主题标签搜索（最多5个）</label>
        <div class="tag-input-wrap">
          <input 
            type="text" 
            v-model="tagInput" 
            @keydown.enter="addTag"
            placeholder="输入标签后回车添加"
          />
          <div class="tags">
            <span 
              v-for="(tag, index) in tags" 
              :key="index" 
              class="tag"
            >
              {{ tag }}
              <span @click="removeTag(index)">×</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="currentService === 'flight' && searchResult" class="flight-results">
      <div class="results-header">
        <h3>搜索结果</h3>
        <span>{{ searchResult.outbound.length + searchResult.inbound.length }} 个航班</span>
      </div>
      <div class="results-content">
        <template v-for="(flights, date) in groupedFlights" :key="date">
          <div class="date-group-header">{{ formatDateDisplay(date) }}</div>
          <div v-for="flight in flights" :key="flight.id" class="flight-card">
            <div class="flight-info">
              <div class="flight-airline">{{ flight.airline }}</div>
              <div class="flight-route">
                <span class="city">{{ flight.from_city }}</span>
                <span class="arrow">→</span>
                <span class="city">{{ flight.to_city }}</span>
              </div>
              <div class="flight-date">{{ flight.date }}</div>
            </div>
            <div class="flight-price">
              <span class="price">¥{{ flight.price }}</span>
              <button class="book-btn" @click="bookFlight(flight)">预订</button>
            </div>
          </div>
        </template>
        <template v-if="!options.dateRange">
          <div v-for="flight in searchResult.outbound" :key="flight.id" class="flight-card">
            <div class="flight-info">
              <div class="flight-airline">{{ flight.airline }}</div>
              <div class="flight-route">
                <span class="city">{{ flight.from_city }}</span>
                <span class="arrow">→</span>
                <span class="city">{{ flight.to_city }}</span>
              </div>
              <div class="flight-date">{{ flight.date }}</div>
            </div>
            <div class="flight-price">
              <span class="price">¥{{ flight.price }}</span>
              <button class="book-btn" @click="bookFlight(flight)">预订</button>
            </div>
          </div>
        </template>
        <div v-if="searchResult.inbound.length" class="inbound-section">
          <h4>返程航班</h4>
          <div v-for="flight in searchResult.inbound" :key="flight.id" class="flight-card">
            <div class="flight-info">
              <div class="flight-airline">{{ flight.airline }}</div>
              <div class="flight-route">
                <span class="city">{{ flight.from_city }}</span>
                <span class="arrow">→</span>
                <span class="city">{{ flight.to_city }}</span>
              </div>
              <div class="flight-date">{{ flight.date }}</div>
            </div>
            <div class="flight-price">
              <span class="price">¥{{ flight.price }}</span>
              <button class="book-btn" @click="bookFlight(flight)">预订</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 酒店页面 -->
    <div v-if="currentService === 'hotel'" class="hotel-section">
      <div class="search-panel">
        <div class="search-form">
          <div class="city-input-wrap">
            <label>目的地</label>
            <input 
              type="text" 
              v-model="hotelCity" 
              placeholder="请输入城市名"
              class="city-input"
            />
          </div>

          <div class="date-input-wrap">
            <label>入住日期</label>
            <DatePicker v-model="hotelCheckIn" />
          </div>

          <div class="date-input-wrap">
            <label>退房日期</label>
            <DatePicker v-model="hotelCheckOut" />
          </div>

          <button class="search-btn" @click="searchHotels">
            搜索酒店
          </button>
        </div>
      </div>
    </div>

    <div v-if="currentService === 'hotel' && hotelResults.length" class="flight-results">
      <div class="results-header">
        <h3>酒店搜索结果</h3>
        <span>{{ hotelResults.length }} 家酒店</span>
      </div>
      <div class="results-content">
        <div v-for="hotel in hotelResults" :key="hotel.id" class="hotel-card">
          <div class="hotel-info">
            <div class="hotel-name">{{ hotel.name }}</div>
            <div class="hotel-address">{{ hotel.address }}</div>
            <div class="hotel-rating">评分：{{ hotel.rating }}</div>
          </div>
          <div class="hotel-price">
            <span class="price">¥{{ hotel.price }}/晚</span>
            <button class="book-btn" @click="bookHotel(hotel)">预订</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 旅行页面 -->
    <div v-if="currentService === 'travel'" class="travel-section">
      <div class="placeholder-panel">
        <div class="placeholder-icon">✈️</div>
        <h2>旅行服务即将上线</h2>
        <p>敬请期待，我们正在准备中...</p>
      </div>
    </div>

    <!-- 攻略页面 -->
    <div v-if="currentService === 'guide'" class="guide-section">
      <div class="placeholder-panel">
        <div class="placeholder-icon">📖</div>
        <h2>旅行攻略即将上线</h2>
        <p>敬请期待，我们正在准备中...</p>
      </div>
    </div>

    <ElementPlus.Dialog v-model="showOrderModalVisible" :title="orderModalTitle">
      <div class="order-modal-content">
        <input 
          type="text" 
          v-model="orderNo" 
          placeholder="请输入订单号"
          class="order-input"
        />
        <button class="order-submit" @click="queryOrder">查询</button>
        <div v-if="orderResult" class="order-result">
          <p>订单号: {{ orderResult.order_no }}</p>
          <p>状态: {{ orderResult.status === 'pending' ? '待出票' : orderResult.status === 'confirmed' ? '已出票' : '已取消' }}</p>
          <p>乘客: {{ orderResult.passenger_name }}</p>
        </div>
      </div>
    </ElementPlus.Dialog>

    <footer class="footer">
      <div class="footer-content">
        <p>© 2024 去哪儿网 Qunar.com</p>
        <p>京ICP证090029号</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import CitySelector from './components/CitySelector.vue'
import DatePicker from './components/DatePicker.vue'
import PriceTrend from './components/PriceTrend.vue'
import MultiFlight from './components/MultiFlight.vue'
import axios from 'axios'

const flightType = ref('domestic')
const tripType = ref('oneway')
const fromCity = ref('')
const toCity = ref('')
const departDate = ref('')
const returnDate = ref('')
const showOrderHover = ref(false)
const showOrderModalVisible = ref(false)
const orderModalType = ref('')
const orderNo = ref('')
const orderResult = ref(null)
const showPriceTrend = ref(false)
const searchResult = ref(null)

const tags = ref([])
const tagInput = ref('')

const dateRangeStart = ref('')
const dateRangeEnd = ref('')

const options = ref({
  dateRange: false,
  direct: false,
  morning: false,
  evening: false
})

const currentService = ref('flight')

// 酒店相关状态
const hotelCity = ref('北京')
const hotelCheckIn = ref('')
const hotelCheckOut = ref('')
const hotelResults = ref([])

const switchService = (service) => {
  currentService.value = service
}

const getServiceName = (service) => {
  const names = {
    flight: '机票',
    hotel: '酒店',
    travel: '旅行',
    guide: '攻略'
  }
  return names[service] || service
}

const orderModalTitle = computed(() => {
  return orderModalType.value === 'ticket' ? '出票状态查询' : '退票改签'
})

const groupedFlights = computed(() => {
  if (!searchResult.value) return {}
  const groups = {}
  searchResult.value.outbound.forEach(flight => {
    if (!groups[flight.date]) {
      groups[flight.date] = []
    }
    groups[flight.date].push(flight)
  })
  return groups
})

const formatDateDisplay = (dateStr) => {
  const date = new Date(dateStr)
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekDay = weekDays[date.getDay()]
  return `${month}月${day}日 周${weekDay}`
}

onMounted(() => {
  const today = new Date()
  const depart = new Date(today)
  depart.setDate(today.getDate() + 2)
  departDate.value = depart.toISOString().split('T')[0]

  const returnD = new Date(depart)
  returnD.setDate(depart.getDate() + 3)
  returnDate.value = returnD.toISOString().split('T')[0]

  // 设置默认日期范围
  dateRangeStart.value = departDate.value
  const rangeEnd = new Date(depart)
  rangeEnd.setDate(depart.getDate() + 5)
  dateRangeEnd.value = rangeEnd.toISOString().split('T')[0]

  fromCity.value = '北京'

  // 设置默认酒店日期
  hotelCheckIn.value = departDate.value
  hotelCheckOut.value = returnDate.value
})

const handleFromSelect = (city) => {
  fromCity.value = city.name
  autoDetectFlightType(city.type)
}

const handleToSelect = (city) => {
  toCity.value = city.name
  autoDetectFlightType(city.type)
}

const autoDetectFlightType = (type) => {
  if (type === 'international') {
    flightType.value = 'international'
  }
}

const handleDateChange = (date) => {
  departDate.value = date
}

const handleReturnDateChange = (date) => {
  returnDate.value = date
  if (date && tripType.value === 'oneway') {
    tripType.value = 'roundtrip'
  }
}

const swapCities = () => {
  const temp = fromCity.value
  fromCity.value = toCity.value
  toCity.value = temp
}

const togglePriceTrend = () => {
  showPriceTrend.value = !showPriceTrend.value
}

const searchFlights = async () => {
  if (!fromCity.value || !toCity.value) {
    alert('请填写完整信息')
    return
  }

  const params = {
    from: fromCity.value,
    to: toCity.value,
    type: flightType.value
  }

  if (options.value.dateRange) {
    if (!dateRangeStart.value || !dateRangeEnd.value) {
      alert('请选择日期范围')
      return
    }
    params.dateStart = dateRangeStart.value
    params.dateEnd = dateRangeEnd.value
  } else {
    if (!departDate.value) {
      alert('请选择出发日期')
      return
    }
    params.date = departDate.value
  }

  if (tripType.value === 'roundtrip' && returnDate.value) {
    params.returnDate = returnDate.value
  }

  try {
    const response = await axios.get('/api/flights', { params })
    searchResult.value = response.data.data
  } catch (error) {
    console.error('搜索失败:', error)
  }
}

const searchMultiFlights = async (segments) => {
  try {
    const response = await axios.get('/api/multi-flights', {
      params: { segments: JSON.stringify(segments) }
    })
    console.log('多程搜索结果:', response.data)
  } catch (error) {
    console.error('多程搜索失败:', error)
  }
}

const addTag = () => {
  if (tagInput.value && tags.value.length < 5) {
    tags.value.push(tagInput.value)
    tagInput.value = ''
  }
}

const removeTag = (index) => {
  tags.value.splice(index, 1)
}

const openOrderModal = (type) => {
  orderModalType.value = type
  showOrderModalVisible.value = true
}

const queryOrder = async () => {
  if (!orderNo.value) return
  try {
    const response = await axios.get('/api/orders', { params: { orderNo: orderNo.value } })
    orderResult.value = response.data.data[0]
  } catch (error) {
    console.error('查询失败:', error)
  }
}

const bookFlight = async (flight) => {
  try {
    const response = await axios.post('/api/order', {
      flightInfo: flight,
      passengerName: '测试用户'
    })
    if (response.data.success) {
      alert(`预订成功！订单号: ${response.data.data.orderNo}`)
    } else {
      alert('预订失败，请重试')
    }
  } catch (error) {
    console.error('预订失败:', error)
    alert('预订失败，请重试')
  }
}

const searchHotels = () => {
  // 模拟酒店搜索结果
  hotelResults.value = [
    { id: 1, name: '北京王府井希尔顿酒店', address: '北京市东城区王府井东街8号', rating: 4.8, price: 1888 },
    { id: 2, name: '北京国贸大酒店', address: '北京市朝阳区建国门外大街1号', rating: 4.9, price: 2588 },
    { id: 3, name: '北京首都机场希尔顿酒店', address: '北京市顺义区首都机场三号航站楼', rating: 4.7, price: 988 },
    { id: 4, name: '北京三里屯洲际酒店', address: '北京市朝阳区工体北路1号', rating: 4.8, price: 2288 }
  ]
}

const bookHotel = (hotel) => {
  alert(`已预订酒店: ${hotel.name}，请在订单页面查看详情`)
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.header {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-text {
  font-size: 28px;
  font-weight: bold;
  color: #ff6c00;
}

.logo-sub {
  font-size: 12px;
  color: #999;
  margin-left: 5px;
}

.main-nav {
  display: flex;
  gap: 30px;
}

.nav-item {
  text-decoration: none;
  color: #333;
  font-size: 16px;
  font-weight: 500;
  padding: 8px 15px;
  border-radius: 20px;
  transition: all 0.3s;
}

.nav-item:hover, .nav-item.active {
  background: #ff6c00;
  color: white;
}

.header-right {
  display: flex;
  gap: 15px;
}

.login-btn, .register-btn {
  text-decoration: none;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
}

.login-btn {
  color: #333;
  border: 1px solid #ddd;
}

.register-btn {
  background: #ff6c00;
  color: white;
}

.order-query {
  background: rgba(0, 0, 0, 0.1);
}

.order-query-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.query-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  cursor: pointer;
  padding: 8px 15px;
  border-radius: 20px;
  position: relative;
  transition: background 0.3s;
}

.query-item:hover {
  background: rgba(255, 255, 255, 0.2);
}

.query-icon {
  font-size: 16px;
}

.divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.3);
}

.order-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 5px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 10px;
  z-index: 1000;
}

.order-dropdown a {
  display: block;
  padding: 10px 30px 10px 15px;
  color: #333;
  text-decoration: none;
  white-space: nowrap;
}

.order-dropdown a:hover {
  background: #f5f5f5;
}

.flight-search-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

.flight-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px 10px 0 0;
  padding: 5px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 15px;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-item.active {
  background: #ff6c00;
  color: white;
}

.search-panel {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 0 0 10px 10px;
  padding: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.trip-type {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.trip-item {
  padding: 8px 20px;
  border-radius: 20px;
  background: #f5f5f5;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.trip-item.active {
  background: #ff6c00;
  color: white;
}

.search-form {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
}

.city-input-wrap, .date-input-wrap {
  flex: 1;
  min-width: 150px;
}

.city-input-wrap label, .date-input-wrap label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.date-input-wrap.disabled {
  opacity: 0.5;
}

.swap-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.swap-btn:hover {
  background: #ff6c00;
  color: white;
}

.search-btn {
  background: linear-gradient(135deg, #ff6c00 0%, #ff8c42 100%);
  color: white;
  border: none;
  padding: 15px 40px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(255, 108, 0, 0.4);
}

.extra-options {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 14px;
}

.date-range-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 10px;
}

.range-label {
  font-size: 14px;
  color: #666;
}

.date-range-inputs .date-picker-wrap {
  width: 160px;
}

.trend-btn {
  margin-left: auto;
  background: #f0f9ff;
  color: #0088ff;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
}

.price-trend-box {
  margin-top: 20px;
  padding: 20px;
  background: #fafafa;
  border-radius: 10px;
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: bold;
}

.international-options {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.tag-search {
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 10px;
}

.tag-search label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.tag-input-wrap input {
  width: 200px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.tag {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #ff6c00;
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 14px;
}

.tag span:last-child {
  cursor: pointer;
}

.flight-results {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 20px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  color: white;
}

.results-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  padding: 20px;
}

.date-group-header {
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 10px;
  margin-top: 20px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
}

.date-group-header:first-child {
  margin-top: 0;
}

.flight-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  transition: background 0.3s;
}

.flight-card:hover {
  background: #fafafa;
}

.flight-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.flight-airline {
  font-weight: bold;
  color: #333;
}

.flight-route {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 18px;
}

.city {
  font-weight: 500;
}

.flight-date {
  color: #999;
  font-size: 14px;
}

.flight-price {
  text-align: right;
}

.price {
  font-size: 24px;
  font-weight: bold;
  color: #ff6c00;
}

.book-btn {
  display: block;
  margin-top: 10px;
  background: #ff6c00;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  cursor: pointer;
}

.inbound-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #ff6c00;
}

.order-modal-content {
  padding: 20px;
}

.order-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  margin-bottom: 15px;
}

.order-submit {
  width: 100%;
  background: #ff6c00;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 5px;
  cursor: pointer;
}

.order-result {
  margin-top: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 5px;
}

.footer {
  background: rgba(0, 0, 0, 0.1);
  padding: 30px;
  margin-top: 50px;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  color: white;
  font-size: 14px;
}

/* 酒店页面样式 */
.city-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.hotel-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 10px;
  margin-bottom: 15px;
}

.hotel-info {
  flex: 1;
}

.hotel-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.hotel-address {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.hotel-rating {
  font-size: 14px;
  color: #ff6c00;
  font-weight: bold;
}

.hotel-price {
  text-align: right;
}

/* 占位页面样式 */
.placeholder-panel {
  max-width: 1200px;
  margin: 50px auto;
  padding: 0 20px;
  text-align: center;
}

.placeholder-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.placeholder-panel h2 {
  color: white;
  font-size: 32px;
  margin-bottom: 10px;
}

.placeholder-panel p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
}
</style>