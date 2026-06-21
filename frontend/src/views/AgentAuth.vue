<template>
  <div class="agent-page">
    <van-nav-bar
      title="亲友代办"
      left-text="返回"
      left-arrow
      @click-left="onBack"
    />

    <van-tabs v-model:active="activeTab" sticky>
      <van-tab title="授权管理">
        <div class="tab-content">
          <div class="stat-row">
            <div class="stat-chip active-chip">
              <span class="chip-num">{{ activeCount }}</span>
              <span class="chip-label">生效中</span>
            </div>
            <div class="stat-chip expired-chip">
              <span class="chip-num">{{ expiredCount }}</span>
              <span class="chip-label">已过期</span>
            </div>
            <div class="stat-chip revoked-chip">
              <span class="chip-num">{{ revokedCount }}</span>
              <span class="chip-label">已撤销</span>
            </div>
          </div>

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
                <van-tag :type="getAuthTagType(auth)" size="medium">
                  {{ getAuthStatusText(auth) }}
                </van-tag>
              </div>

              <div class="auth-scope">
                <span class="scope-label">授权范围</span>
                <div class="scope-tags">
                  <span
                    v-for="scope in auth.auth_scope"
                    :key="scope"
                    class="scope-tag"
                  >{{ scope }}</span>
                </div>
              </div>

              <div class="auth-detail">
                <div class="detail-row">
                  <span class="detail-label">有效期</span>
                  <span class="detail-value">{{ formatDate(auth.start_time) }} 至 {{ formatDate(auth.end_time) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">剩余天数</span>
                  <span class="detail-value highlight" :class="{ warning: getRemainingDays(auth) <= 7, danger: getRemainingDays(auth) <= 0 }">
                    {{ getRemainingDays(auth) > 0 ? getRemainingDays(auth) + '天' : '已过期' }}
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">二次确认</span>
                  <span class="detail-value">
                    <van-tag :type="auth.require_confirm ? 'warning' : 'default'" plain size="mini">
                      {{ auth.require_confirm ? '每次操作需确认' : '免确认' }}
                    </van-tag>
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">操作留痕</span>
                  <span class="detail-value">{{ auth.operation_count || 0 }} 条记录</span>
                </div>
              </div>

              <div class="auth-footer">
                <van-button size="small" plain type="primary" @click="viewOperations(auth)">
                  <van-icon name="records" /> 留痕
                </van-button>
                <van-button
                  v-if="getPendingCount(auth) > 0"
                  size="small"
                  type="warning"
                  plain
                  @click="viewPending(auth)"
                >
                  <van-icon name="warning-o" /> 待确认({{ getPendingCount(auth) }})
                </van-button>
                <van-button
                  v-if="auth.status === 'active' && getRemainingDays(auth) > 0"
                  size="small"
                  type="danger"
                  plain
                  @click="handleRevokeAuth(auth.id)"
                >
                  <van-icon name="revoke" /> 撤销
                </van-button>
              </div>
            </div>
          </div>
          <van-empty v-else description="暂无委托记录" />
        </div>
      </van-tab>

      <van-tab title="操作留痕">
        <div class="tab-content">
          <div class="filter-bar">
            <van-dropdown-menu active-color="#1976d2">
              <van-dropdown-item v-model="operationFilter" :options="filterOptions" />
            </van-dropdown-menu>
          </div>

          <div v-if="filteredOperations.length > 0" class="timeline">
            <div
              v-for="op in filteredOperations"
              :key="op.id"
              class="timeline-item"
            >
              <div class="timeline-dot" :class="getOpDotClass(op)"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="op-type">{{ op.operation_type }}</span>
                  <span class="op-status" :class="getOpStatusClass(op)">
                    {{ getOpStatusText(op) }}
                  </span>
                </div>
                <div class="timeline-body">
                  <div class="op-detail">{{ op.operation_detail || '无详情' }}</div>
                  <div class="op-meta">
                    <span>代办人：{{ op.agent_name || '未知' }}</span>
                    <span v-if="op.confirm_method">确认方式：{{ op.confirm_method }}</span>
                  </div>
                  <div class="op-time">{{ formatDateTime(op.created_at) }}</div>
                  <div v-if="op.is_confirmed === 1 && op.confirmed_at" class="op-confirm-time">
                    确认时间：{{ formatDateTime(op.confirmed_at) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <van-empty v-else description="暂无操作记录" />
        </div>
      </van-tab>

      <van-tab title="待确认">
        <div class="tab-content">
          <div v-if="pendingOperations.length > 0">
            <div
              v-for="op in pendingOperations"
              :key="op.id"
              class="pending-card card"
            >
              <div class="pending-warning">
                <van-icon name="warning-o" color="#ff9800" size="20" />
                <span>需要您确认以下代办操作</span>
              </div>
              <div class="pending-body">
                <div class="pending-row">
                  <span class="pending-label">操作类型</span>
                  <span class="pending-value">{{ op.operation_type }}</span>
                </div>
                <div class="pending-row">
                  <span class="pending-label">操作详情</span>
                  <span class="pending-value">{{ op.operation_detail || '无' }}</span>
                </div>
                <div class="pending-row">
                  <span class="pending-label">代办人</span>
                  <span class="pending-value">{{ op.agent_name || '未知' }}</span>
                </div>
                <div class="pending-row">
                  <span class="pending-label">操作时间</span>
                  <span class="pending-value">{{ formatDateTime(op.created_at) }}</span>
                </div>
              </div>
              <div class="pending-actions">
                <van-button
                  type="danger"
                  size="small"
                  plain
                  round
                  @click="rejectOperation(op)"
                >拒绝</van-button>
                <van-button
                  type="primary"
                  size="small"
                  round
                  @click="confirmOperation(op)"
                >确认</van-button>
              </div>
            </div>
          </div>
          <van-empty v-else description="没有待确认操作" image="search" />
        </div>
      </van-tab>
    </van-tabs>

    <div class="add-btn-wrapper">
      <van-button type="primary" size="large" block round @click="showAddAuth">
        + 创建新授权
      </van-button>
    </div>

    <van-popup v-model:show="showAdd" round position="bottom" :style="{ height: '75%' }">
      <div class="add-auth-content">
        <div class="add-header">
          <div class="add-title">创建代办授权</div>
          <van-icon name="cross" size="22" @click="showAdd = false" />
        </div>

        <div class="form-section">
          <div class="form-label">受托人信息</div>
          <van-field
            v-model="newAuth.agentName"
            label="姓名"
            placeholder="请输入受托人姓名"
            required
          />
          <van-field
            v-model="newAuth.agentPhone"
            label="手机号"
            placeholder="请输入受托人手机号"
            type="tel"
            required
          />
        </div>

        <div class="form-section">
          <div class="form-label">授权范围（可多选）</div>
          <div class="scope-options">
            <div
              v-for="scope in scopeOptions"
              :key="scope.value"
              class="scope-option"
              :class="{ active: newAuth.scopes.includes(scope.value) }"
              @click="toggleScope(scope.value)"
            >
              <van-icon :name="newAuth.scopes.includes(scope.value) ? 'success' : 'circle'" />
              <span>{{ scope.label }}</span>
            </div>
          </div>
          <div class="scope-tip">
            <van-icon name="info-o" size="14" />
            授权范围内操作方可代办，范围外操作将被拦截
          </div>
        </div>

        <div class="form-section">
          <div class="form-label">授权时效</div>
          <van-field
            v-model="newAuth.startDate"
            label="开始日期"
            type="date"
            required
          />
          <van-field
            v-model="newAuth.endDate"
            label="结束日期"
            type="date"
            required
          />
          <div class="duration-options">
            <span
              v-for="d in durationOptions"
              :key="d.value"
              class="duration-chip"
              :class="{ active: newAuth.endDate === getEndDate(d.value) }"
              @click="setDuration(d.value)"
            >{{ d.label }}</span>
          </div>
        </div>

        <div class="form-section">
          <div class="form-label">安全设置</div>
          <van-cell-group inset>
            <van-cell title="操作需二次确认" label="每次代办操作需委托人确认后方可执行">
              <template #right-icon>
                <van-switch v-model="newAuth.requireConfirm" size="20px" />
              </template>
            </van-cell>
            <van-cell title="确认方式" v-if="newAuth.requireConfirm">
              <template #right-icon>
                <van-radio-group v-model="newAuth.confirmMethod" direction="horizontal">
                  <van-radio name="sms">短信</van-radio>
                  <van-radio name="face">人脸</van-radio>
                </van-radio-group>
              </template>
            </van-cell>
          </van-cell-group>
        </div>

        <div class="form-tip">
          <van-icon name="shield-o" />
          <span>代办操作将全程留痕可追溯，确保您的权益安全</span>
        </div>

        <van-button type="primary" block round size="large" @click="submitAuth">
          确认授权
        </van-button>
      </div>
    </van-popup>

    <van-popup v-model:show="showOperations" round position="bottom" :style="{ height: '60%' }">
      <div class="operations-popup">
        <div class="popup-header">
          <span>操作留痕 - {{ selectedAuth?.agent_name }}</span>
          <van-icon name="cross" size="22" @click="showOperations = false" />
        </div>
        <div v-if="authOperations.length > 0" class="op-list">
          <div v-for="op in authOperations" :key="op.id" class="op-item">
            <div class="op-left">
              <div class="op-type-tag" :class="getOpDotClass(op)">{{ op.operation_type }}</div>
              <div class="op-time-text">{{ formatDateTime(op.created_at) }}</div>
            </div>
            <div class="op-right">
              <van-tag :type="op.is_confirmed === 1 ? 'success' : 'warning'" size="mini">
                {{ op.is_confirmed === 1 ? '已确认' : '待确认' }}
              </van-tag>
            </div>
          </div>
        </div>
        <van-empty v-else description="暂无操作记录" />
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { showToast, showConfirmDialog } from 'vant'
import {
  getPrincipalAuths,
  getAgentAuths,
  createAuthorization,
  revokeAuth as revokeAuthApi,
  getOperations,
  confirmOperation as confirmOpApi
} from '../api/agent'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref(0)
const principalAuths = ref([])
const agentAuths = ref([])
const allOperations = ref([])
const showAdd = ref(false)
const showOperations = ref(false)
const selectedAuth = ref(null)
const authOperations = ref([])
const operationFilter = ref(0)

const newAuth = reactive({
  agentName: '',
  agentPhone: '',
  scopes: [],
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  requireConfirm: true,
  confirmMethod: 'sms'
})

const scopeOptions = [
  { label: '社保业务', value: '社保业务' },
  { label: '证件办理', value: '证件办理' },
  { label: '医保业务', value: '医保业务' },
  { label: '住房服务', value: '住房服务' },
  { label: '交通出行', value: '交通出行' },
  { label: '生育服务', value: '生育服务' },
  { label: '企业服务', value: '企业服务' },
  { label: '社会救助', value: '社会救助' },
]

const durationOptions = [
  { label: '7天', value: 7 },
  { label: '30天', value: 30 },
  { label: '90天', value: 90 },
  { label: '半年', value: 180 },
]

const filterOptions = [
  { text: '全部', value: 0 },
  { text: '已确认', value: 1 },
  { text: '待确认', value: 2 },
  { text: '已拒绝', value: 3 },
]

const activeCount = computed(() => principalAuths.value.filter(a => a.status === 'active' && getRemainingDays(a) > 0).length)
const expiredCount = computed(() => principalAuths.value.filter(a => a.status === 'active' && getRemainingDays(a) <= 0).length)
const revokedCount = computed(() => principalAuths.value.filter(a => a.status === 'revoked').length)

const filteredOperations = computed(() => {
  if (operationFilter.value === 0) return allOperations.value
  if (operationFilter.value === 1) return allOperations.value.filter(o => o.is_confirmed === 1)
  if (operationFilter.value === 2) return allOperations.value.filter(o => o.is_confirmed === 0)
  if (operationFilter.value === 3) return allOperations.value.filter(o => o.is_confirmed === -1)
  return allOperations.value
})

const pendingOperations = computed(() => {
  return allOperations.value.filter(o => o.is_confirmed === 0)
})

function onBack() { router.back() }

function getRemainingDays(auth) {
  if (!auth.end_time) return 0
  const end = new Date(auth.end_time)
  const now = new Date()
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24))
}

function getAuthTagType(auth) {
  if (auth.status === 'revoked') return 'danger'
  if (getRemainingDays(auth) <= 0) return 'default'
  return 'success'
}

function getAuthStatusText(auth) {
  if (auth.status === 'revoked') return '已撤销'
  if (getRemainingDays(auth) <= 0) return '已过期'
  return '生效中'
}

function getPendingCount(auth) {
  return allOperations.value.filter(o => o.auth_id === auth.id && o.is_confirmed === 0).length
}

function getOpDotClass(op) {
  if (op.is_confirmed === 1) return 'confirmed'
  if (op.is_confirmed === -1) return 'rejected'
  return 'pending'
}

function getOpStatusClass(op) {
  if (op.is_confirmed === 1) return 'status-confirmed'
  if (op.is_confirmed === -1) return 'status-rejected'
  return 'status-pending'
}

function getOpStatusText(op) {
  if (op.is_confirmed === 1) return '已确认'
  if (op.is_confirmed === -1) return '已拒绝'
  return '待确认'
}

async function loadPrincipalAuths() {
  try {
    const data = await getPrincipalAuths(userStore.currentUserId)
    principalAuths.value = data || []
  } catch (e) { console.error(e) }
}

async function loadAgentAuths() {
  try {
    const data = await getAgentAuths(userStore.currentUserId)
    agentAuths.value = data || []
  } catch (e) { console.error(e) }
}

async function loadAllOperations() {
  try {
    const ops = []
    for (const auth of principalAuths.value) {
      try {
        const data = await getOperations(auth.id, { pageSize: 50 })
        const list = (data || []).map(op => ({
          ...op,
          agent_name: auth.agent_name,
          auth_id: auth.id
        }))
        ops.push(...list)
      } catch (e) { console.error(e) }
    }
    allOperations.value = ops.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (e) { console.error(e) }
}

function showAddAuth() { showAdd.value = true }

function toggleScope(value) {
  const idx = newAuth.scopes.indexOf(value)
  if (idx > -1) newAuth.scopes.splice(idx, 1)
  else newAuth.scopes.push(value)
}

function getEndDate(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
}

function setDuration(days) {
  newAuth.endDate = getEndDate(days)
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
    showToast('授权创建成功')
    showAdd.value = false
    newAuth.agentName = ''
    newAuth.agentPhone = ''
    newAuth.scopes = []
    loadPrincipalAuths()
  } catch (e) { console.error(e) }
}

async function handleRevokeAuth(id) {
  try {
    await showConfirmDialog({
      title: '确认撤销',
      message: '撤销后受托人将无法再为您代办任何业务，已执行的代办操作留痕不受影响。'
    })
    await revokeAuthApi({ authId: id })
    showToast('授权已撤销')
    loadPrincipalAuths()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

async function viewOperations(auth) {
  selectedAuth.value = auth
  try {
    const data = await getOperations(auth.id, { pageSize: 50 })
    authOperations.value = data || []
  } catch (e) {
    authOperations.value = []
  }
  showOperations.value = true
}

function viewPending(auth) {
  activeTab.value = 2
}

async function confirmOperation(op) {
  try {
    await showConfirmDialog({
      title: '确认代办操作',
      message: `确认允许代办人执行「${op.operation_type}」操作？确认后操作将立即执行。`
    })
    await confirmOpApi({ operationId: op.id, confirmed: true })
    showToast('已确认')
    loadAllOperations()
    loadPrincipalAuths()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

async function rejectOperation(op) {
  try {
    await showConfirmDialog({
      title: '拒绝代办操作',
      message: `拒绝代办人执行「${op.operation_type}」操作？`
    })
    await confirmOpApi({ operationId: op.id, confirmed: false })
    showToast('已拒绝')
    loadAllOperations()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(async () => {
  await loadPrincipalAuths()
  await loadAgentAuths()
  await loadAllOperations()
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

.stat-row {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.stat-chip {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-radius: 10px;
}

.active-chip {
  background: #e8f5e9;
}

.expired-chip {
  background: #f5f5f5;
}

.revoked-chip {
  background: #ffebee;
}

.chip-num {
  font-size: 22px;
  font-weight: 700;
  color: #333;
}

.chip-label {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
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

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
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
  margin-bottom: 6px;
  display: block;
}

.scope-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.scope-tag {
  display: inline-block;
  padding: 3px 10px;
  background: #e3f2fd;
  color: #1976d2;
  font-size: 12px;
  border-radius: 4px;
}

.auth-detail {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 14px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  font-size: 13px;
}

.detail-label {
  color: #999;
}

.detail-value {
  color: #333;
  font-weight: 500;
}

.detail-value.highlight {
  color: #43a047;
}

.detail-value.warning {
  color: #ff9800;
}

.detail-value.danger {
  color: #e53935;
}

.auth-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.filter-bar {
  margin-bottom: 12px;
}

.timeline {
  padding-left: 20px;
  position: relative;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e0e0e0;
}

.timeline-item {
  position: relative;
  margin-bottom: 16px;
  padding-left: 20px;
}

.timeline-dot {
  position: absolute;
  left: -16px;
  top: 6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #e0e0e0;
  background: #fff;
}

.timeline-dot.confirmed {
  background: #43a047;
  border-color: #43a047;
}

.timeline-dot.rejected {
  background: #e53935;
  border-color: #e53935;
}

.timeline-dot.pending {
  background: #ff9800;
  border-color: #ff9800;
}

.timeline-content {
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.op-type {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.op-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.status-confirmed {
  background: #e8f5e9;
  color: #43a047;
}

.status-rejected {
  background: #ffebee;
  color: #e53935;
}

.status-pending {
  background: #fff3e0;
  color: #ff9800;
}

.op-detail {
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.op-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.op-time {
  font-size: 12px;
  color: #bbb;
}

.op-confirm-time {
  font-size: 12px;
  color: #43a047;
  margin-top: 4px;
}

.pending-card {
  margin-bottom: 12px;
  padding: 16px;
}

.pending-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #ff9800;
  font-weight: 500;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #ffe0b2;
}

.pending-body {
  margin-bottom: 14px;
}

.pending-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
}

.pending-label {
  color: #999;
}

.pending-value {
  color: #333;
  font-weight: 500;
}

.pending-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #f5f7fa;
  border-radius: 20px;
  font-size: 13px;
  color: #666;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.scope-option.active {
  background: #e3f2fd;
  color: #1976d2;
  border-color: #1976d2;
}

.scope-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.duration-options {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.duration-chip {
  padding: 6px 14px;
  background: #f5f7fa;
  border-radius: 16px;
  font-size: 13px;
  color: #666;
  border: 1px solid transparent;
}

.duration-chip.active {
  background: #e3f2fd;
  color: #1976d2;
  border-color: #1976d2;
}

.form-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: #e8f5e9;
  border-radius: 8px;
  font-size: 13px;
  color: #2e7d32;
  margin-bottom: 20px;
}

.operations-popup {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}

.op-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.op-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.op-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.op-type-tag {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.op-type-tag.confirmed { color: #43a047; }
.op-type-tag.rejected { color: #e53935; }
.op-type-tag.pending { color: #ff9800; }

.op-time-text {
  font-size: 12px;
  color: #999;
}
</style>
