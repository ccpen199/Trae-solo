<template>
  <div class="service-detail-page">
    <div class="page-header">
      <div class="container">
        <div class="flex items-center gap-8 mb-8">
          <el-button link @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>返回
          </el-button>
          <span class="breadcrumb-sep">/</span>
          <span>服务事项详情</span>
        </div>
        <h2 v-if="detail">{{ detail.item_name }}</h2>
      </div>
    </div>
    
    <div class="container main-content">
      <div v-loading="loading" class="content-wrapper">
        <div class="main-info card p-24 mb-24">
          <div class="info-header flex justify-between items-start mb-24">
            <div class="flex gap-20">
              <div class="service-icon-lg">
                <el-icon size="40" color="#1e88e5"><Service /></el-icon>
              </div>
              <div>
                <h2 class="item-name mb-12">{{ detail?.item_name }}</h2>
                <div class="tags-row flex gap-8 mb-12">
                  <el-tag type="primary">{{ detail?.service_type }}</el-tag>
                  <el-tag type="info">{{ detail?.handle_level }}</el-tag>
                  <el-tag v-if="detail?.is_online" type="success">可在线办理</el-tag>
                  <el-tag v-if="detail?.is_hot" type="danger">热门</el-tag>
                </div>
                <div class="meta-row flex gap-24 text-gray text-sm">
                  <span><el-icon><OfficeBuilding /></el-icon> {{ detail?.department_name || '暂无' }}</span>
                  <span><el-icon><User /></el-icon> 办理对象：{{ detail?.target_user || '暂无' }}</span>
                </div>
              </div>
            </div>
            <div class="action-group flex gap-12">
              <el-button size="large" @click="handleCollect">
                <el-icon><Star /></el-icon>{{ isCollected ? '已收藏' : '收藏' }}
              </el-button>
              <el-button type="primary" size="large" @click="goToApply">
                <el-icon><EditPen /></el-icon>在线办理
              </el-button>
            </div>
          </div>
          
          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-value">{{ detail?.commitment_time || '--' }}</div>
              <div class="stat-label">承诺时限（工作日）</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ detail?.legal_time || '--' }}</div>
              <div class="stat-label">法定时限（工作日）</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ detail?.visit_count || 0 }}</div>
              <div class="stat-label">浏览次数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ detail?.apply_count || 0 }}</div>
              <div class="stat-label">申请次数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ detail?.satisfaction || '--' }}</div>
              <div class="stat-label">满意度</div>
            </div>
          </div>
        </div>
        
        <div class="detail-content">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="受理条件" name="conditions">
              <div class="tab-content card p-24">
                <div v-if="detail?.accept_conditions" v-html="detail.accept_conditions" class="rich-text" />
                <el-empty v-else description="暂无受理条件说明" />
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="材料清单" name="materials">
              <div class="tab-content card p-24">
                <el-table v-if="materials.length > 0" :data="materials" border stripe>
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
                  <el-table-column label="操作" width="120" fixed="right">
                    <template #default="{ row }">
                      <el-button link type="primary" size="small" v-if="row.sample_url">
                        <el-icon><Download /></el-icon>下载样例
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <el-empty v-else description="暂无材料清单" />
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="办理流程" name="process">
              <div class="tab-content card p-24">
                <div v-if="processSteps.length > 0" class="process-steps">
                  <el-steps :active="processSteps.length" finish-status="success" direction="vertical">
                    <el-step v-for="(step, index) in processSteps" :key="index" :title="step.name">
                      <template #description>
                        <div class="step-desc">
                          <p>{{ step.description }}</p>
                          <p class="step-time"><el-icon><Clock /></el-icon> 办理时限：{{ step.time || '即时' }}</p>
                        </div>
                      </template>
                    </el-step>
                  </el-steps>
                </div>
                <div v-else-if="detail?.handle_process" v-html="detail.handle_process" class="rich-text" />
                <el-empty v-else description="暂无办理流程" />
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="办理时限" name="time">
              <div class="tab-content card p-24">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="承诺时限">
                    {{ detail?.commitment_time ? detail.commitment_time + ' 个工作日' : '暂无' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="法定时限">
                    {{ detail?.legal_time ? detail.legal_time + ' 个工作日' : '暂无' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="办理时间">
                    {{ detail?.work_time || '暂无' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="办理地点">
                    {{ detail?.handle_place || '暂无' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="咨询电话">
                    {{ detail?.consult_phone || '暂无' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="监督电话">
                    {{ detail?.supervise_phone || '暂无' }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="收费标准" name="fee">
              <div class="tab-content card p-24">
                <div v-if="detail?.is_charge === '是' || detail?.fee_items">
                  <el-alert type="warning" :closable="false" class="mb-16">
                    本事项需收费，请仔细阅读以下收费标准
                  </el-alert>
                  <el-table v-if="feeItems.length > 0" :data="feeItems" border>
                    <el-table-column prop="item_name" label="收费项目" min-width="200" />
                    <el-table-column prop="fee_standard" label="收费标准" min-width="300" />
                    <el-table-column prop="fee_basis" label="收费依据" min-width="300" />
                  </el-table>
                  <div v-else-if="detail?.fee_standard" v-html="detail.fee_standard" class="rich-text" />
                  <el-empty v-else description="暂无详细收费标准" />
                </div>
                <el-empty v-else description="本事项不收费" />
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="常见问题" name="faq">
              <div class="tab-content card p-24">
                <el-collapse v-if="faqs.length > 0">
                  <el-collapse-item v-for="(faq, index) in faqs" :key="index" :title="faq.question">
                    <div v-html="faq.answer" class="rich-text"></div>
                  </el-collapse-item>
                </el-collapse>
                <el-empty v-else description="暂无常见问题" />
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { serviceItemApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const detail = ref(null)
const activeTab = ref('conditions')
const isCollected = ref(false)

const materials = ref([
  { material_name: '身份证原件及复印件', material_type: '证照', required: '是', format: '纸质/电子', quantity: '1份', remark: '需本人签字' },
  { material_name: '申请表', material_type: '表单', required: '是', format: '纸质/电子', quantity: '1份', remark: '需加盖公章', sample_url: '#' },
  { material_name: '相关证明材料', material_type: '证明', required: '否', format: '纸质/电子', quantity: '1份', remark: '根据具体情况提供' }
])

const processSteps = ref([
  { name: '提交申请', description: '申请人通过线上或线下渠道提交申请材料', time: '即时' },
  { name: '材料审核', description: '工作人员对申请材料进行完整性、规范性审核', time: '1个工作日' },
  { name: '受理', description: '审核通过后正式受理，出具受理通知书', time: '即时' },
  { name: '审查决定', description: '相关部门进行审查并作出决定', time: '3个工作日' },
  { name: '结果送达', description: '通过短信通知申请人，可选择自取或邮寄', time: '1个工作日' }
])

const feeItems = ref([])

const faqs = ref([
  { question: '办理需要本人到场吗？', answer: '可以委托他人代办，需提供授权委托书和代办人身份证。' },
  { question: '材料可以通过网上提交吗？', answer: '可以，本事项支持全程网办，您可以在线提交电子材料。' },
  { question: '办理进度如何查询？', answer: '您可以在"个人中心-我的办件"中查看办理进度，或拨打咨询电话查询。' }
])

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await serviceItemApi.detail(route.params.id)
    if (res.code === 200) {
      detail.value = res.data
      document.title = `${res.data.item_name} - 四川政务服务`
    }
  } catch (e) {
    ElMessage.error('加载事项详情失败')
  } finally {
    loading.value = false
  }
}

const handleCollect = () => {
  isCollected.value = !isCollected.value
  ElMessage.success(isCollected.value ? '收藏成功' : '已取消收藏')
}

const goToApply = () => {
  router.push(`/apply/${route.params.id}`)
}

onMounted(() => {
  fetchDetail()
})
</script>

<style lang="scss" scoped>
.service-detail-page {
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

.info-header {
  .service-icon-lg {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .item-name {
    font-size: 24px;
    font-weight: 700;
    color: #303133;
  }
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
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

.tab-content {
  min-height: 300px;
}

.process-steps {
  padding: 20px 0;
  
  .step-desc {
    color: #606266;
    
    p {
      margin: 0 0 8px;
    }
    
    .step-time {
      color: #909399;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}

.rich-text {
  line-height: 1.8;
  color: #606266;
  
  :deep(p) {
    margin-bottom: 12px;
  }
  
  :deep(ul), :deep(ol) {
    padding-left: 24px;
    margin-bottom: 12px;
    
    li {
      margin-bottom: 6px;
    }
  }
}
</style>
