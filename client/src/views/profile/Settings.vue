<template>
  <div class="settings-page">
    <el-card>
      <template #header>
        <span>设置</span>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-form :model="basicForm" label-width="100px" style="max-width: 500px;">
            <el-form-item label="用户名">
              <el-input v-model="basicForm.username" />
            </el-form-item>
            <el-form-item label="昵称">
              <el-input v-model="basicForm.nickname" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="basicForm.email" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="basicForm.phone" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveBasic">保存修改</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="安全设置" name="security">
          <el-form :model="securityForm" label-width="120px" style="max-width: 500px;">
            <el-form-item label="当前密码">
              <el-input v-model="securityForm.currentPassword" show-password />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input v-model="securityForm.newPassword" show-password />
            </el-form-item>
            <el-form-item label="确认新密码">
              <el-input v-model="securityForm.confirmPassword" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="changePassword">修改密码</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="通知设置" name="notification">
          <el-form style="max-width: 500px;">
            <el-form-item label="邮件通知">
              <el-switch v-model="notificationForm.emailNotifications" />
            </el-form-item>
            <el-form-item label="短信通知">
              <el-switch v-model="notificationForm.smsNotifications" />
            </el-form-item>
            <el-form-item label="问题有新回答">
              <el-switch v-model="notificationForm.answerNotification" />
            </el-form-item>
            <el-form-item label="回答被采纳">
              <el-switch v-model="notificationForm.acceptNotification" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveNotification">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const activeTab = ref('basic')

const basicForm = ref({
  username: 'testuser',
  nickname: '测试用户',
  email: 'test@example.com',
  phone: '138****8888'
})

const securityForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const notificationForm = ref({
  emailNotifications: true,
  smsNotifications: false,
  answerNotification: true,
  acceptNotification: true
})

const saveBasic = () => {
  ElMessage.success('保存成功')
}

const changePassword = () => {
  if (!securityForm.value.currentPassword || 
      !securityForm.value.newPassword || 
      !securityForm.value.confirmPassword) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (securityForm.value.newPassword !== securityForm.value.confirmPassword) {
    ElMessage.warning('两次密码不一致')
    return
  }
  ElMessage.success('密码修改成功')
}

const saveNotification = () => {
  ElMessage.success('保存成功')
}
</script>

<style lang="scss" scoped>
.settings-page {
  max-width: 800px;
  margin: 0 auto;
}
</style>
