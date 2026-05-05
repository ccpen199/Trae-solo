<template>
  <div class="home-page">
    <div class="header-search" @click="goSearch">
      <van-icon name="search" size="16" color="#969799" />
      <span class="search-placeholder">搜索商品</span>
    </div>

    <van-swipe
      class="banner-swipe"
      :autoplay="3000"
      indicator-color="rgba(255,255,255,0.6)"
      indicator-active-color="#fff"
    >
      <van-swipe-item
        v-for="item in homeData.banners"
        :key="item.id"
        @click="handleBannerClick(item)"
      >
        <img :src="item.image" class="banner-image" :alt="item.title" />
      </van-swipe-item>
    </van-swipe>

    <div class="quick-actions">
      <div class="action-item" @click="goScan">
        <div class="action-icon scan">
          <van-icon name="scan" size="24" color="#fff" />
        </div>
        <span>扫描购</span>
      </div>
      <div class="action-item" @click="goFuel">
        <div class="action-icon fuel">
          <van-icon name="new-fire-o" size="24" color="#fff" />
        </div>
        <span>一键加油</span>
      </div>
      <div class="action-item" @click="goWallet">
        <div class="action-icon wallet">
          <van-icon name="balance-pay" size="24" color="#fff" />
        </div>
        <span>加油钱包</span>
      </div>
      <div class="action-item" @click="goCoupon">
        <div class="action-icon coupon">
          <van-icon name="new-coupon-o" size="24" color="#fff" />
        </div>
        <span>优惠券</span>
      </div>
      <div class="action-item" @click="goInvite">
        <div class="action-icon invite">
          <van-icon name="gift-o" size="24" color="#fff" />
        </div>
        <span>推荐有奖</span>
      </div>
    </div>

    <div class="category-grid">
      <div
        class="category-item"
        v-for="item in homeData.categories"
        :key="item.id"
        @click="goCategory(item)"
      >
        <div class="category-icon">{{ item.icon }}</div>
        <span>{{ item.name }}</span>
      </div>
    </div>

    <div class="section" v-if="homeData.stations && homeData.stations.length > 0">
      <div class="section-header">
        <span class="section-title">附近油站</span>
        <span class="section-more" @click="goStations">
          查看全部
          <van-icon name="arrow" size="12" />
        </span>
      </div>
      <div class="station-list">
        <div
          class="station-item"
          v-for="station in homeData.stations.slice(0, 2)"
          :key="station.id"
          @click="goStationDetail(station.id)"
        >
          <div class="station-info">
            <div class="station-name">{{ station.name }}</div>
            <div class="station-meta">
              <van-icon name="location-o" size="12" />
              <span>{{ station.address }}</span>
            </div>
            <div class="station-services">
              <span v-for="(service, idx) in JSON.parse(station.services || '[]').slice(0, 3)" :key="idx">
                {{ service }}
              </span>
            </div>
          </div>
          <div class="station-distance">
            <div class="distance-text">{{ station.distance }}</div>
            <div class="nav-btn" @click.stop="navigateTo(station.id)">导航</div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-title">易捷头条</span>
        <span class="section-more" @click="goArticles">
          更多
          <van-icon name="arrow" size="12" />
        </span>
      </div>
      <div class="article-list">
        <div
          class="article-item"
          v-for="article in homeData.articles"
          :key="article.id"
          @click="goArticleDetail(article.id)"
        >
          <img :src="article.cover_image" class="article-image" />
          <div class="article-info">
            <div class="article-title">{{ article.title }}</div>
            <div class="article-meta">
              <span>{{ article.author }}</span>
              <span>{{ article.view_count }}阅读</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section hot-section">
      <div class="section-header">
        <span class="section-title">热销爆品</span>
      </div>
      <div class="product-grid">
        <div
          class="product-item"
          v-for="product in homeData.hot_products"
          :key="product.id"
          @click="goProductDetail(product.id)"
        >
          <img :src="product.main_image" class="product-image" />
          <div class="product-info">
            <div class="product-name ellipsis-2">{{ product.name }}</div>
            <div class="product-price">
              <span class="current-price">{{ product.price }}</span>
              <span class="original-price" v-if="product.original_price > product.price">
                ¥{{ product.original_price }}
              </span>
            </div>
            <div class="product-meta">
              <span class="sales">已售{{ product.sales }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-title">为你推荐</span>
      </div>
      <div class="product-list">
        <div
          class="product-row"
          v-for="product in homeData.recommend_products"
          :key="product.id"
          @click="goProductDetail(product.id)"
        >
          <img :src="product.main_image" class="product-thumb" />
          <div class="product-detail">
            <div class="product-name ellipsis-2">{{ product.name }}</div>
            <div class="product-desc">{{ product.description || '品质保证' }}</div>
            <div class="product-bottom">
              <div class="price-row">
                <span class="current-price">{{ product.price }}</span>
                <span class="original-price" v-if="product.original_price > product.price">
                  ¥{{ product.original_price }}
                </span>
              </div>
              <span class="sales">已售{{ product.sales }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-placeholder"></div>

    <van-tabbar v-model="activeTab" class="tab-bar">
      <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item icon="apps-o" to="/category">分类</van-tabbar-item>
      <van-tabbar-item icon="shopping-cart-o" :badge="cartCount" to="/cart">购物车</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>

    <van-popup v-model:show="showScanPopup" round position="bottom" :style="{ height: '50%' }">
      <div class="scan-popup">
        <div class="popup-header">
          <span class="popup-title">扫码购</span>
          <van-icon name="cross" size="20" @click="showScanPopup = false" />
        </div>
        <div class="scan-content">
          <div class="scan-icon">
            <van-icon name="scan" size="60" color="#1989fa" />
          </div>
          <p class="scan-tip">扫描商品条形码，快速加入购物车</p>
          <van-field
            v-model="scanCode"
            placeholder="或输入商品条码/名称"
            @keyup.enter="handleScan"
          />
          <van-button type="primary" block @click="handleScan" class="scan-btn">
            搜索商品
          </van-button>
        </div>
      </div>
    </van-popup>

    <van-loading v-if="loading" type="spinner" color="#1989fa" class="global-loading" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getHomeData, navigate } from '../../api/home'
import { getCart, addToCart } from '../../api/product'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref(0)
const loading = ref(false)
const homeData = ref({
  banners: [],
  categories: [],
  hot_products: [],
  recommend_products: [],
  new_products: [],
  articles: [],
  stations: [],
  user_info: null
})

const showScanPopup = ref(false)
const scanCode = ref('')
const cartCount = ref(0)

const fetchHomeData = async () => {
  loading.value = true
  try {
    const res = await getHomeData()
    homeData.value = res.data
  } catch (error) {
    console.error('获取首页数据失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchCartCount = async () => {
  if (!userStore.isLoggedIn) {
    cartCount.value = 0
    return
  }
  try {
    const res = await getCart()
    cartCount.value = res.data.total_count || 0
  } catch (error) {
    console.error('获取购物车数量失败:', error)
  }
}

const handleBannerClick = (item) => {
  showToast('跳转到: ' + item.title)
}

const goSearch = () => {
  router.push('/search')
}

const goScan = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  showScanPopup.value = true
}

const handleScan = async () => {
  if (!scanCode.value) {
    showToast('请输入或扫描商品条码')
    return
  }
  try {
    router.push({
      path: '/search',
      query: { keyword: scanCode.value }
    })
    showScanPopup.value = false
    scanCode.value = ''
  } catch (error) {
    console.error('扫码失败:', error)
  }
}

const goFuel = () => {
  router.push('/fuel')
}

const goWallet = () => {
  router.push('/wallet')
}

const goCoupon = () => {
  router.push('/coupons')
}

const goInvite = () => {
  router.push('/invite')
}

const goCategory = (item) => {
  router.push({
    path: '/category',
    query: { categoryId: item.id }
  })
}

const goStations = () => {
  showToast('查看全部油站')
}

const goStationDetail = (id) => {
  router.push(`/station/${id}`)
}

const navigateTo = async (stationId) => {
  try {
    const res = await navigate({ stationId, platform: 'gaode' })
    window.open(res.data.navigate_url, '_blank')
  } catch (error) {
    console.error('导航失败:', error)
  }
}

const goArticles = () => {
  showToast('查看更多文章')
}

const goArticleDetail = (id) => {
  router.push(`/article/${id}`)
}

const goProductDetail = (id) => {
  router.push(`/product/${id}`)
}

onMounted(() => {
  fetchHomeData()
  fetchCartCount()
})

onActivated(() => {
  fetchCartCount()
})
</script>

<style lang="less" scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1989fa 0%, #f5f5f5 20%);
  padding-bottom: 50px;
}

.header-search {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.95);
  margin: 12px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .search-placeholder {
    margin-left: 8px;
    color: #969799;
    font-size: 14px;
  }
}

.banner-swipe {
  margin: 0 12px 16px;
  border-radius: 12px;
  overflow: hidden;
  height: 160px;

  .banner-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  padding: 16px 12px;
  background: #fff;
  margin: 0 12px 12px;
  border-radius: 12px;

  .action-item {
    width: 20%;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;

    .action-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;

      &.scan {
        background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
      }

      &.fuel {
        background: linear-gradient(135deg, #ff9f43, #f87f1a);
      }

      &.wallet {
        background: linear-gradient(135deg, #4ecdc4, #44a08d);
      }

      &.coupon {
        background: linear-gradient(135deg, #a8e063, #56ab2f);
      }

      &.invite {
        background: linear-gradient(135deg, #f093fb, #f5576c);
      }
    }

    span {
      font-size: 12px;
      color: #323233;
    }
  }
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 12px;
  background: #fff;
  margin: 0 12px 12px;
  border-radius: 12px;

  .category-item {
    width: 20%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0;
    cursor: pointer;

    .category-icon {
      font-size: 28px;
      margin-bottom: 4px;
    }

    span {
      font-size: 12px;
      color: #646566;
    }
  }
}

.section {
  background: #fff;
  margin: 0 12px 12px;
  border-radius: 12px;
  padding: 12px;

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 12px;
    border-bottom: 1px solid #ebedf0;
    margin-bottom: 12px;

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #323233;

      &::before {
        content: '';
        display: inline-block;
        width: 4px;
        height: 16px;
        background: linear-gradient(180deg, #1989fa, #409eff);
        border-radius: 2px;
        margin-right: 8px;
        vertical-align: middle;
      }
    }

    .section-more {
      font-size: 12px;
      color: #969799;
      cursor: pointer;
    }
  }
}

.station-list {
  .station-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 12px 0;
    border-bottom: 1px solid #f7f8fa;
    cursor: pointer;

    &:last-child {
      border-bottom: none;
    }

    .station-info {
      flex: 1;
      padding-right: 12px;

      .station-name {
        font-size: 15px;
        font-weight: 500;
        color: #323233;
        margin-bottom: 6px;
      }

      .station-meta {
        display: flex;
        align-items: center;
        font-size: 12px;
        color: #646566;
        margin-bottom: 6px;

        .van-icon {
          margin-right: 4px;
        }
      }

      .station-services {
        display: flex;
        gap: 8px;
        font-size: 10px;
        color: #969799;

        span {
          padding: 2px 6px;
          background: #f7f8fa;
          border-radius: 4px;
        }
      }
    }

    .station-distance {
      display: flex;
      flex-direction: column;
      align-items: flex-end;

      .distance-text {
        font-size: 14px;
        font-weight: 500;
        color: #1989fa;
        margin-bottom: 8px;
      }

      .nav-btn {
        padding: 4px 12px;
        background: linear-gradient(135deg, #1989fa, #409eff);
        color: #fff;
        font-size: 12px;
        border-radius: 12px;
      }
    }
  }
}

.article-list {
  .article-item {
    display: flex;
    padding: 8px 0;
    cursor: pointer;

    .article-image {
      width: 100px;
      height: 72px;
      border-radius: 8px;
      object-fit: cover;
      margin-right: 12px;
    }

    .article-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .article-title {
        font-size: 14px;
        font-weight: 500;
        color: #323233;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .article-meta {
        display: flex;
        gap: 12px;
        font-size: 11px;
        color: #969799;
      }
    }
  }
}

.hot-section {
  background: transparent;
  margin: 0;
  padding: 0 12px;

  .section-header {
    background: #fff;
    padding: 12px;
    margin: 0 -12px 12px;
    border-radius: 12px 12px 0 0;
  }

  .product-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;

    .product-item {
      width: calc(50% - 6px);
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;

      .product-image {
        width: 100%;
        height: 160px;
        object-fit: cover;
      }

      .product-info {
        padding: 12px;

        .product-name {
          font-size: 13px;
          color: #323233;
          min-height: 36px;
          margin-bottom: 8px;
        }

        .product-price {
          display: flex;
          align-items: baseline;
          margin-bottom: 4px;

          .current-price {
            font-size: 18px;
            font-weight: 600;
            color: #ee0a24;

            &::before {
              content: '¥';
              font-size: 0.8em;
            }
          }

          .original-price {
            font-size: 12px;
            color: #969799;
            margin-left: 8px;
          }
        }

        .product-meta {
          .sales {
            font-size: 11px;
            color: #969799;
          }
        }
      }
    }
  }
}

.product-list {
  .product-row {
    display: flex;
    padding: 12px 0;
    border-bottom: 1px solid #f7f8fa;
    cursor: pointer;

    &:last-child {
      border-bottom: none;
    }

    .product-thumb {
      width: 100px;
      height: 100px;
      border-radius: 8px;
      object-fit: cover;
      margin-right: 12px;
    }

    .product-detail {
      flex: 1;
      display: flex;
      flex-direction: column;

      .product-name {
        font-size: 14px;
        font-weight: 500;
        color: #323233;
        margin-bottom: 4px;
      }

      .product-desc {
        font-size: 12px;
        color: #969799;
        margin-bottom: 8px;
      }

      .product-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: auto;

        .price-row {
          display: flex;
          align-items: baseline;

          .current-price {
            font-size: 18px;
            font-weight: 600;
            color: #ee0a24;

            &::before {
              content: '¥';
              font-size: 0.8em;
            }
          }

          .original-price {
            font-size: 12px;
            color: #969799;
            margin-left: 8px;
          }
        }

        .sales {
          font-size: 11px;
          color: #969799;
        }
      }
    }
  }
}

.bottom-placeholder {
  height: 60px;
}

.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.scan-popup {
  height: 100%;
  display: flex;
  flex-direction: column;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #ebedf0;

    .popup-title {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .scan-content {
    flex: 1;
    padding: 40px 20px;

    .scan-icon {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }

    .scan-tip {
      text-align: center;
      color: #646566;
      font-size: 14px;
      margin-bottom: 24px;
    }

    .scan-btn {
      margin-top: 16px;
      border-radius: 24px;
      background: linear-gradient(135deg, #1989fa, #409eff);
    }
  }
}

.global-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 999;
}
</style>
