<template>
  <div class="flights-page">
    <el-card>
      <template #header>
        <span>航班查询</span>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="出发机场">
          <el-input v-model="searchForm.departureAirport" placeholder="请输入出发机场" clearable />
        </el-form-item>
        <el-form-item label="到达机场">
          <el-input v-model="searchForm.arrivalAirport" placeholder="请输入到达机场" clearable />
        </el-form-item>
        <el-form-item label="出发日期">
          <el-date-picker
            v-model="searchForm.departureDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="航空公司">
          <el-select v-model="searchForm.airlineCode" placeholder="选择航空公司" clearable>
            <el-option
              v-for="airline in airlines"
              :key="airline.code"
              :label="airline.name"
              :value="airline.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>航班列表</span>
      </template>
      
      <el-table :data="flights" v-loading="loading" style="width: 100%">
        <el-table-column prop="flight_number" label="航班号" width="120" />
        <el-table-column prop="airline_name" label="航空公司" width="150" />
        <el-table-column label="航线" width="300">
          <template #default="scope">
            <div class="route-info">
              <span class="airport">{{ scope.row.departure_airport }}</span>
              <el-icon><ArrowRight /></el-icon>
              <span class="airport">{{ scope.row.arrival_airport }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="250">
          <template #default="scope">
            <div class="time-info">
              <span class="departure-time">{{ formatTime(scope.row.departure_time) }}</span>
              <span class="arrow">→</span>
              <span class="arrival-time">{{ formatTime(scope.row.arrival_time) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="aircraft_type" label="机型" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusName(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="150">
          <template #default="scope">
            <el-button type="primary" link @click="handleViewDetail(scope.row)">
              查看详情
            </el-button>
            <el-button 
              v-if="canCreateOrder" 
              type="success" 
              link 
              @click="handleBook(scope.row)"
            >
              预订
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="flights.length === 0 && !loading" description="暂无航班数据" />
    </el-card>

    <el-dialog v-model="detailVisible" title="航班详情" width="700px">
      <el-descriptions :column="2" border v-if="selectedFlight">
        <el-descriptions-item label="航班号">{{ selectedFlight.flight_number }}</el-descriptions-item>
        <el-descriptions-item label="航空公司">{{ selectedFlight.airline_name }}</el-descriptions-item>
        <el-descriptions-item label="出发机场">{{ selectedFlight.departure_airport }}</el-descriptions-item>
        <el-descriptions-item label="到达机场">{{ selectedFlight.arrival_airport }}</el-descriptions-item>
        <el-descriptions-item label="出发时间">{{ selectedFlight.departure_time }}</el-descriptions-item>
        <el-descriptions-item label="到达时间">{{ selectedFlight.arrival_time }}</el-descriptions-item>
        <el-descriptions-item label="机型">{{ selectedFlight.aircraft_type }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(selectedFlight.status)">
            {{ getStatusName(selectedFlight.status) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      
      <el-divider content-position="left">舱位信息</el-divider>
      
      <el-table :data="selectedFlight?.cabins || []" style="width: 100%">
        <el-table-column prop="cabin_class" label="舱位等级" width="100" />
        <el-table-column prop="price" label="价格" width="100">
          <template #default="scope">
            <span class="price">¥{{ scope.row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_seats" label="总座位数" width="100" />
        <el-table-column prop="available_seats" label="可用座位" width="100" />
        <el-table-column label="票价类型">
          <template #default="scope">
            <div v-for="fare in scope.row.fares" :key="fare.id" style="margin-bottom: 8px">
              <el-tag size="small" :type="fare.refundable ? 'success' : 'info'">
                {{ fare.fare_type }}
              </el-tag>
              <span style="margin-left: 8px">¥{{ fare.total_price }}</span>
              <span style="margin-left: 8px; color: #999; font-size: 12px">
                {{ fare.refundable ? '可退' : '不可退' }} |
                {{ fare.changeable ? '可改' : '不可改' }}
              </span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="bookVisible" title="预订航班" width="600px">
      <el-form :model="bookForm" :rules="bookRules" ref="bookFormRef" label-width="100px">
        <el-form-item label="航班号">
          <el-input :value="selectedFlight?.flight_number" disabled />
        </el-form-item>
        <el-form-item label="旅客ID" prop="passengerId">
          <el-input v-model.number="bookForm.passengerId" placeholder="请输入旅客ID" />
          <div class="form-tip">测试旅客ID: 1 (张三)</div>
        </el-form-item>
        <el-form-item label="期望完成时间" prop="expectedCompletionTime">
          <el-date-picker
            v-model="bookForm.expectedCompletionTime"
            type="datetime"
            placeholder="选择时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bookVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitBook" :loading="booking">
          确认预订
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import api from '@/api'
import { ElMessage } from 'element-plus'
import { Search, ArrowRight } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const booking = ref(false)
const flights = ref([])
const airlines = ref([])
const selectedFlight = ref(null)
const detailVisible = ref(false)
const bookVisible = ref(false)
const bookFormRef = ref(null)

const searchForm = reactive({
  departureAirport: '',
  arrivalAirport: '',
  departureDate: '',
  airlineCode: ''
})

const bookForm = reactive({
  passengerId: 1,
  expectedCompletionTime: ''
})

const bookRules = {
  passengerId: [{ required: true, message: '请输入旅客ID', trigger: 'blur' }]
}

const canCreateOrder = computed(() => userStore.canPerformAction('create_order'))

const loadAirlines = async () => {
  try {
    airlines.value = await api.get('/flights/airlines')
  } catch (error) {
    console.error('加载航空公司失败:', error)
  }
}

const handleSearch = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.departureAirport) params.departureAirport = searchForm.departureAirport
    if (searchForm.arrivalAirport) params.arrivalAirport = searchForm.arrivalAirport
    if (searchForm.departureDate) params.departureDate = searchForm.departureDate
    if (searchForm.airlineCode) params.airlineCode = searchForm.airlineCode
    
    flights.value = await api.get('/flights/search', { params })
  } catch (error) {
    console.error('查询航班失败:', error)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.departureAirport = ''
  searchForm.arrivalAirport = ''
  searchForm.departureDate = ''
  searchForm.airlineCode = ''
  handleSearch()
}

const handleViewDetail = async (flight) => {
  try {
    selectedFlight.value = await api.get(`/flights/${flight.id}`)
    detailVisible.value = true
  } catch (error) {
    console.error('获取航班详情失败:', error)
  }
}

const handleBook = (flight) => {
  selectedFlight.value = flight
  bookForm.passengerId = 1
  bookVisible.value = true
}

const handleSubmitBook = async () => {
  if (!bookFormRef.value) return
  
  await bookFormRef.value.validate(async (valid) => {
    if (valid) {
      booking.value = true
      try {
        const result = await api.post('/orders', {
          passengerId: bookForm.passengerId,
          flightId: selectedFlight.value.id,
          expectedCompletionTime: bookForm.expectedCompletionTime
        })
        
        ElMessage.success('预订成功，订单已创建')
        bookVisible.value = false
        router.push(`/orders/${result.orderId}`)
      } catch (error) {
        console.error('预订失败:', error)
      } finally {
        booking.value = false
      }
    }
  })
}

const formatTime = (time) => {
  if (!time) return ''
  return time.slice(11, 16)
}

const getStatusType = (status) => {
  const typeMap = {
    scheduled: 'info',
    delayed: 'warning',
    cancelled: 'danger',
    completed: 'success'
  }
  return typeMap[status] || 'info'
}

const getStatusName = (status) => {
  const nameMap = {
    scheduled: '计划中',
    delayed: '延误',
    cancelled: '取消',
    completed: '已完成'
  }
  return nameMap[status] || status
}

onMounted(() => {
  loadAirlines()
  handleSearch()
})
</script>

<style scoped>
.search-form {
  margin-bottom: 20px;
}

.route-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.airport {
  font-weight: 500;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.departure-time {
  color: #409EFF;
  font-weight: 500;
}

.arrival-time {
  color: #67C23A;
  font-weight: 500;
}

.arrow {
  color: #999;
}

.price {
  color: #F56C6C;
  font-weight: bold;
  font-size: 16px;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
