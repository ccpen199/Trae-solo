<template>
  <div class="card-container">
    <h3 style="margin-bottom: 20px;">审批管理</h3>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="待我审批" name="pending">
        <el-table :data="pendingApprovals" v-loading="loading" stripe @row-click="viewDetail" style="cursor: pointer;">
          <el-table-column prop="order_no" label="订单号" width="200" />
          <el-table-column prop="title" label="标题" min-width="200" />
          <el-table-column prop="creator_name" label="申请人" width="100" />
          <el-table-column prop="total_amount_with_tax" label="金额" width="120">
            <template #default="{ row }">
              ¥{{ row.total_amount_with_tax?.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="current_approval_node" label="当前节点" width="120" />
          <el-table-column prop="created_at" label="申请时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="text" size="small" @click.stop="viewDetail(row)">查看</el-button>
              <el-button type="primary" size="small" @click.stop="handleApprove(row)">审批</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="pendingApprovals.length === 0 && !loading" description="暂无待审批的申请" />
      </el-tab-pane>

      <el-tab-pane label="我已审批" name="approved">
        <el-table :data="approvedApprovals" v-loading="loading" stripe @row-click="viewDetail" style="cursor: pointer;">
          <el-table-column prop="order_no" label="订单号" width="200" />
          <el-table-column prop="title" label="标题" min-width="200" />
          <el-table-column prop="creator_name" label="申请人" width="100" />
          <el-table-column prop="total_amount_with_tax" label="金额" width="120">
            <template #default="{ row }">
              ¥{{ row.total_amount_with_tax?.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ getStatusName(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="申请时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="text" size="small" @click.stop="viewDetail(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="approvedApprovals.length === 0 && !loading" description="暂无已审批的申请" />
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showApprovalDialog" title="审批处理" width="500px">
      <el-descriptions :column="1" border style="margin-bottom: 20px;">
        <el-descriptions-item label="订单号">{{ currentOrder?.order_no }}</el-descriptions-item>
        <el-descriptions-item label="标题">{{ currentOrder?.title }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ currentOrder?.creator_name }}</el-descriptions-item>
        <el-descriptions-item label="金额">
          <span style="color: #f56c6c; font-weight: bold;">
            ¥{{ currentOrder?.total_amount_with_tax?.toFixed(2) }}
          </span>
        </el-descriptions-item>
      </el-descriptions>
      <el-form :model="approvalForm" label-width="80px">
        <el-form-item label="操作">
          <el-radio-group v-model="approvalForm.action">
            <el-radio value="approve">通过</el-radio>
            <el-radio value="reject">驳回</el-radio>
            <el-radio value="supplement">补充资料</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="意见">
          <el-input
            v-model="approvalForm.opinion"
            type="textarea"
            :rows="4"
            placeholder="请输入审批意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApprovalDialog = false">取消</el-button>
        <el-button type="primary" :loading="approving" @click="submitApproval">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const loading = ref(false)
const activeTab = ref('pending')
const allPurchases = ref([])
const showApprovalDialog = ref(false)
const currentOrder = ref(null)
const approving = ref(false)

const approvalForm = reactive({
  action: 'approve',
  opinion: ''
})

const pendingApprovals = computed(() => {
  return allPurchases.value.filter(item => item.status === 'pending_approval')
})

const approvedApprovals = computed(() => {
  return allPurchases.value.filter(item => 
    ['approved', 'rejected', 'settled'].includes(item.status)
  )
})

const statusMap = {
  draft: { name: '草稿', type: 'info' },
  submitted: { name: '已提交', type: 'warning' },
  pending_approval: { name: '待审批', type: 'warning' },
  approved: { name: '已通过', type: 'success' },
  rejected: { name: '已驳回', type: 'danger' },
  pending_order: { name: '待下单', type: 'primary' },
  ordered: { name: '已下单', type: 'primary' },
  receiving: { name: '收货中', type: 'warning' },
  received: { name: '已收货', type: 'success' },
  pending_settlement: { name: '待结算', type: 'warning' },
  settled: { name: '已结算', type: 'success' },
  archived: { name: '已归档', type: 'info' },
  cancelled: { name: '已取消', type: 'info' }
}

const getStatusName = (status) => statusMap[status]?.name || status
const getStatusType = (status) => statusMap[status]?.type || 'info'

const formatDate = (date) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const loadData = async () => {
  loading.value = true
  try {
    allPurchases.value = await request.get('/purchases/')
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

const viewDetail = (row) => {
  router.push(`/purchases/${row.id}`)
}

const handleApprove = (row) => {
  currentOrder.value = row
  approvalForm.action = 'approve'
  approvalForm.opinion = ''
  showApprovalDialog.value = true
}

const submitApproval = async () => {
  if (!currentOrder.value) return
  
  approving.value = true
  try {
    await request.post(`/purchases/${currentOrder.value.id}/approval`, approvalForm)
    ElMessage.success('审批完成')
    showApprovalDialog.value = false
    loadData()
  } catch (error) {
    console.error('审批失败:', error)
  } finally {
    approving.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
