<template>
  <div class="cases-page page-container">
    <div class="header">
      <h1>定制案例</h1>
    </div>

    <div v-if="loading" class="loading">
      <el-spinner />
    </div>

    <div v-else class="content">
      <div class="case-list">
        <div 
          v-for="item in cases" 
          :key="item.id" 
          class="case-card"
          @click="goDetail(item.id)"
        >
          <div class="case-image">
            <img :src="getFirstImage(item.images)" alt="" />
          </div>
          <div class="case-info">
            <h4>{{ item.title }}</h4>
            <p class="case-designer">{{ item.real_name }}</p>
            <div class="case-meta">
              <span>{{ item.area }}㎡</span>
              <span>{{ item.style }}</span>
              <span>¥{{ item.budget.toLocaleString() }}</span>
            </div>
            <div class="case-stats">
              <span><Heart class="icon" />{{ item.likes }}</span>
              <span><Eye class="icon" />{{ item.views }}</span>
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
import { Heart, Eye } from 'lucide-vue-next'
import BottomNav from '@/components/BottomNav.vue'
import { caseAPI } from '@/api'

const router = useRouter()
const loading = ref(true)
const cases = ref([])
const page = ref(1)
const limit = ref(10)
const total = ref(0)

onMounted(() => {
  loadCases()
})

async function loadCases() {
  loading.value = true
  try {
    const data = await caseAPI.list({ page: page.value, limit: limit.value })
    cases.value = data.cases || []
    total.value = data.total || 0
  } catch {
    cases.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handlePageChange(val) {
  page.value = val
  loadCases()
}

function getFirstImage(imagesStr) {
  try {
    const images = JSON.parse(imagesStr)
    return images[0] || '/default-image.png'
  } catch {
    return '/default-image.png'
  }
}

function goDetail(id) {
  router.push(`/case/${id}`)
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

.case-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.case-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.case-image {
  height: 200px;
}

.case-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.case-info {
  padding: 12px;
}

.case-info h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 6px 0;
}

.case-designer {
  font-size: 13px;
  color: #999;
  margin: 0 0 8px 0;
}

.case-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.case-meta span {
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.case-stats {
  display: flex;
  gap: 16px;
}

.case-stats span {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon {
  width: 14px;
  height: 14px;
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