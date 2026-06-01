<template>
  <div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="商品管理" name="products">
        <el-card shadow="hover">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span style="font-weight: bold">商品列表</span>
              <el-button type="primary" @click="openProductDialog">新增商品</el-button>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="6" v-for="product in products" :key="product.id">
              <el-card shadow="hover" style="margin-bottom: 20px">
                <div style="height: 120px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; border-radius: 4px">
                  <el-icon size="40" color="#999"><Goods /></el-icon>
                </div>
                <div style="font-weight: bold; margin-bottom: 5px">{{ product.name }}</div>
                <div style="color: #999; font-size: 12px; margin-bottom: 10px; height: 32px; overflow: hidden">{{ product.description }}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px">
                  <span style="color: #F56C6C; font-weight: bold; font-size: 18px">{{ product.points_required }} 积分</span>
                  <span style="color: #999; font-size: 12px">库存: {{ product.stock }}</span>
                </div>
                <div style="display: flex; gap: 5px">
                  <el-button size="small" type="primary" style="flex: 1" @click="openRedeemDialog(product)" :disabled="product.stock <= 0">兑换</el-button>
                  <el-button size="small" @click="openProductDialog(product)">编辑</el-button>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="兑换记录" name="records">
        <el-card shadow="hover">
          <template #header>
            <span style="font-weight: bold">兑换记录</span>
          </template>

          <el-table :data="exchanges" v-loading="loading">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="resident_name" label="居民" width="100" />
            <el-table-column prop="product_name" label="商品" width="120" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="points_spent" label="消耗积分" width="100" />
            <el-table-column prop="verification_code" label="核销码" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getExchangeStatusType(row.status)" size="small">
                  {{ getExchangeStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="兑换时间" width="180" />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'pending'"
                  type="primary"
                  link
                  size="small"
                  @click="openRedeemCodeDialog(row)"
                >核销</el-button>
                <el-button
                  v-if="row.status === 'pending'"
                  type="danger"
                  link
                  size="small"
                  @click="cancelExchange(row)"
                >取消</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="productDialogVisible" :title="isEditProduct ? '编辑商品' : '新增商品'" width="500px">
      <el-form :model="productForm" label-width="100px">
        <el-form-item label="商品名称" required>
          <el-input v-model="productForm.name" />
        </el-form-item>
        <el-form-item label="商品描述">
          <el-input v-model="productForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="所需积分" required>
          <el-input-number v-model="productForm.points_required" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="库存数量" required>
          <el-input-number v-model="productForm.stock" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="每人限兑">
          <el-input-number v-model="productForm.max_per_resident" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="上架状态">
          <el-switch v-model="productForm.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="productDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProduct">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="redeemDialogVisible" title="兑换商品" width="400px">
      <div v-if="currentProduct">
        <p style="margin-bottom: 10px">商品: <strong>{{ currentProduct.name }}</strong></p>
        <p style="margin-bottom: 10px">所需积分: <strong style="color: #F56C6C">{{ currentProduct.points_required }} 积分</strong></p>
        <p style="margin-bottom: 20px">库存: <strong>{{ currentProduct.stock }}</strong></p>
        <el-form label-width="80px">
          <el-form-item label="居民">
            <el-select v-model="redeemResidentId" style="width: 100%" filterable placeholder="请选择居民">
              <el-option
                v-for="r in residents"
                :key="r.id"
                :label="`${r.name} (可用: ${r.available_points}积分)`"
                :value="r.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="数量">
            <el-input-number v-model="redeemQuantity" :min="1" :max="currentProduct.stock" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="redeemDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRedeem">确认兑换</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="redeemCodeDialogVisible" title="核销兑换" width="400px">
      <div v-if="currentExchange">
        <p style="margin-bottom: 10px">居民: <strong>{{ currentExchange.resident_name }}</strong></p>
        <p style="margin-bottom: 10px">商品: <strong>{{ currentExchange.product_name }}</strong></p>
        <p style="margin-bottom: 20px">核销码: <strong style="font-size: 20px; letter-spacing: 2px">{{ currentExchange.verification_code }}</strong></p>
        <el-form label-width="80px">
          <el-form-item label="输入核销码">
            <el-input v-model="inputRedeemCode" placeholder="请输入核销码" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="redeemCodeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRedeemCode">确认核销</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Goods } from '@element-plus/icons-vue'
import axios from 'axios'

const activeTab = ref('products')
const loading = ref(false)
const products = ref([])
const exchanges = ref([])
const residents = ref([])

const productDialogVisible = ref(false)
const redeemDialogVisible = ref(false)
const redeemCodeDialogVisible = ref(false)
const isEditProduct = ref(false)
const productForm = ref({})
const currentProduct = ref(null)
const currentExchange = ref(null)
const redeemResidentId = ref(null)
const redeemQuantity = ref(1)
const inputRedeemCode = ref('')

const getExchangeStatusLabel = (status) => {
  const labels = { pending: '待核销', redeemed: '已核销', cancelled: '已取消' }
  return labels[status] || status
}

const getExchangeStatusType = (status) => {
  const types = { pending: 'warning', redeemed: 'success', cancelled: 'info' }
  return types[status] || 'info'
}

const loadProducts = async () => {
  try {
    const res = await axios.get('/api/exchange/products')
    products.value = res.data
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const loadExchanges = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/exchange/exchanges', { params: { pageSize: 100 } })
    exchanges.value = res.data.data
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const loadResidents = async () => {
  try {
    const res = await axios.get('/api/residents', { params: { pageSize: 1000 } })
    residents.value = res.data.data
  } catch (e) {
    console.error(e)
  }
}

const openProductDialog = (row = null) => {
  isEditProduct.value = !!row
  productForm.value = row ? { ...row } : {
    name: '',
    description: '',
    points_required: 100,
    stock: 10,
    max_per_resident: 1,
    is_active: true
  }
  productDialogVisible.value = true
}

const saveProduct = async () => {
  try {
    if (isEditProduct.value) {
      await axios.put(`/api/exchange/products/${productForm.value.id}`, productForm.value)
      ElMessage.success('更新成功')
    } else {
      await axios.post('/api/exchange/products', productForm.value)
      ElMessage.success('创建成功')
    }
    productDialogVisible.value = false
    loadProducts()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

const openRedeemDialog = (product) => {
  currentProduct.value = product
  redeemResidentId.value = null
  redeemQuantity.value = 1
  redeemDialogVisible.value = true
}

const confirmRedeem = async () => {
  if (!redeemResidentId.value) {
    ElMessage.warning('请选择居民')
    return
  }
  try {
    await axios.post('/api/exchange/redeem', {
      resident_id: redeemResidentId.value,
      product_id: currentProduct.value.id,
      quantity: redeemQuantity.value
    })
    ElMessage.success('兑换成功')
    redeemDialogVisible.value = false
    loadProducts()
    loadExchanges()
    loadResidents()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

const openRedeemCodeDialog = (row) => {
  currentExchange.value = row
  inputRedeemCode.value = ''
  redeemCodeDialogVisible.value = true
}

const confirmRedeemCode = async () => {
  try {
    await axios.post(`/api/exchange/exchanges/${currentExchange.value.id}/redeem`, {
      verification_code: inputRedeemCode.value
    })
    ElMessage.success('核销成功')
    redeemCodeDialogVisible.value = false
    loadExchanges()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

const cancelExchange = async (row) => {
  try {
    await ElMessageBox.confirm('确定取消该兑换吗？积分将退回。', '提示')
    await axios.post(`/api/exchange/exchanges/${row.id}/cancel`)
    ElMessage.success('已取消')
    loadProducts()
    loadExchanges()
    loadResidents()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.error || '操作失败')
    }
  }
}

onMounted(() => {
  loadProducts()
  loadExchanges()
  loadResidents()
})
</script>
