<template>
  <div class="users-page">
    <div class="toolbar">
      <div class="title">用户管理</div>
      <div class="filters">
        <input v-model="keyword" @keyup.enter="loadUsers" placeholder="搜索用户名/昵称..." />
        <select v-model="roleFilter" @change="loadUsers">
          <option value="all">全部角色</option>
          <option value="user">普通用户</option>
          <option value="cs">客服</option>
          <option value="moderator">审核员</option>
          <option value="admin">管理员</option>
        </select>
      </div>
    </div>

    <div class="user-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>昵称</th>
            <th>角色</th>
            <th>状态</th>
            <th>注册时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.id }}</td>
            <td>{{ u.username }}</td>
            <td>{{ u.nickname || '-' }}</td>
            <td><span class="role-badge" :class="'role-' + u.role">{{ roleText(u.role) }}</span></td>
            <td><span class="status-badge" :class="'status-' + u.status">{{ statusText(u.status) }}</span></td>
            <td>{{ formatTime(u.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { userApi } from '../api'

const users = ref([])
const keyword = ref('')
const roleFilter = ref('all')

const loadUsers = async () => {
  try {
    const res = await userApi.list({ keyword: keyword.value, role: roleFilter.value, page_size: 100 })
    users.value = res.data.list
  } catch (e) {
    console.error(e)
  }
}

const roleText = (r) => {
  const map = { admin: '管理员', moderator: '审核员', cs: '客服', user: '普通用户' }
  return map[r] || r
}

const statusText = (s) => {
  const map = { active: '正常', banned: '已封禁', muted: '已禁言' }
  return map[s] || s
}

const formatTime = (t) => {
  if (!t) return '-'
  return new Date(t).toLocaleDateString('zh-CN')
}

onMounted(loadUsers)
</script>

<style scoped>
.users-page { height: 100%; }
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.title { font-size: 18px; font-weight: 600; color: #1e293b; }
.filters { display: flex; gap: 8px; }
.filters input, .filters select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
}
.user-table {
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
.role-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.role-admin { background: #fef3c7; color: #92400e; }
.role-moderator { background: #dbeafe; color: #1e40af; }
.role-cs { background: #dcfce7; color: #166534; }
.role-user { background: #f1f5f9; color: #475569; }
.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.status-active { background: #dcfce7; color: #166534; }
.status-banned { background: #fee2e2; color: #991b1b; }
.status-muted { background: #fef3c7; color: #92400e; }
</style>
