<template>
  <div class="todo-list">
    <div class="page-header">
      <div class="header-left">
        <h2>待办事项</h2>
        <p>查看和处理分配给您的待办任务</p>
      </div>
    </div>

    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-item">
          <label>状态筛选</label>
          <select v-model="filters.status" @change="applyFilters">
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="in_progress">处理中</option>
            <option value="completed">已完成</option>
          </select>
        </div>
        <div class="filter-item">
          <label>优先级</label>
          <select v-model="filters.priority" @change="applyFilters">
            <option value="">全部优先级</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>
      </div>
    </div>

    <div class="loading-state" v-if="loading">
      <p>加载中...</p>
    </div>

    <div class="empty-state" v-else-if="todos.length === 0">
      <p>暂无待办事项</p>
    </div>

    <div class="todo-cards" v-else>
      <div
        v-for="todo in todos"
        :key="todo.id"
        class="todo-card"
        :class="{
          'status-pending': todo.status === 'pending',
          'status-progress': todo.status === 'in_progress',
          'status-completed': todo.status === 'completed',
        }"
      >
        <div class="todo-header">
          <span
            class="status-badge"
            :style="{
              backgroundColor: getStatusBgColor(todo.status),
              color: getStatusColor(todo.status),
            }"
          >
            {{ getStatusDisplay(todo.status) }}
          </span>
          <span
            class="priority-badge"
            :style="{
              backgroundColor: getPriorityBgColor(todo.priority),
              color: getPriorityColor(todo.priority),
            }"
          >
            {{ getPriorityDisplay(todo.priority) }}
          </span>
        </div>
        <h3 class="todo-title">{{ todo.title }}</h3>
        <p class="todo-description" v-if="todo.description">{{ todo.description }}</p>
        <div class="todo-meta">
          <div class="meta-item">
            <span class="meta-label">关联节点</span>
            <span class="meta-value">{{ todo.relatedNodeDisplay || '-' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">创建时间</span>
            <span class="meta-value">{{ formatDate(todo.createdAt) }}</span>
          </div>
          <div class="meta-item" v-if="todo.startedAt">
            <span class="meta-label">开始时间</span>
            <span class="meta-value">{{ formatDate(todo.startedAt) }}</span>
          </div>
          <div class="meta-item" v-if="todo.completedAt">
            <span class="meta-label">完成时间</span>
            <span class="meta-value">{{ formatDate(todo.completedAt) }}</span>
          </div>
        </div>
        <div class="todo-actions" v-if="todo.status !== 'completed'">
          <button
            class="btn-start"
            v-if="todo.status === 'pending'"
            @click="handleStartTodo(todo.id)"
          >
            开始处理
          </button>
          <button
            class="btn-complete"
            v-if="todo.status === 'in_progress'"
            @click="handleCompleteTodo(todo.id)"
          >
            标记完成
          </button>
        </div>
      </div>
    </div>

    <div class="pagination" v-if="total > 0">
      <span class="pagination-info">共 {{ total }} 条记录</span>
      <div class="pagination-actions">
        <button :disabled="page <= 1" @click="changePage(page - 1)">上一页</button>
        <span class="page-info">第 {{ page }} 页</span>
        <button :disabled="page * pageSize >= total" @click="changePage(page + 1)">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { systemApi } from '@/api';

const loading = ref(true);
const todos = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);

const filters = reactive({
  status: '',
  priority: '',
});

const statusMap: Record<string, { display: string; color: string; bgColor: string }> = {
  pending: { display: '待处理', color: '#faad14', bgColor: '#fffbe6' },
  in_progress: { display: '处理中', color: '#1890ff', bgColor: '#e6f7ff' },
  completed: { display: '已完成', color: '#52c41a', bgColor: '#f6ffed' },
};

const priorityMap: Record<string, { display: string; color: string; bgColor: string }> = {
  high: { display: '高优先级', color: '#ff4d4f', bgColor: '#fff2f0' },
  medium: { display: '中优先级', color: '#faad14', bgColor: '#fffbe6' },
  low: { display: '低优先级', color: '#8c8c8c', bgColor: '#fafafa' },
};

function getStatusDisplay(status: string): string {
  return statusMap[status]?.display || status;
}

function getStatusColor(status: string): string {
  return statusMap[status]?.color || '#8c8c8c';
}

function getStatusBgColor(status: string): string {
  return statusMap[status]?.bgColor || '#fafafa';
}

function getPriorityDisplay(priority: string): string {
  return priorityMap[priority]?.display || priority;
}

function getPriorityColor(priority: string): string {
  return priorityMap[priority]?.color || '#8c8c8c';
}

function getPriorityBgColor(priority: string): string {
  return priorityMap[priority]?.bgColor || '#fafafa';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function loadTodos() {
  loading.value = true;
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
    };
    if (filters.status) {
      params.status = filters.status;
    }
    if (filters.priority) {
      params.priority = filters.priority;
    }

    const result = await systemApi.getTodos(params);
    todos.value = result?.data?.items || [];
    total.value = result?.data?.total || 0;
  } catch (error) {
    console.error('加载待办事项失败:', error);
    todos.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  page.value = 1;
  loadTodos();
}

function changePage(newPage: number) {
  page.value = newPage;
  loadTodos();
}

async function handleStartTodo(todoId: string) {
  try {
    await systemApi.startTodo(todoId);
    alert('已开始处理');
    loadTodos();
  } catch (error: any) {
    alert('操作失败: ' + (error.message || '未知错误'));
  }
}

async function handleCompleteTodo(todoId: string) {
  const note = prompt('输入完成备注（可选）:');
  try {
    await systemApi.completeTodo(todoId, note ? { completionNote: note } : undefined);
    alert('待办已完成');
    loadTodos();
  } catch (error: any) {
    alert('操作失败: ' + (error.message || '未知错误'));
  }
}

onMounted(() => {
  loadTodos();
});
</script>

<style scoped>
.todo-list {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 8px 0;
}

.page-header p {
  color: #8c8c8c;
  margin: 0;
}

.filter-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filter-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-item label {
  font-size: 13px;
  color: #8c8c8c;
}

.filter-item select {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  min-width: 160px;
  font-size: 14px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 48px;
  color: #8c8c8c;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.todo-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.todo-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #d9d9d9;
  transition: box-shadow 0.2s;
}

.todo-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.todo-card.status-pending {
  border-left-color: #faad14;
}

.todo-card.status-progress {
  border-left-color: #1890ff;
}

.todo-card.status-completed {
  border-left-color: #52c41a;
  opacity: 0.8;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.status-badge,
.priority-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.todo-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 8px 0;
}

.todo-description {
  color: #595959;
  font-size: 14px;
  margin: 0 0 16px 0;
  line-height: 1.6;
}

.todo-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-size: 12px;
  color: #8c8c8c;
}

.meta-value {
  font-size: 13px;
  color: #262626;
  font-weight: 500;
}

.todo-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.btn-start {
  padding: 8px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.btn-start:hover {
  opacity: 0.9;
}

.btn-complete {
  padding: 8px 20px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.btn-complete:hover {
  opacity: 0.9;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.pagination-info {
  color: #8c8c8c;
  font-size: 14px;
}

.pagination-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-info {
  color: #262626;
  font-weight: 500;
}

.pagination-actions button {
  padding: 6px 16px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.pagination-actions button:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
}

.pagination-actions button:disabled {
  color: #d9d9d9;
  cursor: not-allowed;
}
</style>
