<template>
  <div>
    <h2 style="margin-bottom: 20px">安全总览看板</h2>
    
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="4">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 36px; font-weight: bold; color: #409eff">{{ summary.totalCranes }}</div>
            <div style="color: #909399; margin-top: 10px">设备总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" @click="$router.push('/cranes?status=normal')" style="cursor: pointer">
          <div style="text-align: center">
            <div style="font-size: 36px; font-weight: bold; color: #67c23a">{{ summary.normalCranes }}</div>
            <div style="color: #909399; margin-top: 10px">正常运行</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" @click="$router.push('/cranes?status=warning')" style="cursor: pointer">
          <div style="text-align: center">
            <div style="font-size: 36px; font-weight: bold; color: #e6a23c">{{ summary.warningCranes }}</div>
            <div style="color: #909399; margin-top: 10px">异常预警</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" @click="$router.push('/cranes?status=offline')" style="cursor: pointer">
          <div style="text-align: center">
            <div style="font-size: 36px; font-weight: bold; color: #f56c6c">{{ summary.offlineCranes }}</div>
            <div style="color: #909399; margin-top: 10px">离线设备</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" @click="$router.push('/alerts?status=pending')" style="cursor: pointer">
          <div style="text-align: center">
            <div style="font-size: 36px; font-weight: bold; color: #f56c6c">{{ summary.pendingAlerts }}</div>
            <div style="color: #909399; margin-top: 10px">待处理预警</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" @click="$router.push('/maintenance?status=overdue')" style="cursor: pointer">
          <div style="text-align: center">
            <div style="font-size: 36px; font-weight: bold; color: #f56c6c">{{ summary.overdueMaintenance }}</div>
            <div style="color: #909399; margin-top: 10px">逾期维保</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>实时监测数据</span>
              <el-button type="primary" size="small" @click="$router.push('/monitor')">查看详情</el-button>
            </div>
          </template>
          <el-table :data="monitorData" size="small">
            <el-table-column prop="device_code" label="设备编号" width="100" />
            <el-table-column prop="weight" label="重量(t)" width="80">
              <template #default="{ row }">
                <el-tag :type="row.weight_status === 'normal' ? '' : 'danger'" size="small">{{ row.weight?.toFixed(2) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="range" label="幅度(m)" width="80">
              <template #default="{ row }">
                <el-tag :type="row.range_status === 'normal' ? '' : 'warning'" size="small">{{ row.range?.toFixed(1) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="height" label="高度(m)" width="80">
              <template #default="{ row }">
                <el-tag size="small">{{ row.height?.toFixed(1) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="wind_speed" label="风速(m/s)" width="90">
              <template #default="{ row }">
                <el-tag :type="row.wind_speed_status === 'normal' ? '' : 'danger'" size="small">{{ row.wind_speed?.toFixed(1) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="collision_risk" label="碰撞风险" width="90">
              <template #default="{ row }">
                <el-tag v-if="row.collision_risk" type="danger" size="small">有风险</el-tag>
                <el-tag v-else type="success" size="small">正常</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>最新预警</span>
              <el-button type="primary" size="small" @click="$router.push('/alerts')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentAlerts" size="small">
            <el-table-column prop="device_code" label="设备编号" width="100" />
            <el-table-column prop="alert_type" label="预警类型" width="100">
              <template #default="{ row }">
                {{ alertTypeMap[row.alert_type] || row.alert_type }}
              </template>
            </el-table-column>
            <el-table-column prop="alert_level" label="级别" width="80">
              <template #default="{ row }">
                <el-tag :type="row.alert_level === 'danger' ? 'danger' : 'warning'" size="small">
                  {{ row.alert_level === 'danger' ? '危险' : '警告' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="预警信息" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'pending' ? 'warning' : 'success'" size="small">
                  {{ row.status === 'pending' ? '待处理' : '已处理' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getDashboardSummary, getLatestMonitorData, getAlerts } from '../api'

const summary = ref({})
const monitorData = ref([])
const recentAlerts = ref([])

const alertTypeMap = {
  overload: '超载',
  strong_wind: '强风',
  limit_error: '限位异常',
  offline: '设备离线',
  expired_cert: '证件过期',
  maintenance_overdue: '维保逾期'
}

const loadData = async () => {
  try {
    const [summaryRes, monitorRes, alertsRes] = await Promise.all([
      getDashboardSummary(),
      getLatestMonitorData(),
      getAlerts({ status: 'pending' })
    ])
    summary.value = summaryRes.data
    monitorData.value = monitorRes.data
    recentAlerts.value = alertsRes.data.slice(0, 5)
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

onMounted(loadData)
</script>
