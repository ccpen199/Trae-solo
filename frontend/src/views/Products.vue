<template>
  <div>
    <h2 style="margin-bottom: 20px">商品管理</h2>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>商品列表</span>
          <el-button type="primary" @click="showDialog = true">新增商品</el-button>
        </div>
      </template>
      <el-table :data="products" border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="merchant_name" label="所属商户" />
        <el-table-column prop="category_name" label="品类" />
        <el-table-column prop="specification" label="规格" />
        <el-table-column prop="grade" label="等级" />
        <el-table-column prop="unit" label="单位" />
        <el-table-column prop="price" label="价格">
          <template #default="{ row }">
            <el-button type="primary" link @click="editPrice(row)">¥{{ row.price }}</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" @click="editProduct(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" :title="editingProduct ? '编辑商品' : '新增商品'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="所属商户">
          <el-select v-model="form.merchant_id" style="width: 100%">
            <el-option v-for="m in merchants" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="品类">
          <el-select v-model="form.category_id" style="width: 100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model="form.specification" />
        </el-form-item>
        <el-form-item label="等级">
          <el-input v-model="form.grade" />
        </el-form-item>
        <el-form-item label="计量单位">
          <el-input v-model="form.unit" />
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="form.stock" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="saveProduct">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPriceDialog" title="修改价格" width="400px">
      <el-form label-width="80px">
        <el-form-item label="当前价格">
          <span>¥{{ priceForm.current }}</span>
        </el-form-item>
        <el-form-item label="新价格">
          <el-input-number v-model="priceForm.new" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPriceDialog = false">取消</el-button>
        <el-button type="primary" @click="savePrice">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const products = ref([])
const merchants = ref([])
const categories = ref([])
const showDialog = ref(false)
const showPriceDialog = ref(false)
const editingProduct = ref(null)
const priceForm = ref({ id: null, current: 0, new: 0 })
const form = ref({ merchant_id: '', category_id: '', name: '', specification: '', grade: '', unit: '', price: 0, stock: 0 })

const loadProducts = async () => {
  const res = await axios.get('/api/products')
  products.value = res.data
}

const editProduct = (row) => {
  editingProduct.value = row
  form.value = { ...row }
  showDialog.value = true
}

const editPrice = (row) => {
  priceForm.value = { id: row.id, current: row.price, new: row.price }
  showPriceDialog.value = true
}

const savePrice = async () => {
  await axios.put(`/api/products/${priceForm.value.id}/price`, { price: priceForm.value.new })
  ElMessage.success('价格更新成功')
  showPriceDialog.value = false
  loadProducts()
}

const saveProduct = async () => {
  try {
    if (editingProduct.value) {
      await axios.put(`/api/products/${editingProduct.value.id}`, form.value)
    } else {
      await axios.post('/api/products', form.value)
    }
    ElMessage.success('保存成功')
    showDialog.value = false
    loadProducts()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

onMounted(async () => {
  loadProducts()
  merchants.value = (await axios.get('/api/merchants')).data
  categories.value = (await axios.get('/api/categories')).data
})
</script>
