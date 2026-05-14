<template>
  <div class="category page-container">
    <div class="search-bar-wrapper">
      <div class="search-bar" @click="goSearch">
        <span class="search-icon">🔍</span>
        <span class="search-placeholder">搜索商品</span>
      </div>
    </div>

    <div class="category-content">
      <div class="category-sidebar">
        <div 
          v-for="(cat, index) in categories" 
          :key="cat.id"
          class="sidebar-item"
          :class="{ active: activeIndex === index }"
          @click="selectCategory(index)"
        >
          <span class="cat-icon">{{ cat.icon }}</span>
          <span class="cat-name">{{ cat.name }}</span>
        </div>
      </div>

      <div class="category-content-right">
        <div v-if="currentCategory" class="category-header">
          <span class="cat-name">{{ currentCategory.name }}</span>
        </div>

        <div class="product-grid">
          <ProductCard 
            v-for="product in products" 
            :key="product.id" 
            :product="product"
            @click="goDetail(product.id)"
          />
        </div>

        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="products.length === 0" class="empty-state">
          <div class="icon">📦</div>
          <div>暂无商品</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { productApi } from '../api';
import ProductCard from '../components/ProductCard.vue';

const router = useRouter();

const categories = ref([]);
const products = ref([]);
const activeIndex = ref(0);
const loading = ref(false);

const currentCategory = computed(() => {
  return categories.value[activeIndex.value];
});

const fetchCategories = async () => {
  try {
    const res = await productApi.getCategories();
    if (res.code === 200) {
      categories.value = res.data;
      if (categories.value.length > 0) {
        fetchProducts();
      }
    }
  } catch (e) {
    console.error(e);
  }
};

const fetchProducts = async () => {
  if (!currentCategory.value) return;
  
  loading.value = true;
  
  try {
    const res = await productApi.getList({
      categoryId: currentCategory.value.id,
      page: 1,
      pageSize: 20
    });
    if (res.code === 200) {
      products.value = res.data.list;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const selectCategory = (index) => {
  activeIndex.value = index;
  products.value = [];
  fetchProducts();
};

const goSearch = () => {
  router.push('/search');
};

const goDetail = (id) => {
  router.push(`/product/${id}`);
};

onMounted(() => {
  fetchCategories();
});
</script>

<style scoped>
.category {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-bottom: 60px;
  background: #f5f5f5;
}

.search-bar-wrapper {
  background: linear-gradient(to right, #ff5000, #ff6b00);
  padding: 12px 16px;
}

.search-bar {
  background: #fff;
  border-radius: 20px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-icon {
  color: #999;
}

.search-placeholder {
  color: #999;
  font-size: 14px;
}

.category-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.category-sidebar {
  width: 90px;
  background: #f5f5f5;
  overflow-y: auto;
  flex-shrink: 0;
}

.sidebar-item {
  padding: 16px 8px;
  text-align: center;
  position: relative;
  background: #f5f5f5;
}

.sidebar-item.active {
  background: #fff;
}

.sidebar-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: #ff5000;
  border-radius: 0 2px 2px 0;
}

.cat-icon {
  display: block;
  font-size: 24px;
  margin-bottom: 6px;
}

.cat-name {
  font-size: 12px;
  color: #333;
  line-height: 1.4;
}

.category-content-right {
  flex: 1;
  background: #fff;
  padding: 12px;
  overflow-y: auto;
}

.category-header {
  margin-bottom: 12px;
}

.category-header .cat-name {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  border-left: 3px solid #ff5000;
  padding-left: 8px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.loading, .empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

.empty-state .icon {
  font-size: 48px;
  margin-bottom: 12px;
}
</style>
