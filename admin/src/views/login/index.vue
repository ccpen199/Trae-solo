<template>
  <div class="login-container">
    <div class="login-bg">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>
    </div>

    <div class="login-wrapper">
      <div class="login-left">
        <div class="brand">
          <div class="brand-logo">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <defs>
                <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#fff"/>
                  <stop offset="100%" style="stop-color:#BFD4F5"/>
                </linearGradient>
              </defs>
              <rect rx="14" width="60" height="60" fill="url(#lg)" opacity="0.15"/>
              <path d="M30 10L10 20v20l20 10 20-10V20z" fill="url(#lg)"/>
              <path d="M30 18l-14 7v10l14 7 14-7V25z" fill="#fff" opacity="0.85"/>
            </svg>
          </div>
          <div class="brand-text">
            <h1>郑州市掌上办事中枢</h1>
            <p>政务服务一体化运营管理平台</p>
          </div>
        </div>

        <div class="stats-showcase">
          <div class="showcase-item">
            <div class="showcase-num">20+</div>
            <div class="showcase-label">接入委办局</div>
          </div>
          <div class="showcase-item">
            <div class="showcase-num">892万+</div>
            <div class="showcase-label">服务市民</div>
          </div>
          <div class="showcase-item">
            <div class="showcase-num">1.5亿+</div>
            <div class="showcase-label">办件总量</div>
          </div>
          <div class="showcase-item">
            <div class="showcase-num">94.6%</div>
            <div class="showcase-label">满意度</div>
          </div>
        </div>

        <div class="feature-list">
          <div class="feature-item"><el-icon color="#FFD700"><Star /></el-icon> 千人千面个性化推荐</div>
          <div class="feature-item"><el-icon color="#7DD3FC"><Link /></el-icon> 20+委办局API编排</div>
          <div class="feature-item"><el-icon color="#86EFAC"><Share /></el-icon> 政务知识图谱问答</div>
          <div class="feature-item"><el-icon color="#FDA4AF"><Warning /></el-icon> 差评自动督办闭环</div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <h2>欢迎登录</h2>
          <p class="login-sub">管理员专用登录入口，请使用您的账号</p>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            size="large"
            class="login-form"
            @keyup.enter="handleLogin"
          >
            <el-form-item prop="username">
              <el-input
                v-model="form.username"
                placeholder="请输入用户名"
                :prefix-icon="User"
                clearable
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                :prefix-icon="Lock"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <el-form-item prop="verifyCode">
              <div style="display: flex; gap: 12px; width: 100%;">
                <el-input
                  v-model="form.verifyCode"
                  placeholder="验证码"
                  :prefix-icon="Key"
                  maxlength="4"
                  clearable
                />
                <div class="captcha" @click="refreshCaptcha">
                  {{ captcha }}
                </div>
              </div>
            </el-form-item>

            <el-form-item>
              <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                <el-checkbox v-model="form.remember">记住登录状态</el-checkbox>
                <el-link type="primary" :underline="false" @click="forgotPwd">忘记密码？</el-link>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                class="login-btn"
                :loading="loading"
                @click="handleLogin"
              >
                登 录
              </el-button>
            </el-form-item>
          </el-form>

          <el-divider content-position="center" style="margin: 8px 0;">快速提示</el-divider>

          <el-alert
            title="演示账号：admin / 任意密码（验证码：{{ captcha }}）"
            type="info"
            :closable="false"
            show-icon
            style="font-size: 12px;"
          />

          <div class="security-tip">
            <el-icon color="#F39C12"><InfoFilled /></el-icon>
            本系统仅限授权人员使用，所有操作均被记录并审计
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Key, Star, Link, Share, Warning, InfoFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const captcha = ref('')

const form = reactive({
  username: 'admin',
  password: '123456',
  verifyCode: '',
  remember: true
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  verifyCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    {
      validator: (_r, v, cb) => {
        v && v.toUpperCase() !== captcha.value ? cb(new Error('验证码错误')) : cb()
      },
      trigger: 'blur'
    }
  ]
}

function refreshCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  captcha.value = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

onMounted(() => refreshCaptcha())

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.login(form.username, form.password)
    ElMessage.success('登录成功，欢迎回来')
    const redirect = (route.query.redirect as string) || '/dashboard'
    setTimeout(() => router.push(redirect), 300)
  } catch (err: any) {
    ElMessage.error(err.message || '登录失败')
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

function forgotPwd() {
  ElMessage.warning('请联系系统管理员重置密码')
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.login-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0D3A7C 0%, #1E4FA5 50%, #3B7DD8 100%);
}

.login-bg {
  position: absolute; inset: 0; pointer-events: none;
  .bg-shape {
    position: absolute;
    border-radius: 50%;
    opacity: 0.15;
    background: radial-gradient(circle, #fff 0%, transparent 70%);
  }
  .shape-1 { width: 500px; height: 500px; top: -200px; right: -100px; }
  .shape-2 { width: 400px; height: 400px; bottom: -150px; left: -100px; }
  .shape-3 { width: 200px; height: 200px; top: 40%; left: 40%; opacity: 0.1; }
}

.login-wrapper {
  position: relative; z-index: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 60px;
  max-width: 1400px;
  margin: 0 auto;
}

.login-left {
  color: #fff; flex: 1; max-width: 560px;
  .brand {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 60px;

    .brand-logo {
      width: 80px; height: 80px;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255,255,255,0.2);
    }

    .brand-text h1 {
      font-size: 32px;
      font-weight: 700;
      margin: 0 0 8px;
      letter-spacing: 2px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    .brand-text p {
      font-size: 15px;
      margin: 0;
      opacity: 0.85;
      letter-spacing: 1px;
    }
  }

  .stats-showcase {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 40px;

    .showcase-item {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 20px;

      .showcase-num {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 4px;
      }
      .showcase-label {
        font-size: 13px;
        opacity: 0.75;
      }
    }
  }

  .feature-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;

    .feature-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      opacity: 0.9;
      padding: 10px 14px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
    }
  }
}

.login-right {
  width: 440px;
  flex-shrink: 0;
}

.login-card {
  background: #fff;
  border-radius: 20px;
  padding: 40px 36px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);

  h2 {
    font-size: 26px;
    font-weight: 700;
    color: $text-primary;
    margin: 0 0 6px;
  }
  .login-sub {
    font-size: 13px;
    color: $text-secondary;
    margin: 0 0 32px;
  }

  .captcha {
    min-width: 110px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 22px;
    letter-spacing: 6px;
    background: linear-gradient(135deg, #f0f6ff 0%, #e6f4ff 100%);
    border: 1px solid $border-light;
    border-radius: 6px;
    cursor: pointer;
    color: $primary-color;
    font-style: italic;
    user-select: none;

    &:hover { background: linear-gradient(135deg, #e6f4ff 0%, #d0e8ff 100%); }
  }

  .login-btn {
    width: 100%;
    height: 46px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 10px;
    background: linear-gradient(135deg, #1E4FA5 0%, #3B7DD8 100%);
    border: none;
    letter-spacing: 4px;

    &:hover {
      background: linear-gradient(135deg, #0D3A7C 0%, #1E4FA5 100%);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(30,79,165,0.35);
    }
  }

  .security-tip {
    margin-top: 24px;
    padding: 10px 12px;
    background: #FFFAF0;
    border: 1px solid #FAECD8;
    border-radius: 8px;
    font-size: 12px;
    color: #B8823B;
    display: flex;
    align-items: center;
    gap: 6px;
  }
}
</style>
