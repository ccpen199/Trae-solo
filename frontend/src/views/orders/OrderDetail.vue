<template>
  <div class="order-detail" v-loading="loading">
    <el-card>
      <template #header>
        <div class="card-header">
          <div>
            <el-button type="primary" link @click="$router.back()">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <span style="margin-left: 10px; font-size: 16px; font-weight: bold">
              {{ orderData?.order_no }} - {{ orderData?.title }}
            </span>
          </div>
          <div>
            <el-tag :class="['status-tag', orderData?.status]" size="large">
              {{ orderData?.statusLabel }}
            </el-tag>
          </div>
        </div>
      </template>

      <el-descriptions :column="4" border>
        <el-descriptions-item label="主单号">{{ orderData?.order_no }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :class="['status-tag', orderData?.status]">{{ orderData?.statusLabel }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="getPriorityType(orderData?.priority)">{{ getPriorityLabel(orderData?.priority) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="当前节点">{{ getNodeLabel(orderData?.current_node) }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ orderData?.creator_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="责任人">{{ orderData?.assignee_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="期望完成时间">{{ formatTime(orderData?.expected_finish_time) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(orderData?.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="4">{{ orderData?.description || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="采集器配置" name="collectors">
            <el-table :data="orderData?.collectors || []" stripe>
              <el-table-column prop="name" label="采集器名称" />
              <el-table-column prop="type" label="类型">
                <template #default="{ row }">
                  {{ getCollectorTypeLabel(row.type) }}
                </template>
              </el-table-column>
              <el-table-column prop="collect_interval" label="采集间隔(秒)" />
              <el-table-column prop="status" label="状态">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                    {{ row.status === 'active' ? '启用' : '草稿' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="last_collect_time" label="最后采集时间">
                <template #default="{ row }">
                  {{ formatTime(row.last_collect_time) }}
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!orderData?.collectors?.length" description="暂无采集器配置" />
          </el-tab-pane>

          <el-tab-pane label="日志索引" name="indices">
            <el-table :data="orderData?.logIndices || []" stripe>
              <el-table-column prop="index_name" label="索引名称" />
              <el-table-column prop="index_type" label="索引类型" />
              <el-table-column prop="shard_count" label="分片数" />
              <el-table-column prop="replica_count" label="副本数" />
              <el-table-column prop="total_docs" label="文档数" />
              <el-table-column prop="storage_size" label="存储大小">
                <template #default="{ row }">
                  {{ formatSize(row.storage_size) }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                    {{ row.status === 'active' ? '活跃' : '待处理' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!orderData?.logIndices?.length" description="暂无日志索引配置" />
          </el-tab-pane>

          <el-tab-pane label="字段解析规则" name="parsers">
            <el-table :data="orderData?.fieldParsers || []" stripe>
              <el-table-column prop="field_name" label="字段名称" />
              <el-table-column prop="field_type" label="字段类型" />
              <el-table-column prop="parser_type" label="解析类型" />
              <el-table-column prop="parser_pattern" label="解析规则" show-overflow-tooltip />
              <el-table-column prop="is_required" label="必填">
                <template #default="{ row }">
                  <el-tag v-if="row.is_required" type="danger">是</el-tag>
                  <span v-else>否</span>
                </template>
              </el-table-column>
              <el-table-column prop="is_indexed" label="索引">
                <template #default="{ row }">
                  <el-tag v-if="row.is_indexed" type="success">是</el-tag>
                  <span v-else>否</span>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!orderData?.fieldParsers?.length" description="暂无字段解析规则" />
          </el-tab-pane>

          <el-tab-pane label="查询语言规则" name="queryRules">
            <el-table :data="orderData?.queryRules || []" stripe>
              <el-table-column prop="rule_name" label="规则名称" />
              <el-table-column prop="rule_type" label="规则类型" />
              <el-table-column prop="query_template" label="查询模板" show-overflow-tooltip min-width="300" />
              <el-table-column prop="description" label="描述" show-overflow-tooltip />
              <el-table-column prop="is_active" label="状态">
                <template #default="{ row }">
                  <el-tag :type="row.is_active ? 'success' : 'info'">
                    {{ row.is_active ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!orderData?.queryRules?.length" description="暂无查询语言规则" />
          </el-tab-pane>

          <el-tab-pane label="告警信息" name="alerts">
            <el-table :data="orderData?.alerts || []" stripe>
              <el-table-column prop="alert_name" label="告警名称" />
              <el-table-column prop="alert_level" label="告警级别">
                <template #default="{ row }">
                  <el-tag :type="getAlertLevelType(row.alert_level)">
                    {{ getAlertLevelLabel(row.alert_level) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="alert_type" label="告警类型" />
              <el-table-column prop="trigger_condition" label="触发条件" show-overflow-tooltip />
              <el-table-column prop="assignee_name" label="责任人" />
              <el-table-column prop="status" label="状态">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'resolved' ? 'success' : 'warning'">
                    {{ row.status === 'resolved' ? '已解决' : '活跃' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="triggered_at" label="触发时间">
                <template #default="{ row }">
                  {{ formatTime(row.triggered_at) }}
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!orderData?.alerts?.length" description="暂无告警信息" />
          </el-tab-pane>

          <el-tab-pane label="时间轴" name="timeline">
            <el-timeline>
              <el-timeline-item
                v-for="(item, index) in orderData?.timelines || []"
                :key="item.id"
                :timestamp="formatTime(item.created_at)"
                placement="top"
                :type="getTimelineType(item.action_type)"
              >
                <el-card>
                  <h4>{{ item.action }}</h4>
                  <p style="margin: 10px 0; color: #606266">{{ item.content || '-' }}</p>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; color: #909399">
                    <span>操作人: {{ item.operator_name || '-' }}</span>
                    <span v-if="item.from_status && item.to_status">
                      {{ getStatusLabel(item.from_status) }} → {{ getStatusLabel(item.to_status) }}
                    </span>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-if="!orderData?.timelines?.length" description="暂无操作记录" />
          </el-tab-pane>
        </el-tabs>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <span>操作面板</span>
          </template>
          
          <div class="action-panel">
            <div v-if="orderData?.status === 'pending_collect'" class="action-section">
              <h4>采集阶段操作</h4>
              <el-button type="primary" size="large" style="width: 100%" @click="openActionDialog('submit_collect')">
                提交采集
              </el-button>
            </div>

            <div v-else-if="orderData?.status === 'pending_parse'" class="action-section">
              <h4>解析索引操作</h4>
              <el-divider>添加索引配置（可选）</el-divider>
              <el-form :model="indexForm" label-width="80px" size="small">
                <el-form-item label="索引名称">
                  <el-input v-model="indexForm.index_name" placeholder="如：logs-2024" />
                </el-form-item>
                <el-form-item label="索引类型">
                  <el-select v-model="indexForm.index_type" placeholder="选择索引类型" style="width: 100%">
                    <el-option label="标准索引" value="standard" />
                    <el-option label="全文索引" value="fulltext" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" size="small" @click="addIndexConfig">添加索引</el-button>
                </el-form-item>
              </el-form>
              
              <el-divider>添加字段解析规则（可选）</el-divider>
              <el-form :model="parserForm" label-width="80px" size="small">
                <el-form-item label="字段名称">
                  <el-input v-model="parserForm.field_name" placeholder="如：timestamp" />
                </el-form-item>
                <el-form-item label="字段类型">
                  <el-select v-model="parserForm.field_type" placeholder="选择类型" style="width: 100%">
                    <el-option label="字符串" value="string" />
                    <el-option label="数字" value="number" />
                    <el-option label="日期" value="date" />
                    <el-option label="布尔" value="boolean" />
                  </el-select>
                </el-form-item>
                <el-form-item label="解析规则">
                  <el-input v-model="parserForm.parser_pattern" placeholder="正则表达式或解析规则" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" size="small" @click="addParserConfig">添加规则</el-button>
                </el-form-item>
              </el-form>

              <el-divider>确认操作</el-divider>
              <el-form :model="actionForm" label-width="80px">
                <el-form-item label="处理意见">
                  <el-input
                    v-model="actionForm.comment"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入处理意见"
                  />
                </el-form-item>
              </el-form>
              <el-button type="success" size="large" style="width: 100%" @click="handleParseAction('approve')">
                通过（进入查询分析）
              </el-button>
              <el-button type="danger" size="large" style="width: 100%; margin-top: 10px" @click="handleParseAction('reject')">
                驳回（返回采集）
              </el-button>
            </div>

            <div v-else-if="orderData?.status === 'pending_query'" class="action-section">
              <h4>查询分析操作</h4>
              
              <el-divider>添加查询规则（可选）</el-divider>
              <el-form :model="queryForm" label-width="80px" size="small">
                <el-form-item label="规则名称">
                  <el-input v-model="queryForm.rule_name" placeholder="如：错误日志查询" />
                </el-form-item>
                <el-form-item label="查询模板">
                  <el-input
                    v-model="queryForm.query_template"
                    type="textarea"
                    :rows="2"
                    placeholder="如：level:ERROR AND message:*exception*"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" size="small" @click="addQueryRule">添加规则</el-button>
                </el-form-item>
              </el-form>

              <el-divider>确认操作</el-divider>
              <el-form :model="actionForm" label-width="80px">
                <el-form-item label="处理意见">
                  <el-input
                    v-model="actionForm.comment"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入处理意见"
                  />
                </el-form-item>
              </el-form>
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-button type="success" size="large" style="width: 100%" @click="handleQueryAction('approve')">
                    通过
                  </el-button>
                </el-col>
                <el-col :span="12">
                  <el-button type="danger" size="large" style="width: 100%" @click="handleQueryAction('reject')">
                    驳回
                  </el-button>
                </el-col>
              </el-row>
              <el-row :gutter="10" style="margin-top: 10px">
                <el-col :span="12">
                  <el-button type="warning" size="large" style="width: 100%" @click="handleQueryAction('supplement')">
                    补充资料
                  </el-button>
                </el-col>
                <el-col :span="12">
                  <el-button type="info" size="large" style="width: 100%" @click="handleQueryAction('transfer')">
                    转派
                  </el-button>
                </el-col>
              </el-row>
            </div>

            <div v-else-if="orderData?.status === 'pending_alert'" class="action-section">
              <h4>告警处理操作</h4>
              
              <el-divider>添加告警（可选）</el-divider>
              <el-form :model="alertForm" label-width="80px" size="small">
                <el-form-item label="告警名称">
                  <el-input v-model="alertForm.alert_name" placeholder="如：错误率过高告警" />
                </el-form-item>
                <el-form-item label="告警级别">
                  <el-select v-model="alertForm.alert_level" placeholder="选择级别" style="width: 100%">
                    <el-option label="信息" value="info" />
                    <el-option label="警告" value="warning" />
                    <el-option label="错误" value="error" />
                    <el-option label="紧急" value="critical" />
                  </el-select>
                </el-form-item>
                <el-form-item label="触发条件">
                  <el-input
                    v-model="alertForm.trigger_condition"
                    type="textarea"
                    :rows="2"
                    placeholder="如：错误日志 > 100条/分钟"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" size="small" @click="addAlert">添加告警</el-button>
                </el-form-item>
              </el-form>

              <el-divider>确认操作</el-divider>
              <el-form :model="actionForm" label-width="80px">
                <el-form-item label="处理意见">
                  <el-input
                    v-model="actionForm.comment"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入处理意见"
                  />
                </el-form-item>
              </el-form>
              <el-button type="success" size="large" style="width: 100%" @click="handleAlertAction('approve')">
                通过（进入归档）
              </el-button>
              <el-button type="danger" size="large" style="width: 100%; margin-top: 10px" @click="handleAlertAction('reject')">
                驳回（返回查询分析）
              </el-button>
            </div>

            <div v-else-if="orderData?.status === 'archived'" class="action-section">
              <h4>已归档</h4>
              <el-alert title="该任务已完成归档" type="success" show-icon>
                <template #default>
                  任务流程已完成，所有数据已归档。
                </template>
              </el-alert>
            </div>

            <div v-else class="action-section">
              <el-alert title="当前状态不支持操作" type="info" show-icon />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="actionDialogVisible" :title="actionDialogTitle" width="500px">
      <el-form :model="actionForm" label-width="100px">
        <el-form-item label="处理意见">
          <el-input
            v-model="actionForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入处理意见（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="actionDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="confirmAction">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrderDetail, submitCollect, parseIndex, queryAnalyze, alertHandle, archiveOrder } from '@/api/orders'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const actionLoading = ref(false)
const actionDialogVisible = ref(false)
const currentAction = ref('')
const orderData = ref(null)
const activeTab = ref('collectors')

const actionForm = reactive({
  comment: ''
})

const indexForm = reactive({
  index_name: '',
  index_type: 'standard',
  shard_count: 1,
  replica_count: 0
})

const parserForm = reactive({
  field_name: '',
  field_type: 'string',
  parser_type: 'regex',
  parser_pattern: '',
  is_required: false,
  is_indexed: true
})

const queryForm = reactive({
  rule_name: '',
  rule_type: 'search',
  query_template: '',
  description: ''
})

const alertForm = reactive({
  alert_name: '',
  alert_level: 'warning',
  alert_type: 'rule',
  trigger_condition: ''
})

const pendingIndices = ref([])
const pendingParsers = ref([])
const pendingQueryRules = ref([])
const pendingAlerts = ref([])

const actionDialogTitle = computed(() => {
  const titles = {
    submit_collect: '提交采集'
  }
  return titles[currentAction.value] || '确认操作'
})

const priorityLabels = {
  low: '低',
  normal: '中',
  high: '高',
  urgent: '紧急'
}

const priorityTypes = {
  low: 'info',
  normal: '',
  high: 'warning',
  urgent: 'danger'
}

const nodeLabels = {
  collect: '采集阶段',
  parse: '解析索引阶段',
  query: '查询分析阶段',
  alert: '告警阶段',
  archive: '已归档'
}

const collectorTypeLabels = {
  file: '文件采集',
  network: '网络采集',
  api: 'API采集',
  database: '数据库采集'
}

const statusLabels = {
  pending_collect: '待日志采集',
  pending_parse: '待解析索引',
  pending_query: '待查询分析',
  pending_alert: '待告警',
  archived: '已归档'
}

const getPriorityLabel = (priority) => priorityLabels[priority] || '中'
const getPriorityType = (priority) => priorityTypes[priority] || ''
const getNodeLabel = (node) => nodeLabels[node] || node
const getCollectorTypeLabel = (type) => collectorTypeLabels[type] || type
const getStatusLabel = (status) => statusLabels[status] || status

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const formatSize = (size) => {
  if (!size) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let s = size
  while (s >= 1024 && i < units.length - 1) {
    s /= 1024
    i++
  }
  return `${s.toFixed(2)} ${units[i]}`
}

const getAlertLevelType = (level) => {
  const types = {
    info: 'info',
    warning: 'warning',
    error: 'danger',
    critical: 'danger'
  }
  return types[level] || 'info'
}

const getAlertLevelLabel = (level) => {
  const labels = {
    info: '信息',
    warning: '警告',
    error: '错误',
    critical: '紧急'
  }
  return labels[level] || level
}

const getTimelineType = (type) => {
  const types = {
    create: 'primary',
    submit: 'success',
    approve: 'success',
    reject: 'danger',
    archive: 'info'
  }
  return types[type] || ''
}

const fetchOrderDetail = async () => {
  loading.value = true
  try {
    const res = await getOrderDetail(route.params.id)
    orderData.value = res.data
  } catch (error) {
    console.error('获取主单详情失败:', error)
  } finally {
    loading.value = false
  }
}

const openActionDialog = (action) => {
  currentAction.value = action
  actionForm.comment = ''
  actionDialogVisible.value = true
}

const addIndexConfig = () => {
  if (!indexForm.index_name.trim()) {
    ElMessage.warning('请输入索引名称')
    return
  }
  pendingIndices.value.push({ ...indexForm })
  ElMessage.success('已添加索引配置，提交时生效')
  indexForm.index_name = ''
  indexForm.index_type = 'standard'
}

const addParserConfig = () => {
  if (!parserForm.field_name.trim()) {
    ElMessage.warning('请输入字段名称')
    return
  }
  pendingParsers.value.push({ ...parserForm })
  ElMessage.success('已添加字段解析规则，提交时生效')
  parserForm.field_name = ''
  parserForm.field_type = 'string'
  parserForm.parser_pattern = ''
}

const addQueryRule = () => {
  if (!queryForm.rule_name.trim()) {
    ElMessage.warning('请输入规则名称')
    return
  }
  pendingQueryRules.value.push({ ...queryForm })
  ElMessage.success('已添加查询规则，提交时生效')
  queryForm.rule_name = ''
  queryForm.query_template = ''
}

const addAlert = () => {
  if (!alertForm.alert_name.trim()) {
    ElMessage.warning('请输入告警名称')
    return
  }
  pendingAlerts.value.push({ ...alertForm })
  ElMessage.success('已添加告警，提交时生效')
  alertForm.alert_name = ''
  alertForm.alert_level = 'warning'
  alertForm.trigger_condition = ''
}

const handleParseAction = async (action) => {
  actionLoading.value = true
  try {
    const data = {
      action,
      comment: actionForm.comment,
      logIndices: pendingIndices.value,
      fieldParsers: pendingParsers.value
    }
    await parseIndex(route.params.id, data)
    ElMessage.success(action === 'approve' ? '已通过，进入查询分析阶段' : '已驳回，返回采集阶段')
    fetchOrderDetail()
    pendingIndices.value = []
    pendingParsers.value = []
    actionForm.comment = ''
  } catch (error) {
    console.error('操作失败:', error)
  } finally {
    actionLoading.value = false
  }
}

const handleQueryAction = async (action) => {
  actionLoading.value = true
  try {
    const data = {
      action,
      comment: actionForm.comment,
      queryRules: pendingQueryRules.value
    }
    await queryAnalyze(route.params.id, data)
    const messages = {
      approve: '已通过，进入告警阶段',
      reject: '已驳回，返回解析索引阶段',
      supplement: '已标记需补充资料',
      transfer: '已转派'
    }
    ElMessage.success(messages[action] || '操作成功')
    fetchOrderDetail()
    pendingQueryRules.value = []
    actionForm.comment = ''
  } catch (error) {
    console.error('操作失败:', error)
  } finally {
    actionLoading.value = false
  }
}

const handleAlertAction = async (action) => {
  actionLoading.value = true
  try {
    const data = {
      action,
      comment: actionForm.comment,
      alerts: pendingAlerts.value
    }
    await alertHandle(route.params.id, data)
    ElMessage.success(action === 'approve' ? '已通过，任务已归档' : '已驳回，返回查询分析阶段')
    fetchOrderDetail()
    pendingAlerts.value = []
    actionForm.comment = ''
  } catch (error) {
    console.error('操作失败:', error)
  } finally {
    actionLoading.value = false
  }
}

const confirmAction = async () => {
  actionLoading.value = true
  try {
    if (currentAction.value === 'submit_collect') {
      await submitCollect(route.params.id, { comment: actionForm.comment })
      ElMessage.success('提交成功，进入解析索引阶段')
    }
    actionDialogVisible.value = false
    fetchOrderDetail()
  } catch (error) {
    console.error('操作失败:', error)
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  fetchOrderDetail()
})
</script>

<style scoped>
.order-detail {
  min-height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-section {
  padding: 10px 0;
}

.action-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

:deep(.el-tabs__content) {
  padding: 10px 0;
}

:deep(.el-timeline-item__timestamp) {
  color: #909399;
}
</style>
