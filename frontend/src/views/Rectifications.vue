<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">整改管理</h2>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 150px">
            <el-option label="待整改" value="pending" />
            <el-option label="整改中" value="processing" />
            <el-option label="已完成待复查" value="completed" />
            <el-option label="已通过" value="passed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadRectifications">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="rectifications" border stripe>
      <el-table-column prop="unit_name" label="责任单位" min-width="150" />
      <el-table-column prop="hazard_type" label="隐患类型" width="120" />
      <el-table-column prop="hazard_description" label="隐患描述" min-width="150" show-overflow-tooltip />
      <el-table-column prop="responsible_person" label="整改责任人" width="120" />
      <el-table-column prop="deadline" label="整改期限" width="120">
        <template #default="{ row }">
          <span :style="{ color: isOverdue(row) ? '#f56c6c' : '' }">{{ row.deadline }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
          <el-tag v-if="row.escalation_level > 0" type="danger" size="small" style="margin-left: 5px">
            Lv{{ row.escalation_level }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="measures" label="整改措施" min-width="150" show-overflow-tooltip />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button v-if="row.status === 'pending'" size="small" @click="startProcessing(row)">开始整改</el-button>
          <el-button v-if="row.status === 'processing'" size="small" type="success" @click="completeRectification(row)">完成整改</el-button>
          <el-button v-if="row.status === 'completed'" size="small" type="primary" @click="goRecheck(row)">去复查</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="completeDialogVisible" title="完成整改" width="500px">
      <el-form :model="completeForm" label-width="100px">
        <el-form-item label="实际完成日期">
          <el-date-picker v-model="completeForm.actual_completion_date" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="整改说明">
          <el-input v-model="completeForm.notes" type="textarea" :rows="3" placeholder="请输入整改完成说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitComplete">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'

const router = useRouter()
const rectifications = ref([])
const completeDialogVisible = ref(false)
const currentRectification = ref(null)

const searchForm = reactive({
  status: ''
})

const completeForm = reactive({
  actual_completion_date: '',
  notes: ''
})

const isOverdue = (row) => {
  if (row.status === 'passed' || row.status === 'completed') return false
  const deadline = new Date(row.deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return deadline < today
}

const getStatusType = (row) => {
  if (isOverdue(row)) return 'danger'
  const map = {
    pending: 'warning',
    processing: 'primary',
    completed: 'info',
    passed: 'success'
  }
  return map[row.status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待整改',
    processing: '整改中',
    completed: '待复查',
    passed: '已通过'
  }
  return map[status] || status
}

const loadRectifications = async () => {
  const params = {}
  if (searchForm.status) params.status = searchForm.status
  rectifications.value = await api.getRectifications(params)
}

const resetSearch = () => {
  searchForm.status = ''
  loadRectifications()
}

const startProcessing = async (row) => {
  try {
    await api.updateRectification(row.id, {
      ...row,
      status: 'processing'
    })
    ElMessage.success('已开始整改')
    loadRectifications()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const completeRectification = (row) => {
  currentRectification.value = row
  completeForm.actual_completion_date = new Date().toISOString().split('T')[0]
  completeForm.notes = ''
  completeDialogVisible.value = true
}

const submitComplete = async () => {
  try {
    await api.updateRectification(currentRectification.value.id, {
      responsible_person: currentRectification.value.responsible_person,
      deadline: currentRectification.value.deadline,
      measures: currentRectification.value.measures,
      status: 'completed',
      actual_completion_date: completeForm.actual_completion_date,
      escalation_level: currentRectification.value.escalation_level
    })
    ElMessage.success('整改已完成，等待复查')
    completeDialogVisible.value = false
    loadRectifications()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const goRecheck = (row) => {
  router.push({ path: '/rechecks', query: { rectification_id: row.id } })
}

onMounted(() => {
  loadRectifications()
})
</script>
