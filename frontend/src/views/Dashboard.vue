<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">数据看板</h1>
      <p class="page-subtitle">科研项目经费管理概览</p>
    </div>

    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-value">{{ stats.total_projects || 0 }}</div>
          <div class="stat-label">项目总数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card success">
          <div class="stat-value">{{ stats.active_projects || 0 }}</div>
          <div class="stat-label">进行中项目</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-value">¥{{ formatMoney(stats.total_budget) }}</div>
          <div class="stat-label">总预算</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card success">
          <div class="stat-value">¥{{ formatMoney(stats.total_receipts) }}</div>
          <div class="stat-label">已到账</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="12">
        <div class="stat-card danger" v-if="stats.overdue_projects > 0">
          <div class="stat-value">{{ stats.overdue_projects }}</div>
          <div class="stat-label">超期项目</div>
        </div>
        <div class="stat-card" v-else>
          <div class="stat-value">0</div>
          <div class="stat-label">超期项目</div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="stat-card warning">
          <div class="stat-value">{{ stats.pending_approvals || 0 }}</div>
          <div class="stat-label">待审批事项</div>
        </div>
      </el-col>
    </el-row>

    <div class="card" v-if="overdueProjects.length > 0">
      <h3 style="margin-bottom: 16px; color: #f56c6c;">
        <el-icon><Warning /></el-icon>
        超期项目预警（限制新支出）
      </h3>
      <el-table :data="overdueProjects" border>
        <el-table-column prop="project_no" label="项目编号" width="120" />
        <el-table-column prop="name" label="项目名称" />
        <el-table-column prop="principal" label="负责人" width="100" />
        <el-table-column prop="end_date" label="截止日期" width="120" />
        <el-table-column prop="department" label="所属部门" width="120" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getStats, getOverdueProjects } from '../api'
import { Warning } from '@element-plus/icons-vue'

const stats = ref({})
const overdueProjects = ref([])

const formatMoney = (value) => {
  if (!value) return '0.00'
  return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const loadData = async () => {
  try {
    const [statsRes, overdueRes] = await Promise.all([
      getStats(),
      getOverdueProjects()
    ])
    stats.value = statsRes.data
    overdueProjects.value = overdueRes.data
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>
