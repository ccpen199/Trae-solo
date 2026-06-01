<template>
  <div class="cart">
    <van-nav-bar title="购物车" fixed placeholder />

    <div class="cart-list" v-if="cartStore.list.length > 0">
      <div class="cart-item" v-for="item in cartStore.list" :key="item.id">
        <van-checkbox v-model="item.selected" @change="updateItem(item)" />
        <img :src="item.images?.[0]" :alt="item.name" class="item-img" @click="goDetail(item.product_id)" />
        <div class="item-info">
          <div class="item-name" @click="goDetail(item.product_id)">{{ item.name }}</div>
          <div class="item-price">¥{{ item.price }}</div>
          <van-stepper v-model="item.quantity" :min="1" :max="10" size="small" @change="updateQuantity(item)" />
        </div>
        <van-icon name="cross" class="delete-btn" @click="deleteItem(item.id)" />
      </div>
    </div>

    <div class="empty" v-else>
      <van-empty description="购物车是空的" />
      <van-button type="primary" round class="go-btn" @click="router.push('/home')">
        去逛逛
      </van-button>
    </div>

    <div class="bottom-bar" v-if="cartStore.list.length > 0">
      <div class="select-all">
        <van-checkbox v-model="selectAll" @change="handleSelectAll">全选</van-checkbox>
      </div>
      <div class="total">
        <span>合计：</span>
        <span class="total-price">¥{{ totalAmount.toFixed(2) }}</span>
      </div>
      <van-button type="primary" round class="checkout-btn" :disabled="selectedCount === 0" @click="goCheckout">
        结算({{ selectedCount }})
      </van-button>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/store/cart';
import { showToast, showConfirmDialog } from 'vant';
import TabBar from '@/components/TabBar.vue';

const router = useRouter();
const cartStore = useCartStore();

const selectAll = ref(false);

const selectedItems = computed(() => cartStore.list.filter(item => item.selected));
const selectedCount = computed(() => selectedItems.value.reduce((sum, item) => sum + item.quantity, 0));
const totalAmount = computed(() => selectedItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0));

const updateItem = async (item) => {
  await cartStore.updateCartItem(item.id, { selected: item.selected ? 1 : 0 });
  selectAll.value = cartStore.list.every(item => item.selected);
};

const updateQuantity = async (item) => {
  await cartStore.updateCartItem(item.id, { quantity: item.quantity });
};

const deleteItem = async (id) => {
  try {
    await showConfirmDialog({ title: '提示', message: '确定删除该商品吗？' });
    await cartStore.removeFromCart(id);
    showToast('删除成功');
  } catch {
    // 取消删除
  }
};

const handleSelectAll = async () => {
  await cartStore.toggleSelectAll(selectAll.value ? 1 : 0);
};

const goDetail = (id) => {
  router.push(`/product/${id}`);
};

const goCheckout = () => {
  if (selectedCount.value === 0) {
    showToast('请选择商品');
    return;
  }
  const selectedIds = selectedItems.value.map(item => item.id);
  router.push({ path: '/order-confirm', query: { cartIds: selectedIds.join(',') } });
};

onMounted(() => {
  cartStore.getCart();
});
</script>

<style scoped lang="less">
.cart {
  min-height: 100vh;
  padding-bottom: 110px;
}

.cart-list {
  padding: 10px;
}

.cart-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
}

.item-img {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  object-fit: cover;
  margin: 0 12px;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-price {
  color: #ff6b35;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.delete-btn {
  padding: 8px;
  color: #999;
}

.empty {
  padding-top: 100px;
  text-align: center;
}

.go-btn {
  margin-top: 20px;
  width: 150px;
}

.bottom-bar {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  height: 56px;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 15px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.select-all {
  margin-right: 20px;
}

.total {
  flex: 1;
  text-align: right;
  font-size: 14px;
}

.total-price {
  color: #ff6b35;
  font-size: 18px;
  font-weight: 600;
}

.checkout-btn {
  width: 100px;
  margin-left: 15px;
}
</style>
