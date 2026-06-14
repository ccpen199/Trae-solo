<template>
  <div class="courier-register-container">
    <el-card class="register-card">
      <template #header>
        <div class="card-header">
          <h2>接单人入驻</h2>
          <p class="subtitle">加入FastTrust，提供专业配送服务</p>
        </div>
      </template>

      <el-steps :active="currentStep" finish-status="success" style="margin-bottom: 30px">
        <el-step title="基本信息" />
        <el-step title="资质认证" />
        <el-step title="完成入驻" />
      </el-steps>

      <el-form v-if="currentStep === 0" :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="身份证号" prop="id_card">
          <el-input v-model="form.id_card" placeholder="请输入身份证号" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="width: 100%" @click="nextStep">
            下一步
          </el-button>
        </el-form-item>
      </el-form>

      <div v-else-if="currentStep === 1" class="verify-section">
        <el-alert title="资质认证说明" type="info" :closable="false" style="margin-bottom: 20px">
          <template #default>
            <p>1. 人脸识别验证：确保是您本人注册</p>
            <p>2. 服务资质：根据您提供的服务类型上传相关资质证明</p>
          </template>
        </el-alert>

        <el-form label-width="120px">
          <el-form-item label="人脸识别">
            <el-button @click="handleFaceVerify" :type="form.faceVerified ? 'success' : ''">
              <el-icon><CircleCheck v-if="form.faceVerified" /><Scan v-else /></el-icon>
              {{ form.faceVerified ? '已验证' : '点击验证' }}
            </el-button>
          </el-form-item>

          <el-form-item label="服务资质类型">
            <el-checkbox-group v-model="form.licenseTypes">
              <el-checkbox label="同城配送">同城配送</el-checkbox>
              <el-checkbox label="宠物运送">宠物运送</el-checkbox>
              <el-checkbox label="生鲜配送">生鲜配送</el-checkbox>
              <el-checkbox label="文件递送">文件递送</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item>
            <el-button @click="currentStep = 0">上一步</el-button>
            <el-button type="primary" @click="handleRegister" :loading="loading">
              提交审核
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-else-if="currentStep === 2" class="success-section">
        <el-result
          icon="success"
          title="注册成功"
          sub-title="您的账号正在审核中，审核通过后即可接单"
        >
          <template #extra>
            <el-button type="primary" @click="$router.push('/login')">
              返回登录
            </el-button>
          </template>
        </el-result>
      </div>

      <div class="form-footer">
        <span>已有账号？</span>
        <el-link type="primary" @click="$router.push('/login')">立即登录</el-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api/modules'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const currentStep = ref(0)
const loading = ref(false)
const formRef = ref()

const form = reactive({
  phone: '',
  password: '',
  confirmPassword: '',
  name: '',
  id_card: '',
  faceVerified: false,
  licenseTypes: []
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  id_card: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /^\d{17}[\dXx]$/, message: '请输入正确的身份证号', trigger: 'blur' }
  ]
}

const nextStep = async () => {
  await formRef.value.validate(async (valid) => {
    if (valid) {
      currentStep.value = 1
    }
  })
}

const handleFaceVerify = async () => {
  ElMessage.info('人脸识别验证已模拟通过')
  form.faceVerified = true
}

const handleRegister = async () => {
  if (!form.faceVerified) {
    ElMessage.warning('请先完成人脸识别验证')
    return
  }

  if (form.licenseTypes.length === 0) {
    ElMessage.warning('请至少选择一种服务资质')
    return
  }

  loading.value = true
  try {
    const registerData = {
      phone: form.phone,
      password: form.password,
      name: form.name,
      id_card: form.id_card
    }
    const res = await authApi.courierRegister(registerData)
    if (res.success) {
      await authApi.faceVerify({ courier_id: res.courier.id, face_data: 'verified' })
      await authApi.licenseVerify({
        courier_id: res.courier.id,
        license_types: form.licenseTypes
      })
      currentStep.value = 2
    }
  } catch (error) {
    console.error('注册失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.courier-register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-card {
  width: 550px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0;
  color: #303133;
}

.subtitle {
  color: #909399;
  font-size: 14px;
  margin: 5px 0 0;
}

.form-footer {
  text-align: center;
  margin-top: 20px;
  color: #606266;
}

.form-footer span {
  margin-right: 5px;
}

.verify-section {
  padding: 10px 0;
}
</style>
