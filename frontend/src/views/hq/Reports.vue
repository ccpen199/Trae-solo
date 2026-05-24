<template>
  <div class="reports">
    <el-card>
      <template #header>日报表</template>
      <el-table :data="dailySales" border>
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="transaction_count" label="交易笔数" width="120" />
        <el-table-column prop="volume" label="总升数(L)" width="120" />
        <el-table-column prop="original_amount" label="原价总额(元)" width="150">
          <template #default="{row}">¥{{ row.original_amount?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="final_amount" label="实收总额(元)" width="150">
          <template #default="{row}">¥{{ row.final_amount?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="discount_total" label="优惠总额(元)" width="150">
          <template #default="{row}">¥{{ row.discount_total?.toFixed(2) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-card style="margin-top: 20px;">
      <template #header>优惠券分析</template>
      <el-table :data="couponData.coupons || []" border>
        <el-table-column prop="code" label="券码" width="150" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{row}">{{ row.type === 'fixed' ? '满减' : '折扣' }}</template>
        </el-table-column>
        <el-table-column prop="value" label="面值" width="100">
          <template #default="{row}">{{ row.type === 'fixed' ? '¥' + row.value : row.value + '折' }}</template>
        </el-table-column>
        <el-table-column prop="total_issued" label="已发放" width="100" />
        <el-table-column prop="total_used" label="已使用" width="100" />
        <el-table-column prop="available" label="未使用" width="100" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { report } from '../../api'

const dailySales = ref([])
const couponData = ref({})

onMounted(async () => {
  dailySales.value = await report.dailySales({ days: 30 })
  couponData.value = await report.couponAnalysis()
})
</script>
