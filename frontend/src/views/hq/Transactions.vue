<template>
  <div class="transactions">
    <el-card>
      <template #header>交易流水</template>
      <el-form inline @submit.prevent="load" style="margin-bottom: 20px;">
        <el-form-item label="站点">
          <el-select v-model="filters.station_id" placeholder="全部" clearable>
            <el-option v-for="s in stations" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="filters.start_date" type="date" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="filters.end_date" type="date" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit">查询</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="list" border>
        <el-table-column prop="id" label="订单号" width="80" />
        <el-table-column prop="station_name" label="油站" width="140" />
        <el-table-column prop="end_time" label="时间" width="180" />
        <el-table-column prop="fuel_type_name" label="油品" width="100" />
        <el-table-column prop="volume" label="升数" width="100" />
        <el-table-column prop="original_amount" label="原价" width="100">
          <template #default="{row}">¥{{ row.original_amount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="final_amount" label="实付" width="100">
          <template #default="{row}">¥{{ row.final_amount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="payment_method" label="支付" width="100">
          <template #default="{row}">{{ payMap[row.payment_method] }}</template>
        </el-table-column>
        <el-table-column prop="member_phone" label="会员" width="130" />
        <el-table-column prop="cashier_name" label="收银员" width="120" />
      </el-table>
      <el-pagination style="margin-top:20px;text-align:right;"
        v-model:current-page="page" v-model:page-size="pageSize"
        :total="total" @current-change="load" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { transaction, station } from '../../api'

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const stations = ref([])
const filters = ref({ station_id: null, start_date: null, end_date: null })
const payMap = { cash: '现金', wechat: '微信', alipay: '支付宝', balance: '余额' }

const load = async () => {
  const res = await transaction.list({ ...filters.value, page: page.value, pageSize: pageSize.value })
  list.value = res.list
  total.value = res.total
}
onMounted(async () => {
  stations.value = await station.list()
  load()
})
</script>
