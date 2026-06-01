<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header flex-between mb-20">
      <div class="flex gap-10 items-center">
        <el-button link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <h2 class="page-title">{{ goal?.title || '目标详情' }}</h2>
        <el-tag v-if="goal" :class="'dimension-' + goal.dimension" class="dimension-tag">{{ goal.dimension }}</el-tag>
      </div>
      <el-button type="primary" @click="isEditing = !isEditing">
        <el-icon v-if="!isEditing"><Edit /></el-icon>
        <el-icon v-else><Check /></el-icon>
        {{ isEditing ? '保存' : '编辑' }}
      </el-button>
    </div>

    <el-card class="card-shadow mb-20" shadow="hover">
      <template #header>
        <span class="card-title">基本信息</span>
      </template>
      <el-form v-if="goal" :model="goalForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="年份">
              <el-input v-model="goalForm.year" :disabled="!isEditing" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="维度">
              <el-select v-model="goalForm.dimension" :disabled="!isEditing" style="width: 100%">
                <el-option v-for="dim in dimensions" :key="dim" :label="dim" :value="dim" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="权重">
              <el-input-number v-model="goalForm.weight" :min="0" :max="100" :disabled="!isEditing" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标题">
              <el-input v-model="goalForm.title" :disabled="!isEditing" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止日期">
              <el-date-picker 
                v-model="goalForm.deadline" 
                type="date" 
                value-format="YYYY-MM-DD"
                :disabled="!isEditing"
                style="width: 100%" 
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述">
              <el-input 
                v-model="goalForm.description" 
                type="textarea" 
                :rows="2" 
                :disabled="!isEditing"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="flex gap-20 mt-10 goal-summary">
          <div class="summary-item">
            <span class="summary-label">总进度</span>
            <div class="summary-progress">
              <el-progress 
                :percentage="Math.round(goal.progress || 0)" 
                :status="goal.progress >= 100 ? 'success' : ''"
                :stroke-width="12"
              />
            </div>
          </div>
          <div class="summary-item">
            <span class="summary-label">关键结果</span>
            <span class="summary-value">{{ goal.kr_count || 0 }} 个</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">总投入时间</span>
            <span class="summary-value">{{ goal.total_time || 0 }}h</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">状态</span>
            <el-tag :type="getStatusType(goal.status)">{{ getStatusLabel(goal.status) }}</el-tag>
          </div>
        </div>
      </el-form>
    </el-card>

    <el-card class="card-shadow mb-20" shadow="hover">
      <template #header>
        <div class="flex-between">
          <span class="card-title">关键结果</span>
          <el-button type="primary" size="small" @click="openKRDialog">
            <el-icon><Plus /></el-icon>
            新增关键结果
          </el-button>
        </div>
      </template>
      
      <div v-if="keyResults.length === 0" class="empty-tip">
        <el-empty description="暂无关键结果" />
      </div>

      <div v-else class="kr-list">
        <div v-for="kr in keyResults" :key="kr.id" class="kr-item card-shadow">
          <div class="kr-header flex-between">
            <div class="flex gap-10 items-center">
              <h4 class="kr-title">{{ kr.title }}</h4>
              <el-tag size="small" :type="kr.progress >= 100 ? 'success' : 'warning'">
                {{ Math.round(kr.progress || 0) }}%
              </el-tag>
            </div>
            <div class="flex gap-10">
              <el-button size="small" @click="openExecutionDialog(kr)">
                <el-icon><Timer /></el-icon>
                执行记录
              </el-button>
              <el-button size="small" @click="openMilestoneDialog(kr)">
                <el-icon><Flag /></el-icon>
                里程碑
              </el-button>
              <el-dropdown @command="(cmd) => handleKRAction(cmd, kr)">
                <el-button size="small">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <div class="kr-body">
            <div class="kr-progress mb-10">
              <div class="flex-between mb-5">
                <span class="kr-progress-label">进度</span>
                <span class="kr-progress-value">{{ kr.current_value || 0 }} / {{ kr.target_value || 0 }} {{ kr.unit || '' }}</span>
              </div>
              <el-progress 
                :percentage="Math.round(kr.progress || 0)" 
                :status="kr.progress >= 100 ? 'success' : ''"
                :stroke-width="10"
              />
            </div>

            <div v-if="kr.description" class="kr-desc mb-10">
              {{ kr.description }}
            </div>

            <el-collapse v-if="kr.milestones?.length || kr.execution_records?.length">
              <el-collapse-item title="里程碑" v-if="kr.milestones?.length">
                <el-timeline>
                  <el-timeline-item 
                    v-for="m in kr.milestones" 
                    :key="m.id"
                    :timestamp="m.date"
                    :type="m.completed ? 'success' : 'warning'"
                  >
                    <div class="flex-between">
                      <span>{{ m.title }}</span>
                      <el-tag v-if="m.completed" type="success" size="small">已完成</el-tag>
                      <el-tag v-else type="warning" size="small">进行中</el-tag>
                    </div>
                    <p v-if="m.description" class="milestone-desc">{{ m.description }}</p>
                  </el-timeline-item>
                </el-timeline>
              </el-collapse-item>
              <el-collapse-item title="执行记录" v-if="kr.execution_records?.length">
                <el-table :data="kr.execution_records" size="small">
                  <el-table-column prop="date" label="日期" width="120" />
                  <el-table-column prop="progress_delta" label="进度增量" width="100">
                    <template #default="{ row }">+{{ row.progress_delta }}</template>
                  </el-table-column>
                  <el-table-column prop="time_spent" label="投入时间" width="100">
                    <template #default="{ row }">{{ row.time_spent }}h</template>
                  </el-table-column>
                  <el-table-column prop="description" label="描述" />
                </el-table>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
      </div>
    </el-card>

    <el-dialog 
      v-model="krDialogVisible" 
      :title="editingKR ? '编辑关键结果' : '新增关键结果'" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="krFormRef" 
        :model="krForm" 
        :rules="krFormRules" 
        label-width="100px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="krForm.title" placeholder="请输入关键结果标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="krForm.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="目标值" prop="target_value">
          <el-input-number v-model="krForm.target_value" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="当前值" prop="current_value">
          <el-input-number v-model="krForm.current_value" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="krForm.unit" placeholder="如：次、小时、个" />
        </el-form-item>
        <el-form-item label="权重" prop="weight">
          <el-input-number v-model="krForm.weight" :min="0" :max="100" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="krDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveKR" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog 
      v-model="executionDialogVisible" 
      title="新增执行记录" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="executionFormRef" 
        :model="executionForm" 
        :rules="executionFormRules" 
        label-width="100px"
      >
        <el-form-item label="日期" prop="date">
          <el-date-picker 
            v-model="executionForm.date" 
            type="date" 
            value-format="YYYY-MM-DD"
            style="width: 100%" 
          />
        </el-form-item>
        <el-form-item label="进度增量" prop="progress_delta">
          <el-input-number v-model="executionForm.progress_delta" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="投入时间(h)" prop="time_spent">
          <el-input-number v-model="executionForm.time_spent" :min="0" :step="0.5" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="executionForm.description" type="textarea" :rows="3" placeholder="请输入执行描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="executionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveExecution" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog 
      v-model="milestoneDialogVisible" 
      title="新增里程碑" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="milestoneFormRef" 
        :model="milestoneForm" 
        :rules="milestoneFormRules" 
        label-width="100px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="milestoneForm.title" placeholder="请输入里程碑标题" />
        </el-form-item>
        <el-form-item label="日期" prop="date">
          <el-date-picker 
            v-model="milestoneForm.date" 
            type="date" 
            value-format="YYYY-MM-DD"
            style="width: 100%" 
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="milestoneForm.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="目标值">
          <el-input-number v-model="milestoneForm.target_value" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="milestoneDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveMilestone" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { goalApi, executionApi } from '@/api'

const route = useRoute()
const router = useRouter()
const goalId = route.params.id

const loading = ref(false)
const submitting = ref(false)
const isEditing = ref(false)

const goal = ref(null)
const dimensions = ref([])
const keyResults = ref([])

const goalForm = reactive({
  year: '',
  dimension: '',
  title: '',
  description: '',
  weight: 0,
  deadline: ''
})

const krDialogVisible = ref(false)
const editingKR = ref(null)
const krFormRef = ref(null)
const krForm = reactive({
  title: '',
  description: '',
  target_value: 0,
  current_value: 0,
  unit: '',
  weight: 0
})
const krFormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  target_value: [{ required: true, message: '请输入目标值', trigger: 'blur' }],
  current_value: [{ required: true, message: '请输入当前值', trigger: 'blur' }],
  weight: [{ required: true, message: '请输入权重', trigger: 'blur' }]
}

const executionDialogVisible = ref(false)
const currentKR = ref(null)
const executionFormRef = ref(null)
const executionForm = reactive({
  date: '',
  progress_delta: 0,
  time_spent: 0,
  description: ''
})
const executionFormRules = {
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  progress_delta: [{ required: true, message: '请输入进度增量', trigger: 'blur' }],
  time_spent: [{ required: true, message: '请输入投入时间', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }]
}

const milestoneDialogVisible = ref(false)
const milestoneFormRef = ref(null)
const milestoneForm = reactive({
  title: '',
  date: '',
  description: '',
  target_value: 0
})
const milestoneFormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

function getStatusType(status) {
  const map = { active: 'success', paused: 'warning', completed: 'info', abandoned: 'danger' }
  return map[status] || 'info'
}

function getStatusLabel(status) {
  const map = { active: '进行中', paused: '已暂停', completed: '已完成', abandoned: '已放弃' }
  return map[status] || status
}

async function fetchDimensions() {
  try {
    const res = await goalApi.getDimensions()
    dimensions.value = res || []
  } catch (err) {
    ElMessage.error('获取维度列表失败')
  }
}

async function fetchGoalDetail() {
  loading.value = true
  try {
    const res = await goalApi.getGoalDetail(goalId)
    goal.value = res
    keyResults.value = res?.key_results || []
    Object.assign(goalForm, {
      year: res?.year,
      dimension: res?.dimension,
      title: res?.title,
      description: res?.description,
      weight: res?.weight,
      deadline: res?.deadline
    })
  } catch (err) {
    ElMessage.error('获取目标详情失败')
  } finally {
    loading.value = false
  }
}

watch(isEditing, async (newVal, oldVal) => {
  if (oldVal === true && newVal === false) {
    try {
      submitting.value = true
      await goalApi.updateGoal(goalId, goalForm)
      ElMessage.success('保存成功')
      fetchGoalDetail()
    } catch (err) {
      ElMessage.error('保存失败')
      isEditing.value = true
    } finally {
      submitting.value = false
    }
  }
})

function openKRDialog(kr = null) {
  editingKR.value = kr
  if (kr) {
    Object.assign(krForm, {
      title: kr.title,
      description: kr.description || '',
      target_value: kr.target_value,
      current_value: kr.current_value,
      unit: kr.unit || '',
      weight: kr.weight
    })
  } else {
    Object.assign(krForm, {
      title: '',
      description: '',
      target_value: 0,
      current_value: 0,
      unit: '',
      weight: 0
    })
  }
  krFormRef.value?.resetFields()
  krDialogVisible.value = true
}

async function handleSaveKR() {
  if (!krFormRef.value) return
  try {
    await krFormRef.value.validate()
    submitting.value = true
    if (editingKR.value) {
      await goalApi.updateKR(editingKR.value.id, krForm)
      ElMessage.success('更新成功')
    } else {
      await goalApi.createKR(goalId, krForm)
      ElMessage.success('创建成功')
    }
    krDialogVisible.value = false
    fetchGoalDetail()
  } catch (err) {
    if (err !== false) {
      ElMessage.error('保存失败')
    }
  } finally {
    submitting.value = false
  }
}

async function handleKRAction(cmd, kr) {
  if (cmd === 'edit') {
    openKRDialog(kr)
  } else if (cmd === 'delete') {
    try {
      await ElMessageBox.confirm('确定要删除这个关键结果吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await goalApi.deleteKR(kr.id)
      ElMessage.success('删除成功')
      fetchGoalDetail()
    } catch (err) {
      if (err !== 'cancel') {
        ElMessage.error('删除失败')
      }
    }
  }
}

function openExecutionDialog(kr) {
  currentKR.value = kr
  Object.assign(executionForm, {
    date: dayjs().format('YYYY-MM-DD'),
    progress_delta: 0,
    time_spent: 0,
    description: ''
  })
  executionFormRef.value?.resetFields()
  executionDialogVisible.value = true
}

async function handleSaveExecution() {
  if (!executionFormRef.value) return
  try {
    await executionFormRef.value.validate()
    submitting.value = true
    await executionApi.createExecutionRecord({
      key_result_id: currentKR.value.id,
      ...executionForm
    })
    ElMessage.success('记录成功')
    executionDialogVisible.value = false
    fetchGoalDetail()
  } catch (err) {
    if (err !== false) {
      ElMessage.error('保存失败')
    }
  } finally {
    submitting.value = false
  }
}

function openMilestoneDialog(kr) {
  currentKR.value = kr
  Object.assign(milestoneForm, {
    title: '',
    date: '',
    description: '',
    target_value: 0
  })
  milestoneFormRef.value?.resetFields()
  milestoneDialogVisible.value = true
}

async function handleSaveMilestone() {
  if (!milestoneFormRef.value) return
  try {
    await milestoneFormRef.value.validate()
    submitting.value = true
    await executionApi.createMilestone({
      key_result_id: currentKR.value.id,
      ...milestoneForm
    })
    ElMessage.success('创建成功')
    milestoneDialogVisible.value = false
    fetchGoalDetail()
  } catch (err) {
    if (err !== false) {
      ElMessage.error('保存失败')
    }
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push('/goals')
}

onMounted(() => {
  fetchDimensions()
  fetchGoalDetail()
})
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.goal-summary {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.summary-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-label {
  font-size: 13px;
  color: #909399;
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.summary-progress {
  width: 100%;
}

.kr-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kr-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  background-color: #fff;
}

.kr-header {
  margin-bottom: 16px;
}

.kr-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.kr-progress-label {
  font-size: 13px;
  color: #606266;
}

.kr-progress-value {
  font-size: 13px;
  font-weight: 500;
  color: #409eff;
}

.kr-desc {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.milestone-desc {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.empty-tip {
  padding: 40px 0;
}
</style>
