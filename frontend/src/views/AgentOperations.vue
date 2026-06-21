<template>
  <div class="agent-ops-page">
    <van-nav-bar
      title="代办记录"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    >
      <template #right>
        <span class="nav-btn" @click="goCreate">新建授权</span>
      </template>
    </van-nav-bar>

    <van-tabs v-model:active="activeTab" sticky offset-top="46" line-width="20px">
      <van-tab title="授权列表" name="auth" />
      <van-tab title="操作留痕" name="ops" />
      <van-tab title="待确认" name="pending" />
    </van-tabs>

    <div class="tab-content" v-if="activeTab === 'auth'">
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-num">{{ authList.filter(a => a.status === 'active').length }}</div>
          <div class="stat-label">生效中</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">{{ authList.filter(a => a.status === 'expired').length }}</div>
          <div class="stat-label">已过期</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">{{ authList.filter(a => a.status === 'revoked').length }}</div>
          <div class="stat-label">已撤销</div>
        </div>
      </div>

      <div class="auth-list" v-if="authList.length">
        <div class="auth-card" v-for="a in authList" :key="a.id">
          <div class="auth-header">
            <div class="agent-info">
              <div class="agent-avatar">
                <span>{{ a.agent_name?.charAt(0) }}</span>
              </div>
              <div class="agent-detail">
                <div class="agent-name-row">
                  <span class="agent-name">{{ a.agent_name }}</span>
                  <span class="agent-relation">{{ a.relation }}</span>
                </div>
                <div class="agent-phone">{{ a.agent_phone }}</div>
              </div>
            </div>
            <span class="auth-status" :class="'status-' + a.status">
              {{ statusMap[a.status] }}
            </span>
          </div>

          <div class="auth-body">
            <div class="ab-row">
              <span class="ab-label">授权事项</span>
              <span class="ab-value">{{ a.scope_list?.length || 0 }}项</span>
            </div>
            <div class="ab-tags">
              <van-tag v-for="s in a.scope_list?.slice(0, 4)" :key="s" plain type="primary" size="small" style="margin: 2px">{{ s }}</van-tag>
              <van-tag v-if="a.scope_list?.length > 4" plain size="small" style="margin: 2px">+{{ a.scope_list.length - 4 }}</van-tag>
            </div>
            <div class="ab-row">
              <span class="ab-label">有效期</span>
              <span class="ab-value">{{ a.start_date }} ~ {{ a.end_date }}</span>
            </div>
            <div class="ab-row">
              <span class="ab-label">确认方式</span>
              <span class="ab-value">{{ a.confirm_type === 'sms' ? '短信验证' : a.confirm_type === 'push' ? 'APP推送' : '无需确认' }}</span>
            </div>
          </div>

          <div class="auth-actions" v-if="a.status === 'active'">
            <van-button size="small" plain @click="viewOps(a)">查看操作</van-button>
            <van-button size="small" plain type="warning" @click="handleRevoke(a)" style="margin-left: 8px">撤销授权</van-button>
          </div>
        </div>
      </div>

      <van-empty v-else description="暂无授权记录" />

      <van-button block type="primary" style="margin: 16px" @click="goCreate">
        <van-icon name="plus" /> 创建新授权
      </van-button>
    </div>

    <div class="tab-content" v-if="activeTab === 'ops'">
      <div class="ops-list" v-if="opsList.length">
        <div class="ops-item" v-for="o in opsList" :key="o.id">
          <div class="ops-time">{{ formatTime(o.created_at) }}</div>
          <div class="ops-card">
            <div class="ops-icon" :class="'type-' + (o.need_confirm ? 'confirm' : 'direct')">
              <van-icon :name="o.status === 'confirmed' ? 'passed' : 'clock-o'" size="20" />
            </div>
            <div class="ops-info">
              <div class="ops-title">{{ o.operation_type }}</div>
              <div class="ops-detail">代办人：{{ o.agent_name }} · {{ o.relation }}</div>
              <div class="ops-status" :class="'st-' + o.status">
                {{ opsStatusMap[o.status] }}
              </div>
            </div>
            <van-button v-if="o.status === 'pending'" size="small" type="primary" @click="goConfirm(o.id)">处理</van-button>
          </div>
        </div>
      </div>
      <van-empty v-else description="暂无操作记录" />
    </div>

    <div class="tab-content" v-if="activeTab === 'pending'">
      <div class="pending-list" v-if="pendingList.length">
        <div class="pending-card" v-for="p in pendingList" :key="p.id">
          <div class="p-header">
            <van-tag type="warning">待确认</van-tag>
            <span class="p-time">{{ formatTime(p.created_at) }}</span>
          </div>
          <div class="p-body">
            <div class="p-title">{{ p.operation_type }}</div>
            <div class="p-desc">代办人：{{ p.agent_name }}（{{ p.relation }}）</div>
            <div class="p-tip" v-if="p.need_confirm">
              <van-icon name="info-o" size="12" color="#ff9800" />
              <span>该操作需要您确认后方可生效</span>
            </div>
          </div>
          <div class="p-actions">
            <van-button size="small" plain @click="rejectOps(p)">拒绝</van-button>
            <van-button size="small" type="primary" @click="confirmOps(p)" style="margin-left: 8px">确认</van-button>
          </div>
        </div>
      </div>
      <van-empty v-else description="暂无待确认事项" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useUserStore } from '../store/user'
import { revokeAuth as revokeAuthApi, getAgentOperations, confirmOperation } from '../api/agent'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('auth')

const statusMap = { active: '生效中', expired: '已过期', revoked: '已撤销' }
const opsStatusMap = { confirmed: '已完成', pending: '待确认', rejected: '已拒绝', direct: '直接办理' }

const authList = ref([])
const opsList = ref([])
const pendingList = ref([])

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function goCreate() { router.push('/elder/agent/create') }
function goConfirm(id) { router.push(`/elder/agent/confirm?id=${id}`) }
function viewOps(a) {
  router.push({ path: '/elder/agent/operations', query: { auth_id: a.id } })
  activeTab.value = 'ops'
}

async function handleRevoke(a) {
  try {
    await showConfirmDialog({
      title: '撤销授权',
      message: `确定要撤销对「${a.agent_name}」的代办授权吗？撤销后该代办人将无法继续代办您的业务。`,
      confirmButtonText: '确认撤销',
      confirmButtonColor: '#e53935'
    })
    try {
      await revokeAuthApi({ auth_id: a.id, user_id: userStore.currentUserId })
    } catch (e) {}
    a.status = 'revoked'
    showToast('已撤销授权')
  } catch (e) {}
}

async function confirmOps(p) {
  try {
    await confirmOperation({ operation_id: p.id, confirmed: true, user_id: userStore.currentUserId })
  } catch (e) {}
  p.status = 'confirmed'
  pendingList.value = pendingList.value.filter(x => x.id !== p.id)
  showToast('已确认操作')
}

async function rejectOps(p) {
  try {
    await showConfirmDialog({
      title: '拒绝操作',
      message: `确定要拒绝「${p.agent_name}」的代办操作请求吗？`,
      confirmButtonText: '拒绝',
      confirmButtonColor: '#e53935'
    })
    try {
      await confirmOperation({ operation_id: p.id, confirmed: false, user_id: userStore.currentUserId })
    } catch (e) {}
    p.status = 'rejected'
    pendingList.value = pendingList.value.filter(x => x.id !== p.id)
    showToast('已拒绝')
  } catch (e) {}
}

onMounted(async () => {
  authList.value = [
    {
      id: 1, agent_name: '张小华', agent_phone: '138****5678', relation: '儿子',
      status: 'active',
      scope_list: ['社保查询', '医保报销', '养老金认证', '身份证补办'],
      start_date: '2024-01-15', end_date: '2024-12-31',
      confirm_type: 'sms'
    },
    {
      id: 2, agent_name: '李淑芬', agent_phone: '139****1234', relation: '配偶',
      status: 'active',
      scope_list: ['公积金查询', '公积金提取'],
      start_date: '2024-02-01', end_date: '2024-07-31',
      confirm_type: 'push'
    },
    {
      id: 3, agent_name: '王建国', agent_phone: '137****8888', relation: '朋友',
      status: 'expired',
      scope_list: ['交通违法处理'],
      start_date: '2023-10-01', end_date: '2023-12-31',
      confirm_type: 'sms'
    }
  ]
  try {
    const res = await getAgentOperations(userStore.currentUserId)
    if (res?.length) opsList.value = res
  } catch (e) {}
  if (opsList.value.length === 0) {
    opsList.value = [
      { id: 101, operation_type: '养老金资格认证', agent_name: '张小华', relation: '儿子', status: 'confirmed', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), need_confirm: false },
      { id: 102, operation_type: '医保报销申请', agent_name: '张小华', relation: '儿子', status: 'pending', created_at: new Date(Date.now() - 3600000 * 5).toISOString(), need_confirm: true },
      { id: 103, operation_type: '社保缴费查询', agent_name: '李淑芬', relation: '配偶', status: 'confirmed', created_at: new Date(Date.now() - 86400000 * 5).toISOString(), need_confirm: false }
    ]
  }
  pendingList.value = opsList.value.filter(o => o.status === 'pending')
})
</script>

<style scoped>
.agent-ops-page { min-height: 100vh; background: #f5f7fa; }
.nav-btn { font-size: 14px; color: #1976d2; padding-right: 14px; }

.stats-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 16px;
  gap: 10px;
}
.stat-item {
  background: #fff;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
}
.stat-num {
  font-size: 22px;
  font-weight: 700;
  color: #1976d2;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 12px;
  color: #999;
}

.auth-list { padding: 0 12px 20px; }
.auth-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.auth-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f5f5f5;
}
.agent-info { display: flex; align-items: center; gap: 12px; }
.agent-avatar {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  font-weight: 600;
  flex-shrink: 0;
}
.agent-name-row {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 3px;
}
.agent-name { font-size: 15px; font-weight: 600; color: #333; }
.agent-relation {
  font-size: 11px;
  padding: 1px 8px;
  background: #fff3e0;
  color: #f57c00;
  border-radius: 8px;
}
.agent-phone { font-size: 12px; color: #999; }

.auth-status {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 10px;
  font-weight: 500;
}
.auth-status.status-active { background: #e8f5e9; color: #43a047; }
.auth-status.status-expired { background: #f5f5f5; color: #999; }
.auth-status.status-revoked { background: #ffebee; color: #e53935; }

.auth-body { margin-bottom: 14px; }
.ab-row {
  display: flex; justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
}
.ab-label { color: #999; }
.ab-value { color: #333; font-weight: 500; }
.ab-tags { padding: 4px 0 8px; }

.auth-actions {
  display: flex; justify-content: flex-end;
  padding-top: 14px;
  border-top: 1px solid #f5f5f5;
}

.ops-list { padding: 12px; }
.ops-item { margin-bottom: 14px; }
.ops-time {
  font-size: 12px;
  color: #999;
  text-align: center;
  margin-bottom: 8px;
}
.ops-card {
  display: flex; align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  gap: 12px;
}
.ops-icon {
  width: 40px; height: 40px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.ops-icon.type-confirm { background: linear-gradient(135deg, #ff9800, #f57c00); }
.ops-icon.type-direct { background: linear-gradient(135deg, #43a047, #2e7d32); }
.ops-info { flex: 1; }
.ops-title { font-size: 14px; font-weight: 500; color: #333; margin-bottom: 4px; }
.ops-detail { font-size: 12px; color: #999; margin-bottom: 6px; }
.ops-status { font-size: 12px; font-weight: 500; }
.ops-status.st-confirmed { color: #43a047; }
.ops-status.st-pending { color: #ff9800; }
.ops-status.st-rejected { color: #e53935; }
.ops-status.st-direct { color: #1976d2; }

.pending-list { padding: 12px; }
.pending-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1.5px solid #ffe0b2;
}
.p-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px;
}
.p-time { font-size: 12px; color: #999; }
.p-title { font-size: 15px; font-weight: 600; color: #333; margin-bottom: 6px; }
.p-desc { font-size: 13px; color: #666; margin-bottom: 10px; }
.p-tip {
  display: flex; align-items: center; gap: 4px;
  padding: 8px 10px;
  background: #fff8e1;
  border-radius: 8px;
  font-size: 12px;
  color: #b26a00;
  margin-bottom: 12px;
}
.p-actions { display: flex; justify-content: flex-end; }
</style>
