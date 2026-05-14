<template>
  <div class="chat">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <div class="header-title">
        <div class="shop-name">官方旗舰店</div>
        <div class="shop-status">在线</div>
      </div>
      <div class="more-btn">⋯</div>
    </div>

    <div class="chat-content" ref="chatContent">
      <div v-if="messages.length === 0" class="empty-state">
        <div class="icon">💬</div>
        <div class="text">欢迎咨询，很高兴为您服务！</div>
      </div>
      
      <div 
        v-for="(msg, index) in messages" 
        :key="index"
        class="message-item"
        :class="{ 'from-user': msg.sender_type === 'user' }"
      >
        <div v-if="msg.sender_type !== 'user'" class="avatar">🏪</div>
        <div class="message-bubble">
          <div class="message-text">{{ msg.content }}</div>
          <div class="message-time">{{ formatTime(msg.created_at) }}</div>
        </div>
        <div v-if="msg.sender_type === 'user'" class="avatar user">👤</div>
      </div>
    </div>

    <div class="bottom-bar safe-area-bottom">
      <div class="quick-btns">
        <div class="quick-btn" @click="sendQuick('请问有货吗？')">有没有货</div>
        <div class="quick-btn" @click="sendQuick('能优惠吗？')">能优惠吗</div>
        <div class="quick-btn" @click="sendQuick('什么时候发货？')">发货时间</div>
      </div>
      <div class="input-wrapper">
        <input 
          v-model="inputText" 
          type="text" 
          placeholder="请输入消息..."
          @keyup.enter="sendMessage"
        />
        <button 
          class="send-btn"
          :disabled="!inputText.trim()"
          @click="sendMessage"
        >发送</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { messageApi } from '../api';

const route = useRoute();
const router = useRouter();
const showToast = inject('showToast');

const messages = ref([]);
const inputText = ref('');
const chatContent = ref(null);

const fetchMessages = async () => {
  try {
    const res = await messageApi.getChatMessages(route.params.shopId);
    if (res.code === 200) {
      messages.value = res.data.list || [];
      scrollToBottom();
    }
  } catch (e) {
    console.error(e);
  }
};

const sendMessage = async () => {
  const text = inputText.value.trim();
  if (!text) return;
  
  const tempMsg = {
    id: Date.now(),
    sender_type: 'user',
    content: text,
    created_at: new Date().toISOString()
  };
  
  messages.value.push(tempMsg);
  inputText.value = '';
  scrollToBottom();
  
  try {
    await messageApi.sendChatMessage(route.params.shopId, {
      content: text
    });
    
    setTimeout(async () => {
      await fetchMessages();
    }, 1500);
  } catch (e) {
    console.error(e);
    showToast('发送失败');
  }
};

const sendQuick = (text) => {
  inputText.value = text;
  sendMessage();
};

const goBack = () => {
  router.back();
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContent.value) {
      chatContent.value.scrollTop = chatContent.value.scrollHeight;
    }
  });
};

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

onMounted(() => {
  fetchMessages();
});
</script>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.header {
  background: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.back-btn {
  font-size: 20px;
  color: #333;
  padding: 4px;
}

.header-title {
  flex: 1;
}

.shop-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.shop-status {
  font-size: 12px;
  color: #52c41a;
  margin-top: 2px;
}

.more-btn {
  font-size: 20px;
  color: #666;
  padding: 4px;
}

.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  color: #999;
}

.empty-state .icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
  align-items: flex-start;
}

.message-item.from-user {
  flex-direction: row-reverse;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.avatar.user {
  background: #ff5000;
  color: #fff;
}

.message-bubble {
  max-width: 70%;
  margin: 0 10px;
}

.message-item.from-user .message-bubble {
  align-items: flex-end;
}

.message-text {
  background: #fff;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  border-top-left-radius: 4px;
}

.message-item.from-user .message-text {
  background: #ff5000;
  color: #fff;
  border-top-left-radius: 12px;
  border-top-right-radius: 4px;
}

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  text-align: left;
}

.message-item.from-user .message-time {
  text-align: right;
}

.bottom-bar {
  background: #fff;
  border-top: 1px solid #eee;
  flex-shrink: 0;
}

.quick-btns {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  overflow-x: auto;
}

.quick-btn {
  flex-shrink: 0;
  padding: 6px 14px;
  background: #f5f5f5;
  border-radius: 16px;
  font-size: 13px;
  color: #666;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
}

.input-wrapper input {
  flex: 1;
  height: 40px;
  border: 1px solid #eee;
  border-radius: 20px;
  padding: 0 16px;
  font-size: 14px;
  outline: none;
}

.send-btn {
  height: 40px;
  padding: 0 20px;
  border: none;
  border-radius: 20px;
  background: #ff5000;
  color: #fff;
  font-size: 14px;
}

.send-btn:disabled {
  opacity: 0.5;
}
</style>
