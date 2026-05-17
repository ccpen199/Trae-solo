<template>
  <div class="page-container">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <h2>作业管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">布置作业</el-button>
    </div>

    <el-tabs v-model="activeStatus" @tab-change="fetchHomeworks">
      <el-tab-pane label="待发布" name="draft" />
      <el-tab-pane label="进行中" name="published" />
      <el-tab-pane label="已完成" name="finished" />
    </el-tabs>

    <div v-if="loading" style="text-align: center; padding: 40px">
      <el-skeleton :rows="5" animated />
    </div>
    <div v-else-if="homeworks.length === 0" style="text-align: center; padding: 40px; color: #999">
      暂无作业
    </div>
    <div v-else>
      <el-card v-for="hw in homeworks" :key="hw.id" style="margin-bottom: 15px">
        <div style="display: flex; justify-content: space-between; align-items: flex-start">
          <div>
            <h3 style="margin-bottom: 10px">{{ hw.title }}</h3>
            <el-tag size="small" style="margin-right: 8px">{{ hw.subject }}</el-tag>
            <el-tag size="small" type="info" style="margin-right: 8px">{{ hw.class_name }}</el-tag>
            <div style="margin-top: 10px; color: #666; font-size: 14px">
              <span v-if="hw.knowledge_points">知识点：{{ hw.knowledge_points }}</span>
            </div>
            <div style="margin-top: 8px; color: #999; font-size: 13px">
              <span>提交：{{ hw.submitted_count || 0 }}/{{ hw.total_students || 0 }}</span>
              <span style="margin-left: 20px">布置时间：{{ formatTime(hw.created_at) }}</span>
              <span v-if="hw.deadline" style="margin-left: 20px">截止时间：{{ formatTime(hw.deadline) }}</span>
            </div>
          </div>
          <div>
            <el-button size="small" @click="$router.push(`/homework/${hw.id}`)">查看详情</el-button>
            <el-button 
              v-if="hw.status === 'draft'" 
              size="small" 
              type="primary" 
              @click="publishHomework(hw.id)"
            >
              发布
            </el-button>
            <el-button 
              v-if="hw.submitted_count > 0" 
              size="small" 
              type="success" 
              @click="$router.push(`/homework/${hw.id}/overview`)"
            >
              学情分析
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <el-dialog v-model="showCreateDialog" title="布置作业" width="600px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="作业标题">
          <el-input v-model="createForm.title" />
        </el-form-item>
        <el-form-item label="选择班级">
          <el-select v-model="createForm.classId" style="width: 100%">
            <el-option v-for="cls in classes" :key="cls.id" :label="cls.name" :value="cls.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="学科">
          <el-input v-model="createForm.subject" />
        </el-form-item>
        <el-form-item label="截止时间">
          <el-date-picker v-model="createForm.deadline" type="datetime" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createHomework">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../utils/request'

const activeStatus = ref('draft')
const loading = ref(false)
const homeworks = ref([])
const classes = ref([])
const showCreateDialog = ref(false)
const createForm = ref({
  title: '',
  classId: null,
  subject: '',
  deadline: null
})

const formatTime = (time) => {
  if (!time) return '-'
  const d = new Date(time)
  return d.toLocaleString('zh-CN', { 
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

const fetchHomeworks = async () => {
  loading.value = true
  try {
    const params = {}
    if (activeStatus.value !== 'finished') {
      params.status = activeStatus.value
    }
    const res = await api.get('/homework/list', { params })
    homeworks.value = res.data || []
  } catch (e) {
    console.error('获取作业失败:', e)
  } finally {
    loading.value = false
  }
}

const fetchClasses = async () => {
  try {
    const res = await api.get('/class/list')
    classes.value = res.data || []
    if (classes.value.length > 0) {
      createForm.value.classId = classes.value[0].id
    }
  } catch (e) {
    console.error('获取班级失败:', e)
  }
}

const publishHomework = async (id) => {
  try {
    await api.post(`/homework/publish/${id}`)
    ElMessage.success('发布成功')
    fetchHomeworks()
  } catch (e) {
    console.error(e)
  }
}

const createHomework = async () => {
  if (!createForm.value.title || !createForm.value.classId) {
    ElMessage.error('标题和班级必填')
    return
  }
  try {
    const data = { ...createForm.value }
    if (data.deadline) {
      data.deadline = data.deadline.toISOString ? data.deadline.toISOString() : data.deadline
    }
    await api.post('/homework/create', data)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    createForm.value = { title: '', classId: null, subject: '', deadline: null }
    fetchHomeworks()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchHomeworks()
  fetchClasses()
})
</script>