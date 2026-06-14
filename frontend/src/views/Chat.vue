<template>
  <div class="chat-page">
    <div class="page-header">
      <div class="container">
        <h2>智能问答</h2>
        <p>AI智能助手为您解答政务服务相关问题</p>
      </div>
    </div>
    
    <div class="container main-content">
      <div class="chat-layout">
        <aside class="sidebar">
          <div class="sidebar-card card p-20 mb-16">
            <h3 class="card-title mb-16">
              <el-icon><Service /></el-icon>
              快捷服务
            </h3>
            <div class="quick-services">
              <div v-for="item in quickServices" :key="item.id" class="quick-item" @click="sendQuickMessage(item.question)">
                <span class="quick-icon">{{ item.icon }}</span>
                <span class="quick-text">{{ item.name }}</span>
              </div>
            </div>
          </div>
          
          <div class="sidebar-card card p-20">
            <h3 class="card-title mb-16">
              <el-icon><HelpFilled /></el-icon>
              常见问题
            </h3>
            <div class="faq-list">
              <div v-for="(item, index) in faqs" :key="index" class="faq-item" @click="sendQuickMessage(item.question)">
                <span class="faq-q">Q:</span>
                <span class="faq-text">{{ item.question }}</span>
              </div>
            </div>
            <el-button link type="primary" class="mt-12" @click="loadMoreFaqs">
              查看更多 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </aside>
        
        <div class="chat-main card">
          <div class="chat-header">
            <div class="bot-info">
              <div class="bot-avatar">
                <el-icon size="28" color="#fff"><ChatDotRound /></el-icon>
              </div>
              <div class="bot-meta">
                <h4>政务智能助手</h4>
                <p><span class="online-dot"></span>在线服务中</p>
              </div>
            </div>
            <div class="chat-actions">
              <el-button link @click="clearChat">
                <el-icon><Delete /></el-icon>清空对话
              </el-button>
            </div>
          </div>
          
          <div class="chat-messages" ref="messagesRef">
            <div v-if="messages.length === 0" class="welcome-box">
              <div class="welcome-icon">
                <el-icon size="64" color="#1e88e5"><Robot /></el-icon>
              </div>
              <h3>您好，我是政务智能助手</h3>
              <p>请问有什么可以帮助您？</p>
              <div class="suggestion-list">
                <div v-for="(item, index) in suggestions" :key="index" class="suggestion-item" @click="sendQuickMessage(item)">
                  {{ item }}
                </div>
              </div>
            </div>
            
            <div v-for="(msg, index) in messages" :key="index" class="message-item" :class="{ 'is-user': msg.isUser }">
              <div class="message-avatar" v-if="!msg.isUser">
                <el-icon size="20" color="#fff"><ChatDotRound /></el-icon>
              </div>
              <div class="message-content">
                <div class="message-text" v-if="!msg.isTyping" v-html="formatMessage(msg.content)"></div>
                <div class="message-text typing" v-else>
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </div>
                <div class="message-time">{{ msg.time }}</div>
              </div>
              <div class="message-avatar user-avatar" v-if="msg.isUser">
                {{ userAvatar }}
              </div>
            </div>
          </div>
          
          <div class="chat-input-area">
            <div class="input-actions">
              <el-button link>
                <el-icon><Picture /></el-icon>图片
              </el-button>
              <el-button link>
                <el-icon><Service /></el-icon>选择服务
              </el-button>
            </div>
            <div class="input-box">
              <el-input
                v-model="inputMessage"
                placeholder="请输入您的问题..."
                type="textarea"
                :autosize="{ minRows: 1, maxRows: 4 }"
                @keydown.enter.exact="sendMessage"
              />
              <el-button type="primary" :disabled="!inputMessage.trim()" @click="sendMessage">
                发送
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { chatApi } from '@/api'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import dayjs from 'dayjs'

const userStore = useUserStore()
const messagesRef = ref(null)
const inputMessage = ref('')
const messages = ref([])
const sessionId = ref(null)
const userAvatar = ref(userStore.userInfo?.real_name?.charAt(0) || '用')

const quickServices = ref([
  { id: 1, name: '身份证办理', icon: '🆔', question: '身份证如何办理？' },
  { id: 2, name: '社保查询', icon: '📋', question: '社保如何查询？' },
  { id: 3, name: '公积金提取', icon: '🏠', question: '公积金如何提取？' },
  { id: 4, name: '营业执照', icon: '📄', question: '营业执照如何办理？' }
])

const faqs = ref([
  { question: '政务服务网如何注册账号？', answer: '点击首页右上角"注册"按钮，按照提示填写个人信息完成注册。' },
  { question: '忘记密码怎么办？', answer: '点击登录页面的"忘记密码"，通过手机号验证后重置密码。' },
  { question: '办件进度如何查询？', answer: '登录后进入"个人中心-我的办件"即可查看所有办件进度。' },
  { question: '如何进行实名认证？', answer: '在"个人中心-账号设置"中上传身份证照片进行实名认证。' },
  { question: '在线办理需要什么条件？', answer: '需要完成实名认证，并准备好相关申请材料的电子版。' }
])

const suggestions = ref([
  '如何办理营业执照？',
  '社保缴费记录怎么查询？',
  '身份证到期了怎么换领？',
  '公积金贷款需要什么条件？'
])

const autoReplies = {
  '身份证': '您好，身份证办理流程如下：\n\n1. **准备材料**：户口簿、原身份证（到期换领）、近期免冠照片\n2. **办理地点**：户籍所在地派出所或政务服务中心\n3. **办理流程**：\n   - 提交申请材料\n   - 采集人像和指纹\n   - 缴纳工本费20元\n   - 20个工作日后领取\n\n您也可以通过【在线办理】功能预约办理时间，减少现场等待。',
  '社保': '您好，社保相关问题解答：\n\n**社保查询方式**：\n1. 网站查询：登录社保网上服务大厅\n2. 电话查询：拨打12333服务热线\n3. APP查询：下载"四川人社"APP\n\n**社保缴费**：\n- 职工社保：由单位按月缴纳\n- 居民社保：按年缴纳，可通过微信、支付宝缴费\n\n请问您需要了解哪方面的具体信息？',
  '公积金': '您好，公积金相关问题解答：\n\n**提取条件**：\n1. 购买、建造、翻建自住住房\n2. 偿还购房贷款本息\n3. 无房职工支付房租\n4. 与单位终止劳动关系\n\n**提取流程**：\n1. 准备相关证明材料\n2. 到公积金中心或线上提交申请\n3. 审核通过后3个工作日内到账\n\n**贷款条件**：\n- 连续缴存6个月以上\n- 信用良好\n- 有购房首付款',
  '营业': '您好，营业执照办理指南：\n\n**办理流程**：\n1. **名称预先核准**：在线提交名称申请\n2. **提交材料**：公司章程、股东身份证明、住所证明等\n3. **领取执照**：审核通过后3个工作日领取\n4. **刻章备案**：到指定刻章点刻制公章\n5. **税务登记**：到税务部门办理税务登记\n\n**所需材料**：\n- 公司设立登记申请书\n- 公司章程\n- 股东身份证明\n- 住所使用证明\n\n您可以通过"企业开办一件事"服务一次性办理所有手续。'
}

const formatMessage = (content) => {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/(\d+)\./g, '<br>$1.')
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const getCurrentTime = () => {
  return dayjs().format('HH:mm')
}

const generateReply = (question) => {
  for (const [keyword, reply] of Object.entries(autoReplies)) {
    if (question.includes(keyword)) {
      return reply
    }
  }
  
  const defaultReplies = [
    '感谢您的咨询。关于您的问题，建议您：\n\n1. 拨打12345政务服务热线咨询\n2. 到就近的政务服务中心现场咨询\n3. 查看相关服务事项的详细说明\n\n请问您需要了解哪个具体事项的办理流程？',
    '您好，我理解您的问题。为了更好地帮助您，建议您：\n\n1. 查看服务事项详情页面了解具体要求\n2. 准备好相关材料后在线申请\n3. 如有疑问可拨打咨询电话\n\n请问还有什么可以帮助您的？',
    '感谢您的提问。政务服务相关问题，您可以：\n\n1. 通过搜索功能查找相关服务事项\n2. 查看常见问题（FAQ）\n3. 联系人工客服获取帮助\n\n服务热线：12345\n工作时间：周一至周五 9:00-17:00'
  ]
  
  return defaultReplies[Math.floor(Math.random() * defaultReplies.length)]
}

const sendQuickMessage = (text) => {
  inputMessage.value = text
  sendMessage()
}

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return
  
  const question = inputMessage.value.trim()
  inputMessage.value = ''
  
  messages.value.push({
    content: question,
    isUser: true,
    time: getCurrentTime(),
    isTyping: false
  })
  
  scrollToBottom()
  
  const typingMsg = {
    content: '',
    isUser: false,
    time: getCurrentTime(),
    isTyping: true
  }
  messages.value.push(typingMsg)
  scrollToBottom()
  
  try {
    let reply
    if (sessionId.value) {
      const res = await chatApi.sendMessage(sessionId.value, { message: question })
      reply = res.data?.reply || generateReply(question)
    } else {
      const res = await chatApi.createSession({ initial_message: question })
      if (res.code === 200) {
        sessionId.value = res.data.session_id
        reply = res.data.reply || generateReply(question)
      } else {
        reply = generateReply(question)
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const index = messages.value.findIndex(m => m.isTyping)
    if (index !== -1) {
      messages.value[index] = {
        content: reply,
        isUser: false,
        time: getCurrentTime(),
        isTyping: false
      }
    }
    
    scrollToBottom()
  } catch (e) {
    const index = messages.value.findIndex(m => m.isTyping)
    if (index !== -1) {
      messages.value[index] = {
        content: generateReply(question),
        isUser: false,
        time: getCurrentTime(),
        isTyping: false
      }
    }
    scrollToBottom()
  }
}

const clearChat = () => {
  messages.value = []
  sessionId.value = null
}

const loadMoreFaqs = async () => {
  try {
    const res = await chatApi.getFaqs({ pageSize: 20 })
    if (res.code === 200 && res.data?.list?.length > 0) {
      faqs.value = res.data.list
    }
    ElMessage.success('已加载更多常见问题')
  } catch (e) {
    console.error('加载FAQ失败:', e)
  }
}

onMounted(() => {
  userAvatar.value = userStore.userInfo?.real_name?.charAt(0) || '用'
})
</script>

<style lang="scss" scoped>
.chat-page {
  .page-header {
    h2 {
      font-size: 28px;
      margin: 0 0 8px;
    }
    
    p {
      margin: 0;
      opacity: 0.9;
    }
  }
}

.chat-layout {
  display: flex;
  gap: 24px;
  min-height: 600px;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
}

.quick-services {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  
  .quick-item {
    text-align: center;
    padding: 16px 8px;
    background: #f5f7fa;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background: #e3f2fd;
      color: #1e88e5;
    }
    
    .quick-icon {
      display: block;
      font-size: 24px;
      margin-bottom: 4px;
    }
    
    .quick-text {
      font-size: 13px;
    }
  }
}

.faq-list {
  .faq-item {
    display: flex;
    gap: 8px;
    padding: 10px 0;
    border-bottom: 1px solid #f0f2f5;
    cursor: pointer;
    transition: all 0.3s;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      color: #1e88e5;
    }
    
    .faq-q {
      color: #1e88e5;
      font-weight: 600;
      flex-shrink: 0;
    }
    
    .faq-text {
      font-size: 13px;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 600px;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #ebeef5;
  
  .bot-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .bot-avatar {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .bot-meta h4 {
      font-size: 16px;
      margin: 0 0 2px;
      color: #303133;
    }
    
    .bot-meta p {
      font-size: 12px;
      color: #909399;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
      
      .online-dot {
        width: 8px;
        height: 8px;
        background: #67c23a;
        border-radius: 50%;
      }
    }
  }
}

.chat-messages {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #fafafa;
}

.welcome-box {
  text-align: center;
  padding: 40px 20px;
  
  .welcome-icon {
    margin-bottom: 16px;
  }
  
  h3 {
    font-size: 20px;
    margin: 0 0 8px;
    color: #303133;
  }
  
  p {
    color: #909399;
    margin: 0 0 24px;
  }
  
  .suggestion-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    
    .suggestion-item {
      padding: 10px 20px;
      background: #fff;
      border: 1px solid #ebeef5;
      border-radius: 20px;
      font-size: 14px;
      color: #606266;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        border-color: #1e88e5;
        color: #1e88e5;
        background: #e3f2fd;
      }
    }
  }
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  
  &.is-user {
    flex-direction: row-reverse;
    
    .message-content {
      align-items: flex-end;
      
      .message-text {
        background: #1e88e5;
        color: #fff;
        border-radius: 12px 0 12px 12px;
      }
      
      .message-time {
        text-align: right;
      }
    }
  }
  
  .message-avatar {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #fff;
    
    &.user-avatar {
      background: #1e88e5;
      font-weight: 600;
    }
  }
  
  .message-content {
    max-width: 70%;
    display: flex;
    flex-direction: column;
    gap: 6px;
    
    .message-text {
      padding: 12px 16px;
      background: #fff;
      border-radius: 0 12px 12px 12px;
      color: #303133;
      line-height: 1.6;
      word-break: break-word;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      
      :deep(strong) {
        color: #1e88e5;
      }
      
      :deep(br) {
        margin-bottom: 8px;
      }
      
      &.typing {
        display: flex;
        gap: 4px;
        padding: 16px 20px;
        
        .dot {
          width: 8px;
          height: 8px;
          background: #909399;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
          
          &:nth-child(1) { animation-delay: -0.32s; }
          &:nth-child(2) { animation-delay: -0.16s; }
        }
      }
    }
    
    .message-time {
      font-size: 12px;
      color: #909399;
    }
  }
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.chat-input-area {
  border-top: 1px solid #ebeef5;
  padding: 16px 24px;
  
  .input-actions {
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
    
    .el-button {
      color: #909399;
      font-size: 13px;
    }
  }
  
  .input-box {
    display: flex;
    gap: 12px;
    align-items: flex-end;
    
    .el-input {
      flex: 1;
    }
    
    .el-button {
      height: 38px;
      padding: 0 24px;
    }
  }
}

.mt-12 {
  margin-top: 12px;
}
</style>
