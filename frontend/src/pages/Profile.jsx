import { useState, useEffect } from 'react'
import { Card, Avatar, List, Button, Switch, Spin, message, Tag } from 'antd'
import { FaUser, FaCoins, FaCalendar, FaBell, FaMoon, FaHeadphones } from 'react-icons/fa'
import { userAPI, authAPI } from '@/api'
import { useUserStore } from '@/store'

function Profile() {
  const { user, setUser, logout } = useUserStore()
  const [dailyTasks, setDailyTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    timer: false,
    autoPlay: true,
    notification: true
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      const [tasks, profile] = await Promise.all([
        userAPI.getDailyTasks(),
        authAPI.getProfile(),
      ])
      setDailyTasks(tasks || [])
      setUser(profile)
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const completeTask = async (type) => {
    try {
      await userAPI.completeTask(type)
      message.success('任务完成！')
      loadData()
    } catch (error) {
      // 任务可能已经完成，忽略
    }
  }

  if (!user) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card style={{ borderRadius: 12, marginBottom: 16, textAlign: 'center' }}>
        <Avatar src={user.avatar} size={80} style={{ marginBottom: 16 }} />
        <h2 style={{ marginBottom: 8 }}>{user.nickname}</h2>
        <div style={{ color: '#666', marginBottom: 16 }}>@{user.username}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#ff6b9d' }}>{user.fish_count || 0}</div>
            <div style={{ color: '#999', fontSize: 12 }}>小鱼干</div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#ff6b9d' }}>{user.follow_count || 0}</div>
            <div style={{ color: '#999', fontSize: 12 }}>关注</div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#ff6b9d' }}>{user.fans_count || 0}</div>
            <div style={{ color: '#999', fontSize: 12 }}>粉丝</div>
          </div>
        </div>
      </Card>

      <Card title={<span><FaCalendar style={{ marginRight: 8 }} />每日任务</span>} style={{ borderRadius: 12, marginBottom: 16 }}>
        <List
          dataSource={dailyTasks}
          renderItem={task => (
            <List.Item
              actions={[
                task.is_completed ? (
                  <Tag color="green">已完成</Tag>
                ) : (
                  <Button size="small" type="primary" onClick={() => completeTask(task.type)}>
                    完成
                  </Button>
                )
              ]}
            >
              <List.Item.Meta
                title={task.name}
                description={`奖励 ${task.reward} 小鱼干`}
              />
            </List.Item>
          )}
        />
      </Card>

      <Card title={<span><FaBell style={{ marginRight: 8 }} />设置</span>} style={{ borderRadius: 12, marginBottom: 16 }}>
        <List>
          <List.Item>
            <List.Item.Meta title="定时关闭" avatar={<FaMoon style={{ color: '#ff6b9d' }} />} />
            <Switch
              checked={settings.timer}
              onChange={v => setSettings({ ...settings, timer: v })}
            />
          </List.Item>
          <List.Item>
            <List.Item.Meta title="自动播放" avatar={<FaHeadphones style={{ color: '#ff6b9d' }} />} />
            <Switch
              checked={settings.autoPlay}
              onChange={v => setSettings({ ...settings, autoPlay: v })}
            />
          </List.Item>
          <List.Item>
            <List.Item.Meta title="消息通知" avatar={<FaBell style={{ color: '#ff6b9d' }} />} />
            <Switch
              checked={settings.notification}
              onChange={v => setSettings({ ...settings, notification: v })}
            />
          </List.Item>
        </List>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Button danger block onClick={logout}>
          退出登录
        </Button>
      </Card>
    </div>
  )
}

export default Profile
