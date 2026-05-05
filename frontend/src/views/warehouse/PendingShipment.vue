<template>
  <div class="pending-shipment-container">
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
        <span>待发货订单</span>
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
        <el-table-column prop="receiver_address" label="收货地址" min-width="200">
          <template #default="{ row }">
            <el-tooltip :content="row.receiver_address" placement="top">
              <span>{{ row.receiver_address || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
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
        <el-table-column prop="created_at" label="下单时间" width="160">
          <template #default="{ row }">
            {{ row.created_at ? formatDate(row.created_at) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button type="success" link @click="handleShip(row)">发货</el-button>
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
      <el-form
        ref="shipFormRef"
        :model="shipForm"
        :rules="shipFormRules"
        label-width="100px"
      >
        <el-form-item label="发货仓库" prop="warehouseId">
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
        <el-form-item label="物流公司">
          <el-select
            v-model="shipForm.logisticsCompanyId"
            placeholder="请选择物流公司"
            style="width: 100%"
            clearable
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { getOrderList, shipOrder } from '@/api/orders'
import { getLogisticsCompanies, getWarehouses } from '@/api/common'

const router = useRouter()

const loading = ref(false)
const shipDialogVisible = ref(false)
const shipLoading = ref(false)
const shipFormRef = ref(null)
const shippingOrderId = ref(null)

const orderList = ref([])
const logisticsCompanies = ref([])
const warehouses = ref([])

const searchForm = reactive({
  keyword: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const shipForm = reactive({
  warehouseId: null,
  logisticsCompanyId: null,
  expressNo: ''
})

const shipFormRules = {
  warehouseId: [{ required: true, message: '请选择发货仓库', trigger: 'change' }]
}

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

const fetchCommonData = async () => {
  try {
    const [lcRes, whRes] = await Promise.all([
      getLogisticsCompanies(),
      getWarehouses()
    ])
    logisticsCompanies.value = lcRes.data || []
    warehouses.value = whRes.data || []
    if (warehouses.value.length > 0) {
      shipForm.warehouseId = warehouses.value[0].id
    }
  } catch (error) {
    console.error('Fetch common data error:', error)
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      status: 'pending_shipment',
      startDate: searchForm.dateRange?.[0] || undefined,
      endDate: searchForm.dateRange?.[1] || undefined
    }

    const res = await getOrderList(params)
    orderList.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('Fetch pending shipment list error:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.dateRange = []
  pagination.page = 1
  fetchData()
}

const handleView = (row) => {
  router.push(`/orders/${row.id}`)
}

const handleShip = (row) => {
  shippingOrderId.value = row.id
  shipForm.logisticsCompanyId = null
  shipForm.expressNo = ''
  if (warehouses.value.length > 0) {
    shipForm.warehouseId = warehouses.value[0].id
  }
  shipDialogVisible.value = true
}

const handleShipSubmit = async () => {
  if (!shipFormRef.value) return
  await shipFormRef.value.validate(async (valid) => {
    if (valid) {
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
  })
}

onMounted(() => {
  fetchCommonData()
  fetchData()
})
</script>

<style scoped>
.pending-shipment-container {
  padding: 0;
}

.search-card,
.table-card {
  margin-bottom: 20px;
  border-radius: 8px;
}
</style>
