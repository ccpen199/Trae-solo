<template>
  <div class="voucher-form-page">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <span class="page-title">{{ voucherId ? '编辑凭证' : '新建凭证' }}</span>
          <div>
            <el-button @click="goBack">返回</el-button>
            <el-button type="primary" @click="saveVoucher" :loading="saving">
              <el-icon><DocumentAdd /></el-icon>
              保存凭证
            </el-button>
          </div>
        </div>
      </template>

      <el-form :model="voucherForm" :rules="voucherRules" ref="voucherFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="凭证类型" prop="voucher_type">
              <el-select v-model="voucherForm.voucher_type" placeholder="请选择凭证类型" style="width: 100%;">
                <el-option label="收款凭证" value="收款凭证" />
                <el-option label="付款凭证" value="付款凭证" />
                <el-option label="转账凭证" value="转账凭证" />
                <el-option label="记账凭证" value="记账凭证" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="凭证日期" prop="voucher_date">
              <el-date-picker
                v-model="voucherForm.voucher_date"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="会计期间" prop="period">
              <el-date-picker
                v-model="voucherForm.period"
                type="month"
                placeholder="选择月份"
                value-format="YYYY-MM"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="责任人">
              <el-select v-model="voucherForm.responsible_name" placeholder="请选择责任人" clearable style="width: 100%;">
                <el-option
                  v-for="user in users"
                  :key="user.id"
                  :label="user.name"
                  :value="user.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="期望完成时间">
              <el-date-picker
                v-model="voucherForm.expected_completion_time"
                type="datetime"
                placeholder="选择日期时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider>凭证明细</el-divider>

        <el-table :data="voucherForm.details" border style="width: 100%;">
          <el-table-column label="序号" width="60" align="center">
            <template #default="{ $index }">
              {{ $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column label="科目" min-width="200">
            <template #default="{ row, $index }">
              <el-select
                v-model="row.subject_id"
                placeholder="选择科目"
                filterable
                style="width: 100%;"
                @change="(val) => onSubjectChange(val, $index)"
              >
                <el-option
                  v-for="subject in subjects"
                  :key="subject.id"
                  :label="`${subject.code} - ${subject.name}`"
                  :value="subject.id"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="摘要" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.summary" placeholder="输入摘要" />
            </template>
          </el-table-column>
          <el-table-column label="借方金额" width="150">
            <template #default="{ row }">
              <el-input-number
                v-model="row.debit_amount"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%;"
                @change="calculateTotal"
              />
            </template>
          </el-table-column>
          <el-table-column label="贷方金额" width="150">
            <template #default="{ row }">
              <el-input-number
                v-model="row.credit_amount"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%;"
                @change="calculateTotal"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ $index }">
              <el-button
                type="danger"
                link
                :disabled="voucherForm.details.length <= 1"
                @click="removeDetail($index)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-row style="margin-top: 15px;">
          <el-col :span="24" style="text-align: right;">
            <el-button type="primary" @click="addDetail">
              <el-icon><Plus /></el-icon>
              添加行
            </el-button>
          </el-col>
        </el-row>

        <el-row style="margin-top: 20px;">
          <el-col :span="24">
            <el-card shadow="never" style="background: #f5f7fa;">
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="total-info">
                    <span class="total-label">借方合计：</span>
                    <span class="total-value" :class="{ 'text-danger': !isBalance }">
                      ¥{{ totalDebit.toFixed(2) }}
                    </span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="total-info">
                    <span class="total-label">贷方合计：</span>
                    <span class="total-value" :class="{ 'text-danger': !isBalance }">
                      ¥{{ totalCredit.toFixed(2) }}
                    </span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="total-info">
                    <span class="total-label">借贷平衡：</span>
                    <el-tag :type="isBalance ? 'success' : 'danger'">
                      {{ isBalance ? '平衡' : '不平衡' }}
                    </el-tag>
                  </div>
                </el-col>
              </el-row>
            </el-card>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import api from '../api'

const router = useRouter()
const route = useRoute()

const voucherId = computed(() => route.params.id)

const voucherFormRef = ref(null)
const saving = ref(false)
const subjects = ref([])
const users = ref([])

const voucherForm = reactive({
  voucher_type: '记账凭证',
  voucher_date: dayjs().format('YYYY-MM-DD'),
  period: dayjs().format('YYYY-MM'),
  responsible_id: '',
  responsible_name: '',
  expected_completion_time: '',
  details: [
    {
      subject_id: '',
      subject_code: '',
      subject_name: '',
      debit_amount: 0,
      credit_amount: 0,
      summary: ''
    }
  ]
})

const voucherRules = {
  voucher_type: [{ required: true, message: '请选择凭证类型', trigger: 'change' }],
  voucher_date: [{ required: true, message: '请选择凭证日期', trigger: 'change' }],
  period: [{ required: true, message: '请选择会计期间', trigger: 'change' }]
}

const totalDebit = computed(() => {
  return voucherForm.details.reduce((sum, d) => sum + (d.debit_amount || 0), 0)
})

const totalCredit = computed(() => {
  return voucherForm.details.reduce((sum, d) => sum + (d.credit_amount || 0), 0)
})

const isBalance = computed(() => {
  return Math.abs(totalDebit.value - totalCredit.value) < 0.01
})

function calculateTotal() {}

function addDetail() {
  voucherForm.details.push({
    subject_id: '',
    subject_code: '',
    subject_name: '',
    debit_amount: 0,
    credit_amount: 0,
    summary: ''
  })
}

function removeDetail(index) {
  voucherForm.details.splice(index, 1)
}

function onSubjectChange(subjectId, index) {
  const subject = subjects.value.find(s => s.id === subjectId)
  if (subject) {
    voucherForm.details[index].subject_code = subject.code
    voucherForm.details[index].subject_name = subject.name
  }
}

async function loadSubjects() {
  try {
    const result = await api.getSubjects()
    if (result.success) {
      subjects.value = result.data
    }
  } catch (error) {
    console.error('加载科目失败:', error)
  }
}

async function loadUsers() {
  try {
    const result = await api.getUsers()
    if (result.success) {
      users.value = result.data
    }
  } catch (error) {
    console.error('加载用户失败:', error)
  }
}

async function loadVoucher() {
  if (!voucherId.value) return
  try {
    const result = await api.getVoucher(voucherId.value)
    if (result.success && result.data) {
      const data = result.data
      voucherForm.voucher_type = data.voucher_type
      voucherForm.voucher_date = data.voucher_date
      voucherForm.period = data.period
      voucherForm.responsible_id = data.responsible_id || ''
      voucherForm.responsible_name = data.responsible_name || ''
      voucherForm.expected_completion_time = data.expected_completion_time || ''
      if (data.details && data.details.length > 0) {
        voucherForm.details = data.details.map(d => ({
          subject_id: d.subject_id,
          subject_code: d.subject_code,
          subject_name: d.subject_name,
          debit_amount: d.debit_amount,
          credit_amount: d.credit_amount,
          summary: d.summary
        }))
      }
    }
  } catch (error) {
    console.error('加载凭证失败:', error)
    ElMessage.error('加载凭证失败')
  }
}

async function saveVoucher() {
  if (!isBalance.value) {
    ElMessage.warning('借贷不平，无法保存')
    return
  }

  try {
    await voucherFormRef.value.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    let result
    if (voucherId.value) {
      result = await api.updateVoucher(voucherId.value, {
        ...voucherForm,
        total_debit: totalDebit.value,
        total_credit: totalCredit.value
      })
    } else {
      result = await api.createVoucher({
        ...voucherForm,
        total_debit: totalDebit.value,
        total_credit: totalCredit.value
      })
    }

    if (result.success) {
      ElMessage.success(voucherId.value ? '更新成功' : '创建成功')
      router.push('/vouchers')
    } else {
      ElMessage.error(result.error || '保存失败')
    }
  } catch (error) {
    console.error('保存凭证失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  loadSubjects()
  loadUsers()
  if (voucherId.value) {
    loadVoucher()
  }
})
</script>

<style scoped>
.total-info {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.total-label {
  color: #606266;
  margin-right: 8px;
}

.total-value {
  font-weight: bold;
  color: #303133;
}

.text-danger {
  color: #f56c6c;
}
</style>
