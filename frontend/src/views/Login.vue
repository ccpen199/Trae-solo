<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-left">
        <div class="brand">
          <div class="brand-visual" aria-hidden="true">
            <div class="visual-skyline"></div>
            <div class="visual-building">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
        <div class="brand-info">
          <h1>四川省级政务服务统一工作台</h1>
          <p>SICHUAN PROVINCIAL GOVERNMENT SERVICE WORKSTATION</p>
          <div class="features">
            <div class="feature-item">
              <el-icon size="20"><Check /></el-icon>
              <span>省、市、县三级联动</span>
            </div>
            <div class="feature-item">
              <el-icon size="20"><Check /></el-icon>
              <span>一件事一次办</span>
            </div>
            <div class="feature-item">
              <el-icon size="20"><Check /></el-icon>
              <span>五维闭环服务</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="login-right">
        <div class="login-form">
          <h2>用户登录</h2>
          <p class="subtitle">请使用您的账号登录系统</p>
          
          <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
            <el-form-item prop="username">
              <el-input v-model="form.username" placeholder="请输入用户名" size="large" :prefix-icon="User" />
            </el-form-item>
            
            <el-form-item prop="password">
              <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" :prefix-icon="Lock" show-password @keyup.enter="handleLogin" />
            </el-form-item>
            
            <el-form-item>
              <div class="form-options">
                <el-checkbox v-model="form.remember">记住我</el-checkbox>
                <a href="#" class="forgot">忘记密码？</a>
              </div>
            </el-form-item>
            
            <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">
              登 录
            </el-button>
          </el-form>
          
          <div class="quick-login">
            <p>测试账号</p>
            <div class="test-accounts">
              <el-tag size="small" @click="fillForm('admin', '123456')">管理员</el-tag>
              <el-tag size="small" @click="fillForm('user01', '123456')">普通用户</el-tag>
              <el-tag size="small" @click="fillForm('agent01', '123456')">客服坐席</el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { User, Lock, Check } from '@element-plus/icons-vue'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  remember: false
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const fillForm = (username, password) => {
  form.username = username
  form.password = password
}

const handleLogin = async () => {
  if (!formRef.value) return
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    loading.value = true
    const success = await userStore.login({
      username: form.username,
      password: form.password
    })
    if (success) {
      const redirect = route.query.redirect || userStore.getDefaultRoute()
      router.push(redirect)
    }
  } catch (e) {
    if (e !== false && e?.message) {
      ElMessage.error(e.message)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 50%, #0d47a1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-container {
  width: 100%;
  max-width: 1000px;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-left {
  width: 55%;
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
  color: #fff;
  padding: 60px 50px;
  display: flex;
  flex-direction: column;
  
  .brand-visual {
    width: 100%;
    height: 200px;
    border-radius: 12px;
    margin-bottom: 30px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0)),
      linear-gradient(135deg, #7ec8ff 0%, #e3f2fd 48%, #1e88e5 100%);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
    overflow: hidden;
    position: relative;
  }

  .visual-skyline {
    position: absolute;
    left: 24px;
    right: 24px;
    bottom: 42px;
    height: 46px;
    background:
      linear-gradient(90deg, rgba(255, 255, 255, 0.78) 0 14%, transparent 14% 20%, rgba(255, 255, 255, 0.78) 20% 34%, transparent 34% 42%, rgba(255, 255, 255, 0.78) 42% 58%, transparent 58% 66%, rgba(255, 255, 255, 0.78) 66% 100%);
    opacity: 0.72;
  }

  .visual-building {
    position: absolute;
    left: 70px;
    right: 70px;
    bottom: 28px;
    height: 82px;
    border-radius: 8px 8px 0 0;
    background: rgba(255, 255, 255, 0.92);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 14px;
    padding: 18px 20px 0;

    span {
      width: 24px;
      height: 52px;
      border-radius: 3px 3px 0 0;
      background: #1e88e5;
      opacity: 0.78;
    }
  }
  
  .brand-info h1 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
    line-height: 1.3;
  }
  
  .brand-info p {
    font-size: 13px;
    opacity: 0.8;
    margin-bottom: 30px;
    letter-spacing: 1px;
  }
  
  .features .feature-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    font-size: 15px;
  }
}

.login-right {
  width: 45%;
  padding: 60px 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-form {
  h2 {
    font-size: 26px;
    font-weight: 700;
    margin-bottom: 8px;
    color: #303133;
  }
  
  .subtitle {
    font-size: 14px;
    color: #909399;
    margin-bottom: 30px;
  }
  
  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    
    .forgot {
      color: #1e88e5;
      font-size: 13px;
    }
  }
  
  .login-btn {
    width: 100%;
    height: 48px;
    font-size: 16px;
    margin-top: 8px;
  }
}

.quick-login {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  text-align: center;
  
  p {
    font-size: 13px;
    color: #909399;
    margin-bottom: 12px;
  }
  
  .test-accounts {
    display: flex;
    gap: 10px;
    justify-content: center;
    
    .el-tag {
      cursor: pointer;
      padding: 4px 12px;
    }
  }
}
</style>
