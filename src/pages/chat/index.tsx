import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { useUserStore } from '@/store/useUserStore';
import { messageService } from '@/services/messageService';
import { ChatMessage } from '@/types/message';
import styles from './index.module.scss';

const ChatPage: React.FC = () => {
  const { userInfo } = useUserStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [sessionName, setSessionName] = useState('聊天');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const data = await messageService.getChatMessages(sessionId);
      setMessages(data.list);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('加载聊天记录失败', error);
    }
  }, []);

  useEffect(() => {
    const pages = Taro.getCurrentPages();
    const currentPage = pages[pages.length - 1] as any;
    const sessionIdParam = currentPage?.options?.sessionId || '1';
    setSessionId(sessionIdParam);

    const sessionNames: Record<string, string> = {
      '1': '李华',
      '2': '王芳',
      '3': '刘强',
      '4': '赵敏'
    };
    setSessionName(sessionNames[sessionIdParam] || '聊天');

    Taro.setNavigationBarTitle({ title: sessionNames[sessionIdParam] || '聊天' });

    loadMessages(sessionIdParam);
  }, [loadMessages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sessionId,
      senderId: userInfo?.id || 'current',
      senderName: userInfo?.name || '我',
      senderAvatar: '',
      content: inputValue.trim(),
      type: 'text',
      sendTime: new Date().toISOString(),
      createTime: new Date().toISOString(),
      isRead: false,
      isSelf: true,
      status: 'sending'
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' });
    }, 100);

    try {
      await messageService.sendMessage(sessionId, inputValue.trim(), 'text');

      setMessages(prev => prev.map(m =>
        m.id === newMessage.id ? { ...m, status: 'sent' } : m
      ));

      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const replyMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sessionId,
          senderId: sessionId,
          senderName: sessionName,
          senderAvatar: '',
          content: '收到，我尽快处理。',
          type: 'text',
          sendTime: new Date().toISOString(),
          createTime: new Date().toISOString(),
          isRead: false,
          isSelf: false,
          status: 'sent'
        };
        setMessages(prev => [...prev, replyMessage]);
        setTimeout(() => {
          scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' });
        }, 100);
      }, 2000);
    } catch (error) {
      setMessages(prev => prev.map(m =>
        m.id === newMessage.id ? { ...m, status: 'failed' } : m
      ));
      Taro.showToast({ title: '发送失败', icon: 'error' });
    }
  };



  const formatTime = (time: string) => {
    return dayjs(time).format('HH:mm');
  };

  const shouldShowTimeDivider = (index: number) => {
    if (index === 0) return true;
    const current = dayjs(messages[index].sendTime);
    const prev = dayjs(messages[index - 1].sendTime);
    return current.diff(prev, 'minute') > 5;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sending': return '⏳ 发送中';
      case 'sent': return '✓✓ 已送达';
      case 'failed': return '✕ 发送失败';
      default: return '';
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerLeft}>
          <View className={styles.headerAvatar}>
            {sessionName.charAt(0)}
          </View>
          <View className={styles.headerInfo}>
            <Text className={styles.headerName}>{sessionName}</Text>
            <Text className={styles.headerStatus}>
              <View className={styles.dot} />
              在线
            </Text>
          </View>
        </View>
        <View className={styles.headerActions}>
          <View
            className={styles.headerAction}
            onClick={() => Taro.showToast({ title: '语音通话', icon: 'none' })}
          >
            📞
          </View>
          <View
            className={styles.headerAction}
            onClick={() => Taro.showToast({ title: '视频通话', icon: 'none' })}
          >
            📹
          </View>
        </View>
      </View>

      <ScrollView
        className={styles.messageList}
        scrollY
        enhanced
        showScrollbar={false}
        ref={scrollRef as any}
      >
        {messages.map((message, index) => (
          <React.Fragment key={message.id}>
            {shouldShowTimeDivider(index) && (
              <View className={styles.timeDivider}>
                <Text className={styles.text}>{dayjs(message.sendTime).format('YYYY-MM-DD HH:mm')}</Text>
              </View>
            )}
            <View className={classnames(styles.messageItem, message.isSelf && styles.self)}>
              <View className={styles.avatar}>
                {message.isSelf ? (userInfo?.name?.charAt(0) || '我') : sessionName.charAt(0)}
              </View>
              <View className={styles.messageContent}>
                <View className={styles.messageBubble}>
                  <Text>{message.content}</Text>
                </View>
                <View className={styles.messageTime}>
                  {formatTime(message.sendTime)}
                </View>
                {message.isSelf && (
                  <View className={classnames(styles.messageStatus, styles[message.status])}>
                    {getStatusIcon(message.status)}
                  </View>
                )}
              </View>
            </View>
          </React.Fragment>
        ))}

        {isTyping && (
          <View className={styles.typingIndicator}>
            {sessionName} 正在输入...
          </View>
        )}
      </ScrollView>

      <View className={styles.encryptedBadge}>
        <Text className={styles.icon}>🔒</Text>
        <Text>消息已使用国密SM4加密传输</Text>
      </View>

      <View className={styles.inputBar}>
        <View className={styles.inputActions}>
          <View
            className={styles.actionBtn}
            onClick={() => Taro.showToast({ title: '语音', icon: 'none' })}
          >
            🎤
          </View>
        </View>
        <View className={styles.inputWrapper}>
          <Input
            className={styles.input}
            placeholder="输入消息..."
            value={inputValue}
            onInput={(e) => setInputValue(e.detail.value)}
            onConfirm={handleSend}
            adjustPosition
          />
        </View>
        <View
          className={styles.sendBtn}
          onClick={handleSend}
        >
          发送
        </View>
      </View>
    </View>
  );
};

export default ChatPage;
