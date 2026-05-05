<template>
  <div class="order-follow-container">
    <el-card class="search-card">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="订单号/客户/收货人/快递单号"
            clearable
            @keyup.enter="handleSearch"
            style="width: 220px"
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
        <el-form-item label="跟进状态">
          <el-select
            v-model="searchForm.followStatus"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="status in followStatusOptions"
              :key="status.value"
              :label="status.label"
              :value="status.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="发货时间">
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
        <span>订单跟进</span>
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
        <el-table-column prop="total_amount" label="订单金额" width="100" align="right">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold;">
              ¥{{ row.total_amount?.toFixed(2) || '0.00' }}
            </span>
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
        <el-table-column prop="tracking_no" label="快递单号" width="140">
          <template #default="{ row }">
            {{ row.tracking_no || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="shipped_at" label="发货时间" width="160">
          <template #default="{ row }">
            {{ row.shipped_at ? formatDate(row.shipped_at) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="250">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-dropdown trigger="click" @command="(command) => handleFollowStatusChange(row, command)">
              <el-button type="warning" link>
                更新状态
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="normal">正常</el-dropdown-item>
                  <el-dropdown-item command="signed">已签收</el-dropdown-item>
                  <el-dropdown-item command="returned">已退货</el-dropdown-item>
                  <el-dropdown-item command="duplicate">重复单</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button type="danger" link @click="handleCancel(row)">取消订单</el-button>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { getOrderList, updateOrderFollowStatus, cancelOrder } from '@/api/orders'

const router = useRouter()

const loading = ref(false)

const orderList = ref([])

const statusOptions = [
  { label: '待审核', value: 'pending_review' },
  { label: '待发货', value: 'pending_shipment' },
  { label: '已发货', value: 'shipped' },
  { label: '已签收', value: 'delivered' },
  { label: '已退货', value: 'returned' },
  { label: '已取消', value: 'cancelled' }
]

const followStatusOptions = [
  { label: '正常', value: 'normal' },
  { label: '已签收', value: 'signed' },
  { label: '已退货', value: 'returned' },
  { label: '重复单', value: 'duplicate' }
]

const searchForm = reactive({
  keyword: '',
  status: null,
  followStatus: null,
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
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
      followStatus: searchForm.followStatus || undefined,
      startDate: searchForm.dateRange?.[0] || undefined,
      endDate: searchForm.dateRange?.[1] || undefined
    }

    const res = await getOrderList(params)
    orderList.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('Fetch order follow list error:', error)
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
  searchForm.status = null
  searchForm.followStatus = null
  searchForm.dateRange = []
  pagination.page = 1
  fetchData()
}

const handleView = (row) => {
  router.push(`/orders/${row.id}`)
}

const handleFollowStatusChange = async (row, status) => {
  try {
    const statusLabel = getFollowStatusLabel(status)
    await ElMessageBox.confirm(`确定要将该订单的跟进状态设置为「${statusLabel}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await updateOrderFollowStatus(row.id, { followStatus: status })
    ElMessage.success('更新成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Update follow status error:', error)
    }
  }
}

const handleCancel = async (row) => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await cancelOrder(row.id)
    ElMessage.success('订单已取消')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Cancel order error:', error)
    }
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.order-follow-container {
  padding: 0;
}

.search-card,
.table-card {
  margin-bottom: 20px;
  border-radius: 8px;
}
</style>
