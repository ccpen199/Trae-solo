<template>
  <div class="order-detail-page">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="header-row">
              <span>订单详情</span>
              <el-tag :type="getStatusType(order.status)" size="large">
                {{ getStatusName(order.status) }}
              </el-tag>
            </div>
          </template>
          
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ order.order_number }}</el-descriptions-item>
            <el-descriptions-item label="旅客姓名">{{ order.passenger_name }}</el-descriptions-item>
            <el-descriptions-item label="证件类型">{{ order.id_type }}</el-descriptions-item>
            <el-descriptions-item label="证件号码">{{ order.id_number }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ order.phone }}</el-descriptions-item>
            <el-descriptions-item label="订单金额">
              <span class="price">¥{{ order.total_amount }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ order.created_at }}</el-descriptions-item>
            <el-descriptions-item label="支付时间">{{ order.payment_time || '未支付' }}</el-descriptions-item>
          </el-descriptions>

          <el-divider content-position="left">航班信息</el-divider>
          
          <el-descriptions :column="2" border v-if="order.flight_number">
            <el-descriptions-item label="航班号">{{ order.flight_number }}</el-descriptions-item>
            <el-descriptions-item label="航空公司">{{ order.airline_name }}</el-descriptions-item>
            <el-descriptions-item label="出发机场">{{ order.departure_airport }}</el-descriptions-item>
            <el-descriptions-item label="到达机场">{{ order.arrival_airport }}</el-descriptions-item>
            <el-descriptions-item label="出发时间">{{ order.departure_time }}</el-descriptions-item>
            <el-descriptions-item label="到达时间">{{ order.arrival_time }}</el-descriptions-item>
            <el-descriptions-item label="舱位等级">{{ order.cabin_class }}</el-descriptions-item>
            <el-descriptions-item label="票价类型">{{ order.fare_type || '-' }}</el-descriptions-item>
          </el-descriptions>

          <el-divider content-position="left">机票信息</el-divider>
          
          <el-descriptions :column="2" border v-if="order.ticket_number">
            <el-descriptions-item label="机票号">{{ order.ticket_number }}</el-descriptions-item>
            <el-descriptions-item label="出票时间">{{ order.issue_time }}</el-descriptions-item>
            <el-descriptions-item label="机票状态">
              <el-tag :type="order.ticket_status === 'issued' ? 'success' : 'info'">
                {{ order.ticket_status === 'issued' ? '已出票' : '未出票' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
          
          <el-empty v-else description="暂无机票信息" :image-size="60" />

          <el-divider content-position="left">操作记录</el-divider>
          
          <el-timeline>
            <el-timeline-item
              v-for="log in operationLogs"
              :key="log.id"
              :timestamp="log.created_at"
              placement="top"
              :type="getLogType(log.action)"
            >
              <div class="log-content">
                <div class="log-action">{{ getActionName(log.action) }}</div>
                <div class="log-status">
                  <span v-if="log.previous_status">
                    {{ getStatusName(log.previous_status) }}
                    <el-icon style="margin: 0 8px"><ArrowRight /></el-icon>
                  </span>
                  {{ getStatusName(log.new_status) }}
                </div>
                <div class="log-details" v-if="log.details">
                  <el-tag size="small" type="info">{{ log.details }}</el-tag>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
          
          <el-empty v-if="operationLogs.length === 0" description="暂无操作记录" :image-size="60" />
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>可用操作</span>
          </template>
          
          <div class="action-section">
            <template v-if="order.status === 'pending_query'">
              <p class="action-desc">当前状态：等待代理查询航班信息</p>
              <el-alert type="info" :closable="false" style="margin-bottom: 16px">
                <template #title>
                  请代理完成航班查询后，选择舱位和票价
                </template>
              </el-alert>
              
              <el-form :model="queryForm" v-if="canSubmitQuery">
                <el-form-item label="选择航班">
                  <el-select v-model="queryForm.flightId" placeholder="请选择航班" style="width: 100%" @change="onFlightChange">
                    <el-option
                      v-for="flight in availableFlights"
                      :key="flight.id"
                      :label="`${flight.flight_number} - ${flight.departure_airport}→${flight.arrival_airport}`"
                      :value="flight.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="选择舱位">
                  <el-select v-model="queryForm.cabinId" placeholder="请选择舱位" style="width: 100%" @change="onCabinChange">
                    <el-option
                      v-for="cabin in availableCabins"
                      :key="cabin.id"
                      :label="`${cabin.cabin_class} - ¥${cabin.price}`"
                      :value="cabin.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="选择票价">
                  <el-select v-model="queryForm.fareId" placeholder="请选择票价类型" style="width: 100%">
                    <el-option
                      v-for="fare in availableFares"
                      :key="fare.id"
                      :label="`${fare.fare_type} - ¥${fare.total_price} (${fare.refundable ? '可退' : '不可退'}/${fare.changeable ? '可改' : '不可改'})`"
                      :value="fare.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleSubmitQuery" :loading="submitting" style="width: 100%">
                    提交航班查询
                  </el-button>
                </el-form-item>
              </el-form>
            </template>

            <template v-else-if="order.status === 'pending_select'">
              <p class="action-desc">当前状态：等待选择舱位和票价</p>
              <el-alert type="warning" :closable="false" style="margin-bottom: 16px">
                <template #title>
                  请选择舱位和票价类型
                </template>
              </el-alert>
              
              <el-form :model="selectForm" v-if="canSelectCabin">
                <el-form-item label="选择舱位">
                  <el-select v-model="selectForm.cabinId" placeholder="请选择舱位" style="width: 100%" @change="onSelectCabinChange">
                    <el-option
                      v-for="cabin in availableCabins"
                      :key="cabin.id"
                      :label="`${cabin.cabin_class} - ¥${cabin.price}`"
                      :value="cabin.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="选择票价">
                  <el-select v-model="selectForm.fareId" placeholder="请选择票价类型" style="width: 100%">
                    <el-option
                      v-for="fare in availableFaresForSelect"
                      :key="fare.id"
                      :label="`${fare.fare_type} - ¥${fare.total_price}`"
                      :value="fare.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="选座（可选）">
                  <el-input v-model="selectForm.seatNumber" placeholder="如：12A" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleSelectCabin" :loading="selecting" style="width: 100%">
                    确认选舱（锁定15分钟）
                  </el-button>
                </el-form-item>
              </el-form>
            </template>

            <template v-else-if="order.status === 'pending_payment'">
              <p class="action-desc">当前状态：等待支付出票</p>
              <el-alert type="primary" :closable="false" style="margin-bottom: 16px">
                <template #title>
                  请在15分钟内完成支付，否则舱位将被释放
                </template>
              </el-alert>
              
              <el-form :model="paymentForm" v-if="canPay">
                <el-form-item label="支付金额">
                  <el-input :value="`¥${order.total_amount}`" disabled />
                </el-form-item>
                <el-form-item label="支付渠道">
                  <el-select v-model="paymentForm.paymentChannelId" placeholder="请选择支付渠道" style="width: 100%">
                    <el-option label="支付宝" :value="1" />
                    <el-option label="微信支付" :value="2" />
                    <el-option label="银联支付" :value="3" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="success" @click="handlePay" :loading="paying" style="width: 100%">
                    立即支付
                  </el-button>
                </el-form-item>
              </el-form>
            </template>

            <template v-else-if="order.status === 'itinerary_notified'">
              <p class="action-desc">当前状态：已出票，行程已通知</p>
              <el-alert type="success" :closable="false" style="margin-bottom: 16px">
                <template #title>
                  机票已出票，可申请改签或退票
                </template>
              </el-alert>
              
              <el-form :model="rebookRefundForm" v-if="canRequestRebookRefund">
                <el-form-item label="申请类型">
                  <el-radio-group v-model="rebookRefundForm.requestType">
                    <el-radio value="rebook">改签</el-radio>
                    <el-radio value="refund">退票</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="申请原因">
                  <el-input
                    v-model="rebookRefundForm.reason"
                    type="textarea"
                    :rows="3"
                    placeholder="请填写申请原因"
                  />
                </el-form-item>
                <el-form-item v-if="rebookRefundForm.requestType === 'rebook'" label="新航班（可选）">
                  <el-select v-model="rebookRefundForm.newFlightId" placeholder="请选择新航班" style="width: 100%" clearable>
                    <el-option
                      v-for="flight in availableFlights"
                      :key="flight.id"
                      :label="`${flight.flight_number} - ${flight.departure_airport}→${flight.arrival_airport}`"
                      :value="flight.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="warning" @click="handleRebookRefund" :loading="requesting" style="width: 100%">
                    提交{{ rebookRefundForm.requestType === 'rebook' ? '改签' : '退票' }}申请
                  </el-button>
                </el-form-item>
              </el-form>
            </template>

            <template v-else-if="order.status === 'pending_rebook_refund'">
              <p class="action-desc">当前状态：退改签申请待审批</p>
              <el-alert type="warning" :closable="false" style="margin-bottom: 16px">
                <template #title>
                  等待客服审批退改签申请
                </template>
              </el-alert>
              
              <div v-if="canProcessRebookRefund" class="process-section">
                <el-divider>审批操作</el-divider>
                <el-form :model="processForm">
                  <el-form-item label="审批意见">
                    <el-input
                      v-model="processForm.approvalComments"
                      type="textarea"
                      :rows="3"
                      placeholder="请填写审批意见"
                    />
                  </el-form-item>
                  <el-row :gutter="10">
                    <el-col :span="12">
                      <el-button type="success" @click="handleApprove" :loading="processing" style="width: 100%">
                        通过
                      </el-button>
                    </el-col>
                    <el-col :span="12">
                      <el-button type="danger" @click="handleReject" :loading="processing" style="width: 100%">
                        驳回
                      </el-button>
                    </el-col>
                  </el-row>
                  <el-row :gutter="10" style="margin-top: 10px">
                    <el-col :span="12">
                      <el-button type="warning" @click="handleRequestMoreInfo" :loading="processing" style="width: 100%">
                        补充资料
                      </el-button>
                    </el-col>
                    <el-col :span="12">
                      <el-button type="info" @click="handleReassign" :loading="processing" style="width: 100%">
                        转派
                      </el-button>
                    </el-col>
                  </el-row>
                </el-form>
              </div>
            </template>

            <template v-else>
              <p class="action-desc">当前状态：{{ getStatusName(order.status) }}</p>
              <el-alert type="info" :closable="false">
                <template #title>
                  订单已结束，无可用操作
                </template>
              </el-alert>
            </template>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import api from '@/api'
import { ElMessage } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const orderId = computed(() => parseInt(route.params.id))

const order = ref({})
const operationLogs = ref([])
const availableFlights = ref([])
const availableCabins = ref([])
const availableFares = ref([])
const availableFaresForSelect = ref([])

const submitting = ref(false)
const selecting = ref(false)
const paying = ref(false)
const requesting = ref(false)
const processing = ref(false)

const queryForm = reactive({
  flightId: null,
  cabinId: null,
  fareId: null
})

const selectForm = reactive({
  cabinId: null,
  fareId: null,
  seatNumber: ''
})

const paymentForm = reactive({
  paymentChannelId: 1
})

const rebookRefundForm = reactive({
  requestType: 'rebook',
  reason: '',
  newFlightId: null
})

const processForm = reactive({
  approvalComments: '',
  refundAmount: null,
  additionalFee: null
})

const canSubmitQuery = computed(() => userStore.userRole === 'agent' || userStore.userRole === 'admin')
const canSelectCabin = computed(() => userStore.canPerformAction('select_cabin'))
const canPay = computed(() => userStore.canPerformAction('create_order') || userStore.userRole === 'admin')
const canRequestRebookRefund = computed(() => userStore.canPerformAction('request_rebook') || userStore.canPerformAction('request_refund'))
const canProcessRebookRefund = computed(() => userStore.canPerformAction('approve') || userStore.canPerformAction('reject'))

const loadOrder = async () => {
  try {
    order.value = await api.get(`/orders/${orderId.value}`)
    operationLogs.value = order.value.operation_logs || []
  } catch (error) {
    console.error('加载订单失败:', error)
  }
}

const loadFlights = async () => {
  try {
    availableFlights.value = await api.get('/flights/search')
  } catch (error) {
    console.error('加载航班失败:', error)
  }
}

const onFlightChange = async (flightId) => {
  if (!flightId) return
  try {
    availableCabins.value = await api.get(`/flights/cabins/${flightId}`)
    availableFares.value = []
    queryForm.cabinId = null
    queryForm.fareId = null
  } catch (error) {
    console.error('加载舱位失败:', error)
  }
}

const onCabinChange = (cabinId) => {
  if (!cabinId) return
  const cabin = availableCabins.value.find(c => c.id === cabinId)
  if (cabin) {
    availableFares.value = cabin.fares || []
  }
  queryForm.fareId = null
}

const onSelectCabinChange = (cabinId) => {
  if (!cabinId) return
  const cabin = availableCabins.value.find(c => c.id === cabinId)
  if (cabin) {
    availableFaresForSelect.value = cabin.fares || []
  }
  selectForm.fareId = null
}

const handleSubmitQuery = async () => {
  if (!queryForm.flightId || !queryForm.cabinId || !queryForm.fareId) {
    ElMessage.warning('请选择航班、舱位和票价')
    return
  }
  
  submitting.value = true
  try {
    await api.post(`/orders/${orderId.value}/submit-query`, {
      flightId: queryForm.flightId,
      cabinId: queryForm.cabinId,
      fareId: queryForm.fareId
    })
    ElMessage.success('航班查询已提交')
    loadOrder()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitting.value = false
  }
}

const handleSelectCabin = async () => {
  if (!selectForm.cabinId || !selectForm.fareId) {
    ElMessage.warning('请选择舱位和票价')
    return
  }
  
  selecting.value = true
  try {
    await api.post(`/orders/${orderId.value}/select-cabin`, {
      cabinId: selectForm.cabinId,
      fareId: selectForm.fareId,
      seatNumber: selectForm.seatNumber
    })
    ElMessage.success('舱位已锁定，请在15分钟内完成支付')
    loadOrder()
  } catch (error) {
    console.error('选舱失败:', error)
  } finally {
    selecting.value = false
  }
}

const handlePay = async () => {
  if (!paymentForm.paymentChannelId) {
    ElMessage.warning('请选择支付渠道')
    return
  }
  
  paying.value = true
  try {
    const result = await api.post(`/orders/${orderId.value}/pay-issue`, {
      paymentChannelId: paymentForm.paymentChannelId
    })
    ElMessage.success(`支付成功，机票号：${result.ticketNumber}`)
    loadOrder()
  } catch (error) {
    console.error('支付失败:', error)
  } finally {
    paying.value = false
  }
}

const handleRebookRefund = async () => {
  if (!rebookRefundForm.reason) {
    ElMessage.warning('请填写申请原因')
    return
  }
  
  requesting.value = true
  try {
    await api.post(`/orders/${orderId.value}/rebook-refund`, {
      requestType: rebookRefundForm.requestType,
      reason: rebookRefundForm.reason,
      newFlightId: rebookRefundForm.newFlightId
    })
    ElMessage.success('申请已提交，等待审批')
    loadOrder()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    requesting.value = false
  }
}

const processRebookRefund = async (action) => {
  processing.value = true
  try {
    await api.post('/orders/rebook-refund/1/process', {
      action,
      approvalComments: processForm.approvalComments,
      refundAmount: processForm.refundAmount,
      additionalFee: processForm.additionalFee
    })
    ElMessage.success(`操作成功：${action === 'approve' ? '通过' : action === 'reject' ? '驳回' : action === 'request_more_info' ? '要求补充资料' : '转派'}`)
    loadOrder()
  } catch (error) {
    console.error('处理失败:', error)
  } finally {
    processing.value = false
  }
}

const handleApprove = () => processRebookRefund('approve')
const handleReject = () => processRebookRefund('reject')
const handleRequestMoreInfo = () => processRebookRefund('request_more_info')
const handleReassign = () => processRebookRefund('reassign')

const getStatusType = (status) => {
  const typeMap = {
    pending_query: 'info',
    pending_select: 'warning',
    pending_payment: 'primary',
    itinerary_notified: 'success',
    pending_rebook_refund: 'danger',
    completed: 'success',
    cancelled: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusName = (status) => {
  const nameMap = {
    pending_query: '待查询航班',
    pending_select: '待选座选舱',
    pending_payment: '待支付出票',
    itinerary_notified: '行程通知',
    pending_rebook_refund: '待改签退票',
    completed: '已完成',
    cancelled: '已取消'
  }
  return nameMap[status] || status
}

const getActionName = (action) => {
  const nameMap = {
    create_order: '创建订单',
    submit_query: '提交航班查询',
    select_cabin: '选择舱位',
    pay_and_issue: '支付出票',
    request_rebook: '申请改签',
    request_refund: '申请退票',
    approve: '审批通过',
    reject: '审批驳回',
    cancel: '取消订单'
  }
  return nameMap[action] || action
}

const getLogType = (action) => {
  const typeMap = {
    create_order: 'primary',
    submit_query: 'warning',
    select_cabin: 'primary',
    pay_and_issue: 'success',
    approve: 'success',
    reject: 'danger',
    cancel: 'danger'
  }
  return typeMap[action] || 'info'
}

onMounted(() => {
  loadOrder()
  loadFlights()
})
</script>

<style scoped>
.order-detail-page {
  padding: 0;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  color: #F56C6C;
  font-weight: bold;
  font-size: 18px;
}

.action-section {
  min-height: 200px;
}

.action-desc {
  color: #666;
  margin-bottom: 16px;
}

.log-content {
  padding: 8px 0;
}

.log-action {
  font-weight: 500;
  margin-bottom: 4px;
}

.log-status {
  color: #666;
  font-size: 13px;
  margin-bottom: 4px;
}

.log-details {
  font-size: 12px;
}

.process-section {
  margin-top: 20px;
}
</style>
