<template>
  <div class="order-create-container">
    <el-card class="form-card">
      <template #header>
        <span>创建订单</span>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-divider content-position="left">客户信息</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="选择客户" prop="customerId">
              <el-select
                v-model="formData.customerId"
                placeholder="请选择客户"
                filterable
                style="width: 100%"
                @change="handleCustomerChange"
              >
                <el-option
                  v-for="customer in customerList"
                  :key="customer.id"
                  :label="`${customer.name} - ${customer.phone || customer.customer_no}`"
                  :value="customer.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">收货信息</el-divider>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="收货人" prop="receiverName">
              <el-input v-model="formData.receiverName" placeholder="请输入收货人" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="收货电话" prop="receiverPhone">
              <el-input v-model="formData.receiverPhone" placeholder="请输入收货电话" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="定金金额">
              <el-input-number
                v-model="formData.depositAmount"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="16">
            <el-form-item label="收货地址">
              <el-input
                v-model="formData.receiverAddress"
                type="textarea"
                :rows="2"
                placeholder="请输入收货地址"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="支付方式">
              <el-select
                v-model="formData.paymentMethodId"
                placeholder="请选择支付方式"
                style="width: 100%"
              >
                <el-option
                  v-for="pm in paymentMethods"
                  :key="pm.id"
                  :label="pm.name"
                  :value="pm.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">商品信息</el-divider>

        <el-table :data="formData.items" border style="width: 100%; margin-bottom: 20px;">
          <el-table-column prop="productName" label="商品名称" min-width="200">
            <template #default="{ row, $index }">
              <el-select
                v-model="row.productId"
                placeholder="选择商品"
                filterable
                style="width: 100%"
                @change="(val) => handleProductChange(val, $index)"
              >
                <el-option
                  v-for="product in productList"
                  :key="product.id"
                  :label="`${product.name} - ${product.product_no}`"
                  :value="product.id"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="unit" label="单位" width="100" />
          <el-table-column prop="unitPrice" label="单价" width="120">
            <template #default="{ row }">
              <el-input-number
                v-model="row.unitPrice"
                :min="0"
                :precision="2"
                style="width: 100px"
              />
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="120">
            <template #default="{ row }">
              <el-input-number
                v-model="row.quantity"
                :min="1"
                style="width: 100px"
              />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              ¥{{ (row.unitPrice * row.quantity).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ $index }">
              <el-button type="danger" link @click="removeItem($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-button type="primary" @click="addItem" style="margin-bottom: 20px;">
          <el-icon><Plus /></el-icon>
          添加商品
        </el-button>

        <el-divider content-position="left">订单汇总</el-divider>

        <el-descriptions :column="4" border>
          <el-descriptions-item label="商品种类">
            {{ formData.items.length }} 种
          </el-descriptions-item>
          <el-descriptions-item label="商品总数">
            {{ formData.items.reduce((sum, item) => sum + (item.quantity || 0), 0) }} 件
          </el-descriptions-item>
          <el-descriptions-item label="订单金额">
            <span style="color: #f56c6c; font-size: 18px; font-weight: bold;">
              ¥{{ totalAmount.toFixed(2) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="定金金额">
            <span style="color: #e6a23c;">
              ¥{{ formData.depositAmount?.toFixed(2) || '0.00' }}
            </span>
          </el-descriptions-item>
        </el-descriptions>

        <el-form-item label="备注" style="margin-top: 20px;">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注"
          />
        </el-form-item>

        <el-form-item style="margin-top: 30px;">
          <el-button type="primary" :loading="submitLoading" size="large" @click="handleSubmit">
            创建订单
          </el-button>
          <el-button size="large" @click="handleCancel">
            取消
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createOrder } from '@/api/orders'
import { getCustomerList } from '@/api/customers'
import { getProductList } from '@/api/products'
import { getPaymentMethods } from '@/api/common'

const router = useRouter()
const route = useRoute()

const formRef = ref(null)
const submitLoading = ref(false)

const customerList = ref([])
const productList = ref([])
const paymentMethods = ref([])

const formData = reactive({
  customerId: null,
  receiverName: '',
  receiverPhone: '',
  receiverAddress: '',
  depositAmount: 0,
  paymentMethodId: null,
  remark: '',
  items: [
    { productId: null, productName: '', unit: '', unitPrice: 0, quantity: 1 }
  ]
})

const formRules = {
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  receiverName: [{ required: true, message: '请输入收货人', trigger: 'blur' }],
  receiverPhone: [{ required: true, message: '请输入收货电话', trigger: 'blur' }]
}

const totalAmount = computed(() => {
  return formData.items.reduce((sum, item) => {
    return sum + (item.unitPrice || 0) * (item.quantity || 0)
  }, 0)
})

const fetchCustomers = async () => {
  try {
    const res = await getCustomerList({ page: 1, pageSize: 1000 })
    customerList.value = res.data?.list || []
  } catch (error) {
    console.error('Fetch customers error:', error)
  }
}

const fetchProducts = async () => {
  try {
    const res = await getProductList({ page: 1, pageSize: 1000, isOnSale: true })
    productList.value = res.data?.list || []
  } catch (error) {
    console.error('Fetch products error:', error)
  }
}

const fetchPaymentMethods = async () => {
  try {
    const res = await getPaymentMethods()
    paymentMethods.value = res.data || []
  } catch (error) {
    console.error('Fetch payment methods error:', error)
  }
}

const handleCustomerChange = (customerId) => {
  const customer = customerList.value.find(c => c.id === customerId)
  if (customer) {
    if (!formData.receiverName) formData.receiverName = customer.name
    if (!formData.receiverPhone) formData.receiverPhone = customer.phone
    if (!formData.receiverAddress) {
      formData.receiverAddress = [customer.province, customer.city, customer.district, customer.address]
        .filter(Boolean).join('')
    }
  }
}

const handleProductChange = (productId, index) => {
  const product = productList.value.find(p => p.id === productId)
  if (product) {
    formData.items[index].productName = product.name
    formData.items[index].unit = product.unit
    formData.items[index].unitPrice = product.sale_price
  }
}

const addItem = () => {
  formData.items.push({
    productId: null,
    productName: '',
    unit: '',
    unitPrice: 0,
    quantity: 1
  })
}

const removeItem = (index) => {
  if (formData.items.length > 1) {
    formData.items.splice(index, 1)
  } else {
    ElMessage.warning('至少需要一个商品')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      const validItems = formData.items.filter(item => item.productId && item.quantity > 0)
      if (validItems.length === 0) {
        ElMessage.warning('请添加商品')
        return
      }

      submitLoading.value = true
      try {
        await createOrder({
          customerId: formData.customerId,
          receiverName: formData.receiverName,
          receiverPhone: formData.receiverPhone,
          receiverAddress: formData.receiverAddress,
          depositAmount: formData.depositAmount,
          paymentMethodId: formData.paymentMethodId,
          remark: formData.remark,
          items: validItems.map(item => ({
            productId: item.productId,
            unitPrice: item.unitPrice,
            quantity: item.quantity
          }))
        })
        ElMessage.success('创建订单成功')
        router.push('/orders')
      } catch (error) {
        console.error('Create order error:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleCancel = () => {
  router.back()
}

onMounted(() => {
  fetchCustomers()
  fetchProducts()
  fetchPaymentMethods()

  if (route.query.customerId) {
    formData.customerId = parseInt(route.query.customerId)
  }
})
</script>

<style scoped>
.order-create-container {
  padding: 0;
}

.form-card {
  border-radius: 8px;
}
</style>
