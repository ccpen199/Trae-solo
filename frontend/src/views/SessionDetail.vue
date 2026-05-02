<template>
  <div class="session-detail-container">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <el-button type="primary" link @click="goBack">
                  <el-icon><ArrowLeft /></el-icon>返回
                </el-button>
                <span class="title">{{ sessionDetail?.session?.session_no }}</span>
                <el-tag :type="getStatusType(sessionDetail?.session?.status)" size="large">
                  {{ getStatusLabel(sessionDetail?.session?.status) }}
                </el-tag>
              </div>
              <div class="header-actions">
                <template v-for="action in sessionDetail?.availableActions" :key="action.action">
                  <el-button 
                    :type="getButtonType(action.type)" 
                    @click="handleAction(action.action)"
                  >
                    {{ action.label }}
                  </el-button>
                </template>
              </div>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="房源名称">
              {{ sessionDetail?.session?.house_name }}
            </el-descriptions-item>
            <el-descriptions-item label="房源地址">
              {{ sessionDetail?.session?.address }}
            </el-descriptions-item>
            <el-descriptions-item label="购房者">
              {{ sessionDetail?.session?.buyer_name }}
            </el-descriptions-item>
            <el-descriptions-item label="经纪人">
              {{ sessionDetail?.session?.agent_name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="全景图">
              {{ sessionDetail?.session?.panoramic_name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="户型图">
              {{ sessionDetail?.session?.floor_plan_name || '-' }}
              <el-tag v-if="sessionDetail?.session?.is_locked" type="warning" size="small" style="margin-left: 8px;">
                已锁定
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ sessionDetail?.session?.created_at }}
            </el-descriptions-item>
            <el-descriptions-item label="更新时间">
              {{ sessionDetail?.session?.updated_at }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card style="margin-top: 20px;">
          <template #header>
            <span>流程进度</span>
          </template>
          <el-steps :active="currentStepIndex" align-center finish-status="success">
            <el-step title="选择房源" icon="OfficeBuilding">
              <template #description>
                <span :class="getStepClass(0)">购房者选择意向房源</span>
              </template>
            </el-step>
            <el-step title="进入3D空间" icon="VideoCamera">
              <template #description>
                <span :class="getStepClass(1)">经纪人准备3D全景</span>
              </template>
            </el-step>
            <el-step title="查看热点" icon="MapLocation">
              <template #description>
                <span :class="getStepClass(2)">购房者查看热点信息</span>
              </template>
            </el-step>
            <el-step title="咨询预约" icon="Calendar">
              <template #description>
                <span :class="getStepClass(3)">经纪人确认预约</span>
              </template>
            </el-step>
            <el-step title="完成留资" icon="UserFilled">
              <template #description>
                <span :class="getStepClass(4)">购房者完成信息填写</span>
              </template>
            </el-step>
          </el-steps>
        </el-card>

        <el-card v-if="sessionDetail?.hotspots?.length > 0" style="margin-top: 20px;">
          <template #header>
            <span>热点信息</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="12" v-for="hotspot in sessionDetail.hotspots" :key="hotspot.id">
              <el-card shadow="hover" class="hotspot-card">
                <div class="hotspot-header">
                  <el-icon :size="20" :color="hotspot.type === 'navigation' ? '#409EFF' : '#67C23A'">
                    <component :is="hotspot.type === 'navigation' ? 'Guide' : 'InfoFilled'" />
                  </el-icon>
                  <span class="hotspot-name">{{ hotspot.name }}</span>
                  <el-tag :type="hotspot.type === 'navigation' ? 'primary' : 'success'" size="small">
                    {{ hotspot.type === 'navigation' ? '导航' : '信息' }}
                  </el-tag>
                </div>
                <p class="hotspot-desc">{{ hotspot.description }}</p>
                <div class="hotspot-position">
                  位置: ({{ hotspot.x }}, {{ hotspot.y }}, {{ hotspot.z }})
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-card>

        <el-card style="margin-top: 20px;">
          <template #header>
            <span>状态流转记录</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(flow, index) in sessionDetail?.statusFlows"
              :key="flow.id"
              :timestamp="flow.created_at"
              placement="top"
            >
              <el-card shadow="never" :body-style="{ padding: '12px 16px' }">
                <div class="flow-header">
                  <span class="flow-action">{{ getActionLabel(flow.action) }}</span>
                  <el-tag :type="getStatusType(flow.to_status)" size="small">
                    {{ getStatusLabel(flow.to_status) }}
                  </el-tag>
                </div>
                <p class="flow-operator">操作人: {{ flow.operator_name }}</p>
                <p v-if="flow.remark" class="flow-remark">备注: {{ flow.remark }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="quick-actions">
            <template v-if="canEnter3dSpace">
              <el-button type="primary" @click="open3dDialog" style="width: 100%; margin-bottom: 12px;">
                <el-icon><VideoCamera /></el-icon>进入3D空间
              </el-button>
            </template>
            <template v-if="canViewHotspot">
              <el-button type="success" @click="openHotspotDialog" style="width: 100%; margin-bottom: 12px;">
                <el-icon><MapLocation /></el-icon>查看热点
              </el-button>
            </template>
            <template v-if="canConsult">
              <el-button type="warning" @click="openConsultDialog" style="width: 100%; margin-bottom: 12px;">
                <el-icon><Calendar /></el-icon>咨询预约
              </el-button>
            </template>
            <template v-if="canCaptureLead">
              <el-button type="success" @click="openLeadDialog" style="width: 100%; margin-bottom: 12px;">
                <el-icon><UserFilled /></el-icon>完成留资
              </el-button>
            </template>
            <template v-if="canCancel">
              <el-button type="danger" @click="handleCancel" style="width: 100%;">
                <el-icon><Delete /></el-icon>撤销会话
              </el-button>
            </template>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogVisible.enter3d" title="进入3D空间" width="500px">
      <el-form :model="enter3dForm" label-width="100px">
        <el-form-item label="选择全景图">
          <el-select v-model="enter3dForm.panoramic_id" placeholder="请选择全景图" style="width: 100%;">
            <el-option 
              v-for="p in houseDetail?.panoramics" 
              :key="p.id" 
              :label="p.name" 
              :value="p.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择户型图">
          <el-select v-model="enter3dForm.floor_plan_id" placeholder="请选择户型图（将锁定）" style="width: 100%;">
            <el-option 
              v-for="f in houseDetail?.floorPlans" 
              :key="f.id" 
              :label="f.name" 
              :value="f.id" 
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible.enter3d = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitEnter3d">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogVisible.hotspot" title="查看热点" width="500px">
      <el-form :model="hotspotForm" label-width="100px">
        <el-form-item label="选择热点">
          <el-select v-model="hotspotForm.hotspot_id" placeholder="请选择热点" style="width: 100%;">
            <el-option 
              v-for="h in sessionDetail?.hotspots" 
              :key="h.id" 
              :label="h.name" 
              :value="h.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作">
          <el-radio-group v-model="hotspotForm.action">
            <el-radio value="approve">确认通过</el-radio>
            <el-radio value="reject">驳回</el-radio>
            <el-radio value="request_info">需要补充资料</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="hotspotForm.remark" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible.hotspot = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitHotspot">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogVisible.consult" title="咨询预约" width="600px">
      <el-form :model="consultForm" label-width="120px">
        <el-form-item label="操作类型">
          <el-radio-group v-model="consultForm.action">
            <el-radio value="approve">确认预约</el-radio>
            <el-radio value="reject">驳回</el-radio>
            <el-radio value="request_info">补充资料</el-radio>
            <el-radio value="reassign">转派</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="consultForm.action === 'approve'">
          <el-form-item label="预约时间">
            <el-date-picker
              v-model="consultForm.appointment_time"
              type="datetime"
              placeholder="选择预约时间"
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item label="联系人">
            <el-input v-model="consultForm.contact_name" placeholder="请输入联系人姓名" />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="consultForm.contact_phone" placeholder="请输入联系电话" />
          </el-form-item>
        </template>
        <template v-if="consultForm.action === 'reassign'">
          <el-form-item label="选择经纪人">
            <el-select v-model="consultForm.assigned_agent_id" placeholder="请选择转派的经纪人" style="width: 100%;">
              <el-option 
                v-for="agent in agents" 
                :key="agent.id" 
                :label="agent.name" 
                :value="agent.id" 
              />
            </el-select>
          </el-form-item>
        </template>
        <el-form-item label="备注">
          <el-input 
            v-model="consultForm.remark" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible.consult = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitConsult">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogVisible.lead" title="完成留资" width="500px">
      <el-form :model="leadForm" :rules="leadRules" ref="leadFormRef" label-width="100px">
        <el-form-item label="购房人姓名" prop="buyer_name">
          <el-input v-model="leadForm.buyer_name" placeholder="请输入购房人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="buyer_phone">
          <el-input v-model="leadForm.buyer_phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="leadForm.buyer_email" placeholder="请输入邮箱（可选）" />
        </el-form-item>
        <el-form-item label="意向程度">
          <el-select v-model="leadForm.interest_level" placeholder="请选择意向程度" style="width: 100%;">
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="leadForm.remark" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible.lead = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitLead">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { sessionsApi, housesApi } from '@/api'
import { useUserStore } from '@/store/user'
import { ArrowLeft, VideoCamera, MapLocation, Calendar, UserFilled, Delete, Guide, InfoFilled } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)
const sessionDetail = ref(null)
const houseDetail = ref(null)
const agents = ref([])
const leadFormRef = ref(null)

const dialogVisible = reactive({
  enter3d: false,
  hotspot: false,
  consult: false,
  lead: false
})

const enter3dForm = reactive({
  panoramic_id: '',
  floor_plan_id: ''
})

const hotspotForm = reactive({
  hotspot_id: '',
  action: 'approve',
  remark: ''
})

const consultForm = reactive({
  action: 'approve',
  appointment_time: null,
  contact_name: '',
  contact_phone: '',
  assigned_agent_id: '',
  remark: ''
})

const leadForm = reactive({
  buyer_name: '',
  buyer_phone: '',
  buyer_email: '',
  interest_level: 'medium',
  remark: ''
})

const leadRules = {
  buyer_name: [{ required: true, message: '请输入购房人姓名', trigger: 'blur' }],
  buyer_phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
}

const currentStepIndex = computed(() => {
  if (!sessionDetail.value?.session) return 0
  const step = sessionDetail.value.session.current_step
  const stepMap = {
    'house_selection': 0,
    'three_d_space': 1,
    'hotspot_view': 2,
    'consultation': 3,
    'lead_capture': 4
  }
  const index = stepMap[step] || 0
  if (sessionDetail.value.session.status === 'completed') {
    return 5
  }
  return index
})

const canEnter3dSpace = computed(() => {
  const isAgent = userStore.user?.role === 'agent' || userStore.user?.role === 'admin'
  const isPending = sessionDetail.value?.session?.status === 'pending_3d_space'
  return isAgent && isPending
})

const canViewHotspot = computed(() => {
  const isBuyer = userStore.user?.role === 'buyer' || userStore.user?.role === 'admin'
  const isPending = sessionDetail.value?.session?.status === 'pending_hotspot_view'
  return isBuyer && isPending
})

const canConsult = computed(() => {
  const isAgent = userStore.user?.role === 'agent' || userStore.user?.role === 'admin'
  const isPending = sessionDetail.value?.session?.status === 'pending_consultation'
  return isAgent && isPending
})

const canCaptureLead = computed(() => {
  const isBuyer = userStore.user?.role === 'buyer' || userStore.user?.role === 'admin'
  const isPending = sessionDetail.value?.session?.status === 'pending_lead_capture'
  return isBuyer && isPending
})

const canCancel = computed(() => {
  const status = sessionDetail.value?.session?.status
  return status && !['completed', 'cancelled', 'rejected'].includes(status)
})

const getStatusType = (status) => {
  const typeMap = {
    'pending_house_selection': 'info',
    'pending_3d_space': 'warning',
    'pending_hotspot_view': 'primary',
    'pending_consultation': 'warning',
    'pending_lead_capture': 'primary',
    'completed': 'success',
    'cancelled': 'info',
    'rejected': 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusLabel = (status) => {
  const labelMap = {
    'pending_house_selection': '待选房源',
    'pending_3d_space': '待3D空间',
    'pending_hotspot_view': '待看热点',
    'pending_consultation': '待咨询预约',
    'pending_lead_capture': '待留资',
    'completed': '已完成',
    'cancelled': '已撤销',
    'rejected': '已驳回'
  }
  return labelMap[status] || status
}

const getActionLabel = (action) => {
  const labelMap = {
    'enter_3d_space': '进入3D空间',
    'hotspot_approve': '热点查看通过',
    'hotspot_reject': '热点查看驳回',
    'consultation_approve': '确认预约',
    'consultation_reject': '驳回预约',
    'lead_captured': '完成留资',
    'cancelled': '撤销会话'
  }
  return labelMap[action] || action
}

const getButtonType = (type) => {
  const typeMap = {
    'primary': 'primary',
    'danger': 'danger',
    'warning': 'warning',
    'secondary': 'info'
  }
  return typeMap[type] || 'primary'
}

const getStepClass = (index) => {
  return index < currentStepIndex.value ? 'step-completed' : ''
}

const goBack = () => {
  router.back()
}

const fetchSessionDetail = async () => {
  loading.value = true
  try {
    const res = await sessionsApi.getDetail(route.params.id)
    sessionDetail.value = res
    leadForm.value.buyer_name = res.session.buyer_name || ''
    leadForm.value.buyer_phone = res.session.buyer_phone || ''
    
    if (res.session.house_id) {
      const houseRes = await housesApi.getDetail(res.session.house_id)
      houseDetail.value = houseRes
    }
  } catch (error) {
    console.error('获取会话详情失败:', error)
  } finally {
    loading.value = false
  }
}

const handleAction = (action) => {
  if (action === 'enter_3d_space') {
    open3dDialog()
  } else if (action === 'view_hotspot') {
    openHotspotDialog()
  } else if (action === 'consultation_approve') {
    openConsultDialog()
  } else if (action === 'capture_lead') {
    openLeadDialog()
  } else if (action === 'cancel') {
    handleCancel()
  }
}

const open3dDialog = () => {
  enter3dForm.panoramic_id = ''
  enter3dForm.floor_plan_id = ''
  dialogVisible.enter3d = true
}

const openHotspotDialog = () => {
  hotspotForm.hotspot_id = sessionDetail.value?.hotspots?.[0]?.id || ''
  hotspotForm.action = 'approve'
  hotspotForm.remark = ''
  dialogVisible.hotspot = true
}

const openConsultDialog = () => {
  consultForm.action = 'approve'
  consultForm.appointment_time = null
  consultForm.contact_name = ''
  consultForm.contact_phone = ''
  consultForm.assigned_agent_id = ''
  consultForm.remark = ''
  dialogVisible.consult = true
}

const openLeadDialog = () => {
  dialogVisible.lead = true
}

const submitEnter3d = async () => {
  submitting.value = true
  try {
    await sessionsApi.enter3dSpace(route.params.id, enter3dForm)
    ElMessage.success('进入3D空间成功')
    dialogVisible.enter3d = false
    fetchSessionDetail()
  } catch (error) {
    console.error('操作失败:', error)
  } finally {
    submitting.value = false
  }
}

const submitHotspot = async () => {
  submitting.value = true
  try {
    await sessionsApi.viewHotspot(route.params.id, hotspotForm)
    ElMessage.success('操作成功')
    dialogVisible.hotspot = false
    fetchSessionDetail()
  } catch (error) {
    console.error('操作失败:', error)
  } finally {
    submitting.value = false
  }
}

const submitConsult = async () => {
  submitting.value = true
  try {
    const data = { ...consultForm }
    if (data.appointment_time) {
      data.appointment_time = data.appointment_time.toISOString()
    }
    await sessionsApi.consultation(route.params.id, data)
    ElMessage.success('操作成功')
    dialogVisible.consult = false
    fetchSessionDetail()
  } catch (error) {
    console.error('操作失败:', error)
  } finally {
    submitting.value = false
  }
}

const submitLead = async () => {
  const valid = await leadFormRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await sessionsApi.captureLead(route.params.id, leadForm)
    ElMessage.success('留资完成')
    dialogVisible.lead = false
    fetchSessionDetail()
  } catch (error) {
    console.error('操作失败:', error)
  } finally {
    submitting.value = false
  }
}

const handleCancel = async () => {
  try {
    await ElMessageBox.confirm('确定要撤销此看房会话吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await sessionsApi.cancel(route.params.id, { reason: '用户撤销' })
    ElMessage.success('撤销成功')
    fetchSessionDetail()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('撤销失败:', error)
    }
  }
}

onMounted(() => {
  fetchSessionDetail()
})
</script>

<style scoped>
.session-detail-container {
  min-height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.title {
  font-size: 16px;
  font-weight: bold;
}

.hotspot-card {
  margin-bottom: 20px;
}

.hotspot-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.hotspot-name {
  font-weight: bold;
  font-size: 14px;
}

.hotspot-desc {
  color: #606266;
  font-size: 13px;
  margin: 8px 0;
}

.hotspot-position {
  font-size: 12px;
  color: #909399;
}

.flow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.flow-action {
  font-weight: bold;
}

.flow-operator {
  font-size: 12px;
  color: #909399;
  margin: 4px 0;
}

.flow-remark {
  font-size: 13px;
  color: #606266;
}

.quick-actions {
  display: flex;
  flex-direction: column;
}

.step-completed {
  color: #67C23A;
}
</style>
