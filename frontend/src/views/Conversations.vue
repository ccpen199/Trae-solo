<template>
  <div class="conversations-page">
    <div class="toolbar">
      <div class="search-box">
        <input v-model="keyword" @keyup.enter="loadList" placeholder="搜索会话..." />
        <button @click="loadList">🔍</button>
      </div>
      <div class="filters">
        <select v-model="typeFilter" @change="loadList">
          <option value="all">全部类型</option>
          <option value="direct">单聊</option>
          <option value="group">群聊</option>
          <option value="cs">客服会话</option>
        </select>
        <button class="btn" @click="showCreateDialog = true">+ 新建会话</button>
        <button class="btn" :class="{ active: showArchived }" @click="toggleArchived">
          {{ showArchived ? '✓ 已归档' : '归档' }}
        </button>
      </div>
    </div>

    <div class="conv-list">
      <div v-for="conv in conversations" :key="conv.id"
           class="conv-item" :class="{ pinned: conv.is_pinned, archived: conv.is_archived }"
           @click="openChat(conv.id)">
        <div class="conv-avatar">
          <span v-if="conv.type === 'direct'">{{ getOtherMember(conv)?.nickname?.[0] || '?' }}</span>
          <span v-else-if="conv.type === 'group'">👥</span>
          <span v-else>🎧</span>
        </div>
        <div class="conv-info">
          <div class="conv-header">
            <span class="conv-name">{{ getConvName(conv) }}</span>
            <span class="conv-time">{{ formatTime(conv.last_message?.created_at || conv.updated_at) }}</span>
          </div>
          <div class="conv-preview">
            <span class="last-msg">{{ conv.last_message?.content || '暂无消息' }}</span>
            <span v-if="conv.unread_count > 0" class="badge">{{ conv.unread_count }}</span>
          </div>
        </div>
        <div class="conv-actions">
          <button v-if="!conv.is_pinned" class="action-btn" @click.stop="togglePin(conv)">📌</button>
          <button v-else class="action-btn active" @click.stop="togglePin(conv)">📌</button>
          <button class="action-btn" @click.stop="toggleArchive(conv)">{{ conv.is_archived ? '📤' : '📥' }}</button>
          <button class="action-btn" @click.stop="showBlockDialog(conv)">🚫</button>
        </div>
      </div>
      <div v-if="conversations.length === 0 && !loading" class="empty">暂无会话</div>
      <div v-if="loading" class="empty">加载中...</div>
    </div>

    <div v-if="showCreateDialog" class="modal-overlay" @click.self="showCreateDialog = false">
      <div class="modal">
        <h3>新建会话</h3>
        <div class="form-item">
          <label>会话类型</label>
          <select v-model="newConv.type">
            <option value="direct">单聊</option>
            <option value="group">群聊</option>
            <option value="cs">客服会话</option>
          </select>
        </div>
        <div v-if="newConv.type !== 'direct'" class="form-item">
          <label>会话名称</label>
          <input v-model="newConv.name" placeholder="输入会话名称" />
        </div>
        <div class="form-item">
          <label>选择成员</label>
          <input v-model="searchUserKeyword" @keyup="searchUsers" placeholder="搜索用户..." />
          <div class="user-list">
            <label v-for="u in searchResults" :key="u.id">
              <input type="checkbox" :value="u.id" v-model="newConv.member_ids" />
              {{ u.nickname }} ({{ u.username }})
            </label>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showCreateDialog = false">取消</button>
          <button class="btn-primary" @click="createConv">创建</button>
        </div>
      </div>
    </div>

    <div v-if="blockDialog.show" class="modal-overlay" @click.self="blockDialog.show = false">
      <div class="modal">
        <h3>{{ blockDialog.isBlocked ? '取消屏蔽' : '屏蔽用户' }}</h3>
        <p v-if="!blockDialog.isBlocked">确定要屏蔽该用户吗？屏蔽后将无法收到对方消息。</p>
        <p v-else>确定要取消屏蔽该用户吗？</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="blockDialog.show = false">取消</button>
          <button class="btn-primary" @click="confirmBlock">{{ blockDialog.isBlocked ? '取消屏蔽' : '确认屏蔽' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { conversationApi, userApi } from '../api'

const router = useRouter()
const conversations = ref([])
const loading = ref(false)
const keyword = ref('')
const typeFilter = ref('all')
const showArchived = ref(false)
const showCreateDialog = ref(false)
const newConv = ref({ type: 'direct', name: '', member_ids: [] })
const searchUserKeyword = ref('')
const searchResults = ref([])
const blockDialog = ref({ show: false, conv: null, isBlocked: false })

const user = JSON.parse(localStorage.getItem('user') || '{}')

const loadList = async () => {
  loading.value = true
  try {
    const res = await conversationApi.list({
      type: typeFilter.value,
      keyword: keyword.value,
      is_archived: showArchived.value
    })
    conversations.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const getOtherMember = (conv) => {
  if (!conv.members) return null
  return conv.members.find(m => m.id !== user.id)
}

const getConvName = (conv) => {
  if (conv.type === 'direct') {
    const other = getOtherMember(conv)
    return other?.nickname || other?.username || '未知用户'
  }
  return conv.name || (conv.type === 'cs' ? '客服会话' : '群聊')
}

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const openChat = (id) => {
  router.push(`/chat/${id}`)
}

const togglePin = async (conv) => {
  try {
    await conversationApi.pin(conv.id, { is_pinned: !conv.is_pinned })
    loadList()
  } catch (e) {
    alert(e.response?.data?.error || '操作失败')
  }
}

const toggleArchive = async (conv) => {
  try {
    await conversationApi.archive(conv.id, { is_archived: !conv.is_archived })
    loadList()
  } catch (e) {
    alert(e.response?.data?.error || '操作失败')
  }
}

const toggleArchived = () => {
  showArchived.value = !showArchived.value
  loadList()
}

const showBlockDialog = (conv) => {
  const other = getOtherMember(conv)
  if (!other) return
  blockDialog.value = { show: true, conv, isBlocked: other.is_blocked }
}

const confirmBlock = async () => {
  const other = getOtherMember(blockDialog.value.conv)
  try {
    await conversationApi.block(blockDialog.value.conv.id, {
      is_blocked: !blockDialog.value.isBlocked,
      target_user_id: other.id
    })
    blockDialog.value.show = false
    loadList()
  } catch (e) {
    alert(e.response?.data?.error || '操作失败')
  }
}

const searchUsers = async () => {
  if (!searchUserKeyword.value) {
    searchResults.value = []
    return
  }
  try {
    const res = await userApi.search({ keyword: searchUserKeyword.value })
    searchResults.value = res.data.filter(u => u.id !== user.id)
  } catch (e) {
    console.error(e)
  }
}

const createConv = async () => {
  if (newConv.value.member_ids.length === 0) {
    alert('请选择至少一个成员')
    return
  }
  try {
    const res = await conversationApi.create({
      type: newConv.value.type,
      name: newConv.value.name,
      member_ids: newConv.value.member_ids
    })
    showCreateDialog.value = false
    newConv.value = { type: 'direct', name: '', member_ids: [] }
    loadList()
  } catch (e) {
    alert(e.response?.data?.error || '创建失败')
  }
}

onMounted(loadList)
</script>

<style scoped>
.conversations-page { height: 100%; display: flex; flex-direction: column; }
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}
.search-box { display: flex; gap: 8px; flex: 1; max-width: 300px; }
.search-box input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}
.search-box button {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
.filters { display: flex; gap: 8px; }
.filters select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }
.btn {
  padding: 8px 14px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}
.btn.active { background: #f59e0b; }
.conv-list { flex: 1; overflow-y: auto; }
.conv-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #fff;
  border-radius: 10px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}
.conv-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-color: #e2e8f0; }
.conv-item.pinned { background: #fffbeb; }
.conv-item.archived { opacity: 0.6; }
.conv-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  flex-shrink: 0;
}
.conv-info { flex: 1; min-width: 0; }
.conv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.conv-name { font-weight: 500; color: #1e293b; font-size: 14px; }
.conv-time { font-size: 12px; color: #94a3b8; }
.conv-preview { display: flex; justify-content: space-between; align-items: center; }
.last-msg { color: #64748b; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; }
.badge { background: #ef4444; color: #fff; border-radius: 10px; padding: 2px 6px; font-size: 11px; min-width: 18px; text-align: center; }
.conv-actions { display: flex; gap: 4px; }
.action-btn {
  padding: 4px 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.5;
  transition: opacity 0.2s;
}
.action-btn:hover { opacity: 1; }
.action-btn.active { opacity: 1; }
.empty { text-align: center; color: #94a3b8; padding: 40px; }

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
.form-item input, .form-item select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}
.user-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px;
  margin-top: 8px;
}
.user-list label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.user-list label:hover { background: #f1f5f9; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.btn-primary { padding: 8px 20px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
.btn-secondary { padding: 8px 20px; background: #f1f5f9; color: #475569; border: none; border-radius: 6px; cursor: pointer; }
</style>
