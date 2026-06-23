<template>
  <div class="login-wrapper">
    <div class="login-box">
      <div style="text-align:center; margin-bottom:24px;">
        <div style="font-size:48px;">🏛️</div>
      </div>
      <h2 class="login-title">江西省人社移动政务中台</h2>
      <p class="login-sub">赣服通统一身份认证 · 社保 · 就业 · 人才 · 劳动监察</p>
      <el-tabs v-model="active" class="login-tabs">
        <el-tab-pane label="个人用户" name="personal">
          <el-form :model="personalForm" label-width="0" @submit.prevent="loginPersonal">
            <el-form-item>
              <el-input v-model="personalForm.name" placeholder="姓名" size="large" prefix-icon="User" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="personalForm.id_card" placeholder="身份证号" size="large" prefix-icon="Postcard" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="personalForm.phone" placeholder="手机号" size="large" prefix-icon="Phone" />
            </el-form-item>
            <el-button type="primary" size="large" style="width:100%" :loading="personalLoading" @click="loginPersonal">
              <el-icon><Key /></el-icon> 赣服通认证登录
            </el-button>
            <p class="hint">演示模式：无需真实赣服通授权，直接模拟登录</p>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="企业用户" name="enterprise">
          <el-form :model="entForm" label-width="0" @submit.prevent="loginEnterprise">
            <el-form-item>
              <el-input v-model="entForm.enterprise_name" placeholder="企业名称" size="large" prefix-icon="OfficeBuilding" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="entForm.unified_credit_code" placeholder="统一社会信用代码" size="large" prefix-icon="Document" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="entForm.legal_person" placeholder="法人姓名" size="large" prefix-icon="User" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="entForm.contact_phone" placeholder="联系电话" size="large" prefix-icon="Phone" />
            </el-form-item>
            <el-button type="primary" size="large" style="width:100%" :loading="enterpriseLoading" @click="loginEnterprise">
              <el-icon><Key /></el-icon> 企业认证登录
            </el-button>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="管理员" name="admin">
          <el-form :model="adminForm" label-width="0" @submit.prevent="loginAdmin">
            <el-form-item>
              <el-input v-model="adminForm.username" placeholder="管理员账号" size="large" prefix-icon="UserFilled" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="adminForm.password" type="password" placeholder="密码" size="large" prefix-icon="Lock" show-password />
            </el-form-item>
            <el-button type="primary" size="large" style="width:100%" :loading="adminLoading" @click="loginAdmin">
              <el-icon><Key /></el-icon> 后台管理登录
            </el-button>
            <p class="hint">默认账号 admin / admin123</p>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <el-alert
        v-if="loginError"
        :title="loginError"
        type="error"
        show-icon
        :closable="true"
        @close="loginError = ''"
        style="margin-top:12px;"
      />
      <el-alert
        v-if="loginSuccess"
        :title="loginSuccess"
        type="success"
        show-icon
        :closable="false"
        style="margin-top:12px;"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const auth = useAuthStore()
const active = ref('personal')
const personalLoading = ref(false)
const enterpriseLoading = ref(false)
const adminLoading = ref(false)
const loginError = ref('')
const loginSuccess = ref('')

const personalForm = ref({ gft_user_id: 'demo_gft_001', name: '张三', id_card: '360102199001011234', phone: '13800138000' })
const entForm = ref({ gft_user_id: 'demo_gft_ent_001', enterprise_name: '江西省示范科技有限公司', unified_credit_code: '91360000MA12345678', legal_person: '李总', contact_phone: '13900139000' })
const adminForm = ref({ username: 'admin', password: 'admin123' })

async function loginPersonal() {
  if (!personalForm.value.name) {
    loginError.value = '赣服通认证失败：请输入姓名'
    return
  }
  loginError.value = ''
  loginSuccess.value = ''
  personalLoading.value = true
  try {
    const res = await auth.loginGanfutong(personalForm.value)
    loginSuccess.value = `赣服通认证通过 · 角色：个人用户 · 姓名：${auth.user?.name || ''} · 正在跳转...`
    ElMessage.success('赣服通认证成功，即将进入个人服务大厅')
    setTimeout(() => router.push('/personal'), 600)
  } catch (e) {
    const msg = e.response?.data?.message || '连接赣服通认证网关失败'
    loginError.value = `认证失败：${msg}（错误码：${e.response?.status || 'NETWORK'}）`
  } finally {
    personalLoading.value = false
  }
}

async function loginEnterprise() {
  if (!entForm.value.enterprise_name || !entForm.value.unified_credit_code) {
    loginError.value = '企业认证失败：请填写企业名称和统一社会信用代码'
    return
  }
  loginError.value = ''
  loginSuccess.value = ''
  enterpriseLoading.value = true
  try {
    const res = await auth.loginEnterprise(entForm.value)
    loginSuccess.value = `企业认证通过 · 企业：${auth.enterprise?.enterprise_name || ''} · 正在跳转...`
    ElMessage.success('企业认证成功，即将进入企业管理平台')
    setTimeout(() => router.push('/enterprise'), 600)
  } catch (e) {
    const msg = e.response?.data?.message || '企业认证服务异常'
    loginError.value = `认证失败：${msg}（错误码：${e.response?.status || 'NETWORK'}）`
  } finally {
    enterpriseLoading.value = false
  }
}

async function loginAdmin() {
  if (!adminForm.value.username || !adminForm.value.password) {
    loginError.value = '登录失败：请输入管理员账号和密码'
    return
  }
  loginError.value = ''
  loginSuccess.value = ''
  adminLoading.value = true
  try {
    const res = await auth.loginAdmin(adminForm.value)
    const adminData = res?.data?.admin || auth.user || {}
    loginSuccess.value = `身份验证通过 · 角色：${adminData.role === 'super_admin' ? '超级管理员' : '管理员'} · 账号：${adminData.username || ''} · 正在跳转后台工作台...`
    ElMessage.success('管理员身份验证通过，正在进入后台工作台')
    setTimeout(() => router.push('/admin'), 600)
  } catch (e) {
    const status = e.response?.status
    let reason = '连接认证服务失败'
    if (status === 401) reason = '账号或密码错误，请检查后重试'
    else if (status === 403) reason = '该账号无管理员权限'
    else if (status === 500) reason = '服务器内部错误，请稍后重试'
    else if (!status) reason = '网络连接失败，请检查网络'
    loginError.value = `登录失败：${reason}（错误码：${status || 'NETWORK'}）`
  } finally {
    adminLoading.value = false
  }
}
</script>

<style scoped>
.login-tabs :deep(.el-tabs__header) { margin-bottom: 24px; }
.login-tabs :deep(.el-tabs__nav) { width: 100%; }
.login-tabs :deep(.el-tabs__item) { flex: 1; text-align: center; }
.hint { text-align:center; color:#6b7280; font-size:12px; margin-top:12px; }
</style>
