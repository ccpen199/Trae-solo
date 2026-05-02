<template>
  <div class="admin-statistics">
    <el-card>
      <template #header>
        <span>系统统计</span>
      </template>

      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic title="用户总数" :value="statistics.user_count || 0">
            <template #suffix>
              人
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="活动总数" :value="statistics.activity_count || 0">
            <template #suffix>
              个
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="考勤记录" :value="statistics.attendance_count || 0">
            <template #suffix>
              条
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic
            title="待处理异常"
            :value="statistics.pending_anomaly_count || 0"
            :value-style="{ color: '#F56C6C' }"
          >
            <template #suffix>
              条
            </template>
          </el-statistic>
        </el-col>
      </el-row>

      <el-divider />

      <el-row :gutter="20">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>总服务时长</span>
            </template>
            <el-statistic :value="statistics.total_service_hours?.toFixed(1) || 0">
              <template #suffix>
                小时
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>服务热度</span>
            </template>
            <el-text type="info">服务热度曲线数据可通过 /api/service-heat 接口获取</el-text>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>快捷入口</span>
      </template>
      <el-row :gutter="10">
        <el-col :span="4">
          <el-button type="primary" style="width: 100%" @click="$router.push('/dashboard/admin/users')">
            用户管理
          </el-button>
        </el-col>
        <el-col :span="4">
          <el-button type="success" style="width: 100%" @click="$router.push('/dashboard/admin/anomalies')">
            异常管理
          </el-button>
        </el-col>
        <el-col :span="4">
          <el-button type="warning" style="width: 100%" @click="$router.push('/dashboard/admin/audit-logs')">
            审计日志
          </el-button>
        </el-col>
        <el-col :span="4">
          <el-button type="info" style="width: 100%" @click="$router.push('/dashboard/admin/skills')">
            技能管理
          </el-button>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { apiClient } from '@/api'

const statistics = reactive({
  user_count: 0,
  activity_count: 0,
  attendance_count: 0,
  pending_anomaly_count: 0,
  total_service_hours: 0,
})

const fetchStatistics = async () => {
  try {
    const response = await apiClient.get('/admin/statistics')
    Object.assign(statistics, response.data)
  } catch (error) {
    console.error('Failed to fetch statistics:', error)
  }
}

onMounted(() => {
  fetchStatistics()
})
</script>

<style scoped>
.admin-statistics {
  padding: 0;
}
</style>
