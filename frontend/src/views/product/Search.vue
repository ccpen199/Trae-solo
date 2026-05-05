<template>
  <div class="search-page">
    <div class="search-header">
      <van-icon name="arrow-left" size="20" @click="goBack" />
      <van-search
        v-model="keyword"
        placeholder="搜索商品"
        :autofocus="true"
        @search="handleSearch"
        @cancel="goBack"
      />
    </div>

    <div class="search-history" v-if="!keyword && historyList.length > 0">
      <div class="history-header">
        <span class="history-title">搜索历史</span>
        <van-icon name="delete-o" size="16" color="#969799" @click="clearHistory" />
      </div>
      <div class="history-tags">
        <van-tag
          v-for="(item, index) in historyList"
          :key="index"
          size="medium"
          plain
          @click="searchHistory(item)"
        >
          {{ item }}
        </van-tag>
      </div>
    </div>

    <div class="hot-search" v-if="!keyword && hotWords.length > 0">
      <div class="hot-header">
        <span class="hot-title">热门搜索</span>
      </div>
      <div class="hot-tags">
        <van-tag
          v-for="(item, index) in hotWords"
          :key="index"
          size="medium"
          :type="index < 3 ? 'primary' : 'default'"
          @click="searchHot(item)"
        >
          {{ item }}
        </van-tag>
      </div>
    </div>

    <div class="search-result" v-if="keyword">
      <div class="result-header" v-if="productList.length > 0">
        <span class="result-count">共找到 {{ totalCount }} 件商品</span>
        <div class="sort-tabs">
          <van-button
            size="small"
            :type="sortBy === 'default' ? 'primary' : 'default'"
            @click="handleSort('default')"
          >
            综合
          </van-button>
          <van-button
            size="small"
            :type="sortBy === 'price' ? 'primary' : 'default'"
            @click="handleSort('price')"
          >
            价格
          </van-button>
          <van-button
            size="small"
            :type="sortBy === 'sales' ? 'primary' : 'default'"
            @click="handleSort('sales')"
          >
            销量
          </van-button>
        </div>
      </div>

      <div class="result-list" v-if="productList.length > 0">
        <div
          class="product-item"
          v-for="product in productList"
          :key="product.id"
          @click="goProductDetail(product.id)"
        >
          <img :src="product.main_image" class="product-image" />
          <div class="product-info">
            <div class="product-name ellipsis-2">{{ product.name }}</div>
            <div class="product-price">
              <span class="current-price">¥{{ product.price }}</span>
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

      <van-empty description="暂无相关商品" v-if="productList.length === 0 && !loading" />
    </div>

    <van-loading v-if="loading" type="spinner" color="#1989fa" class="page-loading" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { searchProducts } from '../../api/product'

const router = useRouter()
const route = useRoute()

const keyword = ref('')
const productList = ref([])
const totalCount = ref(0)
const loading = ref(false)
const sortBy = ref('default')
const sortOrder = ref('asc')
const page = ref(1)
const pageSize = ref(20)

const historyList = ref(JSON.parse(localStorage.getItem('searchHistory') || '[]'))

const hotWords = ref([
  '矿泉水', '可乐', '薯片', '方便面', '洗衣液', '玻璃水'
])

watch(() => route.query.keyword, (newVal) => {
  if (newVal) {
    keyword.value = newVal
    handleSearch()
  }
}, { immediate: true })

const goBack = () => {
  router.back()
}

const handleSearch = async () => {
  if (!keyword.value.trim()) return
  
  loading.value = true
  
  try {
    addToHistory(keyword.value.trim())
    
    const res = await searchProducts({
      keyword: keyword.value.trim(),
      page: page.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    })
    
    productList.value = res.data.list || []
    totalCount.value = res.data.total || 0
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    loading.value = false
  }
}

const addToHistory = (word) => {
  const index = historyList.value.indexOf(word)
  if (index > -1) {
    historyList.value.splice(index, 1)
  }
  historyList.value.unshift(word)
  
  if (historyList.value.length > 10) {
    historyList.value = historyList.value.slice(0, 10)
  }
  
  localStorage.setItem('searchHistory', JSON.stringify(historyList.value))
}

const clearHistory = () => {
  historyList.value = []
  localStorage.removeItem('searchHistory')
}

const searchHistory = (word) => {
  keyword.value = word
  handleSearch()
}

const searchHot = (word) => {
  keyword.value = word
  handleSearch()
}

const handleSort = (type) => {
  if (sortBy.value === type && type === 'price') {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = type
    sortOrder.value = 'asc'
  }
  handleSearch()
}

const goProductDetail = (id) => {
  router.push(`/product/${id}`)
}
</script>

<style lang="less" scoped>
.search-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.search-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;

  .van-icon {
    margin-right: 12px;
    cursor: pointer;
  }

  .van-search {
    flex: 1;
  }
}

.search-history,
.hot-search {
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  padding: 16px;

  .history-header,
  .hot-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .history-title,
    .hot-title {
      font-size: 15px;
      font-weight: 600;
      color: #323233;
    }

    .van-icon {
      cursor: pointer;
    }
  }

  .history-tags,
  .hot-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .van-tag {
      padding: 4px 12px;
      cursor: pointer;
    }
  }
}

.search-result {
  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #fff;
    margin-bottom: 8px;

    .result-count {
      font-size: 13px;
      color: #969799;
    }

    .sort-tabs {
      display: flex;
      gap: 8px;
    }
  }

  .result-list {
    .product-item {
      display: flex;
      background: #fff;
      padding: 12px 16px;
      margin-bottom: 8px;
      cursor: pointer;

      .product-image {
        width: 100px;
        height: 100px;
        border-radius: 8px;
        object-fit: cover;
        margin-right: 12px;
      }

      .product-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        .product-name {
          font-size: 14px;
          color: #323233;
          min-height: 40px;
        }

        .product-price {
          display: flex;
          align-items: baseline;

          .current-price {
            font-size: 18px;
            font-weight: 600;
            color: #ee0a24;
          }

          .original-price {
            font-size: 12px;
            color: #969799;
            margin-left: 8px;
            text-decoration: line-through;
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

.page-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ellipsis-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
