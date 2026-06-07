<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">商家管理</h2>
      <p class="page-subtitle">审核和管理入驻商家</p>
    </div>

    <el-card class="card-shadow">
      <el-tabs v-model="activeTab" @tab-change="loadMerchants">
        <el-tab-pane label="全部" name="" />
        <el-tab-pane label="待审核" name="pending" />
        <el-tab-pane label="已通过" name="approved" />
        <el-tab-pane label="已拒绝" name="rejected" />
      </el-tabs>

      <el-table :data="merchants" style="width: 100%; margin-top: 20px;">
        <el-table-column prop="company_name" label="商家名称" />
        <el-table-column prop="category" label="类别" />
        <el-table-column prop="name" label="联系人" />
        <el-table-column prop="phone" label="联系电话" />
        <el-table-column prop="address" label="地址" show-overflow-tooltip />
        <el-table-column prop="credit_score" label="信用分" width="100" />
        <el-table-column prop="certification_status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.certification_status)">
              {{ getStatusText(row.certification_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="success" size="small" link v-if="row.certification_status === 'pending'" @click="approve(row.id)">通过</el-button>
            <el-button type="danger" size="small" link v-if="row.certification_status === 'pending'" @click="reject(row.id)">拒绝</el-button>
            <el-button type="primary" size="small" link>查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('')
const merchants = ref([])

function getStatusType(status) {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return texts[status] || status
}

async function loadMerchants() {
  try {
    const params = activeTab.value ? { status: activeTab.value } : {}
    const res = await api.get('/admin/merchants', { params })
    merchants.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function approve(id) {
  try {
    await api.put(`/admin/merchants/${id}/approve`)
    ElMessage.success('已通过认证')
    loadMerchants()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

async function reject(id) {
  try {
    await ElMessageBox.prompt('请输入拒绝原因', '拒绝认证', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入拒绝原因'
    })
    await api.put(`/admin/merchants/${id}/reject`, { reason: '不符合要求' })
    ElMessage.success('已拒绝认证')
    loadMerchants()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadMerchants()
})
</script>
