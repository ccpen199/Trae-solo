import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import request from '@/utils/axios';

export const useCartStore = defineStore('cart', () => {
  const cartItems = ref([]);
  const cartCount = ref(0);

  const selectedItems = computed(() => 
    cartItems.value.filter(item => item.selected === 1 && item.stock > 0)
  );

  const totalAmount = computed(() => 
    selectedItems.value.reduce((sum, item) => sum + (item.show_price || item.price) * item.quantity, 0)
  );

  const totalCount = computed(() => 
    selectedItems.value.reduce((sum, item) => sum + item.quantity, 0)
  );

  const isAllSelected = computed(() => {
    if (cartItems.value.length === 0) return false;
    return cartItems.value.every(item => item.selected === 1 && item.stock > 0);
  });

  const fetchCart = async () => {
    try {
      const res = await request.get('/cart');
      cartItems.value = res.data.items;
      cartCount.value = res.data.totalCount;
      return res;
    } catch (error) {
      throw error;
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    const res = await request.post('/cart/add', { productId, quantity });
    cartCount.value = res.data.cartCount;
    return res;
  };

  const updateCartItem = async (productId, quantity, selected) => {
    const res = await request.put('/cart/update', { productId, quantity, selected });
    return res;
  };

  const removeFromCart = async (productId) => {
    const res = await request.delete('/cart/remove', { data: { productId } });
    return res;
  };

  const toggleSelectAll = async (selected) => {
    const res = await request.put('/cart/select-all', { selected });
    return res;
  };

  const clearCart = () => {
    cartItems.value = [];
    cartCount.value = 0;
  };

  return {
    cartItems,
    cartCount,
    selectedItems,
    totalAmount,
    totalCount,
    isAllSelected,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    toggleSelectAll,
    clearCart
  };
});
