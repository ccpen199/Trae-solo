<template>
  <div class="min-h-screen bg-pdd-bg flex flex-col">
    <div class="sticky top-0 bg-white z-30 px-3 py-2 border-b flex items-center">
      <button @click="$router.back()" class="text-xl">←</button>
      <div class="flex-1 text-center">
        <div class="font-medium">{{ sessionName }}</div>
        <div class="text-xs text-green-500">在线</div>
      </div>
      <div class="w-6"></div>
    </div>

    <div class="flex-1 p-3 overflow-auto" ref="messagesContainer">
      <div v-if="loading" class="py-10">
        <Loading />
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="flex"
          :class="msg.is_self ? 'justify-end' : 'justify-start'"
        >
          <div class="flex gap-2 max-w-[70%]" :class="msg.is_self ? 'flex-row-reverse' : ''">
            <img
              :src="msg.is_self ? (userStore.user?.avatar || 'https://picsum.photos/40/40') : 'https://picsum.photos/40/40?random=s'"
              class="w-8 h-8 rounded-full flex-shrink-0"
            />
            <div
              class="px-3 py-2 rounded-lg text-sm"
              :class="msg.is_self ? 'bg-pdd-red text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'"
            >
              {{ msg.content }}
            </div>
          </div>
        </div>
        <div v-if="messages.length === 0" class="text-center text-gray-400 text-sm py-10">
          开始和 {{ sessionName }} 聊天吧
        </div>
      </div>
    </div>

    <div class="sticky bottom-0 bg-white border-t p-3 flex gap-2 safe-bottom">
      <input
        v-model="inputMessage"
        type="text"
        placeholder="输入消息..."
        class="flex-1 px-3 py-2 bg-gray-100 rounded-full text-sm"
        @keyup.enter="sendMessage"
      />
      <button
        @click="sendMessage"
        :disabled="!inputMessage.trim() || sending"
        class="px-4 py-2 bg-pdd-red text-white rounded-full text-sm disabled:bg-gray-300"
      >
        {{ sending ? '发送中' : '发送' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { messageApi } from '../api'
import Loading from '../components/Loading.vue'

const route = useRoute()
const userStore = useUserStore()

const loading = ref(true)
const sending = ref(false)
const messages = ref([])
const inputMessage = ref('')
const messagesContainer = ref(null)

const sessionName = ref('客服')

async function loadMessages() {
  loading.value = true
  try {
    const res = await messageApi.getMessages(route.params.sessionId)
    if (res.success) {
      messages.value = res.data || []
    }
  } catch (e) {
    console.error('加载消息列表失败:', e)
  } finally {
    loading.value = false
    nextTick(scrollToBottom)
  }
}

async function sendMessage() {
  if (!inputMessage.value.trim() || sending.value) return
  
  const content = inputMessage.value.trim()
  sending.value = true
  
  try {
    const res = await messageApi.sendMessage(route.params.sessionId, content)
    if (res.success) {
      messages.value.push({
        id: Date.now(),
        content,
        is_self: true,
        created_at: new Date().toISOString()
      })
      inputMessage.value = ''
      
      setTimeout(() => {
        messages.value.push({
          id: Date.now() + 1,
          content: '好的，已收到您的消息，客服正在处理中。',
          is_self: false,
          created_at: new Date().toISOString()
        })
        nextTick(scrollToBottom)
      }, 1000)
    }
  } catch (e) {
    console.error('发送消息失败:', e)
  } finally {
    sending.value = false
    nextTick(scrollToBottom)
  }
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

watch(() => messages.value.length, () => {
  nextTick(scrollToBottom)
})

onMounted(() => {
  sessionName.value = route.params.sessionId === 'service' ? '官方客服' : '商家客服'
  loadMessages()
})
</script>
