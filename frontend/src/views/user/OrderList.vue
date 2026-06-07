<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getOrderListApi } from '@/api/order'
import PageHeader from '@/components/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()

const loading = ref(false)
const orders = ref<any[]>([])
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})
const statusFilter = ref('')

const statusOptions = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'washing', label: '洗涤中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

async function loadOrders() {
  loading.value = true
  try {
    const res = await getOrderListApi({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      status: statusFilter.value
    })
    orders.value = res.data.list || res.data
    pagination.value.total = res.data.total || orders.value.length
  } catch (error) {
    console.error('Load orders error:', error)
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  pagination.value.page = page
  loadOrders()
}

function handleStatusChange() {
  pagination.value.page = 1
  loadOrders()
}

function viewOrder(id: number) {
  router.push(`/order/${id}`)
}

function goToHome() {
  router.push('/home')
}

onMounted(() => {
  loadOrders()
})
</script>

<template>
  <div class="order-list-page">
    <PageHeader title="我的订单" show-back />

    <div class="content-wrapper">
      <el-card class="filter-card">
        <div class="filter-row">
          <span class="filter-label">订单状态：</span>
          <el-radio-group v-model="statusFilter" @change="handleStatusChange">
            <el-radio-button
              v-for="opt in statusOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </el-radio-button>
          </el-radio-group>
        </div>
      </el-card>

      <div v-loading="loading" class="order-list">
        <EmptyState
          v-if="!loading && orders.length === 0"
          description="暂无订单"
          icon="Document"
        >
          <el-button type="primary" @click="goToHome">去洗衣</el-button>
        </EmptyState>

        <div v-else>
          <div
            v-for="order in orders"
            :key="order.id"
            class="order-item"
            @click="viewOrder(order.id)"
          >
            <div class="order-header">
              <div class="order-info">
                <span class="order-no">订单号：{{ order.orderNo }}</span>
                <span class="order-time">{{ order.createdAt }}</span>
              </div>
              <StatusBadge :status="order.status" type="order" />
            </div>

            <div class="order-body">
              <div class="device-icon">
                <el-icon :size="40" color="#409eff"><Service /></el-icon>
              </div>
              <div class="order-details">
                <div class="device-name">{{ order.deviceName }}</div>
                <div class="program-info">{{ order.program }} · {{ order.duration }}分钟</div>
                <div class="location" v-if="order.location">
                  <el-icon size="14"><Location /></el-icon>
                  {{ order.location }}
                </div>
              </div>
              <div class="order-amount">
                <div class="amount">¥{{ order.amount }}</div>
                <el-button type="primary" size="small" text>查看详情</el-button>
              </div>
            </div>
          </div>

          <div v-if="pagination.total > pagination.pageSize" class="pagination-wrapper">
            <el-pagination
              background
              layout="prev, pager, next, total"
              :current-page="pagination.page"
              :page-size="pagination.pageSize"
              :total="pagination.total"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.order-list-page {
  min-height: 100vh;
  background: #f5f7fa;

  .content-wrapper {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 24px 24px;
  }

  .filter-card {
    margin-bottom: 16px;

    .filter-row {
      display: flex;
      align-items: center;
      gap: 12px;

      .filter-label {
        font-size: 14px;
        color: #606266;
      }
    }
  }

  .order-list {
    .order-item {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: box-shadow 0.2s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 12px;
        border-bottom: 1px solid #f2f6fc;
        margin-bottom: 16px;

        .order-info {
          display: flex;
          gap: 16px;
          font-size: 14px;

          .order-no {
            color: #303133;
            font-weight: 500;
          }

          .order-time {
            color: #909399;
          }
        }
      }

      .order-body {
        display: flex;
        align-items: center;
        gap: 16px;

        .order-details {
          flex: 1;

          .device-name {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
          }

          .program-info {
            font-size: 14px;
            color: #606266;
            margin-bottom: 4px;
          }

          .location {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            color: #909399;
          }
        }

        .order-amount {
          text-align: right;

          .amount {
            font-size: 20px;
            font-weight: 700;
            color: #f56c6c;
            margin-bottom: 8px;
          }
        }
      }
    }

    .pagination-wrapper {
      margin-top: 20px;
      text-align: center;
    }
  }
}

@media (max-width: 768px) {
  .order-list-page {
    .content-wrapper {
      padding: 0 16px 16px;
    }

    .filter-card {
      .filter-row {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    .order-list {
      .order-item {
        .order-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .order-body {
          flex-wrap: wrap;

          .order-amount {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #f2f6fc;
          }
        }
      }
    }
  }
}
</style>
