<template>
  <div class="login">
    <el-card class="login-card">
      <h2>{{ loginType === 'member' ? '会员登录' : '员工登录' }}</h2>
      <el-tabs v-model="loginType" @tab-change="changeType">
        <el-tab-pane label="会员登录" name="member"></el-tab-pane>
        <el-tab-pane label="员工登录" name="staff"></el-tab-pane>
      </el-tabs>
      <el-form :model="form" label-width="80px" @submit.prevent="submit">
        <el-form-item v-if="loginType === 'member'" label="手机号">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item v-else label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" style="width:100%">登录</el-button>
        </el-form-item>
      </el-form>
      <p v-if="loginType === 'member'">
        没有账号？<el-button type="primary" link @click="$router.push('/register')">立即注册</el-button>
      </p>
      <p class="demo">
        测试账号：<br>
        会员：13800000001 / 123456<br>
        员工：station1_cash1 / cashier123<br>
        站长：station1_mgr / manager123<br>
        总部：admin / admin123
      </p>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { auth } from '../api'
import { useUserStore } from '../utils/userStore'

const route = useRoute()
const router = useRouter()
const { updateUser } = useUserStore()
const loginType = ref(route.query.type || 'member')
const form = ref({ phone: '', username: '', password: '' })

const changeType = () => {
  form.value = { phone: '', username: '', password: '' }
}

const submit = async () => {
  try {
    let res
    const account = form.value.phone || form.value.username
    const isPhone = /^1[3-9]\d{9}$/.test(account)
    
    if (loginType.value === 'member') {
      if (!form.value.phone || !form.value.password) {
        ElMessage.warning('请输入手机号和密码')
        return
      }
      try {
        res = await auth.memberLogin({ phone: form.value.phone, password: form.value.password })
      } catch (e) {
        if (!isPhone && e.error === '手机号或密码错误') {
          loginType.value = 'staff'
          form.value.username = form.value.phone
          form.value.phone = ''
          ElMessage.info('检测到员工账号，已自动切换到员工登录')
          return
        }
        throw e
      }
      localStorage.setItem('token', res.token)
      localStorage.setItem('userType', 'member')
      updateUser(res.member)
      router.push('/member/dashboard')
    } else {
      if (!form.value.username || !form.value.password) {
        ElMessage.warning('请输入用户名和密码')
        return
      }
      res = await auth.staffLogin({ username: form.value.username, password: form.value.password })
      localStorage.setItem('token', res.token)
      localStorage.setItem('userType', 'staff')
      updateUser(res.user)
      if (res.user.role === 'cashier') router.push('/cashier/fuel')
      else if (res.user.role === 'manager') router.push('/manager/dashboard')
      else router.push('/hq/dashboard')
    }
    ElMessage.success('登录成功')
  } catch (e) {
    ElMessage.error(e.error || e.message || '登录失败')
  }
}
</script>

<style scoped>
.login { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.login-card { width: 420px; }
.login-card h2 { text-align: center; margin-bottom: 20px; }
.demo { margin-top: 20px; padding: 10px; background: #f5f7fa; border-radius: 4px; font-size: 12px; color: #666; line-height: 1.8; }
</style>
