<template>
  <div class="voice-page">
    <van-nav-bar
      title="语音办事"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    />

    <div class="page-content">
      <div class="voice-hero">
        <div class="hero-bg"></div>
        <div class="hero-content">
          <div class="hero-title">说出您要办的事</div>
          <div class="hero-desc">长按下方按钮，用语音描述您的需求</div>
        </div>
      </div>

      <div class="mic-area" :class="{ recording: isRecording }" @touchstart="startRecord" @touchend="stopRecord" @mousedown="startRecord" @mouseup="stopRecord">
        <div class="mic-ring ring-1"></div>
        <div class="mic-ring ring-2"></div>
        <div class="mic-ring ring-3"></div>
        <div class="mic-btn">
          <van-icon v-if="!isRecording" name="microphone" size="48" color="#fff" />
          <van-icon v-else name="pause" size="48" color="#fff" />
        </div>
        <div class="mic-tip">{{ isRecording ? '正在录音...松开发送' : '按住说话' }}</div>
      </div>

      <div class="wave-area" v-if="isRecording">
        <div class="wave-bar" v-for="i in 20" :key="i" :style="{ height: waveHeights[i - 1] + 'px' }"></div>
      </div>

      <div class="recognize-card" v-if="recognizedText || isRecording">
        <div class="rc-header">
          <van-icon name="chat-o" size="16" color="#1976d2" />
          <span>语音识别</span>
        </div>
        <div class="rc-text">
          {{ recognizedText || '正在聆听...' }}
          <span class="cursor" v-if="isRecording">|</span>
        </div>
        <div class="rc-actions" v-if="recognizedText && !isRecording">
          <van-button size="small" plain @click="recognizedText = ''">重新录入</van-button>
          <van-button size="small" type="primary" @click="submitIntent">确认办理</van-button>
        </div>
      </div>

      <div class="example-card">
        <div class="card-title">您可以这样说</div>
        <div class="example-list">
          <div class="example-item" v-for="(e, i) in examples" :key="i" @click="useExample(e)">
            <span class="ex-quote">"</span>
            <span class="ex-text">{{ e }}</span>
            <span class="ex-quote">"</span>
            <van-icon name="arrow" size="14" color="#bbb" />
          </div>
        </div>
      </div>

      <div class="history-card">
        <div class="card-title">
          <span>历史记录</span>
          <span class="clear-btn" @click="history = []">清空</span>
        </div>
        <div class="history-empty" v-if="history.length === 0">暂无历史记录</div>
        <div class="history-list" v-else>
          <div class="history-item" v-for="(h, i) in history" :key="i">
            <div class="hi-text">{{ h.text }}</div>
            <div class="hi-time">{{ h.time }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()

const isRecording = ref(false)
const recognizedText = ref('')
const history = ref([])
const waveHeights = ref(new Array(20).fill(20))

let waveTimer = null
let recogTimer = null

const examples = [
  '我要补办身份证',
  '帮我查一下社保交了多少年',
  '预约明天上午的医保报销',
  '附近哪里可以办驾驶证',
  '养老金怎么认证'
]

function startRecord() {
  isRecording.value = true
  recognizedText.value = ''
  waveTimer = setInterval(() => {
    waveHeights.value = waveHeights.value.map(() => 10 + Math.random() * 40)
  }, 100)

  const texts = ['我要补办身份证', '查一下社保余额', '预约明天的号', '附近网点']
  let idx = 0
  recogTimer = setInterval(() => {
    recognizedText.value = texts[idx]
    idx = (idx + 1) % texts.length
  }, 1500)
}

function stopRecord() {
  isRecording.value = false
  if (waveTimer) clearInterval(waveTimer)
  if (recogTimer) clearInterval(recogTimer)
  if (!recognizedText.value) {
    recognizedText.value = '我要补办身份证'
  }
}

function useExample(text) {
  recognizedText.value = text
  showToast('已填入，请点击确认办理')
}

function submitIntent() {
  const text = recognizedText.value
  showToast('正在为您匹配服务...')
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  history.value.unshift({
    text,
    time: `${now.getMonth() + 1}-${now.getDate()} ${pad(now.getHours())}:${pad(now.getMinutes())}`
  })

  setTimeout(() => {
    if (text.includes('身份证')) router.push('/outlets/appointment?service=身份证补办')
    else if (text.includes('社保')) router.push('/identity/certificates')
    else if (text.includes('预约')) router.push('/outlets/appointment')
    else if (text.includes('网点') || text.includes('附近')) router.push('/outlets')
    else if (text.includes('养老金') || text.includes('认证')) router.push('/elder')
    else router.push('/outlets/smart-match')
  }, 800)
}

onUnmounted(() => {
  if (waveTimer) clearInterval(waveTimer)
  if (recogTimer) clearInterval(recogTimer)
})
</script>

<style scoped>
.voice-page { min-height: 100vh; background: #f5f7fa; }
.page-content { padding-bottom: 30px; }

.voice-hero {
  position: relative;
  padding: 30px 20px 80px;
  overflow: hidden;
}
.hero-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
}
.hero-content {
  position: relative;
  color: #fff;
  text-align: center;
}
.hero-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 8px;
}
.hero-desc {
  font-size: 13px;
  opacity: 0.9;
}

.mic-area {
  position: relative;
  width: 140px;
  height: 140px;
  margin: -50px auto 20px;
  display: flex; align-items: center; justify-content: center;
  user-select: none;
}
.mic-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(229, 57, 53, 0.3);
}
.ring-1 { width: 100%; height: 100%; }
.ring-2 { width: 82%; height: 82%; }
.ring-3 { width: 64%; height: 64%; }

.mic-area.recording .mic-ring {
  border-color: rgba(229, 57, 53, 0.6);
  animation: ringPulse 1s infinite;
}
.mic-area.recording .ring-2 { animation-delay: 0.2s; }
.mic-area.recording .ring-3 { animation-delay: 0.4s; }
@keyframes ringPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.08); opacity: 0.5; }
}

.mic-btn {
  width: 100px; height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e53935, #c62828);
  box-shadow: 0 8px 24px rgba(229, 57, 53, 0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 1;
}
.mic-area.recording .mic-btn {
  background: linear-gradient(135deg, #43a047, #2e7d32);
  box-shadow: 0 8px 24px rgba(67, 160, 71, 0.4);
}
.mic-tip {
  position: absolute;
  bottom: -28px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 13px;
  color: #666;
  white-space: nowrap;
}

.wave-area {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3px;
  height: 60px;
  margin-bottom: 20px;
}
.wave-bar {
  width: 4px;
  background: linear-gradient(180deg, #e53935, #ff8a80);
  border-radius: 2px;
  transition: height 0.1s;
}

.recognize-card {
  margin: 0 16px 14px;
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.rc-header {
  display: flex; align-items: center; gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
}
.rc-text {
  min-height: 50px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  font-size: 15px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 12px;
}
.cursor {
  color: #1976d2;
  animation: blink 0.8s infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.rc-actions {
  display: flex; justify-content: flex-end; gap: 10px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  display: flex; justify-content: space-between; align-items: center;
}
.clear-btn {
  font-size: 12px;
  color: #999;
  font-weight: normal;
}

.example-card {
  margin: 0 16px 14px;
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.example-list { display: flex; flex-direction: column; gap: 8px; }
.example-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px;
  background: #f8f9fa;
  border-radius: 10px;
}
.ex-quote { color: #1976d2; font-weight: 600; }
.ex-text { flex: 1; font-size: 14px; color: #333; margin: 0 6px; }

.history-card {
  margin: 0 16px;
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.history-empty {
  text-align: center;
  font-size: 13px;
  color: #999;
  padding: 20px 0;
}
.history-list { display: flex; flex-direction: column; gap: 2px; }
.history-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}
.history-item:last-child { border-bottom: none; }
.hi-text { font-size: 14px; color: #333; flex: 1; }
.hi-time { font-size: 12px; color: #999; margin-left: 10px; }
</style>
