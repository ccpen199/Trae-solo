<template>
  <div class="review">
    <div class="header">
      <button class="back-btn" @click="$router.push('/')">←</button>
      <h2>评价</h2>
    </div>
    
    <div class="content">
      <div class="card">
        <h3>整体评分</h3>
        <div class="rating">
          <span 
            v-for="i in 5" 
            :key="i"
            class="star"
            :class="{ active: i <= rating }"
            @click="rating = i"
          >⭐</span>
        </div>
        
        <h3 style="margin-top: 24px;">评价内容</h3>
        <textarea 
          v-model="comment"
          placeholder="请输入您的评价..."
          rows="4"
        ></textarea>
        
        <button 
          class="btn btn-primary btn-block" 
          @click="submitReview"
          :disabled="submitting"
          style="margin-top: 24px;"
        >
          {{ submitting ? '提交中...' : '提交评价' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Review',
  data() {
    return {
      rating: 5,
      comment: '',
      submitting: false
    }
  },
  methods: {
    async submitReview() {
      if (this.submitting) return
      this.submitting = true
      
      try {
        const restaurantId = localStorage.getItem('restaurantId') || 1
        await axios.post('http://localhost:19881/api/reviews', {
          restaurant_id: restaurantId,
          order_id: this.$route.params.orderId,
          rating: this.rating,
          comment: this.comment
        })
        alert('评价提交成功！')
        this.$router.push('/')
      } catch (e) {
        console.error(e)
        alert('提交失败，请重试')
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.review {
  min-height: 100vh;
  background: #f5f5f5;
}
.header {
  background: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.back-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
}
.header h2 {
  font-size: 18px;
  color: #333;
}
.content {
  padding: 20px;
}
.card h3 {
  margin-bottom: 16px;
  color: #333;
}
.rating {
  display: flex;
  gap: 8px;
}
.star {
  font-size: 32px;
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.3s;
}
.star.active {
  opacity: 1;
}
textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  resize: none;
}
textarea:focus {
  outline: none;
  border-color: #ff6b6b;
}
</style>
