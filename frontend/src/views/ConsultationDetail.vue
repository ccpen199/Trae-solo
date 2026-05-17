<template>
  <Layout>
    <div class="consultation-detail">
      <div v-loading="loading" class="detail-container">
        <template v-if="consultation">
          <div class="header-card">
            <div class="doctor-info">
              <el-avatar :size="60" class="doctor-avatar">
                {{ consultation.doctor_name?.charAt(0) || '医' }}
              </el-avatar>
              <div class="info">
                <div class="doctor-name">
                  {{ consultation.doctor_name }}
                  <el-tag :type="getStatusType(consultation.status)" size="small">
                    {{ getStatusText(consultation.status) }}
                  </el-tag>
                </div>
                <div class="doctor-dept">{{ consultation.department }}</div>
                <div class="consultation-type">
                  {{ getTypeText(consultation.type) }}
                </div>
              </div>
            </div>
          </div>

          <div class="messages-card">
            <div class="messages-header">对话记录</div>
            <div ref="messagesContainer" class="messages-list">
              <div
                v-for="msg in messages"
                :key="msg.id"
                :class="['message-item', msg.sender_type === 'user' ? 'message-user' : 'message-doctor']"
              >
                <div v-if="msg.sender_type === 'doctor'" class="message-avatar">
                  <el-avatar :size="40">
                    {{ consultation.doctor_name?.charAt(0) || '医' }}
                  </el-avatar>
                </div>
                <div class="message-content">
                  <div class="message-bubble">
                    <p>{{ msg.content }}</p>
                    <div v-if="msg.images" class="message-images">
                      <img
                        v-for="(img, idx) in JSON.parse(msg.images)"
                        :key="idx"
                        :src="img"
                        class="message-image"
                      />
                    </div>
                  </div>
                  <div class="message-time">{{ formatTime(msg.created_at) }}</div>
                </div>
                <div v-if="msg.sender_type === 'user'" class="message-avatar">
                  <el-avatar :size="40" class="user-avatar">我</el-avatar>
                </div>
              </div>

              <div v-if="messages.length === 0" class="empty-messages">
                <el-empty description="暂无对话记录" />
              </div>
            </div>
          </div>

          <div v-if="consultation.status !== 'completed'" class="input-card">
            <el-input
              v-model="newMessage"
              type="textarea"
              :rows="3"
              placeholder="请输入您的问题..."
              @keydown.enter.exact="sendMessage"
            />
            <div class="input-actions">
              <el-button type="primary" :loading="sending" @click="sendMessage">
                发送
              </el-button>
              <el-button @click="completeConsultation">
                结束咨询
              </el-button>
            </div>
          </div>

          <div v-else class="completed-card">
            <el-result icon="success" title="咨询已结束" sub-title="感谢您使用云医宠服务">
              <template #extra>
                <el-button type="primary" @click="$router.push('/doctors')">
                  再次咨询
                </el-button>
              </template>
            </el-result>
          </div>
        </template>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import Layout from '../components/Layout.vue';
import request from '../utils/request';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const sending = ref(false);
const consultation = ref(null);
const messages = ref([]);
const newMessage = ref('');
const messagesContainer = ref(null);

const consultationId = route.params.id;

const loadDetail = async () => {
  loading.value = true;
  try {
    const res = await request.get(`/consultations/${consultationId}`);
    if (res.success) {
      consultation.value = res.data;
      messages.value = res.data.messages || [];
      await nextTick();
      scrollToBottom();
    }
  } catch (error) {
    ElMessage.error('加载咨询详情失败');
  } finally {
    loading.value = false;
  }
};

const sendMessage = async () => {
  if (!newMessage.value.trim()) {
    ElMessage.warning('请输入消息内容');
    return;
  }

  sending.value = true;
  try {
    const res = await request.post(`/consultations/${consultationId}/messages`, {
      content: newMessage.value.trim()
    });
    if (res.success) {
      messages.value.push(res.data);
      newMessage.value = '';
      await nextTick();
      scrollToBottom();
    }
  } catch (error) {
    ElMessage.error('发送消息失败');
  } finally {
    sending.value = false;
  }
};

const completeConsultation = async () => {
  try {
    await ElMessageBox.confirm('确定要结束本次咨询吗？结束后将无法继续发送消息', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    const res = await request.put(`/consultations/${consultationId}/status`, {
      status: 'completed'
    });
    if (res.success) {
      consultation.value.status = 'completed';
      ElMessage.success('咨询已结束');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败');
    }
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    cancelled: 'info'
  };
  return map[status] || 'info';
};

const getStatusText = (status) => {
  const map = {
    pending: '待回复',
    processing: '咨询中',
    completed: '已完成',
    cancelled: '已取消'
  };
  return map[status] || status;
};

const getTypeText = (type) => {
  const map = {
    image: '图文咨询',
    phone: '电话咨询',
    video: '视频咨询'
  };
  return map[type] || type;
};

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  loadDetail();
});
</script>

<style scoped>
.consultation-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.detail-container {
  min-height: 600px;
}

.header-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid #f0f0f0;
}

.doctor-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.doctor-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 600;
}

.info {
  flex: 1;
}

.doctor-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.doctor-dept {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.consultation-type {
  display: inline-block;
  padding: 2px 8px;
  background: #ecf5ff;
  color: #409eff;
  border-radius: 4px;
  font-size: 12px;
}

.messages-card {
  background: #fff;
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

.messages-header {
  padding: 16px 20px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #f0f0f0;
}

.messages-list {
  height: 400px;
  overflow-y: auto;
  padding: 20px;
  background: #f5f7fa;
}

.empty-messages {
  padding: 40px 0;
}

.message-item {
  display: flex;
  margin-bottom: 20px;
  gap: 12px;
}

.message-user {
  flex-direction: row-reverse;
}

.message-doctor {
  flex-direction: row;
}

.message-avatar {
  flex-shrink: 0;
}

.user-avatar {
  background: #409eff;
  color: #fff;
}

.message-content {
  max-width: 70%;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  word-break: break-word;
}

.message-doctor .message-bubble {
  background: #fff;
  border-bottom-left-radius: 4px;
}

.message-user .message-bubble {
  background: #409eff;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message-bubble p {
  margin: 0;
  line-height: 1.6;
}

.message-images {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.message-image {
  max-width: 150px;
  max-height: 150px;
  border-radius: 8px;
  object-fit: cover;
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}

.message-user .message-time {
  text-align: right;
}

.input-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #f0f0f0;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.completed-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
}
</style>
