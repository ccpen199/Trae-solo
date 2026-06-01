<template>
  <div class="profile">
    <div class="flex justify-between items-center mb-6">
      <h2>📊 学习画像</h2>
      <button @click="loadData" class="btn btn-primary" :disabled="loading">
        {{ loading ? '刷新中...' : '🔄 刷新数据' }}
      </button>
    </div>
    
    <div class="card mb-6">
      <h3 class="mb-4">基本信息</h3>
      <div class="grid-2">
        <div><strong>姓名：</strong>{{ student?.name }}</div>
        <div><strong>年级：</strong>{{ student?.grade }}</div>
        <div><strong>学习目标：</strong>{{ student?.goal }}</div>
        <div><strong>注册时间：</strong>{{ formatDate(student?.created_at) }}</div>
      </div>
    </div>

    <div class="card mb-6">
      <h3 class="mb-4">知识点掌握情况</h3>
      <div class="mastery-list">
        <div v-for="item in masteryList" :key="item.knowledge_point" class="mastery-item">
          <div class="flex justify-between items-center mb-2">
            <span>{{ item.knowledge_point }}</span>
            <span :class="getMasteryClass(item.level)">{{ (item.level * 100).toFixed(0) }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :class="getMasteryBgClass(item.level)" :style="{ width: (item.level * 100) + '%' }"></div>
          </div>
          <p class="update-source text-sm text-gray mt-1">
            来源：{{ item.source }} | 更新时间：{{ formatDate(item.updated_at) }}
          </p>
        </div>
      </div>
    </div>

    <div class="card mb-6">
      <h3 class="mb-4">近期表现趋势</h3>
      <div class="grid-3">
        <div class="trend-item">
          <div class="trend-label">近7天正确率</div>
          <div class="trend-value text-primary">{{ (profile?.recent_accuracy * 100 || 0).toFixed(1) }}%</div>
        </div>
        <div class="trend-item">
          <div class="trend-label">平均用时</div>
          <div class="trend-value">{{ profile?.avg_time || 0 }}分钟/题</div>
        </div>
        <div class="trend-item">
          <div class="trend-label">连续学习</div>
          <div class="trend-value text-success">{{ profile?.streak_days || 0 }}天</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="mb-4">错题集锦</h3>
      <div v-if="wrongQuestions.length === 0" class="text-center text-gray">
        暂无错题记录，继续保持！
      </div>
      <div v-else class="wrong-list">
        <div v-for="q in wrongQuestions" :key="q.id" class="wrong-item">
          <div class="flex justify-between">
            <span>{{ q.title }}</span>
            <span class="text-danger">错误 {{ q.wrong_count }} 次</span>
          </div>
          <p class="text-sm text-gray mt-1">知识点：{{ q.knowledge_points.join(', ') }}</p>
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
const masteryList = ref([])
const wrongQuestions = ref([])
const loading = ref(false)

const formatDate = (d) => d ? new Date(d).toLocaleDateString('zh-CN') : '-'
const getMasteryClass = (l) => l >= 0.8 ? 'text-success' : l >= 0.5 ? 'text-warning' : 'text-danger'
const getMasteryBgClass = (l) => l >= 0.8 ? 'bg-success' : l >= 0.5 ? 'bg-warning' : 'bg-danger'

const loadData = async () => {
  loading.value = true
  await store.initStudent(1)
  await store.loadProfile(1)
  student.value = store.currentStudent
  profile.value = store.profile
  masteryList.value = store.profile?.mastery_details || []
  wrongQuestions.value = store.profile?.wrong_questions || []
  loading.value = false
}

onMounted(loadData)
watch(() => route.path, (newPath) => {
  if (newPath === '/profile') loadData()
})
</script>

<style scoped>
.text-danger { color: var(--danger); }

.mastery-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--gray-100);
}
.mastery-item:last-child { border-bottom: none; }

.progress-bar {
  height: 8px;
  background: var(--gray-100);
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill { height: 100%; border-radius: 4px; }
.bg-success { background: var(--success); }
.bg-warning { background: var(--warning); }
.bg-danger { background: var(--danger); }

.update-source { color: var(--gray-500); }

.trend-item {
  text-align: center;
  padding: 16px;
  background: var(--gray-50);
  border-radius: 8px;
}
.trend-label {
  color: var(--gray-600);
  font-size: 14px;
  margin-bottom: 8px;
}
.trend-value {
  font-size: 24px;
  font-weight: 700;
}

.wrong-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--gray-100);
}
.wrong-item:last-child { border-bottom: none; }
</style>
