<template>
  <div class="acceptance">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>验收检查</span>
          <el-button type="primary" @click="loadCheckData">
            <el-icon><Refresh /></el-icon>
            刷新检查
          </el-button>
        </div>
      </template>

      <el-alert
        :title="(checkData.total_issues || 0) > 0 ? '发现 ' + checkData.total_issues + ' 个问题需要处理' : '所有检查项通过'"
        :type="(checkData.total_issues || 0) > 0 ? 'warning' : 'success'"
        show-icon
        style="margin-bottom: 20px;"
      />

      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="check-card">
            <template #header>
              <div class="check-header">
                <span>设备离线检查</span>
                <el-tag v-if="(checkData.offline_points || []).length > 0" type="danger" size="small">
                  {{ (checkData.offline_points || []).length }}
                </el-tag>
              </div>
            </template>
            <el-empty v-if="!(checkData.offline_points || []).length" description="无离线设备" />
            <el-table v-else :data="checkData.offline_points" stripe size="small" @row-click="goToPoint">
              <el-table-column prop="name" label="点位名称">
                <template #default="{ row }">
                  <el-link type="primary" @click.stop="goToPoint(row)">{{ row.name }}</el-link>
                </template>
              </el-table-column>
              <el-table-column prop="device_code" label="设备编号" />
              <el-table-column prop="location" label="位置" />
              <el-table-column prop="last_heartbeat" label="最后心跳" />
            </el-table>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card class="check-card">
            <template #header>
              <div class="check-header">
                <span>连续超标检查</span>
                <el-tag v-if="(checkData.continuous_anomalies || []).length > 0" type="danger" size="small">
                  {{ (checkData.continuous_anomalies || []).length }}
                </el-tag>
              </div>
            </template>
            <el-empty v-if="!(checkData.continuous_anomalies || []).length" description="无连续超标" />
            <el-table v-else :data="checkData.continuous_anomalies" stripe size="small" @row-click="goToAlerts">
              <el-table-column prop="name" label="点位名称">
                <template #default="{ row }">
                  <el-link type="primary" @click.stop="goToAlerts(row)">{{ row.name }}</el-link>
                </template>
              </el-table-column>
              <el-table-column prop="device_code" label="设备编号" />
              <el-table-column prop="consecutive_anomalies" label="连续异常次数" />
              <el-table-column prop="first_anomaly_time" label="首次异常时间" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
          <el-card class="check-card">
            <template #header>
              <div class="check-header">
                <span>喷淋失败检查</span>
                <el-tag v-if="(checkData.failed_sprinklers || []).length > 0" type="warning" size="small">
                  {{ (checkData.failed_sprinklers || []).length }}
                </el-tag>
              </div>
            </template>
            <el-empty v-if="!(checkData.failed_sprinklers || []).length" description="无喷淋失败" />
            <el-table v-else :data="checkData.failed_sprinklers" stripe size="small" @row-click="goToTask">
              <el-table-column prop="task_no" label="任务编号">
                <template #default="{ row }">
                  <el-link type="primary" @click.stop="goToTask(row)">{{ row.task_no }}</el-link>
                </template>
              </el-table-column>
              <el-table-column prop="point_name" label="点位名称" />
              <el-table-column prop="created_at" label="创建时间" />
            </el-table>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card class="check-card">
            <template #header>
              <div class="check-header">
                <span>整改超期检查</span>
                <el-tag v-if="(checkData.overdue_tasks || []).length > 0" type="danger" size="small">
                  {{ (checkData.overdue_tasks || []).length }}
                </el-tag>
              </div>
            </template>
            <el-empty v-if="!(checkData.overdue_tasks || []).length" description="无超期任务" />
            <el-table v-else :data="checkData.overdue_tasks" stripe size="small" @row-click="goToTask">
              <el-table-column prop="task_no" label="任务编号">
                <template #default="{ row }">
                  <el-link type="primary" @click.stop="goToTask(row)">{{ row.task_no }}</el-link>
                </template>
              </el-table-column>
              <el-table-column prop="point_name" label="点位名称" />
              <el-table-column prop="responsible_unit" label="责任单位" />
              <el-table-column prop="overdue_hours" label="超期(小时)">
                <template #default="{ row }">
                  <span class="text-danger">{{ row.overdue_hours }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="创建时间" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <el-card style="margin-top: 20px;">
        <template #header>验收报表下钻</template>
        <el-form :inline="true" :model="drillForm">
          <el-form-item label="点位">
            <el-select v-model="drillForm.point_id" placeholder="选择点位" clearable>
              <el-option v-for="point in points" :key="point.id" :label="point.name" :value="point.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="开始时间">
            <el-date-picker v-model="drillForm.start_time" type="datetime" placeholder="选择开始时间" />
          </el-form-item>
          <el-form-item label="结束时间">
            <el-date-picker v-model="drillForm.end_time" type="datetime" placeholder="选择结束时间" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadDrillData">查询</el-button>
            <el-button @click="exportDrillData">导出明细</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="drillData" stripe v-loading="drillLoading">
          <el-table-column prop="collected_at" label="采集时间" width="180" />
          <el-table-column prop="point_name" label="点位名称" />
          <el-table-column prop="pm25" label="PM2.5">
            <template #default="{ row }">
              <span :class="{ 'text-danger': row.is_anomaly }">{{ row.pm25 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="pm10" label="PM10">
            <template #default="{ row }">
              <span :class="{ 'text-danger': row.is_anomaly }">{{ row.pm10 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="noise" label="噪声">
            <template #default="{ row }">
              <span :class="{ 'text-danger': row.is_anomaly }">{{ row.noise }}</span>
            </template>
          </el-table-column>
          <el-table-column label="异常">
            <template #default="{ row }">
              <el-tag v-if="row.is_anomaly" type="danger">是</el-tag>
              <el-tag v-else type="success">否</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { reportsApi, pointsApi } from '../api'
import { Refresh } from '@element-plus/icons-vue'

const router = useRouter()

const goToPoint = (row) => {
  router.push('/points')
}

const goToAlerts = (row) => {
  router.push('/alerts')
}

const goToTask = (row) => {
  router.push('/tasks')
}

const checkData = reactive({
  offline_points: [],
  continuous_anomalies: [],
  failed_sprinklers: [],
  overdue_tasks: [],
  total_issues: 0
})

const drillLoading = ref(false)
const drillData = ref([])
const points = ref([])

const drillForm = reactive({
  point_id: '',
  start_time: '',
  end_time: ''
})

const loadCheckData = async () => {
  const res = await reportsApi.acceptanceCheck()
  Object.assign(checkData, res.data)
}

const loadDrillData = async () => {
  drillLoading.value = true
  try {
    const res = await reportsApi.byAlert(drillForm)
    drillData.value = res.data.data || []
  } finally {
    drillLoading.value = false
  }
}

const exportDrillData = () => {
  reportsApi.export(drillForm)
}

onMounted(async () => {
  loadCheckData()
  const res = await pointsApi.list({ pageSize: 100 })
  points.value = res.data.data || []
})
</script>

<style scoped>
.acceptance {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.check-card {
  height: 100%;
}

.check-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-danger {
  color: #F56C6C;
  font-weight: bold;
}
</style>
