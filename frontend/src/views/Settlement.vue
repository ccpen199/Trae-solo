<template>
  <div class="settlement">
    <el-card>
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="待结算" name="pending">
          <el-table :data="pendingOrders" border stripe>
            <el-table-column prop="order_no" label="订单号" width="150" />
            <el-table-column prop="patient_name" label="患者姓名" width="100" />
            <el-table-column prop="escort_name" label="陪诊师" width="100" />
            <el-table-column prop="service_fee" label="基础费" width="100">
              <template #default="{ row }">
                ¥{{ row.service_fee }}
              </template>
            </el-table-column>
            <el-table-column label="合计" width="100">
              <template #default="{ row }">
                <span class="total-fee">¥{{ row.total_fee }}</span>
              </template>
            </el-table-column>
            <el-table-column label="分账明细">
              <template #default="{ row }">
                <div>陪诊师70%: ¥{{ (row.total_fee * 0.7).toFixed(2) }}</div>
                <div>平台30%: ¥{{ (row.total_fee * 0.3).toFixed(2) }}</div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="openSettleDialog(row)">
                  去结算
                </el-button>
                <el-button type="danger" size="small" @click="openRefundDialog(row)">
                  退款
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="已结算" name="settled">
          <el-table :data="settledOrders" border stripe>
            <el-table-column prop="order_no" label="订单号" width="150" />
            <el-table-column prop="patient_name" label="患者姓名" width="100" />
            <el-table-column prop="escort_name" label="陪诊师" width="100" />
            <el-table-column prop="total_amount" label="总金额" width="120">
              <template #default="{ row }">
                ¥{{ row.total_amount }}
              </template>
            </el-table-column>
            <el-table-column prop="escort_share" label="陪诊师分成" width="120">
              <template #default="{ row }">
                <span class="escort-share">¥{{ row.escort_share }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="platform_fee" label="平台分成" width="120">
              <template #default="{ row }">
                <span class="platform-share">¥{{ row.platform_fee }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="settleTime" label="结算时间" width="160" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag type="success">已结算</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="info" size="small" @click="viewSettleDetail(row)">
                  查看分账
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="投诉处理" name="complaint">
          <div class="complaint-header">
            <el-button type="primary" @click="openRegisterComplaintDialog">
              登记投诉
            </el-button>
          </div>
          <el-table :data="complaintList" border stripe style="margin-top: 15px">
            <el-table-column prop="order_no" label="订单号" width="150" />
            <el-table-column prop="patient_name" label="投诉人" width="100" />
            <el-table-column prop="type" label="投诉类型" width="120" />
            <el-table-column prop="content" label="投诉内容" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'pending' ? 'warning' : 'success'">
                  {{ row.status === 'pending' ? '待处理' : '已处理' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'pending'"
                  type="primary"
                  size="small"
                  @click="openHandleDialog(row)"
                >
                  处理
                </el-button>
                <el-button type="info" size="small" @click="viewComplaintDetail(row)">
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog
      v-model="settleDialogVisible"
      title="结算确认"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="settle-content">
        <h3 class="settle-title">费用明细</h3>
        <el-descriptions :column="1" border class="fee-detail">
          <el-descriptions-item label="订单号">{{ currentSettleOrder.order_no }}</el-descriptions-item>
          <el-descriptions-item label="患者">{{ currentSettleOrder.patient_name }}</el-descriptions-item>
          <el-descriptions-item label="陪诊师">{{ currentSettleOrder.escort_name }}</el-descriptions-item>
          <el-descriptions-item label="基础服务费">
            <span class="fee-row">
              <span>服务时长 {{ currentSettleOrder.service_hours }}小时 × ¥100/小时</span>
              <span class="fee-amount">¥{{ currentSettleOrder.service_fee }}</span>
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="加时费">
            <span class="fee-row">
              <span>{{ currentSettleOrder.overtime_hours || 0 }}小时 × ¥120/小时</span>
              <span class="fee-amount">¥{{ currentSettleOrder.overtime_fee || 0 }}</span>
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="其他费用">
            <span class="fee-row">
              <span>{{ currentSettleOrder.other_fee_desc || '无' }}</span>
              <span class="fee-amount">¥{{ currentSettleOrder.other_fee || 0 }}</span>
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="合计">
            <span class="fee-row total">
              <span>应付总额</span>
              <span class="fee-amount">¥{{ currentSettleOrder.total_fee }}</span>
            </span>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <h3 class="settle-title">分账明细</h3>
        <el-descriptions :column="2" border class="share-detail">
          <el-descriptions-item label="陪诊师分账 (70%)">
            <span class="share-amount escort">¥{{ (currentSettleOrder.total_fee * 0.7).toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="平台分成 (30%)">
            <span class="share-amount platform">¥{{ (currentSettleOrder.total_fee * 0.3).toFixed(2) }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <el-form :model="settleForm" label-width="80px" class="settle-form">
          <el-form-item label="备注">
            <el-input
              v-model="settleForm.remark"
              type="textarea"
              :rows="2"
              placeholder="请输入备注信息（可选）"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="settleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSettle" :loading="settling">
          确认结算
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="settleDetailVisible"
      title="分账详情"
      width="500px"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="结算单号">{{ currentSettleDetail.settle_no }}</el-descriptions-item>
        <el-descriptions-item label="订单号">{{ currentSettleDetail.order_no }}</el-descriptions-item>
        <el-descriptions-item label="结算时间">{{ currentSettleDetail.settleTime }}</el-descriptions-item>
        <el-descriptions-item label="订单总金额">¥{{ currentSettleDetail.total_amount }}</el-descriptions-item>
        <el-descriptions-item label="陪诊师分账 (70%)">
          <span class="share-amount escort">¥{{ currentSettleDetail.escort_share }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="平台分成 (30%)">
          <span class="share-amount platform">¥{{ currentSettleDetail.platform_fee }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="退款金额" v-if="currentSettleDetail.refund_amount">
          -¥{{ currentSettleDetail.refund_amount }}
        </el-descriptions-item>
        <el-descriptions-item label="实际结算">
          <span class="share-amount escort">¥{{ (currentSettleDetail.escort_share - (currentSettleDetail.refund_amount || 0) * 0.7).toFixed(2) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="备注" v-if="currentSettleDetail.remark">
          {{ currentSettleDetail.remark }}
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="settleDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="refundDialogVisible"
      title="退款确认"
      width="500px"
    >
      <el-form :model="refundForm" label-width="100px">
        <el-form-item label="订单号">
          <el-input v-model="refundForm.order_no" disabled />
        </el-form-item>
        <el-form-item label="订单金额">
          <el-input :value="'¥' + refundForm.order_total" disabled />
        </el-form-item>
        <el-form-item label="退款金额" required>
          <el-input-number
            v-model="refundForm.amount"
            :min="0"
            :max="refundForm.order_total"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="退款原因" required>
          <el-input
            v-model="refundForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请填写退款原因"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="refundForm.remark"
            type="textarea"
            :rows="2"
            placeholder="备注信息（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleRefund">确认退款</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="registerComplaintDialogVisible"
      title="登记投诉"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="complaintForm" label-width="100px" :rules="complaintRules" ref="complaintFormRef">
        <el-form-item label="关联订单" prop="order_no">
          <el-select v-model="complaintForm.order_no" placeholder="请选择订单" style="width: 100%">
            <el-option
              v-for="order in allOrders"
              :key="order.order_no"
              :label="order.order_no + ' - ' + order.patient_name"
              :value="order.order_no"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="投诉人" prop="patient_name">
          <el-input v-model="complaintForm.patient_name" placeholder="请输入投诉人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="complaintForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="投诉类型" prop="type">
          <el-select v-model="complaintForm.type" placeholder="请选择投诉类型" style="width: 100%">
            <el-option label="服务态度" value="服务态度" />
            <el-option label="专业能力" value="专业能力" />
            <el-option label="迟到早退" value="迟到早退" />
            <el-option label="费用问题" value="费用问题" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="投诉内容" prop="content">
          <el-input
            v-model="complaintForm.content"
            type="textarea"
            :rows="4"
            placeholder="请详细描述投诉内容"
          />
        </el-form-item>
        <el-form-item label="投诉时间">
          <el-date-picker
            v-model="complaintForm.create_time"
            type="datetime"
            placeholder="选择投诉时间"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="registerComplaintDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitComplaint">提交投诉</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="handleDialogVisible"
      title="投诉处理"
      width="500px"
    >
      <div class="complaint-info">
        <p><strong>投诉人：</strong>{{ currentComplaint?.patient_name }}</p>
        <p><strong>投诉类型：</strong>{{ currentComplaint?.type }}</p>
        <p><strong>投诉内容：</strong>{{ currentComplaint?.content }}</p>
      </div>
      <el-divider />
      <el-form :model="handleForm" label-width="100px">
        <el-form-item label="处理结果" required>
          <el-radio-group v-model="handleForm.result">
            <el-radio label="agree">同意投诉</el-radio>
            <el-radio label="reject">驳回投诉</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理说明" required>
          <el-input
            v-model="handleForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请填写处理说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleComplaint">确认处理</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="complaintDetailVisible"
      title="投诉详情"
      width="500px"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="订单号">{{ currentComplaintDetail?.order_no }}</el-descriptions-item>
        <el-descriptions-item label="投诉人">{{ currentComplaintDetail?.patient_name }}</el-descriptions-item>
        <el-descriptions-item label="投诉类型">{{ currentComplaintDetail?.type }}</el-descriptions-item>
        <el-descriptions-item label="投诉时间">{{ currentComplaintDetail?.create_time }}</el-descriptions-item>
        <el-descriptions-item label="投诉内容">{{ currentComplaintDetail?.content }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentComplaintDetail?.status === 'pending' ? 'warning' : 'success'">
            {{ currentComplaintDetail?.status === 'pending' ? '待处理' : '已处理' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="处理结果" v-if="currentComplaintDetail?.handle_result">
          {{ currentComplaintDetail?.handle_result }}
        </el-descriptions-item>
        <el-descriptions-item label="处理人" v-if="currentComplaintDetail?.handler">
          {{ currentComplaintDetail?.handler }}
        </el-descriptions-item>
        <el-descriptions-item label="处理时间" v-if="currentComplaintDetail?.handle_time">
          {{ currentComplaintDetail?.handle_time }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="complaintDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../api/request.js'

const activeTab = ref('pending')
const pendingOrders = ref([])
const settledOrders = ref([])
const complaintList = ref([])
const allOrders = ref([])

const settleDialogVisible = ref(false)
const settleDetailVisible = ref(false)
const refundDialogVisible = ref(false)
const registerComplaintDialogVisible = ref(false)
const handleDialogVisible = ref(false)
const complaintDetailVisible = ref(false)

const currentSettleOrder = ref({})
const currentSettleDetail = ref({})
const currentOrder = ref(null)
const currentComplaint = ref(null)
const currentComplaintDetail = ref(null)
const settling = ref(false)

const settleForm = ref({
  remark: ''
})

const refundForm = ref({
  order_no: '',
  order_total: 0,
  amount: 0,
  reason: '',
  remark: ''
})

const complaintFormRef = ref(null)
const complaintForm = reactive({
  order_no: '',
  patient_name: '',
  phone: '',
  type: '',
  content: '',
  create_time: new Date()
})

const complaintRules = {
  order_no: [{ required: true, message: '请选择关联订单', trigger: 'change' }],
  patient_name: [{ required: true, message: '请输入投诉人姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  type: [{ required: true, message: '请选择投诉类型', trigger: 'change' }],
  content: [{ required: true, message: '请填写投诉内容', trigger: 'blur' }]
}

const handleForm = ref({
  result: '',
  remark: ''
})

const fetchPendingOrders = async () => {
  try {
    const data = await request.get('/orders')
    pendingOrders.value = data.filter(o => o.status === 'completed').map(o => ({
      ...o,
      service_hours: 4,
      service_fee: 400,
      overtime_hours: 1,
      overtime_fee: 120,
      other_fee: 50,
      other_fee_desc: '复印病历费用',
      total_fee: o.total_fee || 570
    }))
    allOrders.value = [...pendingOrders.value, ...settledOrders.value]
  } catch (error) {
    ElMessage.error('获取待结算订单失败')
  }
}

const fetchSettledOrders = async () => {
  try {
    const data = await request.get('/settlements')
    settledOrders.value = data
    allOrders.value = [...pendingOrders.value, ...settledOrders.value]
  } catch (error) {
    ElMessage.error('获取已结算订单失败')
  }
}

const fetchComplaints = async () => {
  try {
    const data = await request.get('/complaints')
    complaintList.value = data
  } catch (error) {
    ElMessage.error('获取投诉列表失败')
  }
}

const openSettleDialog = (row) => {
  currentSettleOrder.value = row
  settleForm.value = { remark: '' }
  settleDialogVisible.value = true
}

const handleSettle = async () => {
  try {
    await ElMessageBox.confirm('确认结算此订单吗？结算后将无法撤销。', '确认', {
      type: 'warning',
      confirmButtonText: '确认结算',
      cancelButtonText: '取消'
    })
    
    settling.value = true
    await request.post('/settlements', {
      order_id: currentSettleOrder.value.id,
      total_amount: currentSettleOrder.value.total_fee,
      refund_amount: 0,
      complaint: settleForm.value.remark,
      evidence: ''
    })
    ElMessage.success('结算成功')
    settleDialogVisible.value = false
    fetchPendingOrders()
    fetchSettledOrders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('结算失败，请重试')
    }
  } finally {
    settling.value = false
  }
}

const viewSettleDetail = (row) => {
  currentSettleDetail.value = {
    ...row,
    settle_no: row.settle_no || 'SET' + Date.now(),
    refund_amount: row.refund_amount || 0
  }
  settleDetailVisible.value = true
}

const openRefundDialog = (row) => {
  currentOrder.value = row
  refundForm.value = {
    order_no: row.order_no,
    order_total: row.total_fee,
    amount: row.total_fee,
    reason: '',
    remark: ''
  }
  refundDialogVisible.value = true
}

const handleRefund = async () => {
  if (!refundForm.value.reason.trim()) {
    ElMessage.warning('请填写退款原因')
    return
  }
  if (refundForm.value.amount <= 0) {
    ElMessage.warning('退款金额必须大于0')
    return
  }
  if (refundForm.value.amount > refundForm.value.order_total) {
    ElMessage.warning('退款金额不能大于订单金额')
    return
  }
  try {
    await request.post(`/orders/${currentOrder.value.id}/refund`, {
      amount: refundForm.value.amount,
      reason: refundForm.value.reason,
      remark: refundForm.value.remark
    })
    ElMessage.success('退款申请已提交')
    refundDialogVisible.value = false
    fetchPendingOrders()
  } catch (error) {
    ElMessage.error('退款申请提交失败')
  }
}

const openRegisterComplaintDialog = () => {
  complaintForm.order_no = ''
  complaintForm.patient_name = ''
  complaintForm.phone = ''
  complaintForm.type = ''
  complaintForm.content = ''
  complaintForm.create_time = new Date()
  registerComplaintDialogVisible.value = true
}

const submitComplaint = async () => {
  if (!complaintFormRef.value) return
  
  await complaintFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await request.post('/complaints', {
          ...complaintForm,
          status: 'pending'
        })
        ElMessage.success('投诉登记成功')
        registerComplaintDialogVisible.value = false
        fetchComplaints()
      } catch (error) {
        ElMessage.error('投诉登记失败')
      }
    }
  })
}

const openHandleDialog = (row) => {
  currentComplaint.value = row
  handleForm.value = {
    result: '',
    remark: ''
  }
  handleDialogVisible.value = true
}

const handleComplaint = async () => {
  if (handleForm.value.result === '') {
    ElMessage.warning('请选择处理结果')
    return
  }
  if (!handleForm.value.remark.trim()) {
    ElMessage.warning('请填写处理说明')
    return
  }
  try {
    await request.post(`/complaints/${currentComplaint.value.id}/handle`, {
      result: handleForm.value.result,
      remark: handleForm.value.remark,
      status: 'processed'
    })
    ElMessage.success('处理成功')
    handleDialogVisible.value = false
    fetchComplaints()
  } catch (error) {
    ElMessage.error('处理失败')
  }
}

const viewComplaintDetail = (row) => {
  currentComplaintDetail.value = {
    ...row,
    handle_result: row.handle_result || (row.status === 'processed' ? '已与客户沟通，达成和解' : ''),
    handler: row.handler || (row.status === 'processed' ? '王主管' : ''),
    handle_time: row.handle_time || (row.status === 'processed' ? '2024-01-17 10:30:00' : '')
  }
  complaintDetailVisible.value = true
}

onMounted(() => {
  fetchPendingOrders()
  fetchSettledOrders()
  fetchComplaints()
})
</script>

<style scoped>
.settlement {
  padding: 20px;
}

.total-fee {
  font-weight: 600;
  color: #f56c6c;
}

.escort-share {
  color: #67c23a;
  font-weight: 500;
}

.platform-share {
  color: #e6a23c;
  font-weight: 500;
}

.complaint-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.settle-content {
  padding: 10px 0;
}

.settle-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 15px 0;
}

.fee-detail {
  margin-bottom: 10px;
}

.fee-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.fee-amount {
  font-weight: 500;
  color: #f56c6c;
}

.fee-row.total {
  font-size: 16px;
  font-weight: 600;
}

.fee-row.total .fee-amount {
  font-size: 20px;
}

.share-detail {
  margin-bottom: 20px;
}

.share-amount {
  font-size: 18px;
  font-weight: 600;
}

.share-amount.escort {
  color: #67c23a;
}

.share-amount.platform {
  color: #e6a23c;
}

.settle-form {
  margin-top: 20px;
}

.complaint-info {
  padding: 10px 0;
  line-height: 1.8;
}

.complaint-info p {
  margin: 5px 0;
  color: #606266;
}
</style>
