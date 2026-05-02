<template>
  <div class="page-container">
    <h2>运费详情 - {{ freight?.freight_no }}</h2>
    <div v-if="freight" class="freight-detail">
      <div class="detail-section">
        <div class="section-title">费用计算明细</div>
        <el-table :data="feeItems" border>
          <el-table-column prop="item" label="费用项" />
          <el-table-column prop="formula" label="计算公式" />
          <el-table-column prop="value" label="数值" />
          <el-table-column prop="amount" label="金额" />
          <el-table-column prop="explanation" label="计算依据" min-width="200" />
        </el-table>
      </div>

      <div class="detail-section">
        <div class="section-title">汇总信息</div>
        <div class="detail-grid">
          <div class="detail-item"><span class="label">里程费</span><span class="value">¥{{ freight.distance_fee }}</span></div>
          <div class="detail-item"><span class="label">吨位费</span><span class="value">¥{{ freight.weight_fee }}</span></div>
          <div class="detail-item"><span class="label">附加费</span><span class="value">¥{{ freight.additional_total }}</span></div>
          <div class="detail-item"><span class="label">折扣</span><span class="value">-¥{{ freight.discount }}</span></div>
          <div class="detail-item total"><span class="label">总运费</span><span class="value">¥{{ freight.total_freight }}</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { freightApi } from '@/api'

const route = useRoute()
const freight = ref(null)

onMounted(async () => {
  freight.value = await freightApi.detail(route.params.id)
})

const feeItems = computed(() => {
  if (!freight.value) return []
  return [
    { item: '里程费', formula: '计费里程 × 单价', value: `${freight.value.distance} × ¥${freight.value.distance_unit_price}`, amount: `¥${freight.value.distance_fee}`, explanation: freight.value.calculation_basis?.distance_explanation || '根据实际行驶里程计算' },
    { item: '吨位费', formula: '计费吨位 × 单价', value: `${freight.value.weight} × ¥${freight.value.weight_unit_price}`, amount: `¥${freight.value.weight_fee}`, explanation: freight.value.calculation_basis?.weight_explanation || '根据货物重量计算' },
    { item: '提货费', formula: '固定费用', value: '1次', amount: `¥${freight.value.pickup_fee || 0}`, explanation: '包含上门提货服务' },
    { item: '送货费', formula: '固定费用', value: '1次', amount: `¥${freight.value.delivery_fee || 0}`, explanation: '包含送货上门服务' },
    { item: '保价费', formula: '声明价值 × 0.1%', value: `¥${freight.value.declared_value} × 0.1%`, amount: `¥${freight.value.insurance_fee || 0}`, explanation: '按声明价值的0.1%收取' },
    { item: '折扣', formula: '-', value: '-', amount: `-¥${freight.value.discount || 0}`, explanation: freight.value.calculation_basis?.discount_reason || '无折扣' }
  ]
})
</script>

<style lang="scss" scoped>
.total {
  grid-column: span 2;
  .value { font-size: 24px; color: #f56c6c; font-weight: 600; }
}
</style>
