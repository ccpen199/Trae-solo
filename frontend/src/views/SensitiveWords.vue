<template>
  <div class="sensitive-page">
    <div class="toolbar">
      <div class="title">敏感词管理</div>
      <div class="add-form">
        <input v-model="newWord.word" placeholder="敏感词" />
        <select v-model="newWord.severity">
          <option :value="1">轻度</option>
          <option :value="2">中度</option>
          <option :value="3">严重</option>
        </select>
        <input v-model="newWord.category" placeholder="分类" />
        <button class="btn-primary" @click="addWord">添加</button>
      </div>
    </div>

    <div class="word-list">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>敏感词</th>
            <th>严重程度</th>
            <th>分类</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="w in words" :key="w.id">
            <td>{{ w.id }}</td>
            <td>{{ w.word }}</td>
            <td>
              <span class="severity-badge" :class="'severity-' + w.severity">
                {{ severityText(w.severity) }}
              </span>
            </td>
            <td>{{ w.category || '-' }}</td>
            <td>{{ formatTime(w.created_at) }}</td>
            <td>
              <button class="btn-delete" @click="deleteWord(w.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { sensitiveWordApi } from '../api'

const words = ref([])
const newWord = ref({ word: '', severity: 1, category: '' })

const loadWords = async () => {
  try {
    const res = await sensitiveWordApi.list()
    words.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const addWord = async () => {
  if (!newWord.value.word) {
    alert('请输入敏感词')
    return
  }
  try {
    await sensitiveWordApi.create(newWord.value)
    newWord.value = { word: '', severity: 1, category: '' }
    loadWords()
  } catch (e) {
    alert(e.response?.data?.error || '添加失败')
  }
}

const deleteWord = async (id) => {
  if (!confirm('确定要删除此敏感词吗？')) return
  try {
    await sensitiveWordApi.delete(id)
    loadWords()
  } catch (e) {
    alert('删除失败')
  }
}

const severityText = (s) => {
  const map = { 1: '轻度', 2: '中度', 3: '严重' }
  return map[s] || s
}

const formatTime = (t) => {
  if (!t) return '-'
  return new Date(t).toLocaleDateString('zh-CN')
}

onMounted(loadWords)
</script>

<style scoped>
.sensitive-page { height: 100%; }
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.title { font-size: 18px; font-weight: 600; color: #1e293b; }
.add-form { display: flex; gap: 8px; }
.add-form input, .add-form select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
}
.btn-primary {
  padding: 8px 16px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.word-list {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
}
table { width: 100%; border-collapse: collapse; }
th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
}
th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
}
.severity-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.severity-1 { background: #dcfce7; color: #166534; }
.severity-2 { background: #fef3c7; color: #92400e; }
.severity-3 { background: #fee2e2; color: #991b1b; }
.btn-delete {
  padding: 4px 10px;
  background: #fee2e2;
  color: #991b1b;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
</style>
