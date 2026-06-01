<template>
  <div>
    <h2 style="margin-bottom: 20px">风险预警</h2>

    <el-card>
      <el-table :data="risks" style="width: 100%">
        <el-table-column prop="type" label="风险类型" width="150">
          <template #default="scope">
            <el-tag :type="getRiskTypeColor(scope.row.type)">{{ scope.row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="级别" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.level === 'high' ? 'danger' : 'warning'" size="small">
              {{ scope.row.level === 'high' ? '高' : '中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="vin" label="VIN码" width="180" />
        <el-table-column prop="borrower_name" label="借款人" width="100" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'handled' ? 'success' : 'warning'">
              {{ scope.row.status === 'handled' ? '已处理' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button size="small" v-if="scope.row.status !== 'handled'" type="primary" @click="handleRisk(scope.row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showHandleDialog" title="处理风险" width="400px">
      <el-form :model="handleForm" label-width="80px">
        <el-form-item label="处理人">
          <el-input v-model="handleForm.handler" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showHandleDialog = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const risks = ref([])
const showHandleDialog = ref(false)
const selectedRiskId = ref(null)

const handleForm = ref({
  handler: ''
})

const loadRisks = async () => {
  try {
    const res = await api.get('/risks')
    if (res.data.success) {
      risks.value = res.data.data
    }
  } catch (e) {
    console.error(e)
  }
}

const handleRisk = (row) => {
  selectedRiskId.value = row.id
  handleForm.value.handler = ''
  showHandleDialog.value = true
}

const submitHandle = async () => {
  try {
    const res = await api.put(`/risks/${selectedRiskId.value}/handle`, handleForm.value)
    if (res.data.success) {
      ElMessage.success('处理成功')
      showHandleDialog.value = false
      loadRisks()
    }
  } catch (e) {
    ElMessage.error('处理失败')
  }
}

const getRiskTypeColor = (type) => {
  const map = { valuation_anomaly: 'warning', gps_alert: 'danger', overdue: 'danger' }
  return map[type] || ''
}

onMounted(() => {
  loadRisks()
})
</script>
