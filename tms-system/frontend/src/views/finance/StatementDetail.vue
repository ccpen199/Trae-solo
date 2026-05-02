<template>
  <div class="page-container">
    <h2>对账单详情</h2>
    <div v-if="statement" class="statement-detail">
      <div class="detail-section">
        <div class="section-title">对账单信息</div>
        <div class="detail-grid">
          <div class="detail-item"><span class="label">对账单号</span><span class="value">{{ statement.statement_no }}</span></div>
          <div class="detail-item"><span class="label">客户</span><span class="value">{{ statement.customer_name }}</span></div>
          <div class="detail-item"><span class="label">结算周期</span><span class="value">{{ statement.period_start }} 至 {{ statement.period_end }}</span></div>
          <div class="detail-item"><span class="label">状态</span><el-tag>{{ getStatusText(statement.status) }}</el-tag></div>
        </div>
      </div>
      <div class="detail-section">
        <div class="section-title">汇总</div>
        <div class="detail-grid">
          <div class="detail-item"><span class="label">订单数</span><span class="value">{{ statement.total_orders }}</span></div>
          <div class="detail-item"><span class="label">总里程</span><span class="value">{{ statement.total_distance }}公里</span></div>
          <div class="detail-item"><span class="label">总重量</span><span class="value">{{ statement.total_weight }}吨</span></div>
          <div class="detail-item total"><span class="label">总金额</span><span class="value">¥{{ statement.total_amount }}</span></div>
        </div>
      </div>
      <div class="detail-section">
        <div class="section-title">明细</div>
        <el-table :data="statement.line_items" border>
          <el-table-column prop="waybill_no" label="运单号" />
          <el-table-column prop="order_no" label="订单号" />
          <el-table-column prop="route" label="路线" />
          <el-table-column prop="distance" label="里程" />
          <el-table-column prop="weight" label="重量" />
          <el-table-column prop="freight" label="运费" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { statementApi } from '@/api'

const route = useRoute()
const statement = ref(null)

onMounted(async () => {
  statement.value = await statementApi.detail(route.params.id)
})

function getStatusText(status) {
  const texts = { DRAFT: '草稿', SENT: '已发送', CONFIRMED: '已确认', DISPUTED: '有异议', SETTLED: '已结算' }
  return texts[status] || status
}
</script>

<style lang="scss" scoped>
.total {
  grid-column: span 2;
  .value { font-size: 24px; color: #f56c6c; font-weight: 600; }
}
</style>
