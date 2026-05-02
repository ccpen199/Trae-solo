<template>
  <div class="page-container">
    <div class="page-header">
      <h2>对账管理</h2>
      <el-button type="primary" @click="handleCreate">创建对账单</el-button>
    </div>

    <el-table :data="statements" v-loading="loading" stripe>
      <el-table-column prop="statement_no" label="对账单号" width="180" />
      <el-table-column prop="customer_name" label="客户" width="120" />
      <el-table-column label="结算周期" width="180">
        <template #default="{ row }">
          {{ row.period_start }} 至 {{ row.period_end }}
        </template>
      </el-table-column>
      <el-table-column prop="total_orders" label="订单数" width="80" />
      <el-table-column prop="total_amount" label="总金额" width="120">
        <template #default="{ row }">
          ¥{{ row.total_amount }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag>{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
          <el-button link type="primary" @click="handleExport(row)">导出</el-button>
          <el-button link type="success" @click="handleSend(row)" v-if="row.status === 'DRAFT'">发送</el-button>
          <el-button link type="success" @click="handleSettle(row)" v-if="row.status === 'CONFIRMED'">结算</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { statementApi } from '@/api'

const loading = ref(false)
const statements = ref([])

onMounted(() => {
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const res = await statementApi.list()
    statements.value = res.data
  } catch (error) {
    ElMessage.error('获取对账单失败')
  } finally {
    loading.value = false
  }
}

function handleCreate() {
  ElMessage.info('创建对账单功能')
}

function handleDetail(row) {
  ElMessage.info('查看对账单：' + row.statement_no)
}

function handleExport(row) {
  ElMessage.info('导出对账单')
}

async function handleSend(row) {
  try {
    await statementApi.send(row.id)
    ElMessage.success('已发送')
    fetchData()
  } catch (error) {
    ElMessage.error('发送失败')
  }
}

async function handleSettle(row) {
  try {
    await statementApi.settle(row.id)
    ElMessage.success('已结算')
    fetchData()
  } catch (error) {
    ElMessage.error('结算失败')
  }
}

function getStatusText(status) {
  const texts = { DRAFT: '草稿', SENT: '已发送', CONFIRMED: '已确认', DISPUTED: '有异议', SETTLED: '已结算' }
  return texts[status] || status
}
</script>
