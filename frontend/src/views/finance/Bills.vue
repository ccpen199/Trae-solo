<template>
  <div class="bills-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>渠道账单</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="渠道">
          <el-select v-model="searchForm.channel" placeholder="全部渠道" clearable>
            <el-option label="微信支付" value="wechat" />
            <el-option label="支付宝" value="alipay" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadBills">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="bills" v-loading="loading" stripe>
        <el-table-column prop="bill_no" label="账单编号" min-width="180">
          <template #default="{ row }">
            <el-text type="primary" size="small">{{ row.bill_no }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="channel" label="渠道" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getChannelLabel(row.channel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="bill_date" label="账单日期" width="120" />
        <el-table-column prop="file_name" label="文件名" min-width="200" />
        <el-table-column prop="total_count" label="交易笔数" width="100" />
        <el-table-column prop="total_amount" label="交易金额" width="120">
          <template #default="{ row }">¥{{ row.total_amount }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadBills"
        @current-change="loadBills"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/utils/api'

const loading = ref(false)

const searchForm = reactive({
  channel: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const bills = ref([])

const channelMap = {
  wechat: '微信支付',
  alipay: '支付宝'
}

const statusMap = {
  downloaded: { label: '已下载', type: 'success' },
  pending: { label: '待下载', type: 'warning' },
  failed: { label: '下载失败', type: 'danger' }
}

function getChannelLabel(channel) {
  return channelMap[channel] || channel
}

function getStatusLabel(status) {
  return statusMap[status]?.label || status
}

function getStatusType(status) {
  return statusMap[status]?.type || 'info'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

async function loadBills() {
  loading.value = true
  try {
    const params = {
      skip: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize
    }
    if (searchForm.channel) {
      params.channel = searchForm.channel
    }
    
    const response = await api.get('/v1/finance/bills', { params })
    if (response.success) {
      pagination.total = response.data.total
      bills.value = response.data.bills
    }
  } catch (error) {
    console.error('Load bills error:', error)
  } finally {
    loading.value = false
  }
}

function resetSearch() {
  searchForm.channel = ''
  pagination.page = 1
  loadBills()
}

onMounted(() => {
  loadBills()
})
</script>

<style scoped>
.bills-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}
</style>
