<template>
  <div class="orders-page">
    <div class="page-header">
      <h1>订单管理</h1>
      <button class="btn-primary" @click="showCreate = true">+ 新建订单</button>
    </div>

    <div class="filters">
      <select v-model="filterStatus" class="select">
        <option value="">全部状态</option>
        <option value="pending">待匹配</option>
        <option value="matched">已匹配</option>
        <option value="picking">取件中</option>
        <option value="delivered">已送达</option>
      </select>
    </div>

    <div class="order-table">
      <div class="table-header">
        <span>订单号</span>
        <span>品类</span>
        <span>取件地址</span>
        <span>送达地址</span>
        <span>状态</span>
        <span>操作</span>
      </div>
      <div v-for="order in filteredOrders" :key="order.id" class="table-row">
        <span class="order-no">{{ order.order_no }}</span>
        <span>{{ getCategoryName(order.category) }}</span>
        <span class="address">{{ order.pickup_address }}</span>
        <span class="address">{{ order.delivery_address }}</span>
        <span class="status" :class="order.status">{{ getStatusName(order.status) }}</span>
        <span class="actions">
          <button class="btn-link" @click="viewOrder(order.id)">详情</button>
          <button v-if="order.status === 'pending'" class="btn-link" @click="matchOrder(order.id)">匹配骑手</button>
        </span>
      </div>
      <div v-if="!filteredOrders.length" class="empty">暂无订单</div>
    </div>

    <div v-if="showCreate" class="modal-overlay" @click.self="showCreate = false">
      <div class="modal modal-large">
        <h2>新建订单</h2>
        <div class="form">
          <div class="form-group">
            <label>服务品类</label>
            <select v-model="newOrder.category" class="select">
              <option value="document">文件类</option>
              <option value="fresh">生鲜类</option>
              <option value="pet">宠物类</option>
              <option value="pharmacy">药品类</option>
            </select>
          </div>
          <div class="form-group">
            <label>物品描述</label>
            <input type="text" v-model="newOrder.sub_category" class="input" placeholder="如：保密协议、生鲜水产等">
          </div>
          <div class="form-group">
            <label>重量 (kg)</label>
            <input type="number" v-model.number="newOrder.weight" class="input" step="0.1">
          </div>
          <div class="form-group">
            <label>取件地址</label>
            <input type="text" v-model="newOrder.pickup_address" class="input">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>取件纬度</label>
              <input type="number" v-model.number="newOrder.pickup_lat" class="input" step="0.0001">
            </div>
            <div class="form-group">
              <label>取件经度</label>
              <input type="number" v-model.number="newOrder.pickup_lng" class="input" step="0.0001">
            </div>
          </div>
          <div class="form-group">
            <label>取件人</label>
            <input type="text" v-model="newOrder.pickup_name" class="input">
          </div>
          <div class="form-group">
            <label>取件电话</label>
            <input type="text" v-model="newOrder.pickup_phone" class="input">
          </div>
          <div class="form-group">
            <label>送达地址</label>
            <input type="text" v-model="newOrder.delivery_address" class="input">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>送达纬度</label>
              <input type="number" v-model.number="newOrder.delivery_lat" class="input" step="0.0001">
            </div>
            <div class="form-group">
              <label>送达经度</label>
              <input type="number" v-model.number="newOrder.delivery_lng" class="input" step="0.0001">
            </div>
          </div>
          <div class="form-group">
            <label>收件人</label>
            <input type="text" v-model="newOrder.delivery_name" class="input">
          </div>
          <div class="form-group">
            <label>收件电话</label>
            <input type="text" v-model="newOrder.delivery_phone" class="input">
          </div>
          <div class="form-group">
            <label>企业定制类型</label>
            <select v-model="newOrder.enterprise_type" class="select">
              <option value="">无</option>
              <option value="pharmacy">连锁药店</option>
              <option value="lawfirm">律所</option>
            </select>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showCreate = false">取消</button>
          <button class="btn-primary" @click="createOrder" :disabled="creating">
            {{ creating ? '创建中...' : '创建订单' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="matchResult" class="modal-overlay" @click.self="matchResult = null">
      <div class="modal modal-large">
        <div class="match-header">
          <div>
            <h2>🎯 毫秒级订单匹配完成</h2>
            <p class="match-subtitle">
              耗时 <strong>{{ matchResult.durationMs?.toFixed(2) }}ms</strong> · 
              找到 <strong>{{ matchResult.allCandidates?.length || 0 }}</strong> 名候选骑手
            </p>
          </div>
          <span class="match-badge success">匹配成功</span>
        </div>

        <div class="weight-config">
          <span class="weight-label">加权配置：</span>
          <span class="weight-item">距离 35%</span>
          <span class="weight-item">准时率 25%</span>
          <span class="weight-item">负重能力 15%</span>
          <span class="weight-item">品类专精 25%</span>
        </div>

        <div class="candidates-list">
          <div class="candidate-item" 
               v-for="(candidate, index) in matchResult.allCandidates" 
               :key="candidate.id"
               :class="{ 'is-best': index === 0 }">
            <div class="candidate-rank">
              <span class="rank-number">{{ index + 1 }}</span>
              <span v-if="index === 0" class="best-label">已选中</span>
            </div>
            <div class="candidate-info">
              <div class="candidate-name">
                {{ candidate.name }}
                <span v-if="candidate.skills" class="skill-tags">
                  <span v-for="(prof, cat) in parseSkills(candidate.skills)" :key="cat" class="skill-tag">
                    {{ getCategoryName(cat) }} {{ Math.round(prof * 100) }}%
                  </span>
                </span>
              </div>
              <div class="candidate-meta">
                <span>距离 {{ (candidate.distance / 1000).toFixed(2) }}km</span>
                <span>综合评分 {{ candidate.totalScore.toFixed(1) }}</span>
              </div>
            </div>
            <div class="score-bars">
              <div class="score-bar">
                <span class="score-label">距离</span>
                <div class="bar-track"><div class="bar-fill distance" :style="{ width: candidate.distanceScore + '%' }"></div></div>
                <span class="score-value">{{ candidate.distanceScore.toFixed(0) }}</span>
              </div>
              <div class="score-bar">
                <span class="score-label">准时</span>
                <div class="bar-track"><div class="bar-fill ontime" :style="{ width: candidate.onTimeScore + '%' }"></div></div>
                <span class="score-value">{{ candidate.onTimeScore.toFixed(0) }}</span>
              </div>
              <div class="score-bar">
                <span class="score-label">负重</span>
                <div class="bar-track"><div class="bar-fill load" :style="{ width: candidate.loadScore + '%' }"></div></div>
                <span class="score-value">{{ candidate.loadScore.toFixed(0) }}</span>
              </div>
              <div class="score-bar">
                <span class="score-label">专精</span>
                <div class="bar-track"><div class="bar-fill skill" :style="{ width: candidate.skillScore + '%' }"></div></div>
                <span class="score-value">{{ candidate.skillScore.toFixed(0) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-primary" @click="closeMatchResult">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { orderApi } from '@/api'

const router = useRouter()
const store = useAppStore()
const showCreate = ref(false)
const creating = ref(false)
const matchResult = ref(null)
const filterStatus = ref('')

const newOrder = ref({
  category: 'document',
  sub_category: '',
  weight: 1,
  pickup_address: '',
  pickup_lat: 31.2304,
  pickup_lng: 121.4737,
  pickup_name: '',
  pickup_phone: '',
  delivery_address: '',
  delivery_lat: 31.2204,
  delivery_lng: 121.4837,
  delivery_name: '',
  delivery_phone: '',
  enterprise_type: ''
})

const filteredOrders = computed(() => {
  if (!filterStatus.value) return store.orders
  return store.orders.filter(o => o.status === filterStatus.value)
})

function getCategoryName(cat) {
  const map = { document: '文件', fresh: '生鲜', pet: '宠物', pharmacy: '药品' }
  return map[cat] || cat
}

function getStatusName(status) {
  const map = { pending: '待匹配', matched: '已匹配', picking: '取件中', delivered: '已送达' }
  return map[status] || status
}

function parseSkills(skillsStr) {
  if (!skillsStr) return {}
  const skills = {}
  skillsStr.split(',').forEach(s => {
    const [cat, prof] = s.split(':')
    skills[cat] = parseFloat(prof)
  })
  return skills
}

function viewOrder(id) {
  router.push(`/orders/${id}`)
}

async function matchOrder(id) {
  const result = await orderApi.match(id)
  matchResult.value = result
  await store.fetchOrders()
}

function closeMatchResult() {
  matchResult.value = null
}

async function createOrder() {
  try {
    creating.value = true
    await orderApi.create(newOrder.value)
    await store.fetchOrders()
    showCreate.value = false
    newOrder.value = {
      category: 'document',
      sub_category: '',
      weight: 1,
      pickup_address: '',
      pickup_lat: 31.2304,
      pickup_lng: 121.4737,
      pickup_name: '',
      pickup_phone: '',
      delivery_address: '',
      delivery_lat: 31.2204,
      delivery_lng: 121.4837,
      delivery_name: '',
      delivery_phone: '',
      enterprise_type: ''
    }
  } catch (e) {
    alert('创建失败')
  } finally {
    creating.value = false
  }
}

onMounted(async () => {
  try {
    await store.fetchOrders()
  } catch (e) {
    console.error('加载订单失败:', e)
  }
})
</script>

<style scoped>
.orders-page { max-width: 1200px; }
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-header h1 { font-size: 28px; color: #333; }

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.btn-secondary {
  background: #e9ecef;
  color: #333;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.btn-link {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  padding: 4px 8px;
}

.filters { margin-bottom: 16px; }
.select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}
.input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  width: 100%;
}

.order-table {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow: hidden;
}
.table-header {
  display: grid;
  grid-template-columns: 120px 80px 1fr 1fr 100px 120px;
  padding: 16px;
  background: #f8f9fa;
  font-weight: 600;
  color: #666;
}
.table-row {
  display: grid;
  grid-template-columns: 120px 80px 1fr 1fr 100px 120px;
  padding: 16px;
  border-top: 1px solid #eee;
  align-items: center;
}
.order-no { font-family: monospace; color: #667eea; font-weight: 600; }
.address { color: #666; font-size: 13px; }
.status { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-align: center; }
.status.pending { background: #fff3cd; color: #856404; }
.status.matched { background: #cce5ff; color: #004085; }
.status.picking { background: #d1ecf1; color: #0c5460; }
.status.delivered { background: #d4edda; color: #155724; }
.actions { display: flex; gap: 8px; }

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal h2 { margin-bottom: 20px; color: #333; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; font-weight: 600; color: #555; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.modal-large {
  max-width: 900px;
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}
.match-header h2 { margin: 0 0 8px 0; }
.match-subtitle { margin: 0; color: #666; }
.match-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}
.match-badge.success { background: #d4edda; color: #155724; }

.weight-config {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}
.weight-label { font-weight: 600; color: #555; }
.weight-item {
  padding: 4px 10px;
  background: white;
  border-radius: 12px;
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
  grid-template-columns: 80px 200px 1fr;
  gap: 16px;
  padding: 16px;
  border: 2px solid #eee;
  border-radius: 10px;
  align-items: center;
}
.candidate-item.is-best {
  border-color: #667eea;
  background: #f8f9ff;
}

.candidate-rank {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.rank-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eee;
  border-radius: 50%;
  font-weight: 700;
  font-size: 18px;
  color: #666;
}
.candidate-item.is-best .rank-number {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
.best-label {
  font-size: 12px;
  color: #667eea;
  font-weight: 600;
}

.candidate-name {
  font-weight: 600;
  font-size: 16px;
  color: #333;
  margin-bottom: 6px;
}
.candidate-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
}

.skill-tags {
  display: inline-flex;
  gap: 6px;
  margin-left: 8px;
}
.skill-tag {
  padding: 2px 8px;
  background: #e8f0fe;
  color: #1967d2;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.score-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.score-bar {
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  gap: 8px;
  align-items: center;
}
.score-label {
  font-size: 12px;
  color: #666;
  text-align: right;
}
.score-value {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}
.bar-track {
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}
.bar-fill.distance { background: linear-gradient(90deg, #667eea, #764ba2); }
.bar-fill.ontime { background: linear-gradient(90deg, #10b981, #059669); }
.bar-fill.load { background: linear-gradient(90deg, #f59e0b, #d97706); }
.bar-fill.skill { background: linear-gradient(90deg, #06b6d4, #0891b2); }

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
