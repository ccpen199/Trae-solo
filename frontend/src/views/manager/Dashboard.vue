<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6"><el-card><div class="stat"><span>今日交易额</span><b>¥{{ data.sales?.final_total?.toFixed(2) || '0.00' }}</b></div></el-card></el-col>
      <el-col :span="6"><el-card><div class="stat"><span>交易笔数</span><b>{{ data.sales?.transaction_count || 0 }}</b></div></el-card></el-col>
      <el-col :span="6"><el-card><div class="stat"><span>优惠总额</span><b class="discount">¥{{ ((data.sales?.discount_total || 0) + (data.sales?.coupon_total || 0)).toFixed(2) }}</b></div></el-card></el-col>
      <el-col :span="6"><el-card><div class="stat"><span>会员占比</span><b>{{ data.member_rate?.toFixed(1) || 0 }}%</b></div></el-card></el-col>
    </el-row>
    <el-card style="margin-top: 20px;">
      <template #header>油品销量</template>
      <el-table :data="data.by_fuel || []" border>
        <el-table-column prop="code" label="油品" width="100" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="volume" label="销量(L)" />
        <el-table-column prop="amount" label="金额(元)">
          <template #default="{row}">¥{{ row.amount?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="count" label="笔数" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { report } from '../../api'
import { useUserStore } from '../../utils/userStore'

const { userInfo } = useUserStore()
const data = ref({})

onMounted(async () => {
  data.value = await report.dashboard({ station_id: userInfo.station_id })
})
</script>

<style scoped>
.stat { text-align: center; padding: 20px 0; }
.stat span { display: block; color: #666; margin-bottom: 10px; }
.stat b { font-size: 28px; color: #409eff; }
.stat b.discount { color: #f56c6c; }
</style>
