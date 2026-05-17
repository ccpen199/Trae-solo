import { useState, useEffect } from 'react';
import { Card, Row, Col, Spin, Empty, Tag, Avatar, Button, message } from 'antd';
import { PlayCircleOutlined, UserOutlined, ClockCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
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

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isLoggedIn, user } = useUserStore();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get<Course[]>('/home/courses');
      if (res.success) {
        setCourses(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (course: Course) => {
    if (!isLoggedIn) {
      message.info('请先登录后学习课程');
      navigate('/login');
      return;
    }
    navigate(`/course/${course.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-2">精选课程</h1>
        <p className="text-white/80">樊登老师亲授，助你快速成长</p>
      </div>

      <div className="px-4 py-6">
        {courses.length === 0 ? (
          <Empty description="暂无课程" />
        ) : (
          <Row gutter={[16, 16]}>
            {courses.map((course) => (
              <Col key={course.id} xs={24} sm={12} md={8}>
                <Card 
                  hoverable
                  variant="borderless"
                  className="shadow-md h-full"
                  cover={
                    <div className="relative">
                      <img 
                        alt={course.title} 
                        src={course.cover} 
                        className="h-48 w-full object-cover"
                      />
                      <div 
                        className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlay(course);
                        }}
                      >
                        <PlayCircleOutlined className="text-5xl text-white" />
                      </div>
                      {course.is_free ? (
                        <Tag color="success" className="absolute top-2 left-2">免费</Tag>
                      ) : null}
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {course.lesson_count} 节课
                      </div>
                    </div>
                  }
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  <Card.Meta 
                    title={<div className="font-semibold truncate">{course.title}</div>}
                    description={<div className="text-gray-500 text-sm truncate">{course.intro}</div>}
                  />
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar size={24} icon={<UserOutlined />} />
                      <span className="text-sm text-gray-600">{course.teacher}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <TeamOutlined />
                      <span>{course.student_count}人学习</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    {course.is_free ? (
                      <span className="text-green-500 font-semibold">免费学习</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-orange-500 font-bold text-lg">¥{course.price}</span>
                        {course.original_price && course.original_price > course.price && (
                          <span className="text-gray-400 text-sm line-through">¥{course.original_price}</span>
                        )}
                      </div>
                    )}
                    <Button 
                      type="primary" 
                      size="small"
                      className={course.is_free ? 'bg-green-500' : 'bg-orange-500'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlay(course);
                      }}
                    >
                      开始学习
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
}
