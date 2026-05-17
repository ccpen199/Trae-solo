<template>
  <div class="discover-page">
    <div class="tabs-wrapper">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="推荐" name="discover" />
        <el-tab-pane label="穿搭" name="fashion" />
        <el-tab-pane label="美食" name="food" />
        <el-tab-pane label="旅行" name="travel" />
        <el-tab-pane label="美妆" name="beauty" />
        <el-tab-pane label="家居" name="home" />
      </el-tabs>
    </div>

    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="8" animated />
    </div>

    <div v-else-if="notes.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <div class="empty-text">暂无笔记，去发布第一篇吧</div>
    </div>

    <div v-else class="masonry-grid">
      <div v-for="note in notes" :key="note.id" class="masonry-item">
        <NoteCard :note="note" />
      </div>
    </div>

    <div v-if="hasMore && !loading" class="load-more">
      <el-button type="primary" @click="loadMore" :loading="loadingMore">
        加载更多
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import NoteCard from '@/components/NoteCard.vue'

const activeTab = ref('discover')
const loading = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)
const notes = ref([])

const fetchNotes = async (reset = false) => {
  if (reset) {
    loading.value = true
    page.value = 1
    hasMore.value = true
  } else {
    loadingMore.value = true
  }

  try {
    const res = await request.get('/notes', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        type: activeTab.value
      }
    })

    const newNotes = res.data.list || []
    if (reset) {
      notes.value = newNotes
    } else {
      notes.value = [...notes.value, ...newNotes]
    }

    hasMore.value = newNotes.length >= pageSize.value
  } catch (error) {
    console.error('获取笔记失败:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const handleTabChange = () => {
  fetchNotes(true)
}

const loadMore = () => {
  page.value++
  fetchNotes(false)
}

onMounted(() => {
  fetchNotes(true)
})
</script>

<style lang="scss" scoped>
.discover-page {
  .tabs-wrapper {
    background: #fff;
    border-radius: 8px;
    padding: 0 20px;
    margin-bottom: 20px;

    :deep(.el-tabs__header) {
      margin: 0;
    }

    :deep(.el-tabs__nav-wrap::after) {
      display: none;
    }
  }

  .load-more {
    text-align: center;
    padding: 30px 0;
  }
}
</style>
