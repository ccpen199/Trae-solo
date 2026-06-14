<template>
  <div class="admin-application-detail">
    <div class="page-header mb-24">
      <div class="flex items-center gap-12">
        <el-button link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <h2 class="page-title">办件详情</h2>
      </div>
      <div class="text-gray-500 mt-8">申请编号：{{ application?.application_no }}</div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-20">
      <div class="lg:col-span-2 space-y-20">
        <div class="card p-24">
          <h3 class="text-18 font-semibold mb-20">基本信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="申请编号">{{ application?.application_no }}</el-descriptions-item>
            <el-descriptions-item label="事项名称">{{ application?.service_item_name }}</el-descriptions-item>
            <el-descriptions-item label="申请人">{{ application?.applicant_name }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ application?.applicant_phone }}</el-descriptions-item>
            <el-descriptions-item label="身份证号">{{ application?.applicant_id_card || '-' }}</el-descriptions-item>
            <el-descriptions-item label="办理部门">{{ application?.department_name }}</el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ formatTime(application?.submit_time) }}</el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="getStatusType(application?.status)" size="small">
                {{ getStatusText(application?.status) }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="card p-24">
          <h3 class="text-18 font-semibold mb-20">办理流程时间轴</h3>
          <el-timeline>
            <el-timeline-item
              v-for="(step, index) in timeline"
              :key="index"
              :timestamp="formatTime(step.time)"
              :type="step.type"
              :icon="step.icon"
              :hollow="step.hollow"
            >
              <div class="timeline-content">
                <h4 class="text-15 font-medium mb-4">{{ step.title }}</h4>
                <p class="text-gray-600 text-13 mb-8">{{ step.description }}</p>
                <div v-if="step.materials || step.signature || step.payment" class="step-details">
                  <div v-if="step.materials" class="materials-section">
                    <div class="text-13 font-medium mb-8">上传材料：</div>
                    <div class="flex flex-wrap gap-12">
                      <div v-for="(mat, idx) in step.materials" :key="idx" class="material-item p-12 bg-gray-50 rounded-lg flex items-center gap-12">
                        <el-icon size="20" color="#409eff"><Document /></el-icon>
                        <div class="flex-1 min-w-0">
                          <div class="text-13 truncate">{{ mat.name }}</div>
                          <div class="text-12 text-gray-400">{{ formatSize(mat.size) }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="step.signature" class="signature-section mt-12">
                    <div class="text-13 font-medium mb-8">电子签名：</div>
                    <div class="signature-box p-16 bg-gray-50 rounded-lg inline-block">
                      <div class="text-24 font-bold text-blue-600" style="font-family: 'Ma Shan Zheng', cursive;">
                        {{ step.signature.name }}
                      </div>
                      <div class="text-12 text-gray-500 mt-4">
                        {{ formatTime(step.signature.time) }} | IP: {{ step.signature.ip }}
                      </div>
                    </div>
                  </div>
                  <div v-if="step.payment" class="payment-section mt-12">
                    <div class="text-13 font-medium mb-8">在线支付：</div>
                    <div class="payment-info p-16 bg-gray-50 rounded-lg">
                      <div class="flex justify-between items-center">
                        <span class="text-gray-600">支付金额</span>
                        <span class="text-20 font-bold text-orange-500">¥{{ step.payment.amount }}</span>
                      </div>
                      <div class="flex justify-between items-center mt-8">
                        <span class="text-gray-600">支付方式</span>
                        <span>{{ step.payment.method }}</span>
                      </div>
                      <div class="flex justify-between items-center mt-8">
                        <span class="text-gray-600">交易单号</span>
                        <span class="text-12">{{ step.payment.transaction_no }}</span>
                      </div>
                      <div class="flex justify-between items-center mt-8">
                        <span class="text-gray-600">支付状态</span>
                        <el-tag type="success" size="small">{{ step.payment.status }}</el-tag>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="step.operator" class="text-12 text-gray-400 mt-8">
                  操作人：{{ step.operator }}
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div class="card p-24" v-if="application?.evaluation">
          <h3 class="text-18 font-semibold mb-20">服务评价</h3>
          <div class="evaluation-section">
            <div class="flex items-center gap-16 mb-16">
              <div class="text-14 text-gray-600">满意度：</div>
              <el-rate v-model="application.evaluation.rating" disabled show-score text-color="#ff9900" />
              <span class="text-16 font-bold" :class="application.evaluation.rating <= 2 ? 'text-red-500' : 'text-green-500'">
                {{ getRatingText(application.evaluation.rating) }}
              </span>
            </div>
            <div class="mb-12" v-if="application.evaluation.comment">
              <div class="text-14 text-gray-600 mb-4">评价内容：</div>
              <p class="text-14 bg-gray-50 p-12 rounded-lg">{{ application.evaluation.comment }}</p>
            </div>
            <div class="text-12 text-gray-400">
              评价时间：{{ formatTime(application.evaluation.created_at) }}
            </div>

            <div v-if="application.evaluation.rating <= 2 && application.rectification" class="rectification-section mt-24 p-20 bg-orange-50 rounded-lg border border-orange-200">
              <div class="flex items-center gap-12 mb-16">
                <el-icon size="20" color="#e6a23c"><Warning /></el-icon>
                <h4 class="text-16 font-semibold text-orange-600">差评整改流程</h4>
                <el-tag :type="getRectificationType(application.rectification.status)" size="small">
                  {{ getRectificationText(application.rectification.status) }}
                </el-tag>
              </div>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="预警时间">{{ formatTime(application.rectification.alert_time) }}</el-descriptions-item>
                <el-descriptions-item label="责任人">{{ application.rectification.handler }}</el-descriptions-item>
                <el-descriptions-item label="整改措施" v-if="application.rectification.measure">
                  {{ application.rectification.measure }}
                </el-descriptions-item>
                <el-descriptions-item label="整改结果" v-if="application.rectification.result">
                  {{ application.rectification.result }}
                </el-descriptions-item>
                <el-descriptions-item label="用户是否满意">
                  {{ application.rectification.user_satisfied ? '是' : application.rectification.user_satisfied === false ? '否' : '待确认' }}
                </el-descriptions-item>
                <el-descriptions-item label="完成时间" v-if="application.rectification.completed_at">
                  {{ formatTime(application.rectification.completed_at) }}
                </el-descriptions-item>
              </el-descriptions>
              <div class="mt-16 flex gap-12" v-if="application.rectification.status === 'processing'">
                <el-button type="primary" size="small" @click="handleRectification">提交整改措施</el-button>
              </div>
            </div>

            <div v-if="application.evaluation.rating <= 2 && !application.rectification" class="mt-16">
              <el-button type="warning" size="small" @click="handleCreateAlert">
                <el-icon><Warning /></el-icon>生成差评预警
              </el-button>
            </div>
          </div>
        </div>

        <div class="card p-24">
          <h3 class="text-18 font-semibold mb-20">办件操作</h3>
          <div class="flex flex-wrap gap-12">
            <el-button type="primary" v-if="application?.status === 'pending'" @click="handleAccept">
              <el-icon><Check /></el-icon>受理
            </el-button>
            <el-button type="primary" v-if="application?.status === 'accepted' || application?.status === 'processing'" @click="handleComplete">
              <el-icon><CircleCheck /></el-icon>办结
            </el-button>
            <el-button type="warning" v-if="application?.status === 'pending'" @click="handleReject">
              <el-icon><Close /></el-icon>驳回
            </el-button>
            <el-button @click="handleExport">
              <el-icon><Download /></el-icon>导出办件
            </el-button>
          </div>
        </div>
      </div>

      <div class="space-y-20">
        <div class="card p-24">
          <h3 class="text-18 font-semibold mb-16">办件进度</h3>
          <el-steps :active="getStepIndex(application?.status)" direction="vertical" finish-status="success">
            <el-step title="提交申请" description="申请人在线提交" />
            <el-step title="材料上传" description="材料完整性校验" />
            <el-step title="电子签名" description="数字签名确认" />
            <el-step title="在线支付" description="费用缴纳完成" />
            <el-step title="受理审核" description="窗口人员受理" />
            <el-step title="审批办理" description="后台人员审批" />
            <el-step title="办结出证" description="制证发证完成" />
            <el-step title="服务评价" description="满意度评价" />
          </el-steps>
        </div>

        <div class="card p-24">
          <h3 class="text-18 font-semibold mb-16">材料清单</h3>
          <div class="space-y-12">
            <div v-for="(mat, index) in application?.materials || []" :key="index" class="flex items-center gap-12 p-12 bg-gray-50 rounded-lg">
              <el-icon size="20" :color="mat.uploaded ? '#67c23a' : '#909399'">
                <component :is="mat.uploaded ? 'CircleCheck' : 'CircleClose'" />
              </el-icon>
              <div class="flex-1 min-w-0">
                <div class="text-14">{{ mat.name }}</div>
                <div class="text-12 text-gray-400">{{ mat.required ? '必填' : '选填' }}</div>
              </div>
              <el-tag v-if="mat.uploaded" type="success" size="small">已上传</el-tag>
              <el-tag v-else type="info" size="small">待上传</el-tag>
            </div>
          </div>
        </div>

        <div class="card p-24">
          <h3 class="text-18 font-semibold mb-16">办理时限</h3>
          <div class="text-center">
            <div class="text-36 font-bold text-blue-500">{{ remainingDays }}</div>
            <div class="text-14 text-gray-500 mt-8">剩余工作日</div>
            <el-progress :percentage="timeProgress" class="mt-16" />
            <div class="text-12 text-gray-400 mt-8">
              承诺时限：{{ application?.handling_time || 5 }} 个工作日
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="rectificationDialogVisible" title="提交整改措施" width="600px">
      <el-form :model="rectificationForm" label-width="100px">
        <el-form-item label="整改措施" required>
          <el-input v-model="rectificationForm.measure" type="textarea" :rows="4" placeholder="请输入整改措施" />
        </el-form-item>
        <el-form-item label="处理结果">
          <el-radio-group v-model="rectificationForm.status">
            <el-radio value="processing">处理中</el-radio>
            <el-radio value="completed">已完成</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="rectificationForm.remark" type="textarea" :rows="2" placeholder="备注说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rectificationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRectification">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { applicationApi } from '@/api'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const application = ref(null)
const rectificationDialogVisible = ref(false)

const rectificationForm = reactive({
  measure: '',
  status: 'processing',
  remark: ''
})

const timeline = computed(() => {
  if (!application.value) return []
  const steps = []
  
  steps.push({
    title: '提交申请',
    description: '申请人在线提交办件申请，填写基本信息',
    time: application.value.submit_time,
    type: 'success',
    icon: 'Document',
    operator: application.value.applicant_name
  })

  if (application.value.materials?.length > 0) {
    const uploadedMats = application.value.materials.filter(m => m.uploaded)
    steps.push({
      title: '材料上传',
      description: `已上传 ${uploadedMats.length} 份材料，通过完整性校验`,
      time: application.value.submit_time,
      type: 'success',
      icon: 'Upload',
      materials: uploadedMats,
      operator: application.value.applicant_name
    })
  }

  if (application.value.signature) {
    steps.push({
      title: '电子签名',
      description: '申请人已完成电子签名确认',
      time: application.value.signature_time || application.value.submit_time,
      type: 'success',
      icon: 'EditPen',
      signature: application.value.signature,
      operator: application.value.applicant_name
    })
  }

  if (application.value.payment) {
    steps.push({
      title: '在线支付',
      description: `已完成费用缴纳，金额 ¥${application.value.payment.amount}`,
      time: application.value.payment_time || application.value.submit_time,
      type: 'success',
      icon: 'Wallet',
      payment: application.value.payment,
      operator: application.value.applicant_name
    })
  }

  if (application.value.status !== 'pending') {
    steps.push({
      title: '受理申请',
      description: '窗口工作人员已受理申请',
      time: application.value.accept_time || application.value.submit_time,
      type: 'primary',
      icon: 'Check',
      operator: application.value.accept_handler || '系统管理员'
    })
  }

  if (application.value.status === 'processing' || application.value.status === 'completed') {
    steps.push({
      title: '审批办理',
      description: '后台工作人员正在审批办理',
      time: application.value.process_time || application.value.submit_time,
      type: 'primary',
      icon: 'Setting',
      operator: application.value.current_handler || '系统管理员'
    })
  }

  if (application.value.status === 'completed') {
    steps.push({
      title: '办结出证',
      description: '办件已完成，证照已发放',
      time: application.value.complete_time || application.value.submit_time,
      type: 'success',
      icon: 'CircleCheck',
      operator: application.value.complete_handler || '系统管理员'
    })
  }

  if (application.value.evaluation) {
    steps.push({
      title: '服务评价',
      description: `申请人已评价，${application.value.evaluation.rating} 星`,
      time: application.value.evaluation.created_at,
      type: application.value.evaluation.rating <= 2 ? 'danger' : 'success',
      icon: 'Star',
      operator: application.value.applicant_name
    })
  }

  if (application.value.status === 'pending') {
    steps.push({
      title: '待受理',
      description: '等待工作人员受理',
      time: null,
      type: '',
      icon: 'Clock',
      hollow: true
    })
  }

  return steps
})

const remainingDays = computed(() => {
  if (!application.value) return 0
  const totalDays = application.value.handling_time || 5
  const passed = dayjs().diff(dayjs(application.value.submit_time), 'day')
  return Math.max(0, totalDays - passed)
})

const timeProgress = computed(() => {
  if (!application.value) return 0
  const totalDays = application.value.handling_time || 5
  const passed = dayjs().diff(dayjs(application.value.submit_time), 'day')
  return Math.min(100, Math.round((passed / totalDays) * 100))
})

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    accepted: 'primary',
    processing: 'primary',
    completed: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待受理',
    accepted: '已受理',
    processing: '办理中',
    completed: '已办结',
    rejected: '已驳回'
  }
  return texts[status] || status
}

const getStepIndex = (status) => {
  const steps = {
    pending: 1,
    accepted: 5,
    processing: 6,
    completed: 7,
    rejected: 4
  }
  return steps[status] || 0
}

const getRatingText = (rating) => {
  const texts = { 1: '非常不满意', 2: '不满意', 3: '一般', 4: '满意', 5: '非常满意' }
  return texts[rating] || `${rating} 星`
}

const getRectificationType = (status) => {
  const types = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    closed: 'info'
  }
  return types[status] || 'info'
}

const getRectificationText = (status) => {
  const texts = {
    pending: '待处理',
    processing: '整改中',
    completed: '已完成',
    closed: '已结案'
  }
  return texts[status] || status
}

const formatTime = (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
const formatSize = (bytes) => {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const goBack = () => router.back()

const fetchDetail = async () => {
  loading.value = true
  try {
    const id = route.params.id
    const res = await applicationApi.detail(id)
    if (res.code === 200 && res.data) {
      application.value = res.data
    } else {
      application.value = mockApplication
    }
  } catch (e) {
    application.value = mockApplication
  } finally {
    loading.value = false
  }
}

const handleAccept = () => {
  ElMessage.success('受理成功')
  application.value.status = 'accepted'
}

const handleComplete = () => {
  ElMessage.success('办结成功')
  application.value.status = 'completed'
}

const handleReject = () => {
  ElMessage.warning('驳回功能请在列表页操作')
}

const handleExport = () => {
  ElMessage.success('导出功能开发中...')
}

const handleCreateAlert = () => {
  if (!application.value.rectification) {
    application.value.rectification = {
      status: 'pending',
      alert_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      handler: '系统管理员'
    }
  }
  ElMessage.success('已生成差评预警')
}

const handleRectification = () => {
  rectificationForm.measure = ''
  rectificationForm.status = 'processing'
  rectificationForm.remark = ''
  rectificationDialogVisible.value = true
}

const submitRectification = () => {
  if (!rectificationForm.measure.trim()) {
    ElMessage.warning('请输入整改措施')
    return
  }
  application.value.rectification.measure = rectificationForm.measure
  application.value.rectification.status = rectificationForm.status
  if (rectificationForm.status === 'completed') {
    application.value.rectification.completed_at = dayjs().format('YYYY-MM-DD HH:mm:ss')
    application.value.rectification.result = rectificationForm.remark || '整改完成'
  }
  ElMessage.success('整改措施已提交')
  rectificationDialogVisible.value = false
}

const mockApplication = {
  id: 1,
  application_no: 'SC2026060700001',
  service_item_id: 3,
  service_item_name: '身份证补办',
  applicant_name: '张三',
  applicant_phone: '13800138001',
  applicant_id_card: '510104199001011234',
  department_id: 3,
  department_name: '四川省公安厅',
  submit_time: '2026-06-05 10:30:00',
  accept_time: '2026-06-05 11:00:00',
  process_time: '2026-06-05 14:00:00',
  status: 'processing',
  handling_time: 7,
  current_handler: '李科员',
  accept_handler: '王窗口',
  materials: [
    { name: '户口本原件', required: true, uploaded: true, size: 2048000 },
    { name: '照片回执', required: true, uploaded: true, size: 512000 }
  ],
  signature: {
    name: '张三',
    time: '2026-06-05 10:35:00',
    ip: '127.0.0.1'
  },
  payment: {
    amount: '40.00',
    method: '微信支付',
    transaction_no: 'WX20260605103600123456',
    status: '支付成功'
  },
  evaluation: {
    rating: 2,
    comment: '办理速度太慢了，等了一周还没消息，希望能改进效率。',
    created_at: '2026-06-06 16:20:00'
  },
  rectification: {
    status: 'pending',
    alert_time: '2026-06-06 16:20:05',
    handler: '张主管',
    measure: '',
    result: '',
    user_satisfied: null
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<style lang="scss" scoped>
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.timeline-content {
  padding-bottom: 8px;
}

.step-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #ebeef5;
}

.material-item {
  min-width: 200px;
  max-width: 280px;
}

.signature-box {
  border: 1px dashed #dcdfe6;
  min-width: 200px;
  text-align: center;
}

.payment-info {
  max-width: 400px;
}

.rectification-section {
  margin-top: 16px;
}

:deep(.el-timeline-item__timestamp) {
  color: #909399;
}
</style>
