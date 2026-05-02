<template>
  <div class="card-container">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h3>新建采购申请</h3>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <el-card>
      <el-form :model="purchaseForm" :rules="purchaseRules" ref="purchaseFormRef" label-width="120px">
        <el-form-item label="申请标题" prop="title">
          <el-input v-model="purchaseForm.title" placeholder="请输入申请标题" style="width: 400px;" />
        </el-form-item>
        <el-form-item label="预算">
          <el-select v-model="purchaseForm.budget_id" placeholder="请选择预算（可选）" clearable style="width: 400px;">
            <el-option
              v-for="budget in budgets"
              :key="budget.id"
              :label="`${budget.name} (可用: ¥${budget.available_amount.toFixed(2)})`"
              :value="budget.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="期望完成日期">
          <el-date-picker
            v-model="purchaseForm.expected_completion_date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 400px;"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="purchaseForm.description" type="textarea" :rows="3" placeholder="请输入描述" style="width: 600px;" />
        </el-form-item>
        <el-form-item label="商品列表" prop="items">
          <div>
            <el-table :data="purchaseForm.items" border size="small" style="margin-bottom: 10px;">
              <el-table-column prop="product_name" label="商品名称" />
              <el-table-column prop="quantity" label="数量" width="120">
                <template #default="{ row, $index }">
                  <el-input-number v-model="row.quantity" :min="1" size="small" @change="calculateTotal" />
                </template>
              </el-table-column>
              <el-table-column prop="unit_price" label="单价" width="120">
                <template #default="{ row }">
                  ¥{{ row.unit_price?.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column label="小计" width="120">
                <template #default="{ row }">
                  ¥{{ (row.quantity * row.unit_price)?.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ $index }">
                  <el-button type="text" size="small" @click="removeItem($index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button type="primary" size="small" @click="showProductDialog = true">
              <el-icon><Plus /></el-icon>
              添加商品
            </el-button>
          </div>
        </el-form-item>
        <el-form-item>
          <el-divider />
          <div style="text-align: right; font-size: 16px;">
            <span style="margin-right: 20px;">商品总数: <strong>{{ totalQuantity }}</strong></span>
            <span>总金额: <strong style="color: #f56c6c; font-size: 20px;">¥{{ totalAmount.toFixed(2) }}</strong></span>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submitPurchase">提交申请</el-button>
          <el-button :loading="saving" @click="saveDraft">保存草稿</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-dialog v-model="showProductDialog" title="选择商品" width="800px">
      <el-table :data="products" v-loading="productLoading" stripe @selection-change="handleProductSelection">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="code" label="编码" width="100" />
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="category_name" label="分类" width="100" />
        <el-table-column prop="unit_price" label="单价" width="100">
          <template #default="{ row }">
            ¥{{ row.unit_price?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="stock_quantity" label="库存" width="80" />
      </el-table>
      <template #footer>
        <el-button @click="showProductDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddProducts" :disabled="selectedProducts.length === 0">
          确认添加 ({{ selectedProducts.length }})
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const purchaseFormRef = ref(null)
const submitting = ref(false)
const saving = ref(false)
const showProductDialog = ref(false)
const productLoading = ref(false)
const products = ref([])
const budgets = ref([])
const selectedProducts = ref([])

const purchaseForm = reactive({
  title: '',
  budget_id: null,
  description: '',
  expected_completion_date: null,
  items: []
})

const purchaseRules = {
  title: [{ required: true, message: '请输入申请标题', trigger: 'blur' }],
  items: [
    { 
      validator: (rule, value, callback) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少添加一个商品'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

const totalQuantity = computed(() => {
  return purchaseForm.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
})

const totalAmount = computed(() => {
  return purchaseForm.items.reduce((sum, item) => sum + (item.quantity * item.unit_price || 0), 0)
})

const calculateTotal = () => {
  // 计算逻辑由 computed 处理
}

const loadBudgets = async () => {
  try {
    budgets.value = await request.get('/purchases/budgets/list')
  } catch (error) {
    console.error('加载预算失败:', error)
  }
}

const loadProducts = async () => {
  productLoading.value = true
  try {
    products.value = await request.get('/products/')
  } catch (error) {
    console.error('加载商品失败:', error)
  } finally {
    productLoading.value = false
  }
}

const handleProductSelection = (selection) => {
  selectedProducts.value = selection
}

const confirmAddProducts = () => {
  selectedProducts.value.forEach(product => {
    const existing = purchaseForm.items.find(item => item.product_id === product.id)
    if (!existing) {
      purchaseForm.items.push({
        product_id: product.id,
        product_name: product.name,
        unit_price: product.unit_price,
        quantity: 1
      })
    }
  })
  showProductDialog.value = false
}

const removeItem = (index) => {
  purchaseForm.items.splice(index, 1)
}

const saveDraft = async () => {
  if (!purchaseForm.title) {
    ElMessage.warning('请输入申请标题')
    return
  }
  if (purchaseForm.items.length === 0) {
    ElMessage.warning('请至少添加一个商品')
    return
  }

  saving.value = true
  try {
    const data = {
      title: purchaseForm.title,
      description: purchaseForm.description,
      budget_id: purchaseForm.budget_id,
      items: purchaseForm.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      }))
    }
    
    await request.post('/purchases/', data)
    ElMessage.success('草稿保存成功')
    router.push('/purchases')
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

const submitPurchase = async () => {
  if (!purchaseFormRef.value) return

  await purchaseFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const data = {
          title: purchaseForm.title,
          description: purchaseForm.description,
          budget_id: purchaseForm.budget_id,
          expected_completion_date: purchaseForm.expected_completion_date,
          items: purchaseForm.items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price
          }))
        }
        
        const result = await request.post('/purchases/', data)
        
        if (result.success && result.order) {
          await request.post(`/purchases/${result.order.id}/submit`)
          ElMessage.success('申请提交成功')
          router.push('/purchases')
        }
      } catch (error) {
        console.error('提交失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

watch(showProductDialog, (val) => {
  if (val) {
    loadProducts()
  }
})

onMounted(() => {
  loadBudgets()
  
  const cartItems = JSON.parse(localStorage.getItem('purchaseCart') || '[]')
  if (cartItems.length > 0) {
    purchaseForm.items = cartItems
    localStorage.removeItem('purchaseCart')
  }
})
</script>
