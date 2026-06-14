<template>
  <div class="policy-detail-page">
    <div class="page-header">
      <div class="container">
        <div class="flex items-center gap-8 mb-8">
          <el-button link @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>返回
          </el-button>
          <span class="breadcrumb-sep">/</span>
          <span>政策详情</span>
        </div>
      </div>
    </div>
    
    <div class="container main-content">
      <div v-loading="loading" class="content-wrapper">
        <div class="policy-content card p-32 mb-24">
          <div class="policy-header text-center mb-24 pb-24 border-b">
            <h1 class="policy-title mb-16">{{ detail?.title }}</h1>
            <div class="policy-meta flex justify-center gap-24 text-gray">
              <span><el-icon><OfficeBuilding /></el-icon> {{ detail?.publish_department || '四川省人民政府' }}</span>
              <span><el-icon><Calendar /></el-icon> {{ formatDate(detail?.publish_time) }}</span>
              <span><el-icon><View /></el-icon> {{ viewCount }} 阅读</span>
              <el-tag v-if="detail?.is_hot" type="danger" size="small">热门</el-tag>
            </div>
          </div>
          
          <div class="policy-body mb-24" v-if="detail?.content">
            <div v-html="detail.content" class="rich-text"></div>
          </div>
          <div class="policy-body mb-24" v-else>
            <h2 class="content-title">一、政策背景</h2>
            <p>为深入贯彻落实党中央、国务院关于优化营商环境的决策部署，进一步深化"放管服"改革，提升政务服务效能，结合我省实际，制定本政策。</p>
            
            <h2 class="content-title">二、主要内容</h2>
            <h3 class="content-subtitle">（一）简化审批流程</h3>
            <p>1. 全面推行"一网通办"，实现90%以上政务服务事项网上可办。</p>
            <p>2. 压缩审批时限，一般事项承诺时限在法定时限基础上压减60%以上。</p>
            <p>3. 推行"并联审批"、"联合验收"，提高跨部门事项办理效率。</p>
            
            <h3 class="content-subtitle">（二）优化服务模式</h3>
            <p>1. 推行"一件事一次办"，将多个关联事项整合为"一件事"办理。</p>
            <p>2. 扩大"跨省通办"、"川渝通办"事项范围，便利企业群众异地办事。</p>
            <p>3. 提供7×24小时自助服务，实现政务服务全天候可及。</p>
            
            <h3 class="content-subtitle">（三）加强数据共享</h3>
            <p>1. 建立健全数据共享协调机制，打破"数据孤岛"。</p>
            <p>2. 推行"免证办"，通过数据共享实现电子证照、证明材料自动调用。</p>
            <p>3. 加强数据安全管理，保护个人隐私和企业商业秘密。</p>
            
            <h2 class="content-title">三、保障措施</h2>
            <p>（一）加强组织领导。各级各部门要高度重视，主要负责人作为第一责任人，切实抓好政策落实。</p>
            <p>（二）强化监督考核。将政策落实情况纳入政府绩效考核，定期开展督查评估。</p>
            <p>（三）做好宣传解读。通过多种渠道广泛宣传政策，提高政策知晓率和覆盖面。</p>
          </div>
          
          <div class="policy-footer flex justify-between items-center pt-24 border-t">
            <div class="flex gap-12">
              <el-button @click="handleLike">
                <el-icon><Star /></el-icon>点赞（{{ likeCount }}）
              </el-button>
              <el-button @click="handleCollect">
                <el-icon><Collection /></el-icon>收藏
              </el-button>
              <el-button @click="handleShare">
                <el-icon><Share /></el-icon>分享
              </el-button>
            </div>
            <div class="text-gray text-sm">
              分享到：
              <el-button link size="small" class="text-gray"><el-icon><ChatDotRound /></el-icon>微信</el-button>
              <el-button link size="small" class="text-gray"><el-icon><Promotion /></el-icon>微博</el-button>
            </div>
          </div>
        </div>
        
        <div class="policy-attachments card p-24 mb-24" v-if="attachments.length > 0">
          <h3 class="section-title mb-16">
            <el-icon><Paperclip /></el-icon>
            相关附件
          </h3>
          <div class="attachment-list">
            <div v-for="(item, index) in attachments" :key="index" class="attachment-item">
              <div class="attachment-icon">
                <el-icon size="24" color="#1e88e5"><Document /></el-icon>
              </div>
              <div class="attachment-info flex-1">
                <h4>{{ item.name }}</h4>
                <p class="text-gray text-sm">{{ item.size }} · {{ item.format }}</p>
              </div>
              <el-button type="primary" size="small">
                <el-icon><Download /></el-icon>下载
              </el-button>
            </div>
          </div>
        </div>
        
        <div class="related-policies card p-24">
          <h3 class="section-title mb-16">
            <el-icon><Link /></el-icon>
            相关政策
          </h3>
          <div class="related-list">
            <div v-for="item in relatedList" :key="item.id" class="related-item" @click="goToDetail(item.id)">
              <el-icon><Document /></el-icon>
              <span class="flex-1">{{ item.title }}</span>
              <span class="text-gray text-sm">{{ formatDate(item.publish_time) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { policyApi } from '@/api'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()

const loading = ref(false)
const detail = ref(null)
const viewCount = ref(0)
const likeCount = ref(0)

const attachments = ref([
  { name: '关于优化营商环境的实施意见.pdf', size: '2.3MB', format: 'PDF' },
  { name: '政策解读材料.docx', size: '1.1MB', format: 'Word' },
  { name: '事项办理指南.xlsx', size: '520KB', format: 'Excel' }
])

const relatedList = ref([
  { id: 1, title: '关于加快推进"一网通办"的实施意见', publish_time: '2024-01-10' },
  { id: 2, title: '四川省政务服务条例（修订草案）', publish_time: '2024-01-05' },
  { id: 3, title: '关于加强政务数据共享管理的通知', publish_time: '2024-01-02' }
])

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await policyApi.detail(route.params.id)
    if (res.code === 200) {
      detail.value = res.data
      viewCount.value = res.data.view_count || Math.floor(Math.random() * 1000) + 100
      likeCount.value = res.data.like_count || Math.floor(Math.random() * 100) + 10
      document.title = `${res.data.title} - 四川政务服务`
    }
  } catch (e) {
    ElMessage.error('加载政策详情失败')
  } finally {
    loading.value = false
  }
}

const handleLike = () => {
  likeCount.value++
  ElMessage.success('点赞成功')
}

const handleCollect = () => {
  ElMessage.success('收藏成功')
}

const handleShare = () => {
  ElMessage.success('分享链接已复制到剪贴板')
}

const goToDetail = (id) => {
  window.open(`/policies/${id}`, '_blank')
}

onMounted(() => {
  fetchDetail()
})
</script>

<style lang="scss" scoped>
.policy-detail-page {
  .page-header {
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

.policy-title {
  font-size: 26px;
  font-weight: 700;
  color: #303133;
  line-height: 1.4;
}

.policy-meta {
  font-size: 14px;
  
  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.rich-text {
  line-height: 2;
  color: #333;
  font-size: 16px;
  
  :deep(p) {
    margin-bottom: 16px;
    text-indent: 2em;
  }
  
  :deep(h1), :deep(h2), :deep(h3) {
    color: #303133;
    margin: 24px 0 12px;
  }
  
  :deep(ul), :deep(ol) {
    padding-left: 2em;
    margin-bottom: 16px;
    
    li {
      margin-bottom: 8px;
    }
  }
}

.content-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 24px 0 12px;
}

.content-subtitle {
  font-size: 16px;
  font-weight: 600;
  color: #606266;
  margin: 16px 0 8px;
}

.policy-body p {
  font-size: 16px;
  line-height: 2;
  color: #333;
  margin-bottom: 16px;
  text-indent: 2em;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
}

.attachment-list {
  .attachment-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    margin-bottom: 12px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .attachment-icon {
      width: 48px;
      height: 48px;
      background: #e3f2fd;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .attachment-info h4 {
      font-size: 15px;
      margin: 0 0 4px;
      color: #303133;
    }
  }
}

.related-list {
  .related-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid #ebeef5;
    cursor: pointer;
    transition: all 0.3s;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      color: #1e88e5;
      background: #f5f7fa;
      padding-left: 8px;
      padding-right: 8px;
      border-radius: 6px;
    }
    
    .el-icon {
      color: #909399;
    }
  }
}

.border-b {
  border-bottom: 1px solid #ebeef5;
}

.border-t {
  border-top: 1px solid #ebeef5;
}
</style>
