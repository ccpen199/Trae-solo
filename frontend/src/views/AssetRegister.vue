<template>
  <div class="register-page">
    <div class="form-card">
      <h2>资产入账</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-section">
          <h3>基本信息</h3>
          <div class="form-row">
            <div class="form-group">
              <label>期望完成时间</label>
              <input 
                v-model="formData.expectedCompleteTime" 
                type="date"
              />
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <div class="section-header">
            <h3>资产明细 ({{ assetDetails.length }}项)</h3>
            <button type="button" class="add-btn" @click="addAssetDetail">
              ➕ 添加资产
            </button>
          </div>
          
          <div 
            v-for="(detail, index) in assetDetails" 
            :key="index" 
            class="asset-detail-card"
          >
            <div class="detail-header">
              <h4>资产 #{{ index + 1 }}</h4>
              <button 
                v-if="assetDetails.length > 1" 
                type="button" 
                class="remove-btn"
                @click="removeAssetDetail(index)"
              >
                🗑️ 删除
              </button>
            </div>
            
            <div class="form-grid">
              <div class="form-group">
                <label>资产名称 <span class="required">*</span></label>
                <input 
                  v-model="detail.assetName" 
                  type="text" 
                  placeholder="请输入资产名称"
                />
              </div>
              
              <div class="form-group">
                <label>资产类型 <span class="required">*</span></label>
                <select v-model="detail.assetType">
                  <option value="">请选择类型</option>
                  <option value="电子设备">电子设备</option>
                  <option value="办公家具">办公家具</option>
                  <option value="运输设备">运输设备</option>
                  <option value="机器设备">机器设备</option>
                  <option value="房屋建筑">房屋建筑</option>
                  <option value="无形资产">无形资产</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>规格型号</label>
                <input 
                  v-model="detail.spec" 
                  type="text" 
                  placeholder="请输入规格型号"
                />
              </div>
              
              <div class="form-group">
                <label>计量单位</label>
                <input 
                  v-model="detail.unit" 
                  type="text" 
                  placeholder="台、件、套等"
                  value="台"
                />
              </div>
              
              <div class="form-group">
                <label>数量 <span class="required">*</span></label>
                <input 
                  v-model.number="detail.quantity" 
                  type="number" 
                  min="1"
                  placeholder="请输入数量"
                />
              </div>
              
              <div class="form-group">
                <label>单价 (元) <span class="required">*</span></label>
                <input 
                  v-model.number="detail.unitPrice" 
                  type="number" 
                  min="0"
                  step="0.01"
                  placeholder="请输入单价"
                />
              </div>
              
              <div class="form-group">
                <label>购买日期</label>
                <input 
                  v-model="detail.purchaseDate" 
                  type="date"
                />
              </div>
              
              <div class="form-group">
                <label>供应商</label>
                <input 
                  v-model="detail.supplier" 
                  type="text" 
                  placeholder="请输入供应商"
                />
              </div>
              
              <div class="form-group">
                <label>存放地点</label>
                <input 
                  v-model="detail.location" 
                  type="text" 
                  placeholder="请输入存放地点"
                />
              </div>
              
              <div class="form-group">
                <label>使用部门</label>
                <select v-model="detail.department">
                  <option value="">请选择部门</option>
                  <option value="技术部">技术部</option>
                  <option value="财务部">财务部</option>
                  <option value="行政部">行政部</option>
                  <option value="销售部">销售部</option>
                  <option value="资产管理部">资产管理部</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>责任人</label>
                <select v-model="detail.managerId">
                  <option value="">请选择责任人</option>
                  <option 
                    v-for="user in users" 
                    :key="user.id" 
                    :value="user.id"
                  >
                    {{ user.name }} ({{ user.department }})
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label>使用年限 (月) <span class="required">*</span></label>
                <input 
                  v-model.number="detail.useLife" 
                  type="number" 
                  min="1"
                  placeholder="请输入使用年限（月）"
                />
              </div>
              
              <div class="form-group">
                <label>残值率 <span class="required">*</span></label>
                <select v-model="detail.residualValueRate">
                  <option :value="0.05">5%</option>
                  <option :value="0.1">10%</option>
                  <option :value="0.03">3%</option>
                  <option :value="0">0%</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>折旧方法 <span class="required">*</span></label>
                <select v-model="detail.depreciationMethod">
                  <option value="STRAIGHT_LINE">直线法</option>
                  <option value="DECLINING_BALANCE">余额递减法</option>
                  <option value="SUM_OF_YEARS_DIGITS">年数总和法</option>
                </select>
              </div>
            </div>
            
            <div class="price-summary">
              小计: 
              <span class="price">
                {{ formatCurrency((detail.quantity || 0) * (detail.unitPrice || 0)) }}
              </span>
            </div>
          </div>
        </div>
        
        <div v-if="errorMessage || errorList.length > 0" class="error-alert">
          <div v-if="errorMessage" class="error-main">{{ errorMessage }}</div>
          <ul v-if="errorList.length > 0" class="error-list">
            <li v-for="(err, idx) in errorList" :key="idx">{{ err }}</li>
          </ul>
        </div>
        
        <div class="form-actions">
          <button type="button" class="cancel-btn" @click="resetForm">
            重置
          </button>
          <button type="submit" class="submit-btn" :disabled="loading">
            {{ loading ? '提交中...' : '提交入账' }}
          </button>
        </div>
      </form>
    </div>
    
    <div v-if="successResult" class="success-modal">
      <div class="modal-content">
        <div class="success-icon">✅</div>
        <h3>入账成功</h3>
        <p>主单号: <strong>{{ successResult.masterNo }}</strong></p>
        <ul class="success-messages">
          <li v-for="msg in successResult.messages" :key="msg">{{ msg }}</li>
        </ul>
        <button class="close-btn" @click="closeSuccess">
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { User } from '@/types';
import { authApi, assetApi } from '@/api';

const router = useRouter();

const loading = ref(false);
const errorMessage = ref('');
const errorList = ref<string[]>([]);
const successResult = ref<{ masterNo: string; messages: string[] } | null>(null);
const users = ref<User[]>([]);

const formData = reactive({
  expectedCompleteTime: ''
});

const assetDetails = ref<Array<{
  assetName: string;
  assetType: string;
  spec: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  purchaseDate: string;
  supplier: string;
  location: string;
  department: string;
  managerId: string;
  useLife: number;
  residualValueRate: number;
  depreciationMethod: string;
}>>([]);

const addAssetDetail = () => {
  assetDetails.value.push({
    assetName: '',
    assetType: '',
    spec: '',
    unit: '台',
    quantity: 1,
    unitPrice: 0,
    purchaseDate: '',
    supplier: '',
    location: '',
    department: '',
    managerId: '',
    useLife: 36,
    residualValueRate: 0.05,
    depreciationMethod: 'STRAIGHT_LINE'
  });
};

const removeAssetDetail = (index: number) => {
  assetDetails.value.splice(index, 1);
};

const resetForm = () => {
  formData.expectedCompleteTime = '';
  assetDetails.value = [];
  addAssetDetail();
  errorMessage.value = '';
  errorList.value = [];
  successResult.value = null;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(value);
};

const loadUsers = async () => {
  try {
    const result = await authApi.getUsers();
    if (result.success && result.data) {
      users.value = result.data;
    }
  } catch (error) {
    console.error('Load users error:', error);
  }
};

const handleSubmit = async () => {
  if (assetDetails.value.length === 0) {
    errorMessage.value = '请至少添加一项资产明细';
    return;
  }

  const invalid = assetDetails.value.some(d => !d.assetName || !d.assetType);
  if (invalid) {
    errorMessage.value = '请填写必填项（资产名称、资产类型）';
    return;
  }

  loading.value = true;
  errorMessage.value = '';
  errorList.value = [];

  try {
    const result = await assetApi.register({
      assetDetails: assetDetails.value.map(d => ({
        ...d,
        unitPrice: Number(d.unitPrice),
        quantity: Number(d.quantity),
        useLife: Number(d.useLife),
        residualValueRate: Number(d.residualValueRate)
      })),
      attachments: [],
      expectedCompleteTime: formData.expectedCompleteTime
    });

    if (result.success && result.data) {
      successResult.value = {
        masterNo: result.data.masterNo,
        messages: result.data.messages
      };
    } else {
      errorMessage.value = result.message || '提交失败';
      if (result.errors && result.errors.length > 0) {
        errorList.value = result.errors;
      }
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string; errors?: string[] } } };
    errorMessage.value = err.response?.data?.message || '提交失败，请稍后重试';
    if (err.response?.data?.errors && err.response.data.errors.length > 0) {
      errorList.value = err.response.data.errors;
    }
  } finally {
    loading.value = false;
  }
};

const closeSuccess = () => {
  successResult.value = null;
  resetForm();
  router.push('/assets');
};

onMounted(() => {
  loadUsers();
  addAssetDetail();
});
</script>

<style scoped>
.register-page {
  max-width: 900px;
  margin: 0 auto;
}

.form-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.form-card h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.form-section {
  margin-bottom: 32px;
}

.form-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-btn {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border-radius: 6px;
  font-size: 14px;
  transition: opacity 0.2s;
}

.add-btn:hover {
  opacity: 0.9;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.required {
  color: #e74c3c;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.asset-detail-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid #e2e8f0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.detail-header h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.remove-btn {
  padding: 6px 12px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 4px;
  font-size: 13px;
  transition: background 0.2s;
}

.remove-btn:hover {
  background: #fecaca;
}

.price-summary {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  text-align: right;
  font-size: 14px;
  color: #666;
}

.price {
  font-weight: 600;
  color: #667eea;
  font-size: 16px;
  margin-left: 8px;
}

.error-alert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
}

.error-main {
  font-weight: 600;
  margin-bottom: 8px;
}

.error-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.error-list li {
  padding: 4px 0;
  padding-left: 20px;
  position: relative;
  color: #b91c1c;
}

.error-list li::before {
  content: '•';
  position: absolute;
  left: 8px;
  color: #dc2626;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.cancel-btn {
  padding: 12px 32px;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.cancel-btn:hover {
  background: #e2e8f0;
}

.submit-btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.2s;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-modal {
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
  padding: 40px;
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.success-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.modal-content h3 {
  font-size: 20px;
  color: #333;
  margin-bottom: 16px;
}

.modal-content p {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.success-messages {
  list-style: none;
  text-align: left;
  margin-bottom: 24px;
}

.success-messages li {
  font-size: 13px;
  color: #059669;
  padding: 8px 12px;
  background: #d1fae5;
  border-radius: 4px;
  margin-bottom: 8px;
}

.modal-content .close-btn {
  padding: 12px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
}
</style>
