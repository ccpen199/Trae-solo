<template>
  <div class="container" style="padding-bottom: 100px;">
    <div class="header">
      <button class="back-btn" @click="$router.back()">←</button>
      <h2 style="color: white;">我的树</h2>
      <div></div>
    </div>

    <div v-if="loading" class="loading">
      加载中...
    </div>

    <div v-else-if="trees.length === 0" class="card" style="text-align: center;">
      <div style="font-size: 60px; margin-bottom: 16px;">🌱</div>
      <p style="color: #666;">还没有种树哦，快去种植你的第一棵树吧！</p>
      <button class="btn btn-success" style="margin-top: 16px;" @click="$router.push('/plant')">
        去种树
      </button>
    </div>

    <div v-else>
      <div
        v-for="tree in trees"
        :key="tree.id"
        class="project-card"
      >
        <div style="padding: 16px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="font-size: 48px;">🌳</div>
            <div>
              <div style="font-weight: bold; font-size: 18px; color: #333;">{{ tree.tree_name }}</div>
              <div style="font-size: 14px; color: #666;">{{ tree.location }}</div>
            </div>
          </div>
          <div style="background: #f5f5f5; padding: 12px; border-radius: 8px;">
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">种植证书编号</div>
            <div style="font-family: monospace; font-size: 14px; color: #333;">{{ tree.certificate_number }}</div>
          </div>
          <div style="margin-top: 12px; font-size: 12px; color: #999;">
            种植时间：{{ new Date(tree.planted_at).toLocaleString() }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const trees = ref([])
const loading = ref(true)

const loadTrees = async () => {
  try {
    const response = await api.get('/trees/my')
    trees.value = response.data
  } catch (error) {
    console.error('Failed to load trees:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTrees()
})
</script>
