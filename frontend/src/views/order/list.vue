<template>
  <div class="order-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <div class="header-actions">
            <el-select v-model="queryForm.status" placeholder="订单状态" clearable style="width: 120px; margin-right: 10px;">
              <el-option label="待接单" :value="10" />
              <el-option label="已接单" :value="20" />
              <el-option label="制作中" :value="30" />
              <el-option label="待取餐" :value="40" />
              <el-option label="配送中" :value="50" />
              <el-option label="已完成" :value="60" />
              <el-option label="已取消" :value="70" />
              <el-option label="退款中" :value="80" />
              <el-option label="已退款" :value="90" />
            </el-select>
            <el-date-picker
              v-model="queryForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="margin-right: 10px;"
            />
            <el-input v-model="queryForm.keyword" placeholder="订单号/顾客名/电话" clearable style="width: 200px; margin-right: 10px;" />
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="orderList" v-loading="loading" stripe>
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="platformOrderNo" label="平台单号" width="160" />
        <el-table-column prop="platformTypeName" label="平台" width="100" />
        <el-table-column prop="orderStatusName" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.orderStatus)" size="small">
              {{ row.orderStatusName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="顾客" width="100" />
        <el-table-column prop="customerPhone" label="电话" width="120" />
        <el-table-column prop="paidAmount" label="实付金额" width="100">
          <template #default="{ row }">
            ¥{{ row.paidAmount?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="160" />
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="goToDetail(row.id)">
              详情
            </el-button>
            <el-button 
              v-if="row.orderStatus === 10" 
              type="success" 
              link 
              size="small" 
              @click="handleReceive(row)"
            >
              接单
            </el-button>
            <el-button 
              v-if="row.orderStatus === 20" 
              type="warning" 
              link 
              size="small" 
              @click="handleStartPrepare(row)"
            >
              开始制作
            </el-button>
            <el-button 
              v-if="row.orderStatus === 30" 
              type="primary" 
              link 
              size="small" 
              @click="handleFinishPrepare(row)"
            >
              制作完成
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="queryForm.page"
        v-model:page-size="queryForm.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSearch"
        @current-change="handleSearch"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Order } from '@/api/order'

const router = useRouter()

const loading = ref(false)
const total = ref(0)
const orderList = ref<Order[]>([])

const queryForm = reactive({
  status: undefined as number | undefined,
  dateRange: undefined as any,
  keyword: '',
  page: 1,
  size: 10
})

function getStatusTagType(status: number): 'success' | 'primary' | 'warning' | 'info' | 'danger' {
  const typeMap: Record<number, 'success' | 'primary' | 'warning' | 'info' | 'danger'> = {
    10: 'warning',
    15: 'info',
    20: 'primary',
    30: 'warning',
    40: 'primary',
    50: 'warning',
    60: 'success',
    70: 'danger',
    80: 'warning',
    90: 'info'
  }
  return typeMap[status] || 'info'
}

const mockOrders = (): Order[] => {
  const statusMap: Record<number, string> = {
    10: '待接单',
    15: '待付款',
    20: '已接单',
    30: '制作中',
    40: '待取餐',
    50: '配送中',
    60: '已完成',
    70: '已取消',
    80: '退款中',
    90: '已退款'
  }
  
  const platformMap: Record<number, string> = {
    1: '美团外卖',
    2: '饿了么',
    3: '自营平台'
  }

  const orders: Order[] = []
  for (let i = 1; i <= 15; i++) {
    const status = [10, 20, 30, 40, 50, 60, 70][i % 7]
    const platform = [1, 2][i % 2]
    orders.push({
      id: i,
      orderNo: `OD${Date.now()}${i.toString().padStart(3, '0')}`,
      platformOrderNo: `${platform === 1 ? 'MT' : 'EL'}${Date.now()}${i}`,
      storeId: 1,
      merchantId: 1,
      platformType: platform,
      platformTypeName: platformMap[platform],
      orderStatus: status,
      orderStatusName: statusMap[status],
      receiveType: i % 3 === 0 ? 1 : 2,
      customerName: `顾客${i}`,
      customerPhone: `138${(10000000 + i).toString()}`,
      deliveryAddress: `北京市海淀区中关村街道${i}号`,
      orderAmount: 50 + i * 10,
      goodsAmount: 40 + i * 8,
      deliveryFee: 5,
      packageFee: 2,
      discountAmount: i * 2,
      paidAmount: 50 + i * 10 - i * 2,
      orderRemark: i % 3 === 0 ? '少放辣，不要葱' : '',
      printed: i > 5 ? 1 : 0,
      printCount: i > 5 ? 2 : 0,
      hasAfterSale: i % 10 === 0 ? 1 : 0,
      createTime: new Date(Date.now() - i * 3600000).toISOString().replace('T', ' ').substring(0, 19)
    } as any)
  }
  return orders
}

async function handleSearch() {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    orderList.value = mockOrders()
    total.value = 56
  } catch (error: any) {
    ElMessage.error(error.message || '查询失败')
  } finally {
    loading.value = false
  }
}

function goToDetail(id: number) {
  router.push(`/order/detail/${id}`)
}

async function handleReceive(row: Order) {
  try {
    await ElMessageBox.confirm(`确定要接单吗？订单号: ${row.orderNo}`, '确认', {
      type: 'warning'
    })
    ElMessage.success('接单成功')
    row.orderStatus = 20
    row.orderStatusName = '已接单'
  } catch {
    // 用户取消
  }
}

async function handleStartPrepare(row: Order) {
  try {
    await ElMessageBox.confirm(`确定要开始制作吗？`, '确认', {
      type: 'info'
    })
    ElMessage.success('已开始制作')
    row.orderStatus = 30
    row.orderStatusName = '制作中'
  } catch {
    // 用户取消
  }
}

async function handleFinishPrepare(row: Order) {
  try {
    await ElMessageBox.confirm(`确定制作完成了吗？`, '确认', {
      type: 'success'
    })
    ElMessage.success('制作完成')
    row.orderStatus = 40
    row.orderStatusName = '待取餐'
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  handleSearch()
})
</script>

<style lang="scss" scoped>
.order-list-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    
    .header-actions {
      display: flex;
      align-items: center;
    }
  }
}
</style>
