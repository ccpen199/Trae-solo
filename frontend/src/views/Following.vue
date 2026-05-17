<template>
  <div class="following-page">
    <div class="page-header">
      <h2>关注</h2>
      <p>查看你关注的人发布的笔记</p>
    </div>
    
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <el-icon :size="48"><Warning /></el-icon>
      <p>{{ error }}</p>
      <el-button type="primary" @click="fetchNotes">重试</el-button>
    </div>
    
    <div v-else-if="notes.length === 0" class="empty-container">
      <el-icon :size="64"><Document /></el-icon>
      <p>还没有关注的内容</p>
      <p class="sub-text">去发现页关注一些有趣的创作者吧</p>
      <el-button type="primary" @click="$router.push('/discover')">去发现</el-button>
    </div>
    
    <div v-else class="notes-grid">
      <NoteCard 
        v-for="note in notes" 
        :key="note.id" 
        :note="note"
        @click="goToDetail(note.id)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, Warning, Document } from '@element-plus/icons-vue'
import NoteCard from '@/components/NoteCard.vue'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(true)
const error = ref('')
const notes = ref([])

const fetchNotes = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await request.get('/api/notes/following')
    if (res.success) {
      notes.value = res.data || []
    } else {
      error.value = res.message || '加载失败'
    }
  } catch (err) {
    error.value = err.message || '网络错误'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

const goToDetail = (id) => {
  router.push(`/note/${id}`)
}

onMounted(() => {
  fetchNotes()
})
</script>

<style scoped lang="scss">
.following-page {
  padding: 20px;
  
  .page-header {
    margin-bottom: 24px;
    
    h2 {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #333;
    }
    
    p {
      margin: 0;
      color: #999;
      font-size: 14px;
    }
  }
  
  .loading-container,
  .error-container,
  .empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    color: #999;
    
    .el-icon {
      margin-bottom: 16px;
      color: #c0c4cc;
    }
    
    p {
      margin: 8px 0;
      
      &.sub-text {
        font-size: 14px;
        color: #c0c4cc;
      }
    }
  }
  
  .notes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
  }
}
</style>
