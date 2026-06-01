<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <h2>处置记录</h2>
      <el-button type="primary" @click="showAddDialog = true">新增处置</el-button>
    </div>

    <el-card>
      <el-table :data="disposals" style="width: 100%">
        <el-table-column prop="action_type" label="处置类型" width="120">
          <template #default="scope">
            <el-tag type="warning">{{ scope.row.action_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="vin" label="VIN码" width="180" />
        <el-table-column prop="contract_number" label="贷款合同" width="180" />
        <el-table-column prop="borrower_name" label="借款人" width="100" />
        <el-table-column prop="handler" label="处理人" width="100" />
        <el-table-column prop="result" label="结果" />
        <el-table-column prop="notes" label="备注" />
        <el-table-column prop="created_at" label="时间" width="180" />
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" title="新增处置记录" width="600px">
      <el-form :model="disposalForm" label-width="100px">
        <el-form-item label="车辆" required>
          <el-select v-model="disposalForm.vehicle_id" placeholder="选择车辆" style="width: 100%">
            <el-option v-for="v in vehicles" :key="v.id" :label="`${v.vin} - ${v.plate_number || '无牌'}`" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联贷款">
          <el-select v-model="disposalForm.loan_id" placeholder="选择贷款" style="width: 100%">
            <el-option v-for="l in loans" :key="l.id" :label="`${l.contract_number} - ${l.borrower_name}`" :value="l.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="处置类型" required>
          <el-select v-model="disposalForm.action_type" style="width: 100%">
            <el-option label="催收" value="催收" />
            <el-option label="收车" value="收车" />
            <el-option label="拍卖" value="拍卖" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理人">
          <el-input v-model="disposalForm.handler" />
        </el-form-item>
        <el-form-item label="处理结果">
          <el-input v-model="disposalForm.result" type="textarea" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="disposalForm.notes" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addDisposal">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const disposals = ref([])
const vehicles = ref([])
const loans = ref([])
const showAddDialog = ref(false)

const disposalForm = ref({
  vehicle_id: null,
  loan_id: null,
  action_type: '',
  handler: '',
  result: '',
  notes: ''
})

const loadVehicles = async () => {
  try {
    const res = await api.get('/vehicles')
    if (res.data.success) {
      vehicles.value = res.data.data
    }
  } catch (e) {
    console.error(e)
  }
}

const loadLoans = async () => {
  try {
    const res = await api.get('/loans')
    if (res.data.success) {
      loans.value = res.data.data
    }
  } catch (e) {
    console.error(e)
  }
}

const loadDisposals = async () => {
  try {
    const res = await api.get('/disposals')
    if (res.data.success) {
      disposals.value = res.data.data
    }
  } catch (e) {
    console.error(e)
  }
}

const addDisposal = async () => {
  if (!disposalForm.value.vehicle_id || !disposalForm.value.action_type) {
    ElMessage.error('请填写完整信息')
    return
  }
  try {
    const res = await api.post('/disposals', disposalForm.value)
    if (res.data.success) {
      ElMessage.success('处置记录添加成功')
      showAddDialog.value = false
      loadDisposals()
      disposalForm.value = { vehicle_id: null, loan_id: null, action_type: '', handler: '', result: '', notes: '' }
    }
  } catch (e) {
    ElMessage.error('添加失败')
  }
}

onMounted(() => {
  loadVehicles()
  loadLoans()
  loadDisposals()
})
</script>
