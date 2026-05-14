<template>
  <div class="cart page-container">
    <div class="header">
      <div class="header-title">购物车</div>
      <div class="edit-btn" @click="isEditing = !isEditing">
        {{ isEditing ? '完成' : '管理' }}
      </div>
    </div>

    <div v-if="cartItems.length > 0" class="cart-content">
      <div v-for="item in cartItems" :key="item.id" class="cart-item card">
        <div class="checkbox" @click="toggleSelect(item)">
          <span :class="{ checked: item.selected }">{{ item.selected ? '✓' : '' }}</span>
        </div>
        
        <img :src="item.cover_image" class="product-image" @click="goDetail(item.product_id)" />
        
        <div class="product-info">
          <div class="product-title text-ellipsis-2" @click="goDetail(item.product_id)">{{ item.title }}</div>
          <div class="shop">{{ item.shop_name }}</div>
          <div class="price-row">
            <span class="price">¥{{ item.price }}</span>
            <span v-if="item.original_price" class="price-old">¥{{ item.original_price }}</span>
          </div>
          <div class="quantity-control">
            <button class="qty-btn" @click="updateQuantity(item, -1)" :disabled="item.quantity <= 1">-</button>
            <span class="qty-value">{{ item.quantity }}</span>
            <button class="qty-btn" @click="updateQuantity(item, 1)" :disabled="item.quantity >= item.stock">+</button>
          </div>
        </div>

        <div v-if="isEditing" class="delete-btn" @click="deleteItem(item.id)">
          🗑️
        </div>
      </div>

      <div class="recommend-section">
        <div class="section-title">猜你喜欢</div>
        <div class="product-grid">
          <ProductCard 
            v-for="product in recommendProducts" 
            :key="product.id" 
            :product="product"
            @click="goDetail(product.id)"
          />
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="icon">🛒</div>
      <div class="text">购物车空空如也</div>
      <button class="btn btn-primary mt-12" @click="goShopping">去逛逛</button>
    </div>

    <div v-if="cartItems.length > 0" class="bottom-bar safe-area-bottom">
      <div class="select-all" @click="toggleSelectAll">
        <span class="checkbox" :class="{ checked: isAllSelected }">{{ isAllSelected ? '✓' : '' }}</span>
        <span>全选</span>
      </div>
      
      <div class="total-section">
        <div class="total-text">
          合计：<span class="price">¥{{ totalPrice.toFixed(2) }}</span>
        </div>
      </div>
      
      <button 
        class="btn btn-primary checkout-btn"
        :disabled="selectedItems.length === 0"
        @click="goCheckout"
      >
        {{ isEditing ? '删除' : `结算(${selectedItems.length})` }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, inject } from 'vue';
import { useRouter } from 'vue-router';
import { orderApi, productApi } from '../api';
import ProductCard from '../components/ProductCard.vue';

const router = useRouter();
const showToast = inject('showToast');

const cartItems = ref([]);
const isEditing = ref(false);
const recommendProducts = ref([]);

const isAllSelected = computed(() => {
  return cartItems.value.length > 0 && cartItems.value.every(item => item.selected);
});

const selectedItems = computed(() => {
  return cartItems.value.filter(item => item.selected);
});

const totalPrice = computed(() => {
  return selectedItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

const fetchCart = async () => {
  try {
    const res = await orderApi.getCart();
    if (res.code === 200) {
      cartItems.value = res.data;
    }
  } catch (e) {
    console.error(e);
  }
};

const fetchRecommend = async () => {
  try {
    const res = await productApi.getRecommend({ page: 1, pageSize: 4 });
    if (res.code === 200) {
      recommendProducts.value = res.data.list;
    }
  } catch (e) {
    console.error(e);
  }
};

const toggleSelect = (item) => {
  item.selected = !item.selected;
  updateCart(item);
};

const toggleSelectAll = () => {
  const newValue = !isAllSelected.value;
  cartItems.value.forEach(item => {
    item.selected = newValue;
    updateCart(item);
  });
};

const updateCart = async (item) => {
  try {
    await orderApi.updateCart(item.id, {
      quantity: item.quantity,
      selected: item.selected
    });
  } catch (e) {
    console.error(e);
  }
};

const updateQuantity = async (item, delta) => {
  const newQty = item.quantity + delta;
  if (newQty < 1 || newQty > item.stock) return;
  
  item.quantity = newQty;
  updateCart(item);
};

const deleteItem = async (id) => {
  try {
    await orderApi.removeFromCart(id);
    cartItems.value = cartItems.value.filter(item => item.id !== id);
    showToast('已删除');
  } catch (e) {
    console.error(e);
  }
};

const goCheckout = () => {
  if (selectedItems.value.length === 0) {
    showToast('请选择商品');
    return;
  }
  
  router.push({
    path: '/checkout',
    query: { items: JSON.stringify(selectedItems.value) }
  });
};

const goDetail = (id) => {
  router.push(`/product/${id}`);
};

const goShopping = () => {
  router.push('/');
};

onMounted(() => {
  fetchCart();
  fetchRecommend();
});

onActivated(() => {
  fetchCart();
});
</script>

<style scoped>
.cart {
  background: #f5f5f5;
  padding-bottom: 70px;
}

.header {
  position: sticky;
  top: 0;
  background: #fff;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  z-index: 100;
}

.header-title {
  font-size: 16px;
  font-weight: bold;
}

.edit-btn {
  font-size: 14px;
  color: #ff5000;
}

.cart-content {
  padding: 12px;
}

.cart-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  margin-bottom: 12px;
  gap: 12px;
  position: relative;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 1px solid #ccc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
  margin-top: 40px;
  flex-shrink: 0;
}

.checkbox.checked {
  background: #ff5000;
  border-color: #ff5000;
}

.product-image {
  width: 90px;
  height: 90px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-title {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  margin-bottom: 6px;
}

.shop {
  font-size: 11px;
  color: #999;
  margin-bottom: 8px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}

.price {
  color: #ff4d4f;
  font-weight: bold;
  font-size: 16px;
}

.price-old {
  color: #999;
  font-size: 12px;
  text-decoration: line-through;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qty-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn:disabled {
  opacity: 0.5;
}

.qty-value {
  font-size: 14px;
  min-width: 30px;
  text-align: center;
}

.delete-btn {
  position: absolute;
  right: 12px;
  top: 12px;
  font-size: 20px;
  padding: 4px;
}

.recommend-section {
  margin-top: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  padding: 12px 4px;
  border-left: 3px solid #ff5000;
  padding-left: 8px;
  margin-bottom: 12px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  text-align: center;
}

.empty-state .icon {
  font-size: 80px;
  margin-bottom: 16px;
}

.empty-state .text {
  color: #999;
  font-size: 14px;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid #eee;
  z-index: 100;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.select-all .checkbox {
  margin-top: 0;
}

.total-section {
  flex: 1;
  text-align: right;
  margin-right: 12px;
}

.total-text {
  font-size: 14px;
}

.total-text .price {
  font-size: 18px;
}

.checkout-btn {
  height: 40px;
  padding: 0 24px;
  font-weight: bold;
}

.checkout-btn:disabled {
  opacity: 0.5;
}
</style>
