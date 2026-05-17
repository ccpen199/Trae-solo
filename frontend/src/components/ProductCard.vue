<template>
  <div class="product-card card" @click="goToDetail">
    <div class="product-image">
      <img :src="productImage" :alt="product.name" />
      <div v-if="product.original_price" class="discount-tag">
        {{ Math.round((1 - product.price / product.original_price) * 100) }}%OFF
      </div>
    </div>
    <div class="product-info">
      <h3 class="product-name">{{ product.name }}</h3>
      <p class="product-desc">{{ product.description }}</p>
      <div class="product-price">
        <span class="current-price">¥{{ product.price.toFixed(2) }}</span>
        <span v-if="product.original_price" class="original-price">
          ¥{{ product.original_price.toFixed(2) }}
        </span>
      </div>
      <div class="product-footer">
        <span class="sales-count">已售{{ product.sales_count || 0 }}</span>
        <el-button type="primary" size="small" @click.stop="addToCart">
          加入购物车
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const productImage = computed(() => {
  const images = props.product.images || []
  return images[0] || 'https://picsum.photos/400/400'
})

const goToDetail = () => {
  router.push(`/product/${props.product.id}`)
}

const addToCart = () => {
  ElMessage.success('已加入购物车')
}
</script>

<style lang="scss" scoped>
.product-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .product-image {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }

    &:hover img {
      transform: scale(1.05);
    }

    .discount-tag {
      position: absolute;
      top: 10px;
      left: 10px;
      background: linear-gradient(135deg, #ff2442 0%, #ff6b6b 100%);
      color: #fff;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
  }

  .product-info {
    padding: 12px;

    .product-name {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 6px 0;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }

    .product-desc {
      font-size: 12px;
      color: #999;
      margin: 0 0 8px 0;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }

    .product-price {
      margin-bottom: 10px;

      .current-price {
        font-size: 18px;
        font-weight: 700;
        color: #ff2442;
        margin-right: 8px;
      }

      .original-price {
        font-size: 12px;
        color: #999;
        text-decoration: line-through;
      }
    }

    .product-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .sales-count {
        font-size: 12px;
        color: #999;
      }
    }
  }
}
</style>
