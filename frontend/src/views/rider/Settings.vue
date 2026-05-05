<template>
  <div class="settings-page">
    <div class="page-header">
      <h1>接单设置</h1>
    </div>
    
    <div class="page-content" style="padding: 16px;">
      <div class="card">
        <h3 style="font-size: 16px; margin-bottom: 16px;">接单参数</h3>
        
        <div class="toggle-switch">
          <span class="toggle-label">系统自动派单</span>
          <div 
            class="toggle" 
            :class="{ active: settings.autoAccept }"
            @click="settings.autoAccept = !settings.autoAccept"
          ></div>
        </div>
        
        <div class="form-group" style="margin-top: 16px;">
          <label class="form-label">同时最大接单量</label>
          <input 
            type="number" 
            v-model="settings.maxSimultaneous"
            class="form-input"
            min="1"
            max="10"
          >
          <p style="font-size: 12px; color: #999; margin-top: 4px;">最多同时处理订单数 (1-10)</p>
        </div>
        
        <div class="form-group">
          <label class="form-label">工作时间</label>
          <div class="time-input-group">
            <input 
              type="time" 
              v-model="settings.workStartTime"
              class="form-input"
            >
            <span class="time-separator">至</span>
            <input 
              type="time" 
              v-model="settings.workEndTime"
              class="form-input"
            >
          </div>
        </div>
        
        <button 
          class="btn btn-primary btn-block"
          @click="saveSettings"
          :disabled="saving"
          style="margin-top: 16px;"
        >
          {{ saving ? '保存中...' : '保存设置' }}
        </button>
      </div>
      
      <div class="card">
        <h3 style="font-size: 16px; margin-bottom: 16px;">资质状态</h3>
        
        <div class="status-item">
          <div class="status-label">骑手保险</div>
          <div class="status-value">
            <span 
              class="status-badge"
              :class="riderInfo.hasInsurance ? 'badge-success' : 'badge-danger'"
            >
              {{ riderInfo.hasInsurance ? '已购买' : '未购买' }}
            </span>
          </div>
        </div>
        
        <div class="status-item">
          <div class="status-label">保证金</div>
          <div class="status-value">
            <span 
              class="status-badge"
              :class="riderInfo.hasDeposit ? 'badge-success' : 'badge-danger'"
            >
              {{ riderInfo.hasDeposit ? '已缴纳' : '未缴纳' }}
            </span>
            <span v-if="riderInfo.hasDeposit" class="amount-text">
              ¥{{ riderInfo.depositAmount }}
            </span>
          </div>
        </div>
        
        <div v-if="eligibilityIssues.length > 0" class="alert alert-warning" style="margin-top: 16px;">
          <h4 style="margin-bottom: 8px; color: #d97706;">⚠️ 上线资格不足</h4>
          <ul style="list-style: none; padding: 0;">
            <li v-for="issue in eligibilityIssues" :key="issue.type" style="font-size: 13px; padding: 4px 0; color: #92400e;">
              • {{ issue.message }}
            </li>
          </ul>
          <p style="font-size: 12px; color: #92400e; margin-top: 8px; padding-top: 8px; border-top: 1px solid #fde68a;">
            请联系平台处理资质问题后再上线接单
          </p>
        </div>
      </div>
      
      <div style="height: 20px;"></div>
    </div>
    
    <div class="bottom-nav">
      <div class="nav-item" @click="$router.push('/rider')">
        <div class="nav-icon">🏠</div>
        <div class="nav-text">首页</div>
      </div>
      <div class="nav-item" @click="$router.push('/rider/orders')">
        <div class="nav-icon">📋</div>
        <div class="nav-text">订单</div>
      </div>
      <div class="nav-item" @click="$router.push('/rider/schedule')">
        <div class="nav-icon">📅</div>
        <div class="nav-text">排班</div>
      </div>
      <div class="nav-item active">
        <div class="nav-icon">⚙️</div>
        <div class="nav-text">设置</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { riderApi } from '../../api'

const settings = ref({
  autoAccept: false,
  maxSimultaneous: 3,
  workStartTime: '08:00',
  workEndTime: '22:00'
})

const riderInfo = ref({
  hasInsurance: false,
  hasDeposit: false,
  depositAmount: 0
})

const eligibilityIssues = ref([])
const saving = ref(false)

const loadSettings = async () => {
  try {
    const response = await riderApi.getSettings()
    if (response.data.success) {
      settings.value = { ...settings.value, ...response.data.data }
    }
  } catch (err) {
    console.error('加载设置失败:', err)
  }
}

const loadStatus = async () => {
  try {
    const response = await riderApi.getStatus()
    if (response.data.success) {
      eligibilityIssues.value = response.data.data.eligibility.issues
    }
  } catch (err) {
    console.error('加载状态失败:', err)
  }
}

const loadProfile = async () => {
  try {
    const response = await riderApi.getProfile()
    if (response.data.success && response.data.data.rider) {
      riderInfo.value = {
        hasInsurance: response.data.data.rider.hasInsurance || false,
        hasDeposit: response.data.data.rider.hasDeposit || false,
        depositAmount: response.data.data.rider.depositAmount || 0
      }
    }
  } catch (err) {
    console.error('加载资料失败:', err)
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    const response = await riderApi.updateSettings(settings.value)
    if (response.data.success) {
      alert('设置已保存')
      loadStatus()
    }
  } catch (err) {
    alert(err.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
  loadStatus()
  loadProfile()
})
</script>

<style scoped>
.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.status-item:last-child {
  border-bottom: none;
}

.status-label {
  font-size: 14px;
  color: #333;
}

.status-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-success {
  background-color: #dcfce7;
  color: #166534;
}

.badge-danger {
  background-color: #fee2e2;
  color: #991b1b;
}

.amount-text {
  font-size: 14px;
  color: #666;
}
</style>
