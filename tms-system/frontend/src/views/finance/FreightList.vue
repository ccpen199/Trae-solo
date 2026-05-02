<template>
  <div class="page-container">
    <div class="page-header">
      <h2>运费结算</h2>
    </div>

    <el-table :data="freights" v-loading="loading" stripe>
      <el-table-column prop="freight_no" label="运费单号" width="180" />
      <el-table-column prop="waybill_no" label="运单号" width="180" />
      <el-table-column label="计费信息" min-width="150">
        <template #default="{ row }">
          {{ row.distance }}公里 / {{ row.weight }}吨
        </template>
      </el-table-column>
      <el-table-column prop="total_freight" label="总运费" width="120">
        <template #default="{ row }">
          <span class="freight-amount">¥{{ row.total_freight }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="calculated_at" label="计算时间" width="160" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
          <el-button link type="success" @click="handleConfirm(row)" v-if="row.status === 'CALCULATED'">确认</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      layout="total, prev, pager, next"
      @change="fetchData"
      style="margin-top: 20px; justify-content: center"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { freightApi } from '@/api'

const loading = ref(false)
const freights = ref([])
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

onMounted(() => {
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const res = await freightApi.list({ page: pagination.page, pageSize: pagination.pageSize })
    freights.value = res.data
    pagination.total = res.total
  } catch (error) {
    ElMessage.error('获取运费列表失败')
  } finally {
    loading.value = false
  }
}

function handleDetail(row) {
  ElMessage.info('查看运费详情：' + row.freight_no)
}

async function handleConfirm(row) {
  try {
    await freightApi.confirm(row.id)
    ElMessage.success('已确认')
    fetchData()
  } catch (error) {
    ElMessage.error('确认失败')
  }
}

function getStatusType(status) {
  const types = { CALCULATED: 'warning', CONFIRMED: 'success', INVOICED: 'primary', PAID: 'success' }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = { CALCULATED: '待确认', CONFIRMED: '已确认', INVOICED: '已开票', PAID: '已支付' }
  return texts[status] || status
}
</script>

<style lang="scss" scoped>
.freight-amount {
  font-weight: 600;
  color: #f56c6c;
}
</style>
