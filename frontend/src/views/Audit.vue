<template>
  <div>
    <el-card shadow="hover">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-weight: bold">审计日志</span>
          <el-button type="primary" @click="handleExport">导出CSV</el-button>
        </div>
      </template>

      <el-form :inline="true" style="margin-bottom: 20px; flex-wrap: wrap; display: flex">
        <el-form-item label="操作类型">
          <el-select v-model="filters.action" clearable placeholder="请选择">
            <el-option label="创建" value="create" />
            <el-option label="更新" value="update" />
            <el-option label="删除" value="delete" />
            <el-option label="抽取" value="extract" />
            <el-option label="重新抽取" value="re-extract" />
            <el-option label="通知" value="notification" />
          </el-select>
        </el-form-item>
        <el-form-item label="实体类型">
          <el-select v-model="filters.entity_type" clearable placeholder="请选择">
            <el-option label="专家" value="expert" />
            <el-option label="项目" value="project" />
            <el-option label="抽取记录" value="extraction" />
            <el-option label="通知" value="notification" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadAuditLogs">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="auditLogs" border>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="action" label="操作" width="90">
          <template #default="{ row }">
            <el-tag size="small">{{ getActionText(row.action) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="entity_type" label="实体类型" width="90">
          <template #default="{ row }">
            {{ getEntityTypeText(row.entity_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="entity_id" label="实体ID" width="70" />
        <el-table-column label="详情" min-width="250">
          <template #default="{ row }">
            <div style="font-size: 13px; line-height: 1.6">
              {{ formatDetails(row.action, row.details) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="80" />
        <el-table-column prop="created_at" label="时间" width="160" />
      </el-table>

      <div style="margin-top: 20px; text-align: right">
        <el-pagination
          :total="total"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="handlePageChange"
          layout="total, prev, pager, next"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const auditLogs = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

const filters = reactive({
  action: '',
  entity_type: ''
})

const getActionText = (action) => {
  const texts = {
    create: '创建',
    update: '更新',
    delete: '删除',
    extract: '抽取',
    're-extract': '重新抽取',
    notification: '通知'
  }
  return texts[action] || action
}

const getEntityTypeText = (type) => {
  const texts = {
    expert: '专家',
    project: '项目',
    extraction: '抽取记录',
    notification: '通知'
  }
  return texts[type] || type || '-'
}

const formatDetails = (action, details) => {
  if (!details) return '-'
  
  const parts = []
  if (details.name) parts.push(`名称: ${details.name}`)
  if (details.type) parts.push(`类型: ${details.type}`)
  if (details.professional_field) parts.push(`专业: ${details.professional_field}`)
  if (details.expert_count) parts.push(`专家数: ${details.expert_count}`)
  if (details.expert_name) parts.push(`专家: ${details.expert_name}`)
  if (details.status) parts.push(`状态: ${details.status === 'accepted' ? '已接受' : details.status === 'rejected' ? '已拒绝' : details.status}`)
  if (details.candidate_count !== undefined) parts.push(`候选: ${details.candidate_count}人`)
  if (details.selected_count !== undefined) parts.push(`选中: ${details.selected_count}人`)
  if (details.seed) parts.push(`种子: ${details.seed.substring(0, 12)}...`)
  
  if (parts.length > 0) {
    return parts.join(' | ')
  }
  
  try {
    return JSON.stringify(details)
  } catch {
    return '-'
  }
}

const loadAuditLogs = async () => {
  try {
    const res = await axios.get('/api/audit', {
      params: {
        ...filters,
        limit: pageSize.value,
        offset: (currentPage.value - 1) * pageSize.value
      }
    })
    auditLogs.value = res.data.data
    total.value = res.data.total
  } catch (err) {
    ElMessage.error('加载审计日志失败')
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  loadAuditLogs()
}

const handleExport = () => {
  window.open('/api/audit/export', '_blank')
}

onMounted(() => {
  loadAuditLogs()
})
</script>
