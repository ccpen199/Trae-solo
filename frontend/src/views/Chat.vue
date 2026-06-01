<template>
  <div class="chat-page">
    <div class="chat-header">
      <button class="back-btn" @click="goBack">←</button>
      <div class="header-info">
        <span class="chat-name">{{ chatName }}</span>
        <span class="chat-meta">{{ memberCount }} 人</span>
      </div>
      <div class="header-actions">
        <button class="action-btn" @click="showReportDialog = true">举报</button>
      </div>
    </div>

    <div class="messages-area" ref="messagesArea">
      <div v-for="msg in messages" :key="msg.id"
           class="message-item" :class="{ 'is-self': msg.sender_id === currentUserId, recalled: msg.is_recalled }">
        <div class="msg-avatar" v-if="msg.sender_id !== currentUserId">
          {{ msg.sender_name?.[0] || '?' }}
        </div>
        <div class="msg-content">
          <div class="msg-sender" v-if="msg.sender_id !== currentUserId">{{ msg.sender_name }}</div>
          <div class="msg-bubble" :class="'msg-type-' + msg.type">
            <template v-if="msg.is_recalled">
              <span class="recalled-text">消息已撤回</span>
            </template>
            <template v-else-if="msg.type === 'text'">
              {{ msg.content }}
            </template>
            <template v-else-if="msg.type === 'image'">
              <img :src="msg.content" style="max-width:200px;border-radius:8px" />
            </template>
            <template v-else-if="msg.type === 'link'">
              <a :href="msg.content" target="_blank">{{ msg.content }}</a>
            </template>
            <template v-else-if="msg.type === 'system_card'">
              <div class="system-card">{{ msg.content }}</div>
            </template>
          </div>
          <div class="msg-footer">
            <span class="msg-time">{{ formatTime(msg.created_at) }}</span>
            <span v-if="msg.sender_id === currentUserId" class="msg-status">
              <span v-if="msg.status === 'sent'">已发送</span>
              <span v-else-if="msg.status === 'delivered'">已送达</span>
              <span v-else-if="msg.status === 'read'">已读</span>
              <span v-else-if="msg.status === 'failed'" class="fail" @click="showFailReason(msg)">失败</span>
              <span v-else-if="msg.status === 'recalled'">已撤回</span>
            </span>
            <button v-if="msg.sender_id === currentUserId && !msg.is_recalled && canRecall(msg)"
                    class="recall-btn" @click="recallMessage(msg)">撤回</button>
          </div>
        </div>
      </div>
      <div v-if="loading" class="loading">加载中...</div>
    </div>

    <div class="input-area">
      <div class="type-selector">
        <select v-model="msgType">
          <option value="text">文本</option>
          <option value="image">图片</option>
          <option value="link">链接</option>
          <option value="system_card">系统卡片</option>
        </select>
      </div>
      <input v-if="msgType === 'text'" v-model="content" @keyup.enter="sendMessage"
             placeholder="输入消息..." />
      <input v-else-if="msgType === 'image'" v-model="content" placeholder="输入图片URL..." />
      <input v-else-if="msgType === 'link'" v-model="content" placeholder="输入链接URL..." />
      <input v-else-if="msgType === 'system_card'" v-model="content" placeholder="输入卡片内容..." />
      <button class="send-btn" @click="sendMessage" :disabled="!content.trim()">发送</button>
    </div>

    <div v-if="showReportDialog" class="modal-overlay" @click.self="showReportDialog = false">
      <div class="modal">
        <h3>举报</h3>
        <div class="form-item">
          <label>举报原因</label>
          <select v-model="reportData.reason">
            <option value="骚扰">骚扰</option>
            <option value="广告">广告</option>
            <option value="色情">色情</option>
            <option value="诈骗">诈骗</option>
            <option value="政治敏感">政治敏感</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div class="form-item">
          <label>详细描述</label>
          <textarea v-model="reportData.description" rows="3" placeholder="请描述具体情况..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showReportDialog = false">取消</button>
          <button class="btn-primary" @click="submitReport">提交举报</button>
        </div>
      </div>
    </div>

    <div v-if="showFailReason.show" class="modal-overlay" @click.self="showFailReason.show = false">
      <div class="modal">
        <h3>发送失败原因</h3>
        <p>{{ showFailReason.msg?.fail_reason || '未知错误' }}</p>
        <div class="modal-actions">
          <button class="btn-primary" @click="showFailReason.show = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { conversationApi, messageApi, reportApi } from '../api'

const route = useRoute()
const router = useRouter()
const convId = route.params.id

const messages = ref([])
const loading = ref(false)
const content = ref('')
const msgType = ref('text')
const chatName = ref('')
const memberCount = ref(0)
const messagesArea = ref(null)
const showReportDialog = ref(false)
const reportData = ref({ reason: '骚扰', description: '' })
const showFailReason = ref({ show: false, msg: null })

const user = JSON.parse(localStorage.getItem('user') || '{}')
const currentUserId = user.id

const goBack = () => router.push('/conversations')

const loadMessages = async () => {
  loading.value = true
  try {
    const convRes = await conversationApi.list({ type: 'all' })
    const conv = convRes.data.find(c => c.id === parseInt(convId))
    if (conv) {
      chatName.value = conv.type === 'direct'
        ? (conv.members?.find(m => m.id !== currentUserId)?.nickname || '未知')
        : (conv.name || '群聊')
      memberCount.value = conv.member_count || 0
    }
    const res = await conversationApi.messages(convId, { page_size: 100 })
    messages.value = res.data.list
    await conversationApi.read(convId)
    scrollToBottom()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesArea.value) {
    messagesArea.value.scrollTop = messagesArea.value.scrollHeight
  }
}

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const canRecall = (msg) => {
  const diff = Date.now() - new Date(msg.created_at).getTime()
  return diff < 120000 && msg.status !== 'recalled'
}

const recallMessage = async (msg) => {
  if (!confirm('确定要撤回这条消息吗？')) return
  try {
    await messageApi.recall(msg.id)
    loadMessages()
  } catch (e) {
    alert(e.response?.data?.error || '撤回失败')
  }
}

const sendMessage = async () => {
  if (!content.value.trim()) return
  try {
    await messageApi.send({
      conversation_id: parseInt(convId),
      type: msgType.value,
      content: content.value.trim()
    })
    content.value = ''
    loadMessages()
  } catch (e) {
    alert(e.response?.data?.error || '发送失败')
  }
}

const showFailReasonFn = (msg) => {
  showFailReason.value = { show: true, msg }
}

const submitReport = async () => {
  const otherUser = messages.value.find(m => m.sender_id !== currentUserId)
  if (!otherUser) {
    alert('暂无可举报对象')
    return
  }
  try {
    await reportApi.create({
      reported_user_id: otherUser.sender_id,
      reason: reportData.value.reason,
      description: reportData.value.description
    })
    showReportDialog.value = false
    reportData.value = { reason: '骚扰', description: '' }
    alert('举报已提交')
  } catch (e) {
    alert(e.response?.data?.error || '举报失败')
  }
}

onMounted(loadMessages)
</script>

<style scoped>
.chat-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
}
.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}
.back-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #64748b;
}
.header-info { flex: 1; }
.chat-name { font-weight: 500; color: #1e293b; }
.chat-meta { font-size: 12px; color: #94a3b8; margin-left: 8px; }
.header-actions .action-btn {
  padding: 6px 12px;
  background: #f1f5f9;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f5f7fa;
}
.message-item {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: flex-start;
}
.message-item.is-self { flex-direction: row-reverse; }
.msg-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}
.msg-content { max-width: 60%; }
.is-self .msg-content { align-items: flex-end; }
.msg-sender { font-size: 12px; color: #64748b; margin-bottom: 4px; }
.msg-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-all;
}
.is-self .msg-bubble { background: #3b82f6; color: #fff; border-bottom-right-radius: 4px; }
.message-item:not(.is-self) .msg-bubble { background: #fff; color: #1e293b; border: 1px solid #e2e8f0; border-bottom-left-radius: 4px; }
.msg-type-link .msg-bubble a { color: #3b82f6; }
.is-self .msg-type-link .msg-bubble a { color: #fff; }
.system-card {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 12px;
}
.recalled-text { color: #94a3b8; font-style: italic; }
.message-item.recalled .msg-bubble { opacity: 0.6; }
.msg-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 11px;
  color: #94a3b8;
}
.is-self .msg-footer { justify-content: flex-end; }
.msg-status.fail { color: #ef4444; cursor: pointer; }
.recall-btn {
  padding: 2px 6px;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  color: #64748b;
}
.input-area {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
  background: #fff;
}
.type-selector select {
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
}
.input-area input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}
.input-area input:focus { border-color: #3b82f6; }
.send-btn {
  padding: 10px 24px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}
.send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.loading { text-align: center; color: #94a3b8; padding: 20px; }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 400px;
  max-width: 90vw;
}
.modal h3 { margin-bottom: 20px; color: #1e293b; }
.form-item { margin-bottom: 16px; }
.form-item label { display: block; margin-bottom: 6px; color: #475569; font-size: 13px; }
.form-item select, .form-item textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.btn-primary { padding: 8px 20px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
.btn-secondary { padding: 8px 20px; background: #f1f5f9; color: #475569; border: none; border-radius: 6px; cursor: pointer; }
</style>
