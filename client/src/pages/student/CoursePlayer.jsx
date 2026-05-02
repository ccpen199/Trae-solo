import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, List, Avatar, Tag, Progress, message, Spin, Empty, Modal, Form, Input, Radio, Checkbox } from 'antd'
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  FileTextOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'

function CoursePlayer() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState(null)
  const [chapters, setChapters] = useState([])
  const [currentLesson, setCurrentLesson] = useState(null)
  const [progress, setProgress] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showAssignment, setShowAssignment] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  const fetchCourseData = async () => {
    setLoading(true)
    try {
      const [courseRes, chaptersRes, progressRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/courses/${courseId}/chapters`),
        api.get(`/progress/course/${courseId}`)
      ])

      setCourse(courseRes.data.course)
      setChapters(chaptersRes.data.chapters || [])
      setProgress(progressRes.data)

      const firstLesson = chaptersRes.data.chapters?.[0]?.lessons?.[0]
      if (firstLesson) {
        selectLesson(firstLesson, chaptersRes.data.chapters[0]._id)
      }
    } catch (error) {
      console.error('获取课程数据失败:', error)
      message.error('获取课程数据失败')
    } finally {
      setLoading(false)
    }
  }

  const selectLesson = async (lesson, chapterId) => {
    setCurrentLesson({ ...lesson, chapterId })
    setPlaying(false)
    setCurrentTime(0)

    try {
      const res = await api.get(`/progress/lesson/${courseId}/${lesson._id}`)
      if (res.data.progress) {
        setCurrentTime(res.data.progress.currentTime || 0)
      }
    } catch (error) {
      console.error('获取进度失败:', error)
    }
  }

  const updateProgress = async () => {
    if (!currentLesson || !playing) return

    try {
      await api.post('/progress/update', {
        courseId,
        chapterId: currentLesson.chapterId,
        lessonId: currentLesson._id,
        currentTime,
        duration: currentLesson.duration || duration || 0
      })
    } catch (error) {
      console.error('更新进度失败:', error)
    }
  }

  useEffect(() => {
    let interval
    if (playing) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1
          if (newTime % 5 === 0) {
            updateProgress()
          }
          return newTime
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [playing, currentLesson])

  const handlePlayPause = () => {
    setPlaying(!playing)
  }

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const lessonDuration = currentLesson?.duration || duration || 100
    setCurrentTime(percent * lessonDuration)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAssignmentSubmit = async (values) => {
    if (!selectedAssignment) return

    try {
      const answers = Object.entries(values).map(([key, value]) => ({
        questionId: key,
        answer: value
      }))

      await api.post(`/assignments/${selectedAssignment._id}/submit`, { answers })
      message.success('作业提交成功！')
      setShowAssignment(false)
      form.resetFields()
    } catch (error) {
      console.error('提交作业失败:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <Row gutter={16}>
        <Col xs={24} lg={18}>
          <Card style={{ marginBottom: 16 }}>
            <div className="video-player-container" style={{ marginBottom: 16 }}>
              <div
                style={{
                  height: 480,
                  background: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  position: 'relative'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  {playing ? (
                    <PauseCircleOutlined
                      style={{ fontSize: 80, cursor: 'pointer', opacity: 0.8 }}
                      onClick={handlePlayPause}
                    />
                  ) : (
                    <PlayCircleOutlined
                      style={{ fontSize: 80, cursor: 'pointer', opacity: 0.8 }}
                      onClick={handlePlayPause}
                    />
                  )}
                  <h3 style={{ color: '#fff', marginTop: 16 }}>{currentLesson?.title || '请选择课时'}</h3>
                </div>
              </div>

              <div style={{ padding: 16, background: '#1a1a1a' }}>
                <div
                  style={{
                    height: 8,
                    background: '#333',
                    borderRadius: 4,
                    cursor: 'pointer',
                    marginBottom: 12
                  }}
                  onClick={handleProgressClick}
                >
                  <div
                    style={{
                      height: '100%',
                      background: '#1890ff',
                      borderRadius: 4,
                      width: `${((currentTime / (currentLesson?.duration || duration || 100)) * 100) || 0}%`
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Button
                      type="text"
                      icon={playing ? <PauseCircleOutlined style={{ fontSize: 24 }} /> : <PlayCircleOutlined style={{ fontSize: 24 }} />}
                      onClick={handlePlayPause}
                      style={{ color: '#fff', padding: 0 }}
                    />
                    <span>
                      {formatTime(currentTime)} / {formatTime(currentLesson?.duration || duration || 0)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Button type="text" style={{ color: '#fff', padding: 0 }}>倍速 1.0x</Button>
                    <Button type="text" style={{ color: '#fff', padding: 0 }}>清晰度</Button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h2 style={{ marginBottom: 8 }}>{currentLesson?.title}</h2>
              <div style={{ display: 'flex', gap: 16, color: '#999' }}>
                <span><ClockCircleOutlined style={{ marginRight: 4 }} />时长: {formatTime(currentLesson?.duration || 0)}</span>
                {currentLesson?.freePreview && <Tag color="green">免费试看</Tag>}
              </div>
            </div>

            {currentLesson?.description && (
              <Card size="small" title="课时简介">
                <p style={{ margin: 0 }}>{currentLesson.description}</p>
              </Card>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card title="课程目录" style={{ marginBottom: 16 }} className="chapter-list">
            {chapters.length > 0 ? (
              chapters.map((chapter, idx) => (
                <div key={chapter._id || idx} style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 500, marginBottom: 8, color: '#666' }}>
                    第{idx + 1}章 {chapter.title}
                  </div>
                  <List
                    size="small"
                    dataSource={chapter.lessons || []}
                    renderItem={(lesson) => {
                      const isCurrent = currentLesson?._id === lesson._id
                      const lessonProgress = progress?.progressRecords?.find(
                        p => p.lessonId?.toString() === lesson._id?.toString()
                      )
                      const isCompleted = lessonProgress?.isCompleted

                      return (
                        <List.Item
                          className={`lesson-item ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                          onClick={() => selectLesson(lesson, chapter._id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            {isCompleted ? (
                              <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                            ) : (
                              <PlayCircleOutlined style={{ marginRight: 8, color: isCurrent ? '#1890ff' : '#999' }} />
                            )}
                            <span style={{ color: isCurrent ? '#1890ff' : '#333' }}>{lesson.title}</span>
                          </div>
                          <span style={{ color: '#999', fontSize: 12 }}>
                            {formatTime(lesson.duration || 0)}
                          </span>
                        </List.Item>
                      )
                    }}
                  />
                </div>
              ))
            ) : (
              <Empty description="暂无目录" />
            )}
          </Card>

          <Card title="学习进度">
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1890ff' }}>
                {progress?.courseProgress?.progress || 0}%
              </div>
              <div style={{ color: '#999', fontSize: 12 }}>总进度</div>
            </div>
            <Progress
              percent={progress?.courseProgress?.progress || 0}
              strokeColor="#1890ff"
            />
            <div style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
              <div>已完成课时: {progress?.courseProgress?.completedLessons || 0} / {progress?.courseProgress?.totalLessons || 0}</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title={selectedAssignment?.title}
        open={showAssignment}
        onCancel={() => setShowAssignment(false)}
        width={800}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAssignmentSubmit}
        >
          {selectedAssignment?.questions?.map((question, idx) => (
            <div key={question._id || idx} className="question-item">
              <div style={{ marginBottom: 12 }}>
                <span className="question-number">{idx + 1}.</span>
                <span style={{ fontWeight: 500 }}>{question.content}</span>
                <Tag style={{ marginLeft: 8 }}>
                  {question.type === 'single_choice' ? '单选题' :
                   question.type === 'multiple_choice' ? '多选题' :
                   question.type === 'true_false' ? '判断题' : '简答题'}
                </Tag>
                <Tag color="orange" style={{ marginLeft: 8 }}>{question.score}分</Tag>
              </div>

              {question.type === 'single_choice' && (
                <Form.Item
                  name={question._id?.toString() || `q${idx}`}
                  rules={[{ required: true, message: '请选择答案' }]}
                >
                  <Radio.Group>
                    {question.options?.map((option, optIdx) => (
                      <Radio value={option} key={optIdx} style={{ display: 'block', marginBottom: 8 }}>
                        {String.fromCharCode(65 + optIdx)}. {option}
                      </Radio>
                    ))}
                  </Radio.Group>
                </Form.Item>
              )}

              {question.type === 'multiple_choice' && (
                <Form.Item
                  name={question._id?.toString() || `q${idx}`}
                  rules={[{ required: true, message: '请选择答案' }]}
                >
                  <Checkbox.Group>
                    {question.options?.map((option, optIdx) => (
                      <Checkbox value={option} key={optIdx} style={{ display: 'block', marginBottom: 8 }}>
                        {String.fromCharCode(65 + optIdx)}. {option}
                      </Checkbox>
                    ))}
                  </Checkbox.Group>
                </Form.Item>
              )}

              {question.type === 'true_false' && (
                <Form.Item
                  name={question._id?.toString() || `q${idx}`}
                  rules={[{ required: true, message: '请选择答案' }]}
                >
                  <Radio.Group>
                    <Radio value="正确">正确</Radio>
                    <Radio value="错误">错误</Radio>
                  </Radio.Group>
                </Form.Item>
              )}

              {question.type === 'essay' && (
                <Form.Item
                  name={question._id?.toString() || `q${idx}`}
                  rules={[{ required: true, message: '请输入答案' }]}
                >
                  <Input.TextArea
                    rows={4}
                    placeholder="请输入你的答案..."
                  />
                </Form.Item>
              )}
            </div>
          ))}

          <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
            <Button onClick={() => setShowAssignment(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              提交作业
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CoursePlayer
