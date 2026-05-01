<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">连接智慧，共享知识</h1>
        <p class="hero-subtitle">
          专业的问答社区平台，连接各领域专家，为您提供高质量的解答
        </p>
        <div class="hero-actions">
          <router-link to="/ask">
            <el-button type="primary" size="large">
              <el-icon><Edit /></el-icon>
              我要提问
            </el-button>
          </router-link>
          <router-link to="/questions">
            <el-button size="large">
              <el-icon><Search /></el-icon>
              浏览问题
            </el-button>
          </router-link>
        </div>
      </div>
    </div>

    <div class="stats-section">
      <div class="stats-container">
        <div class="stat-item">
          <div class="stat-icon">
            <el-icon :size="32" color="#409eff"><QuestionFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.questions }}</div>
            <div class="stat-label">问题总数</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">
            <el-icon :size="32" color="#67c23a"><EditPen /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.answers }}</div>
            <div class="stat-label">回答总数</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">
            <el-icon :size="32" color="#e6a23c"><UserFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.experts }}</div>
            <div class="stat-label">认证专家</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">
            <el-icon :size="32" color="#f56c6c"><Reading /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.knowledge }}</div>
            <div class="stat-label">知识库内容</div>
          </div>
        </div>
      </div>
    </div>

    <div class="features-section">
      <h2 class="section-title">平台特色</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon expert-matching">
            <el-icon :size="40"><Connection /></el-icon>
          </div>
          <h3>Expert-Matching</h3>
          <p>智能专家匹配引擎，通过语义分析自动匹配最合适的领域专家，确保问题得到专业解答。</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon knowledge-graph">
            <el-icon :size="40"><Share /></el-icon>
          </div>
          <h3>Knowledge-Graph</h3>
          <p>知识图谱引擎，自动关联相关知识点，构建完整的知识网络，支持全站检索。</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon quality-credit">
            <el-icon :size="40"><Trophy /></el-icon>
          </div>
          <h3>Quality-Credit</h3>
          <p>信用评级体系，对恶意行为自动拦截，维护社区秩序，保障内容质量。</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon revenue-settlement">
            <el-icon :size="40"><Wallet /></el-icon>
          </div>
          <h3>Revenue-Settlement</h3>
          <p>智能结算引擎，回答被采纳后自动分配赏金，支持资金和积分双重激励机制。</p>
        </div>
      </div>
    </div>

    <div class="hot-questions-section">
      <div class="section-header">
        <h2 class="section-title">热门问题</h2>
        <router-link to="/questions">
          <el-button type="primary" text>查看全部 <el-icon><ArrowRight /></el-icon></el-button>
        </router-link>
      </div>
      <div class="questions-list">
        <el-card v-for="question in hotQuestions" :key="question.questionId" class="question-card">
          <router-link :to="`/questions/${question.questionId}`" class="question-link">
            <h3 class="question-title">{{ question.title }}</h3>
            <p class="question-excerpt">{{ question.content?.substring(0, 100) }}...</p>
            <div class="question-tags">
              <el-tag v-for="tag in question.tags?.slice(0, 3)" :key="tag" size="small" type="info">
                {{ tag }}
              </el-tag>
            </div>
            <div class="question-meta">
              <div class="meta-item">
                <el-icon><User /></el-icon>
                <span>{{ question.author?.username || '匿名用户' }}</span>
              </div>
              <div class="meta-item">
                <el-icon><ChatDotRound /></el-icon>
                <span>{{ question.stats?.answerCount || 0 }} 回答</span>
              </div>
              <div class="meta-item">
                <el-icon><View /></el-icon>
                <span>{{ question.stats?.viewCount || 0 }} 浏览</span>
              </div>
              <div class="meta-item reward" v-if="question.reward?.points || question.reward?.money">
                <el-icon><Wallet /></el-icon>
                <span>
                  {{ question.reward?.money ? `¥${question.reward.money}` : '' }}
                  {{ question.reward?.points ? `${question.reward.points}积分` : '' }}
                </span>
              </div>
            </div>
          </router-link>
        </el-card>
      </div>
    </div>

    <div class="workflow-section">
      <h2 class="section-title">完整业务链路</h2>
      <div class="workflow-steps">
        <div class="step-item">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>业务请求</h3>
            <p>提问者发布问题，设置悬赏</p>
          </div>
          <div class="step-arrow">→</div>
        </div>
        <div class="step-item">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>处理工单</h3>
            <p>语义解析，专家匹配</p>
          </div>
          <div class="step-arrow">→</div>
        </div>
        <div class="step-item">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>关联凭证</h3>
            <p>回答撰写，投票排序</p>
          </div>
          <div class="step-arrow">→</div>
        </div>
        <div class="step-item">
          <div class="step-number">4</div>
          <div class="step-content">
            <h3>结果确认</h3>
            <p>采纳答案，资金结算</p>
          </div>
          <div class="step-arrow">→</div>
        </div>
        <div class="step-item">
          <div class="step-number">5</div>
          <div class="step-content">
            <h3>归档记录</h3>
            <p>收录知识库，永久存档</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

const stats = ref({
  questions: 0,
  answers: 0,
  experts: 0,
  knowledge: 0
})

const hotQuestions = ref([])

onMounted(async () => {
  try {
    const response = await api.get('/questions', {
      params: { limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }
    })
    hotQuestions.value = response.data.data?.questions || []
  } catch (error) {
    console.error('Failed to load questions:', error)
    hotQuestions.value = [
      {
        questionId: 'Q-DEMO-001',
        title: '如何优化大型React应用的性能？',
        content: '我有一个大型React应用，随着功能增加变得越来越慢。请问有哪些常见的性能优化策略？',
        tags: ['React', '性能优化', '前端'],
        stats: { answerCount: 12, viewCount: 1543 },
        reward: { points: 100 },
        author: { username: '前端开发者' }
      },
      {
        questionId: 'Q-DEMO-002',
        title: 'Python中如何处理大规模数据的内存管理？',
        content: '我正在处理一个超过10GB的数据集，直接加载到内存会导致OOM错误。请问有什么好的解决方案？',
        tags: ['Python', '数据处理', '内存管理'],
        stats: { answerCount: 8, viewCount: 892 },
        reward: { money: 50 },
        author: { username: '数据工程师' }
      },
      {
        questionId: 'Q-DEMO-003',
        title: '微服务架构下如何保证数据一致性？',
        content: '在微服务架构中，每个服务有自己的数据库。当一个业务操作涉及多个服务时，如何保证数据的最终一致性？',
        tags: ['微服务', '分布式系统', '数据一致性'],
        stats: { answerCount: 15, viewCount: 2341 },
        reward: { points: 200, money: 100 },
        author: { username: '架构师' }
      }
    ]
  }

  stats.value = {
    questions: 12580,
    answers: 45670,
    experts: 892,
    knowledge: 5678
  }
})
</script>

<style lang="scss" scoped>
.home-page {
  margin: -20px;
  width: calc(100% + 40px);
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 80px 20px;
  text-align: center;
  color: #fff;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 20px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.hero-subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 40px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.stats-section {
  background: #fff;
  padding: 40px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.stats-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 64px;
  height: 64px;
  background: #f5f7fa;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.features-section {
  padding: 60px 20px;
  background: #f5f7fa;
}

.section-title {
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 40px;
}

.features-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
}

.feature-card {
  background: #fff;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  }
}

.feature-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;

  &.expert-matching {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }

  &.knowledge-graph {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: #fff;
  }

  &.quality-credit {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: #fff;
  }

  &.revenue-settlement {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    color: #fff;
  }
}

.feature-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #303133;
}

.feature-card p {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.hot-questions-section {
  padding: 60px 20px;
  background: #fff;
}

.section-header {
  max-width: 1200px;
  margin: 0 auto 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .section-title {
    margin-bottom: 0;
    text-align: left;
  }
}

.questions-list {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  gap: 20px;
}

.question-card {
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateX(8px);
  }
}

.question-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.question-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  transition: color 0.3s;

  .question-link:hover & {
    color: #409eff;
  }
}

.question-excerpt {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
  line-height: 1.6;
}

.question-tags {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;

  .el-icon {
    font-size: 14px;
  }

  &.reward {
    color: #e6a23c;
    font-weight: 500;
  }
}

.workflow-section {
  padding: 60px 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
}

.workflow-steps {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
  min-width: 180px;
  position: relative;
}

.step-number {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.step-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.step-content p {
  font-size: 13px;
  color: #606266;
}

.step-arrow {
  position: absolute;
  right: -30px;
  top: 24px;
  font-size: 24px;
  color: #909399;
  font-weight: 300;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 28px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .workflow-steps {
    flex-direction: column;
    align-items: center;
  }

  .step-item {
    min-width: auto;
  }

  .step-arrow {
    display: none;
  }
}
</style>
