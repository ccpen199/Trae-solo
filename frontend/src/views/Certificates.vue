<template>
  <div class="cert-page">
    <van-nav-bar title="我的证件" left-text="返回" left-arrow @click-left="router.back()" />

    <div class="page-content">
      <div class="stats-bar">
        <div class="st-item"><div class="st-num">{{ verifiedCount }}</div><div class="st-label">已整合</div></div>
        <div class="st-item"><div class="st-num">{{ unverifiedCount }}</div><div class="st-label">待整合</div></div>
        <div class="st-item"><div class="st-num">{{ expiringCount }}</div><div class="st-label">即将到期</div></div>
        <div class="st-item"><div class="st-num">12</div><div class="st-label">支持种类</div></div>
      </div>

      <div class="filter-tabs">
        <div class="ft" :class="{ active: filter === 'all' }" @click="filter = 'all'">全部</div>
        <div class="ft" :class="{ active: filter === 'verified' }" @click="filter = 'verified'">已整合</div>
        <div class="ft" :class="{ active: filter === 'pending' }" @click="filter = 'pending'">待整合</div>
        <div class="ft" :class="{ active: filter === 'expiring' }" @click="filter = 'expiring'">即将到期</div>
      </div>

      <div class="cert-list">
        <div class="cert-item" v-for="c in filteredCerts" :key="c.type" :class="{ verified: c.verified }" @click="openDetail(c)">
          <div class="ci-left">
            <div class="ci-icon">{{ c.icon }}</div>
          </div>
          <div class="ci-center">
            <div class="ci-name">{{ c.name }}</div>
            <div class="ci-number" v-if="c.cert_number">{{ maskCertNumber(c.cert_number) }}</div>
            <div class="ci-meta">
              <span v-if="c.verified" class="ci-status ok">
                <van-icon name="passed" size="12" /> 已整合
              </span>
              <span v-else class="ci-status pending">
                <van-icon name="warning-o" size="12" /> 待整合
              </span>
              <span v-if="c.expire_date" class="ci-expire" :class="{ warn: isExpiring(c.expire_date) }">
                有效期至 {{ c.expire_date }}
              </span>
              <span v-else class="ci-expire">未录入</span>
            </div>
          </div>
          <div class="ci-right">
            <van-button v-if="!c.verified" size="mini" type="primary" plain @click.stop="addCert(c)">整合</van-button>
            <van-button v-else size="mini" plain @click.stop="showQr(c)">亮码</van-button>
          </div>
        </div>
      </div>

      <div class="integration-tip">
        <van-icon name="info-o" size="14" color="#1976d2" />
        <span>整合更多证件可提升身份码安全等级和办事效率</span>
      </div>
    </div>

    <van-popup v-model:show="showDetail" round position="bottom" :style="{ maxHeight: '75%' }">
      <div class="detail-popup" v-if="currentCert">
        <div class="dp-header">
          <div class="dp-icon">{{ currentCert.icon }}</div>
          <div class="dp-name">{{ currentCert.name }}</div>
          <van-tag :type="currentCert.verified ? 'success' : 'warning'" size="medium">
            {{ currentCert.verified ? '已整合' : '待整合' }}
          </van-tag>
        </div>
        <div class="dp-body">
          <div class="dp-row" v-if="currentCert.cert_number">
            <span class="dp-label">证件号码</span>
            <span class="dp-value">{{ currentCert.cert_number }}</span>
          </div>
          <div class="dp-row" v-if="currentCert.issue_date">
            <span class="dp-label">签发日期</span>
            <span class="dp-value">{{ currentCert.issue_date }}</span>
          </div>
          <div class="dp-row" v-if="currentCert.expire_date">
            <span class="dp-label">有效期至</span>
            <span class="dp-value" :class="{ warn: isExpiring(currentCert.expire_date) }">{{ currentCert.expire_date }}</span>
          </div>
          <div class="dp-row" v-if="currentCert.issuer">
            <span class="dp-label">签发机构</span>
            <span class="dp-value">{{ currentCert.issuer }}</span>
          </div>
          <div class="dp-row">
            <span class="dp-label">整合状态</span>
            <span class="dp-value">{{ currentCert.verified ? '已整合到统一身份码' : '尚未整合' }}</span>
          </div>
          <div class="dp-row">
            <span class="dp-label">核实能力</span>
            <span class="dp-value">{{ currentCert.verified ? '支持在线核验' : '整合后支持在线核验' }}</span>
          </div>
        </div>
        <div class="dp-actions">
          <van-button v-if="currentCert.verified" type="primary" block round @click="showQr(currentCert)">出示此证件码</van-button>
          <van-button v-else type="primary" block round @click="addCert(currentCert); showDetail = false">立即整合</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { showToast } from 'vant'
import { getCertificates } from '../api/identity'

const router = useRouter()
const userStore = useUserStore()

const filter = ref('all')
const showDetail = ref(false)
const currentCert = ref(null)
const certList = ref([])

const allTypes = [
  { type: 'id_card', name: '居民身份证', icon: '🪪' },
  { type: 'social_security', name: '社会保障卡', icon: '💳' },
  { type: 'driving_license', name: '驾驶证', icon: '🚗' },
  { type: 'passport', name: '护照', icon: '🛂' },
  { type: 'hk_macau', name: '港澳通行证', icon: '🏗️' },
  { type: 'residence', name: '居住证', icon: '🏠' },
  { type: 'birth_cert', name: '出生医学证明', icon: '👶' },
  { type: 'marriage', name: '结婚证', icon: '💒' },
  { type: 'housing_fund', name: '公积金卡', icon: '🏦' },
  { type: 'medical', name: '医保电子凭证', icon: '❤️‍🩹' },
  { type: 'business_license', name: '营业执照', icon: '💼' },
  { type: 'real_estate', name: '不动产权证', icon: '🏡' }
]

const verifiedCount = computed(() => certList.value.filter(c => c.verified).length)
const unverifiedCount = computed(() => certList.value.filter(c => !c.verified).length)
const expiringCount = computed(() => certList.value.filter(c => c.verified && c.expire_date && isExpiring(c.expire_date)).length)

const filteredCerts = computed(() => {
  if (filter.value === 'verified') return certList.value.filter(c => c.verified)
  if (filter.value === 'pending') return certList.value.filter(c => !c.verified)
  if (filter.value === 'expiring') return certList.value.filter(c => c.verified && c.expire_date && isExpiring(c.expire_date))
  return certList.value
})

function isExpiring(dateStr) {
  if (!dateStr) return false
  const exp = new Date(dateStr)
  const now = new Date()
  const diff = (exp - now) / (1000 * 60 * 60 * 24)
  return diff < 90 && diff > 0
}

function maskCertNumber(num) {
  if (!num || num.length < 8) return num || ''
  return num.slice(0, 4) + '****' + num.slice(-4)
}

function openDetail(c) { currentCert.value = c; showDetail.value = true }

function showQr(c) {
  showDetail.value = false
  router.push({ path: '/identity/code', query: { type: c.type } })
}

function addCert(c) {
  c.verified = true
  c.cert_number = 'CERT' + Date.now().toString().slice(-10)
  c.issue_date = new Date().toISOString().slice(0, 10)
  c.expire_date = new Date(Date.now() + 10 * 365 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  showToast(`${c.name}已整合`)
}

onMounted(async () => {
  try {
    const data = await getCertificates(userStore.currentUserId)
    const userMap = {}
    ;(data || []).forEach(c => { userMap[c.cert_type] = c })
    certList.value = allTypes.map(at => {
      const uc = userMap[at.type]
      return {
        ...at,
        verified: !!uc,
        cert_number: uc?.cert_number || '',
        issue_date: uc?.issue_date || '',
        expire_date: uc?.expire_date || '',
        issuer: uc?.cert_data ? JSON.parse(uc.cert_data).issuer : '',
        dbId: uc?.id
      }
    })
  } catch (e) {
    certList.value = allTypes.map(at => ({
      ...at,
      verified: ['id_card', 'social_security', 'driving_license', 'birth_cert', 'medical'].includes(at.type),
      cert_number: '', issue_date: '', expire_date: '', issuer: ''
    }))
  }
})
</script>

<style scoped>
.cert-page { min-height: 100vh; background: #f5f7fa; }
.page-content { padding: 12px; padding-bottom: 30px; }

.stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
.st-item { background: #fff; padding: 12px 4px; border-radius: 10px; text-align: center; }
.st-num { font-size: 20px; font-weight: 700; color: #1976d2; margin-bottom: 2px; }
.st-label { font-size: 11px; color: #999; }

.filter-tabs { display: flex; gap: 8px; margin-bottom: 12px; overflow-x: auto; }
.ft {
  flex-shrink: 0; padding: 6px 16px; border-radius: 16px;
  background: #fff; font-size: 13px; color: #666;
}
.ft.active { background: #1976d2; color: #fff; font-weight: 500; }

.cert-list { display: flex; flex-direction: column; gap: 8px; }
.cert-item {
  display: flex; align-items: center; gap: 12px;
  background: #fff; padding: 14px; border-radius: 12px;
  border-left: 3px solid #eee;
}
.cert-item.verified { border-left-color: #43a047; }
.ci-icon { font-size: 32px; flex-shrink: 0; }
.ci-center { flex: 1; min-width: 0; }
.ci-name { font-size: 15px; font-weight: 600; color: #333; margin-bottom: 3px; }
.ci-number { font-size: 12px; color: #999; margin-bottom: 4px; font-family: monospace; }
.ci-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ci-status { display: flex; align-items: center; gap: 3px; font-size: 11px; }
.ci-status.ok { color: #43a047; }
.ci-status.pending { color: #ff9800; }
.ci-expire { font-size: 11px; color: #999; }
.ci-expire.warn { color: #e53935; font-weight: 500; }
.ci-right { flex-shrink: 0; }

.integration-tip {
  display: flex; align-items: center; gap: 6px;
  padding: 12px; background: #e3f2fd; border-radius: 10px;
  margin-top: 12px; font-size: 12px; color: #1565c0;
}

.detail-popup { padding: 20px; }
.dp-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f0f0f0; }
.dp-icon { font-size: 40px; }
.dp-name { flex: 1; font-size: 18px; font-weight: 600; color: #333; }
.dp-body { margin-bottom: 20px; }
.dp-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f5f5f5; font-size: 14px; }
.dp-row:last-child { border-bottom: none; }
.dp-label { color: #999; }
.dp-value { color: #333; font-weight: 500; text-align: right; max-width: 60%; word-break: break-all; }
.dp-value.warn { color: #e53935; }
</style>
