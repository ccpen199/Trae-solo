import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Drawer, 
  List, 
  Slider, 
  Button, 
  message, 
  Spin,
  Space,
  Divider,
  Tag,
  Modal,
  Input
} from 'antd'
import {
  ArrowLeftOutlined,
  MenuOutlined,
  MoonOutlined,
  SunOutlined,
  FontSizeOutlined,
  BookOutlined,
  BgColorsOutlined,
  SoundOutlined,
  SearchOutlined,
  ShareAltOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { bookApi, readerApi } from '../api'

const { TextArea } = Input

const Reader = () => {
  const { bookId, chapterId } = useParams()
  const navigate = useNavigate()
  const [chapter, setChapter] = useState(null)
  const [chapters, setChapters] = useState([])
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [bookmarks, setBookmarks] = useState([])
  const [notes, setNotes] = useState([])
  const [searchKeyword, setSearchKeyword] = useState('')

  const [theme, setTheme] = useState('light')
  const [fontSize, setFontSize] = useState(18)
  const [lineHeight, setLineHeight] = useState(1.8)
  const [bgColor, setBgColor] = useState('#fff')
  const [fontFamily, setFontFamily] = useState('system-ui')
  const [isSpeaking, setIsSpeaking] = useState(false)

  const themes = {
    light: { bg: '#fff', text: '#333' },
    dark: { bg: '#1a1a1a', text: '#aaa' },
    sepia: { bg: '#f4ecd8', text: '#5b4636' },
    green: { bg: '#c7edcc', text: '#333' }
  }

  const bgColors = [
    { color: '#fff', name: '白色' },
    { color: '#f4ecd8', name: '米色' },
    { color: '#c7edcc', name: '绿色' },
    { color: '#e6f7ff', name: '蓝色' },
    { color: '#fff1f0', name: '粉色' }
  ]

  const fontFamilies = [
    { value: 'system-ui', name: '系统默认' },
    { value: 'serif', name: '衬线体' },
    { value: 'sans-serif', name: '无衬线体' },
    { value: 'monospace', name: '等宽字体' }
  ]

  useEffect(() => {
    fetchChapterContent()
    fetchBookDetail()
    fetchBookmarks()
    fetchNotes()
  }, [bookId, chapterId])

  const fetchBookDetail = async () => {
    try {
      const data = await bookApi.getBookDetail(bookId)
      setBook(data)
      setChapters(data?.chapters || [])
    } catch (error) {
      console.error('获取书籍信息失败:', error)
    }
  }

  const fetchChapterContent = async () => {
    try {
      setLoading(true)
      const data = await bookApi.getChapterContent(bookId, chapterId)
      setChapter(data)
    } catch (error) {
      console.error('获取章节内容失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBookmarks = async () => {
    try {
      const data = await readerApi.getBookmarks(bookId)
      setBookmarks(data?.bookmarks || [])
    } catch (error) {
      console.error('获取书签失败:', error)
    }
  }

  const fetchNotes = async () => {
    try {
      const data = await readerApi.getNotes(bookId)
      setNotes(data?.notes || [])
    } catch (error) {
      console.error('获取笔记失败:', error)
    }
  }

  const handlePrevChapter = () => {
    const currentIndex = chapters.findIndex(c => c.id == chapterId)
    if (currentIndex > 0) {
      navigate(`/reader/${bookId}/${chapters[currentIndex - 1].id}`)
    } else {
      message.info('已经是第一章了')
    }
  }

  const handleNextChapter = () => {
    const currentIndex = chapters.findIndex(c => c.id == chapterId)
    if (currentIndex < chapters.length - 1) {
      navigate(`/reader/${bookId}/${chapters[currentIndex + 1].id}`)
    } else {
      message.info('已经是最后一章了')
    }
  }

  const handleChapterSelect = (chapterItem) => {
    navigate(`/reader/${bookId}/${chapterItem.id}`)
    setShowMenu(false)
  }

  const handleAddBookmark = async () => {
    try {
      await readerApi.addBookmark({
        bookId,
        chapterId: chapter?.id,
        position: 0,
        note: chapter?.title
      })
      message.success('已添加书签')
      fetchBookmarks()
    } catch (error) {
      console.error('添加书签失败:', error)
    }
  }

  const handleDeleteBookmark = async (id) => {
    try {
      await readerApi.deleteBookmark(id)
      message.success('已删除书签')
      fetchBookmarks()
    } catch (error) {
      console.error('删除书签失败:', error)
    }
  }

  const handleAddNote = () => {
    Modal.confirm({
      title: '添加笔记',
      content: (
        <TextArea
          rows={4}
          placeholder="请输入笔记内容..."
          id="note-input"
        />
      ),
      onOk: async () => {
        const content = document.getElementById('note-input')?.value
        if (content?.trim()) {
          try {
            await readerApi.addNote({
              bookId,
              chapterId: chapter?.id,
              content,
              startPosition: 0,
              endPosition: 0,
              color: '#FFE58F'
            })
            message.success('笔记已添加')
            fetchNotes()
          } catch (error) {
            console.error('添加笔记失败:', error)
          }
        }
      }
    })
  }

  const handleDeleteNote = async (id) => {
    try {
      await readerApi.deleteNote(id)
      message.success('已删除笔记')
      fetchNotes()
    } catch (error) {
      console.error('删除笔记失败:', error)
    }
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
    setBgColor(theme === 'light' ? themes.dark.bg : themes.light.bg)
  }

  const handleTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
      } else {
        const text = chapter?.content?.replace(/<[^>]*>/g, '') || ''
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'zh-CN'
        utterance.onend = () => setIsSpeaking(false)
        window.speechSynthesis.speak(utterance)
        setIsSpeaking(true)
        message.success('开始朗读')
      }
    } else {
      message.error('您的浏览器不支持语音朗读')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      navigator.share({
        title: book?.title,
        text: `我正在阅读《${book?.title}》-${chapter?.title}`,
        url: window.location.href
      })
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        message.success('链接已复制到剪贴板')
      } catch (err) {
        message.error('复制失败')
      }
    }
  }

  const handleReportError = () => {
    Modal.confirm({
      title: '纠错反馈',
      content: (
        <TextArea
          rows={4}
          placeholder="请描述您发现的错误内容..."
          id="error-input"
        />
      ),
      onOk: () => {
        message.success('感谢您的反馈，我们会尽快处理')
      }
    })
  }

  const currentTheme = themes[theme]

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: currentTheme.bg
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: bgColor,
        color: currentTheme.text,
        transition: 'all 0.3s'
      }}
    >
      <div style={{
        position: 'sticky',
        top: 0,
        padding: '12px 16px',
        background: bgColor,
        borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#f0f0f0'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100
      }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ color: currentTheme.text }}
        />
        <div style={{ fontSize: 16, fontWeight: 500 }}>
          {chapter?.title}
        </div>
        <Button 
          type="text" 
          icon={<MenuOutlined />}
          onClick={() => setShowMenu(true)}
          style={{ color: currentTheme.text }}
        />
      </div>

      <div
        onClick={() => setShowMenu(false)}
        style={{
          padding: '24px 16px 120px',
          fontSize: fontSize,
          lineHeight: lineHeight,
          fontFamily,
          maxWidth: 800,
          margin: '0 auto'
        }}
        dangerouslySetInnerHTML={{ __html: chapter?.content || '<p>暂无内容</p>' }}
      />

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '12px 16px 24px',
        background: bgColor,
        borderTop: `1px solid ${theme === 'dark' ? '#333' : '#f0f0f0'}`,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16 }}>
          <Button 
            type="text" 
            icon={<BookOutlined />}
            onClick={handleAddBookmark}
            style={{ color: currentTheme.text }}
          >
            书签
          </Button>
          <Button 
            type="text" 
            icon={<EditOutlined />}
            onClick={handleAddNote}
            style={{ color: currentTheme.text }}
          >
            笔记
          </Button>
          <Button 
            type="text" 
            icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
            onClick={toggleTheme}
            style={{ color: currentTheme.text }}
          >
            日间/夜间
          </Button>
          <Button 
            type="text" 
            icon={<BgColorsOutlined />}
            onClick={() => setShowSettings(true)}
            style={{ color: currentTheme.text }}
          >
            设置
          </Button>
          <Button 
            type="text" 
            icon={<SoundOutlined />}
            onClick={handleTextToSpeech}
            style={{ color: isSpeaking ? '#1890ff' : currentTheme.text }}
          >
            朗读
          </Button>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Button block onClick={handlePrevChapter}>上一章</Button>
          <Button block onClick={handleNextChapter}>下一章</Button>
        </div>
      </div>

      <Drawer
        title="目录"
        placement="left"
        open={showMenu}
        onClose={() => setShowMenu(false)}
        width={280}
      >
        <List
          dataSource={chapters}
          renderItem={(item) => (
            <List.Item
              onClick={() => handleChapterSelect(item)}
              style={{ 
                cursor: 'pointer',
                background: item.id == chapterId ? '#e6f7ff' : 'transparent'
              }}
            >
              <List.Item.Meta title={item.title} />
            </List.Item>
          )}
        />

        <Divider />

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            icon={<SearchOutlined />} 
            block 
            onClick={() => { setShowMenu(false); setShowSearch(true) }}
          >
            搜索
          </Button>
          <Button 
            icon={<EditOutlined />} 
            block 
            onClick={() => { setShowMenu(false); setShowNotes(true) }}
          >
            笔记 ({notes.length})
          </Button>
          <Button 
            icon={<BookOutlined />} 
            block 
            onClick={() => { setShowMenu(false); setShowBookmarks(true) }}
          >
            书签 ({bookmarks.length})
          </Button>
          <Button icon={<ShareAltOutlined />} block onClick={handleShare}>
            分享
          </Button>
          <Button icon={<EditOutlined />} block onClick={handleReportError}>
            纠错
          </Button>
        </Space>
      </Drawer>

      <Drawer
        title="阅读设置"
        placement="right"
        open={showSettings}
        onClose={() => setShowSettings(false)}
        width={280}
      >
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12 }}>字体大小: {fontSize}px</h4>
          <Slider
            min={12}
            max={32}
            value={fontSize}
            onChange={setFontSize}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12 }}>行间距: {lineHeight}</h4>
          <Slider
            min={1.2}
            max={3}
            step={0.1}
            value={lineHeight}
            onChange={setLineHeight}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12 }}>背景颜色</h4>
          <Space wrap>
            {bgColors.map(item => (
              <Button
                key={item.color}
                onClick={() => setBgColor(item.color)}
                style={{ 
                  width: 40, 
                  height: 40,
                  padding: 0,
                  border: bgColor === item.color ? '2px solid #1890ff' : '1px solid #d9d9d9'
                }}
              >
                <div style={{ width: '100%', height: '100%', background: item.color }} />
              </Button>
            ))}
          </Space>
        </div>

        <div>
          <h4 style={{ marginBottom: 12 }}>字体</h4>
          <Space wrap>
            {fontFamilies.map(item => (
              <Tag
                key={item.value}
                color={fontFamily === item.value ? 'blue' : 'default'}
                onClick={() => setFontFamily(item.value)}
                style={{ cursor: 'pointer', padding: '4px 12px' }}
              >
                {item.name}
              </Tag>
            ))}
          </Space>
        </div>
      </Drawer>

      <Drawer
        title="书签"
        placement="right"
        open={showBookmarks}
        onClose={() => setShowBookmarks(false)}
        width={280}
      >
        <List
          dataSource={bookmarks}
          locale={{ emptyText: '暂无书签' }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button 
                  type="text" 
                  danger 
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteBookmark(item.id)}
                />
              ]}
            >
              <List.Item.Meta title={item.note || item.chapter_title} />
            </List.Item>
          )}
        />
      </Drawer>

      <Drawer
        title="笔记"
        placement="right"
        open={showNotes}
        onClose={() => setShowNotes(false)}
        width={280}
      >
        <List
          dataSource={notes}
          locale={{ emptyText: '暂无笔记' }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button 
                  type="text" 
                  danger 
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteNote(item.id)}
                />
              ]}
            >
              <List.Item.Meta 
                title={item.chapter_title}
                description={item.content}
              />
            </List.Item>
          )}
        />
      </Drawer>

      <Drawer
        title="搜索"
        placement="right"
        open={showSearch}
        onClose={() => setShowSearch(false)}
        width={280}
      >
        <Input.Search
          placeholder="搜索章节内容..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onSearch={(value) => {
            if (chapter?.content?.includes(value)) {
              message.success('找到匹配内容')
            } else {
              message.info('未找到匹配内容')
            }
          }}
          style={{ marginBottom: 16 }}
        />
      </Drawer>
    </div>
  )
}

export default Reader
