<template>
  <div class="product-card card" @click="$emit('click')">
    <div class="product-image">
      <img :src="product.cover_image" :alt="product.title" />
      <span v-if="product.sales > 100" class="sales-tag">已售{{ formatSales(product.sales) }}</span>
    </div>
    <div class="product-info">
      <div class="product-title text-ellipsis-2">{{ product.title }}</div>
      <div class="product-price">
        <span class="price">¥{{ product.price }}</span>
        <span v-if="product.original_price" class="price-old">¥{{ product.original_price }}</span>
      </div>
      <div class="product-meta">
        <span class="shop">{{ product.shop_name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  product: {
    type: Object,
    required: true
  }
});

defineEmits(['click']);

const formatSales = (sales) => {
  if (sales >= 10000) {
    return (sales / 10000).toFixed(1) + '万';
  }
  return sales;
};
</script>

<style scoped>
.product-card {
  overflow: hidden;
  background: #fff;
  border-radius: 12px;
}

.product-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sales-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(255, 80, 0, 0.9);
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.product-info {
  padding: 10px;
}

.product-title {
  font-size: 13px;
  color: #333;
  line-height: 1.4;
  min-height: 36px;
  margin-bottom: 6px;
}

.product-price {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.price {
  color: #ff4d4f;
  font-size: 16px;
  font-weight: bold;
}

.price-old {
  color: #999;
  font-size: 11px;
  text-decoration: line-through;
}

.product-meta {
  margin-top: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shop {
  font-size: 11px;
  color: #999;
}
</style>
