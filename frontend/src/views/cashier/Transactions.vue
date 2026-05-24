<template>
  <div class="transactions">
    <el-card>
      <template #header>交易记录</template>
      <el-table :data="list" border>
        <el-table-column prop="id" label="订单号" width="100" />
        <el-table-column prop="end_time" label="时间" width="180" />
        <el-table-column prop="nozzle_number" label="油枪" width="80" />
        <el-table-column prop="fuel_type_name" label="油品" width="100" />
        <el-table-column prop="volume" label="升数" width="100" />
        <el-table-column prop="member_phone" label="会员" width="130" />
        <el-table-column prop="final_amount" label="金额" width="120">
          <template #default="{row}">¥{{ row.final_amount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="payment_method" label="支付方式" width="100">
          <template #default="{row}">{{ payMap[row.payment_method] }}</template>
        </el-table-column>
      </el-table>
      <el-pagination style="margin-top:20px;text-align:right;"
        v-model:current-page="page" v-model:page-size="pageSize"
        :total="total" @current-change="load" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { transaction } from '../../api'

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const payMap = { cash: '现金', wechat: '微信', alipay: '支付宝', balance: '余额' }

const load = async () => {
  const res = await transaction.list({ page: page.value, pageSize: pageSize.value })
  list.value = res.list
  total.value = res.total
}
onMounted(load)
</script>
