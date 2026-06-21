<template>
  <div class="service-page">
    <van-nav-bar
      title="人工坐席"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    >
      <template #right>
        <span class="status-online">
          <span class="status-dot"></span>
          在线
        </span>
      </template>
    </van-nav-bar>

    <div class="chat-area" ref="chatArea">
      <div class="system-tip">
        <span>客服代表 李姐 已接入，请您描述需要办理的业务</span>
      </div>

      <div class="msg-list">
        <div class="msg-item agent" v-for="(m, i) in agentMsgs" :key="'a' + i">
          <div class="msg-avatar">
            <span>李</span>
          </div>
          <div class="msg-bubble">
            <div class="msg-text">{{ m }}</div>
            <div class="msg-time">{{ getTime() }}</div>
          </div>
        </div>

        <div class="msg-item user" v-for="(m, i) in userMsgs" :key="'u' + i">
          <div class="msg-bubble">
            <div class="msg-text">{{ m }}</div>
            <div class="msg-time">{{ getTime() }}</div>
          </div>
          <div class="msg-avatar user-avatar">
            <span>我</span>
          </div>
        </div>

        <div class="msg-item agent" v-if="typing">
          <div class="msg-avatar">
            <span>李</span>
          </div>
          <div class="msg-bubble typing">
            <div class="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="quick-questions">
      <div class="qq-title">常见问题</div>
      <div class="qq-list">
        <div class="qq-item" v-for="q in quickQuestions" :key="q" @click="sendQuick(q)">
          {{ q }}
        </div>
      </div>
    </div>

    <div class="input-area">
      <div class="voice-btn" @click="goVoice">
        <van-icon name="microphone" size="22" color="#1976d2" />
      </div>
      <div class="input-wrap">
        <input
          v-model="inputText"
          class="chat-input"
          placeholder="请输入您的问题..."
          @keyup.enter="sendMsg"
        />
      </div>
      <van-button
        type="primary"
        size="small"
        round
        :disabled="!inputText.trim()"
        @click="sendMsg"
      >发送</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const inputText = ref('')
const typing = ref(false)
const chatArea = ref(null)

const agentMsgs = ref([
  '您好！我是政务服务客服李姐，请问有什么可以帮您？',
  '您可以直接描述问题，或者点击下方常见问题快速咨询。'
])
const userMsgs = ref([])

const quickQuestions = [
  '养老金怎么认证？',
  '身份证丢了怎么补办？',
  '如何查询医保余额？',
  '帮我预约明天的号'
]

function getTime() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function scrollBottom() {
  nextTick(() => {
    if (chatArea.value) {
      chatArea.value.scrollTop = chatArea.value.scrollHeight
    }
  })
}

function sendQuick(text) {
  inputText.value = text
  sendMsg()
}

function sendMsg() {
  if (!inputText.value.trim()) return
  const text = inputText.value.trim()
  userMsgs.value.push(text)
  inputText.value = ''
  typing.value = true
  scrollBottom()

  setTimeout(() => {
    typing.value = false
    let reply = '好的，我已经了解您的问题。建议您携带本人身份证前往就近的政务服务中心办理，也可以通过APP在线申请。需要我帮您预约吗？'
    if (text.includes('养老金')) reply = '养老金认证可以直接在APP上完成，点击首页「养老金认证」按钮，按提示完成人脸识别即可。需要我现在帮您操作吗？'
    if (text.includes('身份证')) reply = '身份证补办需要本人携带户口本到户籍地派出所办理，也可以在APP上预约后前往。请问您需要预约哪个网点？'
    if (text.includes('医保')) reply = '您可以在「我的」-「我的证件」中查看医保余额，医保报销需要上传医疗费用凭证。需要我指导您操作吗？'
    if (text.includes('预约')) reply = '好的，请问您需要办理什么业务？我帮您推荐最近的网点和空闲时段。'
    agentMsgs.value.push(reply)
    scrollBottom()
  }, 1200)
}

function goVoice() { router.push('/elder/voice') }
</script>

<style scoped>
.service-page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}
.status-online {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px;
  color: #43a047;
  padding-right: 12px;
}
.status-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #43a047;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
.system-tip {
  text-align: center;
  margin: 8px 0 16px;
}
.system-tip span {
  display: inline-block;
  padding: 6px 14px;
  background: #e8f5e9;
  color: #43a047;
  font-size: 12px;
  border-radius: 12px;
}

.msg-list { display: flex; flex-direction: column; gap: 14px; }
.msg-item { display: flex; gap: 10px; max-width: 80%; }
.msg-item.user { align-self: flex-end; flex-direction: row-reverse; }

.msg-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1976d2, #1565c0);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}
.user-avatar {
  background: linear-gradient(135deg, #ff9800, #f57c00);
}

.msg-bubble {
  background: #fff;
  padding: 10px 14px;
  border-radius: 4px 14px 14px 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  min-width: 60px;
}
.msg-item.user .msg-bubble {
  background: linear-gradient(135deg, #1e88e5, #1565c0);
  color: #fff;
  border-radius: 14px 4px 14px 14px;
}
.msg-text {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 4px;
  word-break: break-all;
}
.msg-time {
  font-size: 10px;
  opacity: 0.6;
  text-align: right;
}

.typing .typing-dots {
  display: flex; gap: 4px;
  padding: 6px 0;
}
.typing .typing-dots span {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #bbb;
  animation: typingDot 1.2s infinite;
}
.typing .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typingDot {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-4px); }
}

.quick-questions {
  padding: 10px 12px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}
.qq-title {
  font-size: 12px;
  color: #999;
  margin-bottom: 10px;
}
.qq-list {
  display: flex; gap: 8px; overflow-x: auto;
  padding-bottom: 4px;
}
.qq-item {
  flex-shrink: 0;
  padding: 7px 14px;
  background: #f5faff;
  border: 1px solid #bbdefb;
  border-radius: 18px;
  font-size: 13px;
  color: #1976d2;
  white-space: nowrap;
}

.input-area {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  background: #fff;
  border-top: 1px solid #eee;
  padding-bottom: env(safe-area-inset-bottom, 10px);
}
.voice-btn {
  width: 38px; height: 38px;
  border-radius: 50%;
  background: #e3f2fd;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.input-wrap {
  flex: 1;
  background: #f5f5f5;
  border-radius: 20px;
  padding: 0 14px;
}
.chat-input {
  width: 100%;
  height: 38px;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
}
</style>
