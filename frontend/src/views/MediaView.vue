<template>
  <div class="container">
    <h2 class="section-title">🎵 音乐影视</h2>
    
    <div style="margin-bottom: 1.5rem;">
      <button 
        v-for="cat in categories" 
        :key="cat.value"
        class="btn btn-sm"
        :class="category === cat.value ? 'btn-primary' : 'btn-outline'"
        @click="category = cat.value"
        style="margin-right: 0.5rem; margin-bottom: 0.5rem;"
      >
        {{ cat.label }}
      </button>
    </div>
    
    <div class="grid grid-2" v-if="mediaItems.length">
      <div v-for="item in mediaItems" :key="item.id" class="media-card">
        <div class="media-icon">{{ item.type === 'music' ? '🎵' : '🎬' }}</div>
        <div class="media-info">
          <div class="media-title">{{ item.title }}</div>
          <div class="media-meta">
            {{ item.artist }} · {{ item.year }}
          </div>
          <div class="media-rating" style="margin-top: 0.25rem;">
            {{ '★'.repeat(item.rating) }}{{ '☆'.repeat(5 - item.rating) }}
          </div>
        </div>
      </div>
    </div>
    
    <p v-else class="card card-body">暂无内容</p>
    
    <div class="pagination" v-if="totalPages > 1">
      <button class="pagination-btn" :disabled="page === 1" @click="page--">上一页</button>
      <span style="padding: 0.5rem 1rem;">第 {{ page }} 页</span>
      <button class="pagination-btn" :disabled="page >= totalPages" @click="page++">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { mediaApi } from '@/api'

const categories = [
  { label: '全部', value: '' },
  { label: '🎵 音乐', value: 'music' },
  { label: '🎬 影视', value: 'movie' }
]

const mediaItems = ref([])
const category = ref('')
const page = ref(1)
const limit = ref(8)
const total = ref(0)

const totalPages = computed(() => Math.ceil(total.value / limit.value))

async function loadMedia() {
  try {
    const params = { page: page.value, limit: limit.value }
    if (category.value) {
      params.category = category.value
    }
    
    const res = await mediaApi.getList(params)
    if (res.data.success) {
      mediaItems.value = res.data.data.list
      total.value = res.data.data.total
    }
  } catch (error) {
    console.error('加载媒体列表失败:', error)
  }
}

watch([category, page], () => {
  page.value = 1
  loadMedia()
})

onMounted(() => {
  loadMedia()
})
</script>
