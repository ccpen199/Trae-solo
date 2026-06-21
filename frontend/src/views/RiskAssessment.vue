<template>
  <div class="risk-page">
    <van-nav-bar
      title="风险评估详情"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    />
    <div class="page-content">
      <div class="overview-card" :class="'level-' + overallLevel">
        <div class="level-title">综合风险评估</div>
        <div class="level-score">
          <span class="score">{{ data?.risk_score || 0 }}</span>
          <span class="label">/100 分</span>
        </div>
        <div class="level-badge" :class="'badge-' + overallLevel">{{ levelText }}</div>
        <div class="level-desc">{{ levelDesc }}</div>
      </div>

      <div class="dimension-card card">
        <div class="card-title">四维风险评估</div>
        <div class="dimension-list">
          <div class="dimension-item" v-for="(dim, key) in dimensions" :key="key">
            <div class="dim-header">
              <div class="dim-name">
                <span class="dim-icon">{{ dim.icon }}</span>
                {{ dim.name }}
              </div>
              <span class="dim-level" :class="'level-' + dim.level">{{ dim.levelText }}</span>
            </div>
            <div class="dim-bar">
              <div class="dim-bar-fill" :style="{ width: dim.score + '%', background: dim.color }"></div>
            </div>
            <div class="dim-score-row">
              <span class="dim-score">{{ dim.score }}分</span>
              <span class="dim-desc">{{ dim.desc }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-card card">
        <div class="card-title">评估详情</div>
        <div class="detail-list">
          <div class="detail-item" v-for="(item, idx) in detailList" :key="idx">
            <van-icon :name="item.pass ? 'passed' : 'warning-o'" :color="item.pass ? '#43a047' : '#ff9800'" size="18" />
            <div class="detail-text">
              <div class="detail-label">{{ item.label }}</div>
              <div class="detail-value" :class="item.pass ? 'pass' : 'warn'">{{ item.value }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="suggestion-card card">
        <div class="card-title">安全建议</div>
        <div class="suggestion-item" v-for="(s, idx) in suggestions" :key="idx">
          <div class="s-num">{{ idx + 1 }}</div>
          <div class="s-text">{{ s }}</div>
        </div>
      </div>

      <van-button block type="primary" @click="goRecords" style="margin: 16px">
        查看亮码记录
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { getRiskAssessment } from '../api/identity'

const router = useRouter()
const userStore = useUserStore()

const data = ref(null)

const overallLevel = computed(() => data.value?.risk_level || 'low')
const levelText = computed(() => ({ low: '低风险', medium: '中风险', high: '高风险' }[overallLevel.value]))
const levelDesc = computed(() => ({
  low: '您的身份安全状态良好，可正常使用各项政务服务',
  medium: '存在部分风险项，建议完成更多实名认证以提高安全性',
  high: '风险较高，部分功能可能受限，请联系客服或前往线下网点核实'
}[overallLevel.value]))

const dimensions = computed(() => {
  const d = data.value?.dimensions || {}
  const map = {
    real_name: { name: '实名认证', icon: '🪪', low: '#43a047', medium: '#ff9800', high: '#e53935' },
    device: { name: '设备安全', icon: '📱', low: '#43a047', medium: '#ff9800', high: '#e53935' },
    location: { name: '地理位置', icon: '📍', low: '#43a047', medium: '#ff9800', high: '#e53935' },
    behavior: { name: '行为模式', icon: '👤', low: '#43a047', medium: '#ff9800', high: '#e53935' }
  }
  const result = {}
  Object.keys(map).forEach(k => {
    const dim = d[k] || { score: 85, level: 'low', desc: '正常' }
    result[k] = {
      ...map[k],
      score: dim.score,
      level: dim.level,
      levelText: { low: '正常', medium: '注意', high: '异常' }[dim.level],
      color: map[k][dim.level],
      desc: dim.desc
    }
  })
  return result
})

const detailList = computed(() => {
  const d = data.value?.details || {}
  const list = [
    { label: '身份证核验', value: d.id_card ? '已通过' : '未通过', pass: !!d.id_card },
    { label: '人脸活体检测', value: d.face_verify ? '已通过' : '未通过', pass: !!d.face_verify },
    { label: '手机号实名认证', value: d.phone_verify ? '已绑定' : '未绑定', pass: !!d.phone_verify },
    { label: '常用设备登录', value: d.known_device ? '是' : '否（新设备）', pass: !!d.known_device },
    { label: '设备风险检测', value: d.device_safe ? '安全' : '存在异常', pass: !!d.device_safe },
    { label: '登录地匹配', value: d.common_location ? '常用地点' : '非常用地点', pass: !!d.common_location },
    { label: '异常操作检测', value: d.no_suspicious ? '无异常' : '检测到可疑行为', pass: !!d.no_suspicious },
    { label: '操作频率正常', value: d.normal_frequency ? '正常' : '过于频繁', pass: !!d.normal_frequency }
  ]
  return list
})

const suggestions = computed(() => {
  const list = []
  const d = data.value?.details || {}
  if (!d.face_verify) list.push('建议完成人脸活体检测，提高身份可信度')
  if (!d.phone_verify) list.push('请绑定实名认证手机号，便于接收验证消息')
  if (!d.known_device) list.push('当前设备为首次登录，建议在设备管理中添加信任')
  if (!d.device_safe) list.push('检测到设备环境存在风险，请使用安全设备登录')
  if (!d.common_location) list.push('当前登录地非常用地点，请注意账户安全')
  if (list.length === 0) list.push('您的账户安全状态良好，请继续保持')
  list.push('请勿将身份码截图或分享给他人使用')
  list.push('定期更新密码并开启双因素认证')
  return list
})

function goRecords() { router.push('/identity/records') }

onMounted(async () => {
  try {
    data.value = await getRiskAssessment(userStore.currentUserId)
  } catch (e) {
    console.error(e)
  }
})
</script>

<style scoped>
.risk-page { min-height: 100vh; background: #f5f7fa; }
.page-content { padding-bottom: 20px; }

.overview-card {
  margin: 12px;
  padding: 24px 20px;
  border-radius: 16px;
  text-align: center;
  color: #fff;
}
.overview-card.level-low { background: linear-gradient(135deg, #43a047, #2e7d32); }
.overview-card.level-medium { background: linear-gradient(135deg, #fb8c00, #ef6c00); }
.overview-card.level-high { background: linear-gradient(135deg, #e53935, #c62828); }

.level-title { font-size: 14px; opacity: 0.9; margin-bottom: 10px; }
.level-score { margin-bottom: 10px; }
.score { font-size: 48px; font-weight: 700; }
.label { font-size: 16px; opacity: 0.85; }
.level-badge {
  display: inline-block;
  padding: 4px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.25);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
}
.level-desc { font-size: 13px; opacity: 0.9; line-height: 1.5; }

.card {
  background: #fff;
  margin: 12px;
  padding: 16px;
  border-radius: 14px;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 14px;
}

.dimension-list { display: flex; flex-direction: column; gap: 16px; }
.dim-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 8px;
}
.dim-name {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 500; color: #333;
}
.dim-icon { font-size: 18px; }
.dim-level {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
}
.dim-level.level-low { background: #e8f5e9; color: #43a047; }
.dim-level.level-medium { background: #fff3e0; color: #ff9800; }
.dim-level.level-high { background: #ffebee; color: #e53935; }

.dim-bar {
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}
.dim-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}
.dim-score-row {
  display: flex; justify-content: space-between;
  font-size: 12px;
}
.dim-score { color: #1976d2; font-weight: 500; }
.dim-desc { color: #999; }

.detail-list { display: flex; flex-direction: column; gap: 14px; }
.detail-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
}
.detail-item:last-child { border-bottom: none; padding-bottom: 0; }
.detail-text { flex: 1; }
.detail-label { font-size: 13px; color: #666; margin-bottom: 3px; }
.detail-value { font-size: 14px; font-weight: 500; }
.detail-value.pass { color: #43a047; }
.detail-value.warn { color: #ff9800; }

.suggestion-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed #f0f0f0;
}
.suggestion-item:last-child { border-bottom: none; }
.s-num {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: #e3f2fd;
  color: #1976d2;
  font-size: 12px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.s-text { flex: 1; font-size: 13px; color: #333; line-height: 1.6; }
</style>
