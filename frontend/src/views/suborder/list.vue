<template>
  <div class="suborder-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>子订单管理</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="子订单号">
          <el-input v-model="searchForm.subOrderNo" placeholder="请输入子订单号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待预付" value="PENDING_PREPAYMENT" />
            <el-option label="已预付" value="PREPAYMENT_PAID" />
            <el-option label="采集中" value="IN_COLLECTION" />
            <el-option label="质检完成" value="QUALITY_CHECKED" />
            <el-option label="运输中" value="IN_TRANSPORT" />
            <el-option label="已到货" value="DELIVERED" />
            <el-option label="已结算" value="SETTLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="subOrders" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="subOrderNo" label="子订单号" width="200" />
        <el-table-column label="主订单号" width="200">
          <template #default="{ row }">
            <el-button type="primary" text @click="viewMainOrder(row.mainOrderId)">
              {{ row.mainOrderId }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="产品名称" />
        <el-table-column label="预计重量(kg)" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.expectedWeight) }}
          </template>
        </el-table-column>
        <el-table-column label="实际重量(kg)" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.actualWeight) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="预计金额(元)" width="120">
          <template #default="{ row }">
            ¥{{ formatNumber(row.expectedAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="实际金额(元)" width="120">
          <template #default="{ row }">
            {{ row.actualAmount ? `¥${formatNumber(row.actualAmount)}` : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="质检等级" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.qualityGrade" :type="getGradeType(row.qualityGrade)">
              {{ getGradeText(row.qualityGrade) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text @click="viewDetail(row.id)">详情</el-button>
            <el-button
              v-if="['PREPAYMENT_PAID', 'IN_COLLECTION'].includes(row.status)"
              type="success"
              text
              @click="openReportWeight(row)"
            >
              上报重量
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
        @size-change="loadSubOrders"
        @current-change="loadSubOrders"
      />
    </el-card>

    <el-dialog v-model="reportWeightVisible" title="上报实采重量" width="500px">
      <el-form :model="reportForm" label-width="120px">
        <el-form-item label="子订单号">
          <span>{{ reportForm.subOrderNo }}</span>
        </el-form-item>
        <el-form-item label="产品名称">
          <span>{{ reportForm.productName }}</span>
        </el-form-item>
        <el-form-item label="预计重量">
          <span>{{ formatNumber(reportForm.expectedWeight) }} kg</span>
        </el-form-item>
        <el-form-item label="实采重量">
          <el-input-number
            v-model="reportForm.actualWeight"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
          <div style="margin-top: 8px; color: #909399; font-size: 12px">
            容差范围：{{ formatNumber(reportForm.expectedWeight * (1 - toleranceRate)) }} - 
            {{ formatNumber(reportForm.expectedWeight * (1 + toleranceRate)) }} kg
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="reportForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportWeightVisible = false">取消</el-button>
        <el-button type="primary" :loading="reportLoading" @click="submitReportWeight">
          确认上报
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { orderApi } from '@/api/order'
import { useUserStore } from '@/stores/user'
import type { SubOrder, OrderStatus, QualityLevel } from '@/types'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const subOrders = ref<SubOrder[]>([])
const reportWeightVisible = ref(false)
const reportLoading = ref(false)
const toleranceRate = ref(0.05)

const searchForm = reactive({
  subOrderNo: '',
  status: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const reportForm = reactive({
  subOrderId: '',
  subOrderNo: '',
  productName: '',
  expectedWeight: 0,
  actualWeight: 0,
  remark: '',
})

const statusMap: Record<OrderStatus, { text: string; type: string }> = {
  DRAFT: { text: '草稿', type: 'info' },
  PENDING_PREPAYMENT: { text: '待预付', type: 'warning' },
  PREPAYMENT_PAID: { text: '已预付', type: '' },
  IN_COLLECTION: { text: '采集中', type: 'primary' },
  QUALITY_CHECKED: { text: '质检完成', type: '' },
  IN_TRANSPORT: { text: '运输中', type: 'primary' },
  DELIVERED: { text: '已到货', type: 'success' },
  SETTLED: { text: '已结算', type: 'success' },
  CANCELLED: { text: '已取消', type: 'danger' },
  EXCEPTION_HANDLING: { text: '异常处理', type: 'danger' },
  STORAGE_TRANSFERRED: { text: '货权转移', type: 'warning' },
}

const getStatusType = (status: OrderStatus) => statusMap[status]?.type || ''
const getStatusText = (status: OrderStatus) => statusMap[status]?.text || status

const gradeMap: Record<QualityLevel, { text: string; type: string }> = {
  PREMIUM: { text: '特级', type: 'success' },
  GRADE_A: { text: '一级', type: 'primary' },
  GRADE_B: { text: '二级', type: '' },
  GRADE_C: { text: '三级', type: 'info' },
  REJECTED: { text: '等外', type: 'danger' },
}

const getGradeType = (grade: QualityLevel) => gradeMap[grade]?.type || ''
const getGradeText = (grade: QualityLevel) => gradeMap[grade]?.text || grade

const formatNumber = (num: any) => {
  if (num?.toNumber) {
    return num.toNumber().toFixed(2)
  }
  return Number(num || 0).toFixed(2)
}

const loadSubOrders = async () => {
  loading.value = true
  try {
    const result = await orderApi.getMySubOrders(searchForm.status as OrderStatus)
    subOrders.value = result
    pagination.total = result.length
  } catch (error) {
    console.error('Failed to load suborders:', error)
    ElMessage.error('加载子订单列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadSubOrders()
}

const resetSearch = () => {
  searchForm.subOrderNo = ''
  searchForm.status = ''
  pagination.page = 1
  loadSubOrders()
}

const viewDetail = (id: string) => {
  router.push(`/orders/sub/${id}`)
}

const viewMainOrder = (mainOrderId: string) => {
  router.push(`/orders/${mainOrderId}`)
}

const openReportWeight = (row: SubOrder) => {
  reportForm.subOrderId = row.id
  reportForm.subOrderNo = row.subOrderNo
  reportForm.productName = row.productName
  reportForm.expectedWeight = row.expectedWeight
  reportForm.actualWeight = row.expectedWeight
  reportForm.remark = ''
  toleranceRate.value = 0.05
  reportWeightVisible.value = true
}

const submitReportWeight = async () => {
  if (reportForm.actualWeight <= 0) {
    ElMessage.warning('请输入有效的实采重量')
    return
  }

  reportLoading.value = true
  try {
    await orderApi.reportActualWeight(
      reportForm.subOrderId,
      reportForm.actualWeight,
      reportForm.remark
    )
    ElMessage.success('实采重量上报成功')
    reportWeightVisible.value = false
    loadSubOrders()
  } catch (error) {
    console.error('Failed to report weight:', error)
    ElMessage.error('上报失败')
  } finally {
    reportLoading.value = false
  }
}

onMounted(() => {
  loadSubOrders()
})
</script>

<style lang="scss" scoped>
.suborder-list {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .search-form {
    margin-bottom: 20px;
  }
}
</style>
