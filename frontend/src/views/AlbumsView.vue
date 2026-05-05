<template>
  <div class="container">
    <h2 class="section-title">📷 相册</h2>
    
    <div class="grid grid-3" v-if="albums.length">
      <router-link 
        v-for="album in albums" 
        :key="album.id" 
        :to="`/albums/${album.id}`"
        class="album-card"
      >
        <div class="album-cover">
          📷
          <span class="album-photo-count">{{ album.photo_count || 0 }} 张</span>
        </div>
        <div class="album-info">
          <div class="album-name">{{ album.name }}</div>
          <div class="album-desc">{{ album.description }}</div>
          <div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted);">
            👁 {{ album.view_count }} 次浏览
          </div>
        </div>
      </router-link>
    </div>
    
    <p v-else class="card card-body">暂无相册</p>
    
    <div class="pagination" v-if="totalPages > 1">
      <button class="pagination-btn" :disabled="page === 1" @click="page--">上一页</button>
      <span style="padding: 0.5rem 1rem;">第 {{ page }} 页</span>
      <button class="pagination-btn" :disabled="page >= totalPages" @click="page++">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { albumsApi } from '@/api'

const albums = ref([])
const page = ref(1)
const limit = ref(9)
const total = ref(0)

const totalPages = computed(() => Math.ceil(total.value / limit.value))

async function loadAlbums() {
  try {
    const res = await albumsApi.getList({ page: page.value, limit: limit.value })
    if (res.data.success) {
      albums.value = res.data.data.list
      total.value = res.data.data.total
    }
  } catch (error) {
    console.error('加载相册列表失败:', error)
  }
}

watch(page, () => {
  loadAlbums()
})

onMounted(() => {
  loadAlbums()
})
</script>
