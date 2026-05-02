<template>
  <div class="reports-page">
    <h2>报表分析</h2>
    <p class="page-desc">查看折旧汇总、盘点历史、操作日志</p>
    
    <div class="report-tabs">
      <button 
        :class="['tab-btn', { active: activeTab === 'depreciation' }]"
        @click="activeTab = 'depreciation'"
      >
        折旧汇总
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'inventory' }]"
        @click="activeTab = 'inventory'"
      >
        盘点历史
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'logs' }]"
        @click="activeTab = 'logs'"
      >
        操作日志
      </button>
    </div>
    
    <div v-if="activeTab === 'depreciation'" class="report-section">
      <div v-if="depreciationSummary" class="summary-cards">
        <div class="summary-card">
          <label>资产原值</label>
          <span class="value">{{ formatCurrency(depreciationSummary.totalOriginalValue) }}</span>
        </div>
        <div class="summary-card">
          <label>累计折旧</label>
          <span class="value">{{ formatCurrency(depreciationSummary.totalAccumulatedDepreciation) }}</span>
        </div>
        <div class="summary-card">
          <label>净值</label>
          <span class="value">{{ formatCurrency(depreciationSummary.totalNetValue) }}</span>
        </div>
      </div>
      
      <table class="data-table">
        <thead>
          <tr>
            <th>资产编号</th>
            <th>资产名称</th>
            <th>类型</th>
            <th>原值</th>
            <th>累计折旧</th>
            <th>净值</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in depreciationList" :key="item.id">
            <td>{{ item.assetCode }}</td>
            <td>{{ item.assetName }}</td>
            <td>{{ item.assetType }}</td>
            <td>{{ formatCurrency(item.totalPrice) }}</td>
            <td>{{ formatCurrency(item.accumulatedDepreciation) }}</td>
            <td>{{ formatCurrency(item.netValue) }}</td>
            <td>
              <span :class="['status-badge', getStatusClass(item.status)]">
                {{ getStatusLabel(item.status) }}
              </span>
            </td>
          </tr>
          <tr v-if="depreciationList.length === 0">
            <td colspan="8" class="empty-cell">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-else-if="activeTab === 'inventory'" class="report-section">
      <div v-if="resultCounts.length > 0" class="result-stats">
        <span 
          v-for="item in resultCounts" 
          :key="item.inventoryResult" 
          :class="['result-badge', `result-${item.inventoryResult.toLowerCase()}`]"
        >
          {{ getInventoryResultLabel(item.inventoryResult) }}: {{ item.count }}
        </span>
      </div>
      
      <table class="data-table">
        <thead>
          <tr>
            <th>资产编号</th>
            <th>资产名称</th>
            <th>盘点日期</th>
            <th>盘点人</th>
            <th>系统数量</th>
            <th>实际数量</th>
            <th>差异</th>
            <th>结果</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in inventoryHistory" :key="item.id">
            <td>{{ item.assetCode }}</td>
            <td>{{ item.assetName }}</td>
            <td>{{ formatDate(item.inventoryDate) }}</td>
            <td>{{ item.inventoryByName || '-' }}</td>
            <td>{{ item.systemQuantity }}</td>
            <td>{{ item.actualQuantity }}</td>
            <td :class="{ 'text-danger': item.difference !== 0 }">{{ item.difference }}</td>
            <td>
              <span :class="['result-badge', `result-${item.inventoryResult.toLowerCase()}`]">
                {{ getInventoryResultLabel(item.inventoryResult) }}
              </span>
            </td>
          </tr>
          <tr v-if="inventoryHistory.length === 0">
            <td colspan="8" class="empty-cell">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-else class="report-section">
      <table class="data-table">
        <thead>
          <tr>
            <th>操作时间</th>
            <th>操作人</th>
            <th>操作类型</th>
            <th>原状态</th>
            <th>新状态</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in operationLogs" :key="item.id">
            <td>{{ formatDate(item.createdAt) }}</td>
            <td>{{ item.userName || '-' }}</td>
            <td>{{ item.action }}</td>
            <td>{{ item.previousStatus ? getStatusLabel(item.previousStatus) : '-' }}</td>
            <td>{{ item.newStatus ? getStatusLabel(item.newStatus) : '-' }}</td>
            <td>{{ item.remarks || '-' }}</td>
          </tr>
          <tr v-if="operationLogs.length === 0">
            <td colspan="6" class="empty-cell">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { AssetStatus } from '@/types';
import { AssetStatusLabels } from '@/types';
import { reportApi } from '@/api';
import dayjs from 'dayjs';

const activeTab = ref<'depreciation' | 'inventory' | 'logs'>('depreciation');

const depreciationSummary = ref<{
  totalOriginalValue: number;
  totalAccumulatedDepreciation: number;
  totalNetValue: number;
} | null>(null);

const depreciationList = ref<Array<{
  id: string;
  assetCode: string;
  assetName: string;
  assetType: string;
  totalPrice: number;
  status: AssetStatus;
  accumulatedDepreciation: number;
  netValue: number;
}>>([]);

const resultCounts = ref<Array<{ inventoryResult: string; count: number }>>([]);
const inventoryHistory = ref<Array<{
  id: string;
  assetCode: string;
  assetName: string;
  inventoryDate: string;
  inventoryByName: string;
  systemQuantity: number;
  actualQuantity: number;
  difference: number;
  inventoryResult: string;
}>>([]);

const operationLogs = ref<Array<{
  id: string;
  createdAt: string;
  userName: string;
  action: string;
  previousStatus: string;
  newStatus: string;
  remarks: string;
}>>([]);

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
    'IN_USE': 'status-success',
    'IN_DEPRECIATION': 'status-info',
    'TRANSFERRED': 'status-info',
    'SCRAPPED': 'status-danger'
  };
  return classes[status] || 'status-waiting';
};

const getInventoryResultLabel = (result: string) => {
  const labels: Record<string, string> = {
    'NORMAL': '正常',
    'MISSING': '缺失',
    'DAMAGED': '损坏',
    'TRANSFERRED': '已调拨'
  };
  return labels[result] || result;
};

const loadDepreciation = async () => {
  try {
    const result = await reportApi.getDepreciationSummary({ page: 1, pageSize: 100 });
    if (result.success && result.data) {
      depreciationSummary.value = result.data.summary;
      depreciationList.value = result.data.list;
    }
  } catch (error) {
    console.error('Load depreciation error:', error);
  }
};

const loadInventoryHistory = async () => {
  try {
    const result = await reportApi.getInventoryHistory({ page: 1, pageSize: 100 });
    if (result.success && result.data) {
      resultCounts.value = result.data.resultCounts;
      inventoryHistory.value = result.data.list;
    }
  } catch (error) {
    console.error('Load inventory history error:', error);
  }
};

const loadOperationLogs = async () => {
  try {
    const result = await reportApi.getOperationLogs({ page: 1, pageSize: 100 });
    if (result.success && result.data) {
      operationLogs.value = result.data.list;
    }
  } catch (error) {
    console.error('Load operation logs error:', error);
  }
};

watch(activeTab, (newTab) => {
  if (newTab === 'depreciation') {
    loadDepreciation();
  } else if (newTab === 'inventory') {
    loadInventoryHistory();
  } else {
    loadOperationLogs();
  }
});

onMounted(() => {
  loadDepreciation();
});
</script>

<style scoped>
.reports-page {
  padding: 20px;
}

.reports-page h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.page-desc {
  color: #888;
  margin-bottom: 24px;
}

.report-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.tab-btn {
  padding: 12px 24px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.report-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.summary-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.summary-card label {
  display: block;
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
}

.summary-card .value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 14px 16px;
  background: #f8fafc;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  color: #333;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
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

.status-waiting {
  background: #fef3c7;
  color: #d97706;
}

.text-danger {
  color: #dc2626;
  font-weight: 600;
}

.result-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.result-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.result-normal {
  background: #d1fae5;
  color: #059669;
}

.result-missing {
  background: #fee2e2;
  color: #dc2626;
}

.result-damaged {
  background: #fef3c7;
  color: #d97706;
}

.result-transferred {
  background: #dbeafe;
  color: #2563eb;
}

.empty-cell {
  text-align: center;
  color: #999;
  padding: 40px 0 !important;
}
</style>
