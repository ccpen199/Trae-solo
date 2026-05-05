<template>
  <div class="article-detail-page">
    <div class="header">
      <div class="back-btn" @click="goBack">
        <el-icon :size="20"><ArrowLeft /></el-icon>
      </div>
      <h3>文章详情</h3>
    </div>

    <div class="article-content" v-if="article">
      <h1 class="article-title">{{ article.title }}</h1>
      <div class="article-meta">
        <span class="author">用户{{ article.userId || 1 }}</span>
        <span class="date">{{ article.createdAt || '2024-01-15' }}</span>
        <span class="views">{{ article.viewCount || 12568 }}阅读</span>
      </div>
      <div class="article-body">
        <p>{{ article.content }}</p>
        <p style="margin-top: 16px;">汽车保养是每个车主都需要重视的事情。定期保养不仅能延长车辆使用寿命，还能提高行车安全性。本文将为大家介绍一些常见的汽车保养知识。</p>
        <h4 style="margin-top: 20px; font-size: 16px; color: #333;">一、机油更换</h4>
        <p style="margin-top: 10px;">机油是发动机的血液，定期更换机油是最基本的保养项目。一般来说：</p>
        <ul style="margin-top: 8px; padding-left: 20px; color: #666;">
          <li>全合成机油：10000公里或1年</li>
          <li>半合成机油：7500公里或8个月</li>
          <li>矿物油：5000公里或6个月</li>
        </ul>
        <h4 style="margin-top: 20px; font-size: 16px; color: #333;">二、轮胎检查</h4>
        <p style="margin-top: 10px;">轮胎是车辆与地面唯一接触的部件，其状态直接影响行车安全。建议每月检查一次轮胎胎压和磨损情况。</p>
        <h4 style="margin-top: 20px; font-size: 16px; color: #333;">三、滤芯更换</h4>
        <p style="margin-top: 10px;">空气滤芯和空调滤芯需要定期更换，一般建议：</p>
        <ul style="margin-top: 8px; padding-left: 20px; color: #666;">
          <li>空气滤芯：每15000公里</li>
          <li>空调滤芯：每10000公里或每年</li>
        </ul>
      </div>
    </div>

    <div class="section">
      <div class="section-title">评论 ({{ comments.length }})</div>
      <div class="comment-list">
        <div 
          v-for="comment in comments" 
          :key="comment.id"
          class="comment-item"
        >
          <div class="comment-avatar">
            <el-icon :size="24"><User /></el-icon>
          </div>
          <div class="comment-content">
            <div class="comment-header">
              <span class="comment-author">{{ comment.author }}</span>
              <span class="comment-time">{{ comment.time }}</span>
            </div>
            <p class="comment-text">{{ comment.content }}</p>
            <div class="comment-actions">
              <span class="action-item">
                <el-icon :size="14"><Good /></el-icon>
                {{ comment.likeCount }}
              </span>
              <span class="action-item">
                <el-icon :size="14"><ChatDotRound /></el-icon>
                回复
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="input-wrapper" @click="showCommentInput = true">
        <span class="placeholder">发表评论...</span>
      </div>
      <div class="actions">
        <div class="action-item">
          <el-icon :size="22"><Good /></el-icon>
          <span>{{ article?.likeCount || 568 }}</span>
        </div>
        <div class="action-item">
          <el-icon :size="22"><ChatDotRound /></el-icon>
          <span>{{ comments.length }}</span>
        </div>
        <div class="action-item">
          <el-icon :size="22"><Star /></el-icon>
          <span>收藏</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()

const article = ref(null)
const comments = ref([])
const showCommentInput = ref(false)

const goBack = () => {
  router.back()
}

onMounted(async () => {
  const articleId = route.params.id
  try {
    const res = await request.get(`/api/articles/${articleId}`)
    if (res.code === 200 && res.data) {
      article.value = res.data
    }
  } catch (e) {
    article.value = {
      id: articleId,
      title: '汽车保养小常识：机油多久更换一次？',
      content: '很多车主都知道机油需要定期更换，但具体多久更换一次呢？其实，机油的更换周期取决于多个因素，包括机油类型、驾驶习惯、车辆状况等。',
      userId: 1,
      viewCount: 12568,
      likeCount: 568,
      createdAt: '2024-01-15'
    }
  }

  comments.value = [
    {
      id: 1,
      author: '用户1234',
      time: '2天前',
      content: '写得很好，学到了很多保养知识。我的车是朗逸1.4T，一直用全合成机油，基本上1万公里一换，感觉还不错。',
      likeCount: 23
    },
    {
      id: 2,
      author: '老司机007',
      time: '3天前',
      content: '补充一下，机油更换还要看使用环境。如果经常在拥堵市区行驶，更换周期应该适当缩短。',
      likeCount: 45
    },
    {
      id: 3,
      author: '新手司机',
      time: '5天前',
      content: '请问下，4S店推荐的保养项目哪些是必要的？感觉有些项目太贵了。',
      likeCount: 12
    }
  ]
})
</script>

<style scoped>
.article-detail-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 70px;
}

.header {
  display: flex;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  color: #fff;
  cursor: pointer;
  margin-right: 16px;
}

.header h3 {
  color: #fff;
  font-size: 17px;
  font-weight: 500;
  margin: 0;
}

.article-content {
  background: #fff;
  padding: 20px 16px;
  margin-bottom: 12px;
}

.article-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px;
  line-height: 1.4;
}

.article-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.article-body {
  font-size: 15px;
  color: #333;
  line-height: 1.8;
}

.article-body p {
  margin: 0;
  color: #666;
}

.section {
  background: #fff;
  margin: 12px 0;
  padding: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  background: #e8e8e8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.comment-author {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.comment-time {
  font-size: 11px;
  color: #999;
}

.comment-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 8px;
}

.comment-actions {
  display: flex;
  gap: 20px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
  cursor: pointer;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 750px;
  margin: 0 auto;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 10px 16px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  border-top: 1px solid #eee;
}

.input-wrapper {
  flex: 1;
  background: #f5f5f5;
  border-radius: 20px;
  padding: 8px 16px;
  margin-right: 16px;
  cursor: pointer;
}

.placeholder {
  font-size: 13px;
  color: #999;
}

.actions {
  display: flex;
  gap: 20px;
}

.actions .action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #666;
  cursor: pointer;
  font-size: 11px;
}

.actions .action-item span {
  margin-top: 2px;
}
</style>
