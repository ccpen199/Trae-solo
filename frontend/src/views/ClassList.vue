<template>
  <div class="page-container">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <h2>班级管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">创建班级</el-button>
    </div>

    <div v-if="loading" style="text-align: center; padding: 40px">
      <el-skeleton :rows="5" animated />
    </div>
    <div v-else-if="classes.length === 0" style="text-align: center; padding: 40px; color: #999">
      暂无班级，请先创建班级
    </div>
    <div v-else>
      <el-row :gutter="20">
        <el-col :span="8" v-for="cls in classes" :key="cls.id">
          <el-card 
            shadow="hover" 
            style="margin-bottom: 20px; cursor: pointer" 
            @click="$router.push(`/class/${cls.id}`)"
          >
            <template #header>
              <div style="display: flex; justify-content: space-between; align-items: center">
                <span style="font-weight: bold; font-size: 18px">{{ cls.name }}</span>
                <el-tag size="small">{{ cls.subject || '未设置' }}</el-tag>
              </div>
            </template>
            <div style="height: 100px; display: flex; align-items: center; justify-content: center">
              <div style="text-align: center">
                <div style="font-size: 36px; color: #409eff; font-weight: bold">{{ cls.member_count || 0 }}</div>
                <div style="color: #666; margin-top: 5px">成员数</div>
              </div>
            </div>
            <div style="color: #999; font-size: 13px">
              创建时间：{{ formatTime(cls.created_at) }}
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-dialog v-model="showCreateDialog" title="创建班级" width="500px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="班级名称">
          <el-input v-model="createForm.name" placeholder="请输入班级名称" />
        </el-form-item>
        <el-form-item label="学科">
          <el-input v-model="createForm.subject" placeholder="请输入学科" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createClass">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../utils/request'
import dayjs from 'dayjs'

const loading = ref(false)
const classes = ref([])
const showCreateDialog = ref(false)
const createForm = ref({
  name: '',
  subject: ''
})

const formatTime = (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'

const fetchClasses = async () => {
  loading.value = true
  try {
    const res = await api.get('/class/list')
    classes.value = res.data || []
  } finally {
    loading.value = false
  }
}

const createClass = async () => {
  if (!createForm.value.name) {
    ElMessage.error('请输入班级名称')
    return
  }
  try {
    await api.post('/class/create', createForm.value)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    createForm.value = { name: '', subject: '' }
    fetchClasses()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchClasses()
})
</script>