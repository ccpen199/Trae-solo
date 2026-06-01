<template>
  <div>
    <div class="page-header">
      <span class="page-title">拨付申请管理</span>
      <el-button type="primary" @click="$router.push('/applications/new')">
        <el-icon><Plus /></el-icon>
        新建申请
      </el-button>
    </div>

    <el-card>
      <el-table :data="applications" border stripe>
        <el-table-column prop="id" label="申请编号" width="90" />
        <el-table-column prop="indicator_no" label="项目文号" width="140" />
        <el-table-column prop="project_unit" label="项目单位" />
        <el-table-column prop="applicant" label="申请人" width="100" />
        <el-table-column prop="amount" label="申请金额" width="130" :formatter="formatMoney" />
        <el-table-column prop="current_stage" label="当前阶段" width="120">
          <template #default="{ row }">
            <el-tag :type="getStageType(row.current_stage)" size="small">
              {{ getStageText(row.current_stage) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="$router.push(`/applications/${row.id}`)">详情</el-button>
            <el-button link type="warning" size="small" v-if="row.status === 'correction'" @click="$router.push(`/applications/${row.id}`)">补正</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { applicationsApi } from '../api'

const applications = ref([])

const formatMoney = (row) => {
  return '¥' + Number(row.amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
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

const getStageType = (stage) => {
  const types = {
    business: 'primary',
    finance: 'warning',
    leader: 'danger',
    completed: 'success',
    correction: 'warning'
  }
  return types[stage] || 'info'
}

const getStageText = (stage) => {
  const texts = {
    business: '业务审核',
    finance: '财务审核',
    leader: '领导审批',
    completed: '已完成',
    correction: '补正中'
  }
  return texts[stage] || stage
}

const loadApplications = async () => {
  try {
    applications.value = await applicationsApi.list()
  } catch (error) {
    ElMessage.error('加载申请列表失败')
  }
}

onMounted(() => {
  loadApplications()
})
</script>
