<template>
  <div class="order-list-container">
    <el-card class="search-card">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="订单号/客户/收货人"
            clearable
            @keyup.enter="handleSearch"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="status in statusOptions"
              :key="status.value"
              :label="status.label"
              :value="status.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建订单
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="orderList"
        style="width: 100%"
        stripe
      >
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column prop="customer_name" label="客户" width="100" />
        <el-table-column prop="receiver_name" label="收货人" width="100" />
        <el-table-column prop="receiver_phone" label="收货电话" width="120" />
        <el-table-column prop="total_amount" label="订单金额" width="120" align="right">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold;">
              ¥{{ row.total_amount?.toFixed(2) || '0.00' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="deposit_amount" label="定金" width="100" align="right">
          <template #default="{ row }">
            ¥{{ row.deposit_amount?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="follow_status" label="跟进状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getFollowStatusType(row.follow_status)" size="small">
              {{ getFollowStatusLabel(row.follow_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" width="160">
          <template #default="{ row }">
            {{ row.created_at ? formatDate(row.created_at) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button
              v-if="row.status === 'pending_shipment'"
              type="success"
              link
              @click="handleShip(row)"
            >
              发货
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="shipDialogVisible"
      title="订单发货"
      width="500px"
    >
      <el-form :model="shipForm" label-width="100px">
        <el-form-item label="物流公司">
          <el-select
            v-model="shipForm.logisticsCompanyId"
            placeholder="请选择物流公司"
            style="width: 100%"
          >
            <el-option
              v-for="lc in logisticsCompanies"
              :key="lc.id"
              :label="lc.name"
              :value="lc.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="快递单号">
          <el-input v-model="shipForm.expressNo" placeholder="请输入快递单号" />
        </el-form-item>
        <el-form-item label="发货仓库">
          <el-select
            v-model="shipForm.warehouseId"
            placeholder="请选择发货仓库"
            style="width: 100%"
          >
            <el-option
              v-for="wh in warehouses"
              :key="wh.id"
              :label="wh.name"
              :value="wh.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="shipLoading" @click="handleShipSubmit">
          确认发货
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { getOrderList, shipOrder } from '@/api/orders'
import { getLogisticsCompanies, getWarehouses } from '@/api/common'

const router = useRouter()

const loading = ref(false)
const shipDialogVisible = ref(false)
const shipLoading = ref(false)
const shippingOrderId = ref(null)

const orderList = ref([])
const logisticsCompanies = ref([])
const warehouses = ref([])

const statusOptions = [
  { label: '待审核', value: 'pending_review' },
  { label: '待发货', value: 'pending_shipment' },
  { label: '已发货', value: 'shipped' },
  { label: '已签收', value: 'delivered' },
  { label: '已退货', value: 'returned' },
  { label: '已取消', value: 'cancelled' }
]

const searchForm = reactive({
  keyword: '',
  status: null,
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const shipForm = reactive({
  logisticsCompanyId: null,
  expressNo: '',
  warehouseId: null
})

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

const getStatusLabel = (status) => {
  const map = {
    pending_review: '待审核',
    pending_shipment: '待发货',
    shipped: '已发货',
    delivered: '已签收',
    returned: '已退货',
    cancelled: '已取消'
  }
  return map[status] || status
}

const getStatusType = (status) => {
  const map = {
    pending_review: 'warning',
    pending_shipment: 'warning',
    shipped: 'primary',
    delivered: 'success',
    returned: 'info',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

const getFollowStatusLabel = (status) => {
  const map = {
    normal: '正常',
    signed: '已签收',
    returned: '已退货',
    duplicate: '重复单'
  }
  return map[status] || '正常'
}

const getFollowStatusType = (status) => {
  const map = {
    normal: '',
    signed: 'success',
    returned: 'warning',
    duplicate: 'danger'
  }
  return map[status] || ''
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined,
      startDate: searchForm.dateRange?.[0] || undefined,
      endDate: searchForm.dateRange?.[1] || undefined
    }

    const res = await getOrderList(params)
    orderList.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('Fetch order list error:', error)
  } finally {
    loading.value = false
  }
}

const fetchCommonData = async () => {
  try {
    const [lcRes, whRes] = await Promise.all([
      getLogisticsCompanies(),
      getWarehouses()
    ])
    logisticsCompanies.value = lcRes.data || []
    warehouses.value = whRes.data || []
  } catch (error) {
    console.error('Fetch common data error:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = null
  searchForm.dateRange = []
  pagination.page = 1
  fetchData()
}

const handleCreate = () => {
  router.push('/orders-create')
}

const handleView = (row) => {
  router.push(`/orders/${row.id}`)
}

const handleShip = (row) => {
  shippingOrderId.value = row.id
  shipForm.logisticsCompanyId = null
  shipForm.expressNo = ''
  shipForm.warehouseId = null
  if (warehouses.value.length > 0) {
    shipForm.warehouseId = warehouses.value[0].id
  }
  shipDialogVisible.value = true
}

const handleShipSubmit = async () => {
  if (!shipForm.warehouseId) {
    ElMessage.warning('请选择发货仓库')
    return
  }

  shipLoading.value = true
  try {
    await shipOrder(shippingOrderId.value, {
      warehouseId: shipForm.warehouseId,
      logisticsCompanyId: shipForm.logisticsCompanyId,
      expressNo: shipForm.expressNo
    })
    ElMessage.success('发货成功')
    shipDialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('Ship order error:', error)
  } finally {
    shipLoading.value = false
  }
}

onMounted(() => {
  fetchCommonData()
  fetchData()
})
</script>

<style scoped>
.order-list-container {
  padding: 0;
}

.search-card,
.table-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
