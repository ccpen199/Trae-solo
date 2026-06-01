<template>
  <div class="student-manage">
    <h2 class="mb-6">👥 学生管理</h2>
    
    <div class="card">
      <table class="student-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>姓名</th>
            <th>年级</th>
            <th>目标</th>
            <th>掌握率</th>
            <th>练习数</th>
            <th>最近学习</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in students" :key="s.id">
            <td>{{ s.id }}</td>
            <td>{{ s.name }}</td>
            <td>{{ s.grade }}</td>
            <td>{{ s.goal }}</td>
            <td>
              <div class="mastery-cell">
                <div class="progress-bar-small">
                  <div class="progress-fill" :style="{ width: s.mastery_rate + '%', background: s.mastery_rate >= 80 ? '#10b981' : s.mastery_rate >= 50 ? '#f59e0b' : '#ef4444' }"></div>
                </div>
                <span>{{ s.mastery_rate }}%</span>
              </div>
            </td>
            <td>{{ s.total_practices }}</td>
            <td>{{ formatDate(s.last_active) }}</td>
            <td>
              <button @click="viewProfile(s.id)" class="btn btn-sm btn-primary">查看画像</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showProfileModal" class="modal-overlay" @click.self="showProfileModal = false">
      <div class="modal-content modal-large">
        <div class="flex justify-between items-center mb-4">
          <h3>学生学习画像 - {{ selectedStudent?.name }}</h3>
          <button @click="showProfileModal = false" class="btn btn-outline btn-sm">关闭</button>
        </div>
        
        <div class="grid-2 mb-4">
          <div class="card">
            <h4 class="mb-3">基本信息</h4>
            <p><strong>年级：</strong>{{ selectedStudent?.grade }}</p>
            <p><strong>目标：</strong>{{ selectedStudent?.goal }}</p>
          </div>
          <div class="card">
            <h4 class="mb-3">学习统计</h4>
            <p><strong>总练习数：</strong>{{ selectedStudent?.total_practices }}</p>
            <p><strong>正确率：</strong>{{ selectedStudent?.accuracy }}%</p>
          </div>
        </div>

        <div class="card">
          <h4 class="mb-3">知识点掌握</h4>
          <div v-for="m in selectedMastery" :key="m.knowledge_point" class="mastery-item">
            <div class="flex justify-between items-center mb-1">
              <span>{{ m.knowledge_point }}</span>
              <span>{{ (m.level * 100).toFixed(0) }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: (m.level * 100) + '%' }"></div>
            </div>
            <p class="text-sm text-gray mt-1">来源：{{ m.source }}</p>
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

const students = ref([])
const showProfileModal = ref(false)
const selectedStudent = ref(null)
const selectedMastery = ref([])

const formatDate = (d) => d ? new Date(d).toLocaleDateString('zh-CN') : '-'

const loadStudents = async () => {
  const res = await axios.get(`${API_BASE}/api/admin/students`)
  students.value = res.data
}

const viewProfile = async (id) => {
  const [studentRes, masteryRes] = await Promise.all([
    axios.get(`${API_BASE}/api/students/${id}`),
    axios.get(`${API_BASE}/api/students/${id}/profile`)
  ])
  selectedStudent.value = studentRes.data
  selectedMastery.value = masteryRes.data.mastery_details || []
  showProfileModal.value = true
}

onMounted(loadStudents)
</script>

<style scoped>
.student-table {
  width: 100%;
  border-collapse: collapse;
}
.student-table th, .student-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--gray-100);
}
.student-table th {
  background: var(--gray-50);
  font-weight: 600;
}

.mastery-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.progress-bar-small {
  width: 80px;
  height: 6px;
  background: var(--gray-100);
  border-radius: 3px;
  overflow: hidden;
}
.progress-bar-small .progress-fill {
  height: 100%;
  border-radius: 3px;
}

.btn-sm { padding: 6px 12px; font-size: 13px; }

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}
.modal-large { width: 700px; }

.mastery-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--gray-100);
}
.mastery-item:last-child { border-bottom: none; }

.progress-bar {
  height: 6px;
  background: var(--gray-100);
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 3px;
}
</style>
