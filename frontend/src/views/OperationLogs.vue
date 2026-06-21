<template>
  <div class="logs-page">
    <van-nav-bar
      title="审计日志"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    />

    <div class="filter-bar">
      <div class="filter-item" @click="showTypeFilter = true">
        <span>{{ typeLabel }}</span>
        <van-icon name="arrow-down" size="12" />
      </div>
      <div class="filter-item" @click="showLevelFilter = true">
        <span>{{ levelLabel }}</span>
        <van-icon name="arrow-down" size="12" />
      </div>
      <div class="filter-item date" @click="showDatePicker = true">
        <van-icon name="calendar-o" size="14" />
        <span>{{ filterDate || '全部日期' }}</span>
      </div>
    </div>

    <div class="stats-bar">
      <div class="sb-item">
        <div class="sb-num">{{ logStats.total }}</div>
        <div class="sb-label">总记录</div>
      </div>
      <div class="sb-item">
        <div class="sb-num warn">{{ logStats.warning }}</div>
        <div class="sb-label">风险</div>
      </div>
      <div class="sb-item">
        <div class="sb-num error">{{ logStats.error }}</div>
        <div class="sb-label">异常</div>
      </div>
    </div>

    <van-empty v-if="filteredList.length === 0" description="暂无日志记录" />

    <div class="log-list" v-else>
      <div class="log-item" v-for="log in filteredList" :key="log.id" @click="toggleExpand(log.id)">
        <div class="log-header">
          <div class="log-level" :class="'level-' + log.level">
            {{ levelMap[log.level] }}
          </div>
          <div class="log-type">{{ typeMap[log.type] }}</div>
          <div class="log-time">{{ formatTime(log.created_at) }}</div>
        </div>
        <div class="log-main">
          <div class="log-title">{{ log.title }}</div>
          <div class="log-user">操作人：{{ log.user_name || '系统' }}（{{ log.user_id || '-' }}）</div>
        </div>
        <div class="log-detail" v-if="expandedId === log.id">
          <div class="detail-row">
            <span class="dl-label">操作IP</span>
            <span class="dl-value">{{ log.ip || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="dl-label">设备信息</span>
            <span class="dl-value">{{ log.device || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="dl-label">操作描述</span>
            <span class="dl-value">{{ log.description }}</span>
          </div>
          <div class="detail-row" v-if="log.result">
            <span class="dl-label">操作结果</span>
            <span class="dl-value" :class="log.success ? 'success' : 'fail'">{{ log.result }}</span>
          </div>
          <div class="detail-row" v-if="log.trace_id">
            <span class="dl-label">追踪ID</span>
            <span class="dl-value mono">{{ log.trace_id }}</span>
          </div>
        </div>
        <div class="log-expand">
          <van-icon :name="expandedId === log.id ? 'arrow-up' : 'arrow-down'" size="14" color="#999" />
        </div>
      </div>
    </div>

    <van-popup v-model:show="showTypeFilter" position="bottom" round>
      <div class="popup-title">选择操作类型</div>
      <van-radio-group v-model="filterType">
        <van-cell
          v-for="(label, key) in typeMap"
          :key="key"
          clickable
          :title="label"
          @click="filterType = key; showTypeFilter = false"
        >
          <template #right-icon>
            <van-radio :name="key" />
          </template>
        </van-cell>
      </van-radio-group>
    </van-popup>

    <van-popup v-model:show="showLevelFilter" position="bottom" round>
      <div class="popup-title">选择风险等级</div>
      <van-radio-group v-model="filterLevel">
        <van-cell
          v-for="(label, key) in levelMap"
          :key="key"
          clickable
          :title="label"
          @click="filterLevel = key; showLevelFilter = false"
        >
          <template #right-icon>
            <van-radio :name="key" />
          </template>
        </van-cell>
      </van-radio-group>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const filterType = ref('all')
const filterLevel = ref('all')
const filterDate = ref('')
const showTypeFilter = ref(false)
const showLevelFilter = ref(false)
const showDatePicker = ref(false)
const expandedId = ref(null)

const typeMap = { all: '全部类型', login: '登录登出', identity: '身份码', appointment: '预约办理', agent: '亲友代办', admin: '后台管理', risk: '风险检测', system: '系统' }
const levelMap = { all: '全部等级', info: '普通', warning: '警告', error: '异常' }

const typeLabel = computed(() => typeMap[filterType.value])
const levelLabel = computed(() => levelMap[filterLevel.value])

const logStats = ref({ total: 1246, warning: 23, error: 5 })

const logList = ref([
  { id: 1, level: 'warning', type: 'risk', created_at: new Date(Date.now() - 60000 * 5).toISOString(), title: '检测到异地登录行为', user_name: '张**', user_id: 1001, ip: '203.0.113.45', device: 'iPhone 14 / iOS 17.2', description: '账号在非常用地点重庆市以外地区尝试登录，已触发风险校验', result: '已拦截', success: false, trace_id: 'TRC' + Date.now() + 'A001' },
  { id: 2, level: 'info', type: 'identity', created_at: new Date(Date.now() - 60000 * 15).toISOString(), title: '生成动态身份码', user_name: '李**', user_id: 1002, ip: '106.55.16.23', device: 'HUAWEI Mate 60 / HarmonyOS 4', description: '用户在渝中区政务服务中心生成动态身份码，有效期5分钟', result: '成功', success: true, trace_id: 'TRC' + Date.now() + 'A002' },
  { id: 3, level: 'info', type: 'appointment', created_at: new Date(Date.now() - 60000 * 45).toISOString(), title: '预约办理提交', user_name: '王**', user_id: 1003, ip: '106.55.16.88', device: 'Xiaomi 13 / MIUI 15', description: '预约江北区行政服务中心社保卡补办业务，预约时间2024-05-22 14:30', result: '成功', success: true, trace_id: 'TRC' + Date.now() + 'A003' },
  { id: 4, level: 'warning', type: 'agent', created_at: new Date(Date.now() - 60000 * 90).toISOString(), title: '代办操作待确认', user_name: '张**（委托人）', user_id: 1001, ip: '-', device: '-', description: '代办人张小华提交医保报销申请，需委托人二次确认', result: '待确认', success: null, trace_id: 'TRC' + Date.now() + 'A004' },
  { id: 5, level: 'error', type: 'system', created_at: new Date(Date.now() - 60000 * 120).toISOString(), title: '风险评估接口超时', user_name: '系统', user_id: '-', ip: '-', device: '-', description: '/api/identity/risk-assessment 接口响应时间超过3秒，影响用户数12人', result: '已自动重试恢复', success: true, trace_id: 'TRC' + Date.now() + 'A005' },
  { id: 6, level: 'info', type: 'admin', created_at: new Date(Date.now() - 60000 * 180).toISOString(), title: '窗口资源调度调整', user_name: '管理员admin', user_id: 1, ip: '106.55.16.10', device: 'Chrome / macOS', description: '将渝中区政务中心开放窗口从8个调整为10个，应对下午预约高峰', result: '成功', success: true, trace_id: 'TRC' + Date.now() + 'A006' },
  { id: 7, level: 'info', type: 'login', created_at: new Date(Date.now() - 60000 * 240).toISOString(), title: '用户登录', user_name: '赵**', user_id: 1004, ip: '106.55.16.67', device: 'OPPO Find X7 / ColorOS 14', description: '账号密码登录成功', result: '成功', success: true, trace_id: 'TRC' + Date.now() + 'A007' }
])

const filteredList = computed(() => {
  return logList.value.filter(l => {
    if (filterType.value !== 'all' && l.type !== filterType.value) return false
    if (filterLevel.value !== 'all' && l.level !== filterLevel.value) return false
    return true
  })
})

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}
</script>

<style scoped>
.logs-page { min-height: 100vh; background: #f5f7fa; }

.filter-bar {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}
.filter-item {
  display: flex; align-items: center; gap: 4px;
  padding: 6px 14px;
  background: #f5f5f5;
  border-radius: 16px;
  font-size: 13px;
  color: #333;
}
.filter-item.date { flex: 1; justify-content: center; }

.stats-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 12px;
  gap: 10px;
}
.sb-item {
  background: #fff;
  padding: 12px;
  border-radius: 10px;
  text-align: center;
}
.sb-num {
  font-size: 22px;
  font-weight: 700;
  color: #1976d2;
  margin-bottom: 3px;
}
.sb-num.warn { color: #ff9800; }
.sb-num.error { color: #e53935; }
.sb-label {
  font-size: 12px;
  color: #999;
}

.log-list { padding: 0 12px 20px; }
.log-item {
  position: relative;
  background: #fff;
  border-radius: 12px;
  padding: 14px 14px 14px 14px;
  margin-bottom: 10px;
}
.log-header {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 10px;
}
.log-level {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 500;
}
.log-level.level-info { background: #e3f2fd; color: #1976d2; }
.log-level.level-warning { background: #fff3e0; color: #ff9800; }
.log-level.level-error { background: #ffebee; color: #e53935; }
.log-type {
  font-size: 11px;
  color: #666;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 8px;
}
.log-time {
  margin-left: auto;
  font-size: 11px;
  color: #999;
}
.log-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  padding-right: 20px;
}
.log-user {
  font-size: 12px;
  color: #999;
}
.log-detail {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e0e0e0;
}
.detail-row {
  display: flex; justify-content: space-between;
  padding: 5px 0;
  font-size: 12px;
  gap: 10px;
}
.dl-label { color: #999; flex-shrink: 0; }
.dl-value { color: #333; text-align: right; flex: 1; word-break: break-all; }
.dl-value.success { color: #43a047; font-weight: 500; }
.dl-value.fail { color: #e53935; font-weight: 500; }
.dl-value.mono { font-family: 'Menlo', monospace; font-size: 11px; color: #666; }
.log-expand {
  position: absolute;
  right: 14px;
  bottom: 12px;
}

.popup-title {
  text-align: center;
  padding: 16px;
  font-weight: 600;
  font-size: 16px;
  border-bottom: 1px solid #f0f0f0;
}
</style>
