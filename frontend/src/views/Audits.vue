<template>
  <div>
    <el-tabs v-model="tab">
      <el-tab-pane label="审计日志" name="logs">
        <div class="page-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2 class="page-title" style="margin:0">操作审计日志</h2>
            <div>
              <el-input v-model="filter.action" placeholder="动作" size="small" style="width:150px" clearable />
              <el-input v-model="filter.username" placeholder="用户" size="small" style="width:130px; margin-left:8px" clearable />
              <el-button type="primary" size="small" style="margin-left:8px" @click="exportXlsx">导出 Excel</el-button>
            </div>
          </div>
          <el-divider />
          <el-table :data="logs" size="small" stripe>
            <el-table-column prop="username" label="用户" width="140" />
            <el-table-column prop="action" label="动作" width="160" />
            <el-table-column prop="target_type" label="目标类型" width="120" />
            <el-table-column prop="detail" label="详情" show-overflow-tooltip />
            <el-table-column prop="ip" label="IP" width="140" />
            <el-table-column prop="created_at" label="时间" width="180" />
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="用户管理" name="users">
        <div class="page-card">
          <h2 class="page-title" style="margin:0 0 12px 0">用户列表</h2>
          <el-table :data="users" size="small" stripe>
            <el-table-column prop="username" label="用户名" width="140" />
            <el-table-column prop="display_name" label="姓名" width="140" />
            <el-table-column prop="role" label="角色" width="140">
              <template #default="{ row }"><el-tag size="small">{{ roleLabel(row.role) }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="department" label="部门" width="140" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status }}</el-tag></template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button link type="warning" @click="toggleUser(row)">{{ row.status === 'active' ? '停用' : '启用' }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="权限定义" name="permissions">
        <div class="page-card">
          <h2 class="page-title" style="margin:0 0 12px 0">角色权限矩阵</h2>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item v-for="r in perms?.roleDefinitions || []" :key="r.role" :label="r.role">
              {{ r.desc }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { AuditAPI } from '../api'

const tab = ref('logs')
const logs = ref([])
const users = ref([])
const perms = ref(null)
const filter = ref({ action: '', username: '' })

async function loadLogs() {
  const res = await AuditAPI.list(filter.value)
  if (res?.code === 0) logs.value = res.data
}
async function loadUsers() {
  const res = await AuditAPI.users()
  if (res?.code === 0) users.value = res.data
}
async function loadPerms() {
  const res = await AuditAPI.permissions()
  if (res?.code === 0) perms.value = res.data
}
onMounted(() => { loadLogs(); loadUsers(); loadPerms() })
watch(filter, loadLogs, { deep: true })

function exportXlsx() {
  const token = localStorage.getItem('token') || ''
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') || ''
  window.open(`${base}/api/audits/export?token=${token}`, '_blank')
}
async function toggleUser(row) {
  const res = await AuditAPI.toggleUser(row.id)
  if (res?.code === 0) { ElMessage.success('状态已更新'); loadUsers() }
}
function roleLabel(r) {
  return { admin: '系统管理员', platform: '平台工程师', ops: '运维工程师', dev: '开发者', owner: '应用负责人', security: '安全管理员', viewer: '访客' }[r] || r
}
</script>
