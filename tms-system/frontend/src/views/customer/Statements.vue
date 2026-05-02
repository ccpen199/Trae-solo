<template>
  <div class="page-container">
    <div class="page-header">
      <h2>我的对账单</h2>
    </div>

    <el-table :data="statements" v-loading="loading" stripe>
      <el-table-column prop="statement_no" label="对账单号" width="180" />
      <el-table-column prop="period" label="结算周期" width="180">
        <template #default="{ row }">
          {{ row.period_start }} 至 {{ row.period_end }}
        </template>
      </el-table-column>
      <el-table-column prop="total_orders" label="订单数" width="100" />
      <el-table-column prop="total_amount" label="总金额" width="120">
        <template #default="{ row }">
          ¥{{ row.total_amount }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="due_date" label="到期日" width="120" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleDetail(row)">查看</el-button>
          <el-button link type="success" @click="handleConfirm(row)" v-if="row.status === 'SENT'">确认</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { customerApi } from '@/api'

const loading = ref(false)
const statements = ref([])

onMounted(() => {
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const res = await customerApi.statements()
    statements.value = res.data
  } catch (error) {
    ElMessage.error('获取对账单失败')
  } finally {
    loading.value = false
  }
}

function handleDetail(row) {
  ElMessage.info('查看对账单：' + row.statement_no)
}

async function handleConfirm(row) {
  try {
    await ElMessageBox.confirm('确认对账单无误？', '提示')
    await customerApi.confirmStatement(row.id)
    ElMessage.success('已确认')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('确认失败')
  }
}

function getStatusType(status) {
  const types = { DRAFT: 'info', SENT: 'warning', CONFIRMED: 'success', DISPUTED: 'danger', SETTLED: 'success' }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = { DRAFT: '草稿', SENT: '已发送', CONFIRMED: '已确认', DISPUTED: '有异议', SETTLED: '已结算' }
  return texts[status] || status
}
</script>
