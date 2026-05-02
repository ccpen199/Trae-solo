<template>
  <div class="order-create">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>资产登记</span>
        </div>
      </template>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="140px"
        style="max-width: 800px"
      >
        <el-form-item label="金额" prop="total_amount">
          <el-input-number 
            v-model="form.total_amount" 
            :min="0" 
            :precision="2"
            style="width: 300px"
          />
        </el-form-item>
        
        <el-form-item label="期望完成日期" prop="expected_completion_date">
          <el-date-picker
            v-model="form.expected_completion_date"
            type="date"
            placeholder="选择日期"
            :disabled-date="disabledDate"
            style="width: 300px"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="优先级">
          <el-radio-group v-model="form.priority">
            <el-radio :value="0">普通</el-radio>
            <el-radio :value="1">高</el-radio>
            <el-radio :value="2">紧急</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入描述"
            style="width: 500px"
          />
        </el-form-item>
        
        <el-form-item label="附件信息">
          <el-input
            v-model="form.attachments"
            type="textarea"
            :rows="3"
            placeholder="请输入附件相关信息"
            style="width: 500px"
          />
        </el-form-item>
        
        <el-divider>订单明细</el-divider>
        
        <el-form-item label="订单明细">
          <el-table :data="form.details" border style="width: 100%">
            <el-table-column prop="item_name" label="商品名称" width="180">
              <template #default="{ $index }">
                <el-input v-model="form.details[$index].item_name" placeholder="商品名称" />
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="120">
              <template #default="{ $index }">
                <el-input-number v-model="form.details[$index].quantity" :min="0" :precision="4" />
              </template>
            </el-table-column>
            <el-table-column prop="unit_price" label="单价" width="140">
              <template #default="{ $index }">
                <el-input-number v-model="form.details[$index].unit_price" :min="0" :precision="2" />
              </template>
            </el-table-column>
            <el-table-column label="金额" width="140">
              <template #default="{ row }">
                ¥{{ (row.quantity * row.unit_price).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ $index }">
                <el-button type="danger" link @click="removeDetail($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="primary" link @click="addDetail" style="margin-top: 12px">
            + 添加明细
          </el-button>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleCreate">创建订单</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button @click="goBack">返回</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as api from '@/api'

const router = useRouter()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  total_amount: null,
  expected_completion_date: '',
  priority: 0,
  description: '',
  attachments: '',
  details: []
})

const rules = {
  total_amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  expected_completion_date: [{ required: true, message: '请选择期望完成日期', trigger: 'change' }]
}

const disabledDate = (time) => {
  return time.getTime() < Date.now() - 8.64e7
}

const addDetail = () => {
  form.details.push({
    item_name: '',
    quantity: 0,
    unit_price: 0
  })
}

const removeDetail = (index) => {
  form.details.splice(index, 1)
}

const goBack = () => {
  router.back()
}

const resetForm = () => {
  formRef.value && formRef.value.resetFields()
  form.details = []
}

const handleCreate = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const order = await api.createOrder(form)
        ElMessage.success('资产登记创建成功')
        router.push(`/orders/${order.id}`)
      } catch (error) {
        console.error('创建订单失败:', error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-create {
  max-width: 900px;
}
</style>
