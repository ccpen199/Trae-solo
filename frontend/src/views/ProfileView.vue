<template>
  <div class="page-container profile-page">
    <el-row :gutter="24">
      <el-col :span="8">
        <el-card shadow="never" class="info-card">
          <div class="avatar-section">
            <el-avatar :size="100">
              <el-icon :size="60"><User /></el-icon>
            </el-avatar>
            <h3 class="username">{{ user?.username }}</h3>
            <el-tag :type="getRoleTagType(user?.role)" size="large">
              {{ getRoleLabel(user?.role) }}
            </el-tag>
          </div>

          <el-divider />

          <div class="info-list">
            <div class="info-item">
              <span class="label">用户ID</span>
              <span class="value">{{ user?.id?.slice(0, 8) }}...</span>
            </div>
            <div class="info-item" v-if="user?.email">
              <span class="label">邮箱</span>
              <span class="value">{{ user.email }}</span>
            </div>
            <div class="info-item" v-if="user?.nickname">
              <span class="label">昵称</span>
              <span class="value">{{ user.nickname }}</span>
            </div>
            <div class="info-item" v-if="user?.phone">
              <span class="label">手机号</span>
              <span class="value">{{ user.phone }}</span>
            </div>
            <div class="info-item">
              <span class="label">注册时间</span>
              <span class="value">{{ formatTime(user?.createdAt) }}</span>
            </div>
          </div>

          <el-divider />

          <div class="actions">
            <el-button type="primary" @click="showEditDialog = true">
              <el-icon><Edit /></el-icon>
              编辑资料
            </el-button>
            <el-button @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="tabs-header">
              <el-tabs v-model="activeTab">
                <el-tab-pane label="我的课程" name="courses" />
                <el-tab-pane label="我的测试" name="tests" />
                <el-tab-pane label="我的提问" name="questions" />
                <el-tab-pane label="我的收藏" name="favorites" />
              </el-tabs>
            </div>
          </template>

          <div class="tab-content">
            <template v-if="activeTab === 'courses'">
              <el-empty description="暂无学习中的课程" />
            </template>

            <template v-else-if="activeTab === 'tests'">
              <div class="test-records" v-if="testRecords.length > 0">
                <div class="record-item" v-for="record in testRecords" :key="record.id">
                  <div class="record-info">
                    <h4 class="paper-title">{{ record.testPaper?.title || '测试记录' }}</h4>
                    <div class="record-meta">
                      <span>得分：<strong :class="{ passed: record.isPassed }">{{ record.score }} 分</strong></span>
                      <span>{{ record.isPassed ? '已通过' : '未通过' }}</span>
                      <span>用时：{{ record.duration || 0 }} 分钟</span>
                    </div>
                  </div>
                  <div class="record-time">{{ formatTime(record.createdAt) }}</div>
                </div>
              </div>
              <el-empty v-else description="暂无测试记录" />
            </template>

            <template v-else-if="activeTab === 'questions'">
              <div class="question-list" v-if="myQuestions.length > 0">
                <div class="question-item" v-for="question in myQuestions" :key="question.id">
                  <div class="question-stats">
                    <div class="stat-item">
                      <span class="count">{{ question.viewCount }}</span>
                      <span class="label">浏览</span>
                    </div>
                    <div class="stat-item" :class="{ answered: question.answerCount > 0 }">
                      <span class="count">{{ question.answerCount }}</span>
                      <span class="label">回答</span>
                    </div>
                  </div>
                  <div class="question-content">
                    <h4 class="question-title">
                      <el-tag v-if="question.isSolved" type="success" size="small">已解决</el-tag>
                      <el-tag v-else type="warning" size="small">待解决</el-tag>
                      <span>{{ question.title }}</span>
                    </h4>
                    <span class="question-time">{{ formatTime(question.createdAt) }}</span>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无提问记录" />
            </template>

            <template v-else-if="activeTab === 'favorites'">
              <el-empty description="暂无收藏内容" />
            </template>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showEditDialog" title="编辑个人资料" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" placeholder="请输入手机号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="editLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { api } from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const user = ref<any>(null)
const activeTab = ref('courses')
const showEditDialog = ref(false)
const editLoading = ref(false)
const testRecords = ref<any[]>([])
const myQuestions = ref<any[]>([])

const editForm = reactive({
  nickname: '',
  phone: ''
})

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    student: '学生',
    teacher: '教师',
    employee: '在职人员',
    programmer: '程序员',
    admin: '管理员'
  }
  return labels[role] || role
}

const getRoleTagType = (role: string) => {
  const types: Record<string, string> = {
    student: 'primary',
    teacher: 'success',
    employee: 'warning',
    programmer: 'info',
    admin: 'danger'
  }
  return types[role] || 'info'
}

const formatTime = (time: string) => {
  if (!time) return ''
  return new Date(time).toLocaleDateString()
}

const fetchUserInfo = async () => {
  try {
    const response = await api.get('/users/profile')
    if (response.data.success) {
      user.value = response.data.data
      editForm.nickname = user.value.nickname || ''
      editForm.phone = user.value.phone || ''
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      userStore.logout()
      router.push('/login')
    }
  }
}

const fetchTestRecords = async () => {
  try {
    const response = await api.get('/tests/records')
    if (response.data.success) {
      testRecords.value = response.data.data?.list || []
    }
  } catch (error) {
    console.error('获取测试记录失败:', error)
  }
}

const submitEdit = async () => {
  editLoading.value = true
  try {
    const response = await api.put('/users/profile', editForm)
    if (response.data.success) {
      ElMessage.success('保存成功')
      showEditDialog.value = false
      fetchUserInfo()
    }
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    editLoading.value = false
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '确认退出', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/')
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  fetchUserInfo()
  fetchTestRecords()
})
</script>

<style lang="scss">
.profile-page {
  .info-card {
    .avatar-section {
      text-align: center;
      padding: 20px 0;

      .username {
        font-size: 20px;
        margin: 16px 0 12px;
        color: #303133;
      }
    }

    .info-list {
      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #ebeef5;

        &:last-child {
          border-bottom: none;
        }

        .label {
          font-size: 14px;
          color: #909399;
        }

        .value {
          font-size: 14px;
          color: #303133;
        }
      }
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  }

  .tabs-header {
    margin: -20px;
    padding: 0 20px;
  }

  .tab-content {
    padding-top: 16px;
  }

  .test-records {
    .record-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid #ebeef5;

      &:last-child {
        border-bottom: none;
      }

      .record-info {
        .paper-title {
          font-size: 15px;
          margin: 0 0 8px;
          color: #303133;
        }

        .record-meta {
          display: flex;
          gap: 20px;
          font-size: 13px;
          color: #909399;

          strong {
            color: #303133;

            &.passed {
              color: #67C23A;
            }
          }
        }
      }

      .record-time {
        font-size: 13px;
        color: #c0c4cc;
      }
    }
  }

  .question-list {
    .question-item {
      display: flex;
      gap: 20px;
      padding: 16px 0;
      border-bottom: 1px solid #ebeef5;

      &:last-child {
        border-bottom: none;
      }

      .question-stats {
        width: 100px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .stat-item {
          text-align: center;
          padding: 8px;
          border-radius: 4px;
          background: #f5f7fa;

          &.answered {
            background: #f0f9eb;

            .count {
              color: #67C23A;
            }
          }

          .count {
            display: block;
            font-size: 18px;
            font-weight: 600;
            color: #909399;
          }

          .label {
            font-size: 12px;
            color: #909399;
          }
        }
      }

      .question-content {
        flex: 1;

        .question-title {
          font-size: 15px;
          margin: 0 0 8px;
          color: #303133;
          display: flex;
          align-items: center;
          gap: 8px;

          span:hover {
            color: #409EFF;
          }
        }

        .question-time {
          font-size: 13px;
          color: #c0c4cc;
        }
      }
    }
  }
}
</style>
