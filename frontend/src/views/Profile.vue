<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="user-info-card" shadow="hover">
          <div class="user-avatar-section">
            <el-avatar :size="96" :icon="UserFilled" class="user-avatar" />
            <h3 class="username">{{ userInfo?.username || '用户' }}</h3>
            <el-tag type="success" effect="dark" class="role-tag">
              {{ roleText }}
            </el-tag>
          </div>
          <el-divider />
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">
                <el-icon><Phone /></el-icon>
                手机号
              </span>
              <span class="info-value">{{ userInfo?.phone || '未设置' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">
                <el-icon><OfficeBuilding /></el-icon>
                企业名称
              </span>
              <span class="info-value">{{ userInfo?.companyName || '未设置' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">
                <el-icon><User /></el-icon>
                联系人
              </span>
              <span class="info-value">{{ userInfo?.contact || '未设置' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">
                <el-icon><Medal /></el-icon>
                认证状态
              </span>
              <el-tag :type="verifyStatusType" effect="light">
                {{ verifyStatusText }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card class="tabs-card" shadow="hover">
          <el-tabs v-model="activeTab" class="profile-tabs">
            <el-tab-pane label="修改密码" name="password">
              <el-form
                ref="passwordFormRef"
                :model="passwordForm"
                :rules="passwordRules"
                class="password-form"
                label-width="100px"
              >
                <el-form-item label="原密码" prop="oldPassword">
                  <el-input
                    v-model="passwordForm.oldPassword"
                    type="password"
                    placeholder="请输入原密码"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input
                    v-model="passwordForm.newPassword"
                    type="password"
                    placeholder="请输入新密码"
                    show-password
                  />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    placeholder="请再次输入新密码"
                    show-password
                  />
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    :loading="passwordLoading"
                    @click="handleUpdatePassword"
                  >
                    确认修改
                  </el-button>
                  <el-button @click="resetPasswordForm">重置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="资质认证" name="verify">
              <el-form
                ref="verifyFormRef"
                :model="verifyForm"
                :rules="verifyRules"
                class="verify-form"
                label-width="120px"
              >
                <el-form-item label="企业名称" prop="companyName">
                  <el-input v-model="verifyForm.companyName" placeholder="请输入企业名称" />
                </el-form-item>
                <el-form-item label="统一社会信用代码" prop="creditCode">
                  <el-input v-model="verifyForm.creditCode" placeholder="请输入统一社会信用代码" />
                </el-form-item>
                <el-form-item label="营业执照" prop="businessLicense">
                  <el-upload
                    class="uploader"
                    action="#"
                    :auto-upload="false"
                    :show-file-list="true"
                    :limit="1"
                    accept="image/*"
                    :on-change="handleLicenseChange"
                  >
                    <el-button type="primary">
                      <el-icon><Upload /></el-icon>
                      上传营业执照
                    </el-button>
                    <template #tip>
                      <div class="upload-tip">支持 JPG、PNG 格式，大小不超过 5MB</div>
                    </template>
                  </el-upload>
                </el-form-item>
                <el-form-item label="法人身份证号" prop="idCard">
                  <el-input v-model="verifyForm.idCard" placeholder="请输入法人身份证号" />
                </el-form-item>
                <el-form-item label="身份证正面" prop="idCardFront">
                  <el-upload
                    class="uploader"
                    action="#"
                    :auto-upload="false"
                    :show-file-list="true"
                    :limit="1"
                    accept="image/*"
                    :on-change="handleIdCardFrontChange"
                  >
                    <el-button type="primary">
                      <el-icon><Upload /></el-icon>
                      上传身份证正面
                    </el-button>
                    <template #tip>
                      <div class="upload-tip">支持 JPG、PNG 格式，大小不超过 5MB</div>
                    </template>
                  </el-upload>
                </el-form-item>
                <el-form-item label="身份证反面" prop="idCardBack">
                  <el-upload
                    class="uploader"
                    action="#"
                    :auto-upload="false"
                    :show-file-list="true"
                    :limit="1"
                    accept="image/*"
                    :on-change="handleIdCardBackChange"
                  >
                    <el-button type="primary">
                      <el-icon><Upload /></el-icon>
                      上传身份证反面
                    </el-button>
                    <template #tip>
                      <div class="upload-tip">支持 JPG、PNG 格式，大小不超过 5MB</div>
                    </template>
                  </el-upload>
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    :loading="verifyLoading"
                    :disabled="isVerified"
                    @click="handleSubmitVerify"
                  >
                    {{ isVerified ? '已认证' : '提交认证' }}
                  </el-button>
                  <el-button @click="resetVerifyForm">重置</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  UserFilled, Phone, OfficeBuilding, User, Medal, Upload
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { submitVerify } from '@/api/auth'

const userStore = useUserStore()
const activeTab = ref('password')
const passwordFormRef = ref(null)
const verifyFormRef = ref(null)
const passwordLoading = ref(false)
const verifyLoading = ref(false)

const userInfo = computed(() => userStore.userInfo)

const roleText = computed(() => {
  const roleMap = {
    producer: '产废方',
    collector: '收废商',
    processor: '利废厂',
    admin: '管理员'
  }
  return roleMap[userInfo.value?.role] || '用户'
})

const verifyStatusType = computed(() => {
  const status = userInfo.value?.verifyStatus
  if (status === 'verified') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'rejected') return 'danger'
  return 'info'
})

const verifyStatusText = computed(() => {
  const status = userInfo.value?.verifyStatus
  const statusMap = {
    verified: '已认证',
    pending: '审核中',
    rejected: '已拒绝',
    unverified: '未认证'
  }
  return statusMap[status] || '未认证'
})

const isVerified = computed(() => userInfo.value?.verifyStatus === 'verified')

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const verifyForm = reactive({
  companyName: '',
  creditCode: '',
  businessLicense: null,
  idCard: '',
  idCardFront: null,
  idCardBack: null
})

const validateCreditCode = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入统一社会信用代码'))
  } else if (!/^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/.test(value)) {
    callback(new Error('请输入正确的统一社会信用代码'))
  } else {
    callback()
  }
}

const validateIdCard = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入身份证号'))
  } else if (!/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(value)) {
    callback(new Error('请输入正确的身份证号'))
  } else {
    callback()
  }
}

const verifyRules = {
  companyName: [
    { required: true, message: '请输入企业名称', trigger: 'blur' },
    { min: 2, max: 50, message: '企业名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  creditCode: [
    { required: true, validator: validateCreditCode, trigger: 'blur' }
  ],
  businessLicense: [
    { required: true, message: '请上传营业执照', trigger: 'change' }
  ],
  idCard: [
    { required: true, validator: validateIdCard, trigger: 'blur' }
  ],
  idCardFront: [
    { required: true, message: '请上传身份证正面', trigger: 'change' }
  ],
  idCardBack: [
    { required: true, message: '请上传身份证反面', trigger: 'change' }
  ]
}

const handleUpdatePassword = async () => {
  if (!passwordFormRef.value) return
  try {
    await passwordFormRef.value.validate()
    passwordLoading.value = true
    ElMessage.success('密码修改成功')
    resetPasswordForm()
  } catch (error) {
    console.error(error)
  } finally {
    passwordLoading.value = false
  }
}

const resetPasswordForm = () => {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordFormRef.value?.resetFields()
}

const handleLicenseChange = (file) => {
  verifyForm.businessLicense = file.raw
}

const handleIdCardFrontChange = (file) => {
  verifyForm.idCardFront = file.raw
}

const handleIdCardBackChange = (file) => {
  verifyForm.idCardBack = file.raw
}

const handleSubmitVerify = async () => {
  if (!verifyFormRef.value || isVerified.value) return
  try {
    await verifyFormRef.value.validate()
    verifyLoading.value = true
    const formData = new FormData()
    formData.append('companyName', verifyForm.companyName)
    formData.append('creditCode', verifyForm.creditCode)
    formData.append('idCard', verifyForm.idCard)
    if (verifyForm.businessLicense) {
      formData.append('businessLicense', verifyForm.businessLicense)
    }
    if (verifyForm.idCardFront) {
      formData.append('idCardFront', verifyForm.idCardFront)
    }
    if (verifyForm.idCardBack) {
      formData.append('idCardBack', verifyForm.idCardBack)
    }
    await submitVerify(formData)
    ElMessage.success('认证提交成功，请等待审核')
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message || '提交失败，请稍后重试')
    }
  } finally {
    verifyLoading.value = false
  }
}

const resetVerifyForm = () => {
  verifyForm.companyName = ''
  verifyForm.creditCode = ''
  verifyForm.businessLicense = null
  verifyForm.idCard = ''
  verifyForm.idCardFront = null
  verifyForm.idCardBack = null
  verifyFormRef.value?.resetFields()
}
</script>

<style scoped>
.profile-container {
  display: flex;
  flex-direction: column;
}

.user-info-card {
  border-radius: 12px;
}

.user-info-card :deep(.el-card__body) {
  padding: 24px 20px;
}

.user-avatar-section {
  text-align: center;
  padding: 16px 0;
}

.user-avatar {
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
  margin-bottom: 12px;
}

.username {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.role-tag {
  font-size: 13px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.info-label {
  color: #909399;
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-value {
  color: #303133;
  font-weight: 500;
}

.tabs-card {
  border-radius: 12px;
}

.tabs-card :deep(.el-card__body) {
  padding: 20px 24px;
}

.profile-tabs :deep(.el-tabs__header) {
  margin-bottom: 24px;
}

.password-form,
.verify-form {
  max-width: 500px;
}

.uploader {
  width: 100%;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}
</style>
