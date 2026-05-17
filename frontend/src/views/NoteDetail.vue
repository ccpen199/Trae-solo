<template>
  <div class="note-detail">
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else-if="note" class="note-content card">
      <div class="note-header">
        <h1 class="note-title">{{ note.title }}</h1>
        <div class="author-info" @click="goToUser">
          <el-avatar :size="48" :src="note.avatar" />
          <div class="author-details">
            <span class="author-name">{{ note.nickname }}</span>
            <span class="publish-time">{{ note.created_at }}</span>
          </div>
          <el-button type="primary" size="small">关注</el-button>
        </div>
      </div>

      <div class="note-images">
        <img
          v-for="(img, index) in note.images"
          :key="index"
          :src="img"
          class="note-image"
        />
      </div>

      <div class="note-body">
        <p class="note-text">{{ note.content }}</p>
      </div>

      <div class="note-actions">
        <el-button :type="isLiked ? 'danger' : 'default'" @click="toggleLike">
❤️
          {{ note.likes_count || 0 }} 点赞
        </el-button>
        <el-button :type="isCollected ? 'primary' : 'default'" @click="toggleCollect">
          <el-icon><Star /></el-icon>
          {{ note.collects_count || 0 }} 收藏
        </el-button>
        <el-button>
          <el-icon><Share /></el-icon>
          分享
        </el-button>
        <span class="view-count">👁️ {{ note.views_count || 0 }} 浏览</span>
      </div>

      <div class="comments-section">
        <h3>评论 ({{ note.comments_count || 0 }})</h3>
        <div class="comment-input">
          <el-input
            v-model="commentText"
            type="textarea"
            :rows="3"
            placeholder="写下你的评论..."
          />
          <el-button type="primary" class="send-btn" @click="sendComment">
            发送
          </el-button>
        </div>

        <div v-if="comments.length === 0" class="empty-comments">
          暂无评论，快来抢沙发吧
        </div>

        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <el-avatar :size="36" :src="comment.avatar" />
          <div class="comment-content">
            <div class="comment-header">
              <span class="comment-author">{{ comment.nickname }}</span>
              <span class="comment-time">{{ comment.created_at }}</span>
            </div>
            <p class="comment-text">{{ comment.content }}</p>
            <div class="comment-actions">
              <el-button size="small" text>
                <el-icon><ChatDotRound /></el-icon>
                回复
              </el-button>
              <el-button size="small" text>
      ❤️
                {{ comment.likes_count || 0 }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="relatedNotes.length > 0" class="related-notes">
      <h3>相关推荐</h3>
      <div class="masonry-grid">
        <div v-for="note in relatedNotes" :key="note.id" class="masonry-item">
          <NoteCard :note="note" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { Star, Share, ChatDotRound } from '@element-plus/icons-vue'
import NoteCard from '@/components/NoteCard.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const note = ref(null)
const relatedNotes = ref([])
const comments = ref([])
const commentText = ref('')
const isLiked = ref(false)
const isCollected = ref(false)

const fetchNoteDetail = async () => {
  loading.value = true
  try {
    const res = await request.get(`/notes/${route.params.id}`)
    note.value = res.data.note
    relatedNotes.value = res.data.relatedNotes || []
    isLiked.value = res.data.note?.isLiked || false
    isCollected.value = res.data.note?.isCollected || false
    fetchComments()
  } catch (error) {
    console.error('获取笔记详情失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchComments = async () => {
  try {
    const res = await request.get(`/notes/${route.params.id}/comments`)
    comments.value = res.data.list || []
  } catch (error) {
    console.error('获取评论失败:', error)
  }
}

const toggleLike = async () => {
  try {
    await request.post(`/notes/${route.params.id}/like`)
    isLiked.value = !isLiked.value
    if (isLiked.value) {
      note.value.likes_count++
      ElMessage.success('点赞成功')
    } else {
      note.value.likes_count--
      ElMessage.success('取消点赞')
    }
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

const toggleCollect = async () => {
  try {
    await request.post(`/notes/${route.params.id}/collect`)
    isCollected.value = !isCollected.value
    if (isCollected.value) {
      note.value.collects_count++
      ElMessage.success('收藏成功')
    } else {
      note.value.collects_count--
      ElMessage.success('取消收藏')
    }
  } catch (error) {
    console.error('收藏失败:', error)
  }
}

const sendComment = async () => {
  if (!commentText.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  try {
    await request.post(`/notes/${route.params.id}/comments`, {
      content: commentText.value
    })
    ElMessage.success('评论成功')
    commentText.value = ''
    fetchComments()
  } catch (error) {
    console.error('评论失败:', error)
  }
}

const goToUser = () => {
  router.push(`/user/${note.value.user_id}`)
}

onMounted(() => {
  fetchNoteDetail()
})
</script>

<style lang="scss" scoped>
.note-detail {
  max-width: 800px;
  margin: 0 auto;

  .note-content {
    padding: 24px;
    margin-bottom: 20px;

    .note-header {
      margin-bottom: 20px;

      .note-title {
        font-size: 24px;
        font-weight: 700;
        margin: 0 0 16px 0;
      }

      .author-info {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;

        .author-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;

          .author-name {
            font-size: 16px;
            font-weight: 600;
          }

          .publish-time {
            font-size: 12px;
            color: #999;
          }
        }
      }
    }

    .note-images {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 20px;

      .note-image {
        width: 100%;
        border-radius: 8px;
      }
    }

    .note-body {
      .note-text {
        font-size: 15px;
        line-height: 1.8;
        color: #333;
        white-space: pre-wrap;
      }
    }

    .note-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 0;
      border-top: 1px solid #eee;
      border-bottom: 1px solid #eee;
      margin: 20px 0;

      .view-count {
        margin-left: auto;
        color: #999;
        font-size: 14px;
      }
    }

    .comments-section {
      h3 {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 16px 0;
      }

      .comment-input {
        margin-bottom: 24px;

        .send-btn {
          margin-top: 12px;
        }
      }

      .empty-comments {
        text-align: center;
        padding: 40px;
        color: #999;
      }

      .comment-item {
        display: flex;
        gap: 12px;
        padding: 16px 0;
        border-bottom: 1px solid #f5f5f5;

        .comment-content {
          flex: 1;

          .comment-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;

            .comment-author {
              font-weight: 600;
            }

            .comment-time {
              font-size: 12px;
              color: #999;
            }
          }

          .comment-text {
            margin: 0 0 8px 0;
            line-height: 1.6;
          }

          .comment-actions {
            display: flex;
            gap: 16px;
          }
        }
      }
    }
  }

  .related-notes {
    h3 {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 16px 0;
    }
  }
}
</style>
