<template>
  <div class="asset-list-page">
    <div class="filter-bar">
      <div class="search-box">
        <input 
          v-model="filters.keyword" 
          type="text" 
          placeholder="搜索资产编号、名称..."
          @keyup.enter="loadAssets"
        />
        <button @click="loadAssets">搜索</button>
      </div>
      
      <select v-model="filters.status" @change="loadAssets">
        <option value="">全部状态</option>
        <option value="PENDING_REGISTER">待入账</option>
        <option value="PENDING_RECEIVE">待领用</option>
        <option value="PENDING_DEPRECIATION">待折旧</option>
        <option value="PENDING_INVENTORY">待盘点</option>
        <option value="IN_USE">使用中</option>
        <option value="TRANSFERRED">已调拨</option>
        <option value="SCRAPPED">已报废</option>
      </select>
      
      <router-link to="/register" class="add-btn">
        ➕ 新增资产
      </router-link>
    </div>
    
    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>主单号</th>
            <th>状态</th>
            <th>资产数</th>
            <th>总金额</th>
            <th>当前处理人</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="asset in assets" :key="asset.id">
            <td>{{ asset.masterNo }}</td>
            <td>
              <span :class="['status-badge', getStatusClass(asset.status)]">
                {{ getStatusLabel(asset.status) }}
              </span>
            </td>
            <td>{{ asset.detailCount || 0 }}</td>
            <td>{{ formatCurrency(asset.totalAmount || 0) }}</td>
            <td>{{ asset.handlerName || '-' }}</td>
            <td>{{ formatDate(asset.createdAt) }}</td>
            <td>
              <router-link :to="`/assets/${asset.id}`" class="view-btn">
                详情
              </router-link>
            </td>
          </tr>
          <tr v-if="!loading && assets.length === 0">
            <td colspan="7" class="empty-cell">暂无数据</td>
          </tr>
          <tr v-if="loading">
            <td colspan="7" class="loading-cell">加载中...</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-if="pagination && pagination.totalPages > 1" class="pagination">
      <button 
        :disabled="pagination.page <= 1" 
        @click="goToPage(pagination.page - 1)"
      >
        上一页
      </button>
      <span>第 {{ pagination.page }} / {{ pagination.totalPages }} 页</span>
      <button 
        :disabled="pagination.page >= pagination.totalPages" 
        @click="goToPage(pagination.page + 1)"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { AssetMaster, AssetStatus } from '@/types';
import { AssetStatusLabels } from '@/types';
import { assetApi } from '@/api';
import dayjs from 'dayjs';

const router = useRouter();

const loading = ref(false);
const assets = ref<AssetMaster[]>([]);
const pagination = ref<{
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
} | null>(null);

const filters = reactive({
  keyword: '',
  status: ''
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(value);
};

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

const getStatusLabel = (status: string) => {
  return AssetStatusLabels[status as AssetStatus] || status;
};

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    'PENDING_REGISTER': 'status-waiting',
    'PENDING_RECEIVE': 'status-waiting',
    'PENDING_DEPRECIATION': 'status-waiting',
    'PENDING_INVENTORY': 'status-waiting',
    'PENDING_TRANSFER': 'status-waiting',
    'PENDING_SCRAP': 'status-waiting',
    'IN_USE': 'status-success',
    'IN_DEPRECIATION': 'status-info',
    'TRANSFERRED': 'status-info',
    'SCRAPPED': 'status-danger',
    'REJECTED': 'status-danger',
    'CANCELLED': 'status-danger'
  };
  return classes[status] || 'status-waiting';
};

const loadAssets = async () => {
  loading.value = true;
  try {
    const result = await assetApi.getList({
      page: pagination.value?.page || 1,
      pageSize: 20,
      status: filters.status || undefined,
      keyword: filters.keyword || undefined
    });
    
    if (result.success && result.data) {
      assets.value = result.data.list;
      pagination.value = result.data.pagination;
    }
  } catch (error) {
    console.error('Load assets error:', error);
  } finally {
    loading.value = false;
  }
};

const goToPage = (page: number) => {
  if (pagination.value) {
    pagination.value.page = page;
    loadAssets();
  }
};

onMounted(() => {
  pagination.value = {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  };
  loadAssets();
});
</script>

<style scoped>
.asset-list-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-box {
  display: flex;
  gap: 8px;
}

.search-box input {
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  width: 300px;
}

.search-box input:focus {
  border-color: #667eea;
  outline: none;
}

.search-box button {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border-radius: 6px;
  font-size: 14px;
  transition: opacity 0.2s;
}

.search-box button:hover {
  opacity: 0.9;
}

.filter-bar select {
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.add-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 6px;
  font-size: 14px;
  margin-left: auto;
  transition: opacity 0.2s;
}

.add-btn:hover {
  opacity: 0.9;
}

.table-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 14px 20px;
  background: #f8fafc;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  color: #333;
}

.data-table tr:hover td {
  background: #f8fafc;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-waiting {
  background: #fef3c7;
  color: #d97706;
}

.status-success {
  background: #d1fae5;
  color: #059669;
}

.status-info {
  background: #dbeafe;
  color: #2563eb;
}

.status-danger {
  background: #fee2e2;
  color: #dc2626;
}

.view-btn {
  padding: 6px 16px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 4px;
  font-size: 13px;
  transition: all 0.2s;
}

.view-btn:hover {
  background: #e2e8f0;
  color: #334155;
}

.empty-cell, .loading-cell {
  text-align: center;
  color: #999;
  padding: 40px 0 !important;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.pagination button {
  padding: 8px 16px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.pagination button:hover:not(:disabled) {
  background: #e2e8f0;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination span {
  font-size: 14px;
  color: #666;
}
</style>
