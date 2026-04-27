<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingOrders }}</div>
              <div class="stat-label">待处理工单</div>
            </div>
            <div class="stat-icon primary">
              <el-icon :size="36"><Setting /></el-icon>
            </div>
          </div>
          <div class="stat-footer">
            <span>较昨日</span>
            <span class="trend up"><el-icon><ArrowUp /></el-icon> 12%</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ stats.waitingInspection }}</div>
              <div class="stat-label">待质检批次</div>
            </div>
            <div class="stat-icon success">
              <el-icon :size="36"><CircleCheck /></el-icon>
            </div>
          </div>
          <div class="stat-footer">
            <span>今日新增</span>
            <span class="trend up"><el-icon><Plus /></el-icon> 5</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ stats.lowStockCount }}</div>
              <div class="stat-label">库存预警</div>
            </div>
            <div class="stat-icon warning">
              <el-icon :size="36"><Warning /></el-icon>
            </div>
          </div>
          <div class="stat-footer">
            <span>需采购</span>
            <span class="trend down"><el-icon><Attention /></el-icon> 3种原料</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayShipments }}</div>
              <div class="stat-label">今日发货</div>
            </div>
            <div class="stat-icon info">
              <el-icon :size="36"><Truck /></el-icon>
            </div>
          </div>
          <div class="stat-footer">
            <span>已完成</span>
            <span class="trend up"><el-icon><Check /></el-icon> 全部发货</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card shadow="never" class="card-wrapper">
          <template #header>
            <div class="card-header">
              <span>核心业务流程</span>
              <el-tag type="info">快速入口</el-tag>
            </div>
          </template>
          <el-steps :active="-1" finish-status="success" align-center>
            <el-step title="原料入库">
              <template #icon>
                <el-button type="primary" circle @click="goTo('/purchase/inbound')">
                  <el-icon><Upload /></el-icon>
                </el-button>
              </template>
              <template #description>
                <span class="step-desc">采购人员录入批次</span>
              </template>
            </el-step>
            <el-step title="领料生产">
              <template #icon>
                <el-button type="primary" circle @click="goTo('/production/requisition')">
                  <el-icon><Document /></el-icon>
                </el-button>
              </template>
              <template #description>
                <span class="step-desc">按BOM校验用量</span>
              </template>
            </el-step>
            <el-step title="批次质检">
              <template #icon>
                <el-button type="primary" circle @click="goTo('/quality/inspection')">
                  <el-icon><List /></el-icon>
                </el-button>
              </template>
              <template #description>
                <span class="step-desc">逐项录入检测结果</span>
              </template>
            </el-step>
            <el-step title="成品入库">
              <template #icon>
                <el-button type="primary" circle @click="goTo('/quality/product-inbound')">
                  <el-icon><Box /></el-icon>
                </el-button>
              </template>
              <template #description>
                <span class="step-desc">自动增加成品库存</span>
              </template>
            </el-step>
            <el-step title="发货追溯">
              <template #icon>
                <el-button type="primary" circle @click="goTo('/traceability/query')">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
              <template #description>
                <span class="step-desc">一键回溯全链路</span>
              </template>
            </el-step>
          </el-steps>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="card-wrapper">
          <template #header>
            <div class="card-header">
              <span>待办事项</span>
              <el-tag type="danger">{{ todos.length }}</el-tag>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in todos"
              :key="index"
              :type="item.type"
              :timestamp="item.time"
              placement="top"
            >
              <el-card shadow="never" :body-style="{ padding: '10px' }">
                <h4>{{ item.title }}</h4>
                <p style="margin: 0; color: #999; font-size: 12px">{{ item.description }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card shadow="never" class="card-wrapper">
          <template #header>
            <div class="card-header">
              <span>最近生产工单</span>
              <el-button text type="primary" @click="goTo('/production/work-order')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentWorkOrders" style="width: 100%">
            <el-table-column prop="orderNo" label="工单号" width="150" />
            <el-table-column prop="productName" label="产品名称" />
            <el-table-column prop="plannedQty" label="计划数量" width="120">
              <template #default="{ row }">
                {{ row.plannedQty }} {{ row.unit }}
              </template>
            </el-table-column>
            <el-table-column prop="actualQty" label="实际数量" width="120">
              <template #default="{ row }">
                {{ row.actualQty || 0 }} {{ row.unit }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import * as dayjs from 'dayjs'

const router = useRouter()

const stats = ref({
  pendingOrders: 8,
  waitingInspection: 12,
  lowStockCount: 3,
  todayShipments: 5,
})

const todos = ref([
  {
    title: '工单 WO2026042600001 待领料',
    description: '需要生产草莓蛋糕 100份',
    type: 'primary',
    time: '10:30',
  },
  {
    title: '批次 FG202604260003 待质检',
    description: '牛奶面包批次等待质检',
    type: 'warning',
    time: '09:45',
  },
  {
    title: '原料 面粉 库存不足',
    description: '当前库存 50kg，低于安全库存 100kg',
    type: 'danger',
    time: '08:00',
  },
])

const recentWorkOrders = ref([
  {
    id: '1',
    orderNo: 'WO2026042600001',
    productName: '草莓蛋糕',
    plannedQty: 100,
    actualQty: 0,
    unit: '份',
    status: 'PENDING',
    createdAt: '2026-04-26T10:00:00Z',
  },
  {
    id: '2',
    orderNo: 'WO2026042600002',
    productName: '牛奶面包',
    plannedQty: 500,
    actualQty: 350,
    unit: '个',
    status: 'IN_PROGRESS',
    createdAt: '2026-04-26T09:00:00Z',
  },
  {
    id: '3',
    orderNo: 'WO2026042500005',
    productName: '巧克力曲奇',
    plannedQty: 200,
    actualQty: 200,
    unit: '盒',
    status: 'COMPLETED',
    createdAt: '2026-04-25T14:00:00Z',
  },
])

const goTo = (path: string) => {
  router.push(path)
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: 'info',
    PENDING: 'warning',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success',
    CANCELLED: 'info',
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    PENDING: '待开始',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  }
  return map[status] || status
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style lang="scss" scoped>
.dashboard {
  .stats-row {
    margin-bottom: 20px;
  }

  .stat-card {
    :deep(.el-card__body) {
      padding: 20px;
    }

    .stat-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .stat-info {
      .stat-value {
        font-size: 32px;
        font-weight: 600;
        color: #333;
        line-height: 1;
      }

      .stat-label {
        font-size: 14px;
        color: #999;
        margin-top: 8px;
      }
    }

    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      &.primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
      }

      &.success {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        color: #fff;
      }

      &.warning {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: #fff;
      }

      &.info {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: #fff;
      }
    }

    .stat-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
      font-size: 12px;
      color: #999;

      .trend {
        display: flex;
        align-items: center;
        gap: 4px;

        &.up {
          color: #67c23a;
        }

        &.down {
          color: #f56c6c;
        }
      }
    }
  }

  .card-wrapper {
    :deep(.el-card__header) {
      padding: 16px 20px;
      border-bottom: 1px solid #f0f0f0;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }

  .step-desc {
    color: #999;
    font-size: 12px;
  }
}
</style>
