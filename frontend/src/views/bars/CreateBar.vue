<template>
  <div class="create-bar-page">
    <div class="container">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>创建产品吧</span>
          </div>
        </template>
        
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          style="max-width: 600px;"
        >
          <el-form-item label="吧名称" prop="name">
            <el-input
              v-model="form.name"
              placeholder="请输入产品吧名称"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="吧描述" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="请输入产品吧描述"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="关联商品">
            <el-select
              v-model="form.product_id"
              placeholder="选择关联的商品（可选）"
              filterable
              style="width: 100%;"
              @filter="filterProducts"
            >
              <el-option
                v-for="product in products"
                :key="product.id"
                :label="product.name"
                :value="product.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="封面图">
            <el-input
              v-model="form.cover_image"
              placeholder="请输入封面图片URL（可选）"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              :loading="submitting"
              :disabled="submitting"
              @click="handleSubmit"
            >
              提交创建
            </el-button>
            <el-button @click="goBack">取消</el-button>
          </el-form-item>
        </el-form>
        
        <el-alert
          title="创建说明"
          type="info"
          :closable="false"
          style="margin-top: 20px;"
        >
          <ul style="margin: 10px 0 0 20px;">
            <li>产品吧创建后需要运营审核，审核通过后才能正常使用</li>
            <li>创建时会自动生成三个默认分栏：选购指南、使用经验、问题交流</li>
            <li>作为创建者，你将成为该吧的吧主</li>
          </ul>
        </el-alert>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const router = useRouter()
const formRef = ref()
const submitting = ref(false)
const products = ref([])

const form = reactive({
  name: '',
  description: '',
  product_id: null,
  cover_image: ''
})

const rules = {
  name: [
    { required: true, message: '请输入产品吧名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过 200 个字符', trigger: 'blur' }
  ]
}

async function loadProducts(keyword = '') {
  try {
    const res = await api.get('/products', {
      params: { keyword: keyword || undefined, pageSize: 50 }
    })
    if (res.success) {
      products.value = res.data.list || []
    }
  } catch (e) {
    console.error('加载商品失败:', e)
  }
}

function filterProducts(val) {
  if (val) {
    loadProducts(val)
  } else {
    loadProducts()
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const res = await api.post('/product-bars', {
      name: form.name,
      description: form.description || undefined,
      product_id: form.product_id || undefined,
      cover_image: form.cover_image || undefined
    })
    
    if (res.success) {
      ElMessage.success('产品吧创建成功，等待审核')
      router.push('/my-bars')
    }
  } catch (e) {
    console.error('创建失败:', e)
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
.create-bar-page {
  padding: 30px 0;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}
</style>
