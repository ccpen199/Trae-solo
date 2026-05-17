import React, { useState, useEffect, useCallback } from 'react';
import { FaHeart, FaComment, FaShare, FaPlay, FaPause, FaThumbsUp, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { recommendationApi, commentApi } from '../api';
import { useUIStore, useUserStore } from '../store';
import { parseLyrics, formatTime, formatDate } from '../utils';

const Player = ({ recommendation, onNext, onPrev }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [hearted, setHearted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [heartCount, setHeartCount] = useState(recommendation?.heart_count || 0);
  const [likeCount, setLikeCount] = useState(recommendation?.like_count || 0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [showReason, setShowReason] = useState(true);
  
  const showToast = useUIStore((state) => state.showToast);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  
  const lyrics = parseLyrics(recommendation?.song_lyrics);
  const duration = 30;

  useEffect(() => {
    if (recommendation) {
      loadComments();
      setCurrentTime(0);
      setIsPlaying(false);
      setShowReason(true);
      setHearted(false);
      setLiked(false);
      setHeartCount(recommendation?.heart_count || 0);
      setLikeCount(recommendation?.like_count || 0);
    }
  }, [recommendation?.id]);

  useEffect(() => {
    if (!isPlaying) return;
    
    const timer = setInterval(() => {
      setCurrentTime((prev) => {
        const newTime = prev + 1;
        if (newTime >= duration) {
          setIsPlaying(false);
          setTimeout(() => onNext?.(), 500);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, onNext, duration]);

  useEffect(() => {
    if (lyrics.length > 0) {
      const index = lyrics.findIndex((lyric, i) => {
        const nextLyric = lyrics[i + 1];
        return currentTime >= lyric.time && (!nextLyric || currentTime < nextLyric.time);
      });
      if (index !== -1) {
        setCurrentLyricIndex(index);
      }
    }
  }, [currentTime, lyrics]);

  useEffect(() => {
    if (currentTime > 10) {
      setShowReason(false);
    }
  }, [currentTime]);

  const loadComments = async () => {
    if (!recommendation) return;
    try {
      const response = await commentApi.getList(recommendation.id, { limit: 50 });
      if (response.data.success) {
        setComments(response.data.data.list);
      }
    } catch (error) {
      console.error('加载评论失败', error);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleHeart = async () => {
    if (!isAuthenticated) {
      showToast('请先登录', 'error');
      return;
    }
    try {
      setHearted(!hearted);
      setHeartCount(hearted ? heartCount - 1 : heartCount + 1);
      await recommendationApi.heart(recommendation.id);
    } catch (error) {
      showToast('操作失败', 'error');
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      showToast('请先登录', 'error');
      return;
    }
    try {
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);
      await recommendationApi.like(recommendation.id);
    } catch (error) {
      showToast('操作失败', 'error');
    }
  };

  const handleShare = () => {
    showToast('分享功能开发中', 'info');
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('请先登录', 'error');
      return;
    }
    if (!commentText.trim()) {
      showToast('请输入评论内容', 'error');
      return;
    }
    try {
      const response = await commentApi.create(recommendation.id, { content: commentText });
      if (response.data.success) {
        setComments([response.data.data, ...comments]);
        setCommentText('');
        showToast('评论成功', 'success');
      }
    } catch (error) {
      showToast('评论失败', 'error');
    }
  };

  const handleSeek = (e) => {
    const value = parseInt(e.target.value);
    setCurrentTime(value);
  };

  if (!recommendation) {
    return null;
  }

  return (
    <div className="h-full w-full relative overflow-hidden bg-black">
      {/* 背景图片 */}
      <div className="absolute inset-0 z-0">
        <img
          src={recommendation.gif_url || recommendation.song_cover}
          alt="background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      </div>

      {/* 内容区域 */}
      <div className="relative z-10 h-full flex flex-col">
        {/* 顶部用户信息 */}
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <div className="flex items-center space-x-3">
            <img
              src={recommendation.user_avatar}
              alt="avatar"
              className="w-12 h-12 rounded-full border-2 border-white object-cover"
            />
            <div>
              <p className="text-white font-semibold text-lg">{recommendation.user_nickname}</p>
              <p className="text-white/70 text-sm">音乐推荐官</p>
            </div>
          </div>
          <button className="px-5 py-2 bg-pink-500 text-white rounded-full text-sm font-semibold hover:bg-pink-600 transition">
            + 关注
          </button>
        </div>

        {/* 中间歌曲信息和歌词 */}
        <div className="flex-1 flex flex-col justify-center items-center px-4 pb-20">
          <div className="text-center mb-8">
            <h2 className="text-white text-3xl font-bold mb-2">{recommendation.song_title}</h2>
            <p className="text-white/80 text-lg">{recommendation.song_artist}</p>
          </div>

          {/* 歌词区域 */}
          <div className="w-full max-w-md h-32 overflow-hidden mb-8 text-center">
            {lyrics.length > 0 ? (
              lyrics.map((lyric, index) => (
                <p
                  key={index}
                  className={`py-2 transition-all duration-300 ${
                    index === currentLyricIndex
                      ? 'text-white text-xl font-bold scale-105'
                      : 'text-white/40 text-base'
                  }`}
                >
                  {lyric.text}
                </p>
              ))
            ) : (
              <p className="text-white/50">暂无歌词</p>
            )}
          </div>

          {/* 进度条 */}
          <div className="w-full max-w-md mb-6">
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-pink-500"
            />
            <div className="flex justify-between text-white/70 text-sm mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* 播放控制 */}
          <div className="flex items-center space-x-10">
            <button 
              onClick={onPrev} 
              className="text-white text-2xl hover:text-pink-400 transition p-2"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={togglePlay}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 transition shadow-lg"
            >
              {isPlaying ? (
                <FaPause className="text-black text-xl" />
              ) : (
                <FaPlay className="text-black text-xl ml-1" />
              )}
            </button>
            <button 
              onClick={onNext} 
              className="text-white text-2xl hover:text-pink-400 transition p-2"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        {/* 推荐理由 */}
        {showReason && (
          <div className="absolute left-4 right-20 bottom-28 bg-black/70 backdrop-blur-md rounded-2xl p-4 z-20">
            <p className="text-white text-sm leading-relaxed">
              <span className="text-pink-400 font-bold">推荐理由：</span>
              {recommendation.reason_text || '这首音乐真的太棒了！'}
            </p>
          </div>
        )}

        {/* 右侧互动按钮 */}
        <div className="absolute right-4 bottom-28 flex flex-col items-center space-y-6 z-20">
          <button 
            onClick={handleHeart} 
            className="flex flex-col items-center hover:scale-110 transition"
          >
            <FaHeart className={`text-3xl ${hearted ? 'text-red-500 fill-red-500' : 'text-white'}`} />
            <span className="text-white text-xs mt-1 font-medium">{heartCount}</span>
          </button>
          
          <button 
            onClick={handleLike} 
            className="flex flex-col items-center hover:scale-110 transition"
          >
            <FaThumbsUp className={`text-3xl ${liked ? 'text-blue-500 fill-blue-500' : 'text-white'}`} />
            <span className="text-white text-xs mt-1 font-medium">{likeCount}</span>
          </button>
          
          <button 
            onClick={() => setShowComments(true)} 
            className="flex flex-col items-center hover:scale-110 transition"
          >
            <FaComment className="text-3xl text-white" />
            <span className="text-white text-xs mt-1 font-medium">{recommendation.comment_count || comments.length}</span>
          </button>
          
          <button 
            onClick={handleShare} 
            className="flex flex-col items-center hover:scale-110 transition"
          >
            <FaShare className="text-3xl text-white" />
            <span className="text-white text-xs mt-1 font-medium">分享</span>
          </button>
        </div>
      </div>

      {/* 评论弹窗 */}
      {showComments && (
        <div 
          className="absolute inset-0 bg-black/60 flex items-end z-50"
          onClick={(e) => e.target === e.currentTarget && setShowComments(false)}
        >
          <div className="w-full bg-white rounded-t-3xl max-h-[70vh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-xl text-gray-800">评论 ({comments.length})</h3>
              <button 
                onClick={() => setShowComments(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xl transition"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {comments.length === 0 ? (
                <div className="text-center py-16">
                  <FaComment className="text-5xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">暂无评论，快来抢沙发吧~</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-4">
                    <img 
                      src={comment.user_avatar} 
                      alt="" 
                      className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-gray-800">{comment.user_nickname}</span>
                        <span className="text-gray-400 text-xs">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-gray-600 mt-2 leading-relaxed">{comment.content}</p>
                      <div className="flex items-center space-x-6 mt-3">
                        <button className="text-gray-400 text-sm hover:text-red-500 transition flex items-center space-x-1">
                          <span>❤️</span>
                          <span>{comment.like_count}</span>
                        </button>
                        <button className="text-gray-400 text-sm hover:text-gray-600 transition">
                          回复
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {isAuthenticated && (
              <form onSubmit={handleSubmitComment} className="p-5 border-t border-gray-100 bg-gray-50">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="说点什么..."
                    className="flex-1 px-5 py-3 bg-white border border-gray-200 rounded-full outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"
                  />
                  <button
                    type="submit"
                    className="px-7 py-3 bg-pink-500 text-white rounded-full font-semibold hover:bg-pink-600 transition"
                  >
                    发送
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;
