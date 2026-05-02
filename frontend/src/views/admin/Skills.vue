<template>
  <div class="admin-skills">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>技能管理</span>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            添加技能
          </el-button>
        </div>
      </template>

      <el-table :data="skills" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="技能名称" width="150" />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="scope">
            <el-tag>{{ scope.row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column label="创建时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="添加技能" width="400px">
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="80px"
      >
        <el-form-item label="技能名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入技能名称" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="createForm.category" placeholder="请选择分类" style="width: 100%">
            <el-option label="医疗" value="医疗" />
            <el-option label="心理" value="心理" />
            <el-option label="教育" value="教育" />
            <el-option label="环保" value="环保" />
            <el-option label="综合" value="综合" />
            <el-option label="技术" value="技术" />
            <el-option label="组织" value="组织" />
            <el-option label="语言" value="语言" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入技能描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { apiClient } from '@/api'
import type { SkillResponse } from '@/types'
import dayjs from 'dayjs'
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const submitting = ref(false)
const showCreateDialog = ref(false)
const createFormRef = ref<FormInstance>()

const skills = ref<SkillResponse[]>([])

const createForm = reactive({
  name: '',
  category: '',
  description: '',
})

const createRules: FormRules = {
  name: [{ required: true, message: '请输入技能名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
}

const formatDateTime = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss')
}

const fetchSkills = async () => {
  loading.value = true
  try {
    const response = await apiClient.get<SkillResponse[]>('/admin/skills')
    skills.value = response.data
  } catch (error) {
    console.error('Failed to fetch skills:', error)
  } finally {
    loading.value = false
  }
}

const handleCreate = async () => {
  if (!createFormRef.value) return

  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await apiClient.post('/admin/skills', createForm)
        ElMessage.success('技能创建成功')
        showCreateDialog.value = false
        fetchSkills()
        createForm.name = ''
        createForm.category = ''
        createForm.description = ''
      } catch (error) {
        console.error('Failed to create skill:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  fetchSkills()
})
</script>

<style scoped>
.admin-skills {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
