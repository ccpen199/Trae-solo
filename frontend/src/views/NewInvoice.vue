<template>
  <div class="new-invoice">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>新建开票申请</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="invoice-form"
      >
        <el-divider content-position="left">基本信息</el-divider>

        <el-form-item label="关联订单" prop="order_no">
          <el-select 
            v-model="form.order_no" 
            placeholder="请选择订单" 
            style="width: 100%"
            filterable
            @change="onOrderChange"
          >
            <el-option
              v-for="order in pendingOrders"
              :key="order.id"
              :label="`${order.order_no} - ${order.customer_name} - ¥${formatAmount(order.amount)}`"
              :value="order.order_no"
            />
          </el-select>
          <div class="form-tip">请选择需要开票的业务订单</div>
        </el-form-item>

        <el-divider content-position="left">发票信息</el-divider>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="发票抬头" prop="invoice_title">
              <el-input v-model="form.invoice_title" placeholder="请输入发票抬头" />
              <div class="form-tip">企业名称或个人姓名</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="纳税人识别号" prop="tax_no">
              <el-input v-model="form.tax_no" placeholder="请输入纳税人识别号" maxlength="18" />
              <div class="form-tip">15/17/18位统一社会信用代码</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="开户银行">
              <el-input v-model="form.bank_name" placeholder="请输入开户银行名称（选填）" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="银行账号">
              <el-input v-model="form.bank_account" placeholder="请输入银行账号（选填）" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="企业地址">
              <el-input v-model="form.address" placeholder="请输入企业地址（选填）" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="form.phone" placeholder="请输入联系电话（选填）" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">开票明细</el-divider>

        <el-form-item label="开票金额">
          <el-input-number
            v-model="form.amount"
            :min="0.01"
            :precision="2"
            :step="100"
            style="width: 200px"
          />
          <span class="currency">元</span>
        </el-form-item>

        <el-form-item label="开票项目">
          <div class="items-wrapper">
            <el-table :data="form.items" border style="width: 100%">
              <el-table-column prop="name" label="项目名称" min-width="200">
                <template #default="{ row, $index }">
                  <el-input v-model="row.name" placeholder="项目名称" />
                </template>
              </el-table-column>
              <el-table-column prop="spec" label="规格型号" width="120">
                <template #default="{ row }">
                  <el-input v-model="row.spec" placeholder="规格" />
                </template>
              </el-table-column>
              <el-table-column prop="unit" label="单位" width="80">
                <template #default="{ row }">
                  <el-input v-model="row.unit" placeholder="单位" />
                </template>
              </el-table-column>
              <el-table-column prop="quantity" label="数量" width="100">
                <template #default="{ row }">
                  <el-input-number v-model="row.quantity" :min="1" />
                </template>
              </el-table-column>
              <el-table-column prop="price" label="单价" width="120">
                <template #default="{ row }">
                  <el-input-number v-model="row.price" :min="0" :precision="2" />
                </template>
              </el-table-column>
              <el-table-column label="金额" width="120">
                <template #default="{ row }">
                  <span class="item-amount">¥{{ (row.quantity * row.price).toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ $index }">
                  <el-button 
                    type="danger" 
                    link 
                    @click="removeItem($index)"
                    :disabled="form.items.length <= 1"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="add-item-wrapper">
              <el-button type="primary" link @click="addItem">
                <el-icon><Plus /></el-icon>
                添加项目
              </el-button>
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
            提交开票申请
          </el-button>
          <el-button size="large" @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import api from '@/utils/api'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const pendingOrders = ref([])
const submitting = ref(false)

const form = reactive({
  order_no: '',
  invoice_title: '',
  tax_no: '',
  bank_name: '',
  bank_account: '',
  address: '',
  phone: '',
  amount: 0,
  items: [
    { name: '', spec: '', unit: '件', quantity: 1, price: 0 }
  ]
})

const rules = {
  order_no: [{ required: true, message: '请选择关联订单', trigger: 'change' }],
  invoice_title: [{ required: true, message: '请输入发票抬头', trigger: 'blur' }],
  tax_no: [
    { required: true, message: '请输入纳税人识别号', trigger: 'blur' },
    { min: 15, max: 18, message: '税号长度应为15-18位', trigger: 'blur' }
  ],
  amount: [{ required: true, message: '请输入开票金额', trigger: 'blur' }]
}

const formatAmount = (amount) => {
  if (!amount) return '0.00'
  return Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const totalAmount = computed(() => {
  return form.items.reduce((sum, item) => {
    return sum + (item.quantity * item.price)
  }, 0)
})

const loadPendingOrders = async () => {
  try {
    const data = await api.get('/orders', { params: { status: 'pending', limit: 100 } })
    pendingOrders.value = data.orders
  } catch (e) {
    console.error('Failed to load orders:', e)
  }
}

const onOrderChange = (orderNo) => {
  const order = pendingOrders.value.find(o => o.order_no === orderNo)
  if (order) {
    form.amount = order.amount
  }
}

const addItem = () => {
  form.items.push({ name: '', spec: '', unit: '件', quantity: 1, price: 0 })
}

const removeItem = (index) => {
  form.items.splice(index, 1)
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const validItems = form.items.filter(item => item.name && item.price > 0)
  if (validItems.length === 0) {
    ElMessage.warning('请至少添加一个有效的开票项目')
    return
  }

  submitting.value = true
  try {
    const result = await api.post('/invoices', {
      order_no: form.order_no,
      invoice_title: form.invoice_title,
      tax_no: form.tax_no,
      bank_account: form.bank_account,
      bank_name: form.bank_name,
      address: form.address,
      phone: form.phone,
      amount: form.amount || totalAmount.value,
      items: validItems
    })

    ElMessage.success('开票申请提交成功！状态：待开票')
    router.push('/invoices')
  } catch (e) {
    console.error('Submit failed:', e)
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  router.back()
}

onMounted(() => {
  loadPendingOrders()
})
</script>

<style scoped>
.new-invoice {
  max-width: 900px;
  margin: 0 auto;
}

.card-header {
  font-weight: 600;
  font-size: 18px;
}

.invoice-form {
  padding: 20px 0;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.items-wrapper {
  width: 100%;
}

.add-item-wrapper {
  margin-top: 12px;
}

.currency {
  margin-left: 8px;
  color: #606266;
}

.item-amount {
  font-weight: 500;
  color: #f56c6c;
}
</style>
