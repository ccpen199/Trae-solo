<template>
  <div class="rankings-page">
    <div class="container">
      <div class="page-header">
        <h1>榜单中心</h1>
        <p>30+专业榜单分类，多维度品牌排名分析</p>
      </div>

      <div class="filter-bar">
        <div class="filter-item">
          <span class="filter-label">分类筛选：</span>
          <div class="tag-cloud">
            <span
              :class="['tag-item', { active: !selectedCategory }]"
              @click="selectCategory('')"
            >全部</span>
            <span
              v-for="cat in categoryGroups"
              :key="cat"
              :class="['tag-item', { active: selectedCategory === cat }]"
              @click="selectCategory(cat)"
            >{{ cat }}</span>
          </div>
        </div>
      </div>

      <div class="results-bar">
        <span class="results-count">共 {{ filteredCategories.length }} 个榜单</span>
        <el-button type="primary" @click="goCompare">
          <el-icon><DataAnalysis /></el-icon>品牌对比工具
        </el-button>
      </div>

      <el-row :gutter="20" v-loading="loading">
        <el-col :xs="12" :sm="8" :md="6" v-for="(category, idx) in filteredCategories" :key="category.id">
          <div class="ranking-card" @click="goDetail(category.id)">
            <div class="ranking-icon" :style="{ background: getGradient(idx) }">
              <el-icon :size="28">{{ getCategoryIcon(category.name) }}</el-icon>
            </div>
            <h3 class="ranking-name">{{ category.name }}</h3>
            <p class="ranking-desc">{{ category.description || '专业维度评分，权威排名' }}</p>
            <div class="ranking-stats">
              <span class="stat">
                <el-icon><Trophy /></el-icon>{{ category.brandCount || 0 }} 品牌
              </span>
              <span class="stat">
                <el-icon><View /></el-icon>{{ category.viewCount || 0 }} 浏览
              </span>
            </div>
            <div class="ranking-footer">
              <span class="update-time">更新于 {{ formatDate(category.updatedAt) }}</span>
              <span class="go-detail">查看 <el-icon><ArrowRight /></el-icon></span>
            </div>
          </div>
        </el-col>
      </el-row>

      <div class="empty-state" v-if="!loading && filteredCategories.length === 0">
        <el-empty description="暂无符合条件的榜单" />
      </div>

      <el-pagination
        v-if="total > pageSize"
        class="pagination"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[12, 24, 48]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import {
  DataAnalysis, Trophy, View, ArrowRight, DataLine, Food, Wallet,
  ShoppingCart, Van, Dish, Iphone, House, Box,
  Film, Brush, School, Umbrella, Medal, Connection,
  ShoppingBag, Monitor, Camera, Headset, Goods,
  Watch, Document, VideoPlay, Edit,
  Sunny, MagicStick, Platform
} from '@element-plus/icons-vue'
import { rankingAPI } from '@/utils/api'
import dayjs from 'dayjs'

const router = useRouter()

const loading = ref(false)
const categories = ref([])
const categoryGroups = ref([])
const selectedCategory = ref('')
const currentPage = ref(1)
const pageSize = ref(24)
const total = ref(0)

const iconMap = {
  '餐饮': markRaw(Food),
  '食品': markRaw(Goods),
  '饮料': markRaw(Goods),
  '金融': markRaw(Wallet),
  '零售': markRaw(ShoppingCart),
  '物流': markRaw(Van),
  '餐饮美食': markRaw(Dish),
  '数码': markRaw(Iphone),
  '手机': markRaw(Iphone),
  '家电': markRaw(Monitor),
  '房地产': markRaw(House),
  '家居': markRaw(House),
  '医药': markRaw(Box),
  '医疗': markRaw(Box),
  '文娱': markRaw(Film),
  '美妆': markRaw(Brush),
  '教育': markRaw(School),
  '服饰': markRaw(Goods),
  '服装': markRaw(Goods),
  '箱包': markRaw(ShoppingBag),
  '珠宝': markRaw(Medal),
  '手表': markRaw(Watch),
  '母婴': markRaw(Umbrella),
  '汽车': markRaw(Van),
  '交通': markRaw(Van),
  'AI': markRaw(Connection),
  '科技': markRaw(DataAnalysis),
  '互联网': markRaw(Monitor),
  '游戏': markRaw(VideoPlay),
  '摄影': markRaw(Camera),
  '音频': markRaw(Headset),
  '家具': markRaw(Box),
  '图书': markRaw(Document),
  '出版': markRaw(Edit),
  '美容': markRaw(Brush),
  '护肤': markRaw(Sunny),
  '运动': markRaw(Trophy),
  '户外': markRaw(Sunny),
  '理发': markRaw(Brush),
  '宠物': markRaw(Brush)
}

const gradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
  'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)'
]

const filteredCategories = computed(() => {
  let list = categories.value
  if (selectedCategory.value) {
    list = list.filter(c => c.group === selectedCategory.value)
  }
  return list
})

function getGradient(idx) {
  return gradients[idx % gradients.length]
}

function getCategoryIcon(name) {
  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key)) {
      return icon
    }
  }
  return markRaw(DataLine)
}

async function loadCategories() {
  loading.value = true
  try {
    const res = await rankingAPI.getCategories({ pageSize: 100 })
    const data = res.data?.data || []
    categories.value = data
    total.value = res.data?.total || data.length
    
    const groups = [...new Set(data.map(c => c.group).filter(Boolean))]
    categoryGroups.value = groups
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function selectCategory(cat) {
  selectedCategory.value = cat
  currentPage.value = 1
}

function formatDate(date) {
  return dayjs(date).format('MM-DD')
}

function goDetail(id) {
  router.push(`/rankings/${id}`)
}

function goCompare() {
  router.push('/rankings/compare')
}

function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
}

function handlePageChange(page) {
  currentPage.value = page
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.rankings-page {
  padding-bottom: 40px;
}

.results-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.results-count {
  color: #606266;
  font-size: 14px;
}

.ranking-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.ranking-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.ranking-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 16px;
}

.ranking-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2f3d;
  margin-bottom: 6px;
  min-height: 44px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ranking-desc {
  font-size: 13px;
  color: #909399;
  margin-bottom: 16px;
  min-height: 36px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ranking-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.ranking-stats .stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
}

.ranking-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
  font-size: 12px;
}

.update-time {
  color: #909399;
}

.go-detail {
  display: flex;
  align-items: center;
  gap: 2px;
  color: #409eff;
  font-weight: 500;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}
</style>
