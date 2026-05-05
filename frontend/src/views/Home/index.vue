<template>
  <div class="home-page page-container">
    <div class="home-header">
      <div class="location" @click="showCityPicker = true">
        <van-icon name="location-o" size="16" color="#FF4D4F" />
        <span class="city-name">{{ currentCity || '选择城市' }}</span>
        <van-icon name="arrow-down" size="12" color="#666" />
      </div>
      <div class="search-input" @click="goSearch">
        <van-icon name="search" size="16" color="#999" />
        <span class="placeholder">搜索商品</span>
      </div>
    </div>
    
    <div class="home-content">
      <van-swipe class="banner-swipe" :autoplay="3000" indicator-color="#FF4D4F">
        <van-swipe-item v-for="banner in banners" :key="banner.id" @click="handleBannerClick(banner)">
          <img :src="banner.image" class="banner-image" alt="" />
        </van-swipe-item>
      </van-swipe>
      
      <div class="category-section bg-white rounded-8">
        <van-grid :column-num="5" border="false">
          <van-grid-item 
            v-for="category in categories" 
            :key="category.id"
            @click="goCategory(category.id)"
          >
            <div class="category-icon">{{ category.icon }}</div>
            <span class="category-name">{{ category.name }}</span>
          </van-grid-item>
        </van-grid>
      </div>
      
      <div class="activity-section mt-12">
        <div class="activity-header flex-between">
          <div class="activity-title flex">
            <van-icon name="fire-o" size="18" color="#FF4D4F" />
            <span class="title-text">热销推荐</span>
          </div>
          <div class="more" @click="goSearchWithKeyword('热销')">
            更多 <van-icon name="arrow" size="12" color="#999" />
          </div>
        </div>
        
        <div class="product-list">
          <div 
            v-for="product in hotProducts" 
            :key="product.id" 
            class="product-item"
            :class="{ 'out-of-stock': product.stock <= 0 }"
          >
            <div class="product-card" @click="goProduct(product.id)">
              <img :src="product.image" class="product-image" alt="" />
              <div class="product-info">
                <div class="product-name">{{ product.name }}</div>
                <div class="product-spec">{{ product.spec }}</div>
                <div class="product-price flex-between">
                  <div class="prices">
                    <span class="current-price">{{ product.show_price || product.price }}</span>
                    <span class="original-price">¥{{ product.original_price }}</span>
                    <span v-if="product.vip_price && userStore.isVip" class="vip-price-tag">会员价</span>
                  </div>
                  <van-button 
                    v-if="product.stock > 0"
                    type="primary" 
                    size="mini" 
                    square
                    @click.stop="addToCart(product.id)"
                  >
                    +
                  </van-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="activity-section mt-12">
        <div class="activity-header flex-between">
          <div class="activity-title flex">
            <van-icon name="gift-o" size="18" color="#1890FF" />
            <span class="title-text">限时特惠</span>
          </div>
        </div>
        
        <div class="product-list">
          <div 
            v-for="product in discountProducts" 
            :key="product.id" 
            class="product-item"
            :class="{ 'out-of-stock': product.stock <= 0 }"
          >
            <div class="product-card" @click="goProduct(product.id)">
              <img :src="product.image" class="product-image" alt="" />
              <div class="product-info">
                <div class="product-name">{{ product.name }}</div>
                <div class="product-spec">{{ product.spec }}</div>
                <div class="product-price flex-between">
                  <div class="prices">
                    <span class="current-price">{{ product.show_price || product.price }}</span>
                    <span class="original-price">¥{{ product.original_price }}</span>
                  </div>
                  <van-button 
                    v-if="product.stock > 0"
                    type="primary" 
                    size="mini" 
                    square
                    @click.stop="addToCart(product.id)"
                  >
                    +
                  </van-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="tab-bar bottom-nav safe-bottom">
      <van-tabbar v-model="activeTab" route fixed placeholder>
        <van-tabbar-item to="/home" icon="home-o">首页</van-tabbar-item>
        <van-tabbar-item to="/search" icon="search">搜索</van-tabbar-item>
        <van-tabbar-item to="/cart" icon="shopping-cart-o">
          <template #icon="{ active }">
            <van-badge :content="cartStore.cartCount" :show-zero="false" :max="99">
              <van-icon :name="active ? 'shopping-cart' : 'shopping-cart-o'" size="20" />
            </van-badge>
          </template>
          购物车
        </van-tabbar-item>
        <van-tabbar-item to="/user" icon="user-o">我的</van-tabbar-item>
      </van-tabbar>
    </div>
    
    <van-popup 
      v-model:show="showCityPicker" 
      position="bottom" 
      :round="true"
      :style="{ height: '60%' }"
    >
      <div class="city-picker">
        <div class="picker-header">
          <span class="picker-title">选择城市</span>
          <van-icon name="cross" size="20" @click="showCityPicker = false" />
        </div>
        
        <div class="hot-cities">
          <div class="section-title">热门城市</div>
          <div class="city-grid">
            <div 
              v-for="city in hotCities" 
              :key="city.id" 
              class="city-item"
              @click="selectCity(city)"
            >
              {{ city.name }}
            </div>
          </div>
        </div>
        
        <div class="all-cities">
          <div class="section-title">全部城市</div>
          <div v-for="(cities, province) in citiesByProvince" :key="province">
            <div class="province-name">{{ province }}</div>
            <div class="city-grid">
              <div 
                v-for="city in cities" 
                :key="city.id" 
                class="city-item"
                @click="selectCity(city)"
              >
                {{ city.name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import request from '@/utils/axios';
import { useUserStore } from '@/stores/user';
import { useCartStore } from '@/stores/cart';

const router = useRouter();
const userStore = useUserStore();
const cartStore = useCartStore();

const activeTab = ref(0);
const banners = ref([]);
const categories = ref([]);
const hotProducts = ref([]);
const discountProducts = ref([]);
const currentCity = ref('北京市');
const showCityPicker = ref(false);
const hotCities = ref([]);
const citiesByProvince = ref({});

const goSearch = () => {
  router.push('/search');
};

const goSearchWithKeyword = (keyword) => {
  router.push(`/search?keyword=${encodeURIComponent(keyword)}`);
};

const goCategory = (categoryId) => {
  router.push(`/category/${categoryId}`);
};

const goProduct = (productId) => {
  router.push(`/product/${productId}`);
};

const handleBannerClick = (banner) => {
  if (banner.link_url) {
    showToast('跳转链接: ' + banner.link_url);
  }
};

const addToCart = async (productId) => {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  
  try {
    await cartStore.addToCart(productId, 1);
    showToast('已加入购物车');
  } catch (error) {
    console.error('加入购物车失败:', error);
  }
};

const selectCity = (city) => {
  currentCity.value = city.name;
  showCityPicker.value = false;
  localStorage.setItem('currentCity', city.name);
};

const fetchHomeData = async () => {
  try {
    const [bannersRes, categoriesRes, hotRes, discountRes] = await Promise.all([
      request.get('/home/banners'),
      request.get('/home/categories'),
      request.get('/home/hot-products', { params: { limit: 6 } }),
      request.get('/home/hot-products', { params: { limit: 6 } })
    ]);
    
    banners.value = bannersRes.data;
    categories.value = categoriesRes.data;
    hotProducts.value = hotRes.data;
    discountProducts.value = discountRes.data.slice().reverse();
  } catch (error) {
    console.error('获取首页数据失败:', error);
  }
};

const fetchCities = async () => {
  try {
    const res = await request.get('/address/cities');
    hotCities.value = res.data.hotCities;
    citiesByProvince.value = res.data.citiesByProvince;
  } catch (error) {
    console.error('获取城市列表失败:', error);
  }
};

onMounted(() => {
  const savedCity = localStorage.getItem('currentCity');
  if (savedCity) {
    currentCity.value = savedCity;
  }
  
  fetchHomeData();
  fetchCities();
  
  if (userStore.isLoggedIn) {
    cartStore.fetchCart();
  }
});
</script>

<style lang="less" scoped>
.home-page {
  padding-bottom: 60px;
}

.home-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: linear-gradient(90deg, #FF4D4F 0%, #FF7875 100%);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  
  .location {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #fff;
    font-size: 14px;
    white-space: nowrap;
  }
  
  .search-input {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fff;
    border-radius: 20px;
    padding: 8px 16px;
    
    .placeholder {
      font-size: 14px;
      color: #999;
    }
  }
}

.home-content {
  padding: 12px;
}

.banner-swipe {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
  
  .banner-image {
    width: 100%;
    height: 160px;
    object-fit: cover;
  }
}

.category-section {
  padding: 12px 0;
  
  :deep(.van-grid-item) {
    padding: 8px;
  }
  
  .category-icon {
    font-size: 28px;
    margin-bottom: 4px;
  }
  
  .category-name {
    font-size: 12px;
    color: #333;
  }
}

.activity-section {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  
  .activity-header {
    margin-bottom: 12px;
    
    .activity-title {
      align-items: center;
      gap: 6px;
      
      .title-text {
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }
    }
    
    .more {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: #999;
    }
  }
  
  .product-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    
    .product-item {
      .product-card {
        background: #f9f9f9;
        border-radius: 8px;
        overflow: hidden;
        
        .product-image {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          background: #f5f5f5;
        }
        
        .product-info {
          padding: 8px;
          
          .product-name {
            font-size: 13px;
            color: #333;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .product-spec {
            font-size: 11px;
            color: #999;
            margin-top: 4px;
          }
          
          .product-price {
            margin-top: 6px;
            
            .prices {
              display: flex;
              align-items: baseline;
              
              .current-price {
                font-size: 16px;
                font-weight: 600;
                color: #FF4D4F;
                
                &::before {
                  content: '¥';
                  font-size: 12px;
                }
              }
              
              .original-price {
                font-size: 11px;
                color: #999;
                text-decoration: line-through;
                margin-left: 4px;
              }
              
              .vip-price-tag {
                font-size: 10px;
                background: #FAAD14;
                color: #fff;
                padding: 1px 4px;
                border-radius: 2px;
                margin-left: 4px;
              }
            }
          }
        }
      }
    }
  }
}

.city-picker {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid #eee;
    
    .picker-title {
      font-size: 16px;
      font-weight: 600;
    }
  }
  
  .hot-cities, .all-cities {
    padding: 12px 16px;
    overflow-y: auto;
    
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;
    }
    
    .province-name {
      font-size: 13px;
      color: #666;
      margin: 12px 0 8px;
    }
    
    .city-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      
      .city-item {
        background: #f5f5f5;
        border-radius: 4px;
        padding: 8px;
        text-align: center;
        font-size: 13px;
        color: #333;
        
        &:active {
          background: #eee;
        }
      }
    }
  }
  
  .all-cities {
    flex: 1;
    overflow-y: auto;
  }
}
</style>
