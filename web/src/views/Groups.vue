<template>
  <div class="groups-page">
    <div class="container">
      <div class="page-header">
        <h1>发现小组</h1>
        <p class="subtitle">加入感兴趣的小组，结识志同道合的朋友</p>
        <el-button v-if="userStore.isLoggedIn" type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          创建小组
        </el-button>
      </div>

      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索小组..."
          prefix-icon="Search"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleSearch"
          style="width: 360px"
        >
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>

      <div class="groups-grid" v-loading="loading">
        <div 
          v-for="group in groups" 
          :key="group.id"
          class="group-card"
          @click="$router.push(`/groups/${group.id}`)"
        >
          <div class="group-avatar">
            <el-avatar :size="80">
              <img v-if="group.avatar" :src="group.avatar" />
              <el-icon v-else size="40"><ChatDotRound /></el-icon>
            </el-avatar>
          </div>
          <div class="group-info">
            <h3 class="group-name">{{ group.name }}</h3>
            <p class="group-desc">{{ group.description || '暂无描述' }}</p>
            <div class="group-meta">
              <span class="meta-item">
                <el-icon><User /></el-icon>
                {{ group.memberCount }} 成员
              </span>
              <span class="meta-item">
                <el-icon><Document /></el-icon>
                {{ group.postCount }} 帖子
              </span>
              <el-tag v-if="group.isPublic" type="success" size="small">公开</el-tag>
              <el-tag v-else type="info" size="small">私有</el-tag>
            </div>
          </div>
        </div>
        
        <el-empty v-if="!loading && groups.length === 0" description="暂无小组" />
      </div>

      <div class="pagination-wrap" v-if="pagination.total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[12, 24, 48]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchGroups"
          @current-change="fetchGroups"
        />
      </div>
    </div>

    <el-dialog
      v-model="showCreateDialog"
      title="创建小组"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入小组名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入小组描述"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="createForm.isPublic">
            <el-radio :value="true">公开</el-radio>
            <el-radio :value="false">私有</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="加入审批">
          <el-switch v-model="createForm.needApproval" />
          <span class="switch-label">需要审批才能加入</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { getGroups, createGroup } from '@/api'
import {
  Plus,
  Search,
  ChatDotRound,
  User,
  Document
} from '@element-plus/icons-vue'

const userStore = useUserStore()

const loading = ref(false)
const creating = ref(false)
const showCreateDialog = ref(false)
const createFormRef = ref(null)
const groups = ref([])
const searchKeyword = ref('')

const pagination = reactive({
  page: 1,
  limit: 12,
  total: 0
})

const createForm = reactive({
  name: '',
  description: '',
  isPublic: true,
  needApproval: false
})

const createRules = {
  name: [
    { required: true, message: '请输入小组名称', trigger: 'blur' },
    { min: 2, max: 100, message: '名称长度需在2-100个字符之间', trigger: 'blur' }
  ]
}

const fetchGroups = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit
    }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    const res = await getGroups(params)
    groups.value = res.data?.groups || []
    pagination.total = res.data?.pagination?.total || 0
  } catch (e) {
    console.error('Fetch groups error:', e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchGroups()
}

const handleCreate = async () => {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return
  
  creating.value = true
  try {
    await createGroup(createForm)
    ElMessage.success('小组创建成功')
    showCreateDialog.value = false
    createForm.name = ''
    createForm.description = ''
    createForm.isPublic = true
    createForm.needApproval = false
    fetchGroups()
  } catch (e) {
    console.error('Create group error:', e)
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  fetchGroups()
})
</script>

<style scoped>
.groups-page {
  min-height: calc(100vh - 64px);
  padding: 40px 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.page-header .subtitle {
  color: #666;
  font-size: 15px;
}

.search-bar {
  margin-bottom: 32px;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
}

.group-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e4e7ed;
}

.group-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.group-avatar {
  flex-shrink: 0;
}

.group-info {
  flex: 1;
  min-width: 0;
}

.group-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.group-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.switch-label {
  margin-left: 8px;
  font-size: 14px;
  color: #606266;
}
</style>
