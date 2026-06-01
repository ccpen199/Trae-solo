<template>
  <div class="order-detail">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <p class="error-text">{{ error }}</p>
      <button class="btn-primary" @click="loadOrder">重试</button>
    </div>
    <div v-else-if="order">
    <div class="page-header">
      <div>
        <h1>订单详情 - {{ order.order_no }}</h1>
        <p class="sub-title">一对一专送 · 高确定性即时配送</p>
      </div>
      <div class="header-right">
        <span class="status" :class="order.status">{{ getStatusName(order.status) }}</span>
        <span v-if="order.is_backup" class="backup-badge">🔄 替补骑手</span>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h3>📦 订单信息</h3>
        <div class="info-row">
          <span class="label">品类</span>
          <span class="value">{{ getCategoryName(order.category) }}</span>
        </div>
        <div class="info-row" v-if="order.sub_category">
          <span class="label">子品类</span>
          <span class="value">{{ order.sub_category }}</span>
        </div>
        <div class="info-row">
          <span class="label">重量</span>
          <span class="value">{{ order.weight }} kg</span>
        </div>
        <div class="info-row" v-if="order.enterprise_type">
          <span class="label">企业定制</span>
          <span class="value highlight">{{ order.enterprise_type === 'pharmacy' ? '连锁药店SOP' : '律所自动归档' }}</span>
        </div>
        <div class="info-row">
          <span class="label">超时次数</span>
          <span class="value" :class="{ 'warning': order.timeout_count > 0 }">{{ order.timeout_count }}</span>
        </div>
        <div class="info-row">
          <span class="label">创建时间</span>
          <span class="value">{{ formatTime(order.created_at) }}</span>
        </div>
      </div>

      <div class="card">
        <h3>📍 取件信息</h3>
        <div class="info-row">
          <span class="label">地址</span>
          <span class="value">{{ order.pickup_address }}</span>
        </div>
        <div class="info-row">
          <span class="label">联系人</span>
          <span class="value">{{ order.pickup_name }}</span>
        </div>
        <div class="info-row">
          <span class="label">电话</span>
          <span class="value">{{ order.pickup_phone }}</span>
        </div>
        <div class="info-row">
          <span class="label">GPS坐标</span>
          <span class="value geo">{{ order.pickup_lat }}, {{ order.pickup_lng }}</span>
        </div>
      </div>

      <div class="card">
        <h3>🏠 送达信息</h3>
        <div class="info-row">
          <span class="label">地址</span>
          <span class="value">{{ order.delivery_address }}</span>
        </div>
        <div class="info-row">
          <span class="label">联系人</span>
          <span class="value">{{ order.delivery_name }}</span>
        </div>
        <div class="info-row">
          <span class="label">电话</span>
          <span class="value">{{ order.delivery_phone }}</span>
        </div>
        <div class="info-row">
          <span class="label">GPS坐标</span>
          <span class="value geo">{{ order.delivery_lat }}, {{ order.delivery_lng }}</span>
        </div>
      </div>

      <div class="card" v-if="order.rider_id">
        <h3>🚴 当前配送骑手</h3>
        <div class="rider-info" v-if="rider">
          <div class="rider-avatar">{{ rider.name.charAt(0) }}</div>
          <div class="rider-details">
            <div class="rider-name">{{ rider.name }}</div>
            <div class="rider-phone">{{ rider.phone }}</div>
            <div class="rider-stats">
              <span class="stat-tag">⏱️ 准时率 {{ rider.on_time_rate }}%</span>
              <span class="stat-tag">💪 负重 {{ rider.load_capacity }}kg</span>
              <span class="stat-tag">📋 完成 {{ rider.total_orders }} 单</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card category-card" v-if="order.category">
        <h3>{{ getCategoryIcon(order.category) }} {{ getCategoryName(order.category) }}专送规范</h3>
        
        <div v-if="order.category === 'pet'" class="category-details">
          <div class="spec-item">
            <span class="spec-icon">📦</span>
            <div class="spec-content">
              <span class="spec-label">航空箱要求</span>
              <span class="spec-value">符合IATA航空运输标准，尺寸 60×40×40cm</span>
            </div>
            <span class="spec-status ok">✓ 已确认</span>
          </div>
          <div class="spec-item">
            <span class="spec-icon">📡</span>
            <div class="spec-content">
              <span class="spec-label">物联网传感器</span>
              <span class="spec-value">实时温度 22°C · 湿度 55% · 震动正常</span>
            </div>
            <span class="spec-status ok">✓ 在线</span>
          </div>
          <div class="spec-item">
            <span class="spec-icon">🐾</span>
            <div class="spec-content">
              <span class="spec-label">宠物信息</span>
              <span class="spec-value">{{ order.sub_category || '宠物' }} · 约 {{ order.weight }}kg</span>
            </div>
            <span class="spec-status ok">✓ 已核验</span>
          </div>
          <div class="spec-item warning">
            <span class="spec-icon">⚠️</span>
            <div class="spec-content">
              <span class="spec-label">特殊要求</span>
              <span class="spec-value">禁止开启航空箱 · 平稳驾驶 · 避免急刹车</span>
            </div>
            <span class="spec-status warning">骑手已确认</span>
          </div>
        </div>

        <div v-else-if="order.category === 'fresh'" class="category-details">
          <div class="spec-item">
            <span class="spec-icon">❄️</span>
            <div class="spec-content">
              <span class="spec-label">温控箱状态</span>
              <span class="spec-value">冷藏模式 · 实时温度 3.5°C</span>
            </div>
            <span class="spec-status ok">✓ 正常</span>
          </div>
          <div class="spec-item">
            <span class="spec-icon">🌡️</span>
            <div class="spec-content">
              <span class="spec-label">温度范围</span>
              <span class="spec-value">要求 0-4°C · 全程冷链</span>
            </div>
            <span class="spec-status ok">✓ 达标</span>
          </div>
          <div class="spec-item">
            <span class="spec-icon">⏱️</span>
            <div class="spec-content">
              <span class="spec-label">时效要求</span>
              <span class="spec-value">45分钟内送达 · 剩余 {{ getRemainingTime() }} 分钟</span>
            </div>
            <span class="spec-status" :class="getRemainingTime() < 15 ? 'warning' : 'ok'">
              {{ getRemainingTime() < 15 ? '⚠️ 紧张' : '✓ 正常' }}
            </span>
          </div>
          <div class="temp-chart">
            <div class="temp-bars">
              <div v-for="i in 8" :key="i" class="temp-bar" 
                   :class="{ low: i <= 2, normal: i > 2 && i <= 6, high: i > 6 }">
              </div>
            </div>
            <span class="temp-label">温度历史记录（每5分钟采样）</span>
          </div>
        </div>

        <div v-else-if="order.category === 'pharmacy'" class="category-details">
          <div class="spec-item">
            <span class="spec-icon">💊</span>
            <div class="spec-content">
              <span class="spec-label">阴凉储存要求</span>
              <span class="spec-value">20°C以下 · 避光保存</span>
            </div>
            <span class="spec-status ok">✓ 合规</span>
          </div>
          <div class="spec-item warning">
            <span class="spec-icon">📋</span>
            <div class="spec-content">
              <span class="spec-label">处方核验</span>
              <span class="spec-value">处方药配送 · 需核验处方并拍照存证</span>
            </div>
            <span class="spec-status warning">按SOP执行</span>
          </div>
          <div class="spec-item">
            <span class="spec-icon">🔍</span>
            <div class="spec-content">
              <span class="spec-label">合规提醒</span>
              <span class="spec-value">需查看企业定制SOP · 4步流程办理</span>
            </div>
            <span class="spec-status ok">✓ 已配置</span>
          </div>
          <div class="compliance-check">
            <span class="check-item ok">✓ 药品分类</span>
            <span class="check-item ok">✓ 温湿度记录</span>
            <span class="check-item ok">✓ 签收人身份核验</span>
            <span class="check-item pending">⏳ 处方核验</span>
          </div>
        </div>

        <div v-else-if="order.category === 'document'" class="category-details">
          <div class="spec-item warning">
            <span class="spec-icon">🔒</span>
            <div class="spec-content">
              <span class="spec-label">保密协议</span>
              <span class="spec-value">文件内容涉密 · 禁止拆封 · 需本人签收</span>
            </div>
            <span class="spec-status warning">严格执行</span>
          </div>
          <div class="spec-item">
            <span class="spec-icon">📝</span>
            <div class="spec-content">
              <span class="spec-label">文件类型</span>
              <span class="spec-value">{{ order.sub_category || '文件' }} · 约 {{ order.weight }}kg</span>
            </div>
            <span class="spec-status ok">✓ 已登记</span>
          </div>
          <div class="spec-item">
            <span class="spec-icon">✍️</span>
            <div class="spec-content">
              <span class="spec-label">签收要求</span>
              <span class="spec-value">手写签名 + 拍照存证 · 自动归档</span>
            </div>
            <span class="spec-status ok">✓ 已配置</span>
          </div>
          <div class="privacy-notice">
            <span class="privacy-icon">🛡️</span>
            <span>本文件配送全程可追溯 · 符合《保密法》《电子签名法》要求</span>
          </div>
        </div>
      </div>
    </div>

    <div class="section" v-if="order.status === 'pending'">
      <div class="section-header">
        <h3>🎯 毫秒级骑手匹配引擎</h3>
        <button class="btn-primary" @click="loadCandidates">{{ candidates ? '重新匹配' : '加载匹配候选' }}</button>
      </div>
      
      <div v-if="candidates" class="matching-result">
        <div class="matching-stats">
          <div class="stat-box">
            <span class="stat-num">{{ candidates.durationMs.toFixed(2) }}</span>
            <span class="stat-label">匹配耗时 (ms)</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">{{ candidates.riders.length }}</span>
            <span class="stat-label">可用骑手</span>
          </div>
          <div class="weight-config">
            <span>加权配置：</span>
            <span class="weight-tag">距离 35%</span>
            <span class="weight-tag">准时率 25%</span>
            <span class="weight-tag">负重 15%</span>
            <span class="weight-tag">品类专精 25%</span>
          </div>
        </div>
        
        <div class="candidates-list">
          <div v-for="(rider, idx) in candidates.riders" :key="rider.id" class="candidate-item" :class="{ best: idx === 0 }">
            <div class="candidate-rank">{{ idx === 0 ? '🥇 最佳' : '#' + (idx + 1) }}</div>
            <div class="candidate-info">
              <div class="candidate-name">{{ rider.name }}</div>
              <div class="candidate-skills">
                <span class="skill-tag" v-for="(v, k) in parseSkills(rider.skills)" :key="k">
                  {{ getCategoryName(k) }} {{ (v * 100).toFixed(0) }}%
                </span>
              </div>
            </div>
            <div class="candidate-scores">
              <div class="score-bar">
                <div class="score-label">距离</div>
                <div class="bar">
                  <div class="bar-fill" :style="{ width: rider.distanceScore + '%' }"></div>
                </div>
                <span class="score-val">{{ (rider.distance / 1000).toFixed(2) }}km</span>
              </div>
              <div class="score-bar">
                <div class="score-label">准时率</div>
                <div class="bar">
                  <div class="bar-fill" :style="{ width: rider.onTimeScore + '%' }"></div>
                </div>
                <span class="score-val">{{ rider.onTimeScore.toFixed(1) }}</span>
              </div>
              <div class="score-bar">
                <div class="score-label">负重</div>
                <div class="bar">
                  <div class="bar-fill" :style="{ width: rider.loadScore + '%' }"></div>
                </div>
                <span class="score-val">{{ rider.loadScore.toFixed(1) }}</span>
              </div>
              <div class="score-bar">
                <div class="score-label">品类专精</div>
                <div class="bar">
                  <div class="bar-fill" :style="{ width: rider.skillScore + '%' }"></div>
                </div>
                <span class="score-val">{{ rider.skillScore.toFixed(1) }}</span>
              </div>
            </div>
            <div class="candidate-total">
              <div class="total-score">{{ rider.totalScore.toFixed(1) }}</div>
              <div class="total-label">综合评分</div>
            </div>
            <button v-if="idx === 0" class="btn-primary match-btn" @click="confirmMatch">确认匹配</button>
          </div>
        </div>
      </div>
    </div>

    <div class="section" v-if="['matched', 'picking'].includes(order.status)">
      <div class="section-header">
        <h3>⚠️ 异常熔断机制</h3>
        <div class="header-buttons">
          <button class="btn-secondary" @click="checkTimeout(false)">正常检测</button>
          <button class="btn-danger" @click="checkTimeout(true)">⚡ 模拟超时5分钟触发熔断</button>
        </div>
      </div>

      <div v-if="timeoutResult" class="timeout-result" :class="{ 
        triggered: timeoutResult.triggered, 
        normal: !timeoutResult.triggered 
      }">
        <div class="timeout-icon">{{ timeoutResult.triggered ? '🔴' : '✅' }}</div>
        <div class="timeout-content">
          <strong>{{ timeoutResult.triggered ? '熔断已触发 - 替补骑手已接管' : '配送正常 - 骑手按时履约中' }}</strong>
          <p class="timeout-msg">{{ timeoutResult.message }}</p>
          
          <div class="timeout-details" v-if="timeoutResult.triggered">
            <div class="detail-row">
              <span>熔断原因：</span>
              <span class="highlight">{{ timeoutResult.fuseReason }}</span>
            </div>
            <div class="detail-row">
              <span>已超时：</span>
              <span class="warning">{{ timeoutResult.elapsedMinutes }} 分钟</span>
            </div>
            <div class="detail-row">
              <span>超时次数：</span>
              <span class="warning">第 {{ timeoutResult.timeoutCount }} 次</span>
            </div>
            <div class="rider-swap">
              <div class="swap-from">
                <div class="swap-label">原骑手</div>
                <div class="swap-name">{{ timeoutResult.originalRider?.name }}</div>
              </div>
              <div class="swap-arrow">→</div>
              <div class="swap-to">
                <div class="swap-label">替补骑手</div>
                <div class="swap-name">{{ timeoutResult.newRider?.name }}</div>
              </div>
            </div>
            
            <div v-if="timeoutResult.candidates" class="candidates-mini">
              <h4>匹配依据复查</h4>
              <div class="mini-candidate" v-for="(c, idx) in timeoutResult.candidates" :key="c.id">
                <span class="mini-rank">{{ idx + 1 }}</span>
                <span class="mini-name">{{ c.name }}</span>
                <span class="mini-score">{{ c.totalScore.toFixed(1) }}分</span>
              </div>
            </div>
          </div>

          <div class="timeout-details" v-if="!timeoutResult.triggered">
            <div class="detail-row">
              <span>已配送：</span>
              <span>{{ timeoutResult.elapsedMinutes }} 分钟</span>
            </div>
            <div class="detail-row">
              <span>当前骑手：</span>
              <span>{{ timeoutResult.currentRider?.name }}</span>
            </div>
            <div class="detail-row">
              <span>订单状态：</span>
              <span>{{ getStatusName(timeoutResult.orderStatus) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section actions">
      <button v-if="order.status === 'matched'" class="btn-primary" @click="pickupOrder">📦 确认取件</button>
      <button v-if="order.status === 'picking'" class="btn-primary" @click="deliverOrder">✓ 确认送达</button>
      <router-link :to="`/signature/${order.id}`" class="btn-primary" v-if="order.status === 'picking'">✍️ 电子签收</router-link>
      <router-link :to="`/tracking/${order.id}`" class="btn-secondary">🗺️ 查看GPS轨迹</router-link>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { orderApi, riderApi } from '@/api'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const order = ref(null)
const rider = ref(null)
const candidates = ref(null)
const timeoutResult = ref(null)
const loading = ref(true)
const error = ref(null)

function getCategoryName(cat) {
  const map = { document: '文件', fresh: '生鲜', pet: '宠物', pharmacy: '药品' }
  return map[cat] || cat
}

function getStatusName(status) {
  const map = { pending: '待匹配', matched: '已匹配', picking: '取件中', delivered: '已送达' }
  return map[status] || status
}

function formatTime(t) {
  return new Date(t).toLocaleString('zh-CN')
}

function getCategoryIcon(cat) {
  const map = { document: '📄', fresh: '🥬', pet: '🐕', pharmacy: '💊' }
  return map[cat] || '📦'
}

function getRemainingTime() {
  if (!order.value || !order.value.created_at) return 45
  const now = new Date()
  const created = new Date(order.value.created_at)
  const elapsed = (now - created) / 60000
  return Math.max(0, Math.round(45 - elapsed))
}

function parseSkills(skillsStr) {
  if (!skillsStr) return {}
  const skills = {}
  skillsStr.split(',').forEach(s => {
    const [k, v] = s.split(':')
    skills[k] = parseFloat(v)
  })
  return skills
}

async function loadOrder() {
  try {
    loading.value = true
    error.value = null
    const res = await orderApi.get(route.params.id)
    order.value = res.data
    
    if (order.value.rider_id) {
      const riderRes = await riderApi.get(order.value.rider_id)
      rider.value = riderRes.data
    }
  } catch (e) {
    console.error('加载订单失败:', e)
    error.value = '加载订单失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function loadCandidates() {
  const res = await orderApi.getCandidates(route.params.id)
  candidates.value = res.data
}

async function confirmMatch() {
  await orderApi.match(route.params.id)
  await store.fetchOrders()
  router.push('/orders')
}

async function pickupOrder() {
  await orderApi.pickup(route.params.id)
  await loadOrder()
}

async function deliverOrder() {
  await orderApi.deliver(route.params.id)
  await store.fetchOrders()
  await loadOrder()
}

async function checkTimeout(force) {
  const res = await orderApi.timeoutCheck(route.params.id, force)
  timeoutResult.value = res
  if (res.triggered) {
    await loadOrder()
  }
}

onMounted(async () => {
  await loadOrder()
})
</script>

<style scoped>
.order-detail { max-width: 1100px; }

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  min-height: 400px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-state p {
  color: #888;
  font-size: 16px;
  margin: 0;
}
.error-state .error-text {
  color: #dc3545;
  font-size: 16px;
  margin-bottom: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.page-header h1 { font-size: 28px; color: #333; margin: 0; }
.sub-title { color: #888; margin-top: 4px; font-size: 14px; }
.header-right { display: flex; gap: 12px; align-items: center; }
.status { padding: 6px 16px; border-radius: 20px; font-weight: 600; }
.status.pending { background: #fff3cd; color: #856404; }
.status.matched { background: #cce5ff; color: #004085; }
.status.picking { background: #d1ecf1; color: #0c5460; }
.status.delivered { background: #d4edda; color: #155724; }
.backup-badge {
  padding: 6px 12px;
  background: #f8d7da;
  color: #721c24;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}
.card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.card h3 { margin-bottom: 16px; font-size: 16px; color: #333; }
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}
.label { color: #888; }
.value { color: #333; font-weight: 500; }
.value.warning { color: #dc3545; }
.value.highlight { color: #667eea; }
.value.geo { font-family: monospace; font-size: 13px; }

.rider-info { display: flex; gap: 16px; align-items: center; }
.rider-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
}
.rider-details { flex: 1; }
.rider-name { font-size: 18px; font-weight: 600; color: #333; }
.rider-phone { color: #666; margin: 4px 0; }
.rider-stats {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.stat-tag {
  font-size: 12px;
  padding: 2px 8px;
  background: #f0f2ff;
  color: #667eea;
  border-radius: 4px;
}

.section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-bottom: 20px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-header h3 { margin: 0; font-size: 18px; color: #333; }
.header-buttons { display: flex; gap: 12px; }

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
}
.btn-secondary {
  background: #e9ecef;
  color: #333;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
}
.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.matching-stats {
  display: flex;
  gap: 24px;
  margin: 16px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.stat-box { text-align: center; }
.stat-num {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
}
.stat-label { font-size: 12px; color: #888; }
.weight-config {
  margin-left: auto;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.weight-tag {
  padding: 4px 10px;
  background: white;
  border-radius: 4px;
  font-size: 12px;
  color: #667eea;
  font-weight: 600;
}

.candidates-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.candidate-item {
  display: grid;
  grid-template-columns: 80px 160px 1fr 100px 100px;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  gap: 16px;
}
.candidate-item.best {
  background: linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%);
  border: 2px solid #667eea;
}
.candidate-rank {
  font-weight: 700;
  color: #667eea;
  text-align: center;
}
.candidate-name { font-weight: 600; color: #333; }
.candidate-skills {
  display: flex;
  gap: 6px;
  margin-top: 4px;
  flex-wrap: wrap;
}
.skill-tag {
  font-size: 11px;
  padding: 2px 6px;
  background: white;
  border-radius: 3px;
  color: #666;
}

.candidate-scores {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.score-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.score-label {
  width: 50px;
  font-size: 11px;
  color: #888;
}
.bar {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
}
.score-val {
  width: 55px;
  font-size: 11px;
  font-weight: 600;
  text-align: right;
}

.candidate-total { text-align: center; }
.total-score {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
}
.total-label {
  font-size: 11px;
  color: #888;
}
.match-btn { font-size: 13px; padding: 8px 12px; }

.timeout-result {
  display: flex;
  gap: 16px;
  padding: 20px;
  border-radius: 8px;
  background: #d4edda;
  color: #155724;
}
.timeout-result.triggered {
  background: #fff3cd;
  color: #856404;
}
.timeout-result.normal {
  background: #d1ecf1;
  color: #0c5460;
}
.timeout-icon {
  font-size: 32px;
  flex-shrink: 0;
}
.timeout-content { flex: 1; }
.timeout-msg { margin: 8px 0; }
.timeout-details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0,0,0,0.1);
}
.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
}
.detail-row .highlight { color: #dc3545; font-weight: 600; }
.detail-row .warning { color: #dc3545; font-weight: 600; }

.rider-swap {
  display: flex;
  align-items: center;
  gap: 20px;
  margin: 16px 0;
  padding: 16px;
  background: rgba(255,255,255,0.5);
  border-radius: 8px;
}
.swap-from, .swap-to { text-align: center; }
.swap-label { font-size: 12px; color: #888; }
.swap-name { font-size: 18px; font-weight: 700; margin-top: 4px; }
.swap-arrow { font-size: 24px; color: #dc3545; }

.candidates-mini h4 { margin: 0 0 12px 0; font-size: 14px; }
.mini-candidate {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 6px 12px;
  background: rgba(255,255,255,0.6);
  border-radius: 20px;
  margin-right: 8px;
  margin-bottom: 8px;
}
.mini-rank {
  width: 20px;
  height: 20px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
}
.mini-name { font-weight: 600; }
.mini-score { color: #667eea; font-weight: 600; }

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.category-card {
  background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
  border: 1px solid #e0e4ff;
}
.category-card h3 { color: #667eea; }

.category-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.spec-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}
.spec-item.warning {
  background: #fff9e6;
  border-color: #ffe08a;
}

.spec-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.spec-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.spec-label {
  font-size: 13px;
  color: #888;
}
.spec-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.spec-status {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
}
.spec-status.ok {
  background: #d4edda;
  color: #155724;
}
.spec-status.warning {
  background: #ffeeba;
  color: #856404;
}

.temp-chart {
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}
.temp-bars {
  display: flex;
  gap: 4px;
  align-items: flex-end;
  height: 40px;
  margin-bottom: 8px;
}
.temp-bar {
  flex: 1;
  border-radius: 2px 2px 0 0;
}
.temp-bar.low { background: #5bc0de; }
.temp-bar.normal { background: #5cb85c; }
.temp-bar.high { background: #f0ad4e; }
.temp-label {
  font-size: 12px;
  color: #888;
  display: block;
  text-align: center;
}

.compliance-check {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}
.check-item {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
}
.check-item.ok {
  background: #d4edda;
  color: #155724;
}
.check-item.pending {
  background: #fff3cd;
  color: #856404;
}

.privacy-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f0f4ff;
  border-radius: 8px;
  font-size: 13px;
  color: #5a67d8;
}
.privacy-icon { font-size: 18px; }
</style>