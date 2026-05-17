<template>
  <div class="publish-page">
    <div class="publish-card card">
      <h2 class="page-title">发布笔记</h2>

      <el-upload
        v-model:file-list="fileList"
        :action="uploadUrl"
        :headers="uploadHeaders"
        list-type="picture-card"
        :limit="9"
        :on-success="handleUploadSuccess"
        :on-remove="handleRemove"
      >
        <el-icon><Plus /></el-icon>
      </el-upload>

      <el-form ref="formRef" :model="form" label-width="80px" class="publish-form">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="给你的笔记起个吸引人的标题" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="内容">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="8"
            placeholder="分享你的心得、体验或攻略..."
            maxlength="5000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="话题">
          <el-select
            v-model="form.topics"
            multiple
            filterable
            allow-create
            placeholder="添加话题标签"
            style="width: 100%"
          >
            <el-option v-for="topic in hotTopics" :key="topic" :label="`#${topic}`" :value="topic" />
          </el-select>
        </el-form-item>

        <el-form-item label="地点">
          <el-input v-model="form.location" placeholder="添加地点（可选）" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" @click="publish" :loading="loading">
            发布笔记
          </el-button>
          <el-button size="large" @click="saveDraft">保存草稿</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const fileList = ref([])
const hotTopics = ref(['穿搭分享', '美食探店', '旅行日记', '护肤心得', '健身打卡', '家居好物'])

const uploadUrl = '/api/upload/images'
const uploadHeaders = {
  Authorization: `Bearer ${userStore.token}`
}

const form = ref({
  title: '',
  content: '',
  topics: [],
  location: '',
  images: []
})

const handleUploadSuccess = (response, file) => {
  if (response.success && response.data) {
    form.value.images.push(response.data[0].url)
  }
}

const handleRemove = (file) => {
  const index = form.value.images.indexOf(file.response?.data?.[0]?.url)
  if (index > -1) {
    form.value.images.splice(index, 1)
  }
}

const publish = async () => {
  if (!form.value.title.trim()) {
    ElMessage.warning('请输入标题')
    return
  }
  if (!form.value.content.trim() && form.value.images.length === 0) {
    ElMessage.warning('请输入内容或上传图片')
    return
  }

  loading.value = true
  try {
    await request.post('/notes', form.value)
    ElMessage.success('发布成功')
    router.push('/discover')
  } catch (error) {
    console.error('发布失败:', error)
  } finally {
    loading.value = false
  }
}

const saveDraft = () => {
  localStorage.setItem('noteDraft', JSON.stringify(form.value))
  ElMessage.success('草稿已保存')
}

onMounted(() => {
  const draft = localStorage.getItem('noteDraft')
  if (draft) {
    try {
      Object.assign(form.value, JSON.parse(draft))
    } catch (e) {}
  }
})
</script>

<style lang="scss" scoped>
.publish-page {
  max-width: 800px;
  margin: 0 auto;

  .publish-card {
    padding: 30px;

    .page-title {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 24px 0;
    }

    .publish-form {
      margin-top: 24px;
    }
  }

  :deep(.el-upload--picture-card) {
    width: 120px;
    height: 120px;
    line-height: 120px;
  }
}
</style>
