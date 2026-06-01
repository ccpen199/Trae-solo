<template>
  <div>
    <el-card style="margin-bottom: 20px">
      <el-form :inline="true" :model="filters" size="small">
        <el-form-item label="类型">
          <el-select v-model="filters.secret_type" clearable style="width: 160px">
            <el-option label="客户端密钥" value="client_secret" />
            <el-option label="API密钥" value="api_key" />
            <el-option label="证书" value="certificate" />
            <el-option label="私钥" value="private_key" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable style="width: 120px">
            <el-option label="活跃" value="active" />
            <el-option label="停用" value="inactive" />
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
        <el-table-column prop="app_name" label="应用" width="120" />
        <el-table-column prop="env_name" label="环境" width="100" />
        <el-table-column prop="secret_type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ getTypeText(row.secret_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="secret_key" label="密钥名称" width="150" />
        <el-table-column prop="secret_value" label="密钥值" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">{{ row.status === 'active' ? '活跃' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="expires_at" label="过期时间" width="180">
          <template #default="{ row }">
            <span :style="{ color: isExpiring(row.expires_at) ? '#f56c6c' : '' }">
              {{ row.expires_at || '永不过期' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="creator_name" label="创建人" width="100" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="warning" size="small" link @click="rotate(row)">轮换</el-button>
            <el-button type="success" size="small" link>编辑</el-button>
            <el-button type="danger" size="small" link @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { secretApi } from '../api'

const loading = ref(false)
const list = ref([])
const filters = reactive({ secret_type: '', status: '' })

async function loadData() {
  loading.value = true
  try {
    const res = await secretApi.list(filters)
    list.value = res.data
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.secret_type = ''
  filters.status = ''
  loadData()
}

async function rotate(row) {
  try {
    await ElMessageBox.confirm(`确认轮换密钥 ${row.secret_key}？`, '提示', { type: 'warning' })
    await secretApi.rotate(row.id)
    ElMessage.success('密钥已轮换')
    loadData()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

async function remove(row) {
  try {
    await ElMessageBox.confirm(`确认删除密钥 ${row.secret_key}？`, '提示', { type: 'warning' })
    await secretApi.delete(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

function getTypeText(type) {
  const map = { client_secret: '客户端密钥', api_key: 'API密钥', certificate: '证书', private_key: '私钥' }
  return map[type] || type
}

function isExpiring(date) {
  if (!date) return false
  return new Date(date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
}

onMounted(() => loadData())
</script>
