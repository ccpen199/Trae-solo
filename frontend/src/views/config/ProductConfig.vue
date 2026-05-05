<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">产品管理</span>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新增产品
      </el-button>
    </div>

    <el-card>
      <el-table :data="products" stripe style="width: 100%">
        <el-table-column prop="productId" label="产品ID" width="180" />
        <el-table-column prop="productName" label="产品名称" width="200" />
        <el-table-column prop="isTargetProduct" label="目标产品" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.isTargetProduct ? 'primary' : 'info'">
              {{ scope.row.isTargetProduct ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="scope">
            {{ new Date(scope.row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="showCreateDialog"
      title="新增产品"
      width="500px"
    >
      <el-form :model="productForm" label-width="100px">
        <el-form-item label="产品ID">
          <el-input v-model="productForm.productId" placeholder="请输入产品ID" />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="productForm.productName" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="目标产品">
          <el-switch
            v-model="productForm.isTargetProduct"
            active-text="是"
            inactive-text="否"
          />
          <span style="margin-left: 10px; color: #909399; font-size: 12px;">
            撞库时判断用户是否在目标产品动用过
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitProduct">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/utils/api'

const products = ref([])
const showCreateDialog = ref(false)

const productForm = reactive({
  productId: '',
  productName: '',
  isTargetProduct: false
})

const loadProducts = async () => {
  try {
    const res = await adminApi.getProducts()
    products.value = res.data || []
  } catch (error) {
    console.error('Load products failed:', error)
  }
}

const submitProduct = async () => {
  if (!productForm.productId || !productForm.productName) {
    ElMessage.warning('请填写完整信息')
    return
  }

  try {
    await adminApi.createProduct(productForm)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    resetForm()
    loadProducts()
  } catch (error) {
    ElMessage.error('创建失败')
  }
}

const resetForm = () => {
  productForm.productId = ''
  productForm.productName = ''
  productForm.isTargetProduct = false
}

onMounted(() => {
  loadProducts()
})
</script>
