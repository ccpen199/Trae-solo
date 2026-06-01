<template>
  <div class="page-container">
    <div class="flex-between mb-20">
      <h2 class="page-title">偏差分析</h2>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        新增偏差记录
      </el-button>
    </div>

    <el-row :gutter="20" class="mb-20">
      <el-col :xs="12" :sm="8" :md="4" v-for="stat in typeStats" :key="stat.type">
        <el-card class="stat-card card-shadow" :class="`stat-${stat.type}`">
          <div class="stat-number">{{ stat.count }}</div>
          <div class="stat-label">
            <el-tag :type="getDeviationTagType(stat.type)" size="small">{{ stat.type }}</el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="card-shadow mb-20">
      <div class="flex-between mb-20">
        <div class="filter-bar flex gap-10">
          <el-select v-model="filterType" placeholder="按类型筛选" clearable style="width: 150px" @change="fetchDeviations">
            <el-option v-for="type in deviationTypes" :key="type" :label="type" :value="type" />
          </el-select>
          <el-select v-model="filterKR" placeholder="按关键结果筛选" clearable style="width: 250px" @change="fetchDeviations">
            <el-option v-for="kr in keyResults" :key="kr.id" :label="kr.title" :value="kr.id" />
          </el-select>
        </div>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>

      <el-table :data="deviations" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="goal_title" label="目标" min-width="150">
          <template #default="{ row }">
            <div class="flex gap-10 items-center">
              <span :class="`dimension-tag dimension-${row.goal_dimension}`">{{ row.goal_dimension }}</span>
              <span>{{ row.goal_title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="kr_title" label="关键结果" min-width="150" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getDeviationTagType(row.type)" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" min-width="200" show-overflow-tooltip />
        <el-table-column prop="impact" label="影响" min-width="150" show-overflow-tooltip />
        <el-table-column prop="solution" label="解决方案" min-width="150" show-overflow-tooltip />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="deviations.length === 0 && !loading" description="暂无偏差记录" />
    </el-card>

    <el-dialog v-model="showAddDialog" :title="isEdit ? '编辑偏差记录' : '新增偏差记录'" width="600px">
      <el-form ref="formRef" :model="deviationForm" :rules="formRules" label-width="100px">
        <el-form-item label="关键结果" prop="key_result_id">
          <el-select v-model="deviationForm.key_result_id" placeholder="请选择关键结果" style="width: 100%" :disabled="isEdit">
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
        <el-form-item label="类型" prop="type">
          <el-select v-model="deviationForm.type" placeholder="请选择偏差类型" style="width: 100%">
            <el-option v-for="type in deviationTypes" :key="type" :label="type" :value="type">
              <el-tag :type="getDeviationTagType(type)" size="small">{{ type }}</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="原因" prop="reason">
          <el-input v-model="deviationForm.reason" type="textarea" :rows="3" placeholder="请描述偏差原因" />
        </el-form-item>
        <el-form-item label="影响" prop="impact">
          <el-input v-model="deviationForm.impact" type="textarea" :rows="2" placeholder="请描述偏差造成的影响" />
        </el-form-item>
        <el-form-item label="解决方案" prop="solution">
          <el-input v-model="deviationForm.solution" type="textarea" :rows="2" placeholder="请描述解决方案" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElForm } from 'element-plus'
import { deviationApi, goalApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const showAddDialog = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const filterType = ref('')
const filterKR = ref('')
const formRef = ref()
const deviations = ref([])
const deviationTypes = ref([])
const goals = ref([])
const keyResults = ref([])

const deviationForm = reactive({
  key_result_id: null,
  type: '',
  reason: '',
  impact: '',
  solution: ''
})

const formRules = {
  key_result_id: [{ required: true, message: '请选择关键结果', trigger: 'change' }],
  type: [{ required: true, message: '请选择偏差类型', trigger: 'change' }],
  reason: [{ required: true, message: '请输入偏差原因', trigger: 'blur' }]
}

const typeStats = computed(() => {
  const stats = {}
  deviationTypes.value.forEach(type => {
    stats[type] = { type, count: 0 }
  })
  deviations.value.forEach(d => {
    if (stats[d.type]) {
      stats[d.type].count++
    }
  })
  return Object.values(stats)
})

function getDeviationTagType(type) {
  const map = {
    '延期': 'warning',
    '取消': 'danger',
    '转向': 'primary',
    '外部因素': 'info',
    '资源不足': 'danger',
    '其他': 'info'
  }
  return map[type] || 'info'
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

async function fetchDeviationTypes() {
  try {
    const res = await deviationApi.getDeviationTypes()
    deviationTypes.value = res.types
  } catch (err) {
    ElMessage.error(err.message || '获取偏差类型失败')
  }
}

async function fetchDeviations() {
  try {
    loading.value = true
    const params = {}
    if (filterType.value) params.type = filterType.value
    if (filterKR.value) params.key_result_id = filterKR.value
    deviations.value = await deviationApi.getDeviations(params)
  } catch (err) {
    ElMessage.error(err.message || '获取偏差记录失败')
  } finally {
    loading.value = false
  }
}

async function fetchGoals() {
  try {
    goals.value = await goalApi.getGoals()
    const krs = []
    goals.value.forEach(goal => {
      if (goal.key_results) {
        goal.key_results.forEach(kr => {
          krs.push({ ...kr, goal_title: goal.title })
        })
      }
    })
    keyResults.value = krs
  } catch (err) {
    console.error('获取目标列表失败', err)
  }
}

function handleRefresh() {
  fetchDeviations()
}

function handleEdit(row) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(deviationForm, {
    key_result_id: row.key_result_id,
    type: row.type,
    reason: row.reason,
    impact: row.impact || '',
    solution: row.solution || ''
  })
  showAddDialog.value = true
}

function closeDialog() {
  showAddDialog.value = false
  isEdit.value = false
  editId.value = null
  Object.assign(deviationForm, {
    key_result_id: null,
    type: '',
    reason: '',
    impact: '',
    solution: ''
  })
  formRef.value?.resetFields()
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (isEdit.value) {
      await deviationApi.updateDeviation(editId.value, deviationForm)
      ElMessage.success('更新成功')
    } else {
      await deviationApi.createDeviation(deviationForm)
      ElMessage.success('创建成功')
    }
    
    closeDialog()
    fetchDeviations()
  } catch (err) {
    if (err.message) ElMessage.error(err.message)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchDeviationTypes()
  fetchDeviations()
  fetchGoals()
})
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.stat-card {
  text-align: center;
  padding: 10px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.stat-延期 .stat-number { color: #e6a23c; }
.stat-取消 .stat-number { color: #f56c6c; }
.stat-转向 .stat-number { color: #409eff; }
.stat-外部因素 .stat-number { color: #909399; }
.stat-资源不足 .stat-number { color: #f56c6c; }
.stat-其他 .stat-number { color: #909399; }

.filter-bar {
  flex-wrap: wrap;
}
</style>
