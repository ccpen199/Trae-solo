<template>
  <div class="card-container">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h3>采购申请详情</h3>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card v-loading="loading">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>{{ purchase?.title }}</span>
              <el-tag :type="getStatusType(purchase?.status)" size="large">
                {{ getStatusName(purchase?.status) }}
              </el-tag>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ purchase?.order_no }}</el-descriptions-item>
            <el-descriptions-item label="申请人">{{ purchase?.creator_name }}</el-descriptions-item>
            <el-descriptions-item label="申请部门">{{ purchase?.department || '-' }}</el-descriptions-item>
            <el-descriptions-item label="当前节点">{{ purchase?.current_approval_node || '-' }}</el-descriptions-item>
            <el-descriptions-item label="总金额">
              <span style="color: #f56c6c; font-weight: bold; font-size: 18px;">
                ¥{{ purchase?.total_amount_with_tax?.toFixed(2) }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="期望完成日期">
              {{ purchase?.expected_completion_date ? formatDate(purchase.expected_completion_date) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(purchase?.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="提交时间">
              {{ purchase?.submitted_at ? formatDate(purchase.submitted_at) : '-' }}
            </el-descriptions-item>
          </el-descriptions>

          <el-divider>商品明细</el-divider>
          <el-table :data="purchase?.items || []" stripe>
            <el-table-column prop="product_code" label="商品编码" width="120" />
            <el-table-column prop="product_name" label="商品名称" />
            <el-table-column prop="specification" label="规格" width="150" />
            <el-table-column prop="unit" label="单位" width="60" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="unit_price" label="单价" width="100">
              <template #default="{ row }">
                ¥{{ row.unit_price?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="amount_with_tax" label="价税合计" width="120">
              <template #default="{ row }">
                ¥{{ row.amount_with_tax?.toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>

          <el-divider>描述</el-divider>
          <div v-if="purchase?.description" style="padding: 10px; background: #f5f7fa;">
            {{ purchase.description }}
          </div>
          <el-empty v-else description="暂无描述" />

          <el-divider>操作日志</el-divider>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in timeline"
              :key="index"
              :timestamp="item.time"
              placement="top"
              :type="item.type === 'approval' ? 'primary' : 'info'"
            >
              <h4>{{ item.operation }}</h4>
              <p>操作人: {{ item.operator || '-' }}</p>
              <p v-if="item.remark">备注: {{ item.remark }}</p>
              <p v-if="item.opinion">审批意见: {{ item.opinion }}</p>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <span>可用操作</span>
          </template>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <el-button
              v-if="purchase?.status === 'draft' && purchase.created_by === userInfo?.id"
              type="primary"
              @click="submitPurchase"
            >
              提交申请
            </el-button>
            <el-button
              v-if="purchase?.status === 'pending_approval'"
              type="warning"
              @click="showApprovalDialog = true"
            >
              审批处理
            </el-button>
          </div>
        </el-card>

        <el-card style="margin-top: 20px;">
          <template #header>
            <span>金额明细</span>
          </template>
          <div style="display: flex; flex-direction: column; gap: 15px;">
            <div style="display: flex; justify-content: space-between;">
              <span>商品金额:</span>
              <span>¥{{ purchase?.total_amount?.toFixed(2) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>税额:</span>
              <span>¥{{ purchase?.tax_amount?.toFixed(2) }}</span>
            </div>
            <el-divider style="margin: 5px 0;" />
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
              <span>价税合计:</span>
              <span style="color: #f56c6c;">¥{{ purchase?.total_amount_with_tax?.toFixed(2) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showApprovalDialog" title="审批处理" width="500px">
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
        <el-button type="primary" :loading="approving" @click="handleApproval">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const loading = ref(false)
const purchase = ref(null)
const timeline = ref([])
const showApprovalDialog = ref(false)
const approving = ref(false)

const approvalForm = reactive({
  action: 'approve',
  opinion: ''
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

const loadPurchase = async () => {
  loading.value = true
  try {
    purchase.value = await request.get(`/purchases/${route.params.id}`)
    await loadTimeline()
  } catch (error) {
    console.error('加载详情失败:', error)
  } finally {
    loading.value = false
  }
}

const loadTimeline = async () => {
  try {
    const result = await request.get(`/purchases/${route.params.id}/timeline`)
    timeline.value = result.timeline || []
  } catch (error) {
    console.error('加载时间线失败:', error)
  }
}

const submitPurchase = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要提交采购申请 "${purchase.value.title}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await request.post(`/purchases/${route.params.id}/submit`)
    ElMessage.success('提交成功')
    loadPurchase()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('提交失败:', error)
    }
  }
}

const handleApproval = async () => {
  approving.value = true
  try {
    await request.post(`/purchases/${route.params.id}/approval`, approvalForm)
    ElMessage.success('审批完成')
    showApprovalDialog.value = false
    loadPurchase()
  } catch (error) {
    console.error('审批失败:', error)
  } finally {
    approving.value = false
  }
}

onMounted(() => {
  loadPurchase()
})
</script>
