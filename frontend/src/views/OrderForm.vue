<template>
  <div>
    <div class="page-title">新建申报</div>
    
    <el-card>
      <el-form 
        ref="formRef"
        :model="formData" 
        :rules="rules"
        label-width="120px"
      >
        <div class="form-section">
          <div class="form-section-title">基本信息</div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="税种" prop="taxTypeId">
                <el-select 
                  v-model="formData.taxTypeId" 
                  placeholder="请选择税种" 
                  style="width: 100%"
                  :disabled="submitting"
                >
                  <el-option 
                    v-for="t in taxTypes" 
                    :key="t.id" 
                    :label="`${t.taxName} (税率: ${(t.taxRate * 100).toFixed(2)}%)`" 
                    :value="t.id" 
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="所属期类型">
                <el-select v-model="formData.periodType" placeholder="请选择" style="width: 100%" :disabled="submitting">
                  <el-option label="月度" value="monthly" />
                  <el-option label="季度" value="quarterly" />
                  <el-option label="年度" value="annual" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="所属期开始">
                <el-date-picker
                  v-model="formData.periodStart"
                  type="date"
                  placeholder="选择日期"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                  :disabled="submitting"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="所属期结束">
                <el-date-picker
                  v-model="formData.periodEnd"
                  type="date"
                  placeholder="选择日期"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                  :disabled="submitting"
                />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="责任人">
                <el-select 
                  v-model="formData.responsiblePersonId" 
                  placeholder="请选择责任人" 
                  filterable
                  style="width: 100%"
                  :disabled="submitting"
                >
                  <el-option 
                    v-for="u in users" 
                    :key="u.id" 
                    :label="`${u.realName} (${u.roleDisplay})`" 
                    :value="u.id" 
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="期望完成时间">
                <el-date-picker
                  v-model="formData.expectedCompleteTime"
                  type="datetime"
                  placeholder="选择日期时间"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%"
                  :disabled="submitting"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        
        <div class="form-section">
          <div class="form-section-title">凭证明细</div>
          
          <el-table 
            :data="formData.details" 
            style="width: 100%"
            border
            :disabled="submitting"
          >
            <el-table-column label="序号" type="index" width="60" />
            <el-table-column label="凭证号" min-width="120">
              <template #default="scope">
                <el-input 
                  v-model="scope.row.voucher_no" 
                  placeholder="请输入"
                  size="small"
                />
              </template>
            </el-table-column>
            <el-table-column label="凭证日期" width="140">
              <template #default="scope">
                <el-date-picker
                  v-model="scope.row.voucher_date"
                  type="date"
                  placeholder="选择日期"
                  value-format="YYYY-MM-DD"
                  size="small"
                  style="width: 100%"
                />
              </template>
            </el-table-column>
            <el-table-column label="项目名称" min-width="150">
              <template #default="scope">
                <el-input 
                  v-model="scope.row.item_name" 
                  placeholder="请输入"
                  size="small"
                />
              </template>
            </el-table-column>
            <el-table-column label="金额" width="120">
              <template #default="scope">
                <el-input-number
                  v-model="scope.row.amount"
                  :precision="2"
                  :min="0"
                  size="small"
                  style="width: 100%"
                  @change="calculateTax(scope.$index)"
                />
              </template>
            </el-table-column>
            <el-table-column label="税率(%)" width="100">
              <template #default="scope">
                <el-input-number
                  v-model="scope.row.tax_rate"
                  :precision="4"
                  :min="0"
                  :max="1"
                  :step="0.01"
                  size="small"
                  style="width: 100%"
                  @change="calculateTax(scope.$index)"
                />
              </template>
            </el-table-column>
            <el-table-column label="税额" width="120">
              <template #default="scope">
                <el-input 
                  v-model="scope.row.tax_amount" 
                  :precision="2"
                  :disabled="true"
                  size="small"
                />
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="120">
              <template #default="scope">
                <el-input 
                  v-model="scope.row.remarks" 
                  placeholder="请输入"
                  size="small"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="scope">
                <el-button 
                  type="danger" 
                  link 
                  size="small"
                  @click="removeDetail(scope.$index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div style="margin-top: 16px">
            <el-button type="primary" @click="addDetail" :disabled="submitting">
              <el-icon><Plus /></el-icon>
              添加明细
            </el-button>
            <span style="margin-left: 16px; color: #909399; font-size: 14px">
              合计金额: <span style="font-weight: bold; color: #409eff">¥{{ totalAmount.toFixed(2) }}</span>
              &nbsp;&nbsp;
              合计税额: <span style="font-weight: bold; color: #f56c6c">¥{{ totalTaxAmount.toFixed(2) }}</span>
            </span>
          </div>
        </div>
        
        <el-form-item style="margin-top: 24px; text-align: center">
          <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
            保存为草稿
          </el-button>
          <el-button type="success" size="large" :loading="submittingAndSubmit" @click="handleSubmitAndSubmit">
            保存并提交
          </el-button>
          <el-button size="large" @click="$router.back()">
            取消
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getTaxTypes, createOrder, submitOrder } from '@/api/order'
import { getUsers } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const taxTypes = ref([])
const users = ref([])
const submitting = ref(false)
const submittingAndSubmit = ref(false)

const selectedTaxRate = ref(0.13)

const formData = reactive({
  taxTypeId: '',
  periodType: 'monthly',
  periodStart: '',
  periodEnd: '',
  responsiblePersonId: '',
  expectedCompleteTime: '',
  details: []
})

const rules = {
  taxTypeId: [
    { required: true, message: '请选择税种', trigger: 'change' }
  ]
}

const totalAmount = computed(() => {
  return formData.details.reduce((sum, d) => sum + (d.amount || 0), 0)
})

const totalTaxAmount = computed(() => {
  return formData.details.reduce((sum, d) => sum + (d.tax_amount || 0), 0)
})

const fetchTaxTypes = async () => {
  try {
    const res = await getTaxTypes()
    taxTypes.value = res.data
  } catch (e) {
    console.error('Fetch tax types error:', e)
  }
}

const fetchUsers = async () => {
  try {
    const res = await getUsers()
    users.value = res.data
  } catch (e) {
    console.error('Fetch users error:', e)
  }
}

const addDetail = () => {
  formData.details.push({
    voucher_no: '',
    voucher_date: '',
    item_name: '',
    amount: 0,
    tax_rate: selectedTaxRate.value,
    tax_amount: 0,
    deduction_amount: 0,
    remarks: ''
  })
}

const removeDetail = (index) => {
  formData.details.splice(index, 1)
}

const calculateTax = (index) => {
  const detail = formData.details[index]
  detail.tax_amount = parseFloat(((detail.amount || 0) * (detail.tax_rate || 0)).toFixed(2))
}

const doCreate = async () => {
  if (formData.details.length === 0) {
    ElMessage.warning('请至少添加一条明细')
    return null
  }
  
  const res = await createOrder({
    ...formData
  })
  
  return res.data.id
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  submitting.value = true
  try {
    const id = await doCreate()
    if (id) {
      ElMessage.success('保存成功')
      router.push(`/orders/${id}`)
    }
  } catch (e) {
    console.error('Create order error:', e)
  } finally {
    submitting.value = false
  }
}

const handleSubmitAndSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  submittingAndSubmit.value = true
  try {
    const id = await doCreate()
    if (id) {
      await submitOrder(id)
      ElMessage.success('提交成功')
      router.push(`/orders/${id}`)
    }
  } catch (e) {
    console.error('Submit order error:', e)
  } finally {
    submittingAndSubmit.value = false
  }
}

onMounted(() => {
  fetchTaxTypes()
  fetchUsers()
  addDetail()
})
</script>
