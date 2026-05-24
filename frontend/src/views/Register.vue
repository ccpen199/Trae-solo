<template>
  <div class="login">
    <el-card class="login-card">
      <h2>会员注册</h2>
      <el-form :model="form" label-width="80px" @submit.prevent="submit">
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.name" placeholder="请输入姓名（选填）" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="form.confirmPassword" type="password" placeholder="请确认密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" style="width:100%">注册</el-button>
        </el-form-item>
      </el-form>
      <p>已有账号？<el-button type="primary" link @click="$router.push('/login?type=member')">立即登录</el-button></p>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { auth } from '../api'
import { useUserStore } from '../utils/userStore'

const router = useRouter()
const { updateUser } = useUserStore()
const form = ref({ phone: '', name: '', password: '', confirmPassword: '' })

const submit = async () => {
  if (!form.value.phone) return ElMessage.warning('请输入手机号')
  if (!/^1[3-9]\d{9}$/.test(form.value.phone)) return ElMessage.warning('手机号格式不正确')
  if (!form.value.password) return ElMessage.warning('请输入密码')
  if (form.value.password !== form.value.confirmPassword) return ElMessage.warning('两次密码不一致')
  try {
    const res = await auth.memberRegister(form.value)
    localStorage.setItem('token', res.token)
    localStorage.setItem('userType', 'member')
    updateUser(res.member)
    ElMessage.success('注册成功，已自动登录')
    router.push('/member/dashboard')
  } catch (e) {
    ElMessage.error(e.error || e.message || '注册失败')
  }
}
</script>

<style scoped>
.login { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.login-card { width: 420px; }
.login-card h2 { text-align: center; margin-bottom: 20px; }
</style>
