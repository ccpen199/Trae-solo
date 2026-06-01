<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-value">{{ stats.todayAppointments }}</div>
          <div class="stat-label">今日预约</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-value warning">{{ stats.pendingReview }}</div>
          <div class="stat-label">待审核</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-value info">{{ stats.currentlyInPark }}</div>
          <div class="stat-label">在场车辆</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-value success">{{ stats.checkedInToday }}</div>
          <div class="stat-label">今日入园</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-value">{{ stats.checkedOutToday }}</div>
          <div class="stat-label">今日离园</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-value danger">{{ stats.blacklistedVisitors }}</div>
          <div class="stat-label">黑名单</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>最近预约记录</span>
          </template>
          <el-table :data="recentAppointments" size="small">
            <el-table-column prop="appointment_no" label="预约号" width="120" />
            <el-table-column prop="visitor_name" label="访客" width="100" />
            <el-table-column prop="enterprise_name" label="来访企业" />
            <el-table-column prop="license_plate" label="车牌" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="scheduled_arrival" label="预约时间" width="160">
              <template #default="{ row }">{{ formatTime(row.scheduled_arrival) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>停车场状态</span>
          </template>
          <div class="parking-status">
            <div v-for="lot in parkingLotsList" :key="lot.id" class="parking-lot">
              <div class="lot-name">{{ lot.name }}</div>
              <el-progress 
                :percentage="((lot.total_spaces - lot.available_spaces) / lot.total_spaces) * 100"
                :status="lot.available_spaces < 10 ? 'exception' : ''"
              />
              <div class="lot-info">
                可用: {{ lot.available_spaces }} / {{ lot.total_spaces }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { dashboard, appointments, parkingLots } from '../api'

const stats = ref({
  todayAppointments: 0,
  pendingReview: 0,
  currentlyInPark: 0,
  checkedInToday: 0,
  checkedOutToday: 0,
  blacklistedVisitors: 0
})

const recentAppointments = ref([])
const parkingLotsList = ref([])

const loadStats = async () => {
  try {
    const res = await dashboard.stats()
    stats.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const loadAppointments = async () => {
  try {
    const res = await appointments.list({})
    recentAppointments.value = res.data.slice(0, 10)
  } catch (e) {
    console.error(e)
  }
}

const loadParkingLots = async () => {
  try {
    const res = await parkingLots.list()
    parkingLotsList.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const statusType = (status) => {
  const map = {
    pending: 'info',
    checked_in: 'success',
    checked_out: '',
    approved: 'primary'
  }
  return map[status] || ''
}

const statusText = (status) => {
  const map = {
    pending: '待入园',
    checked_in: '已入园',
    checked_out: '已离园',
    approved: '已通过'
  }
  return map[status] || status
}

const formatTime = (t) => t ? t.slice(0, 16) : ''

onMounted(() => {
  loadStats()
  loadAppointments()
  loadParkingLots()
})
</script>

<style scoped>
.stat-card {
  text-align: center;
}
.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
}
.stat-value.info { color: #409eff }
.stat-value.success { color: #67c23a }
.stat-value.warning { color: #e6a23c }
.stat-value.danger { color: #f56c6c }
.stat-label {
  color: #909399;
  margin-top: 8px;
  font-size: 14px;
}
.parking-status {
  padding: 10px 0;
}
.parking-lot {
  margin-bottom: 20px;
}
.parking-lot:last-child {
  margin-bottom: 0;
}
.lot-name {
  font-size: 14px;
  margin-bottom: 8px;
  color: #333;
}
.lot-info {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
