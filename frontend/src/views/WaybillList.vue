<template>
  <div class="waybill-list">
    <div class="page-header">
      <div class="header-left">
        <h2>运单管理</h2>
        <p>管理所有航空货运运单</p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="goToCreate" v-if="canCreateBooking">
          ➕ 新建订舱
        </button>
      </div>
    </div>

    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-item">
          <label>状态筛选</label>
          <select v-model="filters.status" @change="applyFilters">
            <option value="">全部状态</option>
            <option v-for="(display, status) in STATUS_DISPLAY_MAP" :key="status" :value="status">
              {{ display }}
            </option>
          </select>
        </div>
        <div class="filter-item">
          <label>始发机场</label>
          <select v-model="filters.originAirport" @change="applyFilters">
            <option value="">全部</option>
            <option value="PEK">北京首都 (PEK)</option>
            <option value="SHA">上海虹桥 (SHA)</option>
            <option value="CAN">广州白云 (CAN)</option>
          </select>
        </div>
        <div class="filter-item">
          <label>目的机场</label>
          <select v-model="filters.destinationAirport" @change="applyFilters">
            <option value="">全部</option>
            <option value="PEK">北京首都 (PEK)</option>
            <option value="SHA">上海虹桥 (SHA)</option>
            <option value="CAN">广州白云 (CAN)</option>
          </select>
        </div>
      </div>
    </div>

    <div class="table-container" v-if="!loading">
      <table class="data-table">
        <thead>
          <tr>
            <th>主单号</th>
            <th>订舱号</th>
            <th>航线</th>
            <th>收发件人</th>
            <th>货物信息</th>
            <th>状态</th>
            <th>当前节点</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody v-if="waybills.length > 0">
          <tr v-for="waybill in waybills" :key="waybill.id">
            <td>
              <span class="master-no">{{ waybill.masterNo }}</span>
            </td>
            <td>{{ waybill.bookingNo || '-' }}</td>
            <td>
              <div class="route">
                <span>{{ waybill.originAirport }}</span>
                <span class="arrow">→</span>
                <span>{{ waybill.destinationAirport }}</span>
              </div>
            </td>
            <td>
              <div class="contact">
                <div class="contact-item">
                  <span class="label">发:</span>
                  <span class="value">{{ waybill.shipperName }}</span>
                </div>
                <div class="contact-item">
                  <span class="label">收:</span>
                  <span class="value">{{ waybill.consigneeName }}</span>
                </div>
              </div>
            </td>
            <td>
              <div class="goods-info">
                <span>{{ waybill.totalPieces }}件</span>
                <span>{{ waybill.totalWeight }}kg</span>
                <span v-if="waybill.totalVolume > 0">{{ waybill.totalVolume }}m³</span>
              </div>
            </td>
            <td>
              <span
                class="status-badge"
                :style="{
                  backgroundColor: getStatusColor(waybill.status) + '20',
                  color: getStatusColor(waybill.status),
                }"
              >
                {{ waybill.statusDisplay || getStatusDisplay(waybill.status) }}
              </span>
            </td>
            <td>{{ getNodeDisplay(waybill.currentNode) }}</td>
            <td>{{ formatDate(waybill.createdAt) }}</td>
            <td>
              <button class="btn-link" @click="goToDetail(waybill.id)">
                查看详情
              </button>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="9" class="empty-cell">
              <div class="empty-state">
                <p>暂无运单数据</p>
                <button class="btn-primary" @click="goToCreate" v-if="canCreateBooking">创建第一个订舱</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="loading-state" v-else>
      <p>加载中...</p>
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
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { waybillApi } from '@/api';
import {
  STATUS_DISPLAY_MAP,
  STATUS_COLOR_MAP,
  FLOW_NODE_DISPLAY_MAP,
  WaybillStatus,
  FlowNode,
  MasterWaybill,
  UserRole,
} from '@/types';
import { getCurrentUser } from '@/router';

const router = useRouter();

const waybills = ref<MasterWaybill[]>([]);
const loading = ref(false);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);

const filters = reactive({
  status: '',
  originAirport: '',
  destinationAirport: '',
});

const canCreateBooking = computed(() => {
  const user = getCurrentUser();
  if (!user) return false;
  return user.role === UserRole.FORWARDER || user.role === UserRole.ADMIN;
});

function getStatusDisplay(status: string): string {
  return STATUS_DISPLAY_MAP[status as WaybillStatus] || status;
}

function getStatusColor(status: string): string {
  return STATUS_COLOR_MAP[status as WaybillStatus] || '#8c8c8c';
}

function getNodeDisplay(node?: string): string {
  if (!node) return '-';
  return FLOW_NODE_DISPLAY_MAP[node as FlowNode] || node;
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

async function loadWaybills() {
  loading.value = true;
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
    };
    if (filters.status) {
      params.status = filters.status;
    }
    if (filters.originAirport) {
      params.originAirport = filters.originAirport;
    }
    if (filters.destinationAirport) {
      params.destinationAirport = filters.destinationAirport;
    }

    const result = await waybillApi.getList(params);
    waybills.value = result?.items || [];
    total.value = result?.total || 0;
  } catch (error) {
    console.error('加载运单列表失败:', error);
    waybills.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  page.value = 1;
  loadWaybills();
}

function changePage(newPage: number) {
  page.value = newPage;
  loadWaybills();
}

function goToCreate() {
  router.push('/waybills/create');
}

function goToDetail(id: string) {
  router.push(`/waybills/${id}`);
}

onMounted(() => {
  loadWaybills();
});
</script>

<style scoped>
.waybill-list {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.header-left h2 {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 8px 0;
}

.header-left p {
  color: #8c8c8c;
  margin: 0;
}

.btn-primary {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-link {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
}

.btn-link:hover {
  color: #764ba2;
  text-decoration: underline;
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

.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: #fafafa;
}

.data-table th {
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  color: #262626;
  font-size: 13px;
  border-bottom: 1px solid #f0f0f0;
}

.data-table td {
  padding: 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #262626;
}

.data-table tbody tr:hover {
  background: #fafafa;
}

.master-no {
  font-weight: 600;
  color: #667eea;
  font-family: monospace;
}

.route {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.arrow {
  color: #8c8c8c;
}

.contact {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-item {
  display: flex;
  gap: 4px;
}

.contact-item .label {
  color: #8c8c8c;
}

.goods-info {
  display: flex;
  gap: 12px;
  color: #595959;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.empty-cell {
  text-align: center;
  padding: 48px !important;
}

.empty-state {
  text-align: center;
  color: #8c8c8c;
}

.empty-state p {
  margin-bottom: 16px;
}

.loading-state {
  text-align: center;
  padding: 48px;
  color: #8c8c8c;
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
