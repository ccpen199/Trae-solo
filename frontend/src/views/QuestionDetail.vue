<template>
  <div class="question-detail" v-if="!loading && !error">
    <div class="question-header" v-if="question?.id">
      <div class="question-meta">
        <el-tag size="small" v-if="question.category_name">{{ question.category_name }}</el-tag>
        <span class="view-count">{{ question.view_count || 0 }} 浏览</span>
      </div>
      <h1 class="question-title">{{ question.title }}</h1>
      <div class="question-author" @click="goToUser(question.author_id)">
        <el-avatar :size="40" :src="question.author_avatar">
          {{ (question.author_username || '').charAt(0).toUpperCase() }}
        </el-avatar>
        <div class="author-info">
          <span class="author-name">{{ question.author_username || '匿名用户' }}</span>
          <span class="question-time">{{ formatTime(question.created_at) }}</span>
        </div>
      </div>
      <div class="question-content" v-html="question.content"></div>
      <div class="question-actions">
        <el-button 
          :type="question.is_liked ? 'primary' : 'default'" 
          @click="handleLike"
          :disabled="submitting"
        >
          <el-icon><thumb-up /></el-icon>
          赞同 {{ question.like_count || 0 }}
        </el-button>
        <el-button 
          :type="question.is_favorited ? 'primary' : 'default'" 
          @click="handleFavorite"
          :disabled="submitting"
        >
          <el-icon><star /></el-icon>
          收藏
        </el-button>
        <el-button @click="showReportDialog = true">
          <el-icon><warning /></el-icon>
          举报
        </el-button>
      </div>
    </div>

    <div class="answers-section">
      <div class="section-header">
        <h2>{{ answerCount }} 个回答</h2>
        <el-radio-group v-model="answerSort" size="small" @change="loadAnswers">
          <el-radio-button label="newest">最新</el-radio-button>
          <el-radio-button label="hot">最热</el-radio-button>
        </el-radio-group>
      </div>

      <div class="answer-form" v-if="userStore.isLoggedIn">
        <el-input
          v-model="answerContent"
          type="textarea"
          :rows="4"
          placeholder="写下你的回答..."
        />
        <div class="form-actions">
          <el-button 
            type="primary" 
            @click="submitAnswer"
            :loading="submittingAnswer"
          >
            提交回答
          </el-button>
        </div>
      </div>
      <div class="answer-form" v-else>
        <el-text type="info">
          <router-link to="/login">登录</router-link> 后可以回答问题
        </el-text>
      </div>

      <div class="answers-list">
        <div class="answer-item" v-for="answer in answers" :key="answer.id">
          <div class="answer-header">
            <el-avatar :size="32" :src="answer.author_avatar" @click="goToUser(answer.author_id)">
              {{ (answer.author_username || '').charAt(0).toUpperCase() }}
            </el-avatar>
            <div class="answer-meta">
              <span class="author-name" @click="goToUser(answer.author_id)">{{ answer.author_username || '匿名用户' }}</span>
              <span class="answer-time">{{ formatTime(answer.created_at) }}</span>
            </div>
          </div>
          <div class="answer-content" v-html="answer.content"></div>
          <div class="answer-actions">
            <el-button 
              type="text" 
              :type="answer.is_liked ? 'primary' : 'default'" 
              @click="handleAnswerLike(answer)"
            >
              <el-icon><thumb-up /></el-icon>
              {{ answer.like_count || 0 }}
            </el-button>
            <el-button 
              type="text" 
              @click="toggleComment(answer.id)"
            >
              <el-icon><chat-dot-round /></el-icon>
              评论 {{ answer.comment_count || 0 }}
            </el-button>
            <el-button 
              type="text" 
              v-if="question.author_id === userStore.user?.id && !question.accepted_answer_id"
              @click="handleAcceptAnswer(answer.id)"
            >
              <el-icon><check /></el-icon>
              采纳
            </el-button>
            <el-tag 
              v-if="answer.id === question.accepted_answer_id" 
              type="success" 
              size="small"
            >
              已采纳
            </el-tag>
          </div>
          
          <div class="comments-section" v-if="expandedComments.includes(answer.id)">
            <div class="comment-item" v-for="comment in (answerComments[answer.id] || [])" :key="comment.id">
              <span class="comment-author">{{ comment.author_username || '匿名用户' }}</span>
              <span class="comment-content">{{ comment.content }}</span>
              <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
            </div>
            <div class="comment-input" v-if="userStore.isLoggedIn">
              <el-input
                v-model="newComment"
                size="small"
                placeholder="写下评论..."
                @keyup.enter="submitComment(answer.id)"
              >
                <template #append>
                  <el-button @click="submitComment(answer.id)">发送</el-button>
                </template>
              </el-input>
            </div>
            <div v-else class="comment-input">
              <router-link to="/login">登录</router-link> 后可以评论
            </div>
          </div>
        </div>
        
        <el-empty v-if="answers.length === 0" description="暂无回答，快来抢沙发吧" />
        
        <div class="load-more" v-if="hasMoreAnswers">
          <el-button @click="loadMoreAnswers" :loading="loadingAnswers">加载更多</el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="showReportDialog" title="举报" width="400px">
      <el-radio-group v-model="reportReason">
        <el-radio label="spam">垃圾广告</el-radio>
        <el-radio label="inappropriate">内容不当</el-radio>
        <el-radio label="violent">暴力色情</el-radio>
        <el-radio label="other">其他</el-radio>
      </el-radio-group>
      <el-input
        v-model="reportDescription"
        type="textarea"
        :rows="2"
        placeholder="补充说明（可选）"
        style="margin-top: 16px"
      />
      <template #footer>
        <el-button @click="showReportDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReport" :loading="submitting">提交</el-button>
      </template>
    </el-dialog>
  </div>

  <div v-if="loading" class="loading-container">
    <el-skeleton :count="5" animated />
  </div>

  <div v-if="error" class="error-container">
    <el-empty :description="errorMessage">
      <el-button type="primary" @click="retry">重试</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ThumbUp, Star, Warning, Check, ChatDotRound } from '@element-plus/icons-vue';
import { questionApi, answerApi, commentApi } from '@/api';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(true);
const error = ref(false);
const errorMessage = ref('');
const question = ref(null);
const answers = ref([]);
const answerCount = ref(0);
const answerSort = ref('hot');
const answerPage = ref(1);
const hasMoreAnswers = ref(false);
const loadingAnswers = ref(false);
const answerContent = ref('');
const submittingAnswer = ref(false);
const submitting = ref(false);
const expandedComments = ref([]);
const answerComments = reactive({});
const newComment = ref('');
const showReportDialog = ref(false);
const reportReason = ref('spam');
const reportDescription = ref('');

const questionId = computed(() => parseInt(route.params.id));

const loadQuestion = async () => {
  loading.value = true;
  error.value = false;
  try {
    const response = await questionApi.getDetail(questionId.value);
    if (response.data?.success) {
      question.value = response.data.data || null;
      if (question.value) {
        loadAnswers();
      }
    } else {
      error.value = true;
      errorMessage.value = response.data?.message || '加载失败';
    }
  } catch (err) {
    error.value = true;
    errorMessage.value = err.response?.data?.message || '网络错误，请重试';
  } finally {
    loading.value = false;
  }
};

const loadAnswers = async () => {
  answerPage.value = 1;
  answers.value = [];
  await fetchAnswers();
};

const fetchAnswers = async () => {
  loadingAnswers.value = true;
  try {
    const response = await answerApi.getList(questionId.value, {
      page: answerPage.value,
      page_size: 10,
      sort: answerSort.value
    });
    if (response.data?.success) {
      const data = response.data.data || {};
      if (answerPage.value === 1) {
        answers.value = data.items || [];
      } else {
        answers.value = [...answers.value, ...(data.items || [])];
      }
      answerCount.value = data.total || 0;
      hasMoreAnswers.value = (answerPage.value * 10) < answerCount.value;
    }
  } catch (err) {
    ElMessage.error('加载回答失败');
  } finally {
    loadingAnswers.value = false;
  }
};

const loadMoreAnswers = () => {
  answerPage.value++;
  fetchAnswers();
};

const submitAnswer = async () => {
  if (!answerContent.value.trim()) {
    ElMessage.warning('请输入回答内容');
    return;
  }
  submittingAnswer.value = true;
  try {
    const response = await answerApi.create({
      question_id: questionId.value,
      content: answerContent.value
    });
    if (response.data?.success) {
      ElMessage.success('回答提交成功');
      answerContent.value = '';
      loadAnswers();
    } else {
      ElMessage.error(response.data?.message || '提交失败');
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '提交失败');
  } finally {
    submittingAnswer.value = false;
  }
};

const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  submitting.value = true;
  try {
    const response = await questionApi.like(questionId.value);
    if (response.data?.success) {
      question.value.is_liked = !question.value.is_liked;
      question.value.like_count += question.value.is_liked ? 1 : -1;
    }
  } catch (err) {
    ElMessage.error('操作失败');
  } finally {
    submitting.value = false;
  }
};

const handleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  submitting.value = true;
  try {
    const response = await questionApi.favorite(questionId.value);
    if (response.data?.success) {
      question.value.is_favorited = !question.value.is_favorited;
      ElMessage.success(question.value.is_favorited ? '已收藏' : '已取消收藏');
    }
  } catch (err) {
    ElMessage.error('操作失败');
  } finally {
    submitting.value = false;
  }
};

const handleAnswerLike = async (answer) => {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  try {
    const response = await answerApi.like(answer.id);
    if (response.data?.success) {
      answer.is_liked = !answer.is_liked;
      answer.like_count += answer.is_liked ? 1 : -1;
    }
  } catch (err) {
    ElMessage.error('操作失败');
  }
};

const handleAcceptAnswer = async (answerId) => {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  try {
    const response = await answerApi.accept(answerId);
    if (response.data?.success) {
      question.value.accepted_answer_id = answerId;
      ElMessage.success('采纳成功');
    }
  } catch (err) {
    ElMessage.error('操作失败');
  }
};

const toggleComment = async (answerId) => {
  if (expandedComments.value.includes(answerId)) {
    expandedComments.value = expandedComments.value.filter(id => id !== answerId);
  } else {
    expandedComments.value.push(answerId);
    await loadComments(answerId);
  }
};

const loadComments = async (answerId) => {
  try {
    const response = await commentApi.getList({
      target_type: 'answer',
      target_id: answerId,
      page_size: 50
    });
    if (response.data?.success) {
      answerComments[answerId] = response.data.data?.items || [];
    }
  } catch (err) {
    console.error('Load comments error:', err);
  }
};

const submitComment = async (answerId) => {
  if (!newComment.value.trim()) {
    ElMessage.warning('请输入评论内容');
    return;
  }
  try {
    const response = await commentApi.create({
      target_type: 'answer',
      target_id: answerId,
      content: newComment.value
    });
    if (response.data?.success) {
      ElMessage.success('评论成功');
      newComment.value = '';
      loadComments(answerId);
      const answer = answers.value.find(a => a.id === answerId);
      if (answer) answer.comment_count = (answer.comment_count || 0) + 1;
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '评论失败');
  }
};

const submitReport = async () => {
  try {
    const response = await questionApi.report(questionId.value, {
      reason: reportReason.value,
      description: reportDescription.value
    });
    if (response.data?.success) {
      ElMessage.success('举报已提交');
      showReportDialog.value = false;
      reportReason.value = 'spam';
      reportDescription.value = '';
    }
  } catch (err) {
    ElMessage.error('举报失败');
  }
};

const goToUser = (userId) => {
  router.push(`/user/${userId}`);
};

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
  return date.toLocaleDateString();
};

const retry = () => {
  loadQuestion();
};

watch(() => route.params.id, () => {
  loadQuestion();
});

onMounted(() => {
  loadQuestion();
});
</script>

<style scoped>
.question-detail {
  max-width: 800px;
  margin: 0 auto;
}

.question-header {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.view-count {
  color: #909399;
  font-size: 13px;
}

.question-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  line-height: 1.5;
}

.question-author {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  cursor: pointer;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.author-name {
  font-weight: 500;
  color: #303133;
}

.question-time {
  color: #909399;
  font-size: 13px;
}

.question-content {
  font-size: 15px;
  line-height: 1.75;
  color: #303133;
  margin-bottom: 20px;
}

.question-content :deep(img) {
  max-width: 100%;
  height: auto;
}

.question-actions {
  display: flex;
  gap: 12px;
}

.answers-section {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header h2 {
  font-size: 18px;
  margin: 0;
}

.answer-form {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.form-actions {
  margin-top: 12px;
  text-align: right;
}

.answer-item {
  padding: 20px 0;
  border-bottom: 1px solid #f0f0f0;
}

.answer-item:last-child {
  border-bottom: none;
}

.answer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.answer-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.answer-time {
  color: #909399;
  font-size: 13px;
}

.answer-content {
  font-size: 14px;
  line-height: 1.75;
  color: #303133;
  margin-bottom: 12px;
}

.answer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comments-section {
  margin-top: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
}

.comment-item {
  padding: 8px 0;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.comment-author {
  color: #409eff;
  font-weight: 500;
}

.comment-content {
  flex: 1;
  color: #606266;
}

.comment-time {
  color: #c0c4cc;
  font-size: 12px;
}

.comment-input {
  margin-top: 8px;
}

.load-more {
  text-align: center;
  margin-top: 20px;
}

.loading-container, .error-container {
  padding: 40px;
  text-align: center;
}
</style>
