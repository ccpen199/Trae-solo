<template>
  <div class="agent-page">
    <van-nav-bar
      title="亲友代办"
      left-text="返回"
      left-arrow
      @click-left="onBack"
    />

    <van-tabs v-model:active="activeTab" sticky>
      <van-tab title="我委托的">
        <div class="tab-content">
          <div v-if="principalAuths.length > 0">
            <div 
              v-for="auth in principalAuths" 
              :key="auth.id" 
              class="auth-card card"
            >
              <div class="auth-header">
                <div class="auth-user">
                  <div class="user-avatar">{{ auth.agent_name?.charAt(0) }}</div>
                  <div class="user-info">
                    <div class="user-name">{{ auth.agent_name }}</div>
                    <div class="user-phone">{{ auth.agent_phone }}</div>
                  </div>
                </div>
                <van-tag :type="auth.status === 'active' ? 'success' : 'danger'">
                  {{ auth.status === 'active' ? '有效' : '已撤销' }}
                </van-tag>
              </div>
              
              <div class="auth-scope">
                <span class="scope-label">授权范围：</span>
                <span 
                  v-for="scope in auth.auth_scope" 
                  :key="scope"
                  class="scope-tag"
                >
                  {{ scope }}
                </span>
              </div>
              
              <div class="auth-time">
                <span>有效期：{{ formatDate(auth.start_time) }} 至 {{ formatDate(auth.end_time) }}</span>
              </div>
              
              <div class="auth-footer">
                <div class="confirm-status">
                  <van-icon :name="auth.require_confirm ? 'passed' : 'info-o'" />
                  <span>{{ auth.require_confirm ? '需二次确认' : '无需确认' }}</span>
                </div>
                <div class="auth-actions">
                  <van-button size="small" plain type="primary" @click="viewOperations(auth)">
                    操作记录
                  </van-button>
                  <van-button 
                    v-if="auth.status === 'active'"
                    size="small" 
                    type="danger" 
                    plain
                    @click="handleRevokeAuth(auth.id)"
                  >
                    撤销
                  </van-button>
                </div>
              </div>
            </div>
          </div>
          <van-empty v-else description="暂无委托记录" />
        </div>
      </van-tab>
      
      <van-tab title="我代办的">
        <div class="tab-content">
          <div v-if="agentAuths.length > 0">
            <div 
              v-for="auth in agentAuths" 
              :key="auth.id" 
              class="auth-card card"
            >
              <div class="auth-header">
                <div class="auth-user">
                  <div class="user-avatar principal">{{ auth.principal_name?.charAt(0) }}</div>
                  <div class="user-info">
                    <div class="user-name">{{ auth.principal_name }}（委托人）</div>
                    <div class="user-phone">{{ auth.principal_phone }}</div>
                  </div>
                </div>
                <van-tag :type="auth.status === 'active' ? 'success' : 'danger'">
                  {{ auth.status === 'active' ? '有效' : '已撤销' }}
                </van-tag>
              </div>
              
              <div class="auth-scope">
                <span class="scope-label">可办理：</span>
                <span 
                  v-for="scope in auth.auth_scope" 
                  :key="scope"
                  class="scope-tag"
                >
                  {{ scope }}
                </span>
              </div>
              
              <div class="auth-footer">
                <van-button 
                  v-if="auth.status === 'active'"
                  size="small" 
                  type="primary" 
                  block
                  @click="handleAgent(auth)"
                >
                  去代办
                </van-button>
              </div>
            </div>
          </div>
          <van-empty v-else description="暂无代办权限" />
        </div>
      </van-tab>
    </van-tabs>

    <div class="add-btn-wrapper">
      <van-button type="primary" size="large" block round @click="showAddAuth">
        + 添加代办授权
      </van-button>
    </div>

    <van-popup v-model:show="showAdd" round position="bottom" :style="{ height: '70%' }">
      <div class="add-auth-content">
        <div class="add-header">
          <div class="add-title">添加代办授权</div>
          <van-icon name="close" size="22" @click="showAdd = false" />
        </div>
        
        <div class="form-section">
          <div class="form-label">受托人信息</div>
          <van-field 
            v-model="newAuth.agentName" 
            label="姓名" 
            placeholder="请输入受托人姓名"
          />
          <van-field 
            v-model="newAuth.agentPhone" 
            label="手机号" 
            placeholder="请输入受托人手机号"
          />
        </div>
        
        <div class="form-section">
          <div class="form-label">授权范围</div>
          <div class="scope-options">
            <div 
              v-for="scope in scopeOptions" 
              :key="scope.value"
              class="scope-option"
              :class="{ active: newAuth.scopes.includes(scope.value) }"
              @click="toggleScope(scope.value)"
            >
              {{ scope.label }}
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <div class="form-label">授权时效</div>
          <van-field 
            v-model="newAuth.startDate" 
            label="开始日期" 
            type="date"
          />
          <van-field 
            v-model="newAuth.endDate" 
            label="结束日期" 
            type="date"
          />
        </div>
        
        <div class="form-section">
          <div class="form-label">安全设置</div>
          <van-cell-group inset>
            <van-cell title="操作需二次确认">
              <template #right-icon>
                <van-switch v-model="newAuth.requireConfirm" size="20px" />
              </template>
            </van-cell>
          </van-cell-group>
        </div>
        
        <div class="form-tip">
          <van-icon name="info-o" />
          <span>代办操作将全程留痕，确保您的权益安全</span>
        </div>
        
        <van-button type="primary" block round size="large" @click="submitAuth">
          确认授权
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { showToast, showConfirmDialog } from 'vant'
import { 
  getPrincipalAuths, 
  getAgentAuths, 
  createAuthorization, 
  revokeAuth as revokeAuthApi
} from '../api/agent'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref(0)
const principalAuths = ref([])
const agentAuths = ref([])
const showAdd = ref(false)

const newAuth = reactive({
  agentName: '',
  agentPhone: '',
  scopes: [],
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  requireConfirm: true
})

const scopeOptions = [
  { label: '社保业务', value: '社保业务' },
  { label: '证件办理', value: '证件办理' },
  { label: '医保业务', value: '医保业务' },
  { label: '住房服务', value: '住房服务' },
  { label: '交通出行', value: '交通出行' },
  { label: '其他', value: '其他' },
]

function onBack() {
  router.back()
}

async function loadPrincipalAuths() {
  try {
    const data = await getPrincipalAuths(userStore.currentUserId)
    principalAuths.value = data || []
  } catch (e) {
    console.error(e)
  }
}

async function loadAgentAuths() {
  try {
    const data = await getAgentAuths(userStore.currentUserId)
    agentAuths.value = data || []
  } catch (e) {
    console.error(e)
  }
}

function showAddAuth() {
  showAdd.value = true
}

function toggleScope(value) {
  const idx = newAuth.scopes.indexOf(value)
  if (idx > -1) {
    newAuth.scopes.splice(idx, 1)
  } else {
    newAuth.scopes.push(value)
  }
}

async function submitAuth() {
  if (!newAuth.agentName || !newAuth.agentPhone) {
    showToast('请填写受托人信息')
    return
  }
  if (newAuth.scopes.length === 0) {
    showToast('请选择授权范围')
    return
  }

  try {
    await createAuthorization({
      principalId: userStore.currentUserId,
      agentId: 2,
      authScope: newAuth.scopes,
      startTime: newAuth.startDate,
      endTime: newAuth.endDate,
      requireConfirm: newAuth.requireConfirm
    })
    showToast('授权成功')
    showAdd.value = false
    loadPrincipalAuths()
  } catch (e) {
    console.error(e)
  }
}

async function handleRevokeAuth(id) {
  try {
    await showConfirmDialog({
      title: '确认撤销',
      message: '撤销后受托人将无法再为您代办业务'
    })
    await revokeAuthApi({ authId: id })
    showToast('已撤销')
    loadPrincipalAuths()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

function viewOperations(auth) {
  showToast('查看操作记录')
}

function handleAgent(auth) {
  showToast('开始为 ' + auth.principal_name + ' 代办')
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

onMounted(() => {
  loadPrincipalAuths()
  loadAgentAuths()
})
</script>

<style scoped>
.agent-page {
  min-height: 100vh;
  background: #f5f7fa;
}

:deep(.van-nav-bar) {
  position: sticky;
  top: 0;
  z-index: 10;
}

:deep(.van-tabs__content) {
  padding-bottom: 80px;
}

.tab-content {
  padding: 12px;
}

.auth-card {
  margin-bottom: 12px;
  padding: 16px;
}

.auth-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.auth-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e88e5, #1565c0);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
}

.user-avatar.principal {
  background: linear-gradient(135deg, #ff9800, #f57c00);
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.user-phone {
  font-size: 13px;
  color: #999;
}

.auth-scope {
  margin-bottom: 12px;
}

.scope-label {
  font-size: 13px;
  color: #666;
  margin-right: 8px;
}

.scope-tag {
  display: inline-block;
  padding: 3px 10px;
  background: #e3f2fd;
  color: #1976d2;
  font-size: 12px;
  border-radius: 4px;
  margin-right: 6px;
  margin-bottom: 6px;
}

.auth-time {
  font-size: 12px;
  color: #999;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.auth-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.confirm-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.auth-actions {
  display: flex;
  gap: 10px;
}

.add-btn-wrapper {
  position: fixed;
  bottom: 60px;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: #fff;
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.add-auth-content {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.add-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-title {
  font-size: 18px;
  font-weight: 600;
}

.form-section {
  margin-bottom: 20px;
}

.form-label {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.scope-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.scope-option {
  padding: 8px 18px;
  background: #f5f7fa;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.scope-option.active {
  background: #e3f2fd;
  color: #1976d2;
  border-color: #1976d2;
}

.form-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: #fff3e0;
  border-radius: 8px;
  font-size: 13px;
  color: #f57c00;
  margin-bottom: 20px;
}
</style>
