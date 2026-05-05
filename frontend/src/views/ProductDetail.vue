<template>
  <el-container style="min-height: 100vh;">
    <Header />
    <el-main>
      <el-card v-loading="loading" style="max-width: 1200px; margin: 0 auto;">
        <el-row :gutter="40" v-if="product.id">
          <el-col :span="10">
            <el-image
              :src="product.image_url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=default%20product%20placeholder&image_size=square'"
              :alt="product.name"
              style="width: 100%; height: 400px;"
              fit="contain"
              :preview-src-list="[product.image_url]"
            />
          </el-col>
          <el-col :span="14">
            <h2 style="font-size: 24px; color: #333; margin-bottom: 16px;">{{ product.name }}</h2>
            <div style="background-color: #fff5f5; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <span style="color: #999; font-size: 14px;">售价</span>
              <span style="color: #ff4d4f; font-size: 32px; font-weight: bold; margin-left: 10px;">
                ¥{{ product.price }}
              </span>
            </div>
            <el-descriptions :column="2" border style="margin-bottom: 20px;">
              <el-descriptions-item label="商品分类">{{ product.category_name || '未分类' }}</el-descriptions-item>
              <el-descriptions-item label="库存状态">
                <el-tag :type="product.stock > 0 ? 'success' : 'danger'">
                  {{ product.stock > 0 ? `库存: ${product.stock}件` : '已售罄' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="上架状态">
                <el-tag :type="product.status === 'on_sale' ? 'success' : 'info'">
                  {{ product.status === 'on_sale' ? '热卖中' : '已下架' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
            <div style="margin-bottom: 20px;">
              <span style="color: #999; margin-right: 10px;">购买数量：</span>
              <el-input-number
                v-model="quantity"
                :min="1"
                :max="product.stock"
                size="large"
              />
            </div>
            <div style="margin-bottom: 20px;">
              <el-button
                type="primary"
                size="large"
                @click="handleAddToCart"
                :disabled="product.stock <= 0 || product.status !== 'on_sale'"
              >
                <el-icon><ShoppingCart /></el-icon>
                加入购物车
              </el-button>
              <el-button
                size="large"
                @click="$router.push('/home')"
              >
                继续购物
              </el-button>
            </div>
            <el-divider content-position="left">商品详情</el-divider>
            <div style="color: #666; line-height: 1.8;">
              {{ product.description || '暂无商品描述' }}
            </div>
          </el-col>
        </el-row>
        <el-empty v-else description="商品不存在" />
      </el-card>
    </el-main>
    <el-footer style="background-color: #333; color: #fff; text-align: center; padding: 20px 0;">
      <p>© 2026 网上商城 - 版权所有</p>
    </el-footer>
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import Header from '@/components/Header.vue'
import { getProductById } from '@/api/product'
import { addToCart } from '@/api/cart'
import { useUserStore } from '@/store/user'
import { ShoppingCart } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const product = ref({})
const quantity = ref(1)

const fetchProduct = async () => {
  const id = route.params.id
  if (!id) return

  loading.value = true
  try {
    const res = await getProductById(id)
    if (res.success) {
      product.value = res.data
    }
  } catch (error) {
    console.error('获取商品详情失败', error)
  } finally {
    loading.value = false
  }
}

const handleAddToCart = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  try {
    const res = await addToCart({
      productId: product.value.id,
      quantity: quantity.value
    })
    if (res.success) {
      ElMessage.success('已添加到购物车')
    }
  } catch (error) {
    console.error('添加购物车失败', error)
  }
}

onMounted(() => {
  fetchProduct()
})
</script>
