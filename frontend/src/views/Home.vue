<template>
  <el-container style="min-height: 100vh;">
    <Header />
    <el-main>
      <el-row :gutter="20">
        <el-col :span="4">
          <el-card class="category-menu">
            <template #header>
              <span>商品分类</span>
            </template>
            <el-menu
              :default-active="activeCategory"
              background-color="#fff"
              text-color="#333"
              active-text-color="#409eff"
              @select="handleCategorySelect"
            >
              <el-menu-item index="">
                <el-icon><Grid /></el-icon>
                <span>全部商品</span>
              </el-menu-item>
              <el-menu-item
                v-for="category in categories"
                :key="category.id"
                :index="String(category.id)"
              >
                <el-icon><Document /></el-icon>
                <span>{{ category.name }}</span>
              </el-menu-item>
            </el-menu>
          </el-card>
        </el-col>
        <el-col :span="20">
          <el-card v-if="keyword" style="margin-bottom: 20px;">
            <span>搜索关键词：<strong style="color: #409eff;">{{ keyword }}</strong></span>
            <el-button text type="primary" @click="clearSearch">清除搜索</el-button>
          </el-card>
          
          <el-row :gutter="20" v-loading="loading">
            <el-col :span="6" v-for="product in products" :key="product.id" style="margin-bottom: 20px;">
              <el-card class="product-card" shadow="hover">
                <div style="text-align: center; cursor: pointer;" @click="goToDetail(product.id)">
                  <img 
                    :src="product.image_url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=default%20product%20placeholder&image_size=square'" 
                    :alt="product.name"
                    class="product-image"
                  />
                </div>
                <div style="margin-top: 12px;">
                  <p 
                    class="product-name" 
                    style="font-size: 14px; color: #333; margin-bottom: 8px; cursor: pointer;"
                    @click="goToDetail(product.id)"
                  >
                    {{ product.name }}
                  </p>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="price">¥{{ product.price }}</span>
                    <span style="color: #999; font-size: 12px;">库存: {{ product.stock }}</span>
                  </div>
                  <el-button 
                    type="primary" 
                    style="width: 100%; margin-top: 10px;"
                    @click="handleAddToCart(product)"
                    :disabled="product.stock <= 0"
                  >
                    加入购物车
                  </el-button>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <el-pagination
            v-if="total > 0"
            style="margin-top: 20px; text-align: center;"
            background
            layout="prev, pager, next, jumper, ->, total"
            :current-page="page"
            :page-size="pageSize"
            :total="total"
            @current-change="handlePageChange"
          />

          <el-empty v-if="!loading && products.length === 0" description="暂无商品" />
        </el-col>
      </el-row>
    </el-main>
    <el-footer style="background-color: #333; color: #fff; text-align: center; padding: 20px 0;">
      <p>© 2026 网上商城 - 版权所有</p>
    </el-footer>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import Header from '@/components/Header.vue'
import { getProducts, getCategories } from '@/api/product'
import { addToCart } from '@/api/cart'
import { useUserStore } from '@/store/user'
import { Grid, Document } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const products = ref([])
const categories = ref([])
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)
const activeCategory = ref('')

const keyword = computed(() => route.query.keyword || '')
const categoryId = computed(() => route.query.categoryId || '')

const fetchCategories = async () => {
  try {
    const res = await getCategories()
    if (res.success) {
      categories.value = res.data
    }
  } catch (error) {
    console.error('获取分类失败', error)
  }
}

const fetchProducts = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value
    }
    if (keyword.value) {
      params.keyword = keyword.value
    }
    if (categoryId.value) {
      params.categoryId = categoryId.value
    }

    const res = await getProducts(params)
    if (res.success) {
      products.value = res.data.products
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取商品列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleCategorySelect = (index) => {
  activeCategory.value = index
  page.value = 1
  if (index) {
    router.push({ path: '/home', query: { categoryId: index } })
  } else {
    const query = { ...route.query }
    delete query.categoryId
    router.push({ path: '/home', query })
  }
}

const handlePageChange = (newPage) => {
  page.value = newPage
  fetchProducts()
}

const clearSearch = () => {
  const query = { ...route.query }
  delete query.keyword
  router.push({ path: '/home', query })
}

const goToDetail = (id) => {
  router.push(`/product/${id}`)
}

const handleAddToCart = async (product) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  try {
    const res = await addToCart({ productId: product.id, quantity: 1 })
    if (res.success) {
      ElMessage.success('已添加到购物车')
    }
  } catch (error) {
    console.error('添加购物车失败', error)
  }
}

watch(() => [route.query.keyword, route.query.categoryId], () => {
  page.value = 1
  activeCategory.value = categoryId.value || ''
  fetchProducts()
})

onMounted(() => {
  activeCategory.value = categoryId.value || ''
  fetchCategories()
  fetchProducts()
})
</script>
