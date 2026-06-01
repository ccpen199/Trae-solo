<template>
  <div class="page-container">
    <el-card class="card-shadow mb-20" shadow="never">
      <div class="flex-between week-header">
        <div class="flex gap-20 items-center">
          <el-button circle @click="changeWeek(-1)">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <div class="week-info">
            <h2 class="week-title">第 {{ currentWeek }} 周</h2>
            <p class="week-range">{{ weekStart }} ~ {{ weekEnd }}</p>
          </div>
          <el-button circle @click="changeWeek(1)">
            <el-icon><ArrowRight /></el-icon>
          </el-button>
          <el-button type="primary" plain @click="resetToCurrentWeek">
            <el-icon><Refresh /></el-icon>
            本周
          </el-button>
        </div>
        <div class="flex gap-20 items-center">
          <div class="week-stats">
            <el-tag type="success">已完成 {{ completedCount }} 项</el-tag>
            <el-tag type="warning">进行中 {{ inProgressCount }} 项</el-tag>
            <el-tag type="info">待办 {{ pendingCount }} 项</el-tag>
          </div>
          <el-button type="primary" @click="openTaskDialog">
            <el-icon><Plus /></el-icon>
            新增任务
          </el-button>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="8" v-for="(status, index) in statusGroups" :key="status.key">
        <el-card class="card-shadow status-column" shadow="hover">
          <template #header>
            <div class="flex-between column-header">
              <div class="flex gap-10 items-center">
                <el-tag :type="status.type" effect="dark">{{ status.label }}</el-tag>
                <span class="task-count">{{ getTasksByStatus(status.key).length }}</span>
              </div>
            </div>
          </template>
          <div class="task-list" v-loading="loading">
            <div 
              v-for="task in getTasksByStatus(status.key)" 
              :key="task.id" 
              class="task-item card-shadow"
              @click="openTaskDialog(task)"
            >
              <div class="task-header flex-between mb-10">
                <h4 class="task-title" :class="{ 'task-completed': task.status === 'completed' }">
                  {{ task.title }}
                </h4>
                <el-dropdown @click.stop @command="(cmd) => handleTaskAction(cmd, task)">
                  <el-button size="small" link>
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-if="task.status !== 'pending'" command="pending">
                        标记为待办
                      </el-dropdown-item>
                      <el-dropdown-item v-if="task.status !== 'in_progress'" command="in_progress">
                        标记为进行中
                      </el-dropdown-item>
                      <el-dropdown-item v-if="task.status !== 'completed'" command="completed">
                        标记为已完成
                      </el-dropdown-item>
                      <el-dropdown-item command="edit" divided>编辑</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>

              <div class="task-meta flex gap-10 mb-10">
                <el-tag size="small" :type="getPriorityType(task.priority)">
                  {{ getPriorityLabel(task.priority) }}优先级
                </el-tag>
                <el-tag v-if="task.key_result_title" size="small" type="info" effect="plain">
                  {{ task.key_result_title }}
                </el-tag>
              </div>

              <div v-if="task.description" class="task-desc mb-10">
                {{ task.description }}
              </div>

              <div class="task-footer flex-between">
                <div class="flex gap-10 items-center">
                  <el-icon :size="14" class="text-info"><Timer /></el-icon>
                  <span class="task-time" v-if="task.estimated_time">预计 {{ task.estimated_time }}h</span>
                  <span class="task-time" v-else>未设置预计时间</span>
                </div>
                <div class="flex gap-10 items-center">
                  <el-icon :size="14" class="text-info"><Calendar /></el-icon>
                  <span class="task-date">{{ task.due_date || '无截止日期' }}</span>
                </div>
              </div>
            </div>
            <el-empty 
              v-if="!loading && getTasksByStatus(status.key).length === 0" 
              :description="'暂无' + status.label + '任务'"
              :image-size="80"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog 
      v-model="taskDialogVisible" 
      :title="editingTask ? '编辑任务' : '新增任务'" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="taskFormRef" 
        :model="taskForm" 
        :rules="taskFormRules" 
        label-width="100px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="taskForm.title" placeholder="请输入任务标题" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="taskForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入任务描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="taskForm.priority" placeholder="请选择优先级" style="width: 100%">
                <el-option label="高" value="high">
                  <el-tag type="danger">高优先级</el-tag>
                </el-option>
                <el-option label="中" value="medium">
                  <el-tag type="warning">中优先级</el-tag>
                </el-option>
                <el-option label="低" value="low">
                  <el-tag type="success">低优先级</el-tag>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="taskForm.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="待办" value="pending" />
                <el-option label="进行中" value="in_progress" />
                <el-option label="已完成" value="completed" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="截止日期" prop="due_date">
              <el-date-picker 
                v-model="taskForm.due_date" 
                type="date" 
                placeholder="选择截止日期" 
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计时间(h)" prop="estimated_time">
              <el-input-number v-model="taskForm.estimated_time" :min="0" :step="0.5" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="关联关键结果">
          <el-select v-model="taskForm.key_result_id" placeholder="请选择关联的关键结果（可选）" clearable style="width: 100%">
            <el-option-group v-for="goal in goals" :key="goal.id" :label="goal.title">
              <el-option 
                v-for="kr in goal.key_results" 
                :key="kr.id" 
                :label="kr.title" 
                :value="kr.id"
              />
            </el-option-group>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveTask" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { executionApi, goalApi } from '@/api'

dayjs.extend(isoWeek)

const loading = ref(false)
const submitting = ref(false)
const taskDialogVisible = ref(false)
const editingTask = ref(null)
const taskFormRef = ref(null)

const currentWeekDate = ref(dayjs())
const currentWeek = computed(() => currentWeekDate.value.isoWeek())
const weekStart = computed(() => currentWeekDate.value.isoWeekday(1).format('YYYY-MM-DD'))
const weekEnd = computed(() => currentWeekDate.value.isoWeekday(7).format('YYYY-MM-DD'))

const weekPlan = ref(null)
const tasks = ref([])
const goals = ref([])

const statusGroups = [
  { key: 'pending', label: '待办', type: 'info' },
  { key: 'in_progress', label: '进行中', type: 'warning' },
  { key: 'completed', label: '已完成', type: 'success' }
]

const taskForm = reactive({
  title: '',
  description: '',
  priority: 'medium',
  status: 'pending',
  due_date: '',
  estimated_time: 1,
  key_result_id: null
})

const taskFormRules = {
  title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const completedCount = computed(() => tasks.value.filter(t => t.status === 'completed').length)
const inProgressCount = computed(() => tasks.value.filter(t => t.status === 'in_progress').length)
const pendingCount = computed(() => tasks.value.filter(t => t.status === 'pending').length)

function getPriorityType(priority) {
  const map = { high: 'danger', medium: 'warning', low: 'success' }
  return map[priority] || 'info'
}

function getPriorityLabel(priority) {
  const map = { high: '高', medium: '中', low: '低' }
  return map[priority] || priority
}

function getTasksByStatus(status) {
  return tasks.value.filter(t => t.status === status)
}

async function fetchGoals() {
  try {
    const res = await goalApi.getGoals({ year: new Date().getFullYear() })
    goals.value = res || []
  } catch (err) {
    console.error('获取目标列表失败', err)
  }
}

async function fetchWeekPlan() {
  loading.value = true
  try {
    const params = {
      week_start: weekStart.value,
      week_end: weekEnd.value
    }
    const res = await executionApi.getWeeklyPlans(params)
    const plans = res || []
    if (plans.length > 0) {
      weekPlan.value = plans[0]
      tasks.value = plans[0].tasks || []
    } else {
      weekPlan.value = null
      tasks.value = []
    }
  } catch (err) {
    ElMessage.error('获取周计划失败')
  } finally {
    loading.value = false
  }
}

async function ensureWeekPlan() {
  if (!weekPlan.value) {
    try {
      const res = await executionApi.createWeeklyPlan({
        week_start: weekStart.value,
        week_end: weekEnd.value,
        week_number: currentWeek.value
      })
      weekPlan.value = res
    } catch (err) {
      ElMessage.error('创建周计划失败')
      return false
    }
  }
  return true
}

function changeWeek(delta) {
  currentWeekDate.value = currentWeekDate.value.add(delta, 'week')
  fetchWeekPlan()
}

function resetToCurrentWeek() {
  currentWeekDate.value = dayjs()
  fetchWeekPlan()
}

function openTaskDialog(task = null) {
  editingTask.value = task
  if (task) {
    Object.assign(taskForm, {
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      due_date: task.due_date || '',
      estimated_time: task.estimated_time || 1,
      key_result_id: task.key_result_id || null
    })
  } else {
    Object.assign(taskForm, {
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      due_date: '',
      estimated_time: 1,
      key_result_id: null
    })
  }
  taskFormRef.value?.resetFields()
  taskDialogVisible.value = true
}

async function handleSaveTask() {
  if (!taskFormRef.value) return
  try {
    await taskFormRef.value.validate()
    submitting.value = true

    if (editingTask.value) {
      await executionApi.updateWeeklyTask(editingTask.value.id, taskForm)
      ElMessage.success('更新成功')
    } else {
      const planCreated = await ensureWeekPlan()
      if (!planCreated) return
      await executionApi.createWeeklyTask(weekPlan.value.id, taskForm)
      ElMessage.success('创建成功')
    }
    taskDialogVisible.value = false
    fetchWeekPlan()
  } catch (err) {
    if (err !== false) {
      ElMessage.error('保存失败')
    }
  } finally {
    submitting.value = false
  }
}

async function handleTaskAction(cmd, task) {
  if (cmd === 'edit') {
    openTaskDialog(task)
  } else if (cmd === 'delete') {
    try {
      await ElMessageBox.confirm('确定要删除这个任务吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await executionApi.deleteWeeklyTask(task.id)
      ElMessage.success('删除成功')
      fetchWeekPlan()
    } catch (err) {
      if (err !== 'cancel') {
        ElMessage.error('删除失败')
      }
    }
  } else if (['pending', 'in_progress', 'completed'].includes(cmd)) {
    try {
      await executionApi.updateWeeklyTask(task.id, { status: cmd })
      ElMessage.success('状态已更新')
      fetchWeekPlan()
    } catch (err) {
      ElMessage.error('更新失败')
    }
  }
}

onMounted(() => {
  fetchGoals()
  fetchWeekPlan()
})
</script>

<style scoped>
.week-header {
  padding: 10px 0;
}

.week-info {
  text-align: center;
}

.week-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px 0;
}

.week-range {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.week-stats {
  display: flex;
  gap: 10px;
}

.status-column {
  min-height: 500px;
}

.column-header {
  padding: 0;
}

.task-count {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  background-color: #f5f7fa;
  padding: 2px 8px;
  border-radius: 10px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 400px;
}

.task-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.task-item:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.task-header {
  align-items: flex-start;
}

.task-title {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin: 0;
  flex: 1;
  line-height: 1.4;
}

.task-completed {
  text-decoration: line-through;
  color: #c0c4cc;
}

.task-meta {
  flex-wrap: wrap;
}

.task-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.task-footer {
  padding-top: 8px;
  border-top: 1px dashed #e4e7ed;
}

.task-time,
.task-date {
  font-size: 12px;
  color: #909399;
}
</style>
