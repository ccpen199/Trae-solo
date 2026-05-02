<template>
  <div class="pipelines-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>流水线管理</span>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            新建流水线
          </el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="name" label="流水线名称" min-width="180" />
        <el-table-column prop="project_name" label="项目名称" width="150" />
        <el-table-column prop="repo_url" label="仓库地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="branch" label="分支" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'" size="small">
              {{ scope.row.status === 'active' ? '已激活' : scope.row.status === 'paused' ? '已暂停' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator_name" label="创建人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button 
              :type="scope.row.status === 'active' ? 'warning' : 'success'" 
              link 
              size="small"
              @click="toggleActive(scope.row)"
            >
              {{ scope.row.status === 'active' ? '暂停' : '激活' }}
            </el-button>
            <el-button type="primary" link size="small" @click="viewPipeline(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建对话框 -->
    <el-dialog v-model="showCreateDialog" title="新建流水线" width="600px">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="100px">
        <el-form-item label="流水线名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入流水线名称" />
        </el-form-item>
        <el-form-item label="项目名称" prop="projectName">
          <el-input v-model="createForm.projectName" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createForm.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="仓库地址">
          <el-input v-model="createForm.repoUrl" placeholder="Git仓库地址（可选）" />
        </el-form-item>
        <el-form-item label="分支">
          <el-input v-model="createForm.branch" placeholder="默认 main" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="流水线详情" width="700px">
      <el-descriptions :column="2" border v-if="currentPipeline">
        <el-descriptions-item label="流水线名称">{{ currentPipeline.name }}</el-descriptions-item>
        <el-descriptions-item label="项目名称">{{ currentPipeline.project_name }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentPipeline.status === 'active' ? 'success' : 'info'">
            {{ currentPipeline.status === 'active' ? '已激活' : currentPipeline.status === 'paused' ? '已暂停' : '草稿' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建人">{{ currentPipeline.creator_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="仓库地址">{{ currentPipeline.repo_url || '-' }}</el-descriptions-item>
        <el-descriptions-item label="分支">{{ currentPipeline.branch || 'main' }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ currentPipeline.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ formatTime(currentPipeline.created_at) }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">阶段配置</el-divider>
      <el-table :data="pipelineStages" size="small">
        <el-table-column prop="order" label="顺序" width="80" />
        <el-table-column prop="name" label="阶段名称" />
        <el-table-column prop="stage_name" label="阶段标识" />
        <el-table-column prop="type" label="类型">
          <template #default="scope">
            <el-tag :type="scope.row.type === 'auto' ? 'warning' : 'info'" size="small">
              {{ scope.row.type === 'auto' ? '自动' : '手动' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPipelines, createPipeline, activatePipeline } from '@/utils/api'
import { Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const loading = ref(false)
const tableData = ref([])
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const createLoading = ref(false)
const currentPipeline = ref(null)
const createFormRef = ref()

const createForm = reactive({
  name: '',
  projectName: '',
  description: '',
  repoUrl: '',
  branch: 'main'
})

const createRules = {
  name: [{ required: true, message: '请输入流水线名称', trigger: 'blur' }],
  projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }]
}

const pipelineStages = ref([
  { order: 1, name: '代码提交', stage_name: 'code_submit', type: 'manual' },
  { order: 2, name: '触发流水线', stage_name: 'trigger', type: 'manual' },
  { order: 3, name: '构建测试', stage_name: 'build_test', type: 'auto' },
  { order: 4, name: '部署', stage_name: 'deploy', type: 'manual' },
  { order: 5, name: '监控回滚', stage_name: 'monitor', type: 'manual' }
])

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getPipelines({})
    if (res.success) {
      tableData.value = res.data
    }
  } catch (e) {
    console.error('获取流水线失败', e)
  } finally {
    loading.value = false
  }
}

const toggleActive = async (row) => {
  const isActive = row.status === 'active'
  try {
    await ElMessageBox.confirm(
      isActive ? '确定要暂停该流水线吗？' : '确定要激活该流水线吗？',
      '提示',
      { type: 'warning' }
    )
    
    const res = await activatePipeline(row.id, !isActive)
    if (res.success) {
      ElMessage.success(isActive ? '已暂停' : '已激活')
      fetchData()
    }
  } catch (e) {
    console.log('取消操作')
  }
}

const viewPipeline = (row) => {
  currentPipeline.value = row
  showDetailDialog.value = true
}

const handleCreate = async () => {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return

  createLoading.value = true
  try {
    const res = await createPipeline({
      name: createForm.name,
      projectName: createForm.projectName,
      description: createForm.description,
      repoUrl: createForm.repoUrl,
      branch: createForm.branch
    })
    if (res.success) {
      ElMessage.success('创建成功')
      showCreateDialog.value = false
      fetchData()
    }
  } catch (e) {
    console.error('创建失败', e)
  } finally {
    createLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.pipelines-page {
  min-height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
