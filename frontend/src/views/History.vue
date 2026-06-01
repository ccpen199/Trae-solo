<template>
  <div class="history">
    <h2 class="mb-6">📝 学习记录</h2>
    
    <div class="card mb-6">
      <div class="flex gap-4 mb-4">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          :class="['btn', activeTab === tab.key ? 'btn-primary' : 'btn-outline']"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
      
      <div v-if="activeTab === 'practice'">
        <div v-if="practiceHistory.length === 0" class="text-center text-gray py-8">
          暂无练习记录
        </div>
        <div v-else>
          <div v-for="item in practiceHistory" :key="item.id" class="history-item">
            <div class="flex justify-between items-start">
              <div>
                <h4>{{ item.resource_title }}</h4>
                <p class="text-sm text-gray">
                  完成时间：{{ formatDate(item.completed_at) }} | 
                  用时：{{ item.time_spent }}分钟
                </p>
              </div>
              <span :class="['tag', item.is_correct ? 'tag-sprint' : 'tag-weak']">
                {{ item.is_correct ? '正确' : '错误' }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="activeTab === 'favorite'">
        <div v-if="favorites.length === 0" class="text-center text-gray py-8">
          暂无收藏内容
        </div>
        <div v-else>
          <div v-for="item in favorites" :key="item.id" class="history-item">
            <div class="flex justify-between items-center">
              <div>
                <h4>{{ item.resource_title }}</h4>
                <p class="text-sm text-gray">收藏时间：{{ formatDate(item.created_at) }}</p>
              </div>
              <router-link :to="'/practice/' + item.resource_id" class="btn btn-primary btn-sm">
                去练习
              </router-link>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="activeTab === 'skip'">
        <div v-if="skips.length === 0" class="text-center text-gray py-8">
          暂无跳过记录
        </div>
        <div v-else>
          <div v-for="item in skips" :key="item.id" class="history-item">
            <div class="flex justify-between items-center">
              <div>
                <h4>{{ item.resource_title || '推荐内容' }}</h4>
                <p class="text-sm text-gray">跳过时间：{{ formatDate(item.created_at) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:58830'

const tabs = [
  { key: 'practice', label: '练习记录' },
  { key: 'favorite', label: '我的收藏' },
  { key: 'skip', label: '跳过记录' }
]

const activeTab = ref('practice')
const practiceHistory = ref([])
const favorites = ref([])
const skips = ref([])

const formatDate = (d) => d ? new Date(d).toLocaleString('zh-CN') : '-'

onMounted(async () => {
  const res = await axios.get(`${API_BASE}/api/students/1/history`)
  practiceHistory.value = res.data.practice || []
  favorites.value = res.data.favorites || []
  skips.value = res.data.skips || []
})
</script>

<style scoped>
.history-item {
  padding: 16px 0;
  border-bottom: 1px solid var(--gray-100);
}
.history-item:last-child { border-bottom: none; }
.history-item h4 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}
.btn-sm {
  padding: 6px 12px;
  font-size: 14px;
}
</style>
