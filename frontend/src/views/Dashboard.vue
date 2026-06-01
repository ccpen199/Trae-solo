<template>
  <div>
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value" style="color: #409eff">{{ formatMoney(totalBudget) }}</div>
            <div class="stat-label">年度总预算</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value" style="color: #67c23a">{{ formatMoney(totalUsed) }}</div>
            <div class="stat-label">已拨付金额</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value" style="color: #e6a23c">{{ pendingCount }}</div>
            <div class="stat-label">待审核申请</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value" style="color: #909399">{{ projectCount }}</div>
            <div class="stat-label">资金项目数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span style="font-weight: 600">资金项目概览</span>
          </template>
          <el-table :data="projects" size="small">
            <el-table-column prop="project_unit" label="项目单位" />
            <el-table-column prop="purpose" label="用途" />
            <el-table-column prop="annual_quota" label="年度额度" :formatter="formatMoney" />
            <el-table-column prop="available_balance" label="可用余额" :formatter="formatMoney" />
            <el-table-column label="使用率">
              <template #default="{ row }">
                <el-progress :percentage="Math.round((row.annual_quota - row.available_balance) / row.annual_quota * 100)" :stroke-width="8" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span style="font-weight: 600">最近申请</span>
          </template>
          <el-table :data="recentApplications" size="small">
            <el-table-column prop="applicant" label="申请人" width="100" />
            <el-table-column prop="amount" label="申请金额" :formatter="formatMoney" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="申请时间" width="160" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { projectsApi, applicationsApi, paymentApi } from '../api'

const projects = ref([])
const recentApplications = ref([])
const totalBudget = ref(0)
const totalUsed = ref(0)
const pendingCount = ref(0)
const projectCount = ref(0)

const formatMoney = (row, column, value) => {
  const num = value || row
  return '¥' + Number(num).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const getStatusType = (status) => {
  const types = {
    pending: 'info',
    correction: 'warning',
    approved: 'success',
    rejected: 'danger',
    paid: 'success'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待审核',
    correction: '待补正',
    approved: '已通过',
    rejected: '已拒绝',
    paid: '已支付'
  }
  return texts[status] || status
}

const loadData = async () => {
  try {
    const [projectsData, appsData] = await Promise.all([
      projectsApi.list(),
      applicationsApi.list()
    ])
    projects.value = projectsData
    recentApplications.value = appsData.slice(0, 5)
    
    totalBudget.value = projectsData.reduce((sum, p) => sum + parseFloat(p.annual_quota), 0)
    totalUsed.value = projectsData.reduce((sum, p) => sum + (parseFloat(p.annual_quota) - parseFloat(p.available_balance)), 0)
    pendingCount.value = appsData.filter(a => a.status === 'pending').length
    projectCount.value = projectsData.length
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

onMounted(() => {
  loadData()
})
</script>
