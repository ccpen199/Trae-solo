<template>
  <div class="channels-page page-container">
    <div class="container">
      <div class="page-header">
        <h1>频道聚合</h1>
        <p>发现精彩阅读内容，加入你感兴趣的频道</p>
      </div>

      <el-tabs v-model="activeTab" class="channel-tabs">
        <el-tab-pane label="全部频道" name="all">
          <div class="channel-grid">
            <div
              v-for="channel in channels"
              :key="channel.id"
              class="channel-item"
              @click="goToChannel(channel)"
            >
              <el-card shadow="hover">
                <div class="channel-card">
                  <div class="channel-cover" :style="{ backgroundImage: `url(${channel.coverImage})` }">
                    <div class="channel-overlay">
                      <el-avatar :size="64" :src="channel.icon">
                        {{ channel.name?.charAt(0) }}
                      </el-avatar>
                    </div>
                    <div class="channel-badges">
                      <el-tag v-if="channel.isHot" type="danger" size="small">热门</el-tag>
                      <el-tag v-if="channel.isFeatured" type="warning" size="small">精选</el-tag>
                    </div>
                  </div>
                  <div class="channel-content">
                    <h3 class="channel-name">{{ channel.name }}</h3>
                    <p class="channel-desc text-ellipsis-2">{{ channel.description }}</p>
                    <div class="channel-stats">
                      <span class="stat">
                        <el-icon><User /></el-icon>
                        {{ channel.followerCount }} 关注
                      </span>
                      <span class="stat">
                        <el-icon><Document /></el-icon>
                        {{ channel.contentCount }} 内容
                      </span>
                    </div>
                    <div class="channel-tags">
                      <el-tag v-for="tag in channel.tags?.slice(0, 3)" :key="tag" size="small" effect="plain">
                        {{ tag }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
          
          <div v-if="channels.length === 0 && !loading" class="empty-state">
            <el-empty description="暂无频道数据" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="精选推荐" name="featured">
          <div class="channel-grid">
            <div
              v-for="channel in featuredChannels"
              :key="channel.id"
              class="channel-item"
              @click="goToChannel(channel)"
            >
              <el-card shadow="hover">
                <div class="channel-card">
                  <div class="channel-cover" :style="{ backgroundImage: `url(${channel.coverImage})` }">
                    <div class="channel-overlay">
                      <el-avatar :size="64" :src="channel.icon">
                        {{ channel.name?.charAt(0) }}
                      </el-avatar>
                    </div>
                    <el-tag type="warning" size="small" class="featured-badge">精选</el-tag>
                  </div>
                  <div class="channel-content">
                    <h3 class="channel-name">{{ channel.name }}</h3>
                    <p class="channel-desc text-ellipsis-2">{{ channel.description }}</p>
                    <div class="channel-stats">
                      <span class="stat">
                        <el-icon><User /></el-icon>
                        {{ channel.followerCount }} 关注
                      </span>
                      <span class="stat">
                        <el-icon><Document /></el-icon>
                        {{ channel.contentCount }} 内容
                      </span>
                    </div>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="热门频道" name="hot">
          <div class="channel-grid">
            <div
              v-for="channel in hotChannels"
              :key="channel.id"
              class="channel-item"
              @click="goToChannel(channel)"
            >
              <el-card shadow="hover">
                <div class="channel-card">
                  <div class="channel-cover" :style="{ backgroundImage: `url(${channel.coverImage})` }">
                    <div class="channel-overlay">
                      <el-avatar :size="64" :src="channel.icon">
                        {{ channel.name?.charAt(0) }}
                      </el-avatar>
                    </div>
                    <el-tag type="danger" size="small" class="hot-badge">
                      <el-icon><Star /></el-icon>
                      热门
                    </el-tag>
                  </div>
                  <div class="channel-content">
                    <h3 class="channel-name">{{ channel.name }}</h3>
                    <p class="channel-desc text-ellipsis-2">{{ channel.description }}</p>
                    <div class="channel-stats">
                      <span class="stat">
                        <el-icon><User /></el-icon>
                        {{ channel.followerCount }} 关注
                      </span>
                      <span class="stat">
                        <el-icon><Document /></el-icon>
                        {{ channel.contentCount }} 内容
                      </span>
                    </div>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div v-if="loading" class="loading-container">
        <el-loading text="加载中..." />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';
import {
  User,
  Document,
  Star
} from '@element-plus/icons-vue';

const router = useRouter();

const loading = ref(true);
const activeTab = ref('all');
const channels = ref([]);
const featuredChannels = ref([]);
const hotChannels = ref([]);

const fetchChannels = async (type = 'all') => {
  loading.value = true;
  try {
    let params = {};
    if (type === 'featured') params.isFeatured = true;
    if (type === 'hot') params.isHot = true;

    const res = await api.get('/channels', { params });
    channels.value = res.data.channels || [];
  } catch (error) {
    console.error('Failed to fetch channels:', error);
  } finally {
    loading.value = false;
  }
};

const fetchAggregator = async () => {
  try {
    const res = await api.get('/channels/aggregator');
    featuredChannels.value = res.data.featured || [];
    hotChannels.value = res.data.hot || [];
  } catch (error) {
    console.error('Failed to fetch aggregator:', error);
  }
};

const goToChannel = (channel) => {
  router.push(`/channels/${channel.id}`);
};

watch(activeTab, (newTab) => {
  if (newTab === 'all') {
    fetchChannels('all');
  }
});

onMounted(() => {
  fetchChannels('all');
  fetchAggregator();
});
</script>

<style scoped>
.channels-page {
  padding-bottom: 40px;
}

.channel-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 0 20px;
}

.channel-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding: 20px 0;
}

.channel-item {
  cursor: pointer;
}

.channel-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.channel-cover {
  height: 160px;
  background-size: cover;
  background-position: center;
  position: relative;
  margin: -20px -20px 16px -20px;
  border-radius: 4px 4px 0 0;
}

.channel-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
  display: flex;
  align-items: flex-end;
  padding: 16px;
}

.channel-badges {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 6px;
}

.featured-badge,
.hot-badge {
  position: absolute;
  top: 12px;
  right: 12px;
}

.hot-badge {
  display: flex;
  align-items: center;
  gap: 4px;
}

.channel-content {
  flex: 1;
}

.channel-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.channel-desc {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 12px;
  min-height: 42px;
}

.channel-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
}

.stat {
  font-size: 13px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.channel-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
