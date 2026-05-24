<template>
  <div class="shifts">
    <el-card>
      <template #header>班次管理</template>
      <el-table :data="shifts" border>
        <el-table-column prop="shift_name" label="班次" width="120" />
        <el-table-column prop="cashier_name" label="收银员" width="120" />
        <el-table-column prop="start_time" label="开始时间" width="180" />
        <el-table-column prop="end_time" label="结束时间" width="180" />
        <el-table-column prop="opening_cash" label="备用金" width="120">
          <template #default="{row}">¥{{ row.opening_cash.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="closing_cash" label="实际现金" width="120">
          <template #default="{row}">{{ row.closing_cash ? '¥' + row.closing_cash.toFixed(2) : '-' }}</template>
        </el-table-column>
        <el-table-column prop="cash_difference" label="差额" width="120">
          <template #default="{row}">
            <span v-if="row.cash_difference !== null" :class="row.cash_difference >= 0 ? 'profit' : 'loss'">
              {{ row.cash_difference >= 0 ? '+' : '' }}{{ row.cash_difference.toFixed(2) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{row}">
            <el-tag :type="row.status === 'open' ? 'primary' : 'success'">
              {{ row.status === 'open' ? '进行中' : '已关闭' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import db from '../../api'

const shifts = ref([
  { id: 1, shift_name: '早班', cashier_name: '赵', start_time: '2024-01-15 08:00', end_time: '2024-01-15 16:00', opening_cash: 500, closing_cash: 1142.3, cash_difference: 0, status: 'closed' },
  { id: 2, shift_name: '晚班', cashier_name: '钱', start_time: '2024-01-15 16:00', end_time: null, opening_cash: 500, closing_cash: null, cash_difference: null, status: 'open' }
])
</script>

<style scoped>
.profit { color: #67c23a; }
.loss { color: #f56c6c; }
</style>
