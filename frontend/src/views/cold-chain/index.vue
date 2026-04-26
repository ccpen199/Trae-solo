<template>
  <div class="cold-chain">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-icon" style="background: linear-gradient(135deg, #409eff, #66b1ff)">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-value">{{ stats.totalOrders }}</div>
            <div class="stats-label">冷链订单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-icon" style="background: linear-gradient(135deg, #67c23a, #85ce61)">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-value">{{ stats.normalCount }}</div>
            <div class="stats-label">正常运行</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-icon" style="background: linear-gradient(135deg, #f56c6c, #f78989)">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-value">{{ stats.exceptionCount }}</div>
            <div class="stats-label">异常数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-icon" style="background: linear-gradient(135deg, #e6a23c, #ebb563)">
            <el-icon><Odometer /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-value">{{ stats.avgTemperature.toFixed(1) }}°C</div>
            <div class="stats-label">平均温度</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>冷链实时监控</span>
          <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 120px">
            <el-option label="正常" value="NORMAL" />
            <el-option label="异常" value="EXCEPTION" />
            <el-option label="已解决" value="RESOLVED" />
          </el-select>
        </div>
      </template>

      <el-table :data="filteredRecords" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="deviceId" label="设备编号" width="150" />
        <el-table-column label="关联订单" width="200">
          <template #default="{ row }">
            <el-button type="primary" text @click="viewOrder(row.orderId)">
              {{ row.orderId }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="locationName" label="当前位置" />
        <el-table-column label="温度(°C)" width="120">
          <template #default="{ row }">
            <span :class="getTemperatureClass(row.temperature)">
              {{ row.temperature }}°C
            </span>
          </template>
        </el-table-column>
        <el-table-column label="湿度(%)" width="100">
          <template #default="{ row }">
            {{ row.humidity }}%
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="recordTime" label="记录时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.recordTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text @click="viewHistory(row.orderId)">
              历史记录
            </el-button>
            <el-button
              v-if="row.status === 'EXCEPTION'"
              type="danger"
              text
              @click="handleException(row)"
            >
              处理异常
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="historyVisible" title="温度历史记录" width="800px">
      <el-chart
        v-if="chartData.length > 0"
        type="line"
        :data="chartData"
        :x-axis="xAxis"
        :y-axis="yAxis"
        :series="series"
        style="height: 300px"
      />
      <el-empty v-else description="暂无历史数据" />

      <el-table :data="historyRecords" stripe style="width: 100%; margin-top: 20px">
        <el-table-column prop="recordTime" label="记录时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.recordTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="locationName" label="位置" />
        <el-table-column label="温度(°C)" width="100">
          <template #default="{ row }">
            <span :class="getTemperatureClass(row.temperature)">
              {{ row.temperature }}°C
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="humidity" label="湿度(%)" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import mockData from '@/utils/mock-data'
import type { ColdChainRecord, ColdChainStatus } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()

const filterStatus = ref<string>('')
const historyVisible = ref(false)
const historyRecords = ref<ColdChainRecord[]>([])
const currentOrderId = ref('')

const stats = reactive({
  totalOrders: 0,
  normalCount: 0,
  exceptionCount: 0,
  avgTemperature: 0,
})

const coldChainOrders = computed(() => {
  return mockData.mockOrders.filter(o => o.hasColdChain)
})

const records = computed(() => {
  return mockData.mockColdChainRecords
})

const filteredRecords = computed(() => {
  if (!filterStatus.value) {
    return records.value
  }
  return records.value.filter(r => r.status === filterStatus.value)
})

const chartData = computed(() => {
  return historyRecords.value
})

const xAxis = computed(() => ({
  data: historyRecords.value.map(r => dayjs(r.recordTime).format('HH:mm')),
}))

const yAxis = computed(() => ({
  type: 'value',
  name: '温度(°C)',
  min: -5,
  max: 25,
}))

const series = computed(() => [
  {
    name: '温度',
    type: 'line',
    data: historyRecords.value.map(r => r.temperature),
    smooth: true,
    areaStyle: {
      color: 'rgba(64, 158, 255, 0.3)',
    },
    lineStyle: {
      color: '#409eff',
    },
  },
])

const statusMap: Record<ColdChainStatus, { text: string; type: string }> = {
  NORMAL: { text: '正常', type: 'success' },
  EXCEPTION: { text: '异常', type: 'danger' },
  RESOLVED: { text: '已解决', type: 'info' },
}

const getStatusType = (status: ColdChainStatus) => statusMap[status]?.type || ''
const getStatusText = (status: ColdChainStatus) => statusMap[status]?.text || status

const getTemperatureClass = (temp: number) => {
  if (temp < 0 || temp > 8) {
    return 'temperature-abnormal'
  }
  if (temp < 2 || temp > 6) {
    return 'temperature-warning'
  }
  return 'temperature-normal'
}

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const loadStats = () => {
  stats.totalOrders = coldChainOrders.value.length
  stats.normalCount = records.value.filter(r => r.status === 'NORMAL').length
  stats.exceptionCount = records.value.filter(r => r.status === 'EXCEPTION').length
  
  if (records.value.length > 0) {
    const sum = records.value.reduce((acc, r) => acc + r.temperature, 0)
    stats.avgTemperature = sum / records.value.length
  }
}

const viewOrder = (orderId: string) => {
  router.push(`/orders/${orderId}`)
}

const viewHistory = (orderId: string) => {
  currentOrderId.value = orderId
  historyRecords.value = records.value.filter(r => r.orderId === orderId)
    .sort((a, b) => new Date(a.recordTime).getTime() - new Date(b.recordTime).getTime())
  historyVisible.value = true
}

const handleException = (row: ColdChainRecord) => {
  ElMessage.info('异常处理功能开发中，将跳转到订单详情页')
  router.push(`/orders/${row.orderId}`)
}

onMounted(() => {
  loadStats()
})
</script>

<style lang="scss" scoped>
.cold-chain {
  .stats-row {
    margin-bottom: 20px;
  }

  .stats-card {
    .el-card__body {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stats-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 28px;
    }

    .stats-info {
      .stats-value {
        font-size: 24px;
        font-weight: 600;
        color: #333;
      }

      .stats-label {
        font-size: 14px;
        color: #999;
        margin-top: 4px;
      }
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .temperature-normal {
    color: #67c23a;
    font-weight: 600;
  }

  .temperature-warning {
    color: #e6a23c;
    font-weight: 600;
  }

  .temperature-abnormal {
    color: #f56c6c;
    font-weight: 600;
  }
}
</style>
