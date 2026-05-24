<template>
  <div class="invoices">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>发票管理</span>
          <el-radio-group v-model="filterStatus" size="small" @change="load">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button value="pending">待开具</el-radio-button>
            <el-radio-button value="issued">已开具</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-table :data="invoices" border v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="phone" label="会员手机号" width="140" />
        <el-table-column prop="member_name" label="会员姓名" width="120" />
        <el-table-column prop="invoice_type" label="类型" width="100">
          <template #default="{row}">{{ row.invoice_type === 'personal' ? '个人' : '企业' }}</template>
        </el-table-column>
        <el-table-column prop="invoice_title" label="抬头" show-overflow-tooltip />
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{row}">¥{{ row.amount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="station_name" label="油站" width="140" />
        <el-table-column prop="transaction_time" label="交易时间" width="180" />
        <el-table-column label="状态" width="120">
          <template #default="{row}">
            <el-tag v-if="row.status === 'pending'" type="warning">待开具</el-tag>
            <el-tag v-else-if="row.status === 'issued'" type="success">已开具</el-tag>
            <el-tag v-else>{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="invoice_number" label="发票号" width="180">
          <template #default="{row}">
            <span v-if="row.invoice_number">{{ row.invoice_number }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{row}">
            <el-button v-if="row.status === 'pending'" type="primary" link size="small" @click="issue(row)">开具</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && invoices.length === 0" description="暂无发票数据" />
    </el-card>
    <el-dialog v-model="dialogVisible" title="开具发票" width="420px" @close="formRef?.clearValidate()">
      <el-alert v-if="currentInvoice" type="info" :title="`开票金额：¥${currentInvoice.amount.toFixed(2)}`" style="margin-bottom: 20px;">
        <template #default>
          会员：{{ currentInvoice.member_name }} ({{ currentInvoice.phone }})<br>
          抬头：{{ currentInvoice.invoice_title }}
        </template>
      </el-alert>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="发票号" prop="invoice_number">
          <el-input v-model="form.invoice_number" placeholder="请输入发票号（8-20位字母数字）" maxlength="20" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确认开具</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { report } from '../../api'

const invoices = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const currentId = ref(null)
const currentInvoice = ref(null)
const filterStatus = ref('')
const formRef = ref(null)
const form = reactive({ invoice_number: '' })

const rules = {
  invoice_number: [
    { required: true, message: '请输入发票号', trigger: 'blur' },
    { min: 8, max: 20, message: '发票号长度为8-20位', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9]+$/, message: '发票号只能包含字母和数字', trigger: 'blur' }
  ]
}

const load = async () => {
  loading.value = true
  try {
    invoices.value = await report.getInvoices({ status: filterStatus.value || undefined })
  } finally {
    loading.value = false
  }
}
onMounted(load)

const issue = (row) => {
  currentId.value = row.id
  currentInvoice.value = row
  form.invoice_number = ''
  dialogVisible.value = true
}

const submit = async () => {
  if (!formRef) return
  try {
    await formRef.validate()
  } catch (e) {
    return
  }
  try {
    await report.issueInvoice(currentId.value, form)
    ElMessage.success('发票已开具')
    dialogVisible.value = false
    load()
  } catch (e) {
    ElMessage.error(e.error || '操作失败')
  }
}
</script>
