<template>
  <div class="admin-sla">
    <el-card>
      <template #header>
        <span>SLA 服务监控</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="sla-card">
            <div class="sla-title">接单达标率</div>
            <div class="sla-value" :class="{ good: sla.accept_rate >= 90, warning: sla.accept_rate >= 70 && sla.accept_rate < 90, bad: sla.accept_rate < 70 }}">
              {{ sla.accept_rate }}%
            </div>
            <div class="sla-desc">标准: ≤60秒</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="sla-card">
            <div class="sla-title">上门达标率</div>
            <div class="sla-value" :class="{ good: sla.arrive_rate >= 90, warning: sla.arrive_rate >= 70 && sla.arrive_rate < 90, bad: sla.arrive_rate < 70 }}">
              {{ sla.arrive_rate }}%
            </div>
            <div class="sla-desc">标准: ≤5分钟</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="sla-card">
            <div class="sla-title">平均接单时间</div>
            <div class="sla-value info">{{ (sla.avg_accept_time || 0).toFixed(1) }}秒</div>
            <div class="sla-desc">近7天数据</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="sla-card">
            <div class="sla-title">平均上门时间</div>
            <div class="sla-value info">{{ (sla.avg_arrive_time || 0).toFixed(1) }}秒</div>
            <div class="sla-desc">近7天数据</div>
          </div>
        </el-col>
      </el-row>

      <div style="margin-top: 30px;">
        <h4 style="margin-bottom: 15px;">达标标准说明</h4>
        <el-alert
          title="接单时效：订单发布后，司机需在60秒内接单，超时未接单视为不达标"
          type="info"
          :closable="false"
          style="margin-bottom: 10px;"
        />
        <el-alert
          title="上门时效：司机接单后，需在5分钟内到达装货地点，超时未到达视为不达标"
          type="info"
          :closable="false"
        />
      </div>

      <div style="margin-top: 30px;">
        <h4 style="margin-bottom: 15px;">统计概览</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="统计周期">近 7 天</el-descriptions-item>
          <el-descriptions-item label="总订单数">{{ sla.total_orders || 0 }}</el-descriptions-item>
          <el-descriptions-item label="接单数达标">{{ sla.accept_passed_count || 0 }}</el-descriptions-item>
          <el-descriptions-item label="上门数达标">{{ sla.arrive_passed_count || 0 }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { statsAPI } from '@/api'

const sla = ref({})

const loadData = async () => {
  const res = await statsAPI.sla()
  if (res.success) {
    sla.value = res.data
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.sla-card {
  padding: 25px;
  background: #f8f9fa;
  border-radius: 12px;
  text-align: center;
}
.sla-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}
.sla-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 5px;
}
.sla-value.good { color: #67c23a; }
.sla-value.warning { color: #e6a23c; }
.sla-value.bad { color: #f56c6c; }
.sla-value.info { color: #409eff; }
.sla-desc {
  font-size: 12px;
  color: #909399;
}
</style>
