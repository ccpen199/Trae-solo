<template>
  <div class="teacher-container">
    <div class="page-header">
      <h1 class="page-title">👨‍🏫 教师后台</h1>
      <p class="page-subtitle">查看学生学习情况，管理班级</p>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ students.length }}</div>
          <div class="stat-label">学生总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎮</div>
        <div class="stat-info">
          <div class="stat-value">{{ totalGames }}</div>
          <div class="stat-label">完成游戏</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⭐</div>
        <div class="stat-info">
          <div class="stat-value">{{ avgScore }}</div>
          <div class="stat-label">平均积分</div>
        </div>
      </div>
    </div>
    
    <div class="content-section">
      <h2 class="section-title">📊 学生排行榜</h2>
      <div class="student-list">
        <div 
          v-for="(student, index) in sortedStudents" 
          :key="student.id"
          class="student-card"
        >
          <div class="rank-badge">
            {{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '#' + (index + 1) }}
          </div>
          <div class="student-avatar">{{ student.avatar }}</div>
          <div class="student-info">
            <div class="student-name">{{ student.nickname }}</div>
            <div class="student-stats">
              <span class="game-count">{{ student.game_count || 0 }} 场游戏</span>
              <span class="highest-score" v-if="student.highest_score">
                最高分: {{ student.highest_score }}
              </span>
            </div>
          </div>
          <div class="student-score">
            <div class="score-label">总积分</div>
            <div class="score-value">{{ student.total_score }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="content-section">
      <h2 class="section-title">🎯 快速操作</h2>
      <div class="action-grid">
        <div class="action-card">
          <div class="action-icon">📋</div>
          <h3>创建任务</h3>
          <p>布置学习任务给学生</p>
        </div>
        <div class="action-card">
          <div class="action-icon">🏆</div>
          <h3>发起比赛</h3>
          <p>组织学生进行比赛</p>
        </div>
        <div class="action-card">
          <div class="action-icon">📈</div>
          <h3>查看报告</h3>
          <p>查看学生学习报告</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { userApi } from '@/utils/api'

const students = ref([])

const sortedStudents = computed(() => {
  return [...students.value].sort((a, b) => b.total_score - a.total_score)
})

const totalGames = computed(() => {
  return students.value.reduce((sum, s) => sum + (s.game_count || 0), 0)
})

const avgScore = computed(() => {
  if (students.value.length === 0) return 0
  const sum = students.value.reduce((sum, s) => sum + s.total_score, 0)
  return Math.round(sum / students.value.length)
})

const loadStudents = async () => {
  try {
    const response = await userApi.getStudents()
    students.value = response.data
  } catch (err) {
    console.error('加载学生列表失败:', err)
  }
}

onMounted(() => {
  loadStudents()
})
</script>

<style scoped>
.teacher-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  text-align: center;
  padding: 24px;
  background: rgba(255,255,255,0.95);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 16px;
  color: #888;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: rgba(255,255,255,0.95);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.stat-icon {
  font-size: 36px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #888;
}

.content-section {
  background: rgba(255,255,255,0.95);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 20px;
}

.student-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.student-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: background 0.3s ease;
}

.student-card:hover {
  background: #e8f0ff;
}

.rank-badge {
  font-size: 24px;
  width: 40px;
  text-align: center;
}

.student-avatar {
  font-size: 36px;
}

.student-info {
  flex: 1;
}

.student-name {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.student-stats {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #888;
  margin-top: 4px;
}

.student-score {
  text-align: right;
}

.student-score .score-label {
  font-size: 12px;
  color: #888;
}

.student-score .score-value {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.action-card {
  padding: 24px;
  background: #f8f9fa;
  border-radius: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-card:hover {
  background: #e8f0ff;
  transform: translateY(-4px);
}

.action-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.action-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.action-card p {
  font-size: 13px;
  color: #888;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .action-grid {
    grid-template-columns: 1fr;
  }
  
  .student-card {
    flex-wrap: wrap;
  }
  
  .student-score {
    text-align: left;
  }
}
</style>
