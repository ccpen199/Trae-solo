<template>
  <div class="admin-resources-page">
    <div class="page-header">
      <h2>资源审核</h2>
    </div>

    <el-table :data="resources" v-loading="loading" stripe style="width: 100%">
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="author" label="作者" width="120">
        <template #default="scope">
          {{ scope.row.author?.nickname || scope.row.author?.username }}
        </template>
      </el-table-column>
      <el-table-column prop="category" label="分类" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="viewCount" label="浏览" width="80" />
      <el-table-column prop="createdAt" label="创建时间" width="160">
        <template #default="scope">
          {{ formatTime(scope.row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button type="primary" size="small" text @click="handleView(scope.row)">
            查看
          </el-button>
          <el-button 
            v-if="scope.row.status === 'pending'" 
            type="success" 
            size="small"
            @click="handleApprove(scope.row)"
          >
            通过
          </el-button>
          <el-button 
            v-if="scope.row.status === 'pending'" 
            type="danger" 
            size="small"
            @click="handleReject(scope.row)"
          >
            拒绝
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const resources = ref([
  { id: '1', title: 'Vue 3 入门教程', author: { nickname: 'admin' }, category: '教育', status: 'published', viewCount: 100, createdAt: new Date().toISOString() },
  { id: '2', title: '最新科技资讯汇总', author: { nickname: 'testuser' }, category: '科技', status: 'pending', viewCount: 0, createdAt: new Date().toISOString() },
])

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const getStatusTagType = (status) => {
  const map = { draft: 'info', pending: 'warning', published: 'success', rejected: 'danger' }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = { draft: '草稿', pending: '待审核', published: '已发布', rejected: '已拒绝' }
  return map[status] || status
}

const handleView = (resource) => {
  ElMessage.info('查看详情功能')
}

const handleApprove = async (resource) => {
  try {
    await ElMessageBox.confirm('确定通过该资源吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })
    resource.status = 'published'
    ElMessage.success('已通过')
  } catch (e) {}
}

const handleReject = async (resource) => {
  try {
    await ElMessageBox.confirm('确定拒绝该资源吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    resource.status = 'rejected'
    ElMessage.success('已拒绝')
  } catch (e) {}
}

onMounted(() => {
})
</script>

<style scoped>
.admin-resources-page {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}
</style>
