<template>
  <div class="brands-page">
    <div class="container">
      <div class="page-header">
        <h1>品牌库</h1>
        <p>汇聚全球优质品牌，多维筛选找到您关注的品牌</p>
      </div>

      <div class="filter-bar" v-loading="filtersLoading">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索品牌名称..."
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prepend>
            <el-button @click="handleSearch">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>

        <div class="filter-item">
          <span class="filter-label">行业：</span>
          <div class="tag-cloud">
            <span
              :class="['tag-item', { active: !filters.industry }]"
              @click="selectIndustry('')"
            >全部</span>
            <span
              v-for="item in filterOptions.industries"
              :key="item"
              :class="['tag-item', { active: filters.industry === item }]"
              @click="selectIndustry(item)"
            >{{ item }}</span>
          </div>
        </div>

        <div class="filter-item">
          <span class="filter-label">地区：</span>
          <div class="tag-cloud">
            <span
              :class="['tag-item', { active: !filters.country }]"
              @click="selectCountry('')"
            >全部</span>
            <span
              v-for="item in filterOptions.countries"
              :key="item"
              :class="['tag-item', { active: filters.country === item }]"
              @click="selectCountry(item)"
            >{{ item }}</span>
          </div>
        </div>

        <div class="filter-item">
          <span class="filter-label">等级：</span>
          <div class="tag-cloud">
            <span
              :class="['tag-item', { active: !filters.level }]"
              @click="selectLevel('')"
            >全部</span>
            <span
              v-for="item in ['S', 'A', 'B', 'C']"
              :key="item"
              :class="['tag-item', `tag-${item.toLowerCase()}`, { active: filters.level === item }]"
              @click="selectLevel(item)"
            >{{ item }}级</span>
          </div>
        </div>

        <div class="filter-item">
          <span class="filter-label">首字母：</span>
          <div class="letter-filter">
            <button
              :class="['letter-btn', { active: !filters.letter }]"
              @click="selectLetter('')"
            >#</button>
            <button
              v-for="letter in letters"
              :key="letter"
              :class="['letter-btn', { active: filters.letter === letter }]"
              @click="selectLetter(letter)"
            >{{ letter }}</button>
          </div>
        </div>
      </div>

      <div class="results-bar">
        <span class="results-count">共 {{ total }} 个品牌</span>
        <el-select v-model="sortBy" @change="loadBrands">
          <el-option label="综合排序" value="score" />
          <el-option label="热度最高" value="viewCount" />
          <el-option label="最新收录" value="createdAt" />
        </el-select>
      </div>

      <el-row :gutter="20" v-loading="loading">
        <el-col :xs="12" :sm="8" :md="6" v-for="brand in brands" :key="brand.id">
          <div class="brand-card" @click="goDetail(brand.id)">
            <div class="brand-header">
              <img :src="brand.logo" :alt="brand.name" class="brand-logo" @error="handleLogoError" />
              <span :class="['badge-level', `badge-level-${brand.level}`]">{{ brand.level }}级</span>
            </div>
            <h3 class="brand-name">{{ brand.name }}</h3>
            <p class="brand-name-en" v-if="brand.nameEn">{{ brand.nameEn }}</p>
            <p class="brand-desc">{{ brand.industry }} · {{ brand.country }}</p>
            <div class="brand-stats">
              <span class="stat-item">
                <el-icon><StarFilled /></el-icon>{{ brand.score?.toFixed(1) || '0.0' }}
              </span>
              <span class="stat-item">
                <el-icon><View /></el-icon>{{ brand.viewCount || 0 }}
              </span>
              <span class="stat-item">
                <el-icon><ChatDotRound /></el-icon>{{ brand.commentCount || 0 }}
              </span>
            </div>
            <div class="brand-tags" v-if="brand.tags?.length">
              <el-tag size="small" v-for="tag in brand.tags.slice(0, 3)" :key="tag">{{ tag }}</el-tag>
            </div>
          </div>
        </el-col>
      </el-row>

      <div class="empty-state" v-if="!loading && brands.length === 0">
        <el-empty description="暂无符合条件的品牌" />
      </div>

      <el-pagination
        v-if="total > 0"
        class="pagination"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[12, 24, 48, 96]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, StarFilled, View, ChatDotRound } from '@element-plus/icons-vue'
import { brandAPI } from '@/utils/api'

const router = useRouter()

const loading = ref(false)
const filtersLoading = ref(false)

const searchKeyword = ref('')
const sortBy = ref('score')
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const filters = reactive({
  industry: '',
  country: '',
  level: '',
  letter: ''
})

const filterOptions = reactive({
  industries: [],
  countries: []
})

const brands = ref([])

async function loadFilters() {
  filtersLoading.value = true
  try {
    const res = await brandAPI.getFilters()
    filterOptions.industries = res.data?.industries || []
    filterOptions.countries = res.data?.countries || []
  } catch (e) {
    console.error(e)
  } finally {
    filtersLoading.value = false
  }
}

async function loadBrands() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      keyword: searchKeyword.value,
      ...filters
    }
    const res = await brandAPI.getList(params)
    brands.value = res.data?.data || []
    total.value = res.data?.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  loadBrands()
}

function selectIndustry(value) {
  filters.industry = value
  currentPage.value = 1
  loadBrands()
}

function selectCountry(value) {
  filters.country = value
  currentPage.value = 1
  loadBrands()
}

function selectLevel(value) {
  filters.level = value
  currentPage.value = 1
  loadBrands()
}

function selectLetter(value) {
  filters.letter = value
  currentPage.value = 1
  loadBrands()
}

function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
  loadBrands()
}

function handlePageChange(page) {
  currentPage.value = page
  loadBrands()
}

function goDetail(id) {
  router.push(`/brands/${id}`)
}

function handleLogoError(e) {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f0f2f5" width="100" height="100"/><text fill="%23909399" font-size="14" x="50" y="50" text-anchor="middle" dominant-baseline="middle">品牌</text></svg>'
}

onMounted(() => {
  loadFilters()
  loadBrands()
})
</script>

<style scoped>
.brands-page {
  padding-bottom: 40px;
}

.search-input {
  margin-bottom: 20px;
}

.search-input :deep(.el-input__wrapper) {
  padding-left: 0;
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

.brand-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.brand-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.brand-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.brand-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2f3d;
  margin-bottom: 2px;
}

.brand-name-en {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.brand-desc {
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
}

.brand-stats {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
}

.brand-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-s.active,
.tag-s:hover {
  background: linear-gradient(135deg, #fcc200, #ff9500) !important;
  color: #fff !important;
}

.tag-a.active,
.tag-a:hover {
  background: linear-gradient(135deg, #67c23a, #2f9e44) !important;
  color: #fff !important;
}

.tag-b.active,
.tag-b:hover {
  background: linear-gradient(135deg, #409eff, #1890ff) !important;
  color: #fff !important;
}

.tag-c.active,
.tag-c:hover {
  background: #909399 !important;
  color: #fff !important;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}
</style>
