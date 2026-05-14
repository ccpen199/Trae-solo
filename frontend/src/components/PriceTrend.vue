<template>
  <div class="price-trend">
    <div class="trend-chart">
      <div 
        v-for="(item, index) in trendData" 
        :key="index" 
        class="chart-bar-wrap"
      >
        <div class="bar-container">
          <div 
            class="bar" 
            :style="{ height: getBarHeight(item.avgPrice) + '%' }"
            :class="{ low: isLowPrice(item.avgPrice), high: isHighPrice(item.avgPrice) }"
          >
            <div v-if="item.avgPrice" class="price-tooltip">¥{{ item.avgPrice }}</div>
          </div>
        </div>
        <div class="bar-label">{{ formatDate(item.date) }}</div>
        <div v-if="item.minPrice" class="bar-min">¥{{ item.minPrice }}</div>
      </div>
    </div>
    <div class="trend-legend">
      <div class="legend-item">
        <span class="legend-color low"></span>
        <span>低价</span>
      </div>
      <div class="legend-item">
        <span class="legend-color normal"></span>
        <span>正常</span>
      </div>
      <div class="legend-item">
        <span class="legend-color high"></span>
        <span>高价</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'

const props = defineProps({
  from: String,
  to: String
})

const trendData = ref([])
const minPrice = ref(0)
const maxPrice = ref(10000)

const getBarHeight = (price) => {
  if (!price || minPrice.value === maxPrice.value) return 0
  return ((price - minPrice.value) / (maxPrice.value - minPrice.value)) * 100
}

const isLowPrice = (price) => {
  if (!price) return false
  const avg = (minPrice.value + maxPrice.value) / 2
  return price < avg * 0.8
}

const isHighPrice = (price) => {
  if (!price) return false
  const avg = (minPrice.value + maxPrice.value) / 2
  return price > avg * 1.2
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const fetchTrend = async () => {
  if (!props.from || !props.to) return
  
  const today = new Date()
  const endDate = new Date(today)
  endDate.setDate(today.getDate() + 14)
  
  try {
    const response = await axios.get('/api/price-trend', {
      params: {
        from: props.from,
        to: props.to,
        startDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }
    })
    
    trendData.value = response.data.data
    
    const prices = trendData.value.filter(item => item.avgPrice).map(item => item.avgPrice)
    if (prices.length) {
      minPrice.value = Math.min(...prices) * 0.9
      maxPrice.value = Math.max(...prices) * 1.1
    }
  } catch (error) {
    console.error('获取价格趋势失败:', error)
  }
}

onMounted(fetchTrend)

watch([() => props.from, () => props.to], fetchTrend)
</script>

<style scoped>
.price-trend {
  padding: 15px;
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 200px;
  padding: 20px 0;
  border-bottom: 1px solid #eee;
}

.chart-bar-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar-container {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
}

.bar {
  width: 20px;
  background: #4facfe;
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: height 0.3s;
}

.bar:hover {
  opacity: 0.8;
}

.bar.low {
  background: #52c41a;
}

.bar.high {
  background: #ff4d4f;
}

.price-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  margin-bottom: 5px;
  opacity: 0;
  transition: opacity 0.3s;
}

.bar:hover .price-tooltip {
  opacity: 1;
}

.bar-label {
  font-size: 11px;
  color: #666;
  margin-top: 8px;
}

.bar-min {
  font-size: 10px;
  color: #999;
  margin-top: 2px;
}

.trend-legend {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-color.low {
  background: #52c41a;
}

.legend-color.normal {
  background: #4facfe;
}

.legend-color.high {
  background: #ff4d4f;
}
</style>