<template>
  <div class="page-container">
    <van-nav-bar title="帖子详情" left-arrow @click-left="$router.back()" />

    <div class="page-content detail-content" v-loading="loading">
      <div class="error-state" v-if="error">
        <p>加载失败</p>
        <van-button type="primary" size="small" class="retry-btn" @click="loadDetail">重试</van-button>
      </div>

      <div v-if="post" class="post-detail">
        <h1 class="post-title">{{ post.title }}</h1>
        <div class="post-meta">
          <van-avatar size="28" />
          <span class="username">{{ post.username }}</span>
          <span class="channel">{{ post.channel_name }}</span>
        </div>

        <div class="post-content">{{ post.content }}</div>

        <div class="post-images" v-if="post.images && post.images.length">
          <img :src="img" v-for="(img, idx) in post.images" :key="idx" />
        </div>

        <div class="post-actions">
          <van-button plain type="primary" size="small" @click="handleLike">
            <van-icon name="like-o" /> {{ post.like_count || 0 }}
          </van-button>
          <van-button plain type="primary" size="small">
            <van-icon name="comment-o" /> {{ post.comment_count || 0 }}
          </van-button>
          <van-button plain type="primary" size="small" @click="showReward = true">
            <van-icon name="gift-o" /> 打赏
          </van-button>
        </div>

        <div class="comments-section">
          <h3>评论 ({{ comments.length }})</h3>
          <div class="comment-item" v-for="c in comments" :key="c.id">
            <van-avatar size="28" />
            <div class="comment-content">
              <div class="comment-user">{{ c.username }}</div>
              <div class="comment-text">{{ c.content }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="comment-input">
      <van-field
        v-model="commentText"
        placeholder="写下你的评论..."
        :disabled="!userStore.isLoggedIn()"
      >
        <template #button>
          <van-button type="primary" size="small" @click="submitComment" :loading="commentLoading">
            发送
          </van-button>
        </template>
      </van-field>
    </div>

    <van-popup v-model:show="showReward" position="bottom" round>
      <div class="reward-popup">
        <h3>打赏作者</h3>
        <div class="reward-amounts">
          <van-button
            v-for="amount in [1, 5, 10, 20]"
            :key="amount"
            type="default"
            :class="{ active: rewardAmount === amount }"
            @click="rewardAmount = amount"
          >
            {{ amount }} 币
          </van-button>
        </div>
        <div class="reward-actions">
          <van-button @click="showReward = false">取消</van-button>
          <van-button type="primary" @click="submitReward">确认打赏</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { communityApi } from '@/api'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const error = ref(false)
const commentLoading = ref(false)
const post = ref(null)
const comments = ref([])
const commentText = ref('')
const showReward = ref(false)
const rewardAmount = ref(1)

const loadDetail = async () => {
  loading.value = true
  error.value = false
  try {
    const res = await communityApi.getPost(route.params.id)
    post.value = res.data
    loadComments()
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

const loadComments = async () => {
  try {
    const res = await communityApi.getComments(route.params.id)
    comments.value = res.data || []
  } catch (e) {}
}

const handleLike = async () => {
  if (!userStore.isLoggedIn()) {
    router.push('/login')
    return
  }

  try {
    await communityApi.likePost(route.params.id)
    post.value.like_count = (post.value.like_count || 0) + 1
    showToast('点赞成功')
  } catch (e) {}
}

const submitComment = async () => {
  if (!userStore.isLoggedIn()) {
    router.push('/login')
    return
  }

  if (!commentText.value.trim()) {
    showToast('请输入评论内容')
    return
  }

  commentLoading.value = true
  try {
    await communityApi.createComment(route.params.id, commentText.value)
    commentText.value = ''
    showToast('评论成功')
    loadComments()
  } catch (e) {
  } finally {
    commentLoading.value = false
  }
}

const submitReward = async () => {
  if (!userStore.isLoggedIn()) {
    router.push('/login')
    return
  }

  try {
    await communityApi.rewardPost(route.params.id, rewardAmount.value, '')
    showReward.value = false
    showToast('打赏成功')
    post.value.reward_count = (post.value.reward_count || 0) + 1
  } catch (e) {}
}

onMounted(() => {
  loadDetail()
})
</script>

<style lang="less" scoped>
.detail-content {
  padding-bottom: 80px;
}

.post-detail {
  padding: 16px;
}

.post-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;

  .username {
    font-size: 14px;
    color: #333;
  }

  .channel {
    font-size: 12px;
    color: #8b5a2b;
    background: rgba(139, 90, 43, 0.1);
    padding: 2px 8px;
    border-radius: 10px;
  }
}

.post-content {
  font-size: 15px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 20px;
}

.post-images {
  margin-bottom: 20px;

  img {
    width: 100%;
    border-radius: 8px;
    margin-bottom: 10px;
  }
}

.post-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.comments-section {
  h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #333;
  }
}

.comment-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;

  .comment-content {
    flex: 1;

    .comment-user {
      font-size: 13px;
      color: #666;
      margin-bottom: 4px;
    }

    .comment-text {
      font-size: 14px;
      color: #333;
      line-height: 1.6;
    }
  }
}

.comment-input {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 12px 16px;
  border-top: 1px solid #eee;
}

.reward-popup {
  padding: 20px;

  h3 {
    text-align: center;
    margin-bottom: 20px;
    font-size: 16px;
  }

  .reward-amounts {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 20px;

    .van-button {
      &.active {
        background: #8b5a2b;
        color: #fff;
        border-color: #8b5a2b;
      }
    }
  }

  .reward-actions {
    display: flex;
    gap: 12px;
  }
}
</style>
