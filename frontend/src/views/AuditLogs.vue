<template>
  <div class="audit-logs">
    <div class="page-header">
      <h2>审计日志</h2>
      <p>查看系统操作审计记录</p>
    </div>

    <div class="loading-state" v-if="loading">
      <p>加载中...</p>
    </div>

    <div class="empty-state" v-else-if="logs.length === 0">
      <p>暂无审计日志</p>
    </div>

    <div class="logs-container" v-else>
      <div class="logs-table">
        <table>
          <thead>
            <tr>
              <th style="width: 180px">操作时间</th>
              <th style="width: 120px">操作人</th>
              <th style="width: 100px">操作类型</th>
              <th style="width: 100px">级别</th>
              <th style="width: 120px">实体类型</th>
              <th style="width: 150px">实体ID</th>
              <th>操作描述</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td>{{ formatDate(log.createdAt) }}</td>
              <td>{{ log.operatorName || '-' }}</td>
              <td>
                <span
                  class="action-badge"
                  :style="{
                    backgroundColor: getActionBgColor(log.action),
                    color: getActionColor(log.action),
                  }"
                >
                  {{ log.actionDisplay || log.action }}
                </span>
              </td>
              <td>
                <span
                  class="level-badge"
                  :style="{
                    backgroundColor: getLevelBgColor(log.level),
                    color: getLevelColor(log.level),
                  }"
                >
                  {{ log.level }}
                </span>
              </td>
              <td>{{ log.entityType || '-' }}</td>
              <td class="entity-id">{{ log.entityId || '-' }}</td>
              <td>{{ log.description || '-' }}</td>
            </tr>
          </tbody>
        </table>
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
import { ref, onMounted } from 'vue';
import { systemApi } from '@/api';

const loading = ref(true);
const logs = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);

const actionConfig: Record<string, { color: string; bgColor: string }> = {
  create: { color: '#52c41a', bgColor: '#f6ffed' },
  update: { color: '#1890ff', bgColor: '#e6f7ff' },
  delete: { color: '#ff4d4f', bgColor: '#fff2f0' },
  approve: { color: '#722ed1', bgColor: '#f9f0ff' },
  reject: { color: '#ff4d4f', bgColor: '#fff2f0' },
  cancel: { color: '#8c8c8c', bgColor: '#fafafa' },
  export: { color: '#13c2c2', bgColor: '#e6fffb' },
  import: { color: '#faad14', bgColor: '#fffbe6' },
  login: { color: '#1890ff', bgColor: '#e6f7ff' },
  logout: { color: '#8c8c8c', bgColor: '#fafafa' },
  correct: { color: '#eb2f96', bgColor: '#fff0f6' },
  reopen: { color: '#2f54eb', bgColor: '#f0f5ff' },
};

const levelConfig: Record<string, { color: string; bgColor: string }> = {
  info: { color: '#1890ff', bgColor: '#e6f7ff' },
  warning: { color: '#faad14', bgColor: '#fffbe6' },
  error: { color: '#ff4d4f', bgColor: '#fff2f0' },
  critical: { color: '#cf1322', bgColor: '#fff1f0' },
};

function getActionColor(action: string): string {
  return actionConfig[action]?.color || '#8c8c8c';
}

function getActionBgColor(action: string): string {
  return actionConfig[action]?.bgColor || '#fafafa';
}

function getLevelColor(level: string): string {
  return levelConfig[level]?.color || '#8c8c8c';
}

function getLevelBgColor(level: string): string {
  return levelConfig[level]?.bgColor || '#fafafa';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

async function loadLogs() {
  loading.value = true;
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
    };

    const result = await systemApi.getAuditLogs(params);
    logs.value = result?.data?.items || [];
    total.value = result?.data?.total || 0;
  } catch (error) {
    console.error('加载审计日志失败:', error);
    logs.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function changePage(newPage: number) {
  page.value = newPage;
  loadLogs();
}

onMounted(() => {
  loadLogs();
});
</script>

<style scoped>
.audit-logs {
  max-width: 1200px;
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

.loading-state,
.empty-state {
  text-align: center;
  padding: 48px;
  color: #8c8c8c;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.logs-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.logs-table {
  overflow-x: auto;
}

.logs-table table {
  width: 100%;
  border-collapse: collapse;
}

.logs-table th {
  padding: 16px 12px;
  background: #fafafa;
  text-align: left;
  font-weight: 600;
  color: #262626;
  font-size: 13px;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
}

.logs-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #262626;
  vertical-align: top;
}

.logs-table tbody tr:hover {
  background: #fafafa;
}

.action-badge,
.level-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.entity-id {
  font-family: monospace;
  font-size: 13px;
  color: #667eea;
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
