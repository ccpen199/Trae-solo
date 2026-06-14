<template>
  <div class="scenario-detail-page">
    <div class="page-header">
      <div class="container">
        <div class="flex items-center gap-8 mb-8">
          <el-button link @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>返回
          </el-button>
          <span class="breadcrumb-sep">/</span>
          <span>一件事详情</span>
        </div>
        <h2 v-if="detail">{{ detail.scenario_name }}</h2>
      </div>
    </div>
    
    <div class="container main-content">
      <div v-loading="loading" class="content-wrapper">
        <div class="main-info card p-24 mb-24">
          <div class="flex gap-20 mb-24">
            <div class="scenario-icon-lg" :style="{ background: getCardBgColor(detail?.id || 1) }">
              {{ detail?.icon || '📋' }}
            </div>
            <div class="flex-1">
              <h2 class="item-name mb-12">{{ detail?.scenario_name }}</h2>
              <p class="item-desc mb-12">{{ detail?.description }}</p>
              <div class="tags-row flex gap-8">
                <el-tag type="warning">{{ detail?.category || '综合服务' }}</el-tag>
                <el-tag type="info">包含 {{ detail?.item_count || 3 }} 个关联事项</el-tag>
                <el-tag type="success">最多跑一次</el-tag>
                <el-tag v-if="detail?.is_hot" type="danger">热门</el-tag>
              </div>
            </div>
            <div class="flex gap-12">
              <el-button size="large" @click="handleCollect">
                <el-icon><Star /></el-icon>{{ isCollected ? '已收藏' : '收藏' }}
              </el-button>
              <el-button type="primary" size="large" @click="goToApply">
                <el-icon><EditPen /></el-icon>立即办理
              </el-button>
            </div>
          </div>
          
          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-value">{{ detail?.apply_count || 0 }}</div>
              <div class="stat-label">已办理</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ detail?.commitment_time || '5' }}</div>
              <div class="stat-label">承诺时限（工作日）</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ detail?.satisfaction || '98%' }}</div>
              <div class="stat-label">满意度</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ detail?.visit_count || 0 }}</div>
              <div class="stat-label">浏览次数</div>
            </div>
          </div>
        </div>
        
        <div class="detail-section card p-24 mb-24">
          <h3 class="section-title mb-16">
            <el-icon><List /></el-icon>
            包含事项
          </h3>
          <div class="service-items">
            <div v-for="(item, index) in serviceItems" :key="item.id" class="service-item">
              <div class="item-index">{{ index + 1 }}</div>
              <div class="item-info flex-1">
                <h4>{{ item.item_name }}</h4>
                <p class="text-gray text-sm">{{ item.department_name }} · {{ item.service_type }}</p>
              </div>
              <div class="item-action">
                <el-button link type="primary" @click="goToServiceDetail(item.id)">查看详情</el-button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="detail-section card p-24 mb-24">
          <h3 class="section-title mb-16">
            <el-icon><Files /></el-icon>
            申请材料
          </h3>
          <el-table :data="materials" border stripe>
            <el-table-column prop="material_name" label="材料名称" min-width="200" />
            <el-table-column prop="material_type" label="材料类型" width="120" />
            <el-table-column prop="required" label="是否必填" width="100">
              <template #default="{ row }">
                <el-tag :type="row.required === '是' ? 'danger' : 'info'" size="small">
                  {{ row.required }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="format" label="材料形式" width="120" />
            <el-table-column prop="quantity" label="份数" width="80" />
            <el-table-column prop="remark" label="备注" min-width="200" />
          </el-table>
        </div>
        
        <div class="detail-section card p-24 mb-24">
          <h3 class="section-title mb-16">
            <el-icon><Connection /></el-icon>
            办理流程
          </h3>
          <el-steps :active="processSteps.length" finish-status="success">
            <el-step v-for="(step, index) in processSteps" :key="index" :title="step.name" />
          </el-steps>
        </div>
        
        <div class="detail-section card p-24">
          <h3 class="section-title mb-16">
            <el-icon><InfoFilled /></el-icon>
            注意事项
          </h3>
          <div v-if="detail?.notice" v-html="detail.notice" class="rich-text" />
          <ul v-else class="notice-list">
            <li>请确保所提交材料真实有效，如有虚假将承担相应法律责任</li>
            <li>请按照材料清单准备齐全所有必填材料，以免影响办理进度</li>
            <li>在线办理需完成实名认证，请确保个人信息准确</li>
            <li>办理过程中如有疑问，请拨打咨询电话：12345</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { scenarioApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const detail = ref(null)
const isCollected = ref(false)

const serviceItems = ref([
  { id: 1, item_name: '营业执照办理', department_name: '市场监督管理局', service_type: '行政许可' },
  { id: 2, item_name: '税务登记', department_name: '税务局', service_type: '公共服务' },
  { id: 3, item_name: '社保开户', department_name: '人力资源和社会保障厅', service_type: '公共服务' }
])

const materials = ref([
  { material_name: '身份证原件及复印件', material_type: '证照', required: '是', format: '纸质/电子', quantity: '1份', remark: '需本人签字' },
  { material_name: '营业执照申请表', material_type: '表单', required: '是', format: '纸质/电子', quantity: '1份', remark: '需加盖公章' },
  { material_name: '公司章程', material_type: '证明', required: '是', format: '纸质/电子', quantity: '1份', remark: '全体股东签字' },
  { material_name: '股东身份证明', material_type: '证照', required: '是', format: '纸质/电子', quantity: '1份', remark: '' },
  { material_name: '住所证明', material_type: '证明', required: '是', format: '纸质/电子', quantity: '1份', remark: '房产证或租赁合同' }
])

const processSteps = ref([
  { name: '提交申请' },
  { name: '材料预审' },
  { name: '并联审批' },
  { name: '统一出件' }
])

const getCardBgColor = (id) => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  ]
  return colors[id % colors.length]
}

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await scenarioApi.detail(route.params.id)
    if (res.code === 200) {
      detail.value = res.data
      document.title = `${res.data.scenario_name} - 四川政务服务`
    }
  } catch (e) {
    ElMessage.error('加载场景详情失败')
  } finally {
    loading.value = false
  }
}

const handleCollect = () => {
  isCollected.value = !isCollected.value
  ElMessage.success(isCollected.value ? '收藏成功' : '已取消收藏')
}

const goToApply = () => {
  router.push(`/apply/${detail.value?.service_items?.[0]?.id || route.params.id}`)
}

const goToServiceDetail = (id) => {
  router.push(`/services/${id}`)
}

onMounted(() => {
  fetchDetail()
})
</script>

<style lang="scss" scoped>
.scenario-detail-page {
  .page-header {
    h2 {
      font-size: 24px;
      margin: 0;
    }
    
    .breadcrumb-sep {
      color: rgba(255, 255, 255, 0.7);
    }
    
    .el-button {
      color: #fff;
      
      &:hover {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }
}

.scenario-icon-lg {
  width: 100px;
  height: 100px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  flex-shrink: 0;
}

.item-name {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.item-desc {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
  
  .stat-item {
    text-align: center;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #1e88e5;
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 13px;
      color: #909399;
    }
  }
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
}

.service-items {
  .service-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    margin-bottom: 12px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .item-index {
      width: 32px;
      height: 32px;
      background: #1e88e5;
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      flex-shrink: 0;
    }
    
    .item-info h4 {
      font-size: 15px;
      margin: 0 0 4px;
      color: #303133;
    }
  }
}

.notice-list {
  padding-left: 20px;
  color: #606266;
  line-height: 2;
  
  li {
    margin-bottom: 8px;
  }
}

.rich-text {
  line-height: 1.8;
  color: #606266;
}
</style>
