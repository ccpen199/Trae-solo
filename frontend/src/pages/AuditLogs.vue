<template>
  <div>
    <el-card style="margin-bottom: 20px">
      <el-form :inline="true" :model="filters" size="small">
        <el-form-item label="操作类型">
          <el-select v-model="filters.action" clearable style="width: 140px">
            <el-option label="创建" value="create" />
            <el-option label="更新" value="update" />
            <el-option label="删除" value="delete" />
            <el-option label="审批" value="approve" />
            <el-option label="执行" value="execute" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源类型">
          <el-select v-model="filters.resource_type" clearable style="width: 140px">
            <el-option label="应用" value="application" />
            <el-option label="环境" value="environment" />
            <el-option label="密钥" value="secret" />
            <el-option label="变更单" value="change_order" />
            <el-option label="执行任务" value="execution_task" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="loadData">查询</el-button>
          <el-button size="small" @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="audit_id" label="审计ID" width="180" />
        <el-table-column prop="user_name" label="操作人" width="100" />
        <el-table-column prop="action" label="操作" width="80">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)" size="small">{{ getActionText(row.action) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="resource_type" label="资源类型" width="100">
          <template #default="{ row }">
            {{ getResourceText(row.resource_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="resource_id" label="资源ID" width="100" />
        <el-table-column prop="ip_address" label="IP地址" width="130" />
        <el-table-column prop="created_at" label="操作时间" width="180" />
        <el-table-column label="操作详情" width="100">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="showDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.page_size"
        :total="pagination.total"
        layout="total, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end"
        @current-change="loadData"
      />
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="操作详情" width="700px">
      <el-descriptions :column="1" border v-if="currentLog">
        <el-descriptions-item label="操作人">{{ currentLog.user_name }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ currentLog.created_at }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentLog.ip_address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="变更前">
          <pre style="max-height: 200px; overflow: auto; background: #f5f7fa; padding: 10px; border-radius: 4px; margin: 0">{{ currentLog.old_value || '-' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="变更后">
          <pre style="max-height: 200px; overflow: auto; background: #f5f7fa; padding: 10px; border-radius: 4px; margin: 0">{{ currentLog.new_value || '-' }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { auditApi } from '../api'

const loading = ref(false)
const list = ref([])
const detailDialogVisible = ref(false)
const currentLog = ref(null)

const filters = reactive({ action: '', resource_type: '' })
const pagination = reactive({ page: 1, page_size: 20, total: 0 })

async function loadData() {
  loading.value = true
  try {
    const res = await auditApi.list({ ...filters, page: pagination.page, page_size: pagination.page_size })
    list.value = res.data
    pagination.total = res.total
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.action = ''
  filters.resource_type = ''
  pagination.page = 1
  loadData()
}

function showDetail(row) {
  currentLog.value = row
  detailDialogVisible.value = true
}

function getActionType(action) {
  const map = { create: 'success', update: 'warning', delete: 'danger', approve: 'info', execute: 'primary' }
  return map[action] || 'info'
}

function getActionText(action) {
  const map = { create: '创建', update: '更新', delete: '删除', approve: '审批', execute: '执行', rotate: '轮换', assign: '分配', close: '关闭' }
  return map[action] || action
}

function getResourceText(type) {
  const map = { application: '应用', environment: '环境', secret: '密钥', change_order: '变更单', execution_task: '执行任务', alert: '告警' }
  return map[type] || type
}

onMounted(() => loadData())
</script>
