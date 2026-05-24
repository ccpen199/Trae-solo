<template>
  <div class="invoices">
    <el-card>
      <template #header>发票管理</template>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="已申请发票" name="applied">
          <el-table :data="invoices" border v-loading="loading">
            <el-table-column prop="created_at" label="申请时间" width="180" />
            <el-table-column prop="transaction_time" label="交易时间" width="180" />
            <el-table-column prop="station_name" label="油站" />
            <el-table-column prop="amount" label="金额(元)" width="120">
              <template #default="{row}">¥{{ row.amount.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="invoice_type" label="类型" width="100">
              <template #default="{row}">{{ row.invoice_type === 'personal' ? '个人' : '企业' }}</template>
            </el-table-column>
            <el-table-column prop="invoice_title" label="抬头" />
            <el-table-column label="状态" width="120">
              <template #default="{row}">
                <el-tag v-if="row.status === 'pending'" type="warning">待开具</el-tag>
                <el-tag v-else-if="row.status === 'issued'" type="success">已开具</el-tag>
                <el-tag v-else type="info">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="invoice_number" label="发票号" width="180" />
          </el-table>
          <el-empty v-if="!loading && invoices.length === 0" description="暂无已申请的发票" />
        </el-tab-pane>
        <el-tab-pane label="可开发票" name="available">
          <el-table :data="availableTransactions" border v-loading="loading">
            <el-table-column prop="end_time" label="交易时间" width="180" />
            <el-table-column prop="station_name" label="油站" />
            <el-table-column prop="fuel_type_name" label="油品" width="100" />
            <el-table-column prop="volume" label="升数(L)" width="100" />
            <el-table-column prop="final_amount" label="金额(元)" width="120">
              <template #default="{row}">¥{{ row.final_amount.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="plate_number" label="车牌号" width="120" />
            <el-table-column label="操作" width="100">
              <template #default="{row}">
                <el-button type="primary" link size="small" @click="openApplyDialog(row)">申请发票</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!loading && availableTransactions.length === 0" description="暂无可以开发票的交易" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="dialogVisible" title="申请发票" width="500px">
      <el-alert v-if="selectedTransaction" type="info" :title="`交易金额：¥${selectedTransaction.final_amount.toFixed(2)}`" style="margin-bottom: 20px;">
        <template #default>
          交易时间：{{ selectedTransaction.end_time }}<br>
          油站：{{ selectedTransaction.station_name }}
        </template>
      </el-alert>
      <el-form :model="form" label-width="100px">
        <el-form-item label="发票类型">
          <el-radio-group v-model="form.invoice_type">
            <el-radio value="personal">个人</el-radio>
            <el-radio value="company">企业</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="发票抬头" required>
          <el-input v-model="form.invoice_title" placeholder="请输入发票抬头" />
        </el-form-item>
        <el-form-item v-if="form.invoice_type === 'company'" label="税号" required>
          <el-input v-model="form.tax_number" placeholder="请输入企业税号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitInvoice">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { member } from '../../api'

const activeTab = ref('available')
const loading = ref(false)
const invoices = ref([])
const availableTransactions = ref([])
const dialogVisible = ref(false)
const selectedTransaction = ref(null)
const form = ref({
  invoice_type: 'personal',
  invoice_title: '',
  tax_number: ''
})

const loadData = async () => {
  loading.value = true
  try {
    invoices.value = await member.getInvoices()
    availableTransactions.value = await member.getTransactionsAvailableForInvoice()
  } finally {
    loading.value = false
  }
}
onMounted(loadData)

const openApplyDialog = (row) => {
  selectedTransaction.value = row
  form.value = {
    invoice_type: 'personal',
    invoice_title: '',
    tax_number: ''
  }
  dialogVisible.value = true
}

const submitInvoice = async () => {
  if (!form.value.invoice_title) {
    return ElMessage.warning('请输入发票抬头')
  }
  if (form.value.invoice_type === 'company' && !form.value.tax_number) {
    return ElMessage.warning('请输入企业税号')
  }
  try {
    await member.applyInvoice({
      transaction_id: selectedTransaction.value.id,
      invoice_type: form.value.invoice_type,
      invoice_title: form.value.invoice_title,
      tax_number: form.value.tax_number
    })
    ElMessage.success('发票申请已提交')
    dialogVisible.value = false
    activeTab.value = 'applied'
    loadData()
  } catch (e) {
    ElMessage.error(e.error || '申请失败')
  }
}
</script>
