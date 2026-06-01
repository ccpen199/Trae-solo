<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <h2>抵押登记</h2>
      <el-button type="primary" @click="showAddDialog = true">新增抵押</el-button>
    </div>

    <el-card>
      <el-table :data="mortgages" style="width: 100%">
        <el-table-column prop="contract_number" label="贷款合同" width="180" />
        <el-table-column prop="vin" label="VIN码" width="180" />
        <el-table-column prop="registration_number" label="登记编号" width="150" />
        <el-table-column prop="handler_name" label="办理人" width="100" />
        <el-table-column prop="handle_date" label="办理时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'released' ? 'info' : 'success'">
              {{ scope.row.status === 'released' ? '已解押' : '已抵押' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button size="small" v-if="scope.row.status !== 'released'" type="warning" @click="releaseMortgage(scope.row)">解押</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" title="新增抵押登记" width="600px">
      <el-form :model="mortgageForm" label-width="120px">
        <el-form-item label="贷款" required>
          <el-select v-model="mortgageForm.loan_id" placeholder="选择贷款" style="width: 100%">
            <el-option v-for="l in loans" :key="l.id" :label="`${l.contract_number} - ${l.borrower_name}`" :value="l.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="车辆" required>
          <el-select v-model="mortgageForm.vehicle_id" placeholder="选择车辆" style="width: 100%">
            <el-option v-for="v in vehicles" :key="v.id" :label="`${v.vin} - ${v.plate_number || '无牌'}`" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="登记编号" required>
          <el-input v-model="mortgageForm.registration_number" />
        </el-form-item>
        <el-form-item label="办理人">
          <el-input v-model="mortgageForm.handler_name" />
        </el-form-item>
        <el-form-item label="附件材料">
          <el-input v-model="mortgageForm.attachments" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addMortgage">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReleaseDialog" title="解押登记" width="400px">
      <el-form :model="releaseForm" label-width="100px">
        <el-form-item label="解押人">
          <el-input v-model="releaseForm.release_handler" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReleaseDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRelease">确认解押</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const mortgages = ref([])
const loans = ref([])
const vehicles = ref([])
const showAddDialog = ref(false)
const showReleaseDialog = ref(false)
const selectedMortgageId = ref(null)

const mortgageForm = ref({
  loan_id: null,
  vehicle_id: null,
  registration_number: '',
  handler_name: '',
  attachments: ''
})

const releaseForm = ref({
  release_handler: ''
})

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

const loadMortgages = async () => {
  try {
    const res = await api.get('/mortgages')
    if (res.data.success) {
      mortgages.value = res.data.data
    }
  } catch (e) {
    console.error(e)
  }
}

const addMortgage = async () => {
  if (!mortgageForm.value.loan_id || !mortgageForm.value.vehicle_id || !mortgageForm.value.registration_number) {
    ElMessage.error('请填写完整信息')
    return
  }
  try {
    const res = await api.post('/mortgages', mortgageForm.value)
    if (res.data.success) {
      ElMessage.success('抵押登记成功')
      showAddDialog.value = false
      loadMortgages()
      mortgageForm.value = { loan_id: null, vehicle_id: null, registration_number: '', handler_name: '', attachments: '' }
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '登记失败')
  }
}

const releaseMortgage = (row) => {
  selectedMortgageId.value = row.id
  releaseForm.value.release_handler = ''
  showReleaseDialog.value = true
}

const submitRelease = async () => {
  try {
    const res = await api.put(`/mortgages/${selectedMortgageId.value}/release`, releaseForm.value)
    if (res.data.success) {
      ElMessage.success('解押成功')
      showReleaseDialog.value = false
      loadMortgages()
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '解押失败')
  }
}

onMounted(() => {
  loadLoans()
  loadVehicles()
  loadMortgages()
})
</script>
