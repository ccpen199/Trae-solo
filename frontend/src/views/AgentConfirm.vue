<template>
  <div class="confirm-page">
    <van-nav-bar
      title="二次确认"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    />

    <div class="page-content" v-if="detail">
      <div class="warn-banner">
        <van-icon name="warning-o" size="20" color="#fff" />
        <span>该操作需要您的确认后方可生效</span>
      </div>

      <div class="detail-card">
        <div class="card-header">
          <span class="badge-pending">待确认</span>
          <span class="card-time">{{ formatTime(detail.created_at) }}</span>
        </div>

        <div class="op-title-row">
          <div class="op-icon">
            <van-icon name="description" size="24" color="#fff" />
          </div>
          <div class="op-info">
            <div class="op-title">{{ detail.operation_type }}</div>
            <div class="op-id">操作单号：{{ detail.operation_no }}</div>
          </div>
        </div>

        <div class="detail-list">
          <div class="d-row">
            <span class="d-label">代办人</span>
            <span class="d-value">
              {{ detail.agent_name }}
              <van-tag plain type="warning" size="small" style="margin-left: 6px">{{ detail.relation }}</van-tag>
            </span>
          </div>
          <div class="d-row">
            <span class="d-label">联系电话</span>
            <span class="d-value">{{ detail.agent_phone }}</span>
          </div>
          <div class="d-row" v-if="detail.service_item">
            <span class="d-label">办理事项</span>
            <span class="d-value">{{ detail.service_item }}</span>
          </div>
          <div class="d-row" v-if="detail.outlet_name">
            <span class="d-label">办理网点</span>
            <span class="d-value">{{ detail.outlet_name }}</span>
          </div>
          <div class="d-row" v-if="detail.appointment_time">
            <span class="d-label">预约时间</span>
            <span class="d-value highlight">{{ detail.appointment_time }}</span>
          </div>
        </div>

        <div class="risk-tip" v-if="detail.risk_note">
          <van-icon name="info-o" size="14" color="#ff9800" />
          <span>{{ detail.risk_note }}</span>
        </div>
      </div>

      <div class="scope-card" v-if="detail.auth_scope">
        <div class="card-title">授权范围</div>
        <div class="scope-tags">
          <van-tag v-for="s in detail.auth_scope" :key="s" plain type="primary">{{ s }}</van-tag>
        </div>
      </div>

      <div class="verify-card">
        <div class="card-title">
          <span>安全验证</span>
          <span class="verify-tip">为了您的账户安全，请完成身份验证</span>
        </div>
        <div class="verify-methods">
          <div
            class="vm-item"
            :class="{ active: verifyMethod === 'sms' }"
            @click="verifyMethod = 'sms'"
          >
            <van-radio :checked="verifyMethod === 'sms'" checked-color="#1976d2" />
            <div class="vm-info">
              <div class="vm-name">短信验证码</div>
              <div class="vm-desc">发送至 138****5678</div>
            </div>
          </div>
          <div
            class="vm-item"
            :class="{ active: verifyMethod === 'face' }"
            @click="verifyMethod = 'face'"
          >
            <van-radio :checked="verifyMethod === 'face'" checked-color="#1976d2" />
            <div class="vm-info">
              <div class="vm-name">人脸识别</div>
              <div class="vm-desc">刷脸完成身份验证</div>
            </div>
          </div>
        </div>

        <div class="sms-area" v-if="verifyMethod === 'sms'">
          <van-field
            v-model="smsCode"
            placeholder="请输入短信验证码"
            maxlength="6"
            center
          >
            <template #button>
              <van-button
                size="small"
                type="primary"
                plain
                :disabled="countdown > 0"
                @click="sendSms"
              >{{ countdown > 0 ? `${countdown}s后重发` : '获取验证码' }}</van-button>
            </template>
          </van-field>
        </div>

        <div class="face-area" v-if="verifyMethod === 'face'">
          <div class="face-btn" @click="doFaceVerify">
            <div class="face-icon">
              <van-icon name="photograph" size="32" color="#1976d2" />
            </div>
            <span>{{ faceVerified ? '验证完成' : '点击开始人脸识别' }}</span>
          </div>
        </div>
      </div>

      <div class="action-area">
        <van-button block plain @click="handleReject" style="margin-bottom: 10px">
          拒绝此操作
        </van-button>
        <van-button
          block
          type="primary"
          :disabled="!canConfirm"
          @click="handleConfirm"
        >
          确认并授权
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { confirmOperation } from '../api/agent'
import { useUserStore } from '../store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const detail = ref(null)
const verifyMethod = ref('sms')
const smsCode = ref('')
const countdown = ref(0)
const faceVerified = ref(false)

const canConfirm = computed(() => {
  if (verifyMethod.value === 'sms') return smsCode.value.length === 6
  if (verifyMethod.value === 'face') return faceVerified.value
  return false
})

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function sendSms() {
  showToast('验证码已发送')
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
  smsCode.value = ''
  setTimeout(() => { smsCode.value = '123456' }, 500)
}

function doFaceVerify() {
  showToast('正在进行人脸识别...')
  setTimeout(() => {
    faceVerified.value = true
    showToast('人脸验证通过')
  }, 1500)
}

async function handleConfirm() {
  try {
    await confirmOperation({
      operation_id: route.query.id,
      confirmed: true,
      user_id: userStore.currentUserId
    })
  } catch (e) {}
  showToast('操作已确认')
  setTimeout(() => router.replace('/elder/agent/operations'), 1000)
}

async function handleReject() {
  try {
    await showConfirmDialog({
      title: '拒绝操作',
      message: '确定要拒绝此代办操作吗？拒绝后该操作将不会生效。',
      confirmButtonText: '拒绝',
      confirmButtonColor: '#e53935'
    })
    try {
      await confirmOperation({
        operation_id: route.query.id,
        confirmed: false,
        user_id: userStore.currentUserId
      })
    } catch (e) {}
    showToast('已拒绝')
    setTimeout(() => router.replace('/elder/agent/operations'), 800)
  } catch (e) {}
}

onMounted(() => {
  detail.value = {
    operation_no: 'DB' + Date.now().toString().slice(-10),
    operation_type: '医保报销申请',
    created_at: new Date().toISOString(),
    agent_name: '张小华',
    relation: '儿子',
    agent_phone: '138****5678',
    service_item: '门诊医疗费用报销',
    outlet_name: '渝中区政务服务中心',
    appointment_time: '2024-05-22 10:30',
    risk_note: '该操作涉及资金往来，请确认是您授权的代办人发起。',
    auth_scope: ['社保查询', '医保报销', '养老金认证']
  }
})
</script>

<style scoped>
.confirm-page { min-height: 100vh; background: #f5f7fa; }
.page-content { padding: 12px; padding-bottom: 160px; }

.warn-banner {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: #fff;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
}

.detail-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
}
.card-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px;
}
.badge-pending {
  padding: 3px 12px;
  background: #fff3e0;
  color: #ff9800;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.card-time { font-size: 12px; color: #999; }

.op-title-row {
  display: flex; align-items: center; gap: 12px;
  padding: 14px;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border-radius: 12px;
  margin-bottom: 14px;
}
.op-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1e88e5, #1565c0);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.op-title { font-size: 17px; font-weight: 600; color: #1565c0; margin-bottom: 3px; }
.op-id { font-size: 12px; color: #1976d2; }

.detail-list {
  padding: 4px 0;
}
.d-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 9px 0;
  border-bottom: 1px solid #f5f5f5;
  font-size: 14px;
}
.d-row:last-child { border-bottom: none; }
.d-label { color: #999; }
.d-value { color: #333; font-weight: 500; text-align: right; max-width: 65%; }
.d-value.highlight { color: #1976d2; font-weight: 600; }

.risk-tip {
  display: flex; align-items: flex-start; gap: 6px;
  padding: 10px 12px;
  background: #fffbe6;
  border-radius: 8px;
  font-size: 12px;
  color: #b26a00;
  margin-top: 12px;
  line-height: 1.5;
}

.scope-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  display: flex; align-items: center; justify-content: space-between;
}
.verify-tip { font-size: 11px; color: #999; font-weight: normal; }
.scope-tags {
  display: flex; flex-wrap: wrap; gap: 8px;
}

.verify-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
}
.verify-methods {
  display: flex; flex-direction: column; gap: 2px;
  margin-bottom: 14px;
}
.vm-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  border: 1.5px solid transparent;
}
.vm-item.active {
  background: #f5faff;
  border-color: #bbdefb;
}
.vm-info { flex: 1; }
.vm-name { font-size: 14px; font-weight: 500; color: #333; margin-bottom: 2px; }
.vm-desc { font-size: 12px; color: #999; }

.sms-area {
  padding: 8px 0;
}
:deep(.van-field) {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 8px 12px;
}

.face-area { padding: 8px 0; }
.face-btn {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding: 20px;
  background: #f5faff;
  border: 2px dashed #bbdefb;
  border-radius: 12px;
  color: #1976d2;
  font-size: 14px;
  font-weight: 500;
}
.face-icon {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: #fff;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.15);
}

.action-area {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  padding: 12px 16px;
  background: #fff;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.04);
}
</style>
