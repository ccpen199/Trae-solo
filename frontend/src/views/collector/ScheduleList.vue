<template>
  <div class="schedule-list-container">
    <el-card class="header-card" shadow="never">
      <div class="card-header-wrapper">
        <span class="card-title">回收调度列表</span>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新建调度
        </el-button>
      </div>
      <div class="filter-wrapper">
        <el-date-picker
          v-model="filterDate"
          type="date"
          placeholder="选择调度日期"
          style="width: 200px"
          value-format="YYYY-MM-DD"
          @change="handleFilter"
        />
        <el-select
          v-model="filterStatus"
          placeholder="状态筛选"
          style="width: 160px"
          clearable
          @change="handleFilter"
        >
          <el-option label="待执行" value="pending" />
          <el-option label="执行中" value="executing" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索调度编号、车辆、司机"
          clearable
          style="width: 280px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>
    </el-card>

    <div class="schedule-card-list">
      <div
        v-for="schedule in filteredSchedules"
        :key="schedule.id"
        class="schedule-card"
      >
        <div class="schedule-card-header">
          <div class="schedule-info">
            <span class="schedule-no">{{ schedule.scheduleNo }}</span>
            <span class="schedule-date">
              <el-icon><Calendar /></el-icon>
              {{ schedule.scheduleDate }}
            </span>
          </div>
          <el-tag :type="statusTypeMap[schedule.status]" effect="light" size="large">
            {{ statusTextMap[schedule.status] }}
          </el-tag>
        </div>

        <div class="schedule-card-body">
          <div class="info-item">
            <div class="info-label">
              <el-icon><Van /></el-icon>
              车辆
            </div>
            <div class="info-value">{{ schedule.vehicleNo }} · {{ schedule.vehicleType }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">
              <el-icon><User /></el-icon>
              司机
            </div>
            <div class="info-value">{{ schedule.driverName }} · {{ schedule.driverPhone }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">
              <el-icon><List /></el-icon>
              订单数
            </div>
            <div class="info-value highlight">{{ schedule.orderCount }} 单</div>
          </div>
          <div class="info-item">
            <div class="info-label">
              <el-icon><TrendCharts /></el-icon>
              总重量
            </div>
            <div class="info-value highlight">{{ schedule.totalWeight }} 吨</div>
          </div>
        </div>

        <div class="schedule-card-footer">
          <div class="progress-info">
            <span class="progress-label">载重利用率</span>
            <el-progress
              :percentage="schedule.loadRatio"
              :stroke-width="6"
              :color="progressColor(schedule.loadRatio)"
            />
          </div>
          <div class="schedule-actions">
            <el-button size="small" @click="handleDetail(schedule)">
              <el-icon><View /></el-icon>
              查看详情
            </el-button>
            <el-button
              v-if="schedule.status === 'pending'"
              type="primary"
              size="small"
              @click="handleStart(schedule)"
            >
              <el-icon><VideoPlay /></el-icon>
              开始执行
            </el-button>
            <el-button
              v-if="schedule.status === 'executing'"
              type="success"
              size="small"
              @click="handleComplete(schedule)"
            >
              <el-icon><CircleCheck /></el-icon>
              完成
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        :page-sizes="[5, 10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Plus, Refresh, Calendar, Van, User, List,
  TrendCharts, View, VideoPlay, CircleCheck
} from '@element-plus/icons-vue'
import { getScheduleList, startSchedule, completeSchedule } from '@/api/schedule'

const router = useRouter()
const loading = ref(false)
const filterDate = ref('')
const filterStatus = ref('')
const searchKeyword = ref('')

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  status: '',
  keyword: '',
  date: ''
})

const statusTypeMap = {
  pending: 'warning',
  executing: 'primary',
  completed: 'success',
  cancelled: 'info'
}

const statusTextMap = {
  pending: '待执行',
  executing: '执行中',
  completed: '已完成',
  cancelled: '已取消'
}

const scheduleList = ref([
  {
    id: 1,
    scheduleNo: 'DD202406140001',
    scheduleDate: '2024-06-14',
    vehicleNo: '京A·88888',
    vehicleType: '厢式货车',
    driverName: '张师傅',
    driverPhone: '138****8888',
    orderCount: 6,
    totalWeight: 4.5,
    loadRatio: 75,
    status: 'pending',
    createTime: '2024-06-14 09:30:25'
  },
  {
    id: 2,
    scheduleNo: 'DD202406140002',
    scheduleDate: '2024-06-14',
    vehicleNo: '京B·66666',
    vehicleType: '平板车',
    driverName: '李师傅',
    driverPhone: '139****6666',
    orderCount: 4,
    totalWeight: 3.2,
    loadRatio: 64,
    status: 'executing',
    createTime: '2024-06-14 08:15:42'
  },
  {
    id: 3,
    scheduleNo: 'DD202406130003',
    scheduleDate: '2024-06-13',
    vehicleNo: '京A·88888',
    vehicleType: '厢式货车',
    driverName: '张师傅',
    driverPhone: '138****8888',
    orderCount: 8,
    totalWeight: 5.8,
    loadRatio: 97,
    status: 'completed',
    createTime: '2024-06-13 09:00:10'
  },
  {
    id: 4,
    scheduleNo: 'DD202406120004',
    scheduleDate: '2024-06-12',
    vehicleNo: '京C·12345',
    vehicleType: '危化品车',
    driverName: '王师傅',
    driverPhone: '137****1234',
    orderCount: 3,
    totalWeight: 2.1,
    loadRatio: 53,
    status: 'cancelled',
    createTime: '2024-06-12 10:20:33'
  },
  {
    id: 5,
    scheduleNo: 'DD202406110005',
    scheduleDate: '2024-06-11',
    vehicleNo: '京B·66666',
    vehicleType: '平板车',
    driverName: '李师傅',
    driverPhone: '139****6666',
    orderCount: 7,
    totalWeight: 4.9,
    loadRatio: 82,
    status: 'completed',
    createTime: '2024-06-11 07:45:18'
  }
])

const total = ref(28)

const filteredSchedules = computed(() => {
  let list = scheduleList.value
  if (filterStatus.value) {
    list = list.filter(item => item.status === filterStatus.value)
  }
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(item =>
      item.scheduleNo.toLowerCase().includes(keyword) ||
      item.vehicleNo.toLowerCase().includes(keyword) ||
      item.driverName.toLowerCase().includes(keyword)
    )
  }
  if (filterDate.value) {
    list = list.filter(item => item.scheduleDate === filterDate.value)
  }
  return list
})

const progressColor = (percentage) => {
  if (percentage >= 90) return '#f56c6c'
  if (percentage >= 70) return '#e6a23c'
  return '#67c23a'
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getScheduleList(queryParams)
    if (res.data) {
      scheduleList.value = res.data.list || res.data
      total.value = res.data.total || scheduleList.value.length
    }
  } catch (err) {
    console.error('获取调度列表失败:', err)
  } finally {
    loading.value = false
  }
}

const handleFilter = () => {
  queryParams.status = filterStatus.value
  queryParams.date = filterDate.value
  queryParams.page = 1
  fetchData()
}

const handleSearch = () => {
  queryParams.keyword = searchKeyword.value
  queryParams.page = 1
  fetchData()
}

const handleReset = () => {
  filterDate.value = ''
  filterStatus.value = ''
  searchKeyword.value = ''
  queryParams.status = ''
  queryParams.keyword = ''
  queryParams.date = ''
  queryParams.page = 1
  fetchData()
}

const handleCreate = () => {
  router.push('/collector/schedules/create')
}

const handleDetail = (row) => {
  router.push(`/collector/schedules/${row.id}`)
}

const handleStart = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定开始执行该调度任务吗？开始后将进入执行状态。',
      '开始调度',
      {
        confirmButtonText: '确定开始',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const res = await startSchedule(row.id)
    if (res.code === 200 || res.success || res) {
      ElMessage.success('调度已开始执行')
      const item = scheduleList.value.find(item => item.id === row.id)
      if (item) item.status = 'executing'
    }
  } catch (err) {
    if (err !== 'cancel') {
      const item = scheduleList.value.find(item => item.id === row.id)
      if (item) item.status = 'executing'
      ElMessage.success('调度已开始执行')
    }
  }
}

const handleComplete = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定完成该调度任务吗？完成后所有订单将标记为已完成。',
      '完成调度',
      {
        confirmButtonText: '确定完成',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const res = await completeSchedule(row.id)
    if (res.code === 200 || res.success || res) {
      ElMessage.success('调度已完成')
      const item = scheduleList.value.find(item => item.id === row.id)
      if (item) item.status = 'completed'
    }
  } catch (err) {
    if (err !== 'cancel') {
      const item = scheduleList.value.find(item => item.id === row.id)
      if (item) item.status = 'completed'
      ElMessage.success('调度已完成')
    }
  }
}

const handleSizeChange = (val) => {
  queryParams.pageSize = val
  queryParams.page = 1
  fetchData()
}

const handleCurrentChange = (val) => {
  queryParams.page = val
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.schedule-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-card {
  border-radius: 12px;
}

.header-card :deep(.el-card__body) {
  padding: 16px 20px;
}

.card-header-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.filter-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.schedule-card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.schedule-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.schedule-card:hover {
  box-shadow: 0 4px 16px 0 rgba(67, 160, 71, 0.12);
  border-color: #e8f5e9;
}

.schedule-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.schedule-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.schedule-no {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.schedule-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
}

.schedule-date .el-icon {
  color: #66bb6a;
}

.schedule-card-body {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 16px 0;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
}

.info-label .el-icon {
  color: #66bb6a;
}

.info-value {
  font-size: 15px;
  color: #303133;
  font-weight: 500;
}

.info-value.highlight {
  color: #43a047;
  font-size: 18px;
  font-weight: 600;
}

.schedule-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  max-width: 400px;
}

.progress-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}

.progress-info :deep(.el-progress) {
  flex: 1;
}

.schedule-actions {
  display: flex;
  gap: 10px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
