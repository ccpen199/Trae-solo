<template>
  <div class="merchant-detail-page" v-loading="loading">
    <el-page-header @back="$router.back()" content="商户详情" style="margin-bottom: 20px;" />
    
    <el-row :gutter="20" v-if="merchant">
      <el-col :span="8">
        <el-card class="info-card">
          <div class="merchant-header">
            <el-avatar :size="80" style="background: linear-gradient(135deg, #667eea, #764ba2); font-size: 32px;">
              {{ merchant.name?.charAt(0) }}
            </el-avatar>
            <div class="merchant-basic">
              <h2>{{ merchant.name }}</h2>
              <div class="status-tags">
                <el-tag :type="merchant.qualification_status === 'verified' ? 'success' : 'warning'" size="large" effect="dark">
                  {{ merchant.qualification_status === 'verified' ? '资质已核验' : '资质待核验' }}
                </el-tag>
                <el-tag type="info" size="large">{{ merchant.category_name }}</el-tag>
              </div>
              <el-rate v-model="merchant.avg_rating || merchant.rating" disabled show-score text-color="#ff9900" />
            </div>
          </div>
          
          <el-divider />
          
          <div class="merchant-info-list">
            <div class="info-row">
              <span class="label">营业执照</span>
              <span class="value">{{ merchant.license_no || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">联系人</span>
              <span class="value">{{ merchant.contact_name }}</span>
            </div>
            <div class="info-row">
              <span class="label">联系电话</span>
              <span class="value">{{ merchant.contact_phone }}</span>
            </div>
            <div class="info-row">
              <span class="label">地址</span>
              <span class="value">{{ merchant.address }}</span>
            </div>
            <div class="info-row">
              <span class="label">认证时间</span>
              <span class="value">{{ merchant.verified_at || '-' }}</span>
            </div>
          </div>
          
          <el-divider />
          
          <div class="merchant-stats">
            <div class="stat-box">
              <div class="stat-number">{{ merchant.products?.length || 0 }}</div>
              <div class="stat-label">在售商品</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">{{ merchant.avg_rating || merchant.rating }}</div>
              <div class="stat-label">综合评分</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">{{ merchant.review_count || 0 }}</div>
              <div class="stat-label">用户评价</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="16">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="在售商品" name="products">
            <el-card class="products-card">
              <el-table :data="merchant.products || []" stripe>
                <el-table-column prop="name" label="商品名称" />
                <el-table-column label="价格" width="120">
                  <template #default="{ row }">
                    <span class="price">¥{{ row.price.toFixed(2) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="stock" label="库存" width="100">
                  <template #default="{ row }">
                    {{ row.stock }}
                    <el-tag v-if="row.stock <= 10" type="warning" size="small" style="margin-left: 5px;">
                      预警
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="sales_count" label="销量" width="100" />
                <el-table-column label="操作" width="100">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" link @click="$router.push(`/products/${row.id}`)">
                      查看
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-tab-pane>
          
          <el-tab-pane label="用户评价" name="reviews">
            <el-card class="reviews-card">
              <div v-if="(merchant.reviews || []).length === 0" class="empty-state">
                暂无评价
              </div>
              <div v-else class="review-list">
                <div v-for="review in merchant.reviews" :key="review.id" class="review-item">
                  <div class="review-header">
                    <el-avatar :size="36" style="background-color: #409eff;">
                      {{ review.user_name?.charAt(0) }}
                    </el-avatar>
                    <div class="review-user">
                      <div class="user-name">{{ review.user_name }}</div>
                      <el-rate v-model="review.rating" disabled size="small" />
                    </div>
                    <div class="review-time">{{ review.created_at }}</div>
                  </div>
                  <div class="review-content">{{ review.content }}</div>
                </div>
              </div>
            </el-card>
          </el-tab-pane>
          
          <el-tab-pane label="核销记录" name="verification">
            <el-card class="verification-card">
              <el-alert
                title="核销状态同步"
                type="info"
                :closable="false"
                style="margin-bottom: 20px;"
              />
              <el-table :data="[]" stripe>
                <el-table-column prop="order_no" label="订单号" />
                <el-table-column prop="product_name" label="商品" />
                <el-table-column prop="user_name" label="购买人" />
                <el-table-column prop="amount" label="金额" />
                <el-table-column prop="verify_time" label="核销时间" />
                <el-table-column prop="operator" label="操作人" />
              </el-table>
              <el-empty description="暂无核销记录" />
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getMerchant } from '../api'

const route = useRoute()
const loading = ref(false)
const merchant = ref(null)
const activeTab = ref('products')

async function loadMerchant() {
  loading.value = true
  try {
    const res = await getMerchant(route.params.id)
    merchant.value = res.data
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMerchant()
})
</script>

<style scoped>
.merchant-detail-page {
  padding: 0;
}

.info-card, .products-card, .reviews-card, .verification-card {
  border: none;
  border-radius: 12px;
}

.merchant-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.merchant-basic h2 {
  margin: 0 0 10px;
  font-size: 22px;
}

.status-tags {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.merchant-info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
}

.info-row .label {
  width: 80px;
  color: #909399;
  font-size: 14px;
}

.info-row .value {
  flex: 1;
  color: #303133;
}

.merchant-stats {
  display: flex;
  justify-content: space-around;
}

.stat-box {
  text-align: center;
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #409eff;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.price {
  color: #f56c6c;
  font-weight: 600;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.review-item {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.review-user {
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 3px;
}

.review-time {
  font-size: 12px;
  color: #909399;
}

.review-content {
  color: #606266;
  line-height: 1.6;
  padding-left: 48px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #909399;
}
</style>
