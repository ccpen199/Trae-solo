<template>
  <div class="enterprise-page">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <p class="error-text">{{ error }}</p>
      <button class="btn-primary" @click="loadData">重试</button>
    </div>
    <div v-else>
    <div class="page-header">
      <h1 class="page-title">🏢 企业定制服务</h1>
      <p class="sub-title">连锁药店SOP流程 · 律所文书归档 · 全链路符合《电子签名法》</p>
    </div>
    
    <div class="configs-grid">
      <div v-for="config in configs" :key="config.id" class="config-card">
        <div class="config-header">
          <div class="config-icon">{{ getIcon(config.enterprise_type) }}</div>
          <div>
            <div class="config-name">{{ config.config.name }}</div>
            <div class="config-desc">专属定制配送方案</div>
          </div>
        </div>
        
        <div class="config-details">
          <div v-if="config.enterprise_type === 'pharmacy'" class="pharmacy-config">
            <div class="section-title">
              <h4>📋 处方药配送 SOP 流程办理</h4>
              <span class="status-badge" :class="sopCompleted ? 'completed' : 'pending'">
                {{ sopCompleted ? '已完成' : '待办理' }}
              </span>
            </div>
            
            <div class="sop-steps">
              <div v-for="(step, idx) in config.config.deliverySOP" :key="idx" 
                   class="sop-step"
                   :class="{ completed: sopSteps[idx].done, current: !sopCompleted && idx === currentSopStep }">
                <span class="step-num">{{ sopSteps[idx].done ? '✓' : idx + 1 }}</span>
                <div class="step-content">
                  <span class="step-text">{{ step }}</span>
                  <span v-if="sopSteps[idx].done" class="step-time">
                    {{ sopSteps[idx].time }}
                  </span>
                </div>
                <button v-if="idx === currentSopStep && !sopCompleted" 
                        class="step-btn" @click="completeSopStep(idx)">
                  确认办理
                </button>
              </div>
            </div>
            
            <div class="temperature-check" v-if="sopSteps[1]">
              <h5>🌡️ 温控箱状态监控</h5>
              <div class="temp-display">
                <div class="temp-value">5.2℃</div>
                <div class="temp-range">要求范围: 2-8℃</div>
                <div class="temp-status normal">✓ 温度正常</div>
              </div>
              <div class="temp-history">
                <div class="temp-point" v-for="n in 6" :key="n" :class="n < 5 ? 'normal' : 'warn'">
                  <div class="temp-bar" :style="{ height: (30 + n * 8) + 'px' }"></div>
                  <span class="temp-time">{{ 10 + n }}:{{ n * 5 }}0</span>
                </div>
              </div>
            </div>

            <div class="compliance-check" v-if="sopCompleted">
              <div class="compliance-item">
                <span class="check-icon">✓</span>
                <span>处方照片已上传</span>
              </div>
              <div class="compliance-item">
                <span class="check-icon">✓</span>
                <span>签收人身份已核验</span>
              </div>
              <div class="compliance-item">
                <span class="check-icon">✓</span>
                <span>温控记录完整</span>
              </div>
            </div>
            
            <div class="config-items">
              <div class="config-item">
                <span class="item-label">身份核验</span>
                <span class="item-value enabled">✓ 启用</span>
              </div>
              <div class="config-item">
                <span class="item-label">处方拍照</span>
                <span class="item-value enabled">✓ 启用</span>
              </div>
              <div class="config-item">
                <span class="item-label">温控要求</span>
                <span class="item-value">{{ config.config.temperatureControl }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="config.enterprise_type === 'lawfirm'" class="lawfirm-config">
            <div class="section-title">
              <h4>📑 法律文书送达配置</h4>
              <button class="btn-link" @click="viewArchives">查看归档结果</button>
            </div>

            <div class="config-items">
              <div class="config-item">
                <span class="item-label">自动归档</span>
                <span class="item-value enabled">✓ 启用</span>
              </div>
              <div class="config-item">
                <span class="item-label">签收人身份验证</span>
                <span class="item-value enabled">✓ 启用</span>
              </div>
            </div>
            
            <h5>归档字段</h5>
            <div class="archive-fields">
              <span v-for="field in config.config.archiveFields" :key="field" class="field-tag">
                {{ field }}
              </span>
            </div>

            <div class="archive-preview">
              <h5>📊 最近归档记录</h5>
              <div class="archive-list">
                <div class="archive-item" v-for="a in recentArchives" :key="a.id">
                  <span class="archive-order">{{ a.order_no }}</span>
                  <span class="archive-signer">{{ a.signer_name }}</span>
                  <span class="archive-time">{{ formatTime(a.archived_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="config-footer">
          <span class="tip">📜 符合《电子签名法》司法效力认定标准</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h3>📦 品类结构化建模</h3>
        <span class="section-desc">四大服务品类 · 专属配送方案</span>
      </div>
      <div class="categories-grid">
        <div class="category-card">
          <div class="category-icon">📄</div>
          <h4>文件类</h4>
          <p class="category-desc">保密协议、合同文书、法律文件</p>
          <div class="category-features">
            <div class="feature">✓ 密封包装检查</div>
            <div class="feature">✓ 签收回执自动归档</div>
            <div class="feature">✓ 配送链路全程可追溯</div>
          </div>
          <div class="category-special">
            <strong>特殊要求:</strong> 文件袋封口签章、保密性承诺
          </div>
        </div>
        <div class="category-card">
          <div class="category-icon">🥬</div>
          <h4>生鲜类</h4>
          <p class="category-desc">蔬菜水果、海鲜水产、冷藏食品</p>
          <div class="category-features">
            <div class="feature">✓ 温控箱状态监控</div>
            <div class="feature">✓ 冷链全程记录</div>
            <div class="feature">✓ 超时预警机制</div>
          </div>
          <div class="category-special">
            <strong>特殊要求:</strong> 2-8℃冷链、冰袋配置检查
          </div>
        </div>
        <div class="category-card">
          <div class="category-icon">🐕</div>
          <h4>宠物类</h4>
          <p class="category-desc">猫咪、狗狗及其他宠物运输</p>
          <div class="category-features">
            <div class="feature">✓ 航空箱物联网传感器</div>
            <div class="feature">✓ 实时状态监控</div>
            <div class="feature">✓ 专业骑手认证</div>
          </div>
          <div class="category-special">
            <strong>特殊要求:</strong> 航空箱规格、宠物健康证明
          </div>
        </div>
        <div class="category-card">
          <div class="category-icon">💊</div>
          <h4>药品类</h4>
          <p class="category-desc">处方药、OTC药品、医疗器械</p>
          <div class="category-features">
            <div class="feature">✓ 阴凉储存合规提醒</div>
            <div class="feature">✓ 处方核验流程</div>
            <div class="feature">✓ 专业配送SOP</div>
          </div>
          <div class="category-special">
            <strong>特殊要求:</strong> 处方核验、身份验证、温控记录
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { enterpriseApi, archiveApi } from '@/api'

const router = useRouter()
const configs = ref([])
const sopSteps = ref([
  { done: false, time: '' },
  { done: false, time: '' },
  { done: false, time: '' },
  { done: false, time: '' }
])
const currentSopStep = ref(0)
const archives = ref([])
const loading = ref(true)
const error = ref(null)

const sopCompleted = computed(() => sopSteps.value.every(s => s.done))

const recentArchives = computed(() => {
  return archives.value.slice(0, 3).map(a => ({
    ...a,
    ...JSON.parse(a.archive_data || '{}')
  }))
})

function getIcon(type) {
  const map = { pharmacy: '💊', lawfirm: '⚖️' }
  return map[type] || '🏢'
}

function formatTime(t) {
  if (!t) return ''
  return new Date(t).toLocaleDateString('zh-CN')
}

function completeSopStep(idx) {
  sopSteps.value[idx].done = true
  sopSteps.value[idx].time = new Date().toLocaleString('zh-CN')
  if (idx < 3) {
    currentSopStep.value = idx + 1
  }
}

function viewArchives() {
  router.push('/archives')
}

async function loadData() {
  try {
    loading.value = true
    error.value = null
    const res = await enterpriseApi.getConfigs()
    configs.value = res.data
    
    try {
      const arcRes = await archiveApi.list()
      archives.value = arcRes.data
    } catch (e) {
      console.log('No archives data')
    }
  } catch (e) {
    console.error('加载企业配置失败:', e)
    error.value = '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadData()
})
</script>

<style scoped>
.enterprise-page { max-width: 1200px; }

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

.page-header { margin-bottom: 24px; }
.page-title { font-size: 28px; margin: 0; color: #333; }
.sub-title { color: #888; margin-top: 4px; font-size: 14px; }

.configs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.config-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow: hidden;
}

.config-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.config-icon { font-size: 36px; }
.config-name { font-size: 18px; font-weight: 600; color: white; }
.config-desc { font-size: 13px; color: rgba(255,255,255,0.8); margin-top: 2px; }

.config-details { padding: 20px; }
.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-title h4 { margin: 0; color: #333; font-size: 15px; }
.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
.status-badge.pending { background: #fff3cd; color: #856404; }
.status-badge.completed { background: #d4edda; color: #155724; }

.btn-link {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 13px;
}

.sop-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.sop-step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s;
}
.sop-step.completed { background: #d4edda; }
.sop-step.current { 
  background: #e0f2fe; 
  border: 2px solid #667eea;
}

.step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}
.sop-step.completed .step-num { background: #10b981; }

.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.step-text { color: #333; font-size: 14px; font-weight: 500; }
.step-time { color: #10b981; font-size: 12px; font-family: monospace; }

.step-btn {
  padding: 6px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 600;
}

.temperature-check {
  background: #f0f9ff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.temperature-check h5 { margin: 0 0 12px 0; color: #0369a1; font-size: 14px; }
.temp-display {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}
.temp-value {
  font-size: 32px;
  font-weight: 700;
  color: #10b981;
}
.temp-range { font-size: 12px; color: #666; }
.temp-status {
  padding: 4px 12px;
  background: #d4edda;
  color: #155724;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
.temp-history {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  height: 60px;
}
.temp-point {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.temp-bar {
  width: 100%;
  background: #10b981;
  border-radius: 4px 4px 0 0;
}
.temp-bar.warn { background: #f59e0b; }
.temp-time { font-size: 10px; color: #888; }

.compliance-check {
  background: #f0fdf4;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.compliance-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
  color: #166534;
}
.check-icon { color: #10b981; font-weight: 700; }

.config-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.item-label { color: #888; font-size: 14px; }
.item-value { font-weight: 600; color: #333; font-size: 14px; }
.item-value.enabled { color: #10b981; }

.archive-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.field-tag {
  padding: 4px 12px;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 20px;
  font-size: 12px;
}

.archive-preview {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
}
.archive-preview h5 { margin: 0 0 12px 0; color: #475569; font-size: 13px; }
.archive-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.archive-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  font-size: 12px;
}
.archive-order { font-family: monospace; color: #667eea; font-weight: 600; }
.archive-signer { color: #333; }
.archive-time { color: #888; }

.config-footer {
  padding: 12px 20px;
  background: #f0f9ff;
  border-top: 1px solid #e0f2fe;
}

.config-footer .tip {
  font-size: 12px;
  color: #0369a1;
}

.section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.section-header h3 { margin: 0; font-size: 18px; color: #333; }
.section-desc { color: #888; font-size: 13px; }

.categories-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.category-card {
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s;
}
.category-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102,126,234,0.15);
}

.category-icon { font-size: 40px; margin-bottom: 12px; }
.category-card h4 { margin-bottom: 8px; color: #333; font-size: 16px; }
.category-desc { color: #666; font-size: 13px; margin-bottom: 16px; }
.category-features {
  text-align: left;
  margin-bottom: 16px;
}
.feature {
  color: #555;
  font-size: 12px;
  padding: 4px 0;
}
.category-special {
  padding-top: 12px;
  border-top: 1px dashed #e5e7eb;
  font-size: 11px;
  color: #888;
  text-align: left;
}
.category-special strong { color: #667eea; }
</style>
