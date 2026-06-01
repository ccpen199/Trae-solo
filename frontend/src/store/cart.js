import { defineStore } from 'pinia';
import request from '@/utils/request';

export const useCartStore = defineStore('cart', {
  state: () => ({
    list: [],
    selectedIds: []
  }),

  getters: {
    cartCount: (state) => state.list.reduce((sum, item) => sum + item.quantity, 0),
    selectedItems: (state) => state.list.filter(item => item.selected),
    selectedTotal: (state) => {
      return state.list
        .filter(item => item.selected)
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
    }
  },

  actions: {
    async getCart() {
      const res = await request.get('/cart');
      this.list = res;
      this.selectedIds = res.filter(item => item.selected).map(item => item.id);
      return res;
    },

    async addToCart(productId, quantity = 1) {
      await request.post('/cart', { product_id: productId, quantity });
      await this.getCart();
    },

    async updateCartItem(id, data) {
      await request.put('/cart', { id, ...data });
      await this.getCart();
    },

    async removeFromCart(id) {
      await request.delete('/cart', { data: { id } });
      await this.getCart();
    },

    async toggleSelectAll(selected) {
      await request.post('/cart/select-all', { selected: selected ? 1 : 0 });
      await this.getCart();
    }
  }
});
