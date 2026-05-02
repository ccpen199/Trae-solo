<template>
  <div class="order-detail-page">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <el-button type="primary" link @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <span>主单详情</span>
          <div>
            <el-button 
              v-if="order?.available_actions?.length > 0" 
              type="primary" 
              @click="actionDialogVisible = true"
            >
              执行操作
            </el-button>
          </div>
        </div>
      </template>

      <el-descriptions :column="3" border v-if="order">
        <el-descriptions-item label="主单号">{{ order.order_no }}</el-descriptions-item>
        <el-descriptions-item label="标题">{{ order.title }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :class="`status-tag-${order.status}`" size="large">
            {{ order.status_text }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="流水线">{{ order.pipeline_name }}</el-descriptions-item>
        <el-descriptions-item label="当前阶段">{{ order.current_stage_text }}</el-descriptions-item>
        <el-descriptions-item label="当前责任人">{{ order.assignee_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="提交Hash">{{ order.commit_hash || '-' }}</el-descriptions-item>
        <el-descriptions-item label="提交信息">{{ order.commit_message || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ order.creator_name }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(order.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ formatTime(order.started_at) }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ formatTime(order.completed_at) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="3">{{ order.description || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">阶段明细</el-divider>
      <el-steps :active="currentStageIndex" align-center>
        <el-step
          v-for="(item, index) in order?.items || []"
          :key="item.id"
          :title="item.stage_text"
          :description="getStepDescription(item)"
          :status="getStepStatus(item)"
          :icon="getStepIcon(item)"
        />
      </el-steps>

      <el-table :data="order?.items || []" style="width: 100%; margin-top: 20px">
        <el-table-column prop="item_no" label="明细单号" width="180" />
        <el-table-column prop="stage_text" label="阶段名称" width="120" />
        <el-table-column prop="stage_order" label="顺序" width="80" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getItemTagType(scope.row.status)" size="small">
              {{ scope.row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignee_name" label="责任人" width="100" />
        <el-table-column prop="started_at" label="开始时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.started_at) || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="completed_at" label="完成时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.completed_at) || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时(秒)" width="100" />
        <el-table-column prop="error_message" label="错误信息" min-width="200" show-overflow-tooltip />
      </el-table>

      <el-divider content-position="left">时间轴</el-divider>
      <el-timeline>
        <el-timeline-item
          v-for="item in order?.timeline || []"
          :key="item.id"
          :timestamp="formatTime(item.created_at)"
          placement="top"
          :type="getTimelineType(item.action)"
          :icon="getTimelineIcon(item.action)"
        >
          <el-card>
            <h4>{{ item.action_text }}</h4>
            <p v-if="item.actor_name">操作人: {{ item.actor_name }}</p>
            <p v-if="item.details?.fromStatus">
              状态: {{ item.details.fromStatus }} -> {{ item.details.toStatus }}
            </p>
            <p v-if="item.details?.comment" style="color: #999">
              备注: {{ item.details.comment }}
            </p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 操作对话框 -->
    <el-dialog v-model="actionDialogVisible" title="执行操作" width="500px">
      <el-form v-if="order" :model="actionForm" label-width="100px">
        <el-form-item label="当前状态">
          <el-tag :class="`status-tag-${order.status}`" size="large">
            {{ order.status_text }}
          </el-tag>
        </el-form-item>
        <el-form-item label="可用动作">
          <el-radio-group v-model="actionForm.action">
            <el-radio 
              v-for="action in order.available_actions" 
              :key="action" 
              :value="action"
            >
              {{ getActionText(action) }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理结果" v-if="actionForm.action === 'start_build' || actionForm.action === 'retry_build'">
          <el-radio-group v-model="actionForm.resultData.buildSuccess">
            <el-radio :value="true">构建成功</el-radio>
            <el-radio :value="false">构建失败</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注/意见">
          <el-input 
            v-model="actionForm.comment" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入备注或审批意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="actionDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="submitAction">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrder, executeOrderAction } from '@/utils/api'
import { ArrowLeft, CircleCheck, CircleClose, Clock, Loading } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const order = ref(null)
const actionDialogVisible = ref(false)
const actionLoading = ref(false)

const actionForm = reactive({
  action: '',
  resultData: { buildSuccess: true },
  comment: ''
})

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const actionTextMap = {
  submit_code: '提交代码',
  trigger_pipeline: '触发流水线',
  start_build: '开始构建',
  retry_build: '重试构建',
  approve_deploy: '审批部署',
  start_deploy: '开始部署',
  approve_pass: '审批通过',
  reject: '驳回',
  supplement: '补充资料',
  reassign: '转派',
  rollback: '回滚',
  retry: '重试'
}

const getActionText = (action) => {
  return actionTextMap[action] || action
}

const currentStageIndex = computed(() => {
  if (!order.value?.items) return 0
  const items = order.value.items
  for (let i = 0; i < items.length; i++) {
    if (items[i].status === 'in_progress') return i
    if (items[i].status === 'pending') return i
  }
  return items.length
})

const getStepStatus = (item) => {
  if (item.status === 'completed') return 'success'
  if (item.status === 'in_progress') return 'process'
  if (item.status === 'failed') return 'error'
  if (item.status === 'skipped') return 'success'
  return 'wait'
}

const getStepIcon = (item) => {
  if (item.status === 'completed') return CircleCheck
  if (item.status === 'in_progress') return Loading
  if (item.status === 'failed') return CircleClose
  return Clock
}

const getStepDescription = (item) => {
  if (item.status === 'completed') return `耗时: ${item.duration || 0}秒`
  if (item.status === 'in_progress') return '处理中...'
  if (item.status === 'failed') return item.error_message || '失败'
  return '等待中'
}

const getItemTagType = (status) => {
  const map = {
    pending: 'info',
    in_progress: 'warning',
    completed: 'success',
    failed: 'danger',
    skipped: 'info'
  }
  return map[status] || 'info'
}

const getTimelineType = (action) => {
  const successActions = ['submit_code', 'trigger_pipeline', 'start_build', 'approve_deploy', 'start_deploy', 'approve_pass', 'complete']
  const warningActions = ['retry', 'retry_build', 'supplement', 'reassign']
  const dangerActions = ['reject', 'rollback', 'fail']
  
  if (successActions.includes(action)) return 'success'
  if (warningActions.includes(action)) return 'warning'
  if (dangerActions.includes(action)) return 'danger'
  return 'primary'
}

const getTimelineIcon = (action) => {
  if (action === 'approve_pass' || action === 'complete') return CircleCheck
  if (action === 'reject' || action === 'fail') return CircleClose
  return Clock
}

const goBack = () => {
  router.back()
}

const fetchData = async () => {
  loading.value = true
  try {
    const id = route.params.id
    const res = await getOrder(id)
    if (res.success) {
      order.value = res.data
      if (res.data.available_actions?.length > 0) {
        actionForm.action = res.data.available_actions[0]
      }
    }
  } catch (e) {
    console.error('获取数据失败', e)
  } finally {
    loading.value = false
  }
}

const submitAction = async () => {
  if (!actionForm.action) {
    ElMessage.warning('请选择要执行的动作')
    return
  }

  actionLoading.value = true
  try {
    const res = await executeOrderAction(
      order.value.id,
      actionForm.action,
      actionForm.resultData,
      actionForm.comment
    )
    if (res.success) {
      ElMessage.success('操作成功')
      actionDialogVisible.value = false
      fetchData()
    }
  } catch (e) {
    console.error('操作失败', e)
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.order-detail-page {
  min-height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
