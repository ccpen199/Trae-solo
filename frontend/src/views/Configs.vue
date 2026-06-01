<template>
  <div class="configs">
    <div class="page-header">
      <h2>Webhook 配置</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon> 新建配置
      </el-button>
    </div>
    
    <el-card>
      <el-form :inline="true" class="filter-form">
        <el-form-item label="应用">
          <el-select v-model="filters.app_id" placeholder="全部" clearable>
            <el-option v-for="app in apps" :key="app.id" :label="app.name" :value="app.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="环境">
          <el-select v-model="filters.env_id" placeholder="全部" clearable>
            <el-option v-for="env in environments" :key="env.id" :label="env.name" :value="env.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable>
            <el-option label="激活" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="name" label="配置名称">
          <template #default="{ row }">
            <el-button type="primary" link @click="$router.push(`/configs/${row.id}`)">
              {{ row.name }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="app_name" label="应用" width="120" />
        <el-table-column prop="env_name" label="环境" width="100">
          <template #default="{ row }">
            <el-tag :type="envTypeMap[row.env_type] || 'info'" size="small">
              {{ row.env_name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="url" label="URL" show-overflow-tooltip min-width="200" />
        <el-table-column prop="method" label="方法" width="80">
          <template #default="{ row }">
            <el-tag size="small" type="primary">{{ row.method }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="80" align="center">
          v{{ row.version }}
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '激活' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-dialog v-model:visible="showCreateDialog" title="新建Webhook配置" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="应用" required>
          <el-select v-model="form.app_id" placeholder="选择应用" @change="loadEnvs(form.app_id)" style="width: 100%">
            <el-option v-for="app in apps" :key="app.id" :label="app.name" :value="app.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="环境" required>
          <el-select v-model="form.env_id" placeholder="选择环境" style="width: 100%">
            <el-option v-for="env in currentEnvs" :key="env.id" :label="env.name" :value="env.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="配置名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="URL" required>
          <el-input v-model="form.url" placeholder="https://example.com/webhook" />
        </el-form-item>
        <el-form-item label="方法">
          <el-select v-model="form.method" style="width: 100%">
            <el-option label="POST" value="POST" />
            <el-option label="GET" value="GET" />
            <el-option label="PUT" value="PUT" />
          </el-select>
        </el-form-item>
        <el-form-item label="密钥">
          <el-input v-model="form.secret_key" type="password" placeholder="签名密钥（可选）" />
        </el-form-item>
        <el-form-item label="超时时间">
          <el-input-number v-model="form.timeout" :min="1000" :max="300000" :step="1000" />
          <span style="margin-left: 8px;">毫秒</span>
        </el-form-item>
        <el-form-item label="重试次数">
          <el-input-number v-model="form.retry_count" :min="0" :max="10" />
          <span style="margin-left: 8px;">次</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeCreateDialog">取消</el-button>
        <el-button type="primary" @click="createConfig">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { applications, configs } from '@/api'

const list = ref([])
const apps = ref([])
const environments = ref([])
const loading = ref(false)
const showCreateDialog = ref(false)

const filters = reactive({
  app_id: '',
  env_id: '',
  status: ''
})

const form = reactive({
  app_id: '',
  env_id: '',
  name: '',
  url: '',
  method: 'POST',
  secret_key: '',
  timeout: 30000,
  retry_count: 3
})

const envTypeMap = {
  dev: 'info',
  test: 'warning',
  prod: 'success'
}

const currentEnvs = computed(() => {
  return environments.value.filter(e => e.app_id === form.app_id)
})

const formatTime = (t) => t ? new Date(t).toLocaleString() : '-'

const loadData = async () => {
  loading.value = true
  try {
    list.value = await configs.list(filters)
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const loadApps = async () => {
  try {
    apps.value = await applications.list()
  } catch (e) {
    console.error('Load apps error:', e)
    ElMessage.error('加载应用列表失败')
  }
}

const openCreateDialog = () => {
  showCreateDialog.value = true
}

const closeCreateDialog = () => {
  showCreateDialog.value = false
}

const loadEnvs = async (appId) => {
  if (!appId) return
  const app = apps.value.find(a => a.id === appId)
  if (app?.environments) {
    environments.value = app.environments
  }
}

const resetFilters = () => {
  filters.app_id = ''
  filters.env_id = ''
  filters.status = ''
  loadData()
}

const createConfig = async () => {
  if (!form.app_id || !form.env_id || !form.name || !form.url) {
    ElMessage.error('请填写必填项')
    return
  }
  
  try {
    await configs.create(form)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    Object.assign(form, { app_id: '', env_id: '', name: '', url: '', method: 'POST', secret_key: '', timeout: 30000, retry_count: 3 })
    loadData()
  } catch (e) {
    ElMessage.error(e.error || '创建失败')
  }
}

onMounted(() => {
  loadData()
  loadApps()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.filter-form {
  margin-bottom: 20px;
}
</style>
