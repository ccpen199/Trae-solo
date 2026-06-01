<template>
  <div>
    <h2 style="margin-bottom: 20px">采购下单</h2>
    <el-card>
      <el-form :model="form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="客户">
              <el-select v-model="form.customer_id" style="width: 100%" placeholder="请选择客户">
                <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="商户">
              <el-select v-model="form.merchant_id" style="width: 100%" placeholder="请选择商户" @change="loadProducts">
                <el-option v-for="m in merchants" :key="m.id" :label="m.name" :value="m.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="订单类型">
              <el-select v-model="form.type" style="width: 100%">
                <el-option label="现货采购" value="spot" />
                <el-option label="预订采购" value="booking" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="是否赊账">
          <el-switch v-model="form.is_credit" />
          <span style="margin-left: 10px; color: #909399">勾选后使用客户信用额度支付</span>
        </el-form-item>
      </el-form>

      <div style="margin: 20px 0">
        <el-button type="primary" @click="showProductDialog = true">添加商品</el-button>
        <span style="margin-left: 20px">订单总金额: <strong style="color: #f56c6c; font-size: 18px">¥{{ totalAmount.toFixed(2) }}</strong></span>
      </div>

      <el-table :data="form.items" border>
        <el-table-column prop="product_name" label="商品名称" />
        <el-table-column prop="specification" label="规格" />
        <el-table-column prop="grade" label="等级" />
        <el-table-column prop="unit" label="单位" />
        <el-table-column prop="quoted_price" label="报价">
          <template #default="{ row }">¥{{ row.quoted_price }}</template>
        </el-table-column>
        <el-table-column label="议价">
          <template #default="{ row }">
            <el-input-number v-model="row.negotiated_price" :min="0" :precision="2" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="预订数量">
          <template #default="{ row }">
            <el-input-number v-model="row.booked_quantity" :min="0" :precision="2" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="小计">
          <template #default="{ row }">¥{{ ((row.negotiated_price || row.quoted_price) * (row.booked_quantity || 0)).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ $index }">
            <el-button type="danger" link size="small" @click="form.items.splice($index, 1)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-form-item label="备注" style="margin-top: 20px">
        <el-input v-model="form.remark" type="textarea" :rows="2" />
      </el-form-item>

      <el-button type="primary" size="large" @click="submitOrder">提交订单</el-button>
    </el-card>

    <el-dialog v-model="showProductDialog" title="选择商品" width="600px">
      <el-table :data="merchantProducts" border @row-click="selectProduct" highlight-current-row>
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="specification" label="规格" />
        <el-table-column prop="grade" label="等级" />
        <el-table-column prop="unit" label="单位" />
        <el-table-column prop="price" label="价格">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="showProductDialog = false">取消</el-button>
        <el-button type="primary" @click="addSelectedProduct">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const customers = ref([])
const merchants = ref([])
const merchantProducts = ref([])
const showProductDialog = ref(false)
const selectedProduct = ref(null)
const form = ref({
  customer_id: '',
  merchant_id: '',
  type: 'spot',
  is_credit: false,
  remark: '',
  items: []
})

const totalAmount = computed(() => {
  return form.value.items.reduce((sum, item) => {
    const price = item.negotiated_price || item.quoted_price
    return sum + price * (item.booked_quantity || 0)
  }, 0)
})

const loadProducts = async () => {
  if (form.value.merchant_id) {
    const res = await axios.get(`/api/products?merchant_id=${form.value.merchant_id}`)
    merchantProducts.value = res.data
  }
}

const selectProduct = (row) => {
  selectedProduct.value = row
}

const addSelectedProduct = () => {
  if (selectedProduct.value) {
    const p = selectedProduct.value
    form.value.items.push({
      product_id: p.id,
      product_name: p.name,
      specification: p.specification,
      grade: p.grade,
      unit: p.unit,
      quoted_price: p.price,
      negotiated_price: p.price,
      booked_quantity: 1
    })
    showProductDialog.value = false
  }
}

const submitOrder = async () => {
  if (!form.value.customer_id || !form.value.merchant_id || form.value.items.length === 0) {
    ElMessage.warning('请完善订单信息')
    return
  }
  try {
    await axios.post('/api/orders', form.value)
    ElMessage.success('订单创建成功')
    router.push('/orders')
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '创建失败')
  }
}

onMounted(async () => {
  customers.value = (await axios.get('/api/customers')).data
  merchants.value = (await axios.get('/api/merchants')).data
})
</script>
