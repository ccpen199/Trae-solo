<template>
  <div class="home">
    <van-nav-bar title="柚诚小栈" fixed placeholder>
      <template #left>
        <van-icon name="location-o" size="18" />
        <span class="location-text">{{ locationText }}</span>
      </template>
    </van-nav-bar>

    <van-swipe class="banner" :autoplay="3000" indicator-color="#ff6b35">
      <van-swipe-item v-for="banner in banners" :key="banner.id" @click="goBanner(banner)">
        <img :src="banner.image" :alt="banner.title" class="banner-img" />
      </van-swipe-item>
    </van-swipe>

    <div class="section-title">主题活动</div>
    <div class="themes">
      <div class="theme-item" v-for="theme in themes" :key="theme.id" @click.stop="goTheme(theme.id)">
        <img :src="theme.image" :alt="theme.name" class="theme-img" />
        <div class="theme-name">{{ theme.name }}</div>
      </div>
    </div>

    <div class="section-title">新品上线</div>
    <div class="product-list">
      <div class="product-card" v-for="item in newProducts" :key="item.id" @click.stop="goDetail(item.id)">
        <img :src="item.images?.[0]" :alt="item.name" class="product-img" />
        <div class="product-info">
          <div class="product-name">{{ item.name }}</div>
          <div class="product-desc">{{ item.description }}</div>
          <div class="product-price">
            <span class="price">¥{{ item.price }}</span>
            <span class="original-price" v-if="item.original_price > item.price">¥{{ item.original_price }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="section-title">为你推荐</div>
    <div class="product-list">
      <div class="product-card" v-for="item in recommendProducts" :key="item.id" @click.stop="goDetail(item.id)">
        <img :src="item.images?.[0]" :alt="item.name" class="product-img" />
        <div class="product-info">
          <div class="product-name">{{ item.name }}</div>
          <div class="product-desc">{{ item.description }}</div>
          <div class="product-price">
            <span class="price">¥{{ item.price }}</span>
            <span class="original-price" v-if="item.original_price > item.price">¥{{ item.original_price }}</span>
          </div>
        </div>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import request from '@/utils/request';
import TabBar from '@/components/TabBar.vue';

const router = useRouter();
const banners = ref([]);
const themes = ref([]);
const newProducts = ref([]);
const recommendProducts = ref([]);
const locationText = ref('北京市朝阳区');

const getHomeData = async () => {
  try {
    const res = await request.get('/home');
    banners.value = res.banners;
    themes.value = res.themes;
    newProducts.value = res.newProducts;
    recommendProducts.value = res.recommendProducts;
  } catch (e) {
    console.error('获取首页数据失败', e);
  }
};

const goBanner = (banner) => {
  if (banner.link) {
    if (banner.link.startsWith('http')) {
      window.location.href = banner.link;
    } else {
      router.push(banner.link);
    }
  }
};

const goTheme = (id) => {
  console.log('点击主题:', id);
  router.push(`/theme/${id}`);
};

const goDetail = (id) => {
  router.push(`/product/${id}`);
};

onMounted(() => {
  getHomeData();
});
</script>

<style scoped lang="less">
.home {
  padding-bottom: 60px;
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

.location-text {
  font-size: 13px;
  margin-left: 4px;
}

.banner {
  height: 180px;
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  z-index: 5;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  padding: 15px 15px 10px;
}

.themes {
  display: flex;
  flex-wrap: wrap;
  padding: 0 10px;
  position: relative;
  z-index: 10;
}

.theme-item {
  width: 50%;
  padding: 5px;
  text-align: center;
  position: relative;
  z-index: 10;
  cursor: pointer;
}

.theme-img {
  width: 100%;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  pointer-events: none;
}

.theme-name {
  font-size: 13px;
  margin-top: 5px;
}

.product-list {
  display: flex;
  flex-wrap: wrap;
  padding: 0 10px;
  position: relative;
  z-index: 10;
}

.product-card {
  width: 50%;
  padding: 5px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
  cursor: pointer;
}

.product-img {
  width: 100%;
  height: 140px;
  border-radius: 6px;
  object-fit: cover;
  pointer-events: none;
}

.product-info {
  padding: 8px 5px;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-desc {
  font-size: 12px;
  color: #999;
  margin: 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-price {
  .price {
    color: #ff6b35;
    font-size: 16px;
    font-weight: 600;
  }
  .original-price {
    color: #999;
    font-size: 12px;
    text-decoration: line-through;
    margin-left: 6px;
  }
}
</style>
