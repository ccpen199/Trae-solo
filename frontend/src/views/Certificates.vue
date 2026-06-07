<template>
  <div class="certificates-container">
    <div class="page-header">
      <h2>电子证照</h2>
      <p>您的所有证照均已可信存证</p>
    </div>

    <div style="padding: 16px;">
      <div v-if="!userStore.isLoggedIn" class="login-prompt">
        <el-empty description="请先登录查看您的电子证照">
          <el-button type="primary" @click="goToLogin">立即登录</el-button>
        </el-empty>
      </div>

      <div v-else>
        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-value">{{ certificates.length }}</span>
            <span class="stat-label">张证照</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ validCount }}</span>
            <span class="stat-label">有效</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ usedCount }}</span>
            <span class="stat-label">本月使用</span>
          </div>
        </div>

        <div class="section-title">
          <h3>我的证照</h3>
        </div>

        <div class="cert-list">
          <div
            v-for="cert in certificates"
            :key="cert.id"
            class="cert-card"
            @click="viewCert(cert)"
          >
            <div class="cert-icon" :style="{ background: getCertColor(cert.cert_type) }">
              <el-icon :size="24" color="#fff"><Document /></el-icon>
            </div>
            <div class="cert-info">
              <h4>{{ cert.cert_name }}</h4>
              <p class="cert-number">{{ maskNumber(cert.cert_number) }}</p>
              <p class="cert-authority">{{ cert.issue_authority }}</p>
            </div>
            <div class="cert-status">
              <el-tag size="small" :type="cert.status === 'valid' ? 'success' : 'info'">
                {{ cert.status === 'valid' ? '有效' : '失效' }}
              </el-tag>
            </div>
          </div>
        </div>

        <div class="section-title" style="margin-top: 24px;">
          <h3>证照服务</h3>
        </div>

        <div class="service-grid">
          <div class="service-item" @click="showService('directory')">
            <div class="service-icon" style="background: linear-gradient(135deg, #1e5cb8, #2d7dd2);">
              <el-icon :size="22" color="#fff"><Document /></el-icon>
            </div>
            <span>证照目录</span>
          </div>
          <div class="service-item" @click="showService('auth')">
            <div class="service-icon" style="background: linear-gradient(135deg, #07c160, #10b981);">
              <el-icon :size="22" color="#fff"><UserFilled /></el-icon>
            </div>
            <span>授权管理</span>
          </div>
          <div class="service-item" @click="showService('history')">
            <div class="service-icon" style="background: linear-gradient(135deg, #f59e0b, #f97316);">
              <el-icon :size="22" color="#fff"><Document /></el-icon>
            </div>
            <span>使用记录</span>
          </div>
          <div class="service-item" @click="showService('help')">
            <div class="service-icon" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">
              <el-icon :size="22" color="#fff"><OfficeBuilding /></el-icon>
            </div>
            <span>使用帮助</span>
          </div>
        </div>

        <div class="section-title" style="margin-top: 24px;">
          <h3>可信存证</h3>
          <p>所有证照操作均已上链存证，可追溯、可核验</p>
        </div>

        <div class="evidence-card">
          <div class="evidence-header">
            <span class="evidence-title">区块链存证证明</span>
            <el-tag size="small" type="success">已核验</el-tag>
          </div>
          <div class="evidence-info">
            <div class="evidence-row">
              <span class="label">存证哈希</span>
              <span class="value mono">0x7f8e9a3b...2c4d</span>
            </div>
            <div class="evidence-row">
              <span class="label">存证时间</span>
              <span class="value">2024-05-08 10:30:25</span>
            </div>
            <div class="evidence-row">
              <span class="label">区块高度</span>
              <span class="value">18,723,456</span>
            </div>
            <div class="evidence-row">
              <span class="label">区块链交易ID</span>
              <span class="value mono">0xa1b2c3d4...e5f6</span>
            </div>
          </div>
          <el-button type="primary" size="small" style="width: 100%; margin-top: 12px;" @click="showEvidenceVerify">
            核验存证
          </el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="showDetail" title="证照详情" width="90%" :close-on-click-modal="false">
      <div v-if="currentCert" class="cert-detail">
        <div class="detail-header">
          <div class="cert-icon-large" :style="{ background: getCertColor(currentCert.cert_type) }">
            <el-icon :size="32" color="#fff"><Document /></el-icon>
          </div>
          <div>
            <h3>{{ currentCert.cert_name }}</h3>
            <el-tag :type="currentCert.status === 'valid' ? 'success' : 'info'">
              {{ currentCert.status === 'valid' ? '有效' : '失效' }}
            </el-tag>
          </div>
        </div>
        <div class="detail-body">
          <div class="detail-row">
            <span class="label">证照号码</span>
            <span class="value">{{ currentCert.cert_number }}</span>
          </div>
          <div class="detail-row">
            <span class="label">签发机关</span>
            <span class="value">{{ currentCert.issue_authority }}</span>
          </div>
          <div class="detail-row">
            <span class="label">签发日期</span>
            <span class="value">{{ currentCert.issue_date }}</span>
          </div>
        </div>

        <div class="detail-section-title">
          <el-icon :size="16"><Document /></el-icon>
          <span>证照调用记录</span>
        </div>
        <div class="call-records">
          <div v-for="(record, idx) in callRecords" :key="idx" class="call-record-item">
            <div class="record-top">
              <span class="record-caller">{{ record.caller }}</span>
              <el-tag size="small" :type="record.result === '通过' ? 'success' : 'warning'">
                {{ record.result }}
              </el-tag>
            </div>
            <div class="record-info">
              <span>{{ record.time }}</span>
              <span class="record-purpose">{{ record.purpose }}</span>
            </div>
          </div>
          <el-empty v-if="callRecords.length === 0" description="暂无调用记录" :image-size="40" />
        </div>

        <div class="detail-section-title">
          <el-icon :size="16"><UserFilled /></el-icon>
          <span>授权校验</span>
        </div>
        <div class="auth-check-area">
          <div class="auth-check-row">
            <span class="label">授权状态</span>
            <el-tag :type="authInfo.authorized ? 'success' : 'danger'" size="small">
              {{ authInfo.authorized ? '已授权' : '未授权' }}
            </el-tag>
          </div>
          <div class="auth-check-row">
            <span class="label">授权有效期</span>
            <span class="value">{{ authInfo.expiry }}</span>
          </div>
          <div class="auth-check-row">
            <span class="label">授权对象</span>
            <span class="value">{{ authInfo.target }}</span>
          </div>
        </div>

        <div class="detail-section-title">
          <el-icon :size="16"><OfficeBuilding /></el-icon>
          <span>可信存证结果</span>
        </div>
        <div class="evidence-result-area">
          <div class="evidence-result-row">
            <span class="label">存证哈希</span>
            <span class="value mono">{{ evidenceInfo.hash }}</span>
          </div>
          <div class="evidence-result-row">
            <span class="label">存证时间</span>
            <span class="value">{{ evidenceInfo.time }}</span>
          </div>
          <div class="evidence-result-row">
            <span class="label">区块链交易ID</span>
            <span class="value mono">{{ evidenceInfo.txId }}</span>
          </div>
          <div class="evidence-result-row">
            <span class="label">核验状态</span>
            <el-tag :type="evidenceInfo.verifyStatus === '已通过' ? 'success' : 'warning'" size="small">
              {{ evidenceInfo.verifyStatus }}
            </el-tag>
          </div>
        </div>

        <div class="detail-actions">
          <el-button style="flex: 1;" @click="showDetail = false">关闭</el-button>
          <el-button type="primary" style="flex: 1;" @click="showCertCode">出示证照</el-button>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="showVerifyCode" title="出示证照" width="85%" :close-on-click-modal="false" @close="onVerifyDialogClose">
      <div class="verify-code-content">
        <div class="verify-code-header">
          <div class="verify-code-label">动态核验码</div>
          <div class="verify-code-number">
            <span v-for="(digit, idx) in verifyCodeDigits" :key="idx" class="digit-box">{{ digit }}</span>
          </div>
        </div>
        <div class="countdown-area">
          <span v-if="countdown > 0" class="countdown-text">
            有效期剩余 <span class="countdown-highlight">{{ formatCountdown(countdown) }}</span>
          </span>
          <span v-else class="countdown-expired">核验码已过期，请重新出示</span>
        </div>
        <div class="verify-purpose">
          <div class="verify-purpose-label">核验用途</div>
          <el-radio-group v-model="verifyPurpose" class="purpose-group">
            <el-radio label="办事出示" />
            <el-radio label="身份核验" />
            <el-radio label="证照复印" />
          </el-radio-group>
        </div>
        <div class="verify-cert-name">
          <span class="label">证照名称</span>
          <span class="value">{{ currentCert?.cert_name }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showVerifyCode = false">关闭</el-button>
        <el-button type="primary" :disabled="countdown <= 0" @click="confirmVerifyCode">确认出示</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showHistoryDialog" title="使用记录" width="90%">
      <div class="history-list">
        <div v-for="(item, idx) in usageRecords" :key="idx" class="history-item">
          <div class="history-left">
            <div class="history-cert-name">{{ item.certName }}</div>
            <div class="history-meta">
              <span>{{ item.time }}</span>
              <span class="history-scene">{{ item.scene }}</span>
            </div>
          </div>
          <div class="history-right">
            <el-tag size="small" :type="item.result === '通过' ? 'success' : 'warning'">{{ item.result }}</el-tag>
            <div class="history-operator">{{ item.operator }}</div>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="showAuthDialog" title="授权管理" width="90%">
      <div class="auth-list">
        <div v-for="(item, idx) in authList" :key="idx" class="auth-item">
          <div class="auth-item-left">
            <div class="auth-target">
              <el-icon :size="16"><UserFilled /></el-icon>
              <span>{{ item.target }}</span>
            </div>
            <div class="auth-meta">
              <span>授权范围：{{ item.scope }}</span>
            </div>
            <div class="auth-meta">
              <span>有效期：{{ item.expiry }}</span>
            </div>
          </div>
          <div class="auth-item-right">
            <el-tag size="small" :type="item.active ? 'success' : 'info'">
              {{ item.active ? '生效中' : '已失效' }}
            </el-tag>
            <el-button
              v-if="item.active"
              type="danger"
              size="small"
              text
              @click="revokeAuth(idx)"
            >
              撤销
            </el-button>
          </div>
        </div>
        <el-empty v-if="authList.length === 0" description="暂无授权记录" :image-size="40" />
      </div>
      <template #footer>
        <el-button @click="showAuthDialog = false">关闭</el-button>
        <el-button type="primary" @click="addAuth">新增授权</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAddAuthDialog" title="新增授权" width="85%">
      <el-form :model="newAuth" label-width="80px" label-position="left">
        <el-form-item label="授权对象">
          <el-input v-model="newAuth.target" placeholder="请输入授权对象名称" />
        </el-form-item>
        <el-form-item label="授权范围">
          <el-select v-model="newAuth.scope" placeholder="请选择授权范围" style="width: 100%;">
            <el-option label="仅查看" value="仅查看" />
            <el-option label="查看与核验" value="查看与核验" />
            <el-option label="完全授权" value="完全授权" />
          </el-select>
        </el-form-item>
        <el-form-item label="有效期至">
          <el-input v-model="newAuth.expiry" placeholder="如：2026-12-31" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddAuthDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddAuth">确认授权</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showEvidenceDialog" title="可信存证核验" width="90%">
      <div class="evidence-verify-content">
        <div class="verify-section">
          <div class="verify-section-title">区块链核验状态</div>
          <div class="verify-result-row">
            <span class="label">核验结果</span>
            <el-tag type="success" size="small">核验通过</el-tag>
          </div>
          <div class="verify-result-row">
            <span class="label">链上确认数</span>
            <span class="value">128 确认</span>
          </div>
          <div class="verify-result-row">
            <span class="label">所在链</span>
            <span class="value">粤澳区块链公共服务链</span>
          </div>
        </div>

        <el-divider />

        <div class="verify-section">
          <div class="verify-section-title">存证完整性校验</div>
          <div class="verify-result-row">
            <span class="label">哈希比对</span>
            <el-tag type="success" size="small">一致</el-tag>
          </div>
          <div class="verify-result-row">
            <span class="label">原文哈希</span>
            <span class="value mono">0x7f8e9a3b4c5d6e7f...a1b2</span>
          </div>
          <div class="verify-result-row">
            <span class="label">链上哈希</span>
            <span class="value mono">0x7f8e9a3b4c5d6e7f...a1b2</span>
          </div>
        </div>

        <el-divider />

        <div class="verify-section">
          <div class="verify-section-title">时间戳验证</div>
          <div class="verify-result-row">
            <span class="label">存证时间</span>
            <span class="value">2024-05-08 10:30:25</span>
          </div>
          <div class="verify-result-row">
            <span class="label">时间戳证书</span>
            <el-tag type="success" size="small">有效</el-tag>
          </div>
          <div class="verify-result-row">
            <span class="label">签发机构</span>
            <span class="value">国家授时中心</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showEvidenceDialog = false">确认</el-button>
      </template>
    </el-dialog>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Document, UserFilled, OfficeBuilding } from '@element-plus/icons-vue'
import BottomNav from '@/components/BottomNav.vue'

const router = useRouter()
const userStore = useUserStore()
const certificates = ref([])
const showDetail = ref(false)
const currentCert = ref(null)

const showVerifyCode = ref(false)
const verifyCode = ref('')
const verifyPurpose = ref('办事出示')
const countdown = ref(300)
let countdownTimer = null

const showHistoryDialog = ref(false)
const showAuthDialog = ref(false)
const showAddAuthDialog = ref(false)
const showEvidenceDialog = ref(false)

const newAuth = ref({ target: '', scope: '', expiry: '' })

const validCount = computed(() => certificates.value.filter(c => c.status === 'valid').length)
const usedCount = ref(12)

const verifyCodeDigits = computed(() => {
  const code = verifyCode.value
  const digits = []
  for (let i = 0; i < 6; i++) {
    digits.push(code[i] || '-')
  }
  return digits
})

const callRecords = computed(() => {
  if (!currentCert.value) return []
  return [
    { time: '2026-05-28 14:32', caller: '市政务服务中心', purpose: '办事窗口身份核验', result: '通过' },
    { time: '2026-05-25 09:15', caller: '市医保局', purpose: '医保报销资格核验', result: '通过' },
    { time: '2026-05-20 16:45', caller: '区税务局', purpose: '纳税信息比对核验', result: '通过' },
    { time: '2026-05-15 11:20', caller: '市住房公积金中心', purpose: '公积金提取身份核验', result: '未通过' },
    { time: '2026-05-10 08:50', caller: '市公安局', purpose: '户籍信息比对', result: '通过' }
  ]
})

const authInfo = computed(() => {
  if (!currentCert.value) return { authorized: false, expiry: '-', target: '-' }
  return {
    authorized: true,
    expiry: '2026-12-31',
    target: '粤省事平台、市政务服务中心'
  }
})

const evidenceInfo = computed(() => {
  if (!currentCert.value) return { hash: '-', time: '-', txId: '-', verifyStatus: '-' }
  const id = currentCert.value.id
  const hashSuffix = ((id * 7919) % 0xFFFFFF).toString(16).padStart(6, '0')
  return {
    hash: `0x7f8e9a3b...${hashSuffix}`,
    time: '2024-05-08 10:30:25',
    txId: `0xa1b2c3d4...${hashSuffix}`,
    verifyStatus: '已通过'
  }
})

const usageRecords = ref([
  { time: '2026-06-01 15:30', certName: '居民身份证', scene: '办事出示', result: '通过', operator: '市政务服务中心' },
  { time: '2026-05-30 10:20', certName: '社会保障卡', scene: '身份核验', result: '通过', operator: '市医保局' },
  { time: '2026-05-28 14:32', certName: '居民身份证', scene: '办事出示', result: '通过', operator: '市政务服务中心' },
  { time: '2026-05-25 09:15', certName: '医疗保险凭证', scene: '身份核验', result: '通过', operator: '市医保局' },
  { time: '2026-05-22 11:00', certName: '机动车驾驶证', scene: '证照复印', result: '通过', operator: '市公安局交警支队' },
  { time: '2026-05-20 16:45', certName: '居民身份证', scene: '身份核验', result: '未通过', operator: '区税务局' },
  { time: '2026-05-18 08:30', certName: '社会保障卡', scene: '办事出示', result: '通过', operator: '市人社局' },
  { time: '2026-05-15 11:20', certName: '居民户口簿', scene: '身份核验', result: '未通过', operator: '市住房公积金中心' },
  { time: '2026-05-12 13:45', certName: '医疗保险凭证', scene: '证照复印', result: '通过', operator: '区医保分局' },
  { time: '2026-05-10 08:50', certName: '居民身份证', scene: '身份核验', result: '通过', operator: '市公安局' }
])

const authList = ref([
  { target: '粤省事平台', scope: '查看与核验', expiry: '2026-12-31', active: true },
  { target: '市政务服务中心', scope: '完全授权', expiry: '2026-06-30', active: true },
  { target: '市医保局', scope: '仅查看', expiry: '2026-09-30', active: true },
  { target: '区税务局', scope: '仅查看', expiry: '2025-12-31', active: false }
])

onMounted(() => {
  if (userStore.isLoggedIn) {
    loadCertificates()
  }
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})

const loadCertificates = async () => {
  try {
    const res = await fetch('http://127.0.0.1:58942/api/certificates', {
      headers: { Authorization: `Bearer ${userStore.token}` }
    }).then(res => res.json())
    if (Array.isArray(res)) {
      certificates.value = res
    } else {
      setDefaultCerts()
    }
  } catch (e) {
    setDefaultCerts()
  }
}

const setDefaultCerts = () => {
  const userType = userStore.user?.userType || 'personal'
  if (userType === 'enterprise') {
    certificates.value = [
      { id: 1, cert_type: 'business_license', cert_name: '营业执照', cert_number: '91440101MA5XXXXX1A', status: 'valid', issue_authority: '广东省市场监督管理局', issue_date: '2020-01-01' },
      { id: 2, cert_type: 'tax_registration', cert_name: '税务登记证', cert_number: '91440101MA5XXXXX1A', status: 'valid', issue_authority: '国家税务总局广东省税务局', issue_date: '2020-01-01' },
      { id: 3, cert_type: 'social_security_unit', cert_name: '单位社保登记证', cert_number: '440101202400001', status: 'valid', issue_authority: '广东省人力资源和社会保障厅', issue_date: '2020-01-01' }
    ]
  } else if (userType === 'elder') {
    certificates.value = [
      { id: 1, cert_type: 'id_card', cert_name: '居民身份证', cert_number: '440101195501011234', status: 'valid', issue_authority: '广州市公安局', issue_date: '2020-01-01' },
      { id: 2, cert_type: 'social_security', cert_name: '社会保障卡', cert_number: '440101195501011234', status: 'valid', issue_authority: '广东省人力资源和社会保障厅', issue_date: '2020-01-01' },
      { id: 3, cert_type: 'medical_insurance', cert_name: '医疗保险凭证', cert_number: '440101195501011234', status: 'valid', issue_authority: '广东省医疗保障局', issue_date: '2020-01-01' },
      { id: 4, cert_type: 'elderly_card', cert_name: '老年人优待证', cert_number: 'GD202400001', status: 'valid', issue_authority: '广东省民政厅', issue_date: '2020-01-01' }
    ]
  } else {
    certificates.value = [
      { id: 1, cert_type: 'id_card', cert_name: '居民身份证', cert_number: '440101199001011234', status: 'valid', issue_authority: '广州市公安局', issue_date: '2020-01-01' },
      { id: 2, cert_type: 'household', cert_name: '居民户口簿', cert_number: '440101202400001', status: 'valid', issue_authority: '广州市公安局天河分局', issue_date: '2020-01-01' },
      { id: 3, cert_type: 'driving_license', cert_name: '机动车驾驶证', cert_number: '440101199001011234', status: 'valid', issue_authority: '广州市公安局交通警察支队', issue_date: '2020-01-01' },
      { id: 4, cert_type: 'social_security', cert_name: '社会保障卡', cert_number: '440101199001011234', status: 'valid', issue_authority: '广东省人力资源和社会保障厅', issue_date: '2020-01-01' },
      { id: 5, cert_type: 'medical_insurance', cert_name: '医疗保险凭证', cert_number: '440101199001011234', status: 'valid', issue_authority: '广东省医疗保障局', issue_date: '2020-01-01' }
    ]
  }
}

const getCertColor = (type) => {
  const colors = {
    id_card: 'linear-gradient(135deg, #1e5cb8, #2d7dd2)',
    household: 'linear-gradient(135deg, #07c160, #10b981)',
    driving_license: 'linear-gradient(135deg, #f59e0b, #f97316)',
    social_security: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    medical_insurance: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    business_license: 'linear-gradient(135deg, #ec4899, #db2777)',
    tax_registration: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    social_security_unit: 'linear-gradient(135deg, #14b8a6, #0d9488)',
    elderly_card: 'linear-gradient(135deg, #f97316, #ea580c)'
  }
  return colors[type] || 'linear-gradient(135deg, #6b7280, #4b5563)'
}

const maskNumber = (num) => {
  if (!num) return ''
  if (num.length <= 8) return num
  return num.substring(0, 4) + '********' + num.substring(num.length - 4)
}

const viewCert = (cert) => {
  currentCert.value = cert
  showDetail.value = true
}

const generateVerifyCode = () => {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString()
  }
  return code
}

const startCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  countdown.value = 300
  countdownTimer = setInterval(() => {
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
      return
    }
    countdown.value--
  }, 1000)
}

const formatCountdown = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const showCertCode = () => {
  verifyCode.value = generateVerifyCode()
  verifyPurpose.value = '办事出示'
  showDetail.value = false
  showVerifyCode.value = true
  startCountdown()
}

const confirmVerifyCode = () => {
  usageRecords.value.unshift({
    time: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-'),
    certName: currentCert.value?.cert_name || '',
    scene: verifyPurpose.value,
    result: '通过',
    operator: '当前用户'
  })
  if (usageRecords.value.length > 10) {
    usageRecords.value = usageRecords.value.slice(0, 10)
  }
  ElMessage.success('证照核验码已出示，核验记录已保存')
  showVerifyCode.value = false
}

const onVerifyDialogClose = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const showService = (type) => {
  if (type === 'directory') {
    ElMessage.info('证照目录功能开发中')
  } else if (type === 'auth') {
    showAuthDialog.value = true
  } else if (type === 'history') {
    showHistoryDialog.value = true
  } else if (type === 'help') {
    ElMessage.info('使用帮助功能开发中')
  }
}

const showEvidenceVerify = () => {
  showEvidenceDialog.value = true
}

const revokeAuth = (idx) => {
  authList.value[idx].active = false
  ElMessage.success('授权已撤销')
}

const addAuth = () => {
  newAuth.value = { target: '', scope: '', expiry: '' }
  showAddAuthDialog.value = true
}

const confirmAddAuth = () => {
  if (!newAuth.value.target || !newAuth.value.scope || !newAuth.value.expiry) {
    ElMessage.warning('请填写完整的授权信息')
    return
  }
  authList.value.unshift({
    target: newAuth.value.target,
    scope: newAuth.value.scope,
    expiry: newAuth.value.expiry,
    active: true
  })
  showAddAuthDialog.value = false
  ElMessage.success('授权新增成功')
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.certificates-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 80px;
}

.page-header {
  background: linear-gradient(135deg, #1e5cb8 0%, #2d7dd2 100%);
  padding: 24px 20px;
  color: white;
}

.page-header h2 {
  font-size: 20px;
  margin: 0 0 4px;
}

.page-header p {
  font-size: 13px;
  opacity: 0.9;
  margin: 0;
}

.login-prompt {
  padding: 60px 20px;
}

.stats-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #1e5cb8;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.section-title {
  margin-bottom: 12px;
}

.section-title h3 {
  font-size: 16px;
  color: #333;
  margin: 0 0 2px;
}

.section-title p {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.cert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cert-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.cert-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.cert-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cert-info {
  flex: 1;
}

.cert-info h4 {
  font-size: 15px;
  color: #333;
  margin: 0 0 4px;
}

.cert-number {
  font-size: 12px;
  color: #666;
  margin: 0 0 2px;
  font-family: monospace;
}

.cert-authority {
  font-size: 11px;
  color: #999;
  margin: 0;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  background: white;
  padding: 16px;
  border-radius: 12px;
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 4px;
  border-radius: 8px;
  transition: background 0.3s;
}

.service-item:hover {
  background: #f5f7fa;
}

.service-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.service-item span {
  font-size: 12px;
  color: #333;
  text-align: center;
}

.evidence-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
}

.evidence-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.evidence-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.evidence-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.evidence-row:last-child {
  border-bottom: none;
}

.evidence-row .label {
  font-size: 13px;
  color: #999;
}

.evidence-row .value {
  font-size: 13px;
  color: #333;
}

.evidence-row .value.mono {
  font-family: monospace;
  color: #1e5cb8;
}

.cert-detail {
  padding: 10px 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.cert-icon-large {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-header h3 {
  font-size: 18px;
  color: #333;
  margin: 0 0 8px;
}

.detail-body {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row .label {
  color: #999;
  font-size: 14px;
}

.detail-row .value {
  color: #333;
  font-size: 14px;
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.detail-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 16px 0 10px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.call-records {
  background: #f9fafb;
  border-radius: 8px;
  padding: 8px 12px;
}

.call-record-item {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.call-record-item:last-child {
  border-bottom: none;
}

.record-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.record-caller {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.record-info {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.record-purpose {
  color: #666;
}

.auth-check-area {
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px 16px;
}

.auth-check-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.auth-check-row:last-child {
  border-bottom: none;
}

.auth-check-row .label {
  font-size: 13px;
  color: #999;
}

.auth-check-row .value {
  font-size: 13px;
  color: #333;
}

.evidence-result-area {
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px 16px;
}

.evidence-result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.evidence-result-row:last-child {
  border-bottom: none;
}

.evidence-result-row .label {
  font-size: 13px;
  color: #999;
}

.evidence-result-row .value {
  font-size: 13px;
  color: #333;
}

.evidence-result-row .value.mono {
  font-family: monospace;
  color: #1e5cb8;
}

.verify-code-content {
  text-align: center;
}

.verify-code-header {
  margin-bottom: 16px;
}

.verify-code-label {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
}

.verify-code-number {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.digit-box {
  width: 42px;
  height: 52px;
  line-height: 52px;
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  color: #1e5cb8;
  background: #f0f5ff;
  border: 2px solid #c5d9f0;
  border-radius: 8px;
  font-family: monospace;
}

.countdown-area {
  margin: 16px 0;
}

.countdown-text {
  font-size: 13px;
  color: #666;
}

.countdown-highlight {
  color: #e6a23c;
  font-weight: 600;
  font-family: monospace;
}

.countdown-expired {
  font-size: 13px;
  color: #f56c6c;
  font-weight: 500;
}

.verify-purpose {
  margin: 20px 0;
  text-align: left;
}

.verify-purpose-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 10px;
}

.purpose-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.verify-cert-name {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 8px;
}

.verify-cert-name .label {
  font-size: 13px;
  color: #999;
}

.verify-cert-name .value {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.history-list {
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
}

.history-item:last-child {
  border-bottom: none;
}

.history-left {
  flex: 1;
}

.history-cert-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.history-meta {
  font-size: 12px;
  color: #999;
  display: flex;
  gap: 10px;
}

.history-scene {
  color: #666;
}

.history-right {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.history-operator {
  font-size: 11px;
  color: #999;
}

.auth-list {
  max-height: 400px;
  overflow-y: auto;
}

.auth-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
}

.auth-item:last-child {
  border-bottom: none;
}

.auth-item-left {
  flex: 1;
}

.auth-target {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}

.auth-meta {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.auth-item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.evidence-verify-content {
  padding: 4px 0;
}

.verify-section {
  padding: 4px 0;
}

.verify-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.verify-result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.verify-result-row .label {
  font-size: 13px;
  color: #999;
}

.verify-result-row .value {
  font-size: 13px;
  color: #333;
}

.verify-result-row .value.mono {
  font-family: monospace;
  color: #1e5cb8;
  word-break: break-all;
}
</style>
