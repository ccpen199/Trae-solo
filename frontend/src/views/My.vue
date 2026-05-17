<template>
  <div class="my-page">
    <div class="user-header">
      <van-image :src="user?.avatar || 'https://picsum.photos/100/100'" round class="avatar" />
      <div class="user-info">
        <h2 class="username">{{ user?.nickname || user?.username || '未登录' }}</h2>
        <p class="bio">{{ user?.bio || '这个人很懒，什么都没留下' }}</p>
      </div>
      <van-button v-if="!isLoggedIn" type="primary" size="small" @click="goLogin">登录</van-button>
      <van-button v-else type="default" size="small" @click="editProfile">编辑</van-button>
    </div>

    <van-cell-group inset>
      <van-cell title="我的宠物" is-link @click="goPets" />
      <van-cell title="我的活动" is-link @click="goActivities" />
      <van-cell title="我的收藏" is-link />
      <van-cell title="我的关注" is-link />
      <van-cell title="我的粉丝" is-link />
    </van-cell-group>

    <van-cell-group inset style="margin-top: 10px">
      <van-cell title="设置" is-link />
      <van-cell title="意见反馈" is-link />
      <van-cell title="关于我们" is-link />
    </van-cell-group>

    <van-button v-if="isLoggedIn" type="danger" plain block style="margin: 20px" @click="logout">
      退出登录
    </van-button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const user = computed(() => userStore.user)
const isLoggedIn = computed(() => userStore.isLoggedIn)

const goLogin = () => {
  router.push('/login')
}

const editProfile = () => {
  showToast('编辑资料')
}

const goPets = () => {
  router.push('/pets')
}

const goActivities = () => {
  router.push('/activities')
}

const logout = () => {
  showConfirmDialog({
    title: '提示',
    message: '确定要退出登录吗？'
  }).then(() => {
    userStore.logout()
    showToast('已退出')
    router.push('/login')
  }).catch(() => {})
}

onMounted(async () => {
  if (userStore.isLoggedIn && !userStore.user) {
    try {
      await userStore.fetchUserProfile()
    } catch {}
  }
})
</script>

<style scoped>
.my-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 50px;
}

.user-header {
  display: flex;
  align-items: center;
  padding: 30px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.avatar {
  width: 70px;
  height: 70px;
  margin-right: 15px;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.user-info {
  flex: 1;
}

.username {
  font-size: 20px;
  margin-bottom: 5px;
}

.bio {
  font-size: 13px;
  opacity: 0.9;
}
</style>
