<template>
  <div class="order-edit-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-button type="primary" link @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <span>新建流水线单</span>
        </div>
      </template>

      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="rules" 
        label-width="120px" 
        style="max-width: 800px"
      >
        <el-form-item label="选择流水线" prop="pipelineId">
          <el-select 
            v-model="form.pipelineId" 
            placeholder="请选择流水线" 
            style="width: 100%"
            @change="handlePipelineChange"
          >
            <el-option
              v-for="item in pipelines"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入单标题" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="描述">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入描述信息" 
          />
        </el-form-item>

        <el-form-item label="提交Hash">
          <el-input v-model="form.commitHash" placeholder="Git提交Hash（可选）" maxlength="64" />
        </el-form-item>

        <el-form-item label="提交信息">
          <el-input v-model="form.commitMessage" placeholder="Git提交信息（可选）" maxlength="200" />
        </el-form-item>

        <el-form-item label="期望完成时间">
          <el-date-picker
            v-model="form.expectedCompletionAt"
            type="datetime"
            placeholder="选择期望完成时间"
            style="width: 100%"
            :disabled-date="disabledDate"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            提交
          </el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPipelines, createOrder } from '@/utils/api'
import { ArrowLeft } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const pipelines = ref([])

const form = reactive({
  pipelineId: '',
  title: '',
  description: '',
  commitHash: '',
  commitMessage: '',
  expectedCompletionAt: null
})

const rules = {
  pipelineId: [{ required: true, message: '请选择流水线', trigger: 'change' }],
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ]
}

const disabledDate = (time) => {
  return time.getTime() < Date.now() - 8.64e7
}

const goBack = () => {
  router.back()
}

const handlePipelineChange = () => {
  // 可以在这里根据流水线设置默认值
}

const fetchPipelines = async () => {
  try {
    const res = await getPipelines({ status: 'active' })
    if (res.success) {
      pipelines.value = res.data
      if (res.data.length > 0) {
        form.pipelineId = res.data[0].id
      }
    }
  } catch (e) {
    console.error('获取流水线失败', e)
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const data = {
      pipelineId: form.pipelineId,
      title: form.title,
      description: form.description,
      commitHash: form.commitHash || undefined,
      commitMessage: form.commitMessage || undefined,
      expectedCompletionAt: form.expectedCompletionAt 
        ? form.expectedCompletionAt.toISOString() 
        : undefined
    }

    const res = await createOrder(data)
    if (res.success) {
      ElMessage.success('创建成功')
      router.push(`/orders/${res.data.id}`)
    }
  } catch (e) {
    console.error('创建失败', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPipelines()
})
</script>

<style scoped>
.order-edit-page {
  min-height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
}
</style>
