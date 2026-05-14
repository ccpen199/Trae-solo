<template>
  <div class="category-page page-container">
    <div class="header">
      <h1>商品分类</h1>
    </div>

    <div v-if="loading" class="loading">
      <el-spinner />
    </div>

    <div v-else class="content">
      <div class="category-tree">
        <div 
          v-for="category in categories" 
          :key="category.id" 
          class="category-item"
        >
          <div class="category-header" @click="toggleCategory(category.id)">
            <span class="category-name">{{ category.name }}</span>
            <ChevronRight class="expand-icon" :class="{ expanded: expandedCategories.includes(category.id) }" />
          </div>
          <div v-if="expandedCategories.includes(category.id) && category.children?.length" class="sub-categories">
            <div 
              v-for="sub in category.children" 
              :key="sub.id" 
              class="sub-category"
              @click="goProducts(sub.id)"
            >
              {{ sub.name }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
import BottomNav from '@/components/BottomNav.vue'
import { productAPI } from '@/api'

const router = useRouter()
const loading = ref(true)
const categories = ref([])
const expandedCategories = ref([])

onMounted(() => {
  loadCategories()
})

async function loadCategories() {
  loading.value = true
  try {
    categories.value = await productAPI.categories()
    if (categories.value.length > 0) {
      expandedCategories.value.push(categories.value[0].id)
    }
  } catch {
    categories.value = []
  } finally {
    loading.value = false
  }
}

function toggleCategory(id) {
  const index = expandedCategories.value.indexOf(id)
  if (index > -1) {
    expandedCategories.value.splice(index, 1)
  } else {
    expandedCategories.value.push(id)
  }
}

function goProducts(categoryId) {
  router.push(`/products?categoryId=${categoryId}`)
}
</script>

<style scoped>
.header {
  background: white;
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.content {
  padding: 12px;
}

.category-tree {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.category-item {
  border-bottom: 1px solid #f0f0f0;
}

.category-item:last-child {
  border-bottom: none;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.category-name {
  font-size: 15px;
  font-weight: 500;
}

.expand-icon {
  width: 20px;
  height: 20px;
  color: #999;
  transition: transform 0.3s;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.sub-categories {
  background: #fafafa;
  padding: 8px 0;
}

.sub-category {
  padding: 12px 16px 12px 40px;
  font-size: 14px;
  color: #666;
}

.sub-category:active {
  background: #f0f0f0;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
</style>