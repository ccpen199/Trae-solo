<template>
  <div class="profit-sharings-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>分润明细</span>
        </div>
      </template>

      <el-table :data="profitSharings" v-loading="loading" stripe>
        <el-table-column prop="sharing_no" label="分润单号" min-width="200">
          <template #default="{ row }">
            <el-text type="primary" size="small">{{ row.sharing_no }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="order_no" label="订单号" min-width="200" />
        <el-table-column prop="total_amount" label="订单金额" width="120">
          <template #default="{ row }">¥{{ row.total_amount }}</template>
        </el-table-column>
        <el-table-column prop="merchant_amount" label="商户得款" width="120">
          <template #default="{ row }">
            <span class="highlight">¥{{ row.merchant_amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="platform_fee" label="平台手续费" width="120">
          <template #default="{ row }">¥{{ row.platform_fee }}</template>
        </el-table-column>
        <el-table-column prop="channel_fee" label="渠道手续费" width="120">
          <template #default="{ row }">¥{{ row.channel_fee }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'completed' ? 'success' : 'warning'" size="small">
              {{ row.status === 'completed' ? '已完成' : '处理中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="分润时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadProfitSharings"
        @current-change="loadProfitSharings"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/utils/api'

const loading = ref(false)

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const profitSharings = ref([])

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

async function loadProfitSharings() {
  loading.value = true
  try {
    const params = {
      skip: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize
    }

    const response = await api.get('/v1/merchant/profit-sharings', { params })
    if (response.success) {
      pagination.total = response.data.total
      profitSharings.value = response.data.profit_sharings
    }
  } catch (error) {
    console.error('Load profit sharings error:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProfitSharings()
})
</script>

<style scoped>
.profit-sharings-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.highlight {
  color: #67c23a;
  font-weight: bold;
}
</style>
