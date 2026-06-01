<template>
  <div class="live-room">
    <div class="live-main">
      <div class="video-area">
        <div class="video-placeholder">
          <el-icon><VideoPlay /></el-icon>
          <p>直播画面区域</p>
          <p class="live-status" :class="{ 'is-live': isLive }">{{ isLive ? '直播中' : '未开始' }}</p>
        </div>
      </div>
      
      <div class="controls-bar">
        <div class="course-info">
          <h3>{{ course?.title }}</h3>
          <span>讲师：{{ course?.instructor_name }}</span>
        </div>
        <div class="controls">
          <el-button :type="checkedIn ? 'success' : 'primary'" @click="handleCheckIn" :disabled="checkedIn">
            {{ checkedIn ? '已签到' : '签到' }}
          </el-button>
          <el-button @click="togglePollPanel">
            <el-icon><DataAnalysis /></el-icon> 投票
          </el-button>
          <el-button @click="toggleQAPanel">
            <el-icon><QuestionFilled /></el-icon> 提问
          </el-button>
        </div>
      </div>
    </div>
    
    <div class="live-sidebar">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="聊天互动" name="chat">
          <div class="chat-messages" ref="chatContainer">
            <div v-for="(msg, index) in chatMessages" :key="index" class="chat-item" :class="msg.type">
              <template v-if="msg.type === 'system'">
                <span class="system-msg">{{ msg.content }}</span>
              </template>
              <template v-else>
                <span class="chat-user">{{ msg.userName }}：</span>
                <span class="chat-content">{{ msg.content }}</span>
              </template>
            </div>
          </div>
          <div class="chat-input">
            <el-input v-model="chatInput" placeholder="输入聊天内容..." @keyup.enter="sendChat" />
            <el-button type="primary" @click="sendChat">发送</el-button>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="提问" name="qa">
          <div class="qa-list">
            <div v-for="q in questions" :key="q.id" class="qa-item">
              <div class="qa-header">
                <span class="qa-user">{{ q.user_name }}</span>
                <span class="qa-time">{{ formatTime(q.created_at) }}</span>
              </div>
              <div class="qa-content">{{ q.content }}</div>
            </div>
          </div>
          <div class="qa-input">
            <el-input v-model="questionInput" type="textarea" :rows="2" placeholder="输入您的问题..." />
            <el-button type="primary" @click="submitQuestion" style="margin-top: 10px; width: 100%;">提交问题</el-button>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="投票" name="poll">
          <div class="poll-list">
            <div v-for="poll in polls" :key="poll.id" class="poll-item">
              <div class="poll-question">{{ poll.question }}</div>
              <div class="poll-options">
                <div v-for="(opt, idx) in poll.options" :key="idx" class="poll-option" @click="votePoll(poll.id, idx)">
                  <div class="option-bar">
                    <div class="option-progress" :style="{ width: getVotePercent(poll, idx) + '%' }"></div>
                  </div>
                  <div class="option-info">
                    <span class="option-text">{{ opt }}</span>
                    <span class="option-count">{{ getVoteCount(poll, idx) }} 票</span>
                  </div>
                  <el-icon v-if="poll.user_vote === idx" class="voted-icon"><CircleCheck /></el-icon>
                </div>
              </div>
            </div>
          </div>
          <div v-if="canCreatePoll" class="create-poll">
            <el-input v-model="newPoll.question" placeholder="投票问题" style="margin-bottom: 10px;" />
            <div v-for="(opt, idx) in newPoll.options" :key="idx" class="poll-option-input">
              <el-input v-model="newPoll.options[idx]" :placeholder="'选项 ' + (idx + 1)" style="flex: 1;" />
              <el-button @click="removePollOption(idx)" :disabled="newPoll.options.length <= 2">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button @click="addPollOption" style="margin: 10px 0;">添加选项</el-button>
            <el-button type="primary" @click="createPoll" style="width: 100%;">创建投票</el-button>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="资料" name="materials">
          <div class="material-list">
            <div v-for="(m, idx) in materials" :key="idx" class="material-item">
              <el-icon><Document /></el-icon>
              <span>{{ m }}</span>
              <el-button type="primary" link size="small">下载</el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElIcon } from 'element-plus'
import { VideoPlay, DataAnalysis, QuestionFilled, CircleCheck, Delete, Document } from '@element-plus/icons-vue'
import api from '@/utils/api'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const userStore = useUserStore()
const course = ref(null)
const checkedIn = ref(false)
const isLive = ref(true)
const activeTab = ref('chat')
const chatInput = ref('')
const questionInput = ref('')
const chatMessages = ref([])
const questions = ref([])
const polls = ref([])
const materials = ref([])
const chatContainer = ref(null)
let ws = null

const canCreatePoll = computed(() => userStore.isAdmin || userStore.isInstructor)
const newPoll = ref({
  question: '',
  options: ['', '']
})

function initWebSocket() {
  const wsUrl = `ws://localhost:3000`
  ws = new WebSocket(wsUrl)
  
  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: 'join',
      courseId: route.params.courseId,
      userId: userStore.userInfo.id,
      userName: userStore.userInfo.name
    }))
  }
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'system' || data.type === 'chat') {
      chatMessages.value.push(data)
      scrollToBottom()
    }
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

function sendChat() {
  if (!chatInput.value.trim()) return
  if (ws) {
    ws.send(JSON.stringify({
      type: 'chat',
      content: chatInput.value
    }))
  }
  chatInput.value = ''
}

async function loadCourse() {
  course.value = await api.get(`/courses/${route.params.courseId}`)
  materials.value = JSON.parse(course.value.materials || '[]')
  
  const attendance = await api.get(`/live/${route.params.courseId}/attendance`)
  checkedIn.value = !!attendance
  
  const [qList, pList] = await Promise.all([
    api.get(`/live/${route.params.courseId}/questions`),
    api.get(`/live/${route.params.courseId}/polls`)
  ])
  questions.value = qList
  polls.value = pList
}

async function handleCheckIn() {
  try {
    await api.post(`/live/${route.params.courseId}/checkin`, {
      ip_address: '127.0.0.1',
      device_info: navigator.userAgent
    })
    checkedIn.value = true
    ElMessage.success('签到成功')
  } catch (error) {
    ElMessage.error(error.error || '签到失败')
  }
}

async function submitQuestion() {
  if (!questionInput.value.trim()) return
  await api.post(`/live/${route.params.courseId}/question`, { content: questionInput.value })
  questionInput.value = ''
  ElMessage.success('提问成功')
  loadQuestions()
}

async function loadQuestions() {
  questions.value = await api.get(`/live/${route.params.courseId}/questions`)
}

async function votePoll(pollId, optionIndex) {
  const poll = polls.value.find(p => p.id === pollId)
  if (poll.user_vote !== undefined) return
  
  try {
    await api.post(`/live/poll/${pollId}/vote`, { option_index: optionIndex })
    ElMessage.success('投票成功')
    loadPolls()
  } catch (error) {
    ElMessage.error(error.error || '投票失败')
  }
}

async function loadPolls() {
  polls.value = await api.get(`/live/${route.params.courseId}/polls`)
}

function getVoteCount(poll, idx) {
  const vote = poll.votes?.find(v => v.option_index === idx)
  return vote?.count || 0
}

function getVotePercent(poll, idx) {
  const total = poll.votes?.reduce((sum, v) => sum + v.count, 0) || 0
  if (total === 0) return 0
  return Math.round((getVoteCount(poll, idx) / total) * 100)
}

function addPollOption() {
  newPoll.value.options.push('')
}

function removePollOption(idx) {
  newPoll.value.options.splice(idx, 1)
}

async function createPoll() {
  if (!newPoll.value.question || newPoll.value.options.filter(o => o.trim()).length < 2) {
    return ElMessage.warning('请填写完整的投票信息')
  }
  
  await api.post(`/live/${route.params.courseId}/poll`, {
    question: newPoll.value.question,
    options: newPoll.value.options.filter(o => o.trim())
  })
  
  newPoll.value = { question: '', options: ['', ''] }
  ElMessage.success('投票创建成功')
  loadPolls()
}

function togglePollPanel() {
  activeTab.value = 'poll'
}

function toggleQAPanel() {
  activeTab.value = 'qa'
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('zh-CN')
}

onMounted(() => {
  loadCourse()
  initWebSocket()
})

onUnmounted(() => {
  if (ws) ws.close()
})
</script>

<style scoped>
.live-room {
  display: flex;
  height: calc(100vh - 60px);
  gap: 20px;
}

.live-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.video-area {
  flex: 1;
  background: #000;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.video-placeholder {
  text-align: center;
  color: #fff;
}

.video-placeholder .el-icon {
  font-size: 80px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.live-status {
  display: inline-block;
  padding: 4px 12px;
  background: #909399;
  border-radius: 20px;
  font-size: 14px;
  margin-top: 12px;
}

.live-status.is-live {
  background: #f56c6c;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.controls-bar {
  margin-top: 20px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.course-info h3 {
  margin: 0 0 4px;
  font-size: 18px;
}

.course-info span {
  color: #909399;
  font-size: 14px;
}

.controls {
  display: flex;
  gap: 12px;
}

.live-sidebar {
  width: 380px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-messages {
  height: 400px;
  overflow-y: auto;
  padding: 16px;
}

.chat-item {
  margin-bottom: 12px;
  font-size: 14px;
}

.chat-item.system {
  text-align: center;
}

.system-msg {
  display: inline-block;
  padding: 4px 12px;
  background: #f0f2f5;
  border-radius: 12px;
  color: #909399;
  font-size: 12px;
}

.chat-user {
  color: #409EFF;
  font-weight: 500;
}

.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #f0f0f0;
}

.qa-list {
  height: 400px;
  overflow-y: auto;
  padding: 16px;
}

.qa-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 12px;
}

.qa-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
}

.qa-user {
  color: #409EFF;
  font-weight: 500;
}

.qa-time {
  color: #909399;
}

.qa-input {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
}

.poll-list {
  height: 400px;
  overflow-y: auto;
  padding: 16px;
}

.poll-item {
  margin-bottom: 24px;
}

.poll-question {
  font-weight: 500;
  margin-bottom: 12px;
}

.poll-option {
  padding: 8px 0;
  cursor: pointer;
  position: relative;
}

.option-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.option-progress {
  height: 100%;
  background: #409EFF;
  transition: width 0.3s;
}

.option-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.option-count {
  color: #909399;
  font-size: 12px;
}

.voted-icon {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  color: #67c23a;
}

.create-poll {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
}

.poll-option-input {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.material-list {
  height: 450px;
  overflow-y: auto;
  padding: 16px;
}

.material-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 12px;
}

.material-item .el-icon {
  font-size: 24px;
  color: #409EFF;
}

.material-item span {
  flex: 1;
}
</style>
