<template>
  <div class="baggage-detail" v-if="data">
    <div class="page-header">
      <h1 class="page-title">行李详情</h1>
      <p class="page-subtitle">行李牌：{{ data.baggage.baggage_tag }}</p>
    </div>

    <div class="baggage-card">
      <div class="flex justify-between items-start">
        <div>
          <div class="baggage-tag">{{ data.baggage.baggage_tag }}</div>
          <div class="mt-2">
            <el-tag :type="getStatusType(data.baggage.status)" size="large">
              {{ getStatusText(data.baggage.status) }}
            </el-tag>
          </div>
        </div>
        <div class="text-right">
          <el-button-group>
            <el-button type="primary" @click="showNodeDialog = true">
              <el-icon><Plus /></el-icon>
              记录节点
            </el-button>
            <el-button type="danger" @click="showExceptionDialog = true">
              <el-icon><Warning /></el-icon>
              报告异常
            </el-button>
          </el-button-group>
        </div>
      </div>
      
      <div class="baggage-info">
        <div class="baggage-info-item">
          <div class="baggage-info-label">旅客姓名</div>
          <div class="baggage-info-value">{{ data.baggage.passenger_name }}</div>
        </div>
        <div class="baggage-info-item">
          <div class="baggage-info-label">联系电话</div>
          <div class="baggage-info-value">{{ data.baggage.passenger_phone || '-' }}</div>
        </div>
        <div class="baggage-info-item">
          <div class="baggage-info-label">证件号码</div>
          <div class="baggage-info-value">{{ data.baggage.passenger_id_card || '-' }}</div>
        </div>
        <div class="baggage-info-item">
          <div class="baggage-info-label">航班号</div>
          <div class="baggage-info-value">{{ data.baggage.flight_no }}</div>
        </div>
        <div class="baggage-info-item">
          <div class="baggage-info-label">航班日期</div>
          <div class="baggage-info-value">{{ data.baggage.flight_date }}</div>
        </div>
        <div class="baggage-info-item">
          <div class="baggage-info-label">航线</div>
          <div class="baggage-info-value">{{ data.baggage.departure }} → {{ data.baggage.destination }}</div>
        </div>
        <div class="baggage-info-item">
          <div class="baggage-info-label">件数</div>
          <div class="baggage-info-value">{{ data.baggage.pieces }} 件</div>
        </div>
        <div class="baggage-info-item">
          <div class="baggage-info-label">重量</div>
          <div class="baggage-info-value">{{ data.baggage.weight }} kg</div>
        </div>
        <div class="baggage-info-item">
          <div class="baggage-info-label">托运时间</div>
          <div class="baggage-info-value">{{ formatTime(data.baggage.check_in_time) }}</div>
        </div>
        <div class="baggage-info-item">
          <div class="baggage-info-label">更新时间</div>
          <div class="baggage-info-value">{{ formatTime(data.baggage.updated_at) }}</div>
        </div>
      </div>
    </div>

    <div v-if="data.has_missing_nodes" class="alert-banner warning">
      <el-icon style="margin-right: 8px;"><Warning /></el-icon>
      以下节点信息缺失：{{ data.missing_nodes.map(n => getNodeName(n)).join('、') }}
    </div>

    <el-row :gutter="20">
      <el-col :span="14">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4 flex items-center">
            <el-icon class="text-blue-500 mr-2"><Location /></el-icon>
            追踪节点
          </h3>
          <div class="timeline">
            <div 
              v-for="node in expectedNodes" 
              :key="node.type"
              :class="['timeline-node', getNodeStatusClass(node.type)]"
            >
              <div class="node-title">{{ node.name }}</div>
              <template v-if="getNodeByType(node.type)">
                <div class="node-time">{{ formatTime(getNodeByType(node.type).node_time) }}</div>
                <div v-if="getNodeByType(node.type).location" class="node-location">
                  位置：{{ getNodeByType(node.type).location }}
                </div>
                <div v-if="getNodeByType(node.type).operator" class="node-location">
                  操作员：{{ getNodeByType(node.type).operator }}
                </div>
                <div v-if="getNodeByType(node.type).remark" class="node-location">
                  备注：{{ getNodeByType(node.type).remark }}
                </div>
              </template>
              <template v-else>
                <div class="node-time text-gray-400">待处理</div>
              </template>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :span="10">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4 flex items-center">
            <el-icon class="text-red-500 mr-2"><Warning /></el-icon>
            异常记录
          </h3>
          <div v-if="data.exceptions?.length > 0">
            <div v-for="ex in data.exceptions" :key="ex.id" class="exception-card">
              <div class="flex justify-between items-start">
                <div class="exception-type">{{ ex.exception_name }}</div>
                <el-tag size="small">{{ getExceptionStatus(ex.status) }}</el-tag>
              </div>
              <div class="exception-description">{{ ex.description || '暂无详细描述' }}</div>
              <div class="exception-meta">
                {{ ex.inquiry_no }} · {{ formatTime(ex.report_time) }}
              </div>
              <div class="mt-2">
                <el-button type="primary" size="small" link @click="goToException(ex.inquiry_no)">
                  查看详情
                </el-button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state" style="padding: 40px 20px;">
            <div class="empty-text">暂无异常记录</div>
          </div>
        </div>

        <div v-if="data.compensations?.length > 0" class="card">
          <h3 class="text-lg font-semibold mb-4 flex items-center">
            <el-icon class="text-yellow-500 mr-2"><Money /></el-icon>
            赔付记录
          </h3>
          <div v-for="comp in data.compensations" :key="comp.id" class="bg-gray-50 p-3 rounded-lg mb-2">
            <div class="flex justify-between">
              <span class="font-semibold">¥{{ comp.amount }}</span>
              <el-tag :type="getCompStatusType(comp.approval_status)" size="small">
                {{ getCompStatus(comp.approval_status) }}
              </el-tag>
            </div>
            <div class="text-sm text-gray-500 mt-1">
              责任方：{{ comp.responsible_party }}
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="showNodeDialog" title="记录节点" width="500px">
      <el-form :model="nodeForm" label-width="80px">
        <el-form-item label="节点类型" required>
          <el-select v-model="nodeForm.node_type" placeholder="请选择节点" style="width: 100%;">
            <el-option
              v-for="node in availableNodes"
              :key="node.type"
              :label="node.name"
              :value="node.type"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间" required>
          <el-date-picker
            v-model="nodeForm.node_time"
            type="datetime"
            placeholder="选择时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="位置">
          <el-input v-model="nodeForm.location" placeholder="例如：T2航站楼" />
        </el-form-item>
        <el-form-item label="操作员">
          <el-input v-model="nodeForm.operator" placeholder="操作员姓名或工号" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="nodeForm.remark" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNodeDialog = false">取消</el-button>
        <el-button type="primary" @click="submitNode" :loading="submittingNode">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showExceptionDialog" title="报告异常" width="500px">
      <el-form :model="exceptionForm" label-width="80px">
        <el-form-item label="异常类型" required>
          <el-select v-model="exceptionForm.exception_type" placeholder="请选择异常类型" style="width: 100%;">
            <el-option
              v-for="type in exceptionTypes"
              :key="type.type"
              :label="type.name"
              :value="type.type"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="上报时间" required>
          <el-date-picker
            v-model="exceptionForm.report_time"
            type="datetime"
            placeholder="选择时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="exceptionForm.description" type="textarea" :rows="3" placeholder="请详细描述异常情况" />
        </el-form-item>
        <el-form-item label="上报人">
          <el-input v-model="exceptionForm.reporter" placeholder="上报人姓名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showExceptionDialog = false">取消</el-button>
        <el-button type="primary" @click="submitException" :loading="submittingException">确认</el-button>
      </template>
    </el-dialog>
  </div>

  <div v-else class="empty-state">
    <el-icon class="empty-icon"><Loading /></el-icon>
    <div class="empty-text">加载中...</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { baggageApi, nodeApi, exceptionApi } from '../api'

const route = useRoute()
const router = useRouter()

const data = ref(null)
const showNodeDialog = ref(false)
const showExceptionDialog = ref(false)
const submittingNode = ref(false)
const submittingException = ref(false)
const exceptionTypes = ref([])

const expectedNodes = [
  { type: 'check_in', name: '托运' },
  { type: 'security', name: '安检' },
  { type: 'loading', name: '装机' },
  { type: 'transfer', name: '中转' },
  { type: 'unloading', name: '卸机' },
  { type: 'carousel', name: '转盘' },
  { type: 'pickup', name: '领取' }
]

const nodeForm = reactive({
  node_type: '',
  node_time: '',
  location: '',
  operator: '',
  remark: ''
})

const exceptionForm = reactive({
  exception_type: '',
  report_time: '',
  description: '',
  reporter: ''
})

const availableNodes = computed(() => {
  if (!data.value) return []
  const existingTypes = data.value.nodes.map(n => n.node_type)
  return expectedNodes.filter(n => !existingTypes.includes(n.type))
})

async function loadData() {
  try {
    data.value = await baggageApi.getFull(route.params.tag)
  } catch (err) {
    ElMessage.error('加载失败')
    console.error(err)
  }
}

async function loadTypes() {
  try {
    exceptionTypes.value = await exceptionApi.getTypes()
  } catch (err) {
    console.error(err)
  }
}

function getNodeByType(type) {
  return data.value?.nodes?.find(n => n.node_type === type)
}

function getNodeStatusClass(type) {
  const node = getNodeByType(type)
  if (node) return 'completed'
  const existingTypes = data.value?.nodes?.map(n => n.node_type) || []
  const currentIndex = expectedNodes.findIndex(n => n.type === type)
  const hasLater = expectedNodes.slice(currentIndex + 1).some(n => existingTypes.includes(n.type))
  if (hasLater) return 'missing'
  return 'pending'
}

function getNodeName(type) {
  const node = expectedNodes.find(n => n.type === type)
  return node?.name || type
}

async function submitNode() {
  if (!nodeForm.node_type || !nodeForm.node_time) {
    ElMessage.warning('请填写完整信息')
    return
  }

  submittingNode.value = true
  try {
    await nodeApi.create({
      baggage_tag: route.params.tag,
      ...nodeForm
    })
    ElMessage.success('节点记录成功')
    showNodeDialog.value = false
    loadData()
    nodeForm.node_type = ''
    nodeForm.location = ''
    nodeForm.operator = ''
    nodeForm.remark = ''
  } catch (err) {
    if (err.response?.status === 409) {
      ElMessage.error('该节点已存在')
    } else {
      ElMessage.error('记录失败')
    }
    console.error(err)
  } finally {
    submittingNode.value = false
  }
}

async function submitException() {
  if (!exceptionForm.exception_type || !exceptionForm.report_time) {
    ElMessage.warning('请填写完整信息')
    return
  }

  submittingException.value = true
  try {
    await exceptionApi.create({
      baggage_tag: route.params.tag,
      ...exceptionForm
    })
    ElMessage.success('异常已上报')
    showExceptionDialog.value = false
    loadData()
    exceptionForm.exception_type = ''
    exceptionForm.description = ''
    exceptionForm.reporter = ''
  } catch (err) {
    ElMessage.error('上报失败')
    console.error(err)
  } finally {
    submittingException.value = false
  }
}

function goToException(inquiryNo) {
  router.push(`/admin/exceptions/${inquiryNo}`)
}

function getStatusType(status) {
  const map = {
    in_transit: 'primary',
    arrived: 'success',
    picked_up: 'success',
    exception: 'danger',
    lost: 'danger'
  }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = {
    in_transit: '运输中',
    arrived: '已到达',
    picked_up: '已领取',
    exception: '异常',
    lost: '遗失'
  }
  return map[status] || status
}

function getExceptionStatus(status) {
  const map = {
    open: '处理中',
    in_progress: '调查中',
    resolved: '已解决',
    closed: '已关闭'
  }
  return map[status] || status
}

function getCompStatus(status) {
  const map = {
    pending: '待审批',
    approved: '已批准',
    rejected: '已拒绝',
    paid: '已支付'
  }
  return map[status] || status
}

function getCompStatusType(status) {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    paid: 'success'
  }
  return map[status] || 'info'
}

function formatTime(time) {
  if (!time) return '-'
  try {
    return new Date(time).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return time
  }
}

onMounted(() => {
  loadData()
  loadTypes()
  nodeForm.node_time = new Date().toISOString().slice(0, 19).replace('T', ' ')
  exceptionForm.report_time = new Date().toISOString().slice(0, 19).replace('T', ' ')
})
</script>

<style scoped>
.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-start {
  align-items: flex-start;
}

.items-center {
  align-items: center;
}

.text-right {
  text-align: right;
}

.mt-2 {
  margin-top: 8px;
}

.mr-2 {
  margin-right: 8px;
}

.text-lg {
  font-size: 18px;
}

.text-gray-400 {
  color: #c0c4cc;
}

.text-gray-500 {
  color: #909399;
}

.text-blue-500 {
  color: #409eff;
}

.text-red-500 {
  color: #f56c6c;
}

.text-yellow-500 {
  color: #e6a23c;
}

.font-semibold {
  font-weight: 600;
}

.mb-4 {
  margin-bottom: 16px;
}

.bg-gray-50 {
  background-color: #f5f7fa;
}

.p-3 {
  padding: 12px;
}

.rounded-lg {
  border-radius: 8px;
}

.text-sm {
  font-size: 14px;
}
</style>
