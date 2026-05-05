<template>
  <div class="order-container">
    <el-card class="tabs-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部订单" name="all" />
        <el-tab-pane label="待发货" name="pending_ship" />
        <el-tab-pane label="待退款" name="pending_refund" />
        <el-tab-pane label="物流查询" name="logistics" />
      </el-tabs>
    </el-card>

    <template v-if="activeTab !== 'logistics'">
      <el-card class="search-card">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="关键词">
            <el-input
              v-model="searchForm.keyword"
              placeholder="订单号/客户名/账号"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="订单状态">
            <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 150px">
              <el-option label="待付款" :value="1" />
              <el-option label="待发货" :value="2" />
              <el-option label="已发货" :value="3" />
              <el-option label="已完成" :value="4" />
              <el-option label="待退款" :value="5" />
              <el-option label="已退款" :value="6" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <span>订单列表</span>
          </div>
        </template>
        
        <el-table :data="orderList" v-loading="loading" stripe>
          <el-table-column prop="order_no" label="订单编号" min-width="180" />
          <el-table-column prop="customer_name" label="客户名称" min-width="100" />
          <el-table-column prop="customer_account" label="客户账号" min-width="120" />
          <el-table-column prop="total_amount" label="订单金额" min-width="100">
            <template #default="{ row }">
              <span class="amount-text">¥{{ row.total_amount }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="订单状态" min-width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ row.status_text }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="shipping_address" label="收货地址" min-width="200" show-overflow-tooltip />
          <el-table-column prop="created_at" label="创建时间" min-width="180">
            <template #default="{ row }">
              {{ formatTime(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleView(row)">详情</el-button>
              <el-button
                v-if="row.status === 2"
                type="success"
                link
                @click="handleShip(row)"
              >发货</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadOrderList"
            @current-change="loadOrderList"
          />
        </div>
      </el-card>
    </template>

    <template v-else>
      <el-card class="logistics-card">
        <template #header>
          <div class="card-header">
            <span>物流查询</span>
          </div>
        </template>
        
        <el-form :inline="true" :model="logisticsForm" class="search-form">
          <el-form-item label="物流编号">
            <el-input
              v-model="logisticsForm.logisticsNo"
              placeholder="请输入物流编号"
              clearable
            />
          </el-form-item>
          <el-form-item label="或订单编号">
            <el-input
              v-model="logisticsForm.orderNo"
              placeholder="请输入订单编号"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQueryLogistics">查询</el-button>
          </el-form-item>
        </el-form>
        
        <div class="logistics-result" v-if="logisticsResult">
          <el-divider content-position="left">查询结果</el-divider>
          
          <el-descriptions :column="2" border v-if="logisticsResult.order">
            <el-descriptions-item label="订单编号">{{ logisticsResult.order.order_no }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">{{ logisticsResult.current_status }}</el-descriptions-item>
            <el-descriptions-item label="收货人">{{ logisticsResult.order.receiver_name }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ logisticsResult.order.receiver_phone }}</el-descriptions-item>
            <el-descriptions-item label="收货地址" :span="2">{{ logisticsResult.order.shipping_address }}</el-descriptions-item>
          </el-descriptions>
          
          <el-divider content-position="left" v-if="logisticsResult.logistics.length > 0">物流轨迹</el-divider>
          
          <el-timeline v-if="logisticsResult.logistics.length > 0">
            <el-timeline-item
              v-for="(item, index) in logisticsResult.logistics"
              :key="item.id"
              :type="index === 0 ? 'primary' : ''"
              :timestamp="formatTime(item.created_at)"
              placement="top"
            >
              <el-card>
                <h4>{{ item.status }}</h4>
                <p>{{ item.description }}</p>
                <p v-if="item.location">当前位置: {{ item.location }}</p>
                <p v-if="item.operator">操作员: {{ item.operator }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          
          <el-empty v-else description="暂无物流信息" />
        </div>
      </el-card>
    </template>

    <el-dialog
      v-model="detailVisible"
      title="订单详情"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单编号">{{ currentOrder.order_no }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(currentOrder.status)">{{ currentOrder.status_text }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ currentOrder.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="客户账号">{{ currentOrder.customer_account }}</el-descriptions-item>
        <el-descriptions-item label="订单金额" class="amount-text">¥{{ currentOrder.total_amount }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(currentOrder.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="收货人">{{ currentOrder.receiver_name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentOrder.receiver_phone }}</el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="2">{{ currentOrder.shipping_address }}</el-descriptions-item>
        <el-descriptions-item label="物流单号" :span="2">{{ currentOrder.logistics_no || '-' }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider>订单商品</el-divider>
      
      <el-table :data="currentOrder.items || []" border>
        <el-table-column prop="product_code" label="商品编号" />
        <el-table-column prop="product_name" label="商品名称" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="unit_price" label="单价">
          <template #default="{ row }">¥{{ row.unit_price }}</template>
        </el-table-column>
        <el-table-column prop="total_price" label="小计">
          <template #default="{ row }">¥{{ row.total_price }}</template>
        </el-table-column>
      </el-table>
      
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="shipVisible"
      title="发货"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="shipForm" label-width="100px">
        <el-form-item label="物流编号">
          <el-input v-model="shipForm.logisticsNo" placeholder="请输入物流编号（可选）" />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="shipForm.operator" placeholder="请输入操作人" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipVisible = false">取消</el-button>
        <el-button type="primary" :loading="shipLoading" @click="handleConfirmShip">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'

const loading = ref(false)
const shipLoading = ref(false)
const activeTab = ref('all')
const detailVisible = ref(false)
const shipVisible = ref(false)

const searchForm = reactive({
  keyword: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const orderList = ref([])
const currentOrder = ref({})
const shipForm = reactive({
  orderId: '',
  logisticsNo: '',
  operator: ''
})

const logisticsForm = reactive({
  logisticsNo: '',
  orderNo: ''
})

const logisticsResult = ref(null)

const statusMap = {
  1: '待付款',
  2: '待发货',
  3: '已发货',
  4: '已完成',
  5: '待退款',
  6: '已退款'
}

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

function getStatusType(status) {
  const types = {
    1: 'warning',
    2: 'primary',
    3: 'info',
    4: 'success',
    5: 'danger',
    6: ''
  }
  return types[status] || ''
}

async function loadOrderList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    if (activeTab.value === 'pending_ship') {
      params.orderType = 'pending_ship'
    } else if (activeTab.value === 'pending_refund') {
      params.orderType = 'pending_refund'
    }
    
    const res = await request.get('/api/orders', { params })
    if (res.success) {
      orderList.value = res.data.list.map(item => ({
        ...item,
        status_text: statusMap[item.status] || '未知'
      }))
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('加载订单列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleTabChange() {
  pagination.page = 1
  searchForm.keyword = ''
  searchForm.status = ''
  if (activeTab.value !== 'logistics') {
    loadOrderList()
  }
}

function handleSearch() {
  pagination.page = 1
  loadOrderList()
}

function handleReset() {
  Object.assign(searchForm, {
    keyword: '',
    status: ''
  })
  pagination.page = 1
  loadOrderList()
}

async function handleView(row) {
  try {
    const res = await request.get(`/api/orders/${row.id}`)
    if (res.success) {
      currentOrder.value = {
        ...res.data,
        status_text: statusMap[res.data.status] || '未知'
      }
      detailVisible.value = true
    }
  } catch (error) {
    console.error('获取订单详情失败:', error)
  }
}

function handleShip(row) {
  shipForm.orderId = row.id
  shipForm.logisticsNo = ''
  shipForm.operator = ''
  shipVisible.value = true
}

async function handleConfirmShip() {
  shipLoading.value = true
  try {
    const res = await request.post(`/api/orders/${shipForm.orderId}/ship`, shipForm)
    if (res.success) {
      ElMessage.success('发货成功')
      shipVisible.value = false
      loadOrderList()
    }
  } catch (error) {
    console.error('发货失败:', error)
  } finally {
    shipLoading.value = false
  }
}

async function handleQueryLogistics() {
  if (!logisticsForm.logisticsNo && !logisticsForm.orderNo) {
    ElMessage.warning('请输入物流编号或订单编号')
    return
  }
  
  try {
    const params = {}
    if (logisticsForm.logisticsNo) {
      params.logisticsNo = logisticsForm.logisticsNo
    }
    if (logisticsForm.orderNo) {
      params.orderNo = logisticsForm.orderNo
    }
    
    const res = await request.get('/api/orders/logistics/query', { params })
    if (res.success) {
      logisticsResult.value = res.data
    }
  } catch (error) {
    console.error('查询物流失败:', error)
  }
}

onMounted(() => {
  if (activeTab.value !== 'logistics') {
    loadOrderList()
  }
})
</script>

<style scoped>
.order-container {
  min-height: 100%;
}

.tabs-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.search-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.search-form {
  flex-wrap: wrap;
}

.table-card,
.logistics-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.amount-text {
  color: #f56c6c;
  font-weight: 600;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.logistics-result {
  margin-top: 20px;
}
</style>
