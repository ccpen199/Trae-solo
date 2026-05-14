<template>
  <div class="profile-page">
    <div class="container">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>个人中心</span>
          </div>
        </template>
        
        <div v-if="loading" class="page-loading">
          <el-skeleton :rows="5" animated />
        </div>
        
        <template v-else>
          <div class="profile-info">
            <div class="avatar-section">
              <el-avatar :size="100" :src="user?.avatar">
                {{ (user?.nickname || user?.username || 'U').charAt(0) }}
              </el-avatar>
            </div>
            
            <el-form
              ref="formRef"
              :model="form"
              label-width="80px"
              style="margin-top: 30px; max-width: 500px;"
            >
              <el-form-item label="用户名">
                <el-input v-model="form.username" disabled />
              </el-form-item>
              
              <el-form-item label="昵称">
                <el-input v-model="form.nickname" placeholder="请输入昵称" />
              </el-form-item>
              
              <el-form-item label="邮箱">
                <el-input v-model="form.email" placeholder="请输入邮箱" />
              </el-form-item>
              
              <el-form-item label="角色">
                <el-tag :type="roleTagType">{{ roleText }}</el-tag>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" :loading="saving" @click="saveProfile">
                  保存修改
                </el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <el-divider />
          
          <div class="password-section">
            <h3>修改密码</h3>
            <el-form
              ref="passwordFormRef"
              :model="passwordForm"
              :rules="passwordRules"
              label-width="100px"
              style="max-width: 500px;"
            >
              <el-form-item label="原密码" prop="oldPassword">
                <el-input v-model="passwordForm.oldPassword" type="password" show-password />
              </el-form-item>
              
              <el-form-item label="新密码" prop="newPassword">
                <el-input v-model="passwordForm.newPassword" type="password" show-password />
              </el-form-item>
              
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" :loading="changingPassword" @click="changePassword">
                  修改密码
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </template>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import api from '@/utils/api'

const userStore = useUserStore()

const formRef = ref()
const passwordFormRef = ref()
const loading = ref(false)
const saving = ref(false)
const changingPassword = ref(false)

const user = computed(() => userStore.user)

const form = reactive({
  username: '',
  nickname: '',
  email: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const roleText = computed(() => {
  const roleMap = {
    user: '普通用户',
    bar_owner: '吧主',
    operator: '运营人员',
    admin: '管理员'
  }
  return roleMap[user.value?.role] || '未知'
})

const roleTagType = computed(() => {
  const typeMap = {
    user: '',
    bar_owner: 'success',
    operator: 'warning',
    admin: 'danger'
  }
  return typeMap[user.value?.role] || ''
})

onMounted(() => {
  if (user.value) {
    form.username = user.value.username || ''
    form.nickname = user.value.nickname || ''
    form.email = user.value.email || ''
  }
})

async function saveProfile() {
  saving.value = true
  try {
    const res = await userStore.updateProfile({
      nickname: form.nickname,
      email: form.email
    })
    if (res.success) {
      ElMessage.success('保存成功')
    }
  } catch (e) {
    console.error('保存失败:', e)
  } finally {
    saving.value = false
  }
}

async function changePassword() {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    changingPassword.value = true
    
    const res = await api.put('/auth/password', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    
    if (res.success) {
      ElMessage.success('密码修改成功')
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    }
  } catch (e) {
    console.error('修改密码失败:', e)
  } finally {
    changingPassword.value = false
  }
}
</script>

<style scoped>
.profile-page {
  padding: 30px 0;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}

.profile-info {
  text-align: center;
}

.avatar-section {
  margin-bottom: 20px;
}

.password-section h3 {
  margin-bottom: 20px;
  color: #303133;
}
</style>
