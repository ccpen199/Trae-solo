<template>
  <div class="news-detail-page page-container">
    <van-nav-bar
      title="详情"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    />

    <div v-if="article" class="detail-content">
      <h1 class="detail-title">{{ article.title }}</h1>
      <div class="detail-meta">
        <span>{{ article.source }}</span>
        <span>{{ article.publish_time }}</span>
        <span><van-icon name="eye-o" /> {{ article.views }}</span>
      </div>

      <div v-if="article.media_type === 'video'" class="video-player">
        <div class="video-placeholder">
          <van-icon name="play-circle-o" size="64" color="#fff" />
          <p class="video-desc">点击播放视频</p>
        </div>
      </div>

      <div class="detail-body">
        <p v-if="article.summary" class="summary">{{ article.summary }}</p>
        <div class="article-content" v-html="formattedContent"></div>
      </div>

      <div class="detail-actions">
        <van-button type="default" icon="good-job-o" @click="likeArticle">
          点赞 ({{ article.likes }})
        </van-button>
        <van-button type="primary" icon="share-o">分享</van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showSuccessToast } from 'vant';
import { getNewsDetail } from '@/api/news';

const route = useRoute();
const router = useRouter();
const articleId = route.params.id;
const article = ref(null);

const formattedContent = computed(() => {
  if (!article.value?.content) return '';
  return article.value.content
    .split(/[。！？]/)
    .filter(p => p.trim())
    .map(p => `<p>${p.trim()}。</p>`)
    .join('');
});

const likeArticle = () => {
  if (article.value) {
    article.value.likes++;
    showSuccessToast('点赞成功');
  }
};

const loadData = async () => {
  const res = await getNewsDetail(articleId);
  if (res.code === 200) {
    article.value = res.data;
  } else {
    showToast('加载失败');
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.news-detail-page {
  background-color: #fff;
  min-height: 100vh;
}

.detail-content {
  padding: 20px;
}

.detail-title {
  font-size: 22px;
  font-weight: 600;
  color: #323233;
  line-height: 1.5;
  margin-bottom: 16px;
}

.detail-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #969799;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebedf0;
  margin-bottom: 20px;
}

.video-player {
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;
}

.video-placeholder {
  height: 200px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.video-desc {
  margin-top: 12px;
  font-size: 14px;
  opacity: 0.9;
}

.summary {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 14px;
  color: #646566;
  line-height: 1.8;
  margin-bottom: 20px;
  border-left: 4px solid #1989fa;
}

.article-content p {
  font-size: 15px;
  color: #323233;
  line-height: 2;
  text-indent: 2em;
  margin-bottom: 16px;
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebedf0;
}

.detail-actions .van-button {
  flex: 1;
}
</style>
