<template>
  <div class="post-card card" @click="$emit('click')">
    <div class="post-header flex">
      <img :src="post.avatar || 'https://picsum.photos/100/100'" class="avatar" @click.stop="goUser" />
      <div class="post-user flex-1 ml-8">
        <div class="nickname">{{ post.nickname }}</div>
        <div class="text-gray">{{ post.location || '未知地点' }}</div>
      </div>
    </div>
    
    <div class="post-content mt-8">
      <p class="ellipsis-2">{{ post.content }}</p>
    </div>
    
    <div v-if="post.media_url" class="post-media mt-8">
      <img :src="post.media_url" class="post-image" />
    </div>
    
    <div class="post-actions flex-between mt-8">
      <div class="action-item flex-center" @click.stop="handleLike">
        <van-icon :name="post.is_liked ? 'good-job' : 'good-job-o'" :color="post.is_liked ? '#ee0a24' : '#969799'" />
        <span class="ml-4">{{ post.like_count || 0 }}</span>
      </div>
      <div class="action-item flex-center">
        <van-icon name="comment-o" />
        <span class="ml-4">{{ post.comment_count || 0 }}</span>
      </div>
      <div class="action-item flex-center">
        <van-icon name="share-o" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click'])

const router = useRouter()
const userStore = useUserStore()

const goUser = () => {
  router.push(`/users/${props.post.user_id}`)
}

const handleLike = async () => {
  if (!userStore.token) {
    showToast('请先登录')
    router.push('/login')
    return
  }
  
  try {
    await request.post(`/posts/${props.post.id}/like`)
    props.post.is_liked = !props.post.is_liked
    props.post.like_count += props.post.is_liked ? 1 : -1
  } catch (error) {
    console.error('点赞失败:', error)
  }
}
</script>

<style scoped>
.post-card {
  margin: 8px;
  cursor: pointer;
}

.nickname {
  font-size: 14px;
  font-weight: 500;
}

.post-content p {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.post-image {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  border-radius: 8px;
}

.action-item {
  font-size: 14px;
  color: #666;
  padding: 4px 8px;
}

.action-item span {
  font-size: 12px;
}

.ml-4 {
  margin-left: 4px;
}
</style>
