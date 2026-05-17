<template>
  <div class="page-container">
    <div style="display: flex; align-items: center; margin-bottom: 20px">
      <el-button @click="$router.back()">返回</el-button>
      <h2 style="margin-left: 20px; margin-bottom: 0">{{ classInfo?.name }}</h2>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="成员管理" name="members">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px">
          <span>共 {{ members.length }} 位成员</span>
          <el-button type="primary" size="small" @click="showAddMemberDialog = true">添加成员</el-button>
        </div>
        <el-table :data="members" v-loading="loading" style="width: 100%">
          <el-table-column prop="name" label="姓名" />
          <el-table-column prop="phone" label="手机号" />
          <el-table-column prop="role" label="角色">
            <template #default="{ row }">
              <el-tag :type="row.role === 'teacher' ? 'warning' : 'info'" size="small">
                {{ row.role === 'teacher' ? '老师' : '学生' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="score" label="评分" />
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button size="small" @click="showScoreDialog(row)">评分</el-button>
              <el-button size="small" type="danger" @click="resetScore(row.id)">重置</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="通知动态" name="notices">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px">
          <span>共 {{ notices.length }} 条通知</span>
          <el-button type="primary" size="small" @click="showAddNoticeDialog = true">发布通知</el-button>
        </div>
        <div v-for="notice in notices" :key="notice.id" class="card" style="margin-bottom: 10px">
          <div style="font-weight: bold; margin-bottom: 10px">{{ notice.content }}</div>
          <div style="color: #999; font-size: 13px">{{ formatTime(notice.created_at) }}</div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="班级消息" name="messages">
        <div style="height: 400px; overflow-y: auto; padding: 20px; background-color: #f5f7fa; border-radius: 8px; margin-bottom: 15px">
          <div v-for="msg in messages" :key="msg.id" style="margin-bottom: 15px">
            <div style="color: #666; font-size: 13px; margin-bottom: 5px">
              {{ msg.sender_name || '系统消息' }} · {{ formatTime(msg.created_at) }}
            </div>
            <div style="display: inline-block; background-color: white; padding: 10px 15px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.1)">
              {{ msg.content }}
            </div>
          </div>
          <div v-if="messages.length === 0" style="text-align: center; color: #999; padding: 40px">
            暂无消息
          </div>
        </div>
        <el-input v-model="newMessage" type="textarea" :rows="2" placeholder="输入消息..." />
        <div style="text-align: right; margin-top: 10px">
          <el-button type="primary" @click="sendMessage" :disabled="!newMessage.trim()">发送</el-button>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showAddMemberDialog" title="添加成员" width="500px">
      <el-form :model="memberForm" label-width="100px">
        <el-form-item label="姓名">
          <el-input v-model="memberForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="memberForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="角色">
          <el-radio-group v-model="memberForm.role">
            <el-radio label="student">学生</el-radio>
            <el-radio label="teacher">老师</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddMemberDialog = false">取消</el-button>
        <el-button type="primary" @click="addMember">添加</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAddNoticeDialog" title="发布通知" width="500px">
      <el-form label-width="100px">
        <el-form-item label="通知内容">
          <el-input v-model="noticeContent" type="textarea" :rows="4" placeholder="请输入通知内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddNoticeDialog = false">取消</el-button>
        <el-button type="primary" @click="addNotice" :disabled="!noticeContent.trim()">发布</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showScoreDialog" title="学生评分" width="400px">
      <el-form label-width="100px">
        <el-form-item label="学生姓名">
          <div>{{ currentMember?.name }}</div>
        </el-form-item>
        <el-form-item label="评分">
          <el-rate v-model="scoreValue" show-score text-color="#ff9900" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showScoreDialog = false">取消</el-button>
        <el-button type="primary" @click="submitScore">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../utils/request'
import dayjs from 'dayjs'

const route = useRoute()
const loading = ref(false)
const activeTab = ref('members')
const classInfo = ref(null)
const members = ref([])
const notices = ref([])
const messages = ref([])
const newMessage = ref('')
const noticeContent = ref('')
const showAddMemberDialog = ref(false)
const showAddNoticeDialog = ref(false)
const showScoreDialog = ref(false)
const currentMember = ref(null)
const scoreValue = ref(0)
const memberForm = ref({
  name: '',
  phone: '',
  role: 'student'
})

const formatTime = (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'

const fetchClassInfo = async () => {
  try {
    const res = await api.get(`/class/${route.params.id}`)
    classInfo.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const fetchMembers = async () => {
  loading.value = true
  try {
    const res = await api.get(`/class/${route.params.id}/members`)
    members.value = res.data || []
  } finally {
    loading.value = false
  }
}

const fetchNotices = async () => {
  try {
    const res = await api.get(`/class/${route.params.id}/notices`)
    notices.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

const fetchMessages = async () => {
  try {
    const res = await api.get(`/class/${route.params.id}/messages`)
    messages.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

const addMember = async () => {
  if (!memberForm.value.name) {
    ElMessage.error('请输入姓名')
    return
  }
  try {
    await api.post(`/class/${route.params.id}/members`, memberForm.value)
    ElMessage.success('添加成功')
    showAddMemberDialog.value = false
    memberForm.value = { name: '', phone: '', role: 'student' }
    fetchMembers()
  } catch (e) {
    console.error(e)
  }
}

const addNotice = async () => {
  try {
    await api.post(`/class/${route.params.id}/notices`, { content: noticeContent.value })
    ElMessage.success('发布成功')
    showAddNoticeDialog.value = false
    noticeContent.value = ''
    fetchNotices()
  } catch (e) {
    console.error(e)
  }
}

const sendMessage = async () => {
  try {
    await api.post(`/class/${route.params.id}/messages`, { content: newMessage.value })
    newMessage.value = ''
    fetchMessages()
  } catch (e) {
    console.error(e)
  }
}

const openScoreDialog = (member) => {
  currentMember.value = member
  scoreValue.value = member.score || 0
  showScoreDialog.value = true
}

const submitScore = async () => {
  try {
    await api.post(`/class/${route.params.id}/members/${currentMember.value.id}/score`, { score: scoreValue.value })
    ElMessage.success('评分成功')
    showScoreDialog.value = false
    fetchMembers()
  } catch (e) {
    console.error(e)
  }
}

const resetScore = async (memberId) => {
  try {
    await api.post(`/class/${route.params.id}/members/${memberId}/reset-score`)
    ElMessage.success('重置成功')
    fetchMembers()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchClassInfo()
  fetchMembers()
  fetchNotices()
  fetchMessages()
})
</script>