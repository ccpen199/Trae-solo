<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">商品服务</h2>
      <p class="page-subtitle">发现优质婚礼服务商</p>
    </div>

    <el-card class="card-shadow" style="margin-bottom: 20px;">
      <el-form :inline="true" :model="filters">
        <el-form-item label="服务类型">
          <el-select v-model="filters.type" placeholder="全部" clearable style="width: 150px;">
            <el-option label="婚纱摄影" value="婚纱摄影" />
            <el-option label="婚宴酒店" value="婚宴酒店" />
            <el-option label="婚庆服务" value="婚庆服务" />
            <el-option label="婚纱礼服" value="婚纱礼服" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格区间">
          <el-input-number v-model="filters.min_price" :min="0" placeholder="最低价" style="width: 120px;" />
          <span style="margin: 0 10px;">-</span>
          <el-input-number v-model="filters.max_price" :min="0" placeholder="最高价" style="width: 120px;" />
        </el-form-item>
        <el-form-item label="排序">
          <el-select v-model="filters.sort" style="width: 150px;">
            <el-option label="最新发布" value="" />
            <el-option label="价格从低到高" value="price_asc" />
            <el-option label="价格从高到低" value="price_desc" />
            <el-option label="评分最高" value="rating" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadServices">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="8" v-for="service in services" :key="service.id">
        <el-card class="service-card card-shadow">
          <div class="service-cover">
            <img :src="service.cover_image || 'https://picsum.photos/400/250?random=' + service.id" :alt="service.name" />
            <el-tag v-if="service.match_score" type="success" class="match-tag">匹配度 {{ service.match_score }}%</el-tag>
          </div>
          <div class="service-info">
            <h3 class="service-name">{{ service.name }}</h3>
            <div class="service-merchant">{{ service.company_name }}</div>
            <div class="service-meta">
              <span><el-icon><Star /></el-icon> {{ service.rating || 5.0 }}</span>
              <span><el-icon><Location /></el-icon> {{ service.address }}</span>
            </div>
            <div class="service-footer flex-between">
              <span class="service-price">¥{{ service.price?.toLocaleString() }}起</span>
              <el-button type="primary" size="small" @click="viewService(service)">查看详情</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="services.length === 0" description="暂无服务" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const services = ref([])
const filters = reactive({
  type: '',
  min_price: null,
  max_price: null,
  sort: ''
})

async function loadServices() {
  try {
    const params = {}
    if (filters.type) params.type = filters.type
    if (filters.min_price) params.min_price = filters.min_price
    if (filters.max_price) params.max_price = filters.max_price
    if (filters.sort) params.sort = filters.sort
    
    const res = await api.get('/services', { params })
    services.value = res.data
  } catch (e) {
    console.error(e)
  }
}

function viewService(service) {
  ElMessage.info('查看详情功能开发中')
}

onMounted(() => {
  loadServices()
})
</script>

<style scoped lang="scss">
.service-card {
  margin-bottom: 20px;
  
  .service-cover {
    position: relative;
    height: 180px;
    overflow: hidden;
    border-radius: 8px;
    margin: -20px -20px 16px -20px;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .match-tag {
      position: absolute;
      top: 12px;
      right: 12px;
    }
  }
  
  .service-info {
    .service-name {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 8px;
    }
    
    .service-merchant {
      font-size: 13px;
      color: #606266;
      margin-bottom: 10px;
    }
    
    .service-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #909399;
      margin-bottom: 12px;
      
      .el-icon {
        vertical-align: middle;
        margin-right: 4px;
      }
    }
    
    .service-footer {
      padding-top: 12px;
      border-top: 1px solid #ebeef5;
      
      .service-price {
        font-size: 20px;
        font-weight: 600;
        color: #ff6b9d;
      }
    }
  }
}
</style>
