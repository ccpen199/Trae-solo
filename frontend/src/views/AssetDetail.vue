<template>
  <div class="asset-detail-page">
    <div v-if="loading" class="loading-container">
      加载中...
    </div>
    
    <div v-else-if="!assetData" class="error-container">
      <p>资产不存在</p>
      <router-link to="/assets" class="back-btn">返回列表</router-link>
    </div>
    
    <template v-else>
      <div class="detail-header">
        <div class="header-left">
          <router-link to="/assets" class="back-link">← 返回列表</router-link>
          <h2>{{ assetData.master.masterNo }}</h2>
          <span :class="['status-badge', getStatusClass(assetData.master.status)]">
            {{ getStatusLabel(assetData.master.status) }}
          </span>
        </div>
        
        <div class="header-actions">
          <button 
            v-if="assetData.master.status === 'PENDING_RECEIVE'" 
            class="action-btn primary"
            @click="handleReceive"
          >
            ✓ 领用确认
          </button>
          <button 
            v-if="assetData.master.status === 'IN_USE'" 
            class="action-btn"
            @click="showTransferModal = true"
          >
            🔄 发起调拨
          </button>
          <button 
            v-if="assetData.master.status === 'IN_USE'" 
            class="action-btn danger"
            @click="showScrapModal = true"
          >
            🗑️ 发起报废
          </button>
        </div>
      </div>
      
      <div class="detail-grid">
        <div class="info-card">
          <h3>基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>主单号</label>
              <span>{{ assetData.master.masterNo }}</span>
            </div>
            <div class="info-item">
              <label>状态</label>
              <span :class="['status-badge', getStatusClass(assetData.master.status)]">
                {{ getStatusLabel(assetData.master.status) }}
              </span>
            </div>
            <div class="info-item">
              <label>创建人</label>
              <span>{{ assetData.master.createdByName || '-' }}</span>
            </div>
            <div class="info-item">
              <label>当前处理人</label>
              <span>{{ assetData.master.handlerName || '-' }}</span>
            </div>
            <div class="info-item">
              <label>创建时间</label>
              <span>{{ formatDate(assetData.master.createdAt) }}</span>
            </div>
            <div class="info-item">
              <label>更新时间</label>
              <span>{{ formatDate(assetData.master.updatedAt) }}</span>
            </div>
          </div>
        </div>
        
        <div class="info-card">
          <h3>资产明细 ({{ assetData.details.length }}项)</h3>
          <div class="details-list">
            <div v-for="detail in assetData.details" :key="detail.id" class="detail-item">
              <div class="detail-header">
                <h4>{{ detail.assetName }}</h4>
                <span class="asset-code">{{ detail.assetCode }}</span>
              </div>
              <div class="detail-info">
                <div class="info-row">
                  <span>类型: {{ detail.assetType }}</span>
                  <span>规格: {{ detail.spec || '-' }}</span>
                </div>
                <div class="info-row">
                  <span>数量: {{ detail.quantity }}{{ detail.unit }}</span>
                  <span>单价: {{ formatCurrency(detail.unitPrice) }}</span>
                  <span>总价: {{ formatCurrency(detail.totalPrice) }}</span>
                </div>
                <div class="info-row">
                  <span>部门: {{ detail.department || '-' }}</span>
                  <span>责任人: {{ detail.managerName || '-' }}</span>
                </div>
                <div class="info-row" v-if="detail.qrCode">
                  <span>二维码: {{ detail.qrCode }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="info-card">
          <h3>流程时间轴</h3>
          <div class="timeline" v-if="assetData.timelines.length > 0">
            <div v-for="(item, index) in assetData.timelines" :key="item.id" class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-user">{{ item.userName }}</span>
                  <span class="timeline-time">{{ formatDate(item.createdAt) }}</span>
                </div>
                <p class="timeline-action">{{ item.action }}</p>
                <p v-if="item.remarks" class="timeline-remarks">{{ item.remarks }}</p>
                <span v-if="item.status" :class="['timeline-status', getStatusClass(item.status)]">
                  {{ getStatusLabel(item.status) }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="no-timeline">
            暂无时间轴记录
          </div>
        </div>
      </div>
    </template>
    
    <div v-if="showTransferModal" class="modal-overlay" @click.self="showTransferModal = false">
      <div class="modal-content">
        <h3>发起调拨</h3>
        <div class="form-group">
          <label>调入部门</label>
          <select v-model="transferForm.toDepartment">
            <option value="">请选择部门</option>
            <option value="技术部">技术部</option>
            <option value="财务部">财务部</option>
            <option value="行政部">行政部</option>
            <option value="销售部">销售部</option>
          </select>
        </div>
        <div class="form-group">
          <label>调拨原因</label>
          <textarea v-model="transferForm.transferReason" rows="3" placeholder="请输入调拨原因"></textarea>
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showTransferModal = false">取消</button>
          <button class="confirm-btn" @click="handleTransfer" :disabled="submitting">
            {{ submitting ? '提交中...' : '确认提交' }}
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="showScrapModal" class="modal-overlay" @click.self="showScrapModal = false">
      <div class="modal-content">
        <h3>发起报废</h3>
        <div class="form-group">
          <label>报废原因</label>
          <textarea v-model="scrapForm.scrapReason" rows="3" placeholder="请输入报废原因"></textarea>
        </div>
        <div class="form-group">
          <label>残值 (元)</label>
          <input v-model.number="scrapForm.scrapValue" type="number" min="0" step="0.01" />
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showScrapModal = false">取消</button>
          <button class="confirm-btn danger" @click="handleScrap" :disabled="submitting">
            {{ submitting ? '提交中...' : '确认提交' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { AssetMaster, AssetDetail, TimelineRecord, AssetStatus } from '@/types';
import { AssetStatusLabels } from '@/types';
import { assetApi, workflowApi } from '@/api';
import { useAuthStore } from '@/stores/auth';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const submitting = ref(false);
const showTransferModal = ref(false);
const showScrapModal = ref(false);

const assetData = ref<{
  master: AssetMaster & { createdByName?: string; handlerName?: string };
  details: Array<AssetDetail & { qrCode?: string; managerName?: string }>;
  timelines: Array<TimelineRecord & { userName?: string }>;
} | null>(null);

const transferForm = reactive({
  toDepartment: '',
  transferReason: ''
});

const scrapForm = reactive({
  scrapReason: '',
  scrapValue: 0
});

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(value);
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

const loadAssetDetail = async () => {
  const masterId = route.params.masterId as string;
  if (!masterId) return;

  loading.value = true;
  try {
    const result = await assetApi.getDetail(masterId);
    if (result.success && result.data) {
      assetData.value = result.data;
    }
  } catch (error) {
    console.error('Load asset detail error:', error);
  } finally {
    loading.value = false;
  }
};

const handleReceive = async () => {
  if (!assetData.value) return;
  
  try {
    const result = await assetApi.receive(assetData.value.master.id);
    if (result.success) {
      alert('领用成功！');
      loadAssetDetail();
    } else {
      alert(result.message || '领用失败');
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    alert(err.response?.data?.message || '领用失败');
  }
};

const handleTransfer = async () => {
  if (!assetData.value || !transferForm.toDepartment) {
    alert('请选择调入部门');
    return;
  }

  submitting.value = true;
  try {
    const detail = assetData.value.details[0];
    const result = await workflowApi.initiateTransfer({
      masterId: assetData.value.master.id,
      assetDetailId: detail.id,
      fromDepartment: detail.department || authStore.user?.department || '',
      fromManagerId: detail.managerId || authStore.user?.id || '',
      toDepartment: transferForm.toDepartment,
      toManagerId: detail.managerId || authStore.user?.id || '',
      transferReason: transferForm.transferReason
    });

    if (result.success) {
      alert('调拨申请已提交，等待审批');
      showTransferModal.value = false;
      transferForm.toDepartment = '';
      transferForm.transferReason = '';
      loadAssetDetail();
    } else {
      alert(result.message || '提交失败');
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    alert(err.response?.data?.message || '提交失败');
  } finally {
    submitting.value = false;
  }
};

const handleScrap = async () => {
  if (!assetData.value || !scrapForm.scrapReason) {
    alert('请填写报废原因');
    return;
  }

  submitting.value = true;
  try {
    const detail = assetData.value.details[0];
    const result = await workflowApi.initiateScrap({
      masterId: assetData.value.master.id,
      assetDetailId: detail.id,
      scrapReason: scrapForm.scrapReason,
      scrapValue: scrapForm.scrapValue
    });

    if (result.success) {
      alert('报废申请已提交，等待审批');
      showScrapModal.value = false;
      scrapForm.scrapReason = '';
      scrapForm.scrapValue = 0;
      loadAssetDetail();
    } else {
      alert(result.message || '提交失败');
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    alert(err.response?.data?.message || '提交失败');
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadAssetDetail();
});
</script>

<style scoped>
.asset-detail-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: white;
  border-radius: 12px;
  color: #666;
}

.back-btn {
  margin-top: 16px;
  padding: 10px 24px;
  background: #667eea;
  color: white;
  border-radius: 6px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-link {
  color: #667eea;
  font-size: 14px;
  margin-right: 16px;
}

.header-left h2 {
  font-size: 20px;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 10px 20px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #e2e8f0;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn.danger {
  background: #fee2e2;
  color: #dc2626;
}

.action-btn.danger:hover {
  background: #fecaca;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.info-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item label {
  font-size: 13px;
  color: #888;
}

.info-item span {
  font-size: 14px;
  color: #333;
}

.details-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-item {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.detail-header h4 {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.asset-code {
  font-size: 12px;
  color: #888;
  background: #e2e8f0;
  padding: 2px 8px;
  border-radius: 4px;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: #666;
}

.timeline {
  position: relative;
  padding-left: 24px;
}

.timeline-item {
  position: relative;
  padding-bottom: 24px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -24px;
  top: 4px;
  width: 12px;
  height: 12px;
  background: #667eea;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #667eea;
}

.timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: -19px;
  top: 18px;
  width: 2px;
  height: calc(100% - 18px);
  background: #e2e8f0;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.timeline-user {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.timeline-time {
  font-size: 12px;
  color: #888;
}

.timeline-action {
  font-size: 14px;
  color: #555;
  margin-bottom: 4px;
}

.timeline-remarks {
  font-size: 13px;
  color: #888;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 4px;
  margin-bottom: 8px;
}

.timeline-status {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.no-timeline {
  text-align: center;
  color: #999;
  padding: 20px;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 32px;
  width: 480px;
  max-width: 90%;
}

.modal-content h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #667eea;
  outline: none;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.cancel-btn {
  padding: 10px 24px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 6px;
  font-size: 14px;
}

.confirm-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 6px;
  font-size: 14px;
}

.confirm-btn.danger {
  background: #dc2626;
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
