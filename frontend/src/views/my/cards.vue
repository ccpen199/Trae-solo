<template>
  <div class="page-container cards-page">
    <van-nav-bar
      title="我的会员卡"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    />
    
    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" color="#667eea" />
    </div>
    
    <div v-else-if="!userCards.length" class="empty-container">
      <div class="empty-icon">💳</div>
      <div class="empty-text">暂无会员卡</div>
      <van-button type="primary" size="small" @click="goToBuy">
        去购买
      </van-button>
    </div>
    
    <div v-else class="card-list">
      <div
        v-for="card in userCards" :key="card.id" class="card-item card-shadow"
        :class="{ active: card.status === 1 }"
      >
        <div class="card-header">
          <span class="card-name">{{ card.name }}</span>
          <van-tag type="success" v-if="card.status === 1">有效</van-tag>
          <van-tag type="default" v-else>已过期</van-tag>
        </div>
        <div class="card-body">
          <div class="card-balance">
            余额: <span class="balance-num">{{ card.balance }}</span>
          </div>
          <div class="card-expire">
            有效期: {{ card.expire_time }}
          </div>
        </div>
        <div class="card-benefits">
          <span class="benefit-title">权益:</span>
          {{ card.benefits }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import request from '../../utils/request';

const router = useRouter();
const loading = ref(false);
const userCards = ref([]);

async function fetchUserCards() {
  try {
    loading.value = true;
    const res = await request.get('/card/my-cards');
    userCards.value = res.data || [];
  } catch (err) {
    console.error('获取我的卡失败:', err);
  } finally {
    loading.value = false;
  }
}

function goToBuy() {
  router.push('/cards');
}

onMounted(() => {
  fetchUserCards();
});
</script>

<style lang="less" scoped>
.cards-page {
  .card-list {
    padding: 16px;
  }
  
  .card-item {
    padding: 20px;
    margin-bottom: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 16px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      .card-name {
        font-size: 18px;
        font-weight: bold;
      }
    }
    
    .card-body {
      margin-bottom: 16px;
      
      .card-balance {
        font-size: 14px;
        margin-bottom: 8px;
        
        .balance-num {
          font-size: 24px;
          font-weight: bold;
        }
      }
      
      .card-expire {
        font-size: 12px;
        opacity: 0.9;
      }
    }
    
    .card-benefits {
      font-size: 12px;
      background: rgba(255, 255, 255, 0.15);
      padding: 8px 12px;
      border-radius: 8px;
      
      .benefit-title {
        font-weight: 500;
      }
    }
  }
  
  .empty-container {
    text-align: center;
    
    button {
      margin-top: 16px;
    }
  }
}
</style>
