<template>
  <div>
    <div class="page-title">
      <span>主单台账</span>
      <el-button type="primary" style="margin-left: 16px" @click="$router.push('/orders/create')">
        <el-icon><Plus /></el-icon>
        新建申报
      </el-button>
    </div>
    
    <el-card style="margin-bottom: 20px">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="单据编号">
          <el-input v-model="searchForm.keyword" placeholder="请输入" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 150px">
            <el-option v-for="s in statuses" :key="s.status" :label="s.display" :value="s.status" />
          </el-select>
        </el-form-item>
        <el-form-item label="税种">
          <el-select v-model="searchForm.taxTypeId" placeholder="全部税种" clearable style="width: 150px">
            <el-option v-for="t in taxTypes" :key="t.id" :label="t.taxName" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card>
      <el-table 
        :data="orderList" 
        v-loading="loading" 
        style="width: 100%"
        @row-click="viewOrder"
        :row-style="{ cursor: 'pointer' }"
      >
        <el-table-column prop="order_no" label="单据编号" min-width="180">
          <template #default="scope">
            <el-button type="primary" link @click.stop="viewOrder(scope.row)">
              {{ scope.row.order_no }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="tax_name" label="税种" width="100" />
        <el-table-column prop="status_display" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" size="small">
              {{ scope.row.status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="period_type" label="所属期类型" width="100">
          <template #default="scope">
            {{ scope.row.period_type === 'monthly' ? '月度' : scope.row.period_type === 'quarterly' ? '季度' : scope.row.period_type || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="金额" width="120">
          <template #default="scope">
            <span style="font-weight: 500">¥{{ scope.row.total_amount?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_tax_amount" label="税额" width="120">
          <template #default="scope">
            <span style="color: #f56c6c; font-weight: 500">¥{{ scope.row.total_tax_amount?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="risk_level" label="风险等级" width="100">
          <template #default="scope">
            <el-tag 
              :type="scope.row.risk_level === 'high' ? 'danger' : scope.row.risk_level === 'medium' ? 'warning' : 'info'" 
              size="small"
              effect="plain"
            >
              {{ scope.row.risk_level === 'high' ? '高' : scope.row.risk_level === 'medium' ? '中' : scope.row.risk_level === 'low' ? '低' : '无' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="responsible_person_name" label="责任人" width="100" />
        <el-table-column prop="created_by_name" label="创建人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="170">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click.stop="viewOrder(scope.row)">
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="fetchOrders"
        @current-change="fetchOrders"
      />
      
      <el-empty v-if="!loading && orderList.length === 0" description="暂无数据" />
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { getOrderList, getTaxTypes, getStatuses } from '@/api/order'

const router = useRouter()

const loading = ref(false)
const statuses = ref([])
const taxTypes = ref([])
const orderList = ref([])

const searchForm = reactive({
  keyword: '',
  status: '',
  taxTypeId: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const fetchTaxTypes = async () => {
  try {
    const res = await getTaxTypes()
    taxTypes.value = res.data
  } catch (e) {
    console.error('Fetch tax types error:', e)
  }
}

const fetchStatuses = async () => {
  try {
    const res = await getStatuses()
    statuses.value = res.data
  } catch (e) {
    console.error('Fetch statuses error:', e)
  }
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.taxTypeId) params.taxTypeId = searchForm.taxTypeId
    
    const res = await getOrderList(params)
    orderList.value = res.data.list
    pagination.total = res.data.pagination.total
  } catch (e) {
    console.error('Fetch orders error:', e)
  } finally {
    loading.value = false
  }
}

const getStatusType = (status) => {
  const map = {
    draft: 'info',
    pending_tax_calculation: 'warning',
    pending_declaration: 'warning',
    pending_receipt: 'warning',
    pending_risk_check: 'warning',
    supplement: 'danger',
    completed: 'success',
    rejected: 'danger',
    cancelled: 'info'
  }
  return map[status] || 'info'
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const viewOrder = (row) => {
  router.push(`/orders/${row.id}`)
}

const handleSearch = () => {
  pagination.page = 1
  fetchOrders()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.taxTypeId = ''
  pagination.page = 1
  fetchOrders()
}

onMounted(() => {
  fetchTaxTypes()
  fetchStatuses()
  fetchOrders()
})
</script>
