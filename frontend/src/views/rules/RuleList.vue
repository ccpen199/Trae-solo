<template>
  <div>
    <el-card class="page-card">
      <template #header>
        <div class="card-header">
          <span class="page-title">规则列表</span>
          <el-button type="primary" @click="goToBuilder">
            <el-icon><Plus /></el-icon>
            新建规则
          </el-button>
        </div>
      </template>
      
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-select v-model="filterStatus" placeholder="筛选状态" clearable @change="loadRules">
            <el-option label="全部" value="" />
            <el-option label="草稿" value="draft" />
            <el-option label="测试中" value="testing" />
            <el-option label="已激活" value="active" />
          </el-select>
        </el-col>
      </el-row>

      <el-table :data="rules" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="name" label="规则名称" min-width="180">
          <template #default="{ row }">
            <div class="rule-name" @click="editRule(row)">
              <el-icon color="#409EFF"><Document /></el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="version" label="版本" width="100" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" effect="light">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="editRule(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button 
              v-if="row.status === 'draft' || row.status === 'testing'" 
              type="warning" 
              link 
              @click="pushToTest(row)"
            >
              <el-icon><Upload /></el-icon>
              推送测试
            </el-button>
            <el-button 
              v-if="row.status === 'testing'" 
              type="success" 
              link 
              @click="activateRule(row)"
            >
              <el-icon><Check /></el-icon>
              激活上线
            </el-button>
            <el-button type="info" link @click="viewDetail(row)">
              <el-icon><View /></el-icon>
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailVisible" title="规则详情" width="700px">
      <el-descriptions :column="2" border v-if="currentRule">
        <el-descriptions-item label="规则名称">{{ currentRule.name }}</el-descriptions-item>
        <el-descriptions-item label="版本">{{ currentRule.version }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(currentRule.status)" effect="light">
            {{ getStatusLabel(currentRule.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建者">{{ currentRule.created_by }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ currentRule.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentRule.created_at }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ currentRule.updated_at }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider>规则拓扑</el-divider>
      <div class="topology-preview">
        <pre>{{ JSON.stringify(currentRule?.topology, null, 2) }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../utils/api'

const router = useRouter()

const rules = ref([])
const loading = ref(false)
const filterStatus = ref('')
const detailVisible = ref(false)
const currentRule = ref(null)

const getStatusTagType = (status) => {
  switch (status) {
    case 'draft': return 'info'
    case 'testing': return 'warning'
    case 'active': return 'success'
    default: return 'info'
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'draft': return '草稿'
    case 'testing': return '测试中'
    case 'active': return '已激活'
    default: return status
  }
}

const loadRules = async () => {
  loading.value = true
  try {
    const url = filterStatus.value ? `/rules?status=${filterStatus.value}` : '/rules'
    const res = await api.get(url)
    if (res.data.success) {
      rules.value = res.data.data
    }
  } catch (e) {
    console.error('加载规则列表失败', e)
  } finally {
    loading.value = false
  }
}

const goToBuilder = () => router.push('/rules/builder')

const editRule = (row) => {
  router.push(`/rules/builder?id=${row.id}`)
}

const pushToTest = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定将规则 "${row.name}" 推送到测试环境吗？`,
      '确认操作',
      { type: 'warning' }
    )
    
    const res = await api.post(`/rules/${row.id}/push-to-test`)
    if (res.data.success) {
      ElMessage.success('已推送到测试环境')
      loadRules()
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error('推送失败', e)
    }
  }
}

const activateRule = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定激活规则 "${row.name}" 到生产环境吗？`,
      '确认操作',
      { type: 'success' }
    )
    
    const res = await api.post(`/rules/${row.id}/activate`)
    if (res.data.success) {
      ElMessage.success('规则已激活上线')
      loadRules()
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error('激活失败', e)
    }
  }
}

const viewDetail = (row) => {
  currentRule.value = row
  detailVisible.value = true
}

onMounted(() => {
  loadRules()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rule-name {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #409EFF;
}

.rule-name:hover {
  text-decoration: underline;
}

.topology-preview {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  max-height: 300px;
  overflow: auto;
}

.topology-preview pre {
  margin: 0;
  font-size: 12px;
  color: #606266;
}
</style>
