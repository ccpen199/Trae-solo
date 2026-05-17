<template>
  <div class="page-container card-page">
    <div class="page-header">
      <div class="title">会员卡</div>
      <div class="subtitle">多种会员套餐任你选择</div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" color="#667eea" />
    </div>
    
    <div v-else class="card-list">
      <div
        v-for="card in cardList"
        :key="card.id"
        class="card-item card-shadow"
        :class="{ recommended: card.type === 1 }"
      >
        <div class="card-header" v-if="card.type === 1">推荐</div>
        <div class="card-content">
          <h3 class="card-name">{{ card.name }}</h3>
          <p class="card-desc">{{ card.description }}</p>
          <div class="card-price">
            <span class="price">¥{{ card.price }}</span>
            <span class="original-price" v-if="card.original_price">¥{{ card.original_price }}</span>
          </div>
          <div class="card-benefits">
            <span v-for="(item, index) in card.benefits.split(',')" :key="index" class="benefit-tag">
              {{ item }}
            </span>
          </div>
        </div>
        <van-button
          type="primary"
          class="buy-btn"
          @click="buyCard(card)"
          :loading="buyingId === card.id"
        >
          立即购买
        </van-button>
      </div>
      
      <div v-if="!cardList.length" class="empty-container">
        <div class="empty-icon">💳</div>
        <div class="empty-text">暂无卡套餐</div>
      </div>
    </div>
    
    <van-tabbar v-model:active="activeTabbar" active-color="#667eea">
      <van-tabbar-item to="/home" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/group-classes" icon="orders-o">团课</van-tabbar-item>
      <van-tabbar-item to="/coaches" icon="user-o">私教</van-tabbar-item>
      <van-tabbar-item to="/cards" icon="gift-o">购卡</van-tabbar-item>
      <van-tabbar-item to="/my" icon="manager-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import request from '../../utils/request';

const router = useRouter();
const route = useRoute();
const loading = ref(true);
const buyingId = ref(null);
const cardList = ref([]);
const activeTabbar = ref(route.path);

async function fetchData() {
  try {
    loading.value = true;
    const res = await request.get('/card/cards');
    cardList.value = res.data || [];
  } catch (err) {
    console.error('获取卡列表失败:', err);
  } finally {
    loading.value = false;
  }
}

async function buyCard(card) {
  const token = localStorage.getItem('fitlife_token');
  if (!token) {
    showToast('请先登录');
    router.push('/login');
    return;
  }
  
  try {
    await showConfirmDialog({
      title: '确认购买',
      message: `确定要购买 ${card.name} 吗？将扣除 ¥${card.price}`
    });
    
    buyingId.value = card.id;
    await request.post('/card/buy', { cardId: card.id });
    showToast('购买成功');
  } catch (err) {
    if (err !== 'cancel') {
      console.error('购买失败:', err);
    }
  } finally {
    buyingId.value = null;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style lang="less" scoped>
.card-page {
  .card-list {
    padding: 16px;
  }
  
  .card-item {
    padding: 20px;
    margin-bottom: 16px;
    position: relative;
    
    &.recommended {
      border: 2px solid #667eea;
    }
    
    .card-header {
      position: absolute;
      top: 0;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 4px 12px;
      border-radius: 0 0 8px 8px;
      font-size: 12px;
    }
    
    .card-name {
      font-size: 20px;
      font-weight: bold;
      color: #333;
      margin-bottom: 8px;
    }
    
    .card-desc {
      font-size: 13px;
      color: #666;
      margin-bottom: 16px;
    }
    
    .card-price {
      margin-bottom: 16px;
      
      .price {
        font-size: 28px;
        font-weight: bold;
        color: #667eea;
      }
      
      .original-price {
        font-size: 14px;
        color: #999;
        text-decoration: line-through;
        margin-left: 8px;
      }
    }
    
    .card-benefits {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 20px;
      
      .benefit-tag {
        background: rgba(102, 126, 234, 0.1);
        color: #667eea;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
      }
    }
    
    .buy-btn {
      width: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 25px;
      height: 45px;
      font-size: 15px;
      font-weight: 500;
    }
  }
}
</style>
