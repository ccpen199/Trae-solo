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
          <el-form :model="personalForm" label-width="0">
            <el-form-item>
              <el-input v-model="personalForm.name" placeholder="姓名" size="large" prefix-icon="User" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="personalForm.id_card" placeholder="身份证号" size="large" prefix-icon="Postcard" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="personalForm.phone" placeholder="手机号" size="large" prefix-icon="Phone" />
            </el-form-item>
            <el-button type="primary" size="large" style="width:100%" :loading="loading" @click="loginPersonal">
              <el-icon><Key /></el-icon> 赣服通认证登录
            </el-button>
            <p style="text-align:center; color:#6b7280; font-size:12px; margin-top:12px;">
              演示模式：无需真实赣服通授权，直接模拟登录
            </p>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="企业用户" name="enterprise">
          <el-form :model="entForm" label-width="0">
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
            <el-button type="primary" size="large" style="width:100%" :loading="loading" @click="loginEnterprise">
              <el-icon><Key /></el-icon> 企业认证登录
            </el-button>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="管理员" name="admin">
          <el-form :model="adminForm" label-width="0">
            <el-form-item>
              <el-input v-model="adminForm.username" placeholder="管理员账号" size="large" prefix-icon="UserFilled" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="adminForm.password" type="password" placeholder="密码" size="large" prefix-icon="Lock" show-password />
            </el-form-item>
            <el-button type="primary" size="large" style="width:100%" :loading="loading" @click="loginAdmin">
              <el-icon><Key /></el-icon> 后台管理登录
            </el-button>
            <p style="text-align:center; color:#6b7280; font-size:12px; margin-top:12px;">
              默认账号 admin / admin123
            </p>
          </el-form>
        </el-tab-pane>
      </el-tabs>
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
const active = ref('admin')
const loading = ref(false)
const personalForm = ref({ gft_user_id: 'demo_gft_001', name: '张三', id_card: '360102199001011234', phone: '13800138000' })
const entForm = ref({ gft_user_id: 'demo_gft_ent_001', enterprise_name: '江西省示范科技有限公司', unified_credit_code: '91360000MA12345678', legal_person: '李总', contact_phone: '13900139000' })
const adminForm = ref({ username: 'admin', password: 'admin123' })

async function loginPersonal() {
  if (!personalForm.value.name) return ElMessage.warning('请输入姓名')
  loading.value = true
  try {
    await auth.loginGanfutong(personalForm.value)
    ElMessage.success('登录成功')
    router.push('/personal')
  } catch (e) { ElMessage.error(e.response?.data?.message || '登录失败') }
  finally { loading.value = false }
}

async function loginEnterprise() {
  if (!entForm.value.enterprise_name || !entForm.value.unified_credit_code) return ElMessage.warning('请填写完整信息')
  loading.value = true
  try {
    await auth.loginEnterprise(entForm.value)
    ElMessage.success('登录成功')
    router.push('/enterprise')
  } catch (e) { ElMessage.error(e.response?.data?.message || '登录失败') }
  finally { loading.value = false }
}

async function loginAdmin() {
  if (!adminForm.value.username || !adminForm.value.password) return ElMessage.warning('请输入账号密码')
  loading.value = true
  try {
    await auth.loginAdmin(adminForm.value)
    ElMessage.success('登录成功')
    router.push('/admin')
  } catch (e) { ElMessage.error(e.response?.data?.message || '登录失败') }
  finally { loading.value = false }
}
</script>

<style scoped>
.login-tabs :deep(.el-tabs__header) { margin-bottom: 24px; }
.login-tabs :deep(.el-tabs__nav) { width: 100%; }
.login-tabs :deep(.el-tabs__item) { flex: 1; text-align: center; }
</style>
