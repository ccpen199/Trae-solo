<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <h2>贷款管理</h2>
      <el-button type="primary" @click="showAddDialog = true">新增贷款</el-button>
    </div>

    <el-card>
      <el-table :data="loans" style="width: 100%">
        <el-table-column prop="contract_number" label="合同号" width="180" />
        <el-table-column prop="vin" label="VIN码" width="180" />
        <el-table-column prop="borrower_name" label="借款人" width="100" />
        <el-table-column prop="borrower_phone" label="电话" width="120" />
        <el-table-column prop="loan_amount" label="贷款金额" width="120">
          <template #default="scope">¥{{ scope.row.loan_amount }}</template>
        </el-table-column>
        <el-table-column prop="loan_term" label="期限(月)" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'disbursed' ? 'success' : 'warning'">
              {{ scope.row.status === 'disbursed' ? '已放款' : '待放款' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button size="small" v-if="scope.row.status !== 'disbursed'" type="primary" @click="disburse(scope.row)">放款</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" title="新增贷款" width="600px">
      <el-form :model="loanForm" label-width="120px">
        <el-form-item label="车辆" required>
          <el-select v-model="loanForm.vehicle_id" placeholder="选择车辆" style="width: 100%">
            <el-option v-for="v in vehicles" :key="v.id" :label="`${v.vin} - ${v.plate_number || '无牌'}`" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="合同编号" required>
          <el-input v-model="loanForm.contract_number" />
        </el-form-item>
        <el-form-item label="借款人">
          <el-input v-model="loanForm.borrower_name" />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input v-model="loanForm.borrower_id_card" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="loanForm.borrower_phone" />
        </el-form-item>
        <el-form-item label="贷款金额" required>
          <el-input-number v-model="loanForm.loan_amount" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="贷款期限(月)" required>
          <el-input-number v-model="loanForm.loan_term" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="利率(%)">
          <el-input-number v-model="loanForm.interest_rate" :min="0" :step="0.1" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addLoan">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const loans = ref([])
const vehicles = ref([])
const showAddDialog = ref(false)

const loanForm = ref({
  vehicle_id: null,
  contract_number: '',
  borrower_name: '',
  borrower_id_card: '',
  borrower_phone: '',
  loan_amount: 0,
  loan_term: 12,
  interest_rate: 0
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

const addLoan = async () => {
  if (!loanForm.value.vehicle_id || !loanForm.value.contract_number || !loanForm.value.loan_amount) {
    ElMessage.error('请填写完整信息')
    return
  }
  try {
    const res = await api.post('/loans', loanForm.value)
    if (res.data.success) {
      ElMessage.success('贷款创建成功')
      showAddDialog.value = false
      loadLoans()
      loanForm.value = { vehicle_id: null, contract_number: '', borrower_name: '', borrower_id_card: '', borrower_phone: '', loan_amount: 0, loan_term: 12, interest_rate: 0 }
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '创建失败')
  }
}

const disburse = async (row) => {
  try {
    await ElMessageBox.confirm('确认放款？未完成抵押登记将无法放款。', '提示')
    const res = await api.put(`/loans/${row.id}/disburse`)
    if (res.data.success) {
      ElMessage.success('放款成功')
      loadLoans()
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.message || '放款失败')
    }
  }
}

onMounted(() => {
  loadVehicles()
  loadLoans()
})
</script>
