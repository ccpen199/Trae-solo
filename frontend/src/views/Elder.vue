<template>
  <div class="elder-page" :class="{ 'elder-mode': isElderMode }">
    <div class="page-header">
      <div class="header-bg"></div>
      <div class="header-content">
        <div class="h-title">暖心办 · 长辈服务</div>
        <div class="h-sub">大字 · 语音 · 人工直连 · 无广告</div>
        <div class="mode-row">
          <van-switch v-model="isElderMode" size="22px" active-color="#ff7043" />
          <span class="mode-text">{{ isElderMode ? '长辈模式已开启' : '点击开启长辈模式' }}</span>
        </div>
      </div>
    </div>

    <div class="page-content">
      <div class="env-card card" v-if="isElderMode">
        <div class="card-title">长辈独立环境</div>
        <div class="env-features">
          <div class="env-item" v-for="f in envFeatures" :key="f.key">
            <van-switch v-model="f.enabled" size="18px" active-color="#ff7043" />
            <div class="env-info">
              <div class="env-name">{{ f.icon }} {{ f.name }}</div>
              <div class="env-desc">{{ f.desc }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="quick-card card">
        <div class="card-title">快捷入口</div>
        <div class="quick-grid">
          <div class="q-item" @click="goElderHome">
            <div class="q-icon home">🏠</div>
            <span>长辈首页</span>
          </div>
          <div class="q-item" @click="goVoice">
            <div class="q-icon voice">🎤</div>
            <span>语音办事</span>
          </div>
          <div class="q-item" @click="goService">
            <div class="q-icon service">👩‍💼</div>
            <span>人工坐席</span>
          </div>
          <div class="q-item" @click="goAgentCreate">
            <div class="q-icon agent">👨‍👩‍👧</div>
            <span>创建代办</span>
          </div>
          <div class="q-item" @click="goAgentOps">
            <div class="q-icon ops">📋</div>
            <span>代办记录</span>
          </div>
          <div class="q-item" @click="goAgentConfirm">
            <div class="q-icon confirm">✅</div>
            <span>待确认</span>
          </div>
          <div class="q-item" @click="goAppointment">
            <div class="q-icon appt">📅</div>
            <span>在线预约</span>
          </div>
          <div class="q-item" @click="goCode">
            <div class="q-icon code">📲</div>
            <span>亮身份码</span>
          </div>
        </div>
      </div>

      <div class="form-demo card">
        <div class="card-title">简化表单示例</div>
        <div class="form-notice">长辈模式下，表单自动简化：必填项减少、输入框放大、语音输入可用</div>
        <div class="demo-form">
          <div class="demo-field">
            <div class="df-label">办理事项</div>
            <div class="df-value" @click="showPicker = true">{{ selectedService || '请选择 →' }}</div>
          </div>
          <div class="demo-field">
            <div class="df-label">您的姓名</div>
            <div class="df-input">
              <input v-model="form.name" placeholder="可语音输入" class="big-input" />
              <van-icon name="microphone" size="22" color="#ff7043" @click="goVoice" />
            </div>
          </div>
          <div class="demo-field">
            <div class="df-label">联系电话</div>
            <div class="df-input">
              <input v-model="form.phone" placeholder="可语音输入" type="tel" class="big-input" />
              <van-icon name="microphone" size="22" color="#ff7043" @click="goVoice" />
            </div>
          </div>
          <van-button type="primary" block round size="large" @click="submitForm">一键提交</van-button>
        </div>
      </div>

      <div class="records-card card">
        <div class="card-title">
          <span>语音办理记录</span>
          <span class="more-btn" @click="goVoice">更多</span>
        </div>
        <div class="record-list" v-if="voiceRecords.length">
          <div class="rec-item" v-for="r in voiceRecords" :key="r.id">
            <div class="rec-icon">🎤</div>
            <div class="rec-info">
              <div class="rec-text">{{ r.text }}</div>
              <div class="rec-meta">{{ r.time }} · {{ r.result }}</div>
            </div>
          </div>
        </div>
        <div class="empty-tip" v-else>暂无语音记录，点击上方"语音办事"开始</div>
      </div>

      <div class="records-card card">
        <div class="card-title">
          <span>人工坐席记录</span>
          <span class="more-btn" @click="goService">更多</span>
        </div>
        <div class="record-list" v-if="serviceRecords.length">
          <div class="rec-item" v-for="s in serviceRecords" :key="s.id">
            <div class="rec-icon">👩‍💼</div>
            <div class="rec-info">
              <div class="rec-text">{{ s.agent }}：{{ s.topic }}</div>
              <div class="rec-meta">{{ s.time }} · {{ s.status }}</div>
            </div>
          </div>
        </div>
        <div class="empty-tip" v-else>暂无坐席记录，点击上方"人工坐席"直连</div>
      </div>

      <div class="hotline-card">
        <div class="hl-title">24小时服务热线</div>
        <div class="hl-number">12345</div>
        <van-button type="warning" block round size="large" @click="callHotline">立即拨打</van-button>
      </div>
    </div>

    <van-action-sheet v-model:show="showPicker" :actions="serviceActions" @select="onSelectService" cancel-text="取消" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { showToast } from 'vant'
import { toggleElderMode } from '../api/users'

const router = useRouter()
const userStore = useUserStore()

const isElderMode = computed({
  get: () => userStore.isElderMode,
  set: async (v) => {
    userStore.setElderMode(v)
    try { await toggleElderMode({ userId: userStore.currentUserId, enabled: v }) } catch (e) {}
    showToast(v ? '长辈模式已开启' : '长辈模式已关闭')
  }
})

const envFeatures = ref([
  { key: 'large_font', name: '超大字体', icon: '🔍', desc: '字体放大至1.5倍', enabled: true },
  { key: 'no_ads', name: '无广告弹窗', icon: '🚫', desc: '禁用所有弹窗和广告', enabled: true },
  { key: 'simplified', name: '简化界面', icon: '📱', desc: '隐藏非必要元素', enabled: true },
  { key: 'voice', name: '语音优先', icon: '🎤', desc: '所有输入支持语音', enabled: true },
  { key: 'contrast', name: '高对比度', icon: '🎨', desc: '增强色彩对比', enabled: false }
])

const selectedService = ref('')
const showPicker = ref(false)
const form = ref({ name: '', phone: '' })

const serviceActions = [
  { name: '养老金认证' }, { name: '身份证补办' }, { name: '社保查询' },
  { name: '医保报销' }, { name: '高龄补贴' }, { name: '驾驶证换证' }
]

const voiceRecords = ref([
  { id: 1, text: '我要补办身份证', time: '今天 09:15', result: '已跳转预约' },
  { id: 2, text: '查一下社保交了多少年', time: '昨天 14:30', result: '已查询' }
])

const serviceRecords = ref([
  { id: 1, agent: '客服李姐', topic: '养老金认证方法', time: '06-18 10:20', status: '已解决' },
  { id: 2, agent: '客服王姐', topic: '高龄补贴申请条件', time: '06-15 15:00', status: '已解决' }
])

function onSelectService(a) { selectedService.value = a.name; showPicker.value = false }
function submitForm() { showToast('表单已提交，工作人员将联系您') }
function callHotline() { showToast('正在拨打12345...') }
function goElderHome() { router.push('/elder/home') }
function goVoice() { router.push('/elder/voice') }
function goService() { router.push('/elder/service') }
function goAgentCreate() { router.push('/elder/agent/create') }
function goAgentOps() { router.push('/elder/agent/operations') }
function goAgentConfirm() { router.push('/elder/agent/confirm') }
function goAppointment() { router.push('/outlets/appointment') }
function goCode() { router.push('/identity/code') }
</script>

<style scoped>
.elder-page { min-height: 100vh; background: #f5f7fa; }
.elder-page.elder-mode { font-size: 17px; }
.page-header { position: relative; padding: 30px 16px 40px; }
.header-bg { position: absolute; top: 0; left: 0; right: 0; height: 180px; background: linear-gradient(135deg, #ff7043 0%, #f4511e 100%); border-radius: 0 0 28px 28px; }
.header-content { position: relative; color: #fff; }
.h-title { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
.h-sub { font-size: 13px; opacity: 0.9; margin-bottom: 14px; }
.mode-row { display: flex; align-items: center; gap: 10px; }
.mode-text { font-size: 14px; }
.page-content { padding: 0 12px 30px; margin-top: -16px; position: relative; z-index: 1; }
.card { background: #fff; border-radius: 14px; padding: 16px; margin-bottom: 12px; }
.card-title { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
.more-btn { font-size: 13px; color: #ff7043; font-weight: normal; }
.elder-mode .card-title { font-size: 18px; }

.env-features { display: flex; flex-direction: column; gap: 10px; }
.env-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
.env-item:last-child { border-bottom: none; }
.env-info { flex: 1; }
.env-name { font-size: 14px; font-weight: 500; color: #333; margin-bottom: 2px; }
.env-desc { font-size: 12px; color: #999; }

.quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px 8px; }
.q-item { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.q-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.q-icon.home { background: #fff3e0; }
.q-icon.voice { background: #ffebee; }
.q-icon.service { background: #f3e5f5; }
.q-icon.agent { background: #e3f2fd; }
.q-icon.ops { background: #e8f5e9; }
.q-icon.confirm { background: #e0f7fa; }
.q-icon.appt { background: #fce4ec; }
.q-icon.code { background: #e8eaf6; }
.q-item span { font-size: 13px; color: #333; }
.elder-mode .q-item span { font-size: 15px; }

.form-notice { padding: 10px; background: #fff8e1; border-radius: 8px; font-size: 12px; color: #b26a00; margin-bottom: 14px; line-height: 1.5; }
.demo-form { display: flex; flex-direction: column; gap: 12px; }
.demo-field {}
.df-label { font-size: 15px; font-weight: 600; color: #333; margin-bottom: 6px; }
.elder-mode .df-label { font-size: 17px; }
.df-value { padding: 12px 14px; background: #f8f9fa; border-radius: 10px; font-size: 15px; color: #666; }
.df-input { display: flex; align-items: center; gap: 10px; background: #f8f9fa; border-radius: 10px; padding: 0 14px; }
.big-input { flex: 1; height: 48px; border: none; background: transparent; font-size: 16px; outline: none; }
.elder-mode .big-input { font-size: 20px; height: 56px; }

.record-list { display: flex; flex-direction: column; gap: 2px; }
.rec-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
.rec-item:last-child { border-bottom: none; }
.rec-icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
.rec-info { flex: 1; }
.rec-text { font-size: 14px; color: #333; margin-bottom: 3px; }
.rec-meta { font-size: 12px; color: #999; }
.empty-tip { text-align: center; padding: 16px; font-size: 13px; color: #999; }

.hotline-card { background: linear-gradient(135deg, #ff7043, #f4511e); border-radius: 16px; padding: 24px; text-align: center; color: #fff; }
.hl-title { font-size: 14px; margin-bottom: 6px; opacity: 0.9; }
.hl-number { font-size: 40px; font-weight: 700; margin-bottom: 16px; letter-spacing: 3px; }
</style>
