<template>
  <div class="article-create-page">
    <el-header class="header">
      <div class="header-content">
        <div class="logo" @click="$router.push('/home')">
          <el-icon :size="28"><ChatDotRound /></el-icon>
          <span>BBS论坛</span>
        </div>
        <div class="header-right">
          <el-button @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>
            取消
          </el-button>
        </div>
      </div>
    </el-header>
    
    <el-main class="main">
      <el-card class="form-card">
        <template #header>
          <div class="form-title">
            <el-icon :size="20"><Edit /></el-icon>
            <span>{{ isEdit ? '编辑帖子' : '发布新帖' }}</span>
          </div>
        </template>
        
        <el-form 
          ref="formRef" 
          :model="form" 
          :rules="rules" 
          label-width="100px"
          :disabled="loading"
        >
          <el-form-item label="标题" prop="title">
            <el-input 
              v-model="form.title" 
              placeholder="请输入帖子标题（最多200字）"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="分类" prop="categoryId">
            <el-select 
              v-model="form.categoryId" 
              placeholder="请选择大类" 
              style="width: 200px"
              @change="handleCategoryChange"
            >
              <el-option 
                v-for="category in categories" 
                :key="category.id" 
                :label="category.categoryName" 
                :value="category.id"
              />
            </el-select>
            
            <el-select 
              v-if="currentCategory?.subCategories?.length"
              v-model="form.subCategoryId" 
              placeholder="请选择小类（可选）" 
              style="width: 200px; margin-left: 10px"
              clearable
            >
              <el-option 
                v-for="sub in currentCategory.subCategories" 
                :key="sub.id" 
                :label="sub.subCategoryName" 
                :value="sub.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="关键词">
            <el-input 
              v-model="form.keywords" 
              placeholder="请输入关键词，多个用逗号分隔"
              style="width: 400px"
            />
          </el-form-item>
          
          <el-form-item label="内容" prop="content">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="15"
              placeholder="请输入帖子内容"
              maxlength="10000"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item v-if="userStore.isAdmin">
            <el-checkbox v-model="form.isTop">置顶</el-checkbox>
            <el-checkbox v-model="form.isLocked" style="margin-left: 20px;">锁定</el-checkbox>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="handleSubmit">
              <el-icon><Check /></el-icon>
              {{ isEdit ? '保存修改' : '发布帖子' }}
            </el-button>
            <el-button @click="$router.back()">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </el-main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createArticle, updateArticle, getPublicArticle } from '@/api/article'
import { getPublicCategories } from '@/api/category'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)
const categories = ref([])

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  title: '',
  content: '',
  keywords: '',
  categoryId: null,
  subCategoryId: null,
  isTop: false,
  isLocked: false
})

const currentCategory = computed(() => {
  if (!form.categoryId) return null
  return categories.value.find(c => c.id === form.categoryId)
})

const rules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 200, message: '标题长度在2-200个字符之间', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { min: 10, message: '内容至少10个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ]
}

const loadCategories = async () => {
  try {
    const res = await getPublicCategories()
    categories.value = res.data
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const loadArticle = async () => {
  const id = route.params.id
  if (!id) return
  
  loading.value = true
  try {
    const res = await getPublicArticle(id)
    const article = res.data
    
    form.title = article.title
    form.content = article.content
    form.keywords = article.keywords || ''
    form.categoryId = article.categoryId
    form.subCategoryId = article.subCategoryId
    form.isTop = article.isTop
    form.isLocked = article.isLocked
  } catch (error) {
    console.error('加载文章失败:', error)
  } finally {
    loading.value = false
  }
}

const handleCategoryChange = () => {
  form.subCategoryId = null
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  loading.value = true
  try {
    if (isEdit.value) {
      await updateArticle(route.params.id, form)
      ElMessage.success('修改成功')
    } else {
      const res = await createArticle(form)
      ElMessage.success('发布成功')
      router.push(`/articles/${res.data.id}`)
      return
    }
    router.back()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCategories()
  if (isEdit.value) {
    loadArticle()
  }
})
</script>

<style scoped>
.article-create-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  height: 60px;
}

.header-content {
  max-width: 1000px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
}

.main {
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
  padding: 20px;
  flex: 1;
}

.form-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.form-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  font-size: 18px;
  color: #303133;
}
</style>
