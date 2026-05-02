<template>
  <el-card>
    <template #header>
      <span>{{ isEdit ? '编辑文档' : '创建文档' }}</span>
    </template>

    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" style="max-width: 800px">
      <el-form-item label="文档标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入文档标题" />
      </el-form-item>

      <el-form-item label="摘要">
        <el-input v-model="form.summary" type="textarea" :rows="2" placeholder="请输入文档摘要" />
      </el-form-item>

      <el-form-item label="目录" prop="directory_id">
        <el-select v-model="form.directory_id" placeholder="请选择目录" style="width: 100%">
          <el-option v-for="dir in directories" :key="dir.id" :label="dir.name" :value="dir.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="责任人" prop="responsible_id">
        <el-select v-model="form.responsible_id" placeholder="请选择责任人" style="width: 100%" filterable>
          <el-option v-for="u in users" :key="u.id" :label="u.name" :value="u.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="期望完成时间">
        <el-date-picker
          v-model="form.expected_completion_date"
          type="date"
          placeholder="选择日期"
          style="width: 100%"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="标签">
        <el-select v-model="form.tag_ids" multiple placeholder="请选择标签" style="width: 100%">
          <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id">
            <span style="display: flex; align-items: center; gap: 8px">
              <span :style="{ background: tag.color, width: 12, height: 12, borderRadius: '50%', display: 'inline-block' }"></span>
              {{ tag.name }}
            </span>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="文档内容">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="15"
          placeholder="请输入文档内容"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
        <el-button @click="$router.back()">取消</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { documentApi, directoryApi, tagApi, userApi } from '@/api'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const loading = ref(false)
const directories = ref([])
const tags = ref([])
const users = ref([])

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  title: '',
  summary: '',
  content: '',
  directory_id: undefined,
  responsible_id: undefined,
  expected_completion_date: '',
  tag_ids: []
})

const rules = {
  title: [{ required: true, message: '请输入文档标题', trigger: 'blur' }]
}

const loadDirectories = async () => {
  try {
    const res = await directoryApi.list()
    directories.value = res.data.directories
  } catch (e) {
    console.error(e)
  }
}

const loadTags = async () => {
  try {
    const res = await tagApi.list()
    tags.value = res.data.tags
  } catch (e) {
    console.error(e)
  }
}

const loadUsers = async () => {
  try {
    const res = await userApi.list()
    users.value = res.data.users
  } catch (e) {
    console.error(e)
  }
}

const loadDocument = async () => {
  try {
    const res = await documentApi.get(route.params.id)
    const doc = res.data.document
    form.title = doc.title
    form.summary = doc.summary || ''
    form.content = doc.content || ''
    form.directory_id = doc.directory_id
    form.responsible_id = doc.responsible_id
    form.expected_completion_date = doc.expected_completion_date
    
    const docTags = res.data.tags || []
    form.tag_ids = docTags.map(t => t.id)
  } catch (e) {
    console.error(e)
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    if (isEdit.value) {
      await documentApi.update(route.params.id, form)
      ElMessage.success('保存成功')
    } else {
      const res = await documentApi.create(form)
      ElMessage.success('创建成功')
      router.push(`/documents/${res.data.documentId}`)
      return
    }
    router.back()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDirectories()
  loadTags()
  loadUsers()
  if (isEdit.value) {
    loadDocument()
  }
})
</script>
