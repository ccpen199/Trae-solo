<template>
  <div class="ledger-page">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <span class="page-title">账簿管理</span>
          <div>
            <el-date-picker
              v-model="queryForm.period"
              type="month"
              placeholder="选择月份"
              value-format="YYYY-MM"
              style="width: 150px; margin-right: 10px;"
            />
            <el-button type="primary" @click="loadLedgers">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="ledgers" v-loading="loading" border style="width: 100%;">
        <el-table-column prop="code" label="科目代码" width="120" />
        <el-table-column prop="name" label="科目名称" min-width="200" />
        <el-table-column prop="type" label="科目类型" width="100">
          <template #default="{ row }">
            {{ getTypeLabel(row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="total_debit" label="借方发生额" width="150" align="right">
          <template #default="{ row }">
            {{ row.total_debit?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="total_credit" label="贷方发生额" width="150" align="right">
          <template #default="{ row }">
            {{ row.total_credit?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column label="余额" width="150" align="right">
          <template #default="{ row }">
            <span :class="(row.total_debit || 0) >= (row.total_credit || 0) ? 'text-debit' : 'text-credit'">
              {{ Math.abs((row.total_debit || 0) - (row.total_credit || 0)).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import dayjs from 'dayjs'
import api from '../api'

const loading = ref(false)
const ledgers = ref([])

const queryForm = reactive({
  period: dayjs().format('YYYY-MM')
})

function getTypeLabel(type) {
  const labels = {
    asset: '资产类',
    liability: '负债类',
    equity: '权益类',
    revenue: '收入类',
    expense: '费用类'
  }
  return labels[type] || type
}

async function loadLedgers() {
  loading.value = true
  try {
    const result = await api.getLedgers({ period: queryForm.period })
    if (result.success) {
      ledgers.value = result.data
    }
  } catch (error) {
    console.error('加载账簿失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLedgers()
})
</script>

<style scoped>
.text-debit {
  color: #409eff;
}

.text-credit {
  color: #67c23a;
}
</style>
