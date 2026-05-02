<template>
  <div class="approval-page">
    <h2>审批中心</h2>
    <p class="page-desc">处理调拨和报废审批</p>
    
    <div class="approval-tabs">
      <button 
        :class="['tab-btn', { active: activeTab === 'transfer' }]"
        @click="activeTab = 'transfer'"
      >
        调拨审批 ({{ pendingTransfers.length }})
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'scrap' }]"
        @click="activeTab = 'scrap'"
      >
        报废审批 ({{ pendingScraps.length }})
      </button>
    </div>
    
    <div v-if="activeTab === 'transfer'" class="approval-section">
      <h3>待调拨审批</h3>
      <div v-if="pendingTransfers.length === 0" class="empty-state">
        暂无待审批调拨
      </div>
      <div v-else class="approval-list">
        <div v-for="item in pendingTransfers" :key="item.id" class="approval-card">
          <div class="card-header">
            <span class="master-no">{{ item.masterNo }}</span>
            <span class="asset-code">{{ item.assetCode }}</span>
          </div>
          <div class="card-body">
            <div class="info-row">
              <label>资产名称:</label>
              <span>{{ item.assetName }}</span>
            </div>
            <div class="info-row">
              <label>调出部门:</label>
              <span>{{ item.fromDepartment }}</span>
              <label>→</label>
              <label>调入部门:</label>
              <span>{{ item.toDepartment }}</span>
            </div>
            <div class="info-row">
              <label>调拨原因:</label>
              <span>{{ item.transferReason || '-' }}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="approve-btn" @click="approveTransfer(item)">
              ✓ 同意
            </button>
            <button class="reject-btn" @click="rejectTransfer(item)">
              ✗ 驳回
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="approval-section">
      <h3>待报废审批</h3>
      <div v-if="pendingScraps.length === 0" class="empty-state">
        暂无待审批报废
      </div>
      <div v-else class="approval-list">
        <div v-for="item in pendingScraps" :key="item.id" class="approval-card">
          <div class="card-header">
            <span class="master-no">{{ item.masterNo }}</span>
            <span class="asset-code">{{ item.assetCode }}</span>
          </div>
          <div class="card-body">
            <div class="info-row">
              <label>资产名称:</label>
              <span>{{ item.assetName }}</span>
            </div>
            <div class="info-row">
              <label>资产原值:</label>
              <span>{{ formatCurrency(item.assetTotalPrice) }}</span>
              <label>报废价值:</label>
              <span>{{ formatCurrency(item.scrapValue) }}</span>
            </div>
            <div class="info-row">
              <label>报废原因:</label>
              <span>{{ item.scrapReason }}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="approve-btn" @click="approveScrap(item)">
              ✓ 同意
            </button>
            <button class="reject-btn" @click="rejectScrap(item)">
              ✗ 驳回
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { workflowApi } from '@/api';

const activeTab = ref<'transfer' | 'scrap'>('transfer');
const pendingTransfers = ref<Array<{
  id: string;
  masterId: string;
  assetDetailId: string;
  masterNo: string;
  assetCode: string;
  assetName: string;
  fromDepartment: string;
  toDepartment: string;
  transferReason: string;
}>>([]);

const pendingScraps = ref<Array<{
  id: string;
  masterId: string;
  assetDetailId: string;
  masterNo: string;
  assetCode: string;
  assetName: string;
  scrapReason: string;
  scrapValue: number;
  assetTotalPrice: number;
}>>([]);

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(value);
};

const approveTransfer = async (item: { masterId: string; assetDetailId: string }) => {
  if (!confirm('确认同意该调拨申请？')) return;
  
  try {
    const result = await workflowApi.processApproval({
      masterId: item.masterId,
      assetDetailId: item.assetDetailId,
      approvalType: 'TRANSFER',
      action: 'APPROVE',
      remarks: '同意'
    });
    
    if (result.success) {
      alert('审批通过！');
      loadPendingData();
    } else {
      alert(result.message || '操作失败');
    }
  } catch (error) {
    alert('操作失败');
  }
};

const rejectTransfer = async (item: { masterId: string; assetDetailId: string }) => {
  if (!confirm('确认驳回该调拨申请？')) return;
  
  try {
    const result = await workflowApi.processApproval({
      masterId: item.masterId,
      assetDetailId: item.assetDetailId,
      approvalType: 'TRANSFER',
      action: 'REJECT',
      remarks: '驳回'
    });
    
    if (result.success) {
      alert('已驳回！');
      loadPendingData();
    } else {
      alert(result.message || '操作失败');
    }
  } catch (error) {
    alert('操作失败');
  }
};

const approveScrap = async (item: { masterId: string; assetDetailId: string }) => {
  if (!confirm('确认同意该报废申请？')) return;
  
  try {
    const result = await workflowApi.processApproval({
      masterId: item.masterId,
      assetDetailId: item.assetDetailId,
      approvalType: 'SCRAP',
      action: 'APPROVE',
      remarks: '同意'
    });
    
    if (result.success) {
      alert('审批通过！');
      loadPendingData();
    } else {
      alert(result.message || '操作失败');
    }
  } catch (error) {
    alert('操作失败');
  }
};

const rejectScrap = async (item: { masterId: string; assetDetailId: string }) => {
  if (!confirm('确认驳回该报废申请？')) return;
  
  try {
    const result = await workflowApi.processApproval({
      masterId: item.masterId,
      assetDetailId: item.assetDetailId,
      approvalType: 'SCRAP',
      action: 'REJECT',
      remarks: '驳回'
    });
    
    if (result.success) {
      alert('已驳回！');
      loadPendingData();
    } else {
      alert(result.message || '操作失败');
    }
  } catch (error) {
    alert('操作失败');
  }
};

const loadPendingData = async () => {
  try {
    const [transferResult, scrapResult] = await Promise.all([
      workflowApi.getPendingTransfers(),
      workflowApi.getPendingScraps()
    ]);
    
    if (transferResult.success && transferResult.data) {
      pendingTransfers.value = transferResult.data;
    }
    if (scrapResult.success && scrapResult.data) {
      pendingScraps.value = scrapResult.data;
    }
  } catch (error) {
    console.error('Load pending approval error:', error);
  }
};

onMounted(() => {
  loadPendingData();
});
</script>

<style scoped>
.approval-page {
  padding: 20px;
}

.approval-page h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.page-desc {
  color: #888;
  margin-bottom: 24px;
}

.approval-tabs {
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

.approval-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 12px;
  color: #999;
}

.approval-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.approval-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.master-no {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
}

.asset-code {
  font-size: 12px;
  color: #888;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
}

.card-body {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 14px;
}

.info-row label {
  color: #888;
}

.info-row span {
  color: #333;
}

.card-actions {
  display: flex;
  gap: 12px;
}

.approve-btn {
  flex: 1;
  padding: 10px;
  background: #d1fae5;
  color: #059669;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}

.reject-btn {
  flex: 1;
  padding: 10px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}
</style>
