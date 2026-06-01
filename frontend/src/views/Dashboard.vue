<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">系统概览</h1>
    </div>

    <el-row :gutter="20" style="margin-bottom: 24px;">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value" style="color: #409eff;">{{ stats.totalEmployees }}</div>
            <div class="stat-label">员工总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value" style="color: #67c23a;">{{ stats.totalPositions }}</div>
            <div class="stat-label">岗位数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value" style="color: #e6a23c;">{{ stats.trainingCourses }}</div>
            <div class="stat-label">培训课程</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value" style="color: #f56c6c;">{{ stats.totalWarnings }}</div>
            <div class="stat-label">待处理预警</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600;">预警信息</span>
              <el-tag type="danger" v-if="stats.totalWarnings > 0">{{ stats.totalWarnings }} 项</el-tag>
            </div>
          </template>
          <el-alert
            v-if="auditSummary.expiredCerts && auditSummary.expiredCerts.length > 0"
            :title="`存在 ${auditSummary.expiredCerts.length} 个过期证书`"
            type="error"
            :closable="false"
            style="margin-bottom: 12px;"
          />
          <el-alert
            v-if="auditSummary.expiringCerts && auditSummary.expiringCerts.length > 0"
            :title="`${auditSummary.expiringCerts.length} 个证书即将过期（30天内）`"
            type="warning"
            :closable="false"
            style="margin-bottom: 12px;"
          />
          <el-alert
            v-if="auditSummary.failedTraining && auditSummary.failedTraining.length > 0"
            :title="`${auditSummary.failedTraining.length} 个培训未通过`"
            type="warning"
            :closable="false"
            style="margin-bottom: 12px;"
          />
          <el-alert
            v-if="auditSummary.expiredAuth && auditSummary.expiredAuth.length > 0"
            :title="`${auditSummary.expiredAuth.length} 个临时授权已过期`"
            type="error"
            :closable="false"
          />
          <el-empty v-if="stats.totalWarnings === 0" description="暂无预警信息" :image-size="100" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span style="font-weight: 600;">快捷操作</span>
          </template>
          <el-space wrap>
            <el-button type="primary" @click="$router.push('/employees')">
              <el-icon><User /></el-icon>
              员工管理
            </el-button>
            <el-button type="success" @click="$router.push('/training')">
              <el-icon><Reading /></el-icon>
              培训管理
            </el-button>
            <el-button type="warning" @click="$router.push('/schedules')">
              <el-icon><Calendar /></el-icon>
              排班校验
            </el-button>
            <el-button type="danger" @click="$router.push('/audit')">
              <el-icon><CircleCheck /></el-icon>
              验收检查
            </el-button>
            <el-button @click="$router.push('/positions')">
              <el-icon><Briefcase /></el-icon>
              岗位配置
            </el-button>
            <el-button @click="$router.push('/authorizations')">
              <el-icon><Key /></el-icon>
              授权管理
            </el-button>
          </el-space>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { employeesAPI, positionsAPI, trainingAPI, authAPI } from '@/api'

const stats = ref({
  totalEmployees: 0,
  totalPositions: 0,
  trainingCourses: 0,
  totalWarnings: 0
})

const auditSummary = ref({})

const loadData = async () => {
  try {
    const [empRes, posRes, courseRes, auditRes] = await Promise.all([
      employeesAPI.list(),
      positionsAPI.list(),
      trainingAPI.courses(),
      authAPI.auditSummary()
    ])
    
    stats.value.totalEmployees = empRes.data?.length || 0
    stats.value.totalPositions = posRes.data?.length || 0
    stats.value.trainingCourses = courseRes.data?.length || 0
    stats.value.totalWarnings = auditRes.data?.totalWarnings || 0
    auditSummary.value = auditRes.data || {}
  } catch (err) {
    console.error('加载数据失败', err)
  }
}

onMounted(() => {
  loadData()
})
</script>
