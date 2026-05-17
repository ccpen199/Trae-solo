import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Avatar, Tag, Spin, Empty, message, Tabs, Input, Modal } from 'antd';
import { 
  PlayCircleOutlined, 
  LockOutlined, 
  UserOutlined, 
  ClockCircleOutlined,
  ShoppingCartOutlined,
  SendOutlined,
  StarOutlined
} from '@ant-design/icons';
import { api } from '../lib/api';
import { useUserStore } from '../store/userStore';

interface Course {
  id: number;
  title: string;
  cover: string;
  category: string;
  teacher: string;
  intro: string;
  price: number;
  original_price: number;
  lesson_count: number;
  student_count: number;
  is_free: number;
}

interface Lesson {
  id: number;
  course_id: number;
  title: string;
  duration: number;
  audio_url: string;
  is_free: number;
  sort_order: number;
}

interface Comment {
  id: number;
  user_id: number;
  type: string;
  item_id: number;
  content: string;
  rating: number;
  likes: number;
  created_at: string;
  nickname: string;
  avatar: string;
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useUserStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [orderNo, setOrderNo] = useState('');

  useEffect(() => {
    fetchCourseDetail();
  }, [id]);

  const fetchCourseDetail = async () => {
    try {
      const res = await api.get<{ course: Course; lessons: Lesson[]; comments: Comment[] }>(`/home/courses/${id}`);
      if (res.success) {
        setCourse(res.data?.course || null);
        setLessons(res.data?.lessons || []);
        setComments(res.data?.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch course detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayLesson = (lesson: Lesson) => {
    if (!isLoggedIn) {
      message.info('请先登录后学习课程');
      navigate('/login');
      return;
    }

    if (!lesson.is_free && !purchased && !user?.is_vip) {
      if (course?.is_free) {
        message.info('本课程免费，点击购买即可开始学习');
      } else {
        message.info('该课程需要购买后才能观看完整内容');
      }
      setShowBuyModal(true);
      return;
    }

    message.success(`开始播放：${lesson.title}`);
  };

  const handleBuy = async () => {
    if (!isLoggedIn) {
      message.info('请先登录');
      navigate('/login');
      return;
    }

    try {
      const orderRes = await api.post<{ order_no: string }>('/order/create', {
        type: 'course',
        item_id: parseInt(id!)
      });

      if (orderRes.success && orderRes.data) {
        setOrderNo(orderRes.data.order_no);
        setShowBuyModal(true);
      }
    } catch (error) {
      console.error('Create order failed:', error);
      message.error('创建订单失败，请重试');
    }
  };

  const handlePay = async () => {
    try {
      const payRes = await api.post('/order/pay', { order_no: orderNo });
      if (payRes.success) {
        message.success('购买成功！');
        setPurchased(true);
        setShowBuyModal(false);
      } else {
        message.error('支付失败，请重试');
      }
    } catch (error) {
      console.error('Pay failed:', error);
      message.error('支付失败，请重试');
    }
  };

  const handleSubmitComment = async () => {
    if (!isLoggedIn) {
      message.info('请先登录后发表评论');
      navigate('/login');
      return;
    }

    if (!commentText.trim()) {
      message.info('请输入评论内容');
      return;
    }

    message.success('评论发表成功！');
    setCommentText('');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Empty description="课程不存在" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-b from-blue-600 to-blue-500 px-4 pt-8 pb-12">
        <Button 
          type="text" 
          icon={<span className="text-white text-lg">←</span>} 
          onClick={() => navigate(-1)}
          className="mb-4 text-white hover:text-white/80"
        />
        <div className="flex gap-4">
          <img 
            src={course.cover} 
            alt={course.title} 
            className="w-32 h-40 rounded-lg shadow-lg object-cover"
          />
          <div className="flex-1 text-white">
            <h1 className="text-xl font-bold mb-2">{course.title}</h1>
            <div className="flex items-center gap-2 mb-2 text-white/80">
              <Avatar size={20} icon={<UserOutlined />} />
              <span className="text-sm">{course.teacher}</span>
            </div>
            <p className="text-sm text-white/70 mb-3 line-clamp-2">{course.intro}</p>
            <div className="flex items-center gap-4 text-sm text-white/70">
              <span className="flex items-center gap-1">
                <PlayCircleOutlined /> {course.lesson_count} 节课
              </span>
              <span className="flex items-center gap-1">
                <UserOutlined /> {course.student_count} 人学习
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6">
        <Card className="shadow-lg border-0 rounded-xl">
          <Tabs defaultActiveKey="lessons" size="large">
            <Tabs.TabPane tab="课程目录" key="lessons">
              {lessons.length === 0 ? (
                <Empty description="暂无课程内容" />
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-3 transition-colors flex items-center justify-between"
                      onClick={() => handlePlayLesson(lesson)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          {lesson.is_free || purchased || user?.is_vip ? (
                            <PlayCircleOutlined className="text-blue-500 text-lg" />
                          ) : (
                            <LockOutlined className="text-gray-400 text-lg" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              第{index + 1}节：{lesson.title}
                            </span>
                            {lesson.is_free && (
                              <Tag color="success" size="small">免费试听</Tag>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                            <ClockCircleOutlined />
                            <span>{formatDuration(lesson.duration)}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        type="text" 
                        icon={<PlayCircleOutlined />}
                        className="text-blue-500 flex-shrink-0"
                      >
                        播放
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Tabs.TabPane>

            <Tabs.TabPane tab="课程介绍" key="intro">
              <div className="py-4">
                <h3 className="font-bold text-lg mb-4">课程简介</h3>
                <p className="text-gray-600 leading-relaxed mb-6">{course.intro}</p>
                
                <h3 className="font-bold text-lg mb-4">讲师介绍</h3>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Avatar size={64} icon={<UserOutlined />} />
                  <div>
                    <div className="font-semibold text-lg">{course.teacher}</div>
                    <div className="text-gray-500 text-sm">资深讲师 · 多年教学经验</div>
                  </div>
                </div>
              </div>
            </Tabs.TabPane>

            <Tabs.TabPane tab="学员评价" key="comments">
              <div className="py-4">
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <Input.TextArea
                    rows={3}
                    placeholder="说说你的学习心得..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="mb-3"
                  />
                  <div className="flex justify-end">
                    <Button 
                      type="primary" 
                      icon={<SendOutlined />}
                      onClick={handleSubmitComment}
                      className="bg-blue-500"
                    >
                      发表评论
                    </Button>
                  </div>
                </div>

                {comments.length === 0 ? (
                  <Empty description="暂无评论，快来发表第一条评论吧" />
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border-b border-gray-100 pb-4 flex gap-3">
                        <Avatar src={comment.avatar} icon={<UserOutlined />} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{comment.nickname}</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <StarOutlined 
                                  key={i} 
                                  className={i < comment.rating ? 'text-yellow-400' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-600 mt-1">{comment.content}</p>
                          <div className="text-xs text-gray-400 mt-2">{comment.created_at}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Tabs.TabPane>
          </Tabs>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            {course.is_free ? (
              <span className="text-green-500 font-bold text-xl">免费学习</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-orange-500 font-bold text-xl">¥{course.price}</span>
                {course.original_price && course.original_price > course.price && (
                  <span className="text-gray-400 text-sm line-through">¥{course.original_price}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button 
              type="primary" 
              size="large"
              icon={<PlayCircleOutlined />}
              className="bg-blue-500"
              onClick={() => handlePlayLesson(lessons[0])}
            >
              开始学习
            </Button>
            {!course.is_free && !purchased && !user?.is_vip && (
              <Button 
                type="primary" 
                size="large"
                icon={<ShoppingCartOutlined />}
                className="bg-orange-500"
                onClick={handleBuy}
              >
                立即购买
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal
        title="购买课程"
        open={showBuyModal}
        onCancel={() => setShowBuyModal(false)}
        footer={null}
      >
        <div className="py-6 text-center">
          <img 
            src={course.cover} 
            alt={course.title} 
            className="w-24 h-32 object-cover rounded-lg mx-auto mb-4"
          />
          <h3 className="text-xl font-bold mb-2">{course.title}</h3>
          <p className="text-gray-500 mb-6">{course.intro}</p>
          
          <div className="text-3xl font-bold text-orange-500 mb-6">
            ¥{course.price}
          </div>

          <div className="bg-orange-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold mb-2 text-orange-700">购买后可享受：</h4>
            <ul className="text-sm text-orange-600 text-left space-y-1">
              <li>✓ 无限次观看所有课程内容</li>
              <li>✓ 课程更新永久免费</li>
              <li>✓ 专属学习社群</li>
              <li>✓ VIP会员免费观看</li>
            </ul>
          </div>

          <Button 
            type="primary" 
            size="large" 
            block
            className="bg-orange-500 h-12 text-lg"
            onClick={handlePay}
          >
            确认支付 ¥{course.price}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
