<template>
  <div class="resource-manage">
    <div class="flex justify-between items-center mb-6">
      <h2>📚 资源管理</h2>
      <button @click="showAddModal = true" class="btn btn-primary">添加资源</button>
    </div>

    <div class="card mb-6">
      <div class="flex gap-4 mb-4">
        <input 
          v-model="searchKeyword" 
          placeholder="搜索资源标题..." 
          class="search-input"
        />
        <select v-model="filterType" class="filter-select">
          <option value="">全部类型</option>
          <option value="question">题目</option>
          <option value="course">课程</option>
        </select>
        <select v-model="filterDifficulty" class="filter-select">
          <option value="">全部难度</option>
          <option value="easy">简单</option>
          <option value="medium">中等</option>
          <option value="hard">困难</option>
        </select>
        <select v-model="filterPool" class="filter-select">
          <option value="">全部状态</option>
          <option value="1">已入推荐池</option>
          <option value="0">未入推荐池</option>
        </select>
      </div>
    </div>

    <div class="card">
      <table class="resource-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>标题</th>
            <th>类型</th>
            <th>难度</th>
            <th>知识点</th>
            <th>推荐池</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filteredResources" :key="r.id">
            <td>{{ r.id }}</td>
            <td>{{ r.title }}</td>
            <td>{{ r.type === 'question' ? '题目' : '课程' }}</td>
            <td>{{ { easy: '简单', medium: '中等', hard: '困难' }[r.difficulty] }}</td>
            <td>
              <span v-for="k in r.knowledge_points?.slice(0, 2)" :key="k" class="kp-tag">{{ k }}</span>
              <span v-if="r.knowledge_points?.length > 2">+{{ r.knowledge_points.length - 2 }}</span>
            </td>
            <td>
              <span :class="['status-tag', r.in_recommendation_pool ? 'status-active' : 'status-inactive']">
                {{ r.in_recommendation_pool ? '已入池' : '未入池' }}
              </span>
            </td>
            <td>
              <button @click="togglePool(r)" class="btn btn-sm btn-outline">
                {{ r.in_recommendation_pool ? '移出' : '入池' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <h3 class="mb-4">添加新资源</h3>
        <div class="form-group">
          <label>资源类型</label>
          <select v-model="newResource.type" class="form-input">
            <option value="question">题目</option>
            <option value="course">课程</option>
          </select>
        </div>
        <div class="form-group">
          <label>标题</label>
          <input v-model="newResource.title" class="form-input" />
        </div>
        <div class="form-group">
          <label>难度</label>
          <select v-model="newResource.difficulty" class="form-input">
            <option value="easy">简单</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </select>
        </div>
        <div class="form-group">
          <label>知识点（逗号分隔）</label>
          <input v-model="newResource.knowledge_input" class="form-input" placeholder="例如：一元二次方程,因式分解" />
        </div>
        <div class="form-group">
          <label>预计耗时（分钟）</label>
          <input type="number" v-model="newResource.estimated_time" class="form-input" />
        </div>
        <div class="form-group" v-if="newResource.type === 'question'">
          <label>题目内容</label>
          <textarea v-model="newResource.content" class="form-input" rows="3"></textarea>
        </div>
        <div class="flex gap-3 mt-6 justify-end">
          <button @click="showAddModal = false" class="btn btn-outline">取消</button>
          <button @click="addResource" class="btn btn-primary">添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:58830'

const resources = ref([])
const searchKeyword = ref('')
const filterType = ref('')
const filterDifficulty = ref('')
const filterPool = ref('')
const showAddModal = ref(false)
const newResource = ref({
  type: 'question',
  title: '',
  difficulty: 'medium',
  knowledge_input: '',
  estimated_time: 5,
  content: ''
})

const filteredResources = computed(() => {
  return resources.value.filter(r => {
    if (searchKeyword.value && !r.title.includes(searchKeyword.value)) return false
    if (filterType.value && r.type !== filterType.value) return false
    if (filterDifficulty.value && r.difficulty !== filterDifficulty.value) return false
    if (filterPool.value !== '' && String(r.in_recommendation_pool) !== filterPool.value) return false
    return true
  })
})

const loadResources = async () => {
  const res = await axios.get(`${API_BASE}/api/resources`)
  resources.value = res.data
}

const togglePool = async (r) => {
  await axios.post(`${API_BASE}/api/resources/${r.id}/toggle-pool`)
  r.in_recommendation_pool = !r.in_recommendation_pool
}

const addResource = async () => {
  const knowledgePoints = newResource.value.knowledge_input.split(',').map(k => k.trim()).filter(Boolean)
  await axios.post(`${API_BASE}/api/resources`, {
    ...newResource.value,
    knowledge_points: knowledgePoints
  })
  showAddModal.value = false
  newResource.value = { type: 'question', title: '', difficulty: 'medium', knowledge_input: '', estimated_time: 5, content: '' }
  await loadResources()
}

onMounted(loadResources)
</script>

<style scoped>
.search-input, .filter-select {
  padding: 10px 14px;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  font-size: 14px;
}
.search-input { flex: 1; }

.resource-table {
  width: 100%;
  border-collapse: collapse;
}
.resource-table th, .resource-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--gray-100);
}
.resource-table th {
  background: var(--gray-50);
  font-weight: 600;
}

.kp-tag {
  display: inline-block;
  padding: 2px 8px;
  background: var(--gray-100);
  border-radius: 10px;
  font-size: 12px;
  margin-right: 4px;
}

.status-tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.status-active { background: #dcfce7; color: #166534; }
.status-inactive { background: var(--gray-100); color: var(--gray-600); }

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
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}
.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  font-size: 14px;
}
</style>
