<template>
  <div class="reports">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>统计报表</span>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="汇总统计" name="summary">
          <el-form :inline="true" :model="queryForm" class="query-form">
            <el-form-item label="开始时间">
              <el-date-picker v-model="queryForm.start_time" type="datetime" placeholder="选择开始时间" />
            </el-form-item>
            <el-form-item label="结束时间">
              <el-date-picker v-model="queryForm.end_time" type="datetime" placeholder="选择结束时间" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadSummary">查询</el-button>
              <el-button @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <el-row :gutter="20" class="summary-stats">
            <el-col :span="6">
              <el-card>
                <div class="stat-item">
                  <div class="stat-label">点位数量</div>
                  <div class="stat-value">{{ summaryStats.points }}</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card>
                <div class="stat-item">
                  <div class="stat-label">数据记录</div>
                  <div class="stat-value">{{ summaryStats.records }}</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card>
                <div class="stat-item">
                  <div class="stat-label">预警次数</div>
                  <div class="stat-value">{{ summaryStats.alerts }}</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card>
                <div class="stat-item">
                  <div class="stat-label">整改任务</div>
                  <div class="stat-value">{{ summaryStats.tasks }}</div>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <el-card class="mt-20">
            <template #header>按点位统计</template>
            <el-table :data="pointStats" stripe>
              <el-table-column prop="point_name" label="点位名称" />
              <el-table-column prop="device_code" label="设备编号" />
              <el-table-column prop="responsible_unit" label="责任单位" />
              <el-table-column prop="construction_stage" label="施工阶段" />
              <el-table-column prop="total_records" label="数据条数" />
              <el-table-column prop="anomaly_count" label="异常次数">
                <template #default="{ row }">
                  <span :class="{ 'text-danger': row.anomaly_count > 0 }">{{ row.anomaly_count }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="avg_pm25" label="平均PM2.5" />
              <el-table-column prop="avg_pm10" label="平均PM10" />
              <el-table-column prop="avg_noise" label="平均噪声" />
            </el-table>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="预警统计" name="alerts">
          <el-form :inline="true" :model="alertQueryForm" class="query-form">
            <el-form-item label="预警类型">
              <el-select v-model="alertQueryForm.alert_type" placeholder="全部" clearable>
                <el-option label="PM2.5超标" value="PM2.5超标" />
                <el-option label="PM10超标" value="PM10超标" />
                <el-option label="噪声超标" value="噪声超标" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="alertQueryForm.status" placeholder="全部" clearable>
                <el-option label="待处理" value="pending" />
                <el-option label="处理中" value="processing" />
                <el-option label="已解决" value="resolved" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadAlertStats">查询</el-button>
              <el-button @click="resetAlertQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="alertStats" stripe v-loading="loading">
            <el-table-column prop="point_name" label="点位名称" />
            <el-table-column prop="device_code" label="设备编号" />
            <el-table-column prop="alert_type" label="预警类型">
              <template #default="{ row }">
                <el-tag type="danger">{{ row.alert_type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="parameter" label="参数">
              <template #default="{ row }">{{ paramLabels[row.parameter] }}</template>
            </el-table-column>
            <el-table-column prop="value" label="监测值" />
            <el-table-column prop="threshold" label="阈值" />
            <el-table-column label="状态">
              <template #default="{ row }">
                <el-tag :type="statusTypeMap[row.status]">{{ statusLabelMap[row.status] }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="预警时间" />
          </el-table>

          <el-pagination
            v-model:current-page="alertPagination.page"
            v-model:page-size="alertPagination.pageSize"
            :total="alertPagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadAlertStats"
            @current-change="loadAlertStats"
          />
        </el-tab-pane>

        <el-tab-pane label="数据导出" name="export">
          <el-form :model="exportForm" label-width="100px">
            <el-form-item label="导出类型">
              <el-radio-group v-model="exportForm.type">
                <el-radio label="data">监测数据</el-radio>
                <el-radio label="alerts">预警记录</el-radio>
                <el-radio label="tasks">整改任务</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="开始时间">
              <el-date-picker v-model="exportForm.start_time" type="datetime" placeholder="选择开始时间" />
            </el-form-item>
            <el-form-item label="结束时间">
              <el-date-picker v-model="exportForm.end_time" type="datetime" placeholder="选择结束时间" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleExport">
                <el-icon><Download /></el-icon>
                导出Excel
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { reportsApi } from '../api'
import { Download } from '@element-plus/icons-vue'

const activeTab = ref('summary')
const loading = ref(false)

const paramLabels = {
  pm25: 'PM2.5',
  pm10: 'PM10',
  noise: '噪声'
}

const statusTypeMap = {
  pending: 'warning',
  processing: 'primary',
  resolved: 'success'
}

const statusLabelMap = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决'
}

const queryForm = reactive({
  start_time: '',
  end_time: ''
})

const summaryStats = reactive({
  points: 0,
  records: 0,
  alerts: 0,
  tasks: 0
})

const pointStats = ref([])

const alertQueryForm = reactive({
  alert_type: '',
  status: '',
  start_time: '',
  end_time: ''
})

const alertStats = ref([])
const alertPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const exportForm = reactive({
  type: 'data',
  start_time: '',
  end_time: ''
})

const loadSummary = async () => {
  const res = await reportsApi.summary(queryForm)
  const data = res.data
  
  summaryStats.points = data.point_stats.length
  summaryStats.records = data.point_stats.reduce((sum, p) => sum + (p.total_records || 0), 0)
  summaryStats.alerts = data.alert_stats.reduce((sum, a) => sum + (a.count || 0), 0)
  summaryStats.tasks = data.task_stats.reduce((sum, t) => sum + (t.count || 0), 0)
  
  pointStats.value = data.point_stats
}

const resetQuery = () => {
  queryForm.start_time = ''
  queryForm.end_time = ''
  loadSummary()
}

const loadAlertStats = async () => {
  loading.value = true
  try {
    const res = await reportsApi.byAlert({
      ...alertQueryForm,
      page: alertPagination.page,
      pageSize: alertPagination.pageSize
    })
    alertStats.value = res.data.data
    alertPagination.total = res.data.total
  } finally {
    loading.value = false
  }
}

const resetAlertQuery = () => {
  alertQueryForm.alert_type = ''
  alertQueryForm.status = ''
  alertQueryForm.start_time = ''
  alertQueryForm.end_time = ''
  alertPagination.page = 1
  loadAlertStats()
}

const handleExport = () => {
  reportsApi.export(exportForm)
}

onMounted(() => {
  loadSummary()
  loadAlertStats()
})
</script>

<style scoped>
.reports {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.query-form {
  margin-bottom: 20px;
}

.summary-stats {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
}

.mt-20 {
  margin-top: 20px;
}

.text-danger {
  color: #F56C6C;
  font-weight: bold;
}
</style>
