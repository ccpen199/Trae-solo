<template>
  <div class="admin-comments-page">
    <div class="page-header">
      <h2>评论审核</h2>
    </div>

    <el-table :data="comments" v-loading="loading" stripe style="width: 100%">
      <el-table-column prop="content" label="评论内容" min-width="300">
        <template #default="scope">
          <div class="comment-content">{{ scope.row.content }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="author" label="评论者" width="120">
        <template #default="scope">
          {{ scope.row.author?.nickname || scope.row.author?.username }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="评论时间" width="160">
        <template #default="scope">
          {{ formatTime(scope.row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
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
            删除
          </el-button>
          <el-button 
            v-if="scope.row.status === 'published'" 
            type="danger" 
            size="small"
            @click="handleDelete(scope.row)"
          >
            删除
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
const comments = ref([
  { id: '1', content: '这篇文章写得非常好，学到了很多知识！', author: { nickname: 'admin' }, status: 'published', createdAt: new Date().toISOString() },
  { id: '2', content: '测试评论，需要审核。', author: { nickname: 'testuser' }, status: 'pending', createdAt: new Date().toISOString() },
])

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const getStatusTagType = (status) => {
  const map = { pending: 'warning', published: 'success', rejected: 'danger' }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = { pending: '待审核', published: '已发布', rejected: '已删除' }
  return map[status] || status
}

const handleApprove = async (comment) => {
  try {
    await ElMessageBox.confirm('确定通过该评论吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })
    comment.status = 'published'
    ElMessage.success('已通过')
  } catch (e) {}
}

const handleReject = async (comment) => {
  try {
    await ElMessageBox.confirm('确定删除该评论吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const index = comments.value.findIndex(c => c.id === comment.id)
    if (index > -1) comments.value.splice(index, 1)
    ElMessage.success('已删除')
  } catch (e) {}
}

const handleDelete = async (comment) => {
  try {
    await ElMessageBox.confirm('确定删除该评论吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const index = comments.value.findIndex(c => c.id === comment.id)
    if (index > -1) comments.value.splice(index, 1)
    ElMessage.success('已删除')
  } catch (e) {}
}

onMounted(() => {
})
</script>

<style scoped>
.admin-comments-page {
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

.comment-content {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
