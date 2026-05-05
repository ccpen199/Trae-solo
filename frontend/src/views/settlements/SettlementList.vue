<template>
  <div class="settlement-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>费用结算</span>
          <div class="stats-summary">
            <el-statistic title="待结算" :value="stats.pending || 0" value-style="color: #f56c6c" />
            <el-statistic title="已确认" :value="stats.confirmed || 0" value-style="color: #67c23a" />
            <el-statistic title="总金额" :value="stats.total || 0" value-style="color: #409eff" prefix="¥" />
          </div>
        </div>
      </template>
      
      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="settlement_no" label="结算单号" width="150" />
        <el-table-column prop="order_no" label="订单号" width="150" />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 'income' ? 'success' : 'warning'" size="small">
              {{ row.type === 'income' ? '收入' : '支出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="vehicle_plate" label="车辆" width="100" />
        <el-table-column prop="driver_name" label="司机" width="80" />
        <el-table-column prop="total_amount" label="总金额" width="100">
          <template #default="{ row }">
            <span class="amount" :class="row.type === 'income' ? 'income' : 'expense'">
              {{ row.type === 'income' ? '+' : '-' }}¥{{ row.total_amount?.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="actual_amount" label="实际金额" width="100">
          <template #default="{ row }">
            <span class="amount" :class="row.type === 'income' ? 'income' : 'expense'">
              {{ row.type === 'income' ? '+' : '-' }}¥{{ row.actual_amount?.toFixed(2) || '0.00' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" type="primary" link @click="confirmSettlement(row)">确认</el-button>
            <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
    
    <el-dialog
      v-model="detailVisible"
      title="结算详情"
      width="600px"
    >
      <el-descriptions :column="2" border v-if="currentSettlement.id">
        <el-descriptions-item label="结算单号" :span="2">{{ currentSettlement.settlement_no }}</el-descriptions-item>
        <el-descriptions-item label="订单号">{{ currentSettlement.order_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag :type="currentSettlement.type === 'income' ? 'success' : 'warning'">
            {{ currentSettlement.type === 'income' ? '收入' : '支出' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="车辆">{{ currentSettlement.vehicle_plate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="司机">{{ currentSettlement.driver_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="运输费">¥{{ currentSettlement.transport_cost?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="燃油费">¥{{ currentSettlement.fuel_cost?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="路桥费">¥{{ currentSettlement.toll_cost?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="装卸费">¥{{ currentSettlement.loading_cost?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="总金额" :span="2">
          <span class="amount" :class="currentSettlement.type === 'income' ? 'income' : 'expense'">
            {{ currentSettlement.type === 'income' ? '+' : '-' }}¥{{ currentSettlement.total_amount?.toFixed(2) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentSettlement.status)">{{ getStatusText(currentSettlement.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="确认人">{{ currentSettlement.confirmed_by_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="确认时间" :span="2">{{ formatDate(currentSettlement.confirmed_at) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(currentSettlement.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDate(currentSettlement.updated_at) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentSettlement.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { getSettlementList, confirmSettlement as confirm, getSettlementStats } from '@/api/settlements'

const loading = ref(false)
const tableData = ref([])
const detailVisible = ref(false)
const stats = ref({
  pending: 0,
  confirmed: 0,
  total: 0
})
const currentSettlement = ref({})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const getStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    confirmed: 'success'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    pending: '待确认',
    confirmed: '已确认'
  }
  return textMap[status] || status
}

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

const fetchSettlementList = async () => {
  loading.value = true
  try {
    const res = await getSettlementList({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    tableData.value = res.data || []
    pagination.total = res.pagination?.total || 0
  } catch (error) {
    console.error('获取结算列表失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const res = await getSettlementStats()
    stats.value = res || {
      pending: 0,
      confirmed: 0,
      total: 0
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchSettlementList()
}

const handleCurrentChange = (val) => {
  pagination.page = val
  fetchSettlementList()
}

const viewDetail = (row) => {
  currentSettlement.value = row
  detailVisible.value = true
}

const confirmSettlement = async (row) => {
  try {
    await confirm(row.id)
    ElMessage.success('确认成功')
    fetchSettlementList()
    fetchStats()
  } catch (error) {
    console.error('确认失败:', error)
  }
}

onMounted(() => {
  fetchSettlementList()
  fetchStats()
})
</script>

<style scoped>
.settlement-list {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-summary {
  display: flex;
  gap: 30px;
}

.amount {
  font-weight: bold;
}

.amount.income {
  color: #67c23a;
}

.amount.expense {
  color: #f56c6c;
}
</style>
