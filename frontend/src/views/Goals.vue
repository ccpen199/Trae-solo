<template>
  <div class="page-container">
    <el-card class="card-shadow mb-20" shadow="never">
      <div class="flex-between filter-bar">
        <div class="flex gap-20">
          <el-select v-model="filterYear" placeholder="选择年份" style="width: 120px" @change="fetchGoals">
            <el-option v-for="year in yearOptions" :key="year" :label="year + '年'" :value="year" />
          </el-select>
          <el-select v-model="filterDimension" placeholder="选择维度" clearable style="width: 140px" @change="fetchGoals">
            <el-option v-for="dim in dimensions" :key="dim" :label="dim" :value="dim">
              <span class="flex gap-10 items-center">
                <span class="dimension-tag" :class="'dimension-' + dim">{{ dim }}</span>
              </span>
            </el-option>
          </el-select>
        </div>
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          新增目标
        </el-button>
      </div>
    </el-card>

    <el-row :gutter="20" v-loading="loading">
      <el-col :span="8" v-for="goal in goals" :key="goal.id">
        <el-card 
          class="card-shadow goal-card mb-20" 
          shadow="hover"
          @click="goToDetail(goal.id)"
        >
          <template #header>
            <div class="flex-between">
              <span class="dimension-tag" :class="'dimension-' + goal.dimension">{{ goal.dimension }}</span>
              <el-tag :type="getStatusType(goal.status)" size="small">{{ getStatusLabel(goal.status) }}</el-tag>
            </div>
          </template>
          <div class="goal-content">
            <h3 class="goal-title">{{ goal.title }}</h3>
            <p class="goal-desc" v-if="goal.description">{{ goal.description }}</p>
            
            <div class="goal-stats flex gap-20 mt-20 mb-10">
              <div class="stat-item">
                <span class="stat-label">关键结果</span>
                <span class="stat-value">{{ goal.kr_count || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">权重</span>
                <span class="stat-value">{{ goal.weight || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">截止日期</span>
                <span class="stat-value">{{ goal.deadline || '-' }}</span>
              </div>
            </div>

            <div class="progress-section">
              <div class="flex-between mb-10">
                <span class="progress-label">完成进度</span>
                <span class="progress-value" :class="getProgressColor(goal.progress)">{{ Math.round(goal.progress || 0) }}%</span>
              </div>
              <el-progress 
                :percentage="Math.round(goal.progress || 0)" 
                :status="goal.progress >= 100 ? 'success' : ''"
                :stroke-width="8"
                :color="getProgressBarColor(goal.progress)"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="!loading && goals.length === 0" description="暂无目标数据">
      <el-button type="primary" @click="openCreateDialog">创建第一个目标</el-button>
    </el-empty>

    <el-dialog 
      v-model="createDialogVisible" 
      title="新增目标" 
      width="650px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="goalFormRef" 
        :model="goalForm" 
        :rules="goalFormRules" 
        label-width="100px"
      >
        <el-divider content-position="left">基础信息</el-divider>
        <el-form-item label="年份" prop="year">
          <el-select v-model="goalForm.year" placeholder="请选择年份" style="width: 100%">
            <el-option v-for="year in yearOptions" :key="year" :label="year + '年'" :value="year" />
          </el-select>
        </el-form-item>
        <el-form-item label="维度" prop="dimension">
          <el-select v-model="goalForm.dimension" placeholder="请选择维度" style="width: 100%">
            <el-option v-for="dim in dimensions" :key="dim" :label="dim" :value="dim">
              <span class="flex gap-10 items-center">
                <span class="dimension-tag" :class="'dimension-' + dim">{{ dim }}</span>
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="goalForm.title" placeholder="请输入目标标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="goalForm.description" 
            type="textarea" 
            :rows="2" 
            placeholder="请输入目标描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="权重" prop="weight">
              <el-input-number v-model="goalForm.weight" :min="0" :max="100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止日期" prop="deadline">
              <el-date-picker 
                v-model="goalForm.deadline" 
                type="date" 
                placeholder="选择截止日期" 
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">
          <span class="flex gap-10 items-center">
            关键结果拆解
            <el-tag type="info" size="small">可稍后在详情页补充</el-tag>
          </span>
        </el-divider>
        
        <div v-for="(kr, index) in keyResultForms" :key="index" class="kr-form-item mb-20">
          <el-card shadow="never" class="kr-card">
            <template #header>
              <div class="flex-between">
                <span class="kr-title">关键结果 {{ index + 1 }}</span>
                <el-button 
                  type="danger" 
                  link 
                  size="small" 
                  @click="removeKR(index)"
                  :disabled="keyResultForms.length <= 1"
                >
                  <el-icon><Delete /></el-icon>
                  移除
                </el-button>
              </div>
            </template>
            <el-row :gutter="20">
              <el-col :span="14">
                <el-form-item 
                  :label="'标题'" 
                  :prop="'key_results.' + index + '.title'"
                  :rules="{ required: true, message: '请输入关键结果标题', trigger: 'blur' }"
                >
                  <el-input 
                    v-model="kr.title" 
                    placeholder="例如：完成3个核心项目上线" 
                    maxlength="100" 
                  />
                </el-form-item>
              </el-col>
              <el-col :span="5">
                <el-form-item label="目标值">
                  <el-input-number 
                    v-model="kr.target_value" 
                    :min="0" 
                    :step="0.1"
                    style="width: 100%" 
                  />
                </el-form-item>
              </el-col>
              <el-col :span="5">
                <el-form-item label="单位">
                  <el-input v-model="kr.unit" placeholder="如: 个、次、%" maxlength="10" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="权重">
                  <el-input-number 
                    v-model="kr.weight" 
                    :min="0" 
                    :max="100" 
                    :default-value="1"
                    style="width: 100%" 
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="截止日期">
                  <el-date-picker 
                    v-model="kr.deadline" 
                    type="date" 
                    placeholder="可选，默认同目标" 
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-card>
        </div>
        
        <el-button 
          type="primary" 
          plain 
          class="w-full mb-10" 
          @click="addKR"
        >
          <el-icon><Plus /></el-icon>
          添加关键结果
        </el-button>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateGoal" :loading="submitting">创建目标</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { goalApi } from '@/api'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const createDialogVisible = ref(false)
const goalFormRef = ref(null)

const currentYear = new Date().getFullYear()
const yearOptions = computed(() => [currentYear - 1, currentYear, currentYear + 1])

const filterYear = ref(currentYear)
const filterDimension = ref('')

const dimensions = ref([])
const goals = ref([])

const goalForm = reactive({
  year: currentYear,
  dimension: '',
  title: '',
  description: '',
  weight: 0,
  deadline: ''
})

const keyResultForms = ref([
  {
    title: '',
    target_value: 1,
    unit: '',
    weight: 1,
    deadline: ''
  }
])

const goalFormRules = {
  year: [{ required: true, message: '请选择年份', trigger: 'change' }],
  dimension: [{ required: true, message: '请选择维度', trigger: 'change' }],
  title: [{ required: true, message: '请输入目标标题', trigger: 'blur' }],
  weight: [{ required: true, message: '请输入权重', trigger: 'blur' }],
  deadline: [{ required: true, message: '请选择截止日期', trigger: 'change' }]
}

function addKR() {
  keyResultForms.value.push({
    title: '',
    target_value: 1,
    unit: '',
    weight: 1,
    deadline: ''
  })
}

function removeKR(index) {
  if (keyResultForms.value.length > 1) {
    keyResultForms.value.splice(index, 1)
  }
}

function getStatusType(status) {
  const map = { active: 'success', paused: 'warning', completed: 'info', abandoned: 'danger' }
  return map[status] || 'info'
}

function getStatusLabel(status) {
  const map = { active: '进行中', paused: '已暂停', completed: '已完成', abandoned: '已放弃' }
  return map[status] || status
}

function getProgressColor(progress) {
  if (progress >= 100) return 'text-success'
  if (progress >= 60) return 'text-warning'
  if (progress >= 30) return ''
  return 'text-danger'
}

function getProgressBarColor(progress) {
  if (progress >= 100) return '#67c23a'
  if (progress >= 60) return '#e6a23c'
  if (progress >= 30) return '#409eff'
  return '#f56c6c'
}

async function fetchDimensions() {
  try {
    const res = await goalApi.getDimensions()
    dimensions.value = res || []
  } catch (err) {
    ElMessage.error('获取维度列表失败')
  }
}

async function fetchGoals() {
  loading.value = true
  try {
    const params = { year: filterYear.value }
    if (filterDimension.value) params.dimension = filterDimension.value
    const res = await goalApi.getGoals(params)
    goals.value = res || []
  } catch (err) {
    ElMessage.error('获取目标列表失败')
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  goalForm.year = filterYear.value
  goalForm.dimension = ''
  goalForm.title = ''
  goalForm.description = ''
  goalForm.weight = 0
  goalForm.deadline = ''
  keyResultForms.value = [
    {
      title: '',
      target_value: 1,
      unit: '',
      weight: 1,
      deadline: ''
    }
  ]
  goalFormRef.value?.resetFields()
  createDialogVisible.value = true
}

async function handleCreateGoal() {
  if (!goalFormRef.value) return
  try {
    await goalFormRef.value.validate()
    
    const validKRs = keyResultForms.value.filter(kr => kr.title && kr.title.trim())
    if (validKRs.length === 0) {
      ElMessage.warning('请至少填写一个关键结果，或稍后在详情页添加')
    }
    
    submitting.value = true
    const goalRes = await goalApi.createGoal(goalForm)
    const goalId = goalRes.id
    
    for (const kr of validKRs) {
      try {
        await goalApi.createKR(goalId, {
          title: kr.title,
          target_value: kr.target_value,
          current_value: 0,
          unit: kr.unit,
          weight: kr.weight,
          deadline: kr.deadline || goalForm.deadline
        })
      } catch (krErr) {
        console.error('创建关键结果失败:', krErr)
      }
    }
    
    ElMessage.success(validKRs.length > 0 ? `创建成功，包含${validKRs.length}个关键结果` : '目标创建成功')
    createDialogVisible.value = false
    fetchGoals()
    setTimeout(() => {
      router.push(`/goals/${goalId}`)
    }, 500)
  } catch (err) {
    if (err !== false) {
      ElMessage.error('创建失败')
    }
  } finally {
    submitting.value = false
  }
}

function goToDetail(id) {
  router.push(`/goals/${id}`)
}

onMounted(() => {
  fetchDimensions()
  fetchGoals()
})
</script>

<style scoped>
.filter-bar {
  padding: 10px 0;
}

.goal-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border-radius: 8px;
}

.goal-card:hover {
  transform: translateY(-2px);
}

.goal-content {
  min-height: 180px;
  display: flex;
  flex-direction: column;
}

.goal-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  line-height: 1.4;
}

.goal-desc {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.goal-stats {
  flex: 1;
  align-items: flex-end;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.kr-card {
  border: 1px dashed #dcdfe6;
  background: #fafafa;
}

.kr-card :deep(.el-card__header) {
  padding: 10px 15px;
  background: #f5f7fa;
  border-bottom: 1px dashed #dcdfe6;
}

.kr-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.kr-form-item {
  margin-bottom: 15px;
}

.w-full {
  width: 100%;
}

.mb-10 {
  margin-bottom: 10px;
}

.mb-20 {
  margin-bottom: 20px;
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.progress-section {
  margin-top: 10px;
}

.progress-label {
  font-size: 13px;
  color: #606266;
}

.progress-value {
  font-size: 14px;
  font-weight: 600;
}
</style>
