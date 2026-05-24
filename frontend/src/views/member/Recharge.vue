<template>
  <div class="recharge">
    <el-card>
      <template #header>储值中心</template>
      <el-row :gutter="20">
        <el-col :span="6" v-for="p in packages" :key="p.id">
          <el-card class="package" shadow="hover" :class="{ active: selectedPackage === p.id }" @click="selectedPackage = p.id">
            <div class="amount">¥{{ p.amount }}</div>
            <div class="bonus" v-if="p.bonus_amount">到账 ¥{{ p.amount + p.bonus_amount }}</div>
            <div class="bonus" v-else>赠 {{ p.bonus_points }} 积分</div>
            <div class="name">{{ p.name }}</div>
          </el-card>
        </el-col>
      </el-row>
      <el-divider />
      <el-form label-width="100px" style="max-width: 400px;">
        <el-form-item label="当前余额">
          <el-tag type="success" size="large">¥{{ userInfo.balance?.toFixed(2) || '0.00' }}</el-tag>
        </el-form-item>
        <el-form-item label="充值方式">
          <el-radio-group v-model="paymentMethod">
            <el-radio value="wechat">微信支付</el-radio>
            <el-radio value="alipay">支付宝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" @click="recharge" :disabled="!selectedPackage">
            立即充值
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card style="margin-top: 20px;">
      <template #header>储值记录</template>
      <el-table :data="history" border>
        <el-table-column prop="created_at" label="时间" width="180" />
        <el-table-column prop="package_name" label="套餐" />
        <el-table-column prop="amount" label="充值金额(元)" width="120">
          <template #default="{row}">¥{{ row.amount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="bonus_amount" label="赠送金额(元)" width="120">
          <template #default="{row}">¥{{ row.bonus_amount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="bonus_points" label="赠送积分" width="100" />
        <el-table-column label="到账余额" width="150">
          <template #default="{row}">¥{{ row.balance_after.toFixed(2) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { member as memberApi } from '../../api'
import { useUserStore } from '../../utils/userStore'

const { userInfo, updateUser } = useUserStore()
const packages = ref([
  { id: 1, name: '充1000送50', amount: 1000, bonus_amount: 50, bonus_points: 100 },
  { id: 2, name: '充2000送150', amount: 2000, bonus_amount: 150, bonus_points: 250 },
  { id: 3, name: '充5000送400', amount: 5000, bonus_amount: 400, bonus_points: 600 },
  { id: 4, name: '充10000送1000', amount: 10000, bonus_amount: 1000, bonus_points: 1500 }
])
const selectedPackage = ref(null)
const paymentMethod = ref('wechat')
const history = ref([])

const loadHistory = async () => {
  history.value = await memberApi.getStoredValueHistory()
}
onMounted(() => {
  loadHistory()
})

const recharge = async () => {
  try {
    const pkg = packages.value.find(p => p.id === selectedPackage.value)
    const result = await memberApi.storedValue({ package_id: selectedPackage.value, payment_method: paymentMethod.value })
    ElMessage.success(`充值成功，已到账 ¥${pkg.amount + pkg.bonus_amount}`)
    updateUser({ balance: result.balance, points: result.points })
    loadHistory()
  } catch (e) {
    ElMessage.error(e.error || '充值失败')
  }
}
</script>

<style scoped>
.package { cursor: pointer; text-align: center; }
.package.active { border: 2px solid #409eff; }
.package .amount { font-size: 36px; font-weight: bold; color: #409eff; }
.package .bonus { color: #f56c6c; margin: 10px 0; }
.package .name { color: #666; }
</style>
