<template>
  <div class="home">
    <div class="welcome-card card">
      <div class="flex justify-between items-center">
        <div>
          <h2>👋 欢迎回来，{{ student?.name || '同学' }}</h2>
          <p class="text-gray">年级：{{ student?.grade || '未设置' }} | 目标：{{ student?.goal || '未设置' }}</p>
        </div>
        <button @click="refresh" class="btn btn-primary">刷新推荐</button>
      </div>
    </div>

    <div class="stats-grid grid-3 mb-6">
      <div class="card">
        <div class="stat-number text-success">{{ profile?.mastery_rate || 0 }}%</div>
        <div class="stat-label">知识点掌握率</div>
      </div>
      <div class="card">
        <div class="stat-number text-primary">{{ profile?.total_practices || 0 }}</div>
        <div class="stat-label">累计练习数</div>
      </div>
      <div class="card">
        <div class="stat-number text-warning">{{ profile?.weak_points || 0 }}</div>
        <div class="stat-label">待加强知识点</div>
      </div>
    </div>

    <h3 class="mb-4">🎯 今日推荐学习内容</h3>
    <div v-if="loading" class="card text-center">
      <p>正在生成个性化推荐...</p>
    </div>
    <div v-else-if="recommendations.length === 0" class="card text-center">
      <p>暂无推荐内容，请完善个人信息</p>
    </div>
    <div v-else>
      <div v-for="rec in recommendations" :key="rec.id" class="card recommendation-card">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <span :class="'tag tag-' + rec.strategy">{{ getStrategyLabel(rec.strategy) }}</span>
              <span class="tag" :style="{ background: getDifficultyBg(rec.resource.difficulty), color: getDifficultyColor(rec.resource.difficulty) }">
                {{ getDifficultyLabel(rec.resource.difficulty) }}
              </span>
              <span class="text-sm text-gray">{{ rec.resource.estimated_time }}分钟</span>
            </div>
            <h4 class="rec-title">{{ rec.resource.title }}</h4>
            <p class="rec-desc">{{ rec.resource.description }}</p>
            <div class="knowledge-tags mt-2">
              <span v-for="k in rec.resource.knowledge_points" :key="k" class="kp-tag">{{ k }}</span>
            </div>
            <div class="reason-box mt-3">
              <strong>推荐理由：</strong>{{ rec.reason }}
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <router-link :to="'/practice/' + rec.resource_id" class="btn btn-primary">
              开始学习
            </router-link>
            <button @click="skipRecommendation(rec.id)" class="btn btn-outline">跳过</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStudentStore } from '../stores'

const route = useRoute()
const store = useStudentStore()
const student = ref(null)
const profile = ref(null)
const recommendations = ref([])
const loading = ref(true)

const getStrategyLabel = (s) => ({ weak: '补弱', reinforce: '巩固', preview: '预习', sprint: '冲刺' }[s] || s)
const getDifficultyLabel = (d) => ({ easy: '简单', medium: '中等', hard: '困难' }[d] || d)
const getDifficultyBg = (d) => ({ easy: '#dcfce7', medium: '#fef3c7', hard: '#fee2e2' }[d] || '#e5e7eb')
const getDifficultyColor = (d) => ({ easy: '#166534', medium: '#92400e', hard: '#991b1b' }[d] || '#374151')

const refresh = async () => {
  loading.value = true
  await store.initStudent(1)
  await store.loadProfile(1)
  student.value = store.currentStudent
  profile.value = store.profile
  await store.loadRecommendations(1)
  recommendations.value = store.recommendations
  loading.value = false
}

const skipRecommendation = async (recId) => {
  await store.submitFeedback({
    student_id: 1,
    recommendation_id: recId,
    action: 'skip'
  })
  await refresh()
}

onMounted(refresh)
watch(() => route.path, (newPath) => {
  if (newPath === '/') refresh()
})
</script>

<style scoped>
.welcome-card h2 { margin-bottom: 8px; }
.text-gray { color: var(--gray-600); }
.text-sm { font-size: 14px; }
.text-center { text-align: center; }
.text-success { color: var(--success); }
.text-primary { color: var(--primary); }
.text-warning { color: var(--warning); }

.stat-number {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 4px;
}
.stat-label {
  color: var(--gray-600);
  font-size: 14px;
}

.recommendation-card { margin-bottom: 16px; }
.rec-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}
.rec-desc {
  color: var(--gray-600);
  margin-bottom: 8px;
}
.kp-tag {
  display: inline-block;
  padding: 2px 10px;
  background: var(--gray-100);
  border-radius: 12px;
  font-size: 12px;
  margin-right: 8px;
  color: var(--gray-700);
}
.reason-box {
  padding: 10px 14px;
  background: #f0f9ff;
  border-radius: 8px;
  font-size: 14px;
  color: #0369a1;
}
.btn-outline {
  background: white;
  border: 1px solid var(--gray-300);
  color: var(--gray-700);
}
.btn-outline:hover {
  background: var(--gray-50);
}
.flex-col { flex-direction: column; }
</style>
