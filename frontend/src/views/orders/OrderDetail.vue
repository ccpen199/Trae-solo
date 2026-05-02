<template>
  <div class="order-detail">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <div>
                <span class="order-no">{{ orderData?.main_order_no }}</span>
                <el-tag :type="getStatusType(orderData?.current_status)" style="margin-left: 10px">
                  {{ getStatusLabel(orderData?.current_status) }}
                </el-tag>
              </div>
              <div>
                <el-button v-for="action in validActions" :key="action.action" :type="getActionType(action.action)" @click="handleAction(action)">
                  {{ action.label }}
                </el-button>
                <el-button @click="goBack">返回</el-button>
              </div>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="线路">{{ orderData?.route_name }}</el-descriptions-item>
            <el-descriptions-item label="车牌号">{{ orderData?.plate_number || '-' }}</el-descriptions-item>
            <el-descriptions-item label="发车时间">{{ formatTime(orderData?.departure_time) }}</el-descriptions-item>
            <el-descriptions-item label="期望完成时间">{{ formatTime(orderData?.expected_completion_time) }}</el-descriptions-item>
            <el-descriptions-item label="创建人">{{ orderData?.created_by }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(orderData?.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="状态流转" :span="2">
              <span class="status-flow">{{ orderData?.status_flow }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ orderData?.remarks || '-' }}</el-descriptions-item>
          </el-descriptions>

          <el-divider content-position="left">站点明细</el-divider>
          <el-table :data="detailList" style="width: 100%">
            <el-table-column prop="station_name" label="站点名称" width="150" />
            <el-table-column prop="scheduled_arrival_time" label="计划到站时间">
              <template #default="{ row }">
                {{ formatTime(row.scheduled_arrival_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="actual_arrival_time" label="实际到站时间">
              <template #default="{ row }">
                {{ formatTime(row.actual_arrival_time) || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="passenger_count" label="乘客数" width="100" />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="row.status === 'confirmed' ? 'success' : 'info'">
                  {{ row.status === 'confirmed' ? '已确认' : '待确认' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" v-if="canConfirmArrival">
              <template #default="{ row }">
                <el-button 
                  v-if="row.status !== 'confirmed'" 
                  type="primary" 
                  link 
                  @click="openConfirmDialog(row)"
                >
                  确认到站
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <span>时间轴</span>
          </template>
          <div class="timeline">
            <el-timeline>
              <el-timeline-item
                v-for="(event, index) in timelineList"
                :key="event.event_id"
                :type="getTimelineType(event)"
                :timestamp="formatTime(event.created_at)"
                placement="top"
              >
                <div class="timeline-item">
                  <div class="timeline-title">{{ getEventTitle(event) }}</div>
                  <div class="timeline-info" v-if="event.operator_name">操作人: {{ event.operator_name }}</div>
                  <div class="timeline-comment" v-if="event.comment">{{ event.comment }}</div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="actionDialog.visible" :title="actionDialog.title" width="500px">
      <el-form label-width="100px">
        <el-form-item label="审批意见">
          <el-input v-model="actionDialog.comment" type="textarea" :rows="3" placeholder="请输入审批意见"></el-input>
        </el-form-item>
        <el-form-item label="转派给" v-if="actionDialog.action === 'reassign'">
          <el-select v-model="actionDialog.reassign_to" placeholder="请选择" style="width: 100%">
            <el-option v-for="user in userList" :key="user.user_id" :label="user.name" :value="user.user_id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="actionDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitAction" :loading="actionLoading">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="confirmDialog.visible" title="确认到站" width="500px">
      <el-form label-width="120px">
        <el-form-item label="站点">
          <el-input v-model="confirmDialog.station_name" disabled />
        </el-form-item>
        <el-form-item label="到站时间">
          <el-date-picker
            v-model="confirmDialog.actual_arrival_time"
            type="datetime"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="乘客数">
          <el-input-number v-model="confirmDialog.passenger_count" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="confirmDialog.remarks" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="confirmDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitConfirmArrival" :loading="actionLoading">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { orderApi, arrivalApi } from '@/api'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const mainOrderNo = computed(() => route.params.mainOrderNo)

const orderData = ref(null)
const detailList = ref([])
const timelineList = ref([])
const validActions = ref([])
const actionLoading = ref(false)
const canConfirmArrival = ref(false)

const userList = [
  { user_id: 'U001', name: '张调度' },
  { user_id: 'U002', name: '李司机' },
  { user_id: 'U003', name: '王运营' }
]

const actionDialog = reactive({
  visible: false,
  title: '',
  action: '',
  comment: '',
  reassign_to: ''
})

const confirmDialog = reactive({
  visible: false,
  station_id: '',
  station_name: '',
  actual_arrival_time: '',
  passenger_count: 0,
  remarks: ''
})

const statusMap = {
  draft: { label: '草稿', type: 'info' },
  pending_schedule: { label: '待排班', type: 'warning' },
  scheduled: { label: '已排班', type: 'primary' },
  vehicle_running: { label: '运行中', type: 'success' },
  pending_arrival_prediction: { label: '待到站预测', type: 'warning' },
  arrival_predicted: { label: '已预测', type: 'primary' },
  pending_exception: { label: '待异常处理', type: 'danger' },
  exception_handled: { label: '异常已处理', type: 'info' },
  pending_statistics: { label: '待运营统计', type: 'warning' },
  completed: { label: '已完成', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' },
  cancelled: { label: '已取消', type: 'info' },
  withdrawn: { label: '已撤回', type: 'info' }
}

function getStatusLabel(status) {
  return statusMap[status]?.label || status
}

function getStatusType(status) {
  return statusMap[status]?.type || 'info'
}

function getActionType(action) {
  const types = {
    submit: 'primary',
    approve: 'success',
    reject: 'danger',
    supplement: 'warning',
    reassign: 'warning',
    withdraw: 'info',
    start_running: 'primary',
    predict_arrival: 'primary',
    confirm: 'success',
    exception: 'danger',
    resolve: 'success',
    escalate: 'warning',
    close: 'info',
    resume: 'primary',
    finalize: 'primary'
  }
  return types[action] || 'primary'
}

function getTimelineType(event) {
  const types = {
    submit: 'primary',
    approve: 'success',
    reject: 'danger',
    exception: 'danger',
    resolve: 'success'
  }
  return types[event.event_type] || 'info'
}

function getEventTitle(event) {
  const titles = {
    submit: '提交排班',
    approve: '通过审批',
    reject: '驳回',
    supplement: '补充资料',
    reassign: '转派',
    withdraw: '撤回',
    start_running: '开始运行',
    predict_arrival: '预测到站',
    confirm: '确认到站',
    exception: '标记异常',
    resolve: '解决异常',
    escalate: '升级',
    close: '关闭',
    resume: '恢复',
    finalize: '完成统计'
  }
  return titles[event.event_type] || event.event_type
}

function formatTime(time) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

async function fetchDetail() {
  try {
    const result = await orderApi.get(mainOrderNo.value)
    orderData.value = result.order
    detailList.value = result.details
    timelineList.value = result.timeline
    validActions.value = result.validActions
    
    canConfirmArrival.value = ['vehicle_running', 'pending_arrival_prediction', 'arrival_predicted'].includes(orderData.value.current_status)
  } catch (error) {
    console.error('获取详情失败:', error)
  }
}

function handleAction(action) {
  const titles = {
    submit: '提交排班',
    approve: '通过审批',
    reject: '驳回',
    supplement: '补充资料',
    reassign: '转派',
    withdraw: '撤回',
    start_running: '开始运行',
    predict_arrival: '预测到站',
    confirm: '确认',
    exception: '标记异常',
    resolve: '解决异常',
    escalate: '升级',
    close: '关闭',
    resume: '恢复',
    finalize: '完成统计'
  }
  
  actionDialog.action = action.action
  actionDialog.title = titles[action.action] || action.action
  actionDialog.comment = ''
  actionDialog.reassign_to = ''
  actionDialog.visible = true
}

async function submitAction() {
  actionLoading.value = true
  try {
    const data = {
      action: actionDialog.action,
      comment: actionDialog.comment
    }
    
    if (actionDialog.action === 'reassign' && actionDialog.reassign_to) {
      data.reassign_to = actionDialog.reassign_to
    }
    
    await orderApi.action(mainOrderNo.value, data)
    ElMessage.success('操作成功')
    actionDialog.visible = false
    fetchDetail()
  } catch (error) {
    console.error('操作失败:', error)
  } finally {
    actionLoading.value = false
  }
}

function openConfirmDialog(row) {
  confirmDialog.station_id = row.station_id
  confirmDialog.station_name = row.station_name
  confirmDialog.actual_arrival_time = new Date().toISOString().slice(0, 19)
  confirmDialog.passenger_count = row.passenger_count || 0
  confirmDialog.remarks = ''
  confirmDialog.visible = true
}

async function submitConfirmArrival() {
  actionLoading.value = true
  try {
    await arrivalApi.confirm(mainOrderNo.value, {
      station_id: confirmDialog.station_id,
      actual_arrival_time: confirmDialog.actual_arrival_time,
      passenger_count: confirmDialog.passenger_count,
      remarks: confirmDialog.remarks
    })
    ElMessage.success('确认成功')
    confirmDialog.visible = false
    fetchDetail()
  } catch (error) {
    console.error('确认失败:', error)
  } finally {
    actionLoading.value = false
  }
}

function goBack() {
  router.push('/orders')
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-no {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.status-flow {
  color: #409EFF;
  font-family: monospace;
}

.timeline {
  max-height: 600px;
  overflow-y: auto;
}

.timeline-item {
  padding: 5px 0;
}

.timeline-title {
  font-weight: 500;
  color: #303133;
}

.timeline-info {
  font-size: 12px;
  color: #909399;
  margin-top: 3px;
}

.timeline-comment {
  font-size: 13px;
  color: #606266;
  margin-top: 5px;
  padding: 5px;
  background: #f5f7fa;
  border-radius: 4px;
}
</style>
