<template>
  <div class="news-page page-container">
    <div class="page-header">
      <div class="page-title">资讯中心</div>
      <div class="page-subtitle">政策解读 · 热点问答</div>
    </div>

    <van-tabs v-model:active="activeTab" sticky offset-top="0">
      <van-tab title="资讯" name="news" />
      <van-tab title="政策" name="policy" />
      <van-tab title="问答" name="faq" />
    </van-tabs>

    <div v-if="activeTab === 'news'" class="news-content">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索资讯"
        :loading="loading"
        @search="onSearch"
      />
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="listLoading"
          :finished="finished"
          finished-text="没有更多了"
          @load="loadMore"
        >
          <div
            v-for="item in newsList"
            :key="item.id"
            class="news-item"
            @click="router.push(`/news/${item.id}`)"
          >
            <div v-if="item.media_type === 'video'" class="video-icon">
              <van-icon name="play-circle-o" size="32" color="#fff" />
            </div>
            <div class="news-item-content">
              <div class="news-item-title">
                {{ item.title }}
                <van-tag v-if="item.is_top" type="danger" size="small">置顶</van-tag>
                <van-tag v-else-if="item.is_hot" type="danger" size="small">热门</van-tag>
                <van-tag v-if="item.media_type === 'video'" type="primary" size="small">视频</van-tag>
              </div>
              <div class="news-item-meta">
                <span>{{ item.source }}</span>
                <span>{{ item.publish_time }}</span>
                <span><van-icon name="eye-o" /> {{ item.views }}</span>
              </div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <div v-else-if="activeTab === 'policy'" class="news-content">
      <div class="policy-cats">
        <van-tag
          v-for="cat in policyCategories"
          :key="cat"
          :type="activeCategory === cat ? 'primary' : 'default'"
          size="medium"
          @click="activeCategory = cat; loadPolicies(1, true)"
        >
          {{ cat }}
        </van-tag>
      </div>
      <div
        v-for="item in policyList"
        :key="item.id"
        class="policy-item"
        @click="router.push(`/news/${item.id}`)"
      >
        <div class="policy-item-content">
          <div class="policy-item-title">
            {{ item.title }}
            <van-tag v-if="item.is_top" type="danger" size="small">置顶</van-tag>
          </div>
          <div class="policy-item-desc text-ellipsis-2">{{ item.content }}</div>
          <div class="policy-item-meta">
            <span>{{ item.publisher }}</span>
            <span>{{ item.publish_date }}</span>
            <span class="policy-tag">{{ item.category }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'faq'" class="news-content">
      <van-search
        v-model="faqKeyword"
        placeholder="搜索问题"
        @search="searchFaq"
      />
      <van-accordion v-model="activeFaq">
        <van-accordion-item
          v-for="item in faqList"
          :key="item.id"
          :title="item.question"
          :name="item.id"
          @click="markFaqViewed(item.id)"
        >
          <div class="faq-answer">{{ item.answer }}</div>
          <div class="faq-meta">
            <span><van-icon name="eye-o" /> {{ item.views }} 人浏览</span>
            <span>关键词：{{ item.keywords }}</span>
          </div>
        </van-accordion-item>
      </van-accordion>
      <div v-if="faqList.length === 0 && !faqLoading" class="empty-state">
        <van-icon name="question-o" size="48" />
        <div>暂无相关问题</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getNewsList, getFaqList, viewFaq as markFaqViewedApi } from '@/api/news';
import { getRecommendPolicies } from '@/api/home';

const router = useRouter();

const activeTab = ref('news');
const searchKeyword = ref('');
const newsList = ref([]);
const policyList = ref([]);
const faqList = ref([]);
const page = ref(1);
const pageSize = 10;
const loading = ref(false);
const listLoading = ref(false);
const refreshing = ref(false);
const finished = ref(false);
const activeCategory = ref('全部');
const policyCategories = ref(['全部', '养老保险', '医疗保险', '失业保险', '社会保险', '就业服务']);
const faqKeyword = ref('');
const activeFaq = ref(null);
const faqLoading = ref(false);

const onSearch = () => {
  refreshing.value = true;
  loadNews(1, true);
};

const onRefresh = () => {
  loadNews(1, true);
};

const loadMore = () => {
  loadNews(page.value + 1, false);
};

const loadNews = async (pageNum, reset = false) => {
  if (reset) {
    page.value = 1;
    finished.value = false;
    newsList.value = [];
  }
  
  listLoading.value = true;
  try {
    const res = await getNewsList({
      page: pageNum,
      pageSize,
      keyword: searchKeyword.value,
    });
    
    if (res.code === 200) {
      if (reset) {
        newsList.value = res.data.list;
      } else {
        newsList.value = [...newsList.value, ...res.data.list];
      }
      page.value = pageNum;
      if (res.data.list.length < pageSize) {
        finished.value = true;
      }
    }
  } finally {
    listLoading.value = false;
    refreshing.value = false;
  }
};

const loadPolicies = async (pageNum, reset = false) => {
  const res = await getRecommendPolicies({
    page: pageNum,
    pageSize: 20,
    category: activeCategory.value === '全部' ? undefined : activeCategory.value,
  });
  
  if (res.code === 200) {
    policyList.value = res.data.list;
  }
};

const searchFaq = async () => {
  faqLoading.value = true;
  const res = await getFaqList({
    pageSize: 50,
    keyword: faqKeyword.value,
  });
  
  if (res.code === 200) {
    faqList.value = res.data.list;
  }
  faqLoading.value = false;
};

const markFaqViewed = async (id) => {
  await markFaqViewedApi(id);
  const item = faqList.value.find(f => f.id === id);
  if (item) item.views++;
};

onMounted(() => {
  loadNews(1, true);
  loadPolicies(1, true);
  searchFaq();
});
</script>

<style scoped>
.news-page {
  background-color: #f7f8fa;
}

.news-content {
  padding-bottom: 20px;
}

.news-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  margin-bottom: 8px;
  position: relative;
}

.video-icon {
  position: absolute;
  top: 50%;
  left: 20px;
  transform: translateY(-50%);
  z-index: 1;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.news-item-content {
  flex: 1;
}

.news-item-title {
  font-size: 15px;
  color: #323233;
  line-height: 1.5;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.news-item-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #969799;
}

.policy-cats {
  padding: 12px 16px;
  background: #fff;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.policy-item {
  padding: 16px;
  background: #fff;
  margin-bottom: 8px;
}

.policy-item-title {
  font-size: 15px;
  color: #323233;
  font-weight: 500;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.policy-item-desc {
  font-size: 13px;
  color: #646566;
  margin-bottom: 8px;
  line-height: 1.6;
}

.policy-item-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #969799;
  align-items: center;
}

.policy-tag {
  background: #e8f3ff;
  color: #1989fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.faq-answer {
  font-size: 14px;
  color: #323233;
  line-height: 1.8;
  padding: 8px 0;
}

.faq-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #969799;
  padding-top: 8px;
  border-top: 1px solid #ebedf0;
}
</style>
