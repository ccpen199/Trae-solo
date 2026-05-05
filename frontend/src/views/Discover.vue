<template>
  <div class="discover-page">
    <div class="header">
      <h1>发现</h1>
    </div>
    
    <div class="tabs">
      <div 
        class="tab-item"
        :class="{ active: activeTab === 'recommend' }"
        @click="activeTab = 'recommend'"
      >
        推荐文章
      </div>
      <div 
        class="tab-item"
        :class="{ active: activeTab === 'forum' }"
        @click="activeTab = 'forum'"
      >
        车友论坛
      </div>
    </div>

    <div class="article-list">
      <div 
        v-for="article in articles" 
        :key="article.id"
        class="article-card"
      >
        <div class="article-content">
          <h4 class="article-title">{{ article.title }}</h4>
          <p class="article-summary">{{ article.summary }}</p>
          <div class="article-meta">
            <span class="author">{{ article.author }}</span>
            <span class="view-count">{{ article.viewCount }}阅读</span>
            <span class="comment-count">{{ article.commentCount }}评论</span>
          </div>
        </div>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TabBar from '@/components/TabBar.vue'

const activeTab = ref('recommend')

const articles = ref([
  {
    id: 1,
    title: '汽车保养小常识：机油多久更换一次？',
    summary: '很多车主都知道机油需要定期更换，但具体多久更换一次呢？其实，机油的更换周期取决于多个因素...',
    author: '养车专家',
    viewCount: 12568,
    commentCount: 156
  },
  {
    id: 2,
    title: '冬天来了，汽车轮胎胎压应该调到多少？',
    summary: '随着气温下降，很多车主开始关注轮胎胎压的问题。那么冬天胎压应该调多少呢？...',
    author: '轮胎专家',
    viewCount: 8956,
    commentCount: 89
  },
  {
    id: 3,
    title: '求助：我的大众朗逸烧机油怎么办？',
    summary: '大家好，我的车是2018款大众朗逸1.4T，现在跑了5万多公里，最近发现机油消耗有点快...',
    author: '朗逸车主',
    viewCount: 3256,
    commentCount: 23
  }
])
</script>

<style scoped>
.discover-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 70px;
}

.header {
  background: #fff;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.header h1 {
  font-size: 18px;
  margin: 0;
  color: #333;
}

.tabs {
  display: flex;
  background: #fff;
  padding: 0 16px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 14px 0;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  position: relative;
}

.tab-item.active {
  color: #667eea;
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background: #667eea;
  border-radius: 2px;
}

.article-list {
  padding: 12px;
}

.article-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.article-title {
  font-size: 15px;
  color: #333;
  margin: 0 0 8px;
  line-height: 1.5;
}

.article-summary {
  font-size: 13px;
  color: #999;
  margin: 0 0 10px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #ccc;
}
</style>
