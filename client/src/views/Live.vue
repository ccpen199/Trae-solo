<template>
  <div class="live">
    <div class="header">
      <span class="back-btn" @click="goBack">←</span>
      <span class="title">淘宝直播</span>
      <span class="placeholder"></span>
    </div>

    <div class="live-content">
      <div class="tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.value"
          class="tab-item"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
          <span v-if="tab.live" class="live-dot">●</span>
        </div>
      </div>

      <div class="live-grid">
        <div v-for="room in liveRooms" :key="room.id" class="live-card" @click="showToast('进入直播间功能开发中')">
          <div class="live-cover">
            <img :src="room.cover" :alt="room.title" />
            <div class="live-badge">
              <span class="live-dot">●</span>
              直播中
            </div>
            <div class="live-viewers">
              <span>👁️</span> {{ room.viewers }}
            </div>
            <div class="live-product-tag">
              🎁 {{ room.productCount }}件商品
            </div>
          </div>
          <div class="live-info">
            <div class="host-avatar">{{ room.hostAvatar }}</div>
            <div class="host-info">
              <div class="host-name">{{ room.hostName }}</div>
              <div class="live-title">{{ room.title }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const showToast = inject('showToast');

const activeTab = ref('recommend');

const tabs = [
  { label: '推荐', value: 'recommend', live: true },
  { label: '美食', value: 'food', live: true },
  { label: '美妆', value: 'beauty', live: true },
  { label: '服装', value: 'fashion', live: true },
  { label: '数码', value: 'digital', live: true }
];

const liveRooms = ref([
  {
    id: 1,
    title: '限时特惠 全场5折起',
    hostName: '美妆小达人',
    hostAvatar: '👩',
    cover: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
    viewers: '12.5万',
    productCount: 38
  },
  {
    id: 2,
    title: '新鲜水果 产地直供',
    hostName: '水果哥',
    hostAvatar: '👨',
    cover: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400',
    viewers: '8.2万',
    productCount: 25
  },
  {
    id: 3,
    title: '时尚穿搭 新品首发',
    hostName: '时尚教主',
    hostAvatar: '👩‍🎨',
    cover: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
    viewers: '5.6万',
    productCount: 52
  },
  {
    id: 4,
    title: '数码好物 性价比之王',
    hostName: '科技宅男',
    hostAvatar: '🤓',
    cover: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
    viewers: '3.8万',
    productCount: 16
  }
]);

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.live {
  padding-bottom: 30px;
  background: #000;
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #000;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn, .placeholder {
  width: 40px;
  color: #fff;
  font-size: 20px;
}

.title {
  color: #fff;
  font-size: 17px;
  font-weight: 600;
}

.tabs {
  display: flex;
  background: #1a1a1a;
  padding: 0 8px;
  overflow-x: auto;
  white-space: nowrap;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 14px 16px;
  font-size: 14px;
  color: #999;
  cursor: pointer;
}

.tab-item.active {
  color: #ff5000;
  font-weight: 600;
}

.live-dot {
  color: #ff4757;
  font-size: 10px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.live-content {
  padding: 12px;
}

.live-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.live-card {
  background: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}

.live-cover {
  position: relative;
  aspect-ratio: 3/4;
}

.live-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.live-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #ff4757;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.live-viewers {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
}

.live-product-tag {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(255, 80, 0, 0.9);
  color: #fff;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
}

.live-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
}

.host-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ff5000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.host-info {
  flex: 1;
  min-width: 0;
}

.host-name {
  font-size: 13px;
  color: #fff;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.live-title {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
