<template>
  <div class="category">
    <van-nav-bar title="分类" fixed placeholder />
    
    <div class="content">
      <div class="sidebar">
        <div 
          class="sidebar-item" 
          v-for="cat in categories" 
          :key="cat.id"
          :class="{ active: activeCategory === cat.id }"
          @click="selectCategory(cat.id)"
        >
          <span class="icon">{{ cat.icon }}</span>
          <span class="name">{{ cat.name }}</span>
        </div>
      </div>

      <div class="main">
        <div class="product-item" v-for="item in products" :key="item.id" @click="goDetail(item.id)">
          <img :src="item.images?.[0]" :alt="item.name" class="product-img" />
          <div class="product-info">
            <div class="product-name">{{ item.name }}</div>
            <div class="product-desc">{{ item.description }}</div>
            <div class="product-price">
              <span class="price">¥{{ item.price }}</span>
              <span class="original-price" v-if="item.original_price > item.price">¥{{ item.original_price }}</span>
            </div>
          </div>
        </div>
        <div class="empty" v-if="products.length === 0">
          <van-empty description="暂无商品" />
        </div>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import request from '@/utils/request';
import TabBar from '@/components/TabBar.vue';

const router = useRouter();
const categories = ref([]);
const products = ref([]);
const activeCategory = ref(null);

const getCategories = async () => {
  const res = await request.get('/categories');
  categories.value = res;
  if (res.length > 0) {
    activeCategory.value = res[0].id;
    getProducts(res[0].id);
  }
};

const getProducts = async (categoryId) => {
  const res = await request.get('/products', { params: { category_id: categoryId } });
  products.value = res.list || [];
};

const selectCategory = (id) => {
  activeCategory.value = id;
  getProducts(id);
};

const goDetail = (id) => {
  router.push(`/product/${id}`);
};

onMounted(() => {
  getCategories();
});
</script>

<style scoped lang="less">
.category {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding-bottom: 50px;
}

.sidebar {
  width: 90px;
  background: #f8f8f8;
  overflow-y: auto;
}

.sidebar-item {
  padding: 15px 10px;
  text-align: center;
  border-left: 3px solid transparent;
  
  &.active {
    background: #fff;
    border-left-color: #ff6b35;
    color: #ff6b35;
  }
}

.sidebar-item .icon {
  font-size: 20px;
  display: block;
  margin-bottom: 5px;
}

.sidebar-item .name {
  font-size: 12px;
}

.main {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background: #fff;
}

.product-item {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.product-img {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  object-fit: cover;
}

.product-info {
  flex: 1;
  margin-left: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-name {
  font-size: 15px;
  font-weight: 500;
}

.product-desc {
  font-size: 12px;
  color: #999;
}

.product-price {
  .price {
    color: #ff6b35;
    font-size: 16px;
    font-weight: 600;
  }
  .original-price {
    color: #999;
    font-size: 12px;
    text-decoration: line-through;
    margin-left: 6px;
  }
}

.empty {
  padding-top: 50px;
}
</style>
