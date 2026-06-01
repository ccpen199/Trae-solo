<template>
  <div class="applications">
    <div class="page-header">
      <h2>应用列表</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon> 新建应用
      </el-button>
    </div>
    
    <el-card>
      <el-form :inline="true" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable>
            <el-option label="激活" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input v-model="filters.search" placeholder="名称/编码/描述" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="name" label="应用名称">
          <template #default="{ row }">
            <el-button type="primary" link @click="$router.push(`/applications/${row.id}`)">
              {{ row.name }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="应用编码" width="150" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="configCount" label="配置数" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.configCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
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
    
    <el-dialog v-model="showCreateDialog" title="新建应用" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="应用名称" required>
          <el-input v-model="form.name" placeholder="请输入应用名称" />
        </el-form-item>
        <el-form-item label="应用编码" required>
          <el-input v-model="form.code" placeholder="英文标识，如 order-service" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="负责人" required>
          <el-select v-model="form.owner" placeholder="选择负责人">
            <el-option v-for="u in users" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createApp">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { applications, users as userApi } from '@/api'

const list = ref([])
const loading = ref(false)
const showCreateDialog = ref(false)
const users = ref([])

const filters = reactive({
  status: '',
  search: ''
})

const form = reactive({
  name: '',
  code: '',
  description: '',
  owner: ''
})

const formatTime = (t) => t ? new Date(t).toLocaleString() : '-'

const loadData = async () => {
  loading.value = true
  try {
    list.value = await applications.list(filters)
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  try {
    users.value = await userApi.list()
  } catch (e) {}
}

const resetFilters = () => {
  filters.status = ''
  filters.search = ''
  loadData()
}

const createApp = async () => {
  if (!form.name || !form.code || !form.owner) {
    ElMessage.error('请填写必填项')
    return
  }
  
  try {
    await applications.create(form)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    Object.assign(form, { name: '', code: '', description: '', owner: '' })
    loadData()
  } catch (e) {
    ElMessage.error(e.error || '创建失败')
  }
}

onMounted(() => {
  loadData()
  loadUsers()
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
