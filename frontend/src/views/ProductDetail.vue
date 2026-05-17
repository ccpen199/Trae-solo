<template>
  <div class="product-detail">
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <el-icon :size="48"><Warning /></el-icon>
      <p>{{ error }}</p>
      <el-button type="primary" @click="fetchProduct">重试</el-button>
    </div>
    
    <div v-else-if="product" class="detail-container">
      <div class="product-images">
        <el-image 
          :src="product.cover_image" 
          fit="cover"
          :preview-src-list="[product.cover_image]"
          class="main-image"
        />
      </div>
      
      <div class="product-info">
        <div class="category-tag">{{ product.category_name }}</div>
        <h1 class="product-name">{{ product.name }}</h1>
        <p class="product-desc">{{ product.description }}</p>
        
        <div class="price-section">
          <span class="current-price">¥{{ product.price }}</span>
          <span v-if="product.original_price" class="original-price">¥{{ product.original_price }}</span>
        </div>
        
        <div class="stock-info">
          <span class="stock" :class="{ 'out-of-stock': product.stock <= 0 }">
            {{ product.stock > 0 ? `库存 ${product.stock} 件` : '暂时缺货' }}
          </span>
          <span class="sales">已售 {{ product.sales_count || 0 }}</span>
        </div>
        
        <div class="action-buttons">
          <el-button 
            type="primary" 
            size="large" 
            class="add-cart-btn"
            :disabled="product.stock <= 0"
            @click="addToCart"
          >
            <el-icon><ShoppingCart /></el-icon>
            加入购物车
          </el-button>
          <el-button 
            type="danger" 
            size="large" 
            class="buy-btn"
            :disabled="product.stock <= 0"
            @click="buyNow"
          >
            立即购买
          </el-button>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-container">
      <el-icon :size="64"><Document /></el-icon>
      <p>商品不存在</p>
      <el-button type="primary" @click="$router.push('/shop')">返回商城</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, Warning, Document, ShoppingCart } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(true)
const error = ref('')
const product = ref(null)

const fetchProduct = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await request.get(`/api/products/${route.params.id}`)
    if (res.success) {
      product.value = res.data
    } else {
      error.value = res.message || '加载失败'
    }
  } catch (err) {
    error.value = err.message || '网络错误'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

const addToCart = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  try {
    const res = await request.post('/api/cart', {
      product_id: product.value.id,
      quantity: 1
    })
    if (res.success) {
      ElMessage.success('已加入购物车')
    } else {
      ElMessage.error(res.message || '添加失败')
    }
  } catch (err) {
    ElMessage.error('添加失败')
  }
}

const buyNow = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  try {
    const res = await request.post('/api/orders', {
      items: [{ product_id: product.value.id, quantity: 1 }]
    })
    if (res.success) {
      ElMessage.success('下单成功')
      router.push('/orders')
    } else {
      ElMessage.error(res.message || '下单失败')
    }
  } catch (err) {
    ElMessage.error('下单失败')
  }
}

onMounted(() => {
  fetchProduct()
})
</script>

<style scoped lang="scss">
.product-detail {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  
  .loading-container,
  .error-container,
  .empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    color: #999;
    
    .el-icon {
      margin-bottom: 16px;
      color: #c0c4cc;
    }
    
    p {
      margin: 8px 0;
    }
  }
  
  .detail-container {
    display: flex;
    gap: 40px;
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    
    .product-images {
      flex: 1;
      
      .main-image {
        width: 100%;
        max-width: 500px;
        aspect-ratio: 1;
        border-radius: 8px;
        object-fit: cover;
      }
    }
    
    .product-info {
      flex: 1;
      
      .category-tag {
        display: inline-block;
        background: #f5f5f5;
        color: #666;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 12px;
        margin-bottom: 16px;
      }
      
      .product-name {
        font-size: 24px;
        font-weight: 600;
        margin: 0 0 16px 0;
        color: #333;
        line-height: 1.4;
      }
      
      .product-desc {
        color: #666;
        line-height: 1.6;
        margin-bottom: 24px;
      }
      
      .price-section {
        margin-bottom: 24px;
        
        .current-price {
          font-size: 32px;
          font-weight: 700;
          color: #ff2442;
          margin-right: 12px;
        }
        
        .original-price {
          font-size: 16px;
          color: #999;
          text-decoration: line-through;
        }
      }
      
      .stock-info {
        display: flex;
        gap: 24px;
        margin-bottom: 32px;
        font-size: 14px;
        color: #666;
        
        .stock.out-of-stock {
          color: #ff2442;
        }
      }
      
      .action-buttons {
        display: flex;
        gap: 16px;
        
        .add-cart-btn,
        .buy-btn {
          flex: 1;
          height: 48px;
          font-size: 16px;
          border-radius: 24px;
        }
        
        .add-cart-btn {
          background: linear-gradient(135deg, #ff2442, #ff6b81);
          border: none;
        }
        
        .buy-btn {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border: none;
        }
      }
    }
  }
}
</style>
