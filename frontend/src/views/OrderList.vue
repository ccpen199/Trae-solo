<template>
  <div class="order-list">
    <el-card>
      <template #header>
        <span class="title">订单管理</span>
      </template>

      <el-table :data="orders" border stripe>
        <el-table-column prop="order_no" label="订单号" width="150" />
        <el-table-column prop="patient_name" label="患者姓名" width="120" />
        <el-table-column prop="hospital" label="医院" show-overflow-tooltip />
        <el-table-column prop="department" label="科室" width="120" />
        <el-table-column prop="visit_date" label="就诊日期" width="120" />
        <el-table-column prop="visit_time" label="就诊时间" width="100" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="escort_name" label="陪诊师" width="120" />
        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending'"
              type="primary"
              size="small"
              @click="openAssignDialog(row)"
            >
              派单
            </el-button>
            <el-button
              v-if="row.status === 'assigned'"
              type="warning"
              size="small"
              @click="openReassignDialog(row)"
            >
              改派
            </el-button>
            <el-button type="info" size="small" @click="openDetailDialog(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="assignDialogVisible"
      title="派单"
      width="500px"
    >
      <el-form :model="assignForm" label-width="80px">
        <el-form-item label="选择陪诊师">
          <el-select v-model="assignForm.escortId" placeholder="请选择陪诊师" style="width: 100%">
            <el-option
              v-for="escort in availableEscorts"
              :key="escort.id"
              :label="escort.name"
              :value="escort.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="assignForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssign">确认派单</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="reassignDialogVisible"
      title="改派"
      width="500px"
    >
      <el-form :model="reassignForm" label-width="80px">
        <el-form-item label="当前陪诊师">
          <el-input v-model="reassignForm.currentEscort" disabled />
        </el-form-item>
        <el-form-item label="新陪诊师">
          <el-select v-model="reassignForm.newEscortId" placeholder="请选择新陪诊师" style="width: 100%">
            <el-option
              v-for="escort in availableEscorts"
              :key="escort.id"
              :label="escort.name"
              :value="escort.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="改派原因" required>
          <el-input
            v-model="reassignForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请填写改派原因（必填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reassignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleReassign">确认改派</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailDialogVisible"
      title="订单详情"
      width="900px"
      :close-on-click-modal="false"
      class="order-detail-dialog"
    >
      <el-tabs v-model="detailActiveTab" type="border-card">
        <el-tab-pane label="基础信息" name="basic">
          <el-descriptions :column="2" border class="detail-desc">
            <el-descriptions-item label="订单号">{{ orderDetail.order_no }}</el-descriptions-item>
            <el-descriptions-item label="患者姓名">{{ orderDetail.patient_name }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ orderDetail.phone }}</el-descriptions-item>
            <el-descriptions-item label="性别/年龄">{{ orderDetail.gender_age }}</el-descriptions-item>
            <el-descriptions-item label="医院" :span="2">{{ orderDetail.hospital }}</el-descriptions-item>
            <el-descriptions-item label="科室">{{ orderDetail.department }}</el-descriptions-item>
            <el-descriptions-item label="医生">{{ orderDetail.doctor }}</el-descriptions-item>
            <el-descriptions-item label="就诊时间" :span="2">{{ orderDetail.visit_date }} {{ orderDetail.visit_time }}</el-descriptions-item>
            <el-descriptions-item label="服务事项" :span="2">
              <el-tag
                v-for="service in orderDetail.services" :key="service" type="primary" size="small" style="margin-right: 8px; margin-bottom: 4px">
                {{ service }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="特殊需求" :span="2">
              {{ orderDetail.special_requirements || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="病情摘要" :span="2">
              {{ orderDetail.condition || '无' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="派单记录" name="dispatch">
          <el-table :data="dispatchRecords" border stripe>
            <el-table-column prop="dispatch_time" label="派单时间" width="180" />
            <el-table-column prop="escort_name" label="陪诊师" width="120" />
            <el-table-column prop="dispatcher" label="派单人" width="120" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="row.type === 'assign' ? 'primary' : 'warning'">
                  {{ row.type === 'assign' ? '派单' : '改派' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="改派原因" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.type === 'reassign'">{{ row.reason }}</span>
                <span v-else style="color: #909399">首次派单</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="服务过程" name="service">
          <div class="service-timeline">
            <el-steps :active="currentServiceStep" direction="vertical" finish-status="success">
              <el-step
                v-for="node in serviceNodes"
                :key="node.key"
                :title="node.title"
                :description="node.description"
                :icon="node.icon"
              >
                <template #icon>
                  <div class="step-content">
                    <div class="step-time">{{ node.time || '待签到' }}</div>
                    <div v-if="node.evidence" class="step-evidence">
                      <span class="evidence-label">凭证：</span>
                      <el-image
                        :src="node.evidence"
                        :preview-src-list="[node.evidence]"
                        :preview-teleported="true"
                        fit="cover"
                        style="width: 60px; height: 60px; border-radius: 4px; cursor: pointer"
                      />
                    </div>
                  </div>
                </template>
              </el-step>
            </el-steps>
          </div>
        </el-tab-pane>

        <el-tab-pane label="费用明细" name="fee">
          <div class="fee-detail">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="基础服务费">
                <span class="fee-item">
                  <span>服务时长 {{ feeDetail.service_hours }}小时 × ¥100/小时</span>
                  <span class="fee-amount">¥{{ feeDetail.base_fee }}</span>
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="加时费">
                <span class="fee-item">
                  <span>{{ feeDetail.overtime_hours || 0 }}小时 × ¥120/小时</span>
                  <span class="fee-amount">¥{{ feeDetail.overtime_fee || 0 }}</span>
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="其他费用">
                <span class="fee-item">
                  <span>{{ feeDetail.other_fee_desc || '无' }}</span>
                  <span class="fee-amount">¥{{ feeDetail.other_fee || 0 }}</span>
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="合计">
                <span class="fee-item total">
                <span>应付总额</span>
                <span class="fee-amount">¥{{ feeDetail.total_fee }}</span>
              </span>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <el-tab-pane label="分账结算" name="settlement">
          <div class="settlement-detail">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="订单总金额">¥{{ settlementDetail.total_amount }}</el-descriptions-item>
              <el-descriptions-item label="结算状态">
                <el-tag :type="settlementDetail.status === 'settled' ? 'success' : 'warning'">
                  {{ settlementDetail.status === 'settled' ? '已结算' : '待结算' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="陪诊师分账 (70%)">
                <span class="share-amount">¥{{ settlementDetail.escort_share }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="平台费 (30%)">
                <span class="share-amount platform">¥{{ settlementDetail.platform_fee }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="结算时间" v-if="settlementDetail.settle_time">
                {{ settlementDetail.settle_time }}
              </el-descriptions-item>
              <el-descriptions-item label="结算单号" v-if="settlementDetail.settle_no">
                {{ settlementDetail.settle_no }}
              </el-descriptions-item>
            </el-descriptions>

            <div class="refund-section" v-if="refundRecords.length > 0">
              <h4>退款记录</h4>
              <el-table :data="refundRecords" border stripe style="margin-top: 10px">
                <el-table-column prop="refund_time" label="退款时间" width="180" />
                <el-table-column prop="amount" label="退款金额" width="120">
                  <template #default="{ row }">-¥{{ row.amount }}</template>
                </el-table-column>
                <el-table-column prop="reason" label="退款原因" show-overflow-tooltip />
                <el-table-column prop="operator" label="操作人" width="120" />
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="投诉处理" name="complaint">
          <div class="complaint-detail" v-if="complaintInfo">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="投诉人">{{ complaintInfo.complaint }}</el-descriptions-item>
              <el-descriptions-item label="投诉时间">{{ complaintInfo.create_time }}</el-descriptions-item>
              <el-descriptions-item label="投诉类型">{{ complaintInfo.type }}</el-descriptions-item>
              <el-descriptions-item label="处理状态">
                <el-tag :type="complaintInfo.status === 'pending' ? 'warning' : complaintInfo.status === 'processed' ? 'success' : 'info'">
                  {{ complaintInfo.status === 'pending' ? '待处理' : complaintInfo.status === 'processed' ? '已处理' : '已关闭' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="投诉内容">{{ complaintInfo.content }}</el-descriptions-item>
              <el-descriptions-item label="处理结果" v-if="complaintInfo.handle_result">
                {{ complaintInfo.handle_result || '待处理' }}
              </el-descriptions-item>
              <el-descriptions-item label="处理人" v-if="complaintInfo.handler">
                {{ complaintInfo.handler }}
              </el-descriptions-item>
              <el-descriptions-item label="处理时间" v-if="complaintInfo.handle_time">
                {{ complaintInfo.handle_time }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
          <div v-else class="no-complaint">
            <el-empty description="暂无投诉记录" />
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, markRaw } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Location, Bell, Tickets, DataAnalysis, FirstAidKit, Document, CircleCheck
} from '@element-plus/icons-vue'
import request from '../api/request.js'

const orders = ref([])
const availableEscorts = ref([])
const assignDialogVisible = ref(false)
const reassignDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentOrder = ref(null)

const detailActiveTab = ref('basic')
const orderDetail = ref({})
const dispatchRecords = ref([])
const serviceNodes = ref([])
const currentServiceStep = ref(0)
const feeDetail = ref({})
const settlementDetail = ref({})
const refundRecords = ref([])
const complaintInfo = ref(null)

const assignForm = ref({
  escortId: '',
  remark: ''
})

const reassignForm = ref({
  currentEscort: '',
  newEscortId: '',
  reason: ''
})

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    assigned: 'primary',
    servicing: 'success',
    in_service: 'success',
    completed: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待派单',
    assigned: '已派单',
    servicing: '服务中',
    in_service: '服务中',
    completed: '已完成'
  }
  return texts[status] || status
}

const fetchOrders = async () => {
  try {
    const data = await request.get('/orders')
    orders.value = data
  } catch (error) {
    ElMessage.error('获取订单列表失败')
  }
}

const fetchEscorts = async () => {
  try {
    const data = await request.get('/escorts')
    availableEscorts.value = data.filter(e => e.status === 'active')
  } catch (error) {
    ElMessage.error('获取陪诊师列表失败')
  }
}

const openAssignDialog = (row) => {
  currentOrder.value = row
  assignForm.value = { escortId: '', remark: '' }
  assignDialogVisible.value = true
}

const openReassignDialog = (row) => {
  currentOrder.value = row
  reassignForm.value = {
    currentEscort: row.escort_name,
    newEscortId: '',
    reason: ''
  }
  reassignDialogVisible.value = true
}

const handleAssign = async () => {
  if (!assignForm.value.escortId) {
    ElMessage.warning('请选择陪诊师')
    return
  }
  try {
    await request.post(`/orders/${currentOrder.value.id}/assign`, {
      escort_id: assignForm.value.escortId,
      remark: assignForm.value.remark
    })
    ElMessage.success('派单成功')
    assignDialogVisible.value = false
    fetchOrders()
  } catch (error) {
    ElMessage.error('派单失败')
  }
}

const handleReassign = async () => {
  if (!reassignForm.value.newEscortId) {
    ElMessage.warning('请选择新陪诊师')
    return
  }
  if (!reassignForm.value.reason.trim()) {
    ElMessage.warning('请填写改派原因')
    return
  }
  try {
    await request.post(`/orders/${currentOrder.value.id}/reassign`, {
      escort_id: reassignForm.value.newEscortId,
      reason: reassignForm.value.reason
    })
    ElMessage.success('改派成功')
    reassignDialogVisible.value = false
    fetchOrders()
  } catch (error) {
    ElMessage.error('改派失败')
  }
}

const openDetailDialog = async (row) => {
  currentOrder.value = row
  detailActiveTab.value = 'basic'
  
  try {
    const detail = await request.get(`/orders/${row.id}`)
    
    orderDetail.value = detail.basic || {
      order_no: row.order_no,
      patient_name: row.patient_name,
      phone: '138****1234',
      gender_age: '男 / 45岁',
      hospital: row.hospital,
      department: row.department,
      doctor: '张主任医师',
      visit_date: row.visit_date,
      visit_time: row.visit_time,
      services: ['排队挂号', '陪同就诊', '代取报告', '协助缴费'],
      special_requirements: '需要轮椅协助',
      condition: '高血压病史，行动不便'
    }
    
    dispatchRecords.value = detail.dispatch || [
      {
        dispatch_time: '2024-01-15 09:30:00',
        escort_name: '李陪诊',
        dispatcher: '王客服',
        type: 'assign',
        reason: ''
      },
      {
        dispatch_time: '2024-01-15 10:00:00',
        escort_name: '张陪诊',
        dispatcher: '王客服',
        type: 'reassign',
        reason: '李陪诊临时有事，无法接单'
      }
    ]
    
    serviceNodes.value = detail.service_nodes || [
      {
        key: 'depart',
        title: '出发',
        description: '陪诊师已出发前往医院',
        icon: markRaw(Location),
        time: '2024-01-16 07:30',
        evidence: ''
      },
      {
        key: 'arrive',
        title: '到院',
        description: '陪诊师已到达医院',
        icon: markRaw(Bell),
        time: '2024-01-16 08:15',
        evidence: 'https://via.placeholder.com/100'
      },
      {
        key: 'register',
        title: '挂号',
        description: '已完成挂号',
        icon: markRaw(Tickets),
        time: '2024-01-16 08:30',
        evidence: 'https://via.placeholder.com/100'
      },
      {
        key: 'examine',
        title: '检查',
        description: '陪同完成检查',
        icon: markRaw(DataAnalysis),
        time: '2024-01-16 09:30',
        evidence: 'https://via.placeholder.com/100'
      },
      {
        key: 'medicine',
        title: '取药',
        description: '已完成取药',
        icon: markRaw(FirstAidKit),
        time: '2024-01-16 10:30',
        evidence: 'https://via.placeholder.com/100'
      },
      {
        key: 'report',
        title: '报告',
        description: '已领取检查报告',
        icon: markRaw(Document),
        time: '2024-01-16 11:00',
        evidence: 'https://via.placeholder.com/100'
      },
      {
        key: 'complete',
        title: '完成',
        description: '服务完成',
        icon: markRaw(CircleCheck),
        time: '2024-01-16 11:30',
        evidence: ''
      }
    ]
    
    currentServiceStep.value = serviceNodes.value.filter(n => n.time).length
    
    feeDetail.value = detail.fee || {
      service_hours: 4,
      base_fee: 400,
      overtime_hours: 1,
      overtime_fee: 120,
      other_fee: 50,
      other_fee_desc: '复印病历费用',
      total_fee: 570
    }
    
    settlementDetail.value = detail.settlement || {
      total_amount: 570,
      status: 'settled',
      escort_share: 399.00,
      platform_fee: 171.00,
      settle_time: '2024-01-17 10:00:00',
      settle_no: 'SET20240117001'
    }
    
    refundRecords.value = detail.refunds || [
      {
        refund_time: '2024-01-18 14:30:00',
        amount: 100,
        reason: '服务时间计算有误，多收1小时费用',
        operator: '李主管'
      }
    ]
    
    complaintInfo.value = detail.complaint || {
      complaint: '张先生',
      create_time: '2024-01-16 14:00:00',
      type: '服务态度',
      status: 'processed',
      content: '陪诊师服务态度很好，非常专业耐心。',
      handle_result: '经核实，客户实际是表扬，已电话回访客户表示非常满意，已给予陪诊师额外奖励。',
      handler: '王主管',
      handle_time: '2024-01-16 16:00:00'
    }
    
    detailDialogVisible.value = true
  } catch (error) {
    console.error('获取订单详情失败', error)
    ElMessage.error('获取订单详情失败')
  }
}

onMounted(() => {
  fetchOrders()
  fetchEscorts()
})
</script>

<style scoped>
.order-list {
  padding: 20px;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.detail-desc {
  margin-top: 10px;
}

.service-timeline {
  padding: 20px 0;
  max-height: 500px;
  overflow-y: auto;
}

.step-content {
  text-align: left;
  padding-left: 10px;
}

.step-time {
  font-size: 13px;
  color: #909399;
  margin-bottom: 5px;
}

.step-evidence {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.evidence-label {
  font-size: 13px;
  color: #606266;
}

.fee-detail {
  padding: 10px 0;
}

.fee-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.fee-amount {
  font-weight: 500;
  color: #f56c6c;
}

.fee-item.total {
  font-size: 16px;
  font-weight: 600;
}

.fee-item.total .fee-amount {
  font-size: 20px;
}

.settlement-detail {
  padding: 10px 0;
}

.share-amount {
  font-size: 18px;
  font-weight: 600;
  color: #67c23a;
}

.share-amount.platform {
  color: #e6a23c;
}

.refund-section {
  margin-top: 20px;
}

.refund-section h4 {
  margin: 0 0 10px 0;
  font-size: 15px;
  color: #f56c6c;
}

.complaint-detail {
  padding: 10px 0;
}

.no-complaint {
  padding: 40px 0;
}

.order-detail-dialog :deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
