<template>
  <div class="app-detail">
    <div class="page-header">
      <el-button @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>{{ app?.name || '应用详情' }}</h2>
    </div>
    
    <el-card v-if="app">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="应用名称">{{ app.name }}</el-descriptions-item>
        <el-descriptions-item label="应用编码">{{ app.code }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ app.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ app.owner?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="app.status === 'active' ? 'success' : 'info'" size="small">
            {{ app.status === 'active' ? '激活' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatTime(app.created_at) }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
    
    <el-card style="margin-top: 20px;">
      <template #header>
      <div class="card-header">
        <span>环境列表</span>
        <el-button type="primary" size="small" @click="showAddEnvDialog = true">
          <el-icon><Plus /></el-icon> 添加环境
        </el-button>
      </div>
      </template>
      <el-table :data="app?.environments || []">
        <el-table-column prop="name" label="环境名称" width="150" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="envTypeMap[row.type] || 'info'" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="config" label="配置" show-overflow-tooltip />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-dialog v-model="showAddEnvDialog" title="添加环境" width="500px">
      <el-form :model="envForm" label-width="100px">
        <el-form-item label="环境名称" required>
          <el-input v-model="envForm.name" />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="envForm.type" style="width: 100%">
            <el-option label="开发" value="dev" />
            <el-option label="测试" value="test" />
            <el-option label="预发" value="staging" />
            <el-option label="生产" value="prod" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddEnvDialog = false">取消</el-button>
        <el-button type="primary" @click="addEnv">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { applications } from '@/api'

const route = useRoute()
const app = ref(null)
const showAddEnvDialog = ref(false)

const envForm = reactive({
  name: '',
  type: 'dev'
})

const envTypeMap = {
  dev: 'info',
  test: 'warning',
  staging: 'primary',
  prod: 'success'
}

const formatTime = (t) => t ? new Date(t).toLocaleString() : '-'

const loadData = async () => {
  try {
    app.value = await applications.get(route.params.id)
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const addEnv = async () => {
  if (!envForm.name || !envForm.type) {
    ElMessage.error('请填写完整信息')
    return
  }
  
  try {
    await applications.addEnv(route.params.id, envForm)
    ElMessage.success('添加成功')
    showAddEnvDialog.value = false
    Object.assign(envForm, { name: '', type: 'dev' })
    loadData()
  } catch (e) {
    ElMessage.error(e.error || '添加失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  flex: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
