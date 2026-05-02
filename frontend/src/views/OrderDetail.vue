<template>
  <div class="order-detail">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>订单详情 - {{ order?.order_no }}</span>
          <div>
            <el-button @click="goBack">返回列表</el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="16">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ order?.order_no }}</el-descriptions-item>
            <el-descriptions-item label="车牌号">{{ order?.plate_number }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusTagType(order?.status)">
                {{ order?.statusName }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="车位号">{{ order?.parking_space_no || '无' }}</el-descriptions-item>
            <el-descriptions-item label="入场时间">{{ order?.entry_time }}</el-descriptions-item>
            <el-descriptions-item label="出场时间">{{ order?.exit_time || '无' }}</el-descriptions-item>
            <el-descriptions-item label="应付金额">
              <span style="color: #F56C6C; font-weight: bold">¥{{ order?.total_amount || 0 }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="实付金额">
              <span style="color: #67C23A; font-weight: bold">¥{{ order?.paid_amount || 0 }}</span>
            </el-descriptions-item>
          </el-descriptions>

          <el-divider />

          <div class="action-section" v-if="order?.availableActions && order.availableActions.length > 0">
            <h4>可用操作</h4>
            <el-button type="primary" v-if="order.availableActions.includes('confirm_parking')" @click="handleConfirmParking">
              确认车位停放
            </el-button>
            <el-button type="success" v-if="order.availableActions.includes('approve')" @click="handleApprove">
              通过计费
            </el-button>
            <el-button type="danger" v-if="order.availableActions.includes('reject')" @click="handleReject">
              驳回
            </el-button>
            <el-button type="warning" v-if="order.availableActions.includes('supplement')" @click="handleSupplement">
              补充资料
            </el-button>
            <el-button type="primary" v-if="order.availableActions.includes('pay')" @click="handlePayment">
              支付抬杆
            </el-button>
            <el-button type="success" v-if="order.availableActions.includes('reconcile')" @click="handleReconcile">
              完成对账
            </el-button>
          </div>

          <el-divider />

          <h4>时间轴</h4>
          <el-timeline>
            <el-timeline-item
              v-for="item in timeline"
              :key="item.id"
              :timestamp="item.created_at"
              placement="top"
            >
              <el-card>
                <template #header>
                  <div class="timeline-header">
                    <span>{{ item.event_title }}</span>
                    <el-tag size="small">{{ item.operator_name || '系统' }}</el-tag>
                  </div>
                </template>
                <p>{{ item.event_content }}</p>
                <p v-if="item.remark" style="color: #909399; font-size: 12px">备注: {{ item.remark }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-col>

        <el-col :span="8">
          <el-card>
            <template #header>
              <span>订单明细</span>
            </template>
            <el-table :data="details" size="small">
              <el-table-column prop="detail_type" label="类型" width="100">
                <template #default="scope">
                  <el-tag size="small">{{ getDetailLabel(scope.row.detail_type) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="描述" />
              <el-table-column prop="amount" label="金额" width="80">
                <template #default="scope">
                  {{ scope.row.amount > 0 ? '¥' + scope.row.amount : '-' }}
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <el-card style="margin-top: 20px" v-if="payments && payments.length > 0">
            <template #header>
              <span>支付记录</span>
            </template>
            <el-table :data="payments" size="small">
              <el-table-column prop="payment_no" label="支付单号" />
              <el-table-column prop="amount" label="金额">
                <template #default="scope">
                  <span style="color: #F56C6C">¥{{ scope.row.amount }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 'paid' ? 'success' : 'info'" size="small">
                    {{ scope.row.status === 'paid' ? '已支付' : '待支付' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-dialog v-model="parkingDialogVisible" title="确认车位停放" width="500px">
      <el-form :model="parkingForm" label-width="100px">
        <el-form-item label="选择车位" required>
          <el-select v-model="parkingForm.parkingSpaceId" placeholder="请选择车位" style="width: 100%">
            <el-option
              v-for="space in availableSpaces"
              :key="space.id"
              :label="space.space_no"
              :value="space.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="parkingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitParking" :loading="actionLoading">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectDialogVisible" title="驳回原因" width="500px">
      <el-form :model="rejectForm" label-width="100px">
        <el-form-item label="驳回原因">
          <el-input
            v-model="rejectForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入驳回原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="submitReject" :loading="actionLoading">确认驳回</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="paymentDialogVisible" title="支付确认" width="500px">
      <el-alert
        title="支付金额"
        :description="`应付金额: ¥${order?.total_amount || 0}`"
        type="warning"
        show-icon
      />
      <el-form :model="paymentForm" label-width="100px" style="margin-top: 20px">
        <el-form-item label="支付方式">
          <el-radio-group v-model="paymentForm.paymentMethod">
            <el-radio value="wechat">微信支付</el-radio>
            <el-radio value="alipay">支付宝</el-radio>
            <el-radio value="cash">现金</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="paymentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPayment" :loading="actionLoading">确认支付</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { orderApi } from '@/api'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const actionLoading = ref(false)
const order = ref(null)
const details = ref([])
const timeline = ref([])
const payments = ref([])
const availableSpaces = ref([])

const parkingDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const paymentDialogVisible = ref(false)

const parkingForm = reactive({
  parkingSpaceId: null
})

const rejectForm = reactive({
  remark: ''
})

const paymentForm = reactive({
  paymentMethod: 'wechat'
})

const getStatusTagType = (status) => {
  const map = {
    pending_parking: 'primary',
    pending_billing: 'warning',
    pending_payment: 'danger',
    pending_reconciliation: 'info',
    completed: 'success'
  }
  return map[status] || 'info'
}

const getDetailLabel = (type) => {
  const map = {
    entry: '入场',
    parking: '停放',
    billing: '计费',
    payment: '支付'
  }
  return map[type] || type
}

const loadOrderDetail = async () => {
  loading.value = true
  try {
    const res = await orderApi.getDetail(route.params.id)
    order.value = res.data.order
    details.value = res.data.details
    timeline.value = res.data.timeline
    payments.value = res.data.payments
  } catch (error) {
    ElMessage.error('加载订单详情失败')
  } finally {
    loading.value = false
  }
}

const loadAvailableSpaces = async () => {
  try {
    availableSpaces.value = [
      { id: 1, space_no: 'A-001' },
      { id: 2, space_no: 'A-002' },
      { id: 3, space_no: 'A-003' },
      { id: 4, space_no: 'A-004' },
      { id: 5, space_no: 'A-005' }
    ]
  } catch (error) {
    console.error('加载车位失败:', error)
  }
}

const handleConfirmParking = () => {
  loadAvailableSpaces()
  parkingDialogVisible.value = true
}

const submitParking = async () => {
  if (!parkingForm.parkingSpaceId) {
    ElMessage.warning('请选择车位')
    return
  }
  actionLoading.value = true
  try {
    await orderApi.confirmParking({
      orderId: order.value.id,
      parkingSpaceId: parkingForm.parkingSpaceId,
      version: order.value.version
    })
    ElMessage.success('停放确认成功')
    parkingDialogVisible.value = false
    loadOrderDetail()
  } catch (error) {
    console.error('确认停放失败:', error)
  } finally {
    actionLoading.value = false
  }
}

const handleApprove = async () => {
  try {
    await ElMessageBox.confirm('确认通过计费审核？', '提示', { type: 'warning' })
    actionLoading.value = true
    await orderApi.processBilling({
      orderId: order.value.id,
      action: 'approve'
    })
    ElMessage.success('计费通过')
    loadOrderDetail()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('通过计费失败:', error)
    }
  } finally {
    actionLoading.value = false
  }
}

const handleReject = () => {
  rejectForm.remark = ''
  rejectDialogVisible.value = true
}

const submitReject = async () => {
  actionLoading.value = true
  try {
    await orderApi.processBilling({
      orderId: order.value.id,
      action: 'reject',
      remark: rejectForm.remark
    })
    ElMessage.success('已驳回')
    rejectDialogVisible.value = false
    loadOrderDetail()
  } catch (error) {
    console.error('驳回失败:', error)
  } finally {
    actionLoading.value = false
  }
}

const handleSupplement = async () => {
  try {
    await ElMessageBox.prompt('请输入需要补充的资料说明', '补充资料', {
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    }).then(async ({ value }) => {
      actionLoading.value = true
      await orderApi.processBilling({
        orderId: order.value.id,
        action: 'supplement',
        supplementReason: value
      })
      ElMessage.success('已提交补充资料要求')
      loadOrderDetail()
    })
  } catch (error) {
    if (error !== 'cancel') {
      console.error('补充资料失败:', error)
    }
  } finally {
    actionLoading.value = false
  }
}

const handlePayment = () => {
  paymentDialogVisible.value = true
}

const submitPayment = async () => {
  actionLoading.value = true
  try {
    await orderApi.processPayment({
      orderId: order.value.id,
      paymentMethod: paymentForm.paymentMethod,
      transactionId: 'TXN' + Date.now()
    })
    ElMessage.success('支付成功，已抬杆')
    paymentDialogVisible.value = false
    loadOrderDetail()
  } catch (error) {
    console.error('支付失败:', error)
  } finally {
    actionLoading.value = false
  }
}

const handleReconcile = async () => {
  try {
    await ElMessageBox.confirm('确认完成对账？', '提示', { type: 'warning' })
    actionLoading.value = true
    await orderApi.reconcile({
      orderId: order.value.id
    })
    ElMessage.success('对账完成')
    loadOrderDetail()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('对账失败:', error)
    }
  } finally {
    actionLoading.value = false
  }
}

const goBack = () => {
  router.push('/orders')
}

onMounted(() => {
  loadOrderDetail()
})
</script>

<style scoped>
.order-detail {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-section {
  margin-bottom: 20px;
}

.action-section h4 {
  margin-bottom: 12px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>