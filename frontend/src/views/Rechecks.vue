<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">复查管理</h2>
      <el-button type="primary" @click="openRecheckDialog()">
        <el-icon><Plus /></el-icon>
        新增复查
      </el-button>
    </div>

    <el-table :data="rechecks" border stripe>
      <el-table-column prop="unit_name" label="责任单位" min-width="150" />
      <el-table-column prop="hazard_type" label="隐患类型" width="120" />
      <el-table-column prop="hazard_description" label="隐患描述" min-width="150" show-overflow-tooltip />
      <el-table-column prop="responsible_person" label="整改责任人" width="120" />
      <el-table-column prop="rechecker" label="复查人" width="100" />
      <el-table-column prop="recheck_date" label="复查日期" width="120" />
      <el-table-column label="是否通过" width="100">
        <template #default="{ row }">
          <el-tag :type="row.is_passed ? 'success' : 'danger'" size="small">
            {{ row.is_passed ? '通过' : '未通过' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="再次整改" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.need_again_rectify" type="warning" size="small">是</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="punishment_suggestion" label="处罚建议" width="120" show-overflow-tooltip />
      <el-table-column prop="close_evidence" label="关闭依据" min-width="120" show-overflow-tooltip />
    </el-table>

    <el-dialog v-model="recheckDialogVisible" title="新增复查" width="650px">
      <el-form :model="recheckForm" label-width="120px">
        <el-form-item label="整改记录" required>
          <el-select v-model="recheckForm.rectification_id" placeholder="请选择整改记录" style="width: 100%" @change="onRectificationChange">
            <el-option 
              v-for="r in pendingRectifications" 
              :key="r.id" 
              :label="`${r.unit_name} - ${r.hazard_type} - ${r.responsible_person}`" 
              :value="r.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="复查人" required>
          <el-input v-model="recheckForm.rechecker" placeholder="请输入复查人姓名" />
        </el-form-item>
        <el-form-item label="复查日期" required>
          <el-date-picker v-model="recheckForm.recheck_date" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="是否通过" required>
          <el-radio-group v-model="recheckForm.is_passed">
            <el-radio :value="1">通过</el-radio>
            <el-radio :value="0">未通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="!recheckForm.is_passed" label="需要再次整改">
          <el-radio-group v-model="recheckForm.need_again_rectify">
            <el-radio :value="1">是</el-radio>
            <el-radio :value="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处罚建议">
          <el-input v-model="recheckForm.punishment_suggestion" type="textarea" :rows="2" placeholder="如有处罚建议请填写" />
        </el-form-item>
        <el-form-item label="关闭依据">
          <el-input v-model="recheckForm.close_evidence" type="textarea" :rows="2" placeholder="填写复查通过的依据" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="recheckForm.notes" type="textarea" :rows="2" placeholder="其他备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="recheckDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRecheck" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'

const route = useRoute()
const rechecks = ref([])
const pendingRectifications = ref([])
const recheckDialogVisible = ref(false)
const submitting = ref(false)
const selectedRectification = ref(null)

const recheckForm = reactive({
  rectification_id: null,
  hazard_id: null,
  unit_id: null,
  rechecker: '',
  recheck_date: new Date().toISOString().split('T')[0],
  is_passed: 1,
  need_again_rectify: 0,
  punishment_suggestion: '',
  close_evidence: '',
  notes: ''
})

const loadRechecks = async () => {
  const params = {}
  if (route.query.rectification_id) {
    params.rectification_id = route.query.rectification_id
  }
  rechecks.value = await api.getRechecks(params)
}

const loadPendingRectifications = async () => {
  pendingRectifications.value = await api.getRectifications({ status: 'completed' })
}

const onRectificationChange = (id) => {
  const rect = pendingRectifications.value.find(r => r.id === id)
  if (rect) {
    selectedRectification.value = rect
    recheckForm.hazard_id = rect.hazard_id
    recheckForm.unit_id = rect.unit_id
  }
}

const openRecheckDialog = () => {
  recheckForm.rectification_id = null
  recheckForm.hazard_id = null
  recheckForm.unit_id = null
  recheckForm.rechecker = ''
  recheckForm.recheck_date = new Date().toISOString().split('T')[0]
  recheckForm.is_passed = 1
  recheckForm.need_again_rectify = 0
  recheckForm.punishment_suggestion = ''
  recheckForm.close_evidence = ''
  recheckForm.notes = ''
  
  if (route.query.rectification_id) {
    const id = parseInt(route.query.rectification_id)
    const rect = pendingRectifications.value.find(r => r.id === id)
    if (rect) {
      recheckForm.rectification_id = id
      onRectificationChange(id)
    }
  }
  
  recheckDialogVisible.value = true
}

const submitRecheck = async () => {
  if (!recheckForm.rectification_id || !recheckForm.rechecker || !recheckForm.recheck_date) {
    ElMessage.warning('请填写必填项')
    return
  }
  
  submitting.value = true
  try {
    await api.createRecheck(recheckForm)
    ElMessage.success('复查记录提交成功')
    recheckDialogVisible.value = false
    loadRechecks()
  } catch (error) {
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadRechecks()
  loadPendingRectifications()
})
</script>
