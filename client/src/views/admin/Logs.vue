<template>
  <div class="container">
    <div class="page-header">
      <h1 class="page-title">操作日志</h1>
    </div>

    <div class="card">
      <div class="flex gap-16 mb-24" style="flex-wrap: wrap;">
        <div class="form-group" style="margin-bottom: 0; min-width: 150px;">
          <select v-model="searchForm.module" class="form-input">
            <option value="">全部模块</option>
            <option value="认证">认证</option>
            <option value="用户">用户</option>
            <option value="管理员">管理员</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 0; min-width: 150px;">
          <select v-model="searchForm.operation" class="form-input">
            <option value="">全部操作</option>
            <option value="注册">注册</option>
            <option value="登录">登录</option>
            <option value="登出">登出</option>
            <option value="更新资料">更新资料</option>
            <option value="修改密码">修改密码</option>
            <option value="创建用户">创建用户</option>
            <option value="更新用户">更新用户</option>
            <option value="调整用户状态">调整用户状态</option>
            <option value="删除用户">删除用户</option>
          </select>
        </div>
        <div class="flex gap-8">
          <button class="btn btn-primary" @click="handleSearch">搜索</button>
          <button class="btn btn-default" @click="handleReset">重置</button>
        </div>
      </div>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>操作人</th>
              <th>模块</th>
              <th>操作类型</th>
              <th>详情</th>
              <th>IP地址</th>
              <th>操作时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td>{{ log.user?.account || log.userId }}</td>
              <td>{{ log.module }}</td>
              <td>
                <span class="badge" :class="getOperationBadgeClass(log.operation)">
                  {{ log.operation }}
                </span>
              </td>
              <td style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" :title="log.detail || ''">
                {{ log.detail || '-' }}
              </td>
              <td>{{ log.ipAddress || '-' }}</td>
              <td>{{ formatDate(log.createdAt) }}</td>
            </tr>
            <tr v-if="logs.length === 0">
              <td colspan="6" class="text-center" style="color: var(--text-secondary);">
                暂无日志数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="total > 0">
        <button class="pagination-btn" :disabled="page <= 1" @click="changePage(page - 1)">上一页</button>
        <span style="color: var(--text-secondary);">第 {{ page }} 页 / 共 {{ totalPages }} 页（{{ total }} 条）</span>
        <button class="pagination-btn" :disabled="page >= totalPages" @click="changePage(page + 1)">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { get } from '@/utils/request';
import type { OperationLog, PageResponse } from '@/types';

const logs = ref<OperationLog[]>([]);
const page = ref(1);
const pageSize = 20;
const total = ref(0);
const error = ref('');

const searchForm = reactive({
  module: '',
  operation: '',
});

const totalPages = computed(() => Math.ceil(total.value / pageSize) || 1);

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
}

function getOperationBadgeClass(operation: string): string {
  if (['删除用户'].includes(operation)) {
    return 'badge-error';
  }
  if (['创建用户', '注册', '登录'].includes(operation)) {
    return 'badge-success';
  }
  return 'badge-warning';
}

async function loadLogs() {
  error.value = '';
  const params: Record<string, unknown> = {
    page: page.value,
    pageSize,
  };

  if (searchForm.module) {
    params.module = searchForm.module;
  }

  if (searchForm.operation) {
    params.operation = searchForm.operation;
  }

  const response = await get<PageResponse<OperationLog>>('/admin/operation-logs', params);
  
  if (response.success && response.data) {
    logs.value = response.data.list;
    total.value = response.data.total;
  } else {
    error.value = response.message;
  }
}

function handleSearch() {
  page.value = 1;
  loadLogs();
}

function handleReset() {
  searchForm.module = '';
  searchForm.operation = '';
  page.value = 1;
  loadLogs();
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
.table-wrapper {
  overflow-x: auto;
}
</style>
