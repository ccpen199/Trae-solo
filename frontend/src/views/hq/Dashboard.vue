<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="4"><el-card><div class="stat"><span>会员总数</span><b>{{ data.member_count || 0 }}</b></div></el-card></el-col>
      <el-col :span="4"><el-card><div class="stat"><span>总储值余额</span><b>¥{{ data.total_balance?.toFixed(2) || '0.00' }}</b></div></el-card></el-col>
      <el-col :span="4"><el-card><div class="stat"><span>总积分</span><b>{{ data.total_points || 0 }}</b></div></el-card></el-col>
      <el-col :span="4"><el-card><div class="stat"><span>交易笔数</span><b>{{ data.sales?.transaction_count || 0 }}</b></div></el-card></el-col>
      <el-col :span="4"><el-card><div class="stat"><span>总交易额</span><b>¥{{ data.sales?.final_total?.toFixed(2) || '0.00' }}</b></div></el-card></el-col>
      <el-col :span="4"><el-card><div class="stat"><span>会员占比</span><b>{{ data.member_rate?.toFixed(1) || 0 }}%</b></div></el-card></el-col>
    </el-row>
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>各站点销售</template>
          <el-table :data="data.by_station || []" border>
            <el-table-column prop="name" label="站点" />
            <el-table-column prop="volume" label="销量(L)" />
            <el-table-column prop="amount" label="金额(元)">
              <template #default="{row}">¥{{ row.amount?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="count" label="笔数" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>油品销售</template>
          <el-table :data="data.by_fuel || []" border>
            <el-table-column prop="code" label="油品" width="100" />
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="volume" label="销量(L)" />
            <el-table-column prop="amount" label="金额(元)">
              <template #default="{row}">¥{{ row.amount?.toFixed(2) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { report } from '../../api'

const data = ref({})
onMounted(async () => {
  data.value = await report.dashboard({})
})
</script>

<style scoped>
.stat { text-align: center; padding: 15px 0; }
.stat span { display: block; color: #666; margin-bottom: 8px; font-size: 12px; }
.stat b { font-size: 22px; color: #409eff; }
</style>
