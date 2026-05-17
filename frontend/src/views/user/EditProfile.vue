<template>
  <div class="page-container">
    <van-nav-bar title="编辑资料" left-arrow @click-left="$router.back()" />

    <div class="page-content edit-content" v-loading="loading">
      <van-cell-group inset>
        <van-field
          v-model="formData.username"
          label="用户名"
          placeholder="请输入用户名"
          maxlength="20"
        />
        <van-field
          v-model="formData.bio"
          type="textarea"
          label="个人简介"
          placeholder="介绍一下自己吧"
          rows="4"
          maxlength="200"
          autosize
        />
      </van-cell-group>

      <div style="padding: 16px;">
        <van-button type="primary" block @click="handleSave" :loading="saving">
          保存
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { userApi } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const saving = ref(false)
const formData = ref({
  username: '',
  bio: ''
})

const loadProfile = async () => {
  loading.value = true
  try {
    const res = await userApi.getProfile()
    formData.value.username = res.data.username || ''
    formData.value.bio = res.data.bio || ''
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!formData.value.username.trim()) {
    showToast('请输入用户名')
    return
  }

  saving.value = true
  try {
    await userApi.updateProfile(formData.value)
    showToast('保存成功')
    router.back()
  } catch (e) {
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style lang="less" scoped>
.edit-content {
  padding-top: 12px;
}
</style>
