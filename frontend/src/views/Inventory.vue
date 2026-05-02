<template>
  <div class="inventory-page">
    <h2>资产盘点</h2>
    <p class="page-desc">扫码或人工盘点资产</p>
    
    <div class="inventory-tools">
      <div class="scan-section">
        <h3>扫码盘点</h3>
        <div class="scan-input">
          <input 
            v-model="qrCodeInput" 
            type="text" 
            placeholder="输入或扫描二维码"
            @keyup.enter="scanQRCode"
          />
          <button @click="scanQRCode">查询</button>
        </div>
        
        <div v-if="scannedAsset" class="scan-result">
          <h4>资产信息</h4>
          <div class="asset-info-row">
            <label>资产编号:</label>
            <span>{{ scannedAsset.assetCode }}</span>
          </div>
          <div class="asset-info-row">
            <label>资产名称:</label>
            <span>{{ scannedAsset.assetName }}</span>
          </div>
          <div class="asset-info-row">
            <label>类型:</label>
            <span>{{ scannedAsset.assetType }}</span>
          </div>
          <div class="asset-info-row">
            <label>系统数量:</label>
            <span>{{ scannedAsset.quantity }}</span>
          </div>
          <div class="asset-info-row">
            <label>当前状态:</label>
            <span :class="['status-badge', getStatusClass(scannedAsset.status)]">
              {{ getStatusLabel(scannedAsset.status) }}
            </span>
          </div>
          
          <div class="inventory-form">
            <div class="form-group">
              <label>实际数量</label>
              <input v-model.number="inventoryForm.actualQuantity" type="number" min="0" />
            </div>
            <div class="form-group">
              <label>盘点结果</label>
              <select v-model="inventoryForm.inventoryResult">
                <option value="NORMAL">正常</option>
                <option value="MISSING">缺失</option>
                <option value="DAMAGED">损坏</option>
              </select>
            </div>
            <div class="form-group">
              <label>备注</label>
              <textarea v-model="inventoryForm.remarks" rows="2" placeholder="盘点备注"></textarea>
            </div>
            
            <button 
              class="submit-btn" 
              @click="submitInventory"
              :disabled="submitting"
            >
              {{ submitting ? '提交中...' : '确认盘点' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="pendingItems.length > 0" class="pending-section">
      <h3>待盘点列表</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>主单号</th>
            <th>资产编号</th>
            <th>资产名称</th>
            <th>位置</th>
            <th>部门</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pendingItems" :key="item.assetDetailId">
            <td>{{ item.masterNo }}</td>
            <td>{{ item.assetCode }}</td>
            <td>{{ item.assetName }}</td>
            <td>{{ item.location || '-' }}</td>
            <td>{{ item.department || '-' }}</td>
            <td>
              <button class="action-btn" @click="startInventory(item)">
                开始盘点
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import type { AssetDetail, AssetStatus } from '@/types';
import { AssetStatusLabels } from '@/types';
import { assetApi, workflowApi } from '@/api';

const qrCodeInput = ref('');
const scannedAsset = ref<AssetDetail | null>(null);
const pendingItems = ref<Array<{
  masterId: string;
  masterNo: string;
  assetDetailId: string;
  assetCode: string;
  assetName: string;
  location: string;
  department: string;
  qrCode: string;
}>>([]);
const submitting = ref(false);

const inventoryForm = reactive({
  actualQuantity: 1,
  inventoryResult: 'NORMAL' as 'NORMAL' | 'MISSING' | 'DAMAGED' | 'TRANSFERRED',
  remarks: '',
  masterId: '',
  assetDetailId: ''
});

const getStatusLabel = (status: string) => {
  return AssetStatusLabels[status as AssetStatus] || status;
};

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    'PENDING_INVENTORY': 'status-waiting',
    'IN_USE': 'status-success'
  };
  return classes[status] || 'status-waiting';
};

const scanQRCode = async () => {
  if (!qrCodeInput.value.trim()) return;
  
  try {
    const result = await assetApi.getByQRCode(qrCodeInput.value.trim());
    if (result.success && result.data) {
      scannedAsset.value = result.data;
      inventoryForm.actualQuantity = result.data.quantity;
      inventoryForm.assetDetailId = result.data.id;
      inventoryForm.masterId = result.data.masterId;
    } else {
      alert(result.message || '未找到该资产');
    }
  } catch (error) {
    alert('查询失败');
  }
};

const startInventory = (item: {
  masterId: string;
  assetDetailId: string;
  assetCode: string;
  qrCode: string;
}) => {
  qrCodeInput.value = item.qrCode || item.assetCode;
  scanQRCode();
};

const submitInventory = async () => {
  if (!inventoryForm.masterId || !inventoryForm.assetDetailId) {
    alert('请先扫描或选择资产');
    return;
  }

  submitting.value = true;
  try {
    const result = await workflowApi.submitInventory({
      masterId: inventoryForm.masterId,
      assetDetailId: inventoryForm.assetDetailId,
      inventoryResult: inventoryForm.inventoryResult,
      actualQuantity: inventoryForm.actualQuantity,
      remarks: inventoryForm.remarks,
      qrScanned: !!qrCodeInput.value,
      qrCode: qrCodeInput.value
    });

    if (result.success) {
      alert('盘点成功！');
      scannedAsset.value = null;
      qrCodeInput.value = '';
      loadPendingInventory();
    } else {
      alert(result.message || '盘点失败');
    }
  } catch (error) {
    alert('盘点失败');
  } finally {
    submitting.value = false;
  }
};

const loadPendingInventory = async () => {
  try {
    const result = await workflowApi.getPendingInventory();
    if (result.success && result.data) {
      pendingItems.value = result.data;
    }
  } catch (error) {
    console.error('Load pending inventory error:', error);
  }
};

onMounted(() => {
  loadPendingInventory();
});
</script>

<style scoped>
.inventory-page {
  padding: 20px;
}

.inventory-page h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.page-desc {
  color: #888;
  margin-bottom: 24px;
}

.inventory-tools {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.scan-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.scan-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.scan-input {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.scan-input input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.scan-input button {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border-radius: 6px;
  font-size: 14px;
}

.scan-result {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
}

.scan-result h4 {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.asset-info-row {
  display: flex;
  margin-bottom: 10px;
}

.asset-info-row label {
  width: 100px;
  color: #888;
  font-size: 14px;
}

.asset-info-row span {
  font-size: 14px;
  color: #333;
}

.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.status-waiting {
  background: #fef3c7;
  color: #d97706;
}

.status-success {
  background: #d1fae5;
  color: #059669;
}

.inventory-form {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.form-group {
  margin-bottom: 16px;
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
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}

.submit-btn:disabled {
  opacity: 0.6;
}

.pending-section {
  margin-top: 32px;
}

.pending-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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
  padding: 14px 20px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  color: #333;
}

.action-btn {
  padding: 6px 16px;
  background: #667eea;
  color: white;
  border-radius: 4px;
  font-size: 13px;
}
</style>
