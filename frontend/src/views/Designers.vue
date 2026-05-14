<template>
  <div class="designers-page page-container">
    <div class="header">
      <h1>设计师</h1>
    </div>

    <div v-if="loading" class="loading">
      <el-spinner />
    </div>

    <div v-else class="content">
      <div class="designer-list">
        <div 
          v-for="designer in designers" 
          :key="designer.id" 
          class="designer-card"
          @click="goDetail(designer.id)"
        >
          <div class="designer-avatar">
            <img :src="designer.avatar || '/default-avatar.png'" :alt="designer.real_name" />
          </div>
          <div class="designer-info">
            <h4>{{ designer.real_name }}</h4>
            <p class="designer-bio">{{ designer.bio || '暂无介绍' }}</p>
            <div class="designer-stats">
              <span>经验 {{ designer.experience }}年</span>
              <span>作品 {{ designer.works_count }}</span>
              <span>粉丝 {{ designer.followers }}</span>
            </div>
          </div>
        </div>
      </div>

      <el-pagination
        v-if="total > limit"
        :current-page="page"
        :page-size="limit"
        :total="total"
        @current-change="handlePageChange"
        class="pagination"
      />
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BottomNav from '@/components/BottomNav.vue'
import { designerAPI } from '@/api'

const router = useRouter()
const loading = ref(true)
const designers = ref([])
const page = ref(1)
const limit = ref(10)
const total = ref(0)

onMounted(() => {
  loadDesigners()
})

async function loadDesigners() {
  loading.value = true
  try {
    const data = await designerAPI.list({ page: page.value, limit: limit.value })
    designers.value = data.designers || []
    total.value = data.total || 0
  } catch {
    designers.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handlePageChange(val) {
  page.value = val
  loadDesigners()
}

function goDetail(id) {
  router.push(`/designer/${id}`)
}
</script>

<style scoped>
.header {
  background: white;
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.content {
  padding: 12px;
}

.designer-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.designer-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 16px;
}

.designer-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #f5f5f5;
}

.designer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.designer-info {
  flex: 1;
}

.designer-info h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.designer-bio {
  font-size: 13px;
  color: #666;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.designer-stats {
  display: flex;
  gap: 16px;
}

.designer-stats span {
  font-size: 12px;
  color: #999;
}

.pagination {
  padding: 16px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
</style>