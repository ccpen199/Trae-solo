<template>
  <div class="container">
    <router-link to="/albums" class="btn btn-outline" style="margin-bottom: 1.5rem;">
      ← 返回相册列表
    </router-link>
    
    <div v-if="album">
      <h2 class="section-title">{{ album.name }}</h2>
      <p style="color: var(--text-muted); margin-bottom: 2rem;">{{ album.description }}</p>
      
      <div class="photo-grid" v-if="photos.length">
        <div v-for="photo in photos" :key="photo.id" class="photo-item" :title="photo.title">
          🖼️
        </div>
      </div>
      
      <p v-else class="card card-body">暂无照片</p>
    </div>
    
    <div v-else class="card card-body" style="text-align: center;">
      相册不存在或加载中...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { albumsApi } from '@/api'

const route = useRoute()
const album = ref(null)
const photos = ref([])

async function loadAlbum() {
  try {
    const res = await albumsApi.getDetail(route.params.id)
    if (res.data.success) {
      album.value = res.data.data.album
      photos.value = res.data.data.photos
    }
  } catch (error) {
    console.error('加载相册详情失败:', error)
  }
}

onMounted(() => {
  loadAlbum()
})
</script>
