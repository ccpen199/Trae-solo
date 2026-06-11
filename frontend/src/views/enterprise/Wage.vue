<template>
  <div class="page-container">
    <div class="nav-bar">
      <div class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </div>
      <div class="page-title" style="margin:0;">
        <el-icon><Wallet /></el-icon> 农民工工资专户监管
      </div>
      <el-button type="primary" @click="showCreate = true">
        <el-icon><Plus /></el-icon> 开立专户
      </el-button>
    </div>

    <div class="card">
      <div class="section-title">工资专户列表</div>
      <el-table :data="accountList" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="account_no" label="专户账号" width="180" />
        <el-table-column prop="bank_name" label="开户银行" width="200" />
        <el-table-column prop="account_balance" label="账户余额(元)" width="160">
          <template #default="{ row }">
            <span style="color: #047857; font-weight: 600;">¥ {{ Number(row.account_balance || 0).toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_paid" label="累计发放(元)" width="160">
          <template #default="{ row }">¥ {{ Number(row.total_paid || 0).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="supervisor" label="监管方" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <span :class="['tag-badge', row.status === 'normal' ? 'success' : 'danger']">
              {{ row.status === 'normal' ? '正常' : '冻结' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewRecords(row)">
              <el-icon><List /></el-icon> 发放记录
            </el-button>
            <el-button
              size="small"
              type="success"
              link
              :disabled="row.status !== 'normal'"
              @click="openPayDialog(row)"
            >
              <el-icon><Money /></el-icon> 发放工资
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && accountList.length === 0" description="暂无工资专户，请先开立专户" />
    </div>

    <el-dialog v-model="showCreate" title="开立工资专户" width="550px">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="开户银行" prop="bank_name">
          <el-select v-model="createForm.bank_name" placeholder="请选择开户银行" style="width:100%">
            <el-option label="中国工商银行" value="中国工商银行" />
            <el-option label="中国建设银行" value="中国建设银行" />
            <el-option label="中国农业银行" value="中国农业银行" />
            <el-option label="中国银行" value="中国银行" />
            <el-option label="交通银行" value="交通银行" />
            <el-option label="招商银行" value="招商银行" />
          </el-select>
        </el-form-item>
        <el-form-item label="初始余额(元)" prop="account_balance">
          <el-input-number v-model="createForm.account_balance" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="监管方" prop="supervisor">
          <el-input v-model="createForm.supervisor" placeholder="请输入监管方名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="submitCreate">确认开立</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPay" title="单笔工资发放" width="550px">
      <el-form :model="payForm" :rules="payRules" ref="payFormRef" label-width="100px">
        <el-form-item label="专户账号">
          <el-input :model-value="currentAccount?.account_no" disabled />
        </el-form-item>
        <el-form-item label="账户余额">
          <span style="color: #047857; font-weight: 600;">¥ {{ Number(currentAccount?.account_balance || 0).toLocaleString() }}</span>
        </el-form-item>
        <el-form-item label="员工姓名" prop="employee_name">
          <el-input v-model="payForm.employee_name" placeholder="请输入员工姓名" />
        </el-form-item>
        <el-form-item label="身份证号" prop="id_card">
          <el-input v-model="payForm.id_card" placeholder="请输入身份证号" maxlength="18" />
        </el-form-item>
        <el-form-item label="发放金额(元)" prop="amount">
          <el-input-number v-model="payForm.amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="发放月份" prop="pay_month">
          <el-date-picker
            v-model="payForm.pay_month"
            type="month"
            placeholder="选择发放月份"
            value-format="YYYY-MM"
            style="width:100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPay = false">取消</el-button>
        <el-button type="primary" :loading="paying" @click="submitPay">确认发放</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRecords" title="工资发放记录" width="800px">
      <div style="margin-bottom: 12px;">
        <span style="color: #6b7280;">专户账号：</span>
        <span style="font-weight: 600;">{{ currentAccount?.account_no }}</span>
      </div>
      <el-table :data="recordList" stripe style="width: 100%" v-loading="recordsLoading">
        <el-table-column prop="transaction_no" label="交易流水号" width="200" />
        <el-table-column prop="employee_name" label="员工姓名" width="120" />
        <el-table-column prop="id_card" label="身份证号" width="180" />
        <el-table-column prop="amount" label="发放金额(元)" width="140">
          <template #default="{ row }">¥ {{ Number(row.amount || 0).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="pay_month" label="发放月份" width="110" />
        <el-table-column prop="pay_status" label="状态" width="80">
          <template #default="{ row }">
            <span :class="['tag-badge', row.pay_status === 'paid' ? 'success' : 'warning']">
              {{ row.pay_status === 'paid' ? '已发放' : '处理中' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="发放时间" />
      </el-table>
      <el-empty v-if="!recordsLoading && recordList.length === 0" description="暂无发放记录" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../../store/auth'

const router = useRouter()
const loading = ref(false)
const creating = ref(false)
const paying = ref(false)
const recordsLoading = ref(false)
const accountList = ref([])
const recordList = ref([])
const showCreate = ref(false)
const showPay = ref(false)
const showRecords = ref(false)
const currentAccount = ref(null)
const createFormRef = ref(null)
const payFormRef = ref(null)

const createForm = ref({
  bank_name: '',
  account_balance: 0,
  supervisor: ''
})
const createRules = {
  bank_name: [{ required: true, message: '请选择开户银行', trigger: 'change' }],
  account_balance: [{ required: true, message: '请输入初始余额', trigger: 'blur' }],
  supervisor: [{ required: true, message: '请输入监管方名称', trigger: 'blur' }]
}

const payForm = ref({
  employee_name: '',
  id_card: '',
  amount: 0,
  pay_month: ''
})
const payRules = {
  employee_name: [{ required: true, message: '请输入员工姓名', trigger: 'blur' }],
  id_card: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '身份证号格式不正确', trigger: 'blur' }
  ],
  amount: [{ required: true, message: '请输入发放金额', trigger: 'blur' }],
  pay_month: [{ required: true, message: '请选择发放月份', trigger: 'change' }]
}

async function loadAccounts() {
  loading.value = true
  try {
    const res = await api.get('/enterprise/wage-accounts')
    accountList.value = res.data.data || []
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function submitCreate() {
  await createFormRef.value.validate()
  creating.value = true
  try {
    await api.post('/enterprise/wage-accounts/create', createForm.value)
    ElMessage.success('工资专户开立成功')
    showCreate.value = false
    createForm.value = { bank_name: '', account_balance: 0, supervisor: '' }
    createFormRef.value?.resetFields()
    loadAccounts()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '开立失败')
  } finally {
    creating.value = false
  }
}

function openPayDialog(row) {
  currentAccount.value = row
  payForm.value = { employee_name: '', id_card: '', amount: 0, pay_month: '' }
  showPay.value = true
}

async function submitPay() {
  await payFormRef.value.validate()
  if (payForm.value.amount > currentAccount.value.account_balance) {
    ElMessage.warning('专户余额不足，无法发放')
    return
  }
  paying.value = true
  try {
    await api.post(`/enterprise/wage-accounts/${currentAccount.value.id}/pay`, payForm.value)
    ElMessage.success('工资发放成功')
    showPay.value = false
    payFormRef.value?.resetFields()
    loadAccounts()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '发放失败')
  } finally {
    paying.value = false
  }
}

async function viewRecords(row) {
  currentAccount.value = row
  showRecords.value = true
  recordsLoading.value = true
  try {
    const res = await api.get(`/enterprise/wage-accounts/${row.id}/records`)
    recordList.value = res.data.data || []
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载记录失败')
  } finally {
    recordsLoading.value = false
  }
}

function goBack() {
  router.push('/enterprise')
}

onMounted(loadAccounts)
</script>

<style scoped>
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
}
.back-btn {
  cursor: pointer;
  color: #1d4ed8;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  padding-left: 10px;
  border-left: 3px solid #1d4ed8;
}
</style>
