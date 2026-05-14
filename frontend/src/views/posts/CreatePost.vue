<template>
  <div class="create-post-page">
    <div class="container">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>发布帖子</span>
          </div>
        </template>
        
        <div v-if="loading" class="page-loading">
          <el-skeleton :rows="4" animated />
        </div>
        
        <div v-else-if="error" class="page-error">
          <el-empty description="加载失败">
            <el-button type="primary" @click="loadBar">重试</el-button>
          </el-empty>
        </div>
        
        <template v-else>
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="80px"
          >
            <el-form-item label="选择分栏" prop="column_id">
              <el-select v-model="form.column_id" placeholder="请选择分栏" style="width: 300px;">
                <el-option
                  v-for="col in bar.columns || []"
                  :key="col.id"
                  :label="col.name"
                  :value="col.id"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="标题" prop="title">
              <el-input
                v-model="form.title"
                placeholder="请输入帖子标题"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="内容" prop="content">
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="12"
                placeholder="请输入帖子内容"
              />
            </el-form-item>
            
            <el-form-item label="内容类型">
              <el-select v-model="form.content_type" style="width: 200px;">
                <el-option label="论坛" value="forum" />
                <el-option label="博客" value="blog" />
                <el-option label="资讯" value="news" />
                <el-option label="问答" value="qa" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="来源">
              <el-input v-model="form.source" placeholder="内容来源（可选）" style="width: 300px;" />
            </el-form-item>
            
            <el-form-item label="来源链接">
              <el-input v-model="form.source_url" placeholder="原文链接（可选）" style="width: 100%;" />
            </el-form-item>
            
            <el-form-item>
              <el-button
                type="primary"
                :loading="submitting"
                :disabled="submitting"
                @click="handleSubmit"
              >
                提交发布
              </el-button>
              <el-button @click="goBack">取消</el-button>
            </el-form-item>
          </el-form>
          
          <el-alert
            title="发布须知"
            type="info"
            :closable="false"
          >
            <ul style="margin: 10px 0 0 20px;">
              <li>帖子发布后需要运营审核，审核通过后才能展示</li>
              <li>请确保内容不包含广告、色情、反动等违规词汇</li>
              <li>帖子审核通过后会自动统计到产品吧数据中</li>
            </ul>
          </el-alert>
        </template>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()

const formRef = ref()
const loading = ref(true)
const error = ref(false)
const submitting = ref(false)
const bar = ref(null)

const form = reactive({
  column_id: null,
  title: '',
  content: '',
  content_type: 'forum',
  source: '',
  source_url: ''
})

const rules = {
  column_id: [{ required: true, message: '请选择分栏', trigger: 'change' }],
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { min: 10, message: '内容至少 10 个字符', trigger: 'blur' }
  ]
}

async function loadBar() {
  loading.value = true
  error.value = false
  try {
    const res = await api.get(`/product-bars/${route.params.barId}`)
    if (res.success) {
      bar.value = res.data
      if (res.data.columns && res.data.columns.length > 0) {
        form.column_id = res.data.columns[0].id
      }
    }
  } catch (e) {
    console.error('加载产品吧失败:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const res = await api.post('/posts', {
      bar_id: route.params.barId,
      column_id: form.column_id,
      title: form.title,
      content: form.content,
      content_type: form.content_type,
      source: form.source || undefined,
      source_url: form.source_url || undefined
    })
    
    if (res.success) {
      ElMessage.success('帖子发布成功，等待审核')
      router.push(`/bars/${route.params.barId}`)
    }
  } catch (e) {
    console.error('发布失败:', e)
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  loadBar()
})
</script>

<style scoped>
.create-post-page {
  padding: 30px 0;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}
</style>
