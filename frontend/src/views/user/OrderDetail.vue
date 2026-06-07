<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrderDetailApi, getOrderEnergyDataApi } from '@/api/order'
import PageHeader from '@/components/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import EmptyState from '@/components/EmptyState.vue'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()

const orderId = computed(() => Number(route.params.id))
const loading = ref(false)
const order = ref<any>(null)
const energyData = ref<any>(null)
const energyChartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

const steps = computed(() => {
  if (!order.value) return []
  return [
    { title: '创建订单', description: order.value.createdAt, status: 0 },
    { title: '支付完成', description: order.value.paidAt || '待支付', status: order.value.status !== 'pending' ? 0 : -1 },
    { title: '开始洗涤', description: order.value.startedAt || '等待中', status: ['washing', 'completed'].includes(order.value.status) ? 0 : -1 },
    { title: '洗涤完成', description: order.value.completedAt || '等待中', status: order.value.status === 'completed' ? 0 : -1 }
  ]
})

async function loadOrder() {
  loading.value = true
  try {
    const [orderRes, energyRes] = await Promise.all([
      getOrderDetailApi(orderId.value),
      getOrderEnergyDataApi(orderId.value).catch(() => ({ data: null }))
    ])
    order.value = orderRes.data
    energyData.value = energyRes.data
    if (energyData.value) {
      setTimeout(initChart, 100)
    }
  } catch (error) {
    console.error('Load order error:', error)
  } finally {
    loading.value = false
  }
}

function initChart() {
  if (!energyChartRef.value || !energyData.value) return

  chartInstance = echarts.init(energyChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['功率 (W)', '水温 (°C)']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: energyData.value.timePoints || ['0', '5', '10', '15', '20', '25', '30']
    },
    yAxis: [
      {
        type: 'value',
        name: '功率 (W)'
      },
      {
        type: 'value',
        name: '水温 (°C)'
      }
    ],
    series: [
      {
        name: '功率 (W)',
        type: 'line',
        smooth: true,
        data: energyData.value.power || [200, 500, 800, 800, 800, 500, 200]
      },
      {
        name: '水温 (°C)',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: energyData.value.temperature || [20, 30, 45, 50, 48, 35, 25]
      }
    ]
  }

  chartInstance.setOption(option)
}

function goToWash() {
  if (order.value?.deviceId) {
    router.push(`/wash/${order.value.deviceId}`)
  }
}

onMounted(() => {
  loadOrder()
})
</script>

<template>
  <div class="order-detail-page">
    <PageHeader title="订单详情" show-back />

    <div v-if="loading" class="content-wrapper">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else-if="!order" class="content-wrapper">
      <EmptyState description="订单不存在" icon="Warning" />
    </div>

    <div v-else class="content-wrapper">
      <el-row :gutter="24">
        <el-col :xs="24" :lg="16">
          <el-card class="status-card">
            <div class="status-header">
              <div class="status-info">
                <StatusBadge :status="order.status" type="order" />
                <span class="order-no">订单号：{{ order.orderNo }}</span>
              </div>
              <el-button
                v-if="order.status === 'pending'"
                type="primary"
                @click="router.push(`/payment/${order.id}`)"
              >
                立即支付
              </el-button>
              <el-button
                v-if="order.status === 'completed'"
                type="primary"
                @click="goToWash"
              >
                再次洗衣
              </el-button>
            </div>

            <el-steps :active="steps.filter((s) => s.status !== -1).length" class="order-steps">
              <el-step
                v-for="(step, index) in steps"
                :key="index"
                :title="step.title"
                :description="step.description"
                :status="step.status === -1 ? 'wait' : 'finish'"
              />
            </el-steps>
          </el-card>

          <el-card class="detail-card">
            <template #header>
              <span>订单信息</span>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="设备名称">
                {{ order.deviceName }}
              </el-descriptions-item>
              <el-descriptions-item label="设备编号">
                {{ order.deviceCode }}
              </el-descriptions-item>
              <el-descriptions-item label="洗涤程序">
                {{ order.program }}
              </el-descriptions-item>
              <el-descriptions-item label="洗涤时长">
                {{ order.duration }} 分钟
              </el-descriptions-item>
              <el-descriptions-item label="设备位置">
                {{ order.location }}
              </el-descriptions-item>
              <el-descriptions-item label="订单金额">
                <span class="price">¥{{ order.amount }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="支付方式">
                {{ order.paymentMethod || '未支付' }}
              </el-descriptions-item>
              <el-descriptions-item label="支付时间">
                {{ order.paidAt || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="创建时间" :span="2">
                {{ order.createdAt }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card v-if="energyData" class="energy-card">
            <template #header>
              <span>能耗数据</span>
            </template>
            <div class="energy-summary">
              <div class="energy-item">
                <el-icon size="28" color="#409eff"><Lightning /></el-icon>
                <div class="energy-info">
                  <div class="energy-value">{{ energyData.totalPower || 0.5 }} kWh</div>
                  <div class="energy-label">总耗电量</div>
                </div>
              </div>
              <div class="energy-item">
                <el-icon size="28" color="#67c23a"><Watermelon /></el-icon>
                <div class="energy-info">
                  <div class="energy-value">{{ energyData.totalWater || 30 }} L</div>
                  <div class="energy-label">总耗水量</div>
                </div>
              </div>
              <div class="energy-item">
                <el-icon size="28" color="#e6a23c"><TrendCharts /></el-icon>
                <div class="energy-info">
                  <div class="energy-value">¥{{ energyData.energyCost || 0.8 }}</div>
                  <div class="energy-label">能耗费用</div>
                </div>
              </div>
            </div>
            <div ref="energyChartRef" class="energy-chart"></div>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="8">
          <el-card class="summary-card">
            <template #header>
              <span>费用明细</span>
            </template>
            <div class="fee-list">
              <div class="fee-row">
                <span class="label">洗涤费用</span>
                <span class="value">¥{{ order.amount }}</span>
              </div>
              <div class="fee-row">
                <span class="label">能耗费用</span>
                <span class="value">¥{{ energyData?.energyCost || '0.00' }}</span>
              </div>
              <div class="fee-row">
                <span class="label">优惠减免</span>
                <span class="value discount">-¥0.00</span>
              </div>
              <div class="fee-row total">
                <span class="label">实付金额</span>
                <span class="value price">¥{{ order.amount }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.order-detail-page {
  min-height: 100vh;
  background: #f5f7fa;

  .content-wrapper {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px 24px;
  }

  .status-card {
    margin-bottom: 20px;

    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      .status-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .order-no {
          font-size: 14px;
          color: #606266;
        }
      }
    }

    .order-steps {
      padding: 20px 0;
    }
  }

  .detail-card {
    margin-bottom: 20px;

    .price {
      color: #f56c6c;
      font-weight: 600;
      font-size: 16px;
    }
  }

  .energy-card {
    margin-bottom: 20px;

    .energy-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 20px;

      .energy-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: #f5f7fa;
        border-radius: 8px;

        .energy-info {
          .energy-value {
            font-size: 20px;
            font-weight: 700;
            color: #303133;
          }

          .energy-label {
            font-size: 13px;
            color: #909399;
          }
        }
      }
    }

    .energy-chart {
      height: 300px;
      width: 100%;
    }
  }

  .summary-card {
    position: sticky;
    top: 20px;

    .fee-list {
      .fee-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid #f2f6fc;
        font-size: 15px;

        &:last-child {
          border-bottom: none;
        }

        &.total {
          padding-top: 16px;
          margin-top: 4px;
          border-top: 2px solid #ebeef5;
          border-bottom: none;

          .label {
            font-weight: 600;
            font-size: 16px;
          }

          .value.price {
            font-size: 24px;
            color: #f56c6c;
            font-weight: 700;
          }
        }

        .label {
          color: #606266;
        }

        .value {
          color: #303133;
          font-weight: 500;

          &.discount {
            color: #67c23a;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .order-detail-page {
    .energy-card {
      .energy-summary {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>
