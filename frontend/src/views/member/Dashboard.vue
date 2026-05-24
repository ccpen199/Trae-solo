<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6"><el-card shadow="hover"><div class="stat"><div class="label">账户余额</div><div class="value">¥{{ userInfo.balance?.toFixed(2) || '0.00' }}</div></div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="stat"><div class="label">累计积分</div><div class="value">{{ userInfo.points || 0 }}</div></div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="stat"><div class="label">可用优惠券</div><div class="value">{{ coupons.length }}</div></div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="stat"><div class="label">绑定车辆</div><div class="value">{{ vehicles.length }}</div></div></el-card></el-col>
    </el-row>
    <el-card style="margin-top: 20px;">
      <template #header>最近加油记录</template>
      <el-table :data="transactions.slice(0,5)" border>
        <el-table-column prop="end_time" label="时间" width="180" />
        <el-table-column prop="station_name" label="油站" />
        <el-table-column prop="fuel_type_name" label="油品" width="100" />
        <el-table-column prop="volume" label="升数(L)" width="100" />
        <el-table-column prop="final_amount" label="金额(元)" width="120">
          <template #default="{row}">¥{{ row.final_amount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default><el-tag type="success">已完成</el-tag></template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { member as memberApi } from '../../api'
import { useUserStore } from '../../utils/userStore'

const { userInfo, refreshUser } = useUserStore()
const vehicles = ref([])
const coupons = ref([])
const transactions = ref([])

const loadData = async () => {
  try {
    vehicles.value = await memberApi.getVehicles()
    coupons.value = await memberApi.getCoupons('available')
    const res = await memberApi.getTransactions({ page: 1, pageSize: 10 })
    transactions.value = res.list || []
  } catch (e) {}
}

const handleUserUpdate = () => refreshUser()
onMounted(() => {
  refreshUser()
  loadData()
  window.addEventListener('user-updated', handleUserUpdate)
})
onUnmounted(() => window.removeEventListener('user-updated', handleUserUpdate))
</script>

<style scoped>
.stat { text-align: center; padding: 20px 0; }
.stat .label { color: #666; margin-bottom: 10px; }
.stat .value { font-size: 32px; font-weight: bold; color: #409eff; }
</style>
