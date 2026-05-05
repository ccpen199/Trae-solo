<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item @click="goBack" style="cursor: pointer; color: #409eff;">数据采集</el-breadcrumb-item>
          <el-breadcrumb-item>会话详情</el-breadcrumb-item>
        </el-breadcrumb>
        <h2 style="margin-top: 10px;">采集会话详情</h2>
      </div>
      <el-button 
        v-if="session?.status === 'running'" 
        type="success" 
        @click="endSession"
      >
        结束采集
      </el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">基本信息</div>
          </template>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="会话编号">{{ session?.session_code }}</el-descriptions-item>
            <el-descriptions-item label="车辆VIN">{{ session?.vin || '-' }}</el-descriptions-item>
            <el-descriptions-item label="车型">{{ session?.model_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="通讯协议">
              <el-tag>{{ session?.protocol_type }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="session?.status === 'running' ? 'success' : 'info'">
                {{ session?.status === 'running' ? '进行中' : '已完成' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="采样数量">{{ session?.total_samples || 0 }}</el-descriptions-item>
            <el-descriptions-item label="创建人">{{ session?.created_by_name }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(session?.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="结束时间">{{ formatTime(session?.ended_at) || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">时序数据</div>
          </template>
          
          <el-form :inline="true" :model="dataSearchForm" style="margin-bottom: 15px;">
            <el-form-item label="数据类型">
              <el-select v-model="dataSearchForm.data_type" placeholder="全部类型" clearable style="width: 150px">
                <el-option label="转速" value="RPM" />
                <el-option label="进气压力" value="MAP" />
                <el-option label="温度" value="TEMP" />
                <el-option label="电压" value="VOLT" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchTimeSeriesData">查询</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="timeSeriesData" style="width: 100%" v-loading="dataLoading">
            <el-table-column prop="timestamp" label="时间戳" width="180">
              <template #default="scope">
                {{ formatTime(scope.row.timestamp) }}
              </template>
            </el-table-column>
            <el-table-column prop="data_type" label="数据类型" width="100">
              <template #default="scope">
                <el-tag size="small">{{ scope.row.data_type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="data_value" label="数值" width="120">
              <template #default="scope">
                {{ scope.row.data_value }}
                <span v-if="scope.row.unit">{{ scope.row.unit }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="sensor_name" label="传感器" />
          </el-table>

          <el-pagination
            v-model:current-page="dataPagination.page"
            v-model:page-size="dataPagination.limit"
            :page-sizes="[20, 50, 100]"
            :total="dataPagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchTimeSeriesData"
            @current-change="fetchTimeSeriesData"
            style="margin-top: 20px; justify-content: flex-end"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">通讯日志</div>
          </template>
          <el-table :data="commLogs" style="width: 100%" v-loading="commLoading">
            <el-table-column prop="timestamp" label="时间" width="180">
              <template #default="scope">
                {{ formatTime(scope.row.timestamp) }}
              </template>
            </el-table-column>
            <el-table-column prop="direction" label="方向" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.direction === 'sent' ? 'primary' : 'success'" size="small">
                  {{ scope.row.direction === 'sent' ? '发送' : '接收' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message_type" label="消息类型" width="150" />
            <el-table-column prop="success" label="状态" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.success ? 'success' : 'danger'" size="small">
                  {{ scope.row.success ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="error_message" label="错误信息" min-width="200">
              <template #default="scope">
                {{ scope.row.error_message || '-' }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const route = useRoute()
const router = useRouter()
const sessionId = computed(() => route.params.id)

const session = ref(null)
const timeSeriesData = ref([])
const commLogs = ref([])
const dataLoading = ref(false)
const commLoading = ref(false)

const dataSearchForm = reactive({
  data_type: '',
})

const dataPagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
})

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const goBack = () => {
  router.push('/data-collection')
}

const fetchSession = async () => {
  try {
    const data = await request.get(`/data-collection/sessions/${sessionId.value}`)
    session.value = data
  } catch (err) {
    console.error('获取会话详情失败:', err)
  }
}

const fetchTimeSeriesData = async () => {
  dataLoading.value = true
  try {
    const params = {
      session_id: sessionId.value,
      page: dataPagination.page,
      limit: dataPagination.limit,
      ...dataSearchForm,
    }
    const data = await request.get('/data-collection/time-series', { params })
    timeSeriesData.value = data.data
    dataPagination.total = data.pagination.total
  } catch (err) {
    console.error('获取时序数据失败:', err)
  } finally {
    dataLoading.value = false
  }
}

const fetchCommLogs = async () => {
  commLoading.value = true
  try {
    const params = {
      session_id: sessionId.value,
      limit: 100,
    }
    const data = await request.get('/data-collection/communication-logs', { params })
    commLogs.value = data.logs
  } catch (err) {
    console.error('获取通讯日志失败:', err)
  } finally {
    commLoading.value = false
  }
}

const endSession = () => {
  ElMessageBox.confirm('确定要结束此采集会话吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await request.put(`/data-collection/sessions/${sessionId.value}/end`)
        ElMessage.success('会话已结束')
        fetchSession()
      } catch (err) {
        console.error('结束会话失败:', err)
      }
    })
    .catch(() => {})
}

onMounted(() => {
  fetchSession()
  fetchTimeSeriesData()
  fetchCommLogs()
})
</script>

<style scoped>
.card-header {
  font-weight: bold;
  font-size: 16px;
}
</style>
