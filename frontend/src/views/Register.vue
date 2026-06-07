<template>
  <div class="register-container">
    <el-card class="register-card">
      <div class="register-header">
        <h1><el-icon><Van /></el-icon> 用户注册</h1>
        <p>选择您的角色，开启货运之旅</p>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item label="用户角色" prop="role">
          <el-radio-group v-model="form.role">
            <el-radio value="shipper">
              <el-icon><OfficeBuilding /></el-icon> 货主企业
            </el-radio>
            <el-radio value="driver">
              <el-icon><Avatar /></el-icon> 司机
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="real_name">
          <el-input v-model="form.real_name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="身份证号" prop="id_card_no">
          <el-input v-model="form.id_card_no" placeholder="请输入身份证号" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="width: 100%" @click="handleRegister" :loading="loading">注 册</el-button>
        </el-form-item>
        <div class="register-footer">
          <span>已有账号？</span>
          <router-link to="/login">立即登录</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Van, OfficeBuilding, Avatar } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const form = reactive({
  role: 'shipper',
  username: '',
  password: '',
  confirmPassword: '',
  phone: '',
  real_name: '',
  id_card_no: ''
})

const validateConfirm = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次密码输入不一致'))
  } else {
    callback()
  }
}

const rules = {
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  real_name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }]
}

async function handleRegister() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    loading.value = true
    const { confirmPassword, ...data } = form
    await userStore.register(data)
    ElMessage.success('注册成功，请等待认证审核')
    router.push('/login')
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 0;
}
.register-card {
  width: 500px;
  padding: 20px;
}
.register-header {
  text-align: center;
  margin-bottom: 20px;
}
.register-header h1 {
  margin: 0 0 10px 0;
  color: #409eff;
  font-size: 24px;
}
.register-header p {
  color: #909399;
  margin: 0;
}
.register-footer {
  text-align: center;
  color: #909399;
}
.register-footer a {
  color: #409eff;
  text-decoration: none;
  margin-left: 5px;
}
</style>
