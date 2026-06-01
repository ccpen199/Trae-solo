<template>
  <div v-loading="loading">
    <el-page-header @back="$router.back()" :content="app?.name || '应用详情'" style="margin-bottom: 20px" />
    
    <el-card v-if="app">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-weight: bold">基本信息</span>
          <el-button type="primary" size="small" @click="activeTab = 'env'; openEnvDialog()">
            <el-icon><Plus /></el-icon>添加环境
          </el-button>
        </div>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="应用ID">{{ app.app_id }}</el-descriptions-item>
        <el-descriptions-item label="应用名称">{{ app.name }}</el-descriptions-item>
        <el-descriptions-item label="应用类型">{{ getTypeText(app.type) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(app.status)">{{ getStatusText(app.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="负责人">{{ app.owner_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ app.creator_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="3">{{ app.description || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card style="margin-top: 20px">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="环境配置" name="env">
          <el-table :data="app?.environments || []" size="small">
            <el-table-column prop="name" label="环境名称" width="120" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="base_url" label="基础地址" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">{{ row.status === 'active' ? '启用' : '停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180" />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="openSecretDialog(row)">添加密钥</el-button>
                <el-button type="success" size="small" link>编辑</el-button>
                <el-button type="danger" size="small" link>删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!app?.environments?.length" description="暂无环境配置" />
        </el-tab-pane>

        <el-tab-pane label="密钥管理" name="secret">
          <el-table :data="app?.secrets || []" size="small">
            <el-table-column prop="env_name" label="环境" width="100" />
            <el-table-column prop="secret_type" label="类型" width="120" />
            <el-table-column prop="secret_key" label="密钥名称" width="150" />
            <el-table-column prop="secret_value" label="密钥值" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">{{ row.status === 'active' ? '活跃' : '停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="expires_at" label="过期时间" width="180" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="warning" size="small" link>轮换</el-button>
                <el-button type="danger" size="small" link>删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!app?.secrets?.length" description="暂无密钥" />
        </el-tab-pane>

        <el-tab-pane label="版本历史" name="version">
          <el-empty description="暂无版本记录" />
        </el-tab-pane>

        <el-tab-pane label="操作时间线" name="timeline">
          <el-timeline>
            <el-timeline-item
              v-for="item in timeline"
              :key="item.id"
              :timestamp="item.time"
              placement="top"
            >
              <template #dot>
                <el-icon :size="15"><DocumentChecked /></el-icon>
              </template>
              <h4>{{ item.description }}</h4>
              <p style="color: #909399; font-size: 12px">操作人: {{ item.user }}</p>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="timeline.length === 0" description="暂无操作记录" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="envDialogVisible" title="添加环境" width="500px">
      <el-form :model="envForm" label-width="100px">
        <el-form-item label="环境名称">
          <el-input v-model="envForm.name" placeholder="如: development, production" />
        </el-form-item>
        <el-form-item label="环境类型">
          <el-select v-model="envForm.type" style="width: 100%">
            <el-option label="开发环境" value="development" />
            <el-option label="测试环境" value="testing" />
            <el-option label="预发布环境" value="staging" />
            <el-option label="生产环境" value="production" />
          </el-select>
        </el-form-item>
        <el-form-item label="基础地址">
          <el-input v-model="envForm.base_url" placeholder="https://api.example.com" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="envDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createEnv">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="secretDialogVisible" title="添加密钥" width="500px">
      <el-form :model="secretForm" label-width="100px">
        <el-form-item label="环境">
          <el-select v-model="secretForm.env_id" style="width: 100%">
            <el-option v-for="env in app?.environments" :key="env.id" :label="env.name" :value="env.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="密钥类型">
          <el-select v-model="secretForm.secret_type" style="width: 100%">
            <el-option label="客户端密钥" value="client_secret" />
            <el-option label="API密钥" value="api_key" />
            <el-option label="证书" value="certificate" />
            <el-option label="私钥" value="private_key" />
          </el-select>
        </el-form-item>
        <el-form-item label="密钥名称">
          <el-input v-model="secretForm.secret_key" placeholder="如: client_id, api_key" />
        </el-form-item>
        <el-form-item label="过期时间">
          <el-date-picker v-model="secretForm.expires_at" type="datetime" placeholder="选择过期时间" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="secretDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createSecret">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { appApi, envApi, secretApi, auditApi } from '../api'

const route = useRoute()
const loading = ref(false)
const app = ref(null)
const activeTab = ref('env')
const timeline = ref([])
const envDialogVisible = ref(false)
const secretDialogVisible = ref(false)
const currentEnv = ref(null)

const envForm = reactive({
  name: '',
  type: 'development',
  base_url: ''
})

const secretForm = reactive({
  env_id: null,
  secret_type: 'client_secret',
  secret_key: '',
  expires_at: null
})

async function loadApp() {
  loading.value = true
  try {
    app.value = await appApi.get(route.params.id)
    loadTimeline()
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function loadTimeline() {
  try {
    const res = await auditApi.timeline({ resource_type: 'application', resource_id: route.params.id })
    timeline.value = res.data
  } catch (e) {
    console.error(e)
  }
}

function openEnvDialog() {
  Object.assign(envForm, { name: '', type: 'development', base_url: '' })
  envDialogVisible.value = true
}

async function createEnv() {
  try {
    await envApi.create({ ...envForm, app_id: app.value.id })
    ElMessage.success('创建成功')
    envDialogVisible.value = false
    loadApp()
  } catch (e) {
    ElMessage.error('创建失败')
  }
}

function openSecretDialog(env) {
  currentEnv.value = env
  Object.assign(secretForm, {
    env_id: env.id,
    secret_type: 'client_secret',
    secret_key: '',
    expires_at: null
  })
  secretDialogVisible.value = true
}

async function createSecret() {
  try {
    await secretApi.create({ ...secretForm, app_id: app.value.id })
    ElMessage.success('创建成功')
    secretDialogVisible.value = false
    loadApp()
  } catch (e) {
    ElMessage.error('创建失败')
  }
}

function getTypeText(type) {
  const map = { web: 'Web应用', mobile: '移动应用', api: 'API服务', desktop: '桌面应用' }
  return map[type] || type
}

function getStatusType(status) {
  const map = { development: 'info', testing: 'warning', production: 'success', disabled: 'danger' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { development: '开发中', testing: '测试中', production: '生产中', disabled: '已停用' }
  return map[status] || status
}

onMounted(() => {
  loadApp()
})
</script>
