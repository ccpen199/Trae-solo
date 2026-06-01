<template>
  <div class="product-detail">
    <van-nav-bar title="商品详情" left-arrow @click-left="goBack" fixed placeholder />
    
    <div class="swiper-container">
      <van-swipe :autoplay="3000" indicator-color="#ff6b35">
        <van-swipe-item v-for="(img, idx) in product.images" :key="idx">
          <img :src="img" class="product-banner" />
        </van-swipe-item>
      </van-swipe>
    </div>

    <div class="product-info">
      <div class="price-row">
        <span class="price">¥{{ product.price }}</span>
        <span class="original-price" v-if="product.original_price > product.price">¥{{ product.original_price }}</span>
        <span class="sales">已售{{ product.sales }}</span>
      </div>
      <div class="name">{{ product.name }}</div>
      <div class="desc">{{ product.description }}</div>
    </div>

    <van-cell-group inset class="spec-group">
      <van-cell title="规格参数" is-link @click="showSpecs = true" />
      <van-cell title="售后说明" is-link @click="showAfterSale = true" />
    </van-cell-group>

    <div class="detail-content">
      <div class="section-title">商品详情</div>
      <div class="content-text">{{ product.content }}</div>
    </div>

    <div class="bottom-bar">
      <div class="cart-btn" @click="goCart">
        <van-icon name="shopping-cart-o" size="22" />
        <span>购物车</span>
      </div>
      <div class="add-cart-btn" @click="handleAddCart">加入购物车</div>
      <div class="buy-btn" @click="handleBuy">立即预订</div>
    </div>

    <van-popup v-model="showQuantity" position="bottom">
      <div class="quantity-popup">
        <div class="popup-title">选择数量</div>
        <div class="quantity-row">
          <span>数量</span>
          <van-stepper v-model="quantity" :min="1" :max="product.stock || 10" />
        </div>
        <van-button type="primary" block round class="confirm-btn" @click="confirmAddCart">
          确定
        </van-button>
      </div>
    </van-popup>

    <van-popup v-model="showSpecs" position="bottom">
      <div class="spec-popup">
        <div class="popup-title">规格参数</div>
        <div class="spec-list" v-if="product.specs?.length">
          <div class="spec-item" v-for="(spec, idx) in product.specs" :key="idx">
            <span class="spec-name">{{ spec.name }}</span>
            <span class="spec-value">{{ spec.value }}</span>
          </div>
        </div>
        <van-button type="primary" block round class="confirm-btn" @click="showSpecs = false">
          关闭
        </van-button>
      </div>
    </van-popup>

    <van-popup v-model="showAfterSale" position="bottom">
      <div class="spec-popup">
        <div class="popup-title">售后说明</div>
        <div class="after-sale-content">{{ product.after_sale || '入住前一天可免费取消，入住当天取消收取50%费用' }}</div>
        <van-button type="primary" block round class="confirm-btn" @click="showAfterSale = false">
          关闭
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCartStore } from '@/store/cart';
import { showToast } from 'vant';
import request from '@/utils/request';

const router = useRouter();
const route = useRoute();
const cartStore = useCartStore();

const product = ref({ images: [], specs: [] });
const quantity = ref(1);
const showQuantity = ref(false);
const showSpecs = ref(false);
const showAfterSale = ref(false);

const getProductDetail = async () => {
  const id = route.params.id;
  const res = await request.get(`/products/${id}`);
  product.value = res;
};

const goBack = () => {
  router.back();
};

const goCart = () => {
  router.push('/cart');
};

const handleAddCart = () => {
  if (!localStorage.getItem('token')) {
    router.push('/login?redirect=' + encodeURIComponent(route.fullPath));
    return;
  }
  showQuantity.value = true;
};

const confirmAddCart = async () => {
  await cartStore.addToCart(product.value.id, quantity.value);
  showQuantity.value = false;
  showToast('已加入购物车');
};

const handleBuy = async () => {
  if (!localStorage.getItem('token')) {
    router.push('/login?redirect=' + encodeURIComponent(route.fullPath));
    return;
  }
  await cartStore.addToCart(product.value.id, 1);
  router.push('/cart');
};

onMounted(() => {
  getProductDetail();
});
</script>

<style scoped lang="less">
.product-detail {
  padding-bottom: 70px;
  min-height: 100vh;
  background: #f7f8fa;
}

.swiper-container {
  width: 100%;
  height: 375px;
  background: #fff;
}

.product-banner {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 15px;
  background: #fff;
  position: relative;
  z-index: 10;
}

.price-row {
  display: flex;
  align-items: baseline;
  margin-bottom: 10px;
}

.price {
  color: #ff6b35;
  font-size: 24px;
  font-weight: 600;
}

.original-price {
  color: #999;
  font-size: 14px;
  text-decoration: line-through;
  margin: 0 10px;
}

.sales {
  color: #999;
  font-size: 12px;
  margin-left: auto;
}

.name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.desc {
  font-size: 14px;
  color: #666;
}

.spec-group {
  margin: 10px 0;
}

.detail-content {
  padding: 15px;
  background: #fff;
  margin-top: 10px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
}

.content-text {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 10px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.cart-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px;
  font-size: 12px;
  color: #666;
}

.add-cart-btn {
  flex: 1;
  height: 40px;
  line-height: 40px;
  text-align: center;
  background: #ffb800;
  color: #fff;
  border-radius: 20px 0 0 20px;
  font-size: 14px;
}

.buy-btn {
  flex: 1;
  height: 40px;
  line-height: 40px;
  text-align: center;
  background: #ff6b35;
  color: #fff;
  border-radius: 0 20px 20px 0;
  font-size: 14px;
}

.quantity-popup, .spec-popup {
  padding: 20px;
  min-height: 200px;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
}

.quantity-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  margin-bottom: 20px;
}

.confirm-btn {
  height: 44px;
}

.spec-list {
  margin-bottom: 20px;
}

.spec-item {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.spec-name {
  width: 100px;
  color: #666;
}

.spec-value {
  flex: 1;
}

.after-sale-content {
  padding: 15px 0;
  color: #666;
  line-height: 1.6;
}
</style>
