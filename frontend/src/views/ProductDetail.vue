<template>
  <div class="product-detail-page">
    <div class="header">
      <div class="back-btn" @click="goBack">
        <el-icon :size="20"><ArrowLeft /></el-icon>
      </div>
      <h3>商品详情</h3>
    </div>

    <div class="product-image-section" v-if="product">
      <div class="product-image">
        <div class="placeholder-img">
          <el-icon :size="60"><Picture /></el-icon>
        </div>
      </div>
    </div>

    <div class="product-info-section" v-if="product">
      <div class="price-area">
        <span class="current-price">¥{{ product.price }}</span>
        <span class="original-price" v-if="product.originalPrice">¥{{ product.originalPrice }}</span>
      </div>
      <h2 class="product-name">{{ product.name }}</h2>
      <p class="product-desc">{{ product.description }}</p>
      <div class="product-tags">
        <span class="tag" v-if="product.brand">品牌：{{ product.brand }}</span>
        <span class="tag" v-if="product.sales">已售{{ product.sales }}件</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">安装服务</div>
      <div class="install-info" v-if="product">
        <div class="install-item">
          <span class="label">安装工时费</span>
          <span class="value">¥{{ product.installationFee || 50 }}</span>
        </div>
        <div class="install-item">
          <span class="label">到店安装</span>
          <span class="value link" @click="goToStore">选择门店 ></span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">商品详情</div>
      <div class="detail-content">
        <p v-if="product">{{ product.description }}</p>
        <p>• 品质保证：100%正品保障</p>
        <p>• 售后保障：7天无理由退换</p>
        <p>• 安装保障：全国联保</p>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="actions">
        <div class="action-item">
          <el-icon :size="20"><ShoppingCart /></el-icon>
          <span>购物车</span>
        </div>
        <div class="action-item">
          <el-icon :size="20"><Service /></el-icon>
          <span>客服</span>
        </div>
      </div>
      <div class="buy-buttons">
        <el-button type="warning" size="large" class="buy-btn">加入购物车</el-button>
        <el-button type="primary" size="large" class="buy-btn" @click="handleBuy">立即购买</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const product = ref(null)

const goBack = () => {
  router.back()
}

const goToStore = () => {
  router.push('/store')
}

const handleBuy = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  ElMessage.success('请先选择门店安装服务')
  router.push('/store')
}

onMounted(async () => {
  const productId = route.params.id
  try {
    const res = await request.get(`/api/products/${productId}`)
    if (res.code === 200 && res.data) {
      product.value = res.data
    }
  } catch (e) {
    product.value = {
      id: productId,
      name: '美孚1号 全合成机油 0W-40 SN级 4L',
      price: 399.00,
      originalPrice: 499.00,
      brand: '美孚',
      sales: 5689,
      installationFee: 50,
      description: '美孚1号 0W-40 是先进的全合成发动机油，能为引擎提供卓越的保护。采用先进的配方技术，在严苛的驾驶条件下也能提供出色的性能表现。'
    }
  }
})
</script>

<style scoped>
.product-detail-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 80px;
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

.product-image-section {
  background: #fff;
  padding: 20px;
}

.product-image {
  width: 100%;
  height: 280px;
  background: #f9f9f9;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-img {
  color: #ccc;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.product-info-section {
  background: #fff;
  padding: 16px;
  margin-top: 8px;
}

.price-area {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.current-price {
  font-size: 24px;
  font-weight: bold;
  color: #ff6600;
}

.original-price {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
}

.product-name {
  font-size: 16px;
  color: #333;
  margin: 0 0 8px;
  line-height: 1.5;
}

.product-desc {
  font-size: 13px;
  color: #666;
  margin: 0 0 12px;
  line-height: 1.5;
}

.product-tags {
  display: flex;
  gap: 12px;
}

.tag {
  font-size: 12px;
  color: #999;
}

.section {
  background: #fff;
  margin-top: 8px;
  padding: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.install-info {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
}

.install-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.install-item:not(:last-child) {
  border-bottom: 1px solid #eee;
}

.install-item .label {
  font-size: 14px;
  color: #666;
}

.install-item .value {
  font-size: 14px;
  color: #333;
}

.install-item .value.link {
  color: #667eea;
  cursor: pointer;
}

.detail-content {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
}

.detail-content p {
  margin: 8px 0;
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
  padding: 8px 16px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  border-top: 1px solid #eee;
}

.actions {
  display: flex;
  gap: 20px;
  margin-right: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #666;
  cursor: pointer;
}

.action-item span {
  font-size: 11px;
  margin-top: 2px;
}

.buy-buttons {
  flex: 1;
  display: flex;
  gap: 12px;
}

.buy-btn {
  flex: 1;
  border-radius: 20px;
  height: 40px;
  font-size: 14px;
}
</style>
