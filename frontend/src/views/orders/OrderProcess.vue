<template>
  <div class="order-process">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/orders' }">订单管理</el-breadcrumb-item>
            <el-breadcrumb-item :to="{ path: `/orders/${route.params.orderId}` }">订单详情</el-breadcrumb-item>
            <el-breadcrumb-item>处理订单</el-breadcrumb-item>
          </el-breadcrumb>
          <el-button @click="router.back()">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </template>

      <el-steps :active="currentStepIndex" align-center style="margin-bottom: 40px">
        <el-step title="待加载模型" :status="getStepStatus(0)">
          <template #icon>
            <el-icon size="24"><Upload /></el-icon>
          </template>
        </el-step>
        <el-step title="待交互查看" :status="getStepStatus(1)">
          <template #icon>
            <el-icon size="24"><View /></el-icon>
          </template>
        </el-step>
        <el-step title="待选择配置" :status="getStepStatus(2)">
          <template #icon>
            <el-icon size="24"><Setting /></el-icon>
          </template>
        </el-step>
        <el-step title="待生成报价" :status="getStepStatus(3)">
          <template #icon>
            <el-icon size="24"><Money /></el-icon>
          </template>
        </el-step>
        <el-step title="待留资" :status="getStepStatus(4)">
          <template #icon>
            <el-icon size="24"><User /></el-icon>
          </template>
        </el-step>
      </el-steps>

      <el-row :gutter="20">
        <el-col :span="16">
          <el-card shadow="never">
            <template #header>
              <div class="section-header">
                <span>订单信息</span>
                <el-tag :type="STATUS_COLOR[order?.current_status]">
                  {{ STATUS_LABEL[order?.current_status] }}
                </el-tag>
              </div>
            </template>
            
            <el-descriptions :column="2" border>
              <el-descriptions-item label="订单号">{{ order?.order_no }}</el-descriptions-item>
              <el-descriptions-item label="模型名称">{{ order?.model_name }}</el-descriptions-item>
              <el-descriptions-item label="模型类型">{{ getModelTypeLabel(order?.model_type) }}</el-descriptions-item>
              <el-descriptions-item label="负责人">{{ order?.responsible_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="成本限额">
                <span v-if="order?.cost_limit !== null">¥{{ order.cost_limit.toFixed(2) }}</span>
                <span v-else>-</span>
              </el-descriptions-item>
              <el-descriptions-item label="实际金额">
                <span v-if="order?.actual_cost !== null">¥{{ order.actual_cost.toFixed(2) }}</span>
                <span v-else>-</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card shadow="never" style="margin-top: 20px">
            <template #header>
              <span>执行操作</span>
            </template>

            <div v-if="showSubmitModel">
              <h4 style="margin-bottom: 16px">提交模型信息</h4>
              <el-alert
                title="确认提交后，订单将流转至设计师进行材质校验和交互查看"
                type="info"
                :closable="false"
                style="margin-bottom: 20px"
              />
              <el-form label-width="100px">
                <el-form-item label="备注">
                  <el-input
                    v-model="submitData.comment"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入备注信息（可选）"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :loading="submitting" @click="handleSubmitModel">
                    提交模型
                  </el-button>
                </el-form-item>
              </el-form>
            </div>

            <div v-if="showReviewActions">
              <h4 style="margin-bottom: 16px">材质校验与交互确认</h4>
              
              <el-card shadow="never" style="margin-bottom: 20px">
                <template #header>
                  <span>材质评分（模拟）</span>
                </template>
                <el-form label-width="100px">
                  <el-form-item label="纹理质量">
                    <el-rate v-model="reviewData.textureQuality" :max="5" show-text />
                  </el-form-item>
                  <el-form-item label="材质兼容性">
                    <el-select v-model="reviewData.materialType" placeholder="选择材质类型" style="width: 200px">
                      <el-option
                        v-for="item in MATERIAL_TYPES"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="文件大小 (MB)">
                    <el-input-number v-model="reviewData.fileSize" :min="0" :precision="2" />
                  </el-form-item>
                  <el-form-item label="分辨率">
                    <el-radio-group v-model="reviewData.resolution">
                      <el-radio :label="1024">1024x1024</el-radio>
                      <el-radio :label="2048">2048x2048</el-radio>
                      <el-radio :label="4096">4096x4096</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-form>
              </el-card>

              <el-divider>执行动作</el-divider>
              
              <el-row :gutter="12">
                <el-col :span="6">
                  <el-button type="success" :loading="submitting" @click="handleApprove" style="width: 100%">
                    <el-icon><CircleCheck /></el-icon>
                    审核通过
                  </el-button>
                </el-col>
                <el-col :span="6">
                  <el-button type="danger" :loading="submitting" @click="handleReject" style="width: 100%">
                    <el-icon><CircleClose /></el-icon>
                    驳回
                  </el-button>
                </el-col>
                <el-col :span="6">
                  <el-button type="warning" :loading="submitting" @click="handleSupplement" style="width: 100%">
                    <el-icon><DocumentAdd /></el-icon>
                    要求补充资料
                  </el-button>
                </el-col>
                <el-col :span="6">
                  <el-button type="info" :loading="submitting" @click="showTransferDialog = true" style="width: 100%">
                    <el-icon><Share /></el-icon>
                    转派
                  </el-button>
                </el-col>
              </el-row>
            </div>

            <div v-if="showSelectConfig">
              <h4 style="margin-bottom: 16px">配置选择</h4>
              <el-alert
                title="根据热点配置和业务规则选择配置项，确认后流转至销售生成报价"
                type="info"
                :closable="false"
                style="margin-bottom: 20px"
              />
              
              <el-form label-width="100px">
                <el-form-item label="材质选择">
                  <el-select v-model="configData.materialType" placeholder="选择材质" style="width: 200px">
                    <el-option
                      v-for="item in MATERIAL_TYPES"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="颜色选项">
                  <el-checkbox-group v-model="configData.colors">
                    <el-checkbox label="red">红色</el-checkbox>
                    <el-checkbox label="blue">蓝色</el-checkbox>
                    <el-checkbox label="black">黑色</el-checkbox>
                    <el-checkbox label="white">白色</el-checkbox>
                    <el-checkbox label="gray">灰色</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                <el-form-item label="功能配置">
                  <el-checkbox-group v-model="configData.features">
                    <el-checkbox label="animation">动画</el-checkbox>
                    <el-checkbox label="interactive_hotspot">交互热点</el-checkbox>
                    <el-checkbox label="ar_support">AR支持</el-checkbox>
                    <el-checkbox label="custom_lighting">自定义光照</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                <el-form-item label="备注">
                  <el-input
                    v-model="configData.comment"
                    type="textarea"
                    :rows="2"
                    placeholder="请输入备注信息（可选）"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :loading="submitting" @click="handleSelectConfig">
                    确认配置
                  </el-button>
                </el-form-item>
              </el-form>
            </div>

            <div v-if="showGenerateQuote">
              <h4 style="margin-bottom: 16px">生成报价</h4>
              <el-alert
                title="生成报价前系统将锁定配置器，避免多端并发修改"
                type="warning"
                :closable="false"
                style="margin-bottom: 20px"
              />
              
              <el-form label-width="100px">
                <el-form-item label="基础成本">
                  <el-input-number
                    v-model="quoteData.baseCost"
                    :min="0"
                    :precision="2"
                    style="width: 200px"
                    @change="calculateQuote"
                  />
                </el-form-item>
                <el-form-item label="材质成本">
                  <el-input-number
                    v-model="quoteData.materialCost"
                    :min="0"
                    :precision="2"
                    style="width: 200px"
                    @change="calculateQuote"
                  />
                </el-form-item>
                <el-form-item label="功能成本">
                  <el-input-number
                    v-model="quoteData.featureCost"
                    :min="0"
                    :precision="2"
                    style="width: 200px"
                    @change="calculateQuote"
                  />
                </el-form-item>
                <el-divider />
                <el-form-item label="报价总额">
                  <el-input-number
                    v-model="quoteData.totalCost"
                    :min="0"
                    :precision="2"
                    disabled
                    style="width: 200px"
                  />
                  <el-tag v-if="quoteData.totalCost > (order?.cost_limit || 100000)" type="danger" style="margin-left: 12px">
                    超出成本限额！
                  </el-tag>
                </el-form-item>
                <el-form-item label="备注">
                  <el-input
                    v-model="quoteData.comment"
                    type="textarea"
                    :rows="2"
                    placeholder="请输入备注信息（可选）"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :loading="submitting" @click="handleGenerateQuote">
                    生成报价
                  </el-button>
                </el-form-item>
              </el-form>
            </div>

            <div v-if="showSubmitLead">
              <h4 style="margin-bottom: 16px">留资确认</h4>
              <el-alert
                title="确认留资后订单流程闭环，状态标记为已完成"
                type="info"
                :closable="false"
                style="margin-bottom: 20px"
              />
              
              <el-descriptions :column="1" border style="margin-bottom: 20px">
                <el-descriptions-item label="订单号">{{ order?.order_no }}</el-descriptions-item>
                <el-descriptions-item label="报价金额">
                  <span style="font-size: 24px; font-weight: bold; color: #f56c6c">
                    ¥{{ order?.actual_cost?.toFixed(2) || '0.00' }}
                  </span>
                </el-descriptions-item>
              </el-descriptions>

              <el-form label-width="100px" :model="leadData" :rules="leadRules" ref="leadFormRef">
                <el-form-item label="姓名" prop="leadName">
                  <el-input v-model="leadData.leadName" placeholder="请输入姓名" />
                </el-form-item>
                <el-form-item label="手机号" prop="leadPhone">
                  <el-input v-model="leadData.leadPhone" placeholder="请输入手机号" />
                </el-form-item>
                <el-form-item label="邮箱">
                  <el-input v-model="leadData.leadEmail" placeholder="请输入邮箱（可选）" />
                </el-form-item>
                <el-form-item label="公司名称">
                  <el-input v-model="leadData.leadCompany" placeholder="请输入公司名称（可选）" />
                </el-form-item>
                <el-form-item label="备注">
                  <el-input
                    v-model="leadData.comment"
                    type="textarea"
                    :rows="2"
                    placeholder="请输入备注信息（可选）"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :loading="submitting" @click="handleSubmitLead">
                    确认留资
                  </el-button>
                </el-form-item>
              </el-form>
            </div>

            <div v-if="showCancel">
              <el-divider />
              <el-form label-width="100px">
                <el-form-item label="取消原因">
                  <el-input
                    v-model="cancelData.reason"
                    type="textarea"
                    :rows="2"
                    placeholder="请输入取消原因"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="danger" :loading="submitting" @click="handleCancel">
                    取消订单
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card shadow="never">
            <template #header>
              <span>可用操作</span>
            </template>
            <el-alert
              :title="order?.stateInfo?.name || '当前状态'"
              :description="order?.stateInfo?.description || ''"
              type="info"
              :closable="false"
              style="margin-bottom: 16px"
            />
            <p v-if="order?.stateInfo?.downstreamImpact">
              <strong>下游影响：</strong>{{ order.stateInfo.downstreamImpact }}
            </p>
          </el-card>

          <el-card shadow="never" style="margin-top: 20px">
            <template #header>
              <span>时间轴</span>
            </template>
            <el-timeline v-if="timeline.length > 0">
              <el-timeline-item
                v-for="(item, index) in timeline"
                :key="item.id"
                :type="getTimelineType(item.event_type)"
                :timestamp="formatDate(item.created_at)"
                placement="top"
              >
                <h4 style="margin: 0 0 4px 0; font-size: 14px">{{ item.title }}</h4>
                <p style="margin: 0; font-size: 12px; color: #909399">{{ item.content }}</p>
                <p v-if="item.operator_name" style="margin: 4px 0 0 0; font-size: 12px; color: #606266">
                  操作人：{{ item.operator_name }}
                </p>
              </el-timeline-item>
            </el-timeline>
            <el-empty description="暂无记录" v-else />
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-dialog
      v-model="showRejectDialog"
      title="驳回订单"
      width="500px"
    >
      <el-form label-width="80px">
        <el-form-item label="驳回原因" required>
          <el-input
            v-model="rejectData.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入驳回原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" :loading="submitting" @click="confirmReject">
          确认驳回
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showSupplementDialog"
      title="要求补充资料"
      width="500px"
    >
      <el-form label-width="80px">
        <el-form-item label="补充要求" required>
          <el-input
            v-model="supplementData.supplementRequest"
            type="textarea"
            :rows="4"
            placeholder="请说明需要补充的资料"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSupplementDialog = false">取消</el-button>
        <el-button type="warning" :loading="submitting" @click="confirmSupplement">
          发送要求
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showTransferDialog"
      title="转派订单"
      width="500px"
    >
      <el-form label-width="80px">
        <el-form-item label="新负责人" required>
          <el-select v-model="transferData.newResponsibleId" placeholder="选择新负责人" style="width: 100%">
            <el-option
              v-for="user in availableUsers"
              :key="user.id"
              :label="`${user.name} (${ROLE_LABEL[user.role]})`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="转派原因">
          <el-input
            v-model="transferData.transferReason"
            type="textarea"
            :rows="2"
            placeholder="请输入转派原因（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTransferDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmTransfer">
          确认转派
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, Upload, View, Setting, Money, User,
  CircleCheck, CircleClose, DocumentAdd, Share
} from '@element-plus/icons-vue'
import { 
  STATUS, STATUS_LABEL, STATUS_COLOR, 
  ROLE_LABEL, ACTIONS, ACTION_LABEL,
  MODEL_TYPES, MATERIAL_TYPES,
  EVENT_TYPES
} from '@/utils/constants'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()
const leadFormRef = ref(null)

const loading = ref(false)
const submitting = ref(false)
const order = ref(null)
const timeline = ref([])
const availableUsers = ref([])

const STEP_STATUSES = [
  STATUS.PENDING_MODEL_LOAD,
  STATUS.PENDING_INTERACTION,
  STATUS.PENDING_CONFIG_SELECTION,
  STATUS.PENDING_QUOTE,
  STATUS.PENDING_LEAD
]

const showRejectDialog = ref(false)
const showSupplementDialog = ref(false)
const showTransferDialog = ref(false)

const submitData = reactive({ comment: '' })
const reviewData = reactive({
  textureQuality: 4,
  materialType: 'wood',
  fileSize: 5,
  resolution: 2048
})
const rejectData = reactive({ reason: '' })
const supplementData = reactive({ supplementRequest: '' })
const transferData = reactive({
  newResponsibleId: null,
  transferReason: ''
})
const configData = reactive({
  materialType: 'wood',
  colors: ['black'],
  features: ['animation', 'interactive_hotspot'],
  comment: ''
})
const quoteData = reactive({
  baseCost: 0,
  materialCost: 0,
  featureCost: 0,
  totalCost: 0,
  comment: ''
})
const leadData = reactive({
  leadName: '',
  leadPhone: '',
  leadEmail: '',
  leadCompany: '',
  comment: ''
})
const cancelData = reactive({ reason: '' })

const leadRules = {
  leadName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  leadPhone: [{ required: true, message: '请输入手机号', trigger: 'blur' }]
}

const currentStepIndex = computed(() => {
  const status = order.value?.current_status
  if (status === STATUS.COMPLETED || status === STATUS.ARCHIVED) return 5
  const index = STEP_STATUSES.indexOf(status)
  return index >= 0 ? index : 0
})

const hasAction = (action) => {
  return order.value?.availableActions?.includes(action)
}

const showSubmitModel = computed(() => hasAction(ACTIONS.SUBMIT_MODEL))
const showReviewActions = computed(() => 
  hasAction(ACTIONS.APPROVE) || 
  hasAction(ACTIONS.REJECT) || 
  hasAction(ACTIONS.SUPPLEMENT) || 
  hasAction(ACTIONS.TRANSFER)
)
const showSelectConfig = computed(() => hasAction(ACTIONS.SELECT_CONFIG))
const showGenerateQuote = computed(() => hasAction(ACTIONS.GENERATE_QUOTE))
const showSubmitLead = computed(() => hasAction(ACTIONS.SUBMIT_LEAD))
const showCancel = computed(() => hasAction(ACTIONS.CANCEL))

function getStepStatus(index) {
  const status = order.value?.current_status
  if (!status) return 'wait'
  
  const currentIndex = STEP_STATUSES.indexOf(status)
  if (currentIndex > index) return 'success'
  if (currentIndex === index) return 'process'
  return 'wait'
}

function getModelTypeLabel(type) {
  const item = MODEL_TYPES.find(t => t.value === type)
  return item?.label || type
}

function getTimelineType(eventType) {
  if (eventType === 'approval' || eventType === 'lead_submit' || eventType === 'create') return 'success'
  if (eventType === 'rejection' || eventType === 'cancel') return 'danger'
  if (eventType === 'quote_generate') return 'warning'
  return 'primary'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').substring(0, 19)
}

function calculateQuote() {
  quoteData.totalCost = quoteData.baseCost + quoteData.materialCost + quoteData.featureCost
}

async function fetchOrderDetail() {
  loading.value = true
  try {
    const res = await request.get(`/orders/${route.params.orderId}`)
    order.value = res.data.order
    timeline.value = res.data.timeline || []
    
    if (order.value.actual_cost) {
      quoteData.totalCost = order.value.actual_cost
    }
  } catch (err) {
    console.error('获取订单详情失败:', err)
  } finally {
    loading.value = false
  }
}

async function fetchUsers() {
  try {
    const res = await request.get('/auth/users')
    availableUsers.value = res.data || []
  } catch (err) {
    console.error('获取用户列表失败:', err)
  }
}

async function executeAction(action, data = {}) {
  submitting.value = true
  try {
    const res = await request.post(`/orders/${route.params.orderId}/action`, {
      action,
      data
    })
    ElMessage.success(res.message || '操作成功')
    await fetchOrderDetail()
    router.push(`/orders/${route.params.orderId}`)
  } catch (err) {
    console.error('执行操作失败:', err)
  } finally {
    submitting.value = false
  }
}

async function handleSubmitModel() {
  await executeAction(ACTIONS.SUBMIT_MODEL, submitData)
}

async function handleApprove() {
  await executeAction(ACTIONS.APPROVE, {
    comment: '材质校验通过',
    materialData: {
      textureQuality: reviewData.textureQuality >= 3 ? 'good' : 'average',
      materialType: reviewData.materialType,
      fileSize: reviewData.fileSize,
      resolution: reviewData.resolution
    }
  })
}

function handleReject() {
  showRejectDialog.value = true
}

async function confirmReject() {
  if (!rejectData.reason) {
    ElMessage.warning('请输入驳回原因')
    return
  }
  showRejectDialog.value = false
  await executeAction(ACTIONS.REJECT, rejectData)
}

function handleSupplement() {
  showSupplementDialog.value = true
}

async function confirmSupplement() {
  if (!supplementData.supplementRequest) {
    ElMessage.warning('请说明需要补充的资料')
    return
  }
  showSupplementDialog.value = false
  await executeAction(ACTIONS.SUPPLEMENT, supplementData)
}

async function confirmTransfer() {
  if (!transferData.newResponsibleId) {
    ElMessage.warning('请选择新负责人')
    return
  }
  showTransferDialog.value = false
  await executeAction(ACTIONS.TRANSFER, transferData)
}

async function handleSelectConfig() {
  await executeAction(ACTIONS.SELECT_CONFIG, {
    configData: {
      ...configData,
      timestamp: Date.now()
    }
  })
}

async function handleGenerateQuote() {
  if (quoteData.totalCost <= 0) {
    ElMessage.warning('请输入有效的报价金额')
    return
  }
  await executeAction(ACTIONS.GENERATE_QUOTE, {
    actualCost: quoteData.totalCost,
    quoteData: {
      baseCost: quoteData.baseCost,
      materialCost: quoteData.materialCost,
      featureCost: quoteData.featureCost,
      comment: quoteData.comment
    }
  })
}

async function handleSubmitLead() {
  if (!leadFormRef.value) return
  
  await leadFormRef.value.validate(async (valid) => {
    if (valid) {
      await executeAction(ACTIONS.SUBMIT_LEAD, leadData)
    }
  })
}

async function handleCancel() {
  try {
    await ElMessageBox.confirm('确定要取消此订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await executeAction(ACTIONS.CANCEL, cancelData)
  } catch {
  }
}

onMounted(() => {
  fetchOrderDetail()
  fetchUsers()
})
</script>

<style scoped>
.order-process {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
