<template>
  <div class="theme">
    <van-nav-bar :title="theme.name || '主题活动'" left-arrow @click-left="goBack" fixed placeholder />

    <div class="theme-header" v-if="theme.image">
      <img :src="theme.image" :alt="theme.name" class="theme-banner" />
      <div class="theme-info">
        <div class="theme-name">{{ theme.name }}</div>
        <div class="theme-desc">{{ theme.description }}</div>
        <div class="theme-stats">
          <span class="stat-item">
            <van-icon name="goods" size="14" />
            共 {{ products.length }} 款商品
          </span>
          <span class="stat-item" v-if="minPrice">
            <van-icon name="price-tag-o" size="14" />
            ￥{{ minPrice }} 起
          </span>
        </div>
      </div>
    </div>

    <div class="section-title">
      <van-icon name="fire-o" size="16" color="#ff6b35" />
      <span>精选商品</span>
    </div>

    <div class="product-list">
      <div class="product-card" v-for="item in products" :key="item.id" @click.stop="goDetail(item.id)">
        <div class="img-wrap">
          <img :src="item.images?.[0]" :alt="item.name" class="product-img" />
          <div class="sales-tag" v-if="item.sales > 0">已售{{ item.sales }}</div>
        </div>
        <div class="product-info">
          <div class="product-name">{{ item.name }}</div>
          <div class="product-desc">{{ item.description }}</div>
          <div class="product-price">
            <span class="price">¥{{ item.price }}</span>
            <span class="original-price" v-if="item.original_price > item.price">¥{{ item.original_price }}</span>
          </div>
          <div class="product-stock">
            <span class="stock-text" :class="{ low: item.stock < 10 }">
              {{ item.stock < 10 ? '仅剩' + item.stock + '间' : '库存充足' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="empty" v-if="products.length === 0">
      <van-empty description="暂无商品" />
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import request from '@/utils/request';
import TabBar from '@/components/TabBar.vue';

const router = useRouter();
const route = useRoute();

const theme = ref({});
const products = ref([]);

const minPrice = computed(() => {
  if (products.value.length === 0) return null;
  return Math.min(...products.value.map(p => p.price));
});

const getThemeData = async () => {
  const id = route.params.id;
  try {
    const res = await request.get(`/themes/${id}`);
    theme.value = res.theme || {};
    products.value = res.products || [];
  } catch (e) {
    console.error('获取主题数据失败', e);
  }
};

const goBack = () => {
  router.back();
};

const goDetail = (id) => {
  router.push(`/product/${id}`);
};

onMounted(() => {
  getThemeData();
});
</script>

<style scoped lang="less">
.theme {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.theme-header {
  background: #fff;
  padding: 15px;
  margin-bottom: 10px;
}

.theme-banner {
  width: 100%;
  height: 180px;
  border-radius: 8px;
  object-fit: cover;
  margin-bottom: 12px;
}

.theme-info {
  .theme-name {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #333;
  }

  .theme-desc {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
    margin-bottom: 12px;
  }

  .theme-stats {
    display: flex;
    gap: 15px;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #999;
    }
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 15px 15px 10px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.product-list {
  display: flex;
  flex-wrap: wrap;
  padding: 0 10px;
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

.img-wrap {
  position: relative;
  width: 100%;
  height: 140px;
  border-radius: 6px;
  overflow: hidden;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.sales-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(255, 107, 53, 0.9);
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
}

.product-info {
  padding: 10px 5px 5px;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.product-desc {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
}

.product-price {
  .price {
    color: #ff6b35;
    font-size: 17px;
    font-weight: 600;
  }
  .original-price {
    color: #999;
    font-size: 12px;
    text-decoration: line-through;
    margin-left: 6px;
  }
}

.product-stock {
  margin-top: 4px;

  .stock-text {
    font-size: 11px;
    color: #07c160;

    &.low {
      color: #ff4d4f;
    }
  }
}

.empty {
  padding-top: 100px;
}
</style>
