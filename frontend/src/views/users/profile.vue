<template>
  <div class="user-profile-page">
    <van-nav-bar title="用户主页" left-arrow @click-left="$router.back()" />
    
    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" size="32px">加载中...</van-loading>
    </div>
    
    <div v-else class="profile-content">
      <div class="user-header card">
        <img :src="user.avatar" class="user-avatar" />
        <h2 class="user-nickname">{{ user.nickname }}</h2>
        <p class="user-bio text-gray">{{ user.bio || '这个人很懒，什么都没写' }}</p>
        
        <div class="user-stats flex-center mt-16">
          <div class="stat-item">
            <div class="stat-value">{{ user.stats?.post_count || 0 }}</div>
            <div class="stat-label">动态</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ user.stats?.follower_count || 0 }}</div>
            <div class="stat-label">粉丝</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ user.stats?.following_count || 0 }}</div>
            <div class="stat-label">关注</div>
          </div>
        </div>
        
        <div class="user-actions flex-center mt-16">
          <van-button 
            size="small" 
            :type="user.is_followed ? 'default' : 'primary'"
            @click="handleFollow"
          >
            {{ user.is_followed ? '已关注' : '+ 关注' }}
          </van-button>
          <van-button size="small" class="ml-12" @click="goChat">发消息</van-button>
        </div>
      </div>
      
      <div v-if="user.pets?.length" class="pets-section card">
        <div class="section-title">宠物 ({{ user.pets.length }})</div>
        <div class="pets-list">
          <div v-for="pet in user.pets" :key="pet.id" class="pet-item flex">
            <img :src="pet.avatar" class="pet-avatar" />
            <div class="pet-info ml-12">
              <div class="pet-name">{{ pet.name }}</div>
              <div class="pet-type text-gray">{{ pet.type }} · {{ pet.breed }}</div>
            </div>
            <van-button 
              v-if="pet.for_adoption" 
              size="mini" 
              type="warning"
              @click="handleAdopt(pet)"
            >
              可领养
            </van-button>
          </div>
        </div>
      </div>
      
      <div class="posts-section">
        <div class="section-title card">TA的动态</div>
        <PostCard
          v-for="post in userPosts"
          :key="post.id"
          :post="post"
          @click="goPostDetail(post.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'
import PostCard from '@/components/PostCard.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const userId = route.params.id
const user = ref({})
const userPosts = ref([])
const loading = ref(true)

const fetchUser = async () => {
  try {
    const res = await request.get(`/users/${userId}`)
    user.value = res.data
  } catch (err) {
    console.error('获取用户信息失败:', err)
  }
}

const fetchPosts = async () => {
  try {
    const res = await request.get(`/users/${userId}/posts`)
    userPosts.value = res.data?.list || []
  } catch (err) {
    console.error('获取用户动态失败:', err)
  }
}

const handleFollow = async () => {
  if (!userStore.token) {
    showToast('请先登录')
    router.push('/login')
    return
  }
  
  try {
    await request.post(`/users/${userId}/follow`)
    user.value.is_followed = !user.value.is_followed
    showToast(user.value.is_followed ? '关注成功' : '已取消关注')
  } catch (error) {
    console.error('关注失败:', error)
  }
}

const goChat = () => {
  if (!userStore.token) {
    showToast('请先登录')
    router.push('/login')
    return
  }
  router.push(`/messages/${userId}`)
}

const goPostDetail = (id) => {
  router.push(`/posts/${id}`)
}

const handleAdopt = (pet) => {
  showToast('领养申请已提交')
}

onMounted(async () => {
  await Promise.all([fetchUser(), fetchPosts()])
  loading.value = false
})
</script>

<style scoped>
.user-profile-page {
  padding-bottom: 20px;
}

.loading-container {
  padding: 60px 20px;
  text-align: center;
}

.user-header {
  margin: 8px;
  text-align: center;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto 12px;
}

.user-nickname {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
}

.user-bio {
  font-size: 13px;
}

.user-stats {
  padding: 16px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.pets-section {
  margin: 8px;
}

.section-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 12px;
}

.pet-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
}

.pet-item:last-child {
  border-bottom: none;
}

.pet-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

.pet-name {
  font-size: 14px;
  font-weight: 500;
}

.pet-type {
  font-size: 12px;
  margin-top: 4px;
}

.posts-section {
  margin-top: 8px;
}

.posts-section .section-title {
  margin: 0 8px 8px;
  padding: 12px;
}

.text-gray {
  color: #999;
}

.mt-16 {
  margin-top: 16px;
}

.ml-12 {
  margin-left: 12px;
}
</style>
