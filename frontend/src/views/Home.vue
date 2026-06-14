<template>
  <div class="home-page">
    <div class="banner">
      <div class="container">
        <div class="banner-content">
          <h1>四川政务服务</h1>
          <p class="subtitle">让政务服务更便捷、更高效、更贴心</p>
          <div class="search-box">
            <el-input v-model="searchKeyword" placeholder="搜索服务事项、政策法规..." size="large" @keyup.enter="handleSearch">
              <template #append>
                <el-button type="primary" @click="handleSearch">
                  <el-icon><Search /></el-icon>搜索
                </el-button>
              </template>
            </el-input>
          </div>
          <div class="hot-search">
            <span>热门搜索：</span>
            <el-tag v-for="tag in hotTags" :key="tag" size="small" @click="searchTag(tag)">{{ tag }}</el-tag>
          </div>
        </div>
        <div class="banner-image">
          <div class="banner-visual" aria-hidden="true">
            <div class="visual-card primary">
              <span>政务服务</span>
              <strong>在线办</strong>
            </div>
            <div class="visual-card secondary">
              <span>一件事</span>
              <strong>协同办</strong>
            </div>
            <div class="visual-steps">
              <i></i>
              <i></i>
              <i></i>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="container main-content">
      <div class="quick-entry card p-24 mb-24">
        <h3 class="section-title mb-16">快捷入口</h3>
        <div class="entry-grid">
          <div class="entry-item" @click="$router.push('/services')">
            <div class="entry-icon"><el-icon size="32"><Document /></el-icon></div>
            <span>服务事项</span>
          </div>
          <div class="entry-item" @click="$router.push('/scenarios')">
            <div class="entry-icon"><el-icon size="32"><Collection /></el-icon></div>
            <span>一件事服务</span>
          </div>
          <div class="entry-item" @click="$router.push('/policies')">
            <div class="entry-icon"><el-icon size="32"><Reading /></el-icon></div>
            <span>政策解读</span>
          </div>
          <div class="entry-item" @click="$router.push('/chat')">
            <div class="entry-icon"><el-icon size="32"><ChatDotRound /></el-icon></div>
            <span>智能问答</span>
          </div>
          <div class="entry-item" @click="goToProfile('applications')">
            <div class="entry-icon"><el-icon size="32"><Clock /></el-icon></div>
            <span>进度查询</span>
          </div>
          <div class="entry-item" @click="goToProfile('certificates')">
            <div class="entry-icon"><el-icon size="32"><CreditCard /></el-icon></div>
            <span>我的证照</span>
          </div>
          <div class="entry-item" @click="goToProfile('evaluations')">
            <div class="entry-icon"><el-icon size="32"><Star /></el-icon></div>
            <span>服务评价</span>
          </div>
          <div class="entry-item" @click="$router.push('/profile/notifications')">
            <div class="entry-icon"><el-icon size="32"><Bell /></el-icon></div>
            <span>消息通知</span>
          </div>
        </div>
      </div>
      
      <div class="content-row">
        <div class="content-col">
          <div class="section-header mb-16">
            <h3 class="section-title">热门服务</h3>
            <router-link to="/services" class="more">查看更多 <el-icon><ArrowRight /></el-icon></router-link>
          </div>
          <div class="service-list">
            <div v-for="item in hotServices" :key="item.id" class="service-item card" @click="$router.push(`/services/${item.id}`)">
              <div class="service-icon">
                <el-icon size="28" :color="getServiceIconColor(item.id)"><Service /></el-icon>
              </div>
              <div class="service-info">
                <h4>{{ item.item_name }}</h4>
                <p>{{ item.department_name || item.service_type }}</p>
              </div>
              <el-button type="primary" size="small">立即办理</el-button>
            </div>
          </div>
        </div>
        
        <div class="content-col">
          <div class="section-header mb-16">
            <h3 class="section-title">一件事服务</h3>
            <router-link to="/scenarios" class="more">查看更多 <el-icon><ArrowRight /></el-icon></router-link>
          </div>
          <div class="scenario-list">
            <div v-for="item in scenarios" :key="item.id" class="scenario-item card" @click="$router.push(`/scenarios/${item.id}`)">
              <div class="scenario-icon">{{ item.icon }}</div>
              <div class="scenario-info">
                <h4>{{ item.scenario_name }}</h4>
                <p>{{ item.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="content-row">
        <div class="content-col">
          <div class="section-header mb-16">
            <h3 class="section-title">政策解读</h3>
            <router-link to="/policies" class="more">查看更多 <el-icon><ArrowRight /></el-icon></router-link>
          </div>
          <div class="policy-list card">
            <div v-for="item in policies" :key="item.id" class="policy-item" @click="$router.push(`/policies/${item.id}`)">
              <div class="policy-tag" :class="{ hot: item.is_hot }">{{ item.policy_type }}</div>
              <div class="policy-content">
                <h4>{{ item.title }}</h4>
                <p>{{ item.publish_department }} · {{ formatDate(item.publish_time) }}</p>
              </div>
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
        
        <div class="content-col">
          <div class="section-header mb-16">
            <h3 class="section-title">服务统计</h3>
          </div>
          <div class="stats-grid">
            <div class="stat-item card">
              <div class="stat-value">{{ stats.totalServices || '--' }}</div>
              <div class="stat-label">服务事项</div>
            </div>
            <div class="stat-item card">
              <div class="stat-value">{{ stats.todayApplications || '--' }}</div>
              <div class="stat-label">今日办件</div>
            </div>
            <div class="stat-item card">
              <div class="stat-value">{{ stats.completedRate || '--' }}%</div>
              <div class="stat-label">办结率</div>
            </div>
            <div class="stat-item card">
              <div class="stat-value">{{ stats.satisfaction || '--' }}</div>
              <div class="stat-label">满意度</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { serviceItemApi, scenarioApi, policyApi, statisticsApi } from '@/api'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()

const searchKeyword = ref('')
const hotTags = ['身份证办理', '结婚登记', '企业开办', '社保参保', '公积金提取']
const hotServices = ref([])
const scenarios = ref([])
const policies = ref([])
const stats = ref({})

const getServiceIconColor = (id) => {
  const colors = ['#1e88e5', '#43a047', '#fb8c00', '#e53935', '#8e24aa']
  return colors[id % colors.length]
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD')
}

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({ path: '/services', query: { keyword: searchKeyword.value } })
  }
}

const searchTag = (tag) => {
  searchKeyword.value = tag
  handleSearch()
}

const goToProfile = (path) => {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: `/profile/${path}` } })
    return
  }
  router.push(`/profile/${path}`)
}

const fetchData = async () => {
  try {
    const [res1, res2, res3] = await Promise.all([
      serviceItemApi.hot({ pageSize: 6 }),
      scenarioApi.list({ pageSize: 4 }),
      policyApi.list({ pageSize: 5 })
    ])
    
    if (res1.code === 200) hotServices.value = res1.data || []
    if (res2.code === 200) scenarios.value = res2.data?.list || res2.data || []
    if (res3.code === 200) policies.value = res3.data?.list || res3.data || []
  } catch (e) {
    console.error('加载首页数据失败:', e)
  }
  
  try {
    const res4 = await statisticsApi.overview()
    if (res4.code === 200) stats.value = res4.data || {}
  } catch (e) {
    stats.value = {
      totalServices: 128,
      todayApplications: 356,
      completedRate: 98.5,
      satisfaction: '4.9'
    }
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.home-page {
  .banner {
    background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
    color: #fff;
    padding: 60px 0;
    margin-bottom: 30px;
    
    .container {
      display: flex;
      align-items: center;
      gap: 40px;
    }
    
    .banner-content {
      flex: 1;
      
      h1 {
        font-size: 42px;
        font-weight: 700;
        margin-bottom: 12px;
      }
      
      .subtitle {
        font-size: 18px;
        opacity: 0.9;
        margin-bottom: 30px;
      }
      
      .search-box {
        max-width: 500px;
        margin-bottom: 16px;
      }
      
      .hot-search {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        opacity: 0.9;
        
        .el-tag {
          cursor: pointer;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: #fff;
          
          &:hover {
            background: rgba(255, 255, 255, 0.3);
          }
        }
      }
    }
    
    .banner-image {
      width: 400px;
      flex-shrink: 0;
      
      .banner-visual {
        width: 100%;
        height: 280px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        background:
          radial-gradient(circle at 22% 18%, rgba(255, 255, 255, 0.52), transparent 28%),
          linear-gradient(135deg, #eef7ff 0%, #b9defc 46%, #0d47a1 100%);
        position: relative;
        overflow: hidden;
      }

      .visual-card {
        position: absolute;
        width: 156px;
        min-height: 88px;
        border-radius: 10px;
        padding: 18px;
        background: rgba(255, 255, 255, 0.92);
        color: #1f2d3d;
        box-shadow: 0 12px 26px rgba(13, 71, 161, 0.18);
        display: flex;
        flex-direction: column;
        gap: 8px;

        span {
          font-size: 14px;
          color: #606266;
        }

        strong {
          font-size: 24px;
          color: #1e88e5;
        }
      }

      .visual-card.primary {
        left: 42px;
        top: 48px;
      }

      .visual-card.secondary {
        right: 38px;
        bottom: 42px;
      }

      .visual-steps {
        position: absolute;
        left: 70px;
        right: 70px;
        bottom: 36px;
        height: 3px;
        background: rgba(255, 255, 255, 0.72);

        i {
          position: absolute;
          top: -8px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.25);
        }

        i:nth-child(1) {
          left: 0;
        }

        i:nth-child(2) {
          left: 50%;
          transform: translateX(-50%);
        }

        i:nth-child(3) {
          right: 0;
        }
      }
    }
  }
}

.quick-entry {
  .entry-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 16px;
  }
  
  .entry-item {
    text-align: center;
    padding: 20px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background: #f5f7fa;
      transform: translateY(-2px);
    }
    
    .entry-icon {
      width: 60px;
      height: 60px;
      margin: 0 auto 12px;
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1e88e5;
    }
    
    span {
      font-size: 14px;
      color: #606266;
    }
  }
}

.content-row {
  display: flex;
  gap: 24px;
  margin-bottom: 30px;
  
  .content-col {
    flex: 1;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .more {
    font-size: 14px;
    color: #1e88e5;
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.service-list {
  .service-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }
    
    .service-icon {
      width: 56px;
      height: 56px;
      background: #f5f7fa;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .service-info {
      flex: 1;
      
      h4 {
        font-size: 16px;
        margin: 0 0 4px;
        color: #303133;
      }
      
      p {
        font-size: 13px;
        color: #909399;
        margin: 0;
      }
    }
  }
}

.scenario-list {
  .scenario-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }
    
    .scenario-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      flex-shrink: 0;
    }
    
    .scenario-info {
      flex: 1;
      
      h4 {
        font-size: 16px;
        margin: 0 0 4px;
        color: #303133;
      }
      
      p {
        font-size: 13px;
        color: #909399;
        margin: 0;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }
}

.policy-list {
  padding: 0 24px;
  
  .policy-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid #ebeef5;
    cursor: pointer;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      .policy-content h4 {
        color: #1e88e5;
      }
    }
    
    .policy-tag {
      background: #e3f2fd;
      color: #1e88e5;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      flex-shrink: 0;
      
      &.hot {
        background: #ffebee;
        color: #f44336;
      }
    }
    
    .policy-content {
      flex: 1;
      min-width: 0;
      
      h4 {
        font-size: 15px;
        margin: 0 0 4px;
        color: #303133;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: color 0.3s;
      }
      
      p {
        font-size: 13px;
        color: #909399;
        margin: 0;
      }
    }
    
    .el-icon {
      color: #c0c4cc;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  
  .stat-item {
    padding: 24px;
    text-align: center;
    
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #1e88e5;
      margin-bottom: 8px;
    }
    
    .stat-label {
      font-size: 14px;
      color: #909399;
    }
  }
}
</style>
