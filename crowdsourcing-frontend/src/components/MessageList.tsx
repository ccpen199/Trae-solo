import React, { useState, useEffect, useRef } from 'react';
import { List, Input, Button, Avatar, Upload, Empty, Spin } from 'antd';
import {
  SendOutlined,
  PaperClipOutlined,
  FileOutlined,
  UserOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { Message, Attachment } from '@/types';
import dayjs from 'dayjs';
import { messageApi } from '@/api';
import { useUserStore } from '@/store/userStore';

const { TextArea } = Input;

interface MessageListProps {
  conversationId: string;
}

const MessageList: React.FC<MessageListProps> = ({ conversationId }) => {
  const { userInfo } = useUserStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const result = await messageApi.getMessages(conversationId, { page: 1, pageSize: 100 });
      setMessages(result.list || []);
    } catch (error) {
      console.error('Fetch messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    try {
      setSending(true);
      await messageApi.sendMessage(conversationId, {
        content: inputValue.trim(),
        type: attachments.length > 0 ? 'file' : 'text',
        attachments: attachments.map(a => a.id)
      });
      setInputValue('');
      setAttachments([]);
      await fetchMessages();
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUploadChange = (info: any) => {
    if (info.fileList) {
      const newAttachments: Attachment[] = info.fileList.map((file: any) => ({
        id: file.uid,
        fileName: file.name,
        fileUrl: file.url || '#',
        fileSize: file.size || 0,
        fileType: file.type || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
        uploadedBy: userInfo?.id || ''
      }));
      setAttachments(newAttachments);
    }
  };

  const renderMessageContent = (message: Message) => {
    const isMe = message.senderId === userInfo?.id;

    return (
      <div className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} gap-3 mb-4`}>
        <Avatar size={36} src={message.senderAvatar} icon={<UserOutlined />}>
          {message.senderName?.charAt(0)}
        </Avatar>
        <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
          <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-sm font-medium text-gray-800">{message.senderName}</span>
            <span className="text-xs text-gray-400">
              {dayjs(message.createdAt).format('MM-DD HH:mm')}
            </span>
          </div>
          <div
            className={`rounded-2xl px-4 py-2 ${
              isMe
                ? 'bg-primary-700 text-white rounded-tr-none'
                : 'bg-white text-gray-800 rounded-tl-none shadow-sm border border-gray-100'
            }`}
          >
            {message.type === 'text' && (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
            {message.type === 'file' && message.attachments && (
              <div>
                <p className="mb-2">{message.content}</p>
                {message.attachments.map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between gap-2 p-2 rounded-lg ${
                      isMe ? 'bg-white/20' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileOutlined className="flex-shrink-0" />
                      <span className="text-sm truncate">{file.fileName}</span>
                      <span className="text-xs opacity-70">
                        ({(file.fileSize / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="text"
                     
                      icon={<DownloadOutlined />}
                      onClick={() => window.open(file.fileUrl, '_blank')}
                      className={isMe ? 'text-white hover:!text-white/80' : ''}
                    />
                  </div>
                ))}
              </div>
            )}
            {message.type === 'image' && (
              <img
                src={message.content}
                alt="image"
                className="max-w-full rounded-lg"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[500px] bg-gray-50 rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spin />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Empty description="暂无消息，开始对话吧" />
          </div>
        ) : (
          <div>
            {messages.map((msg) => (
              <div key={msg.id}>{renderMessageContent(msg)}</div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-white">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-primary-700 rounded-full text-sm"
              >
                <FileOutlined />
                <span className="truncate max-w-[150px]">{file.fileName}</span>
                <Button
                  type="text"
                 
                  onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                  className="!p-0 !min-w-0 !w-4 !h-4"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="flex items-end gap-2">
          <Upload
            multiple
            beforeUpload={() => false}
            onChange={handleUploadChange}
            fileList={attachments.map((a, i) => ({
              uid: a.id,
              name: a.fileName,
              status: 'done' as const,
              url: a.fileUrl
            }))}
            showUploadList={false}
          >
            <Button type="text" icon={<PaperClipOutlined />} className="!p-0 !min-w-10 !h-10" />
          </Upload>
          <div className="flex-1">
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="输入消息..."
              rows={2}
              className="resize-none"
            />
          </div>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={sending}
            disabled={!inputValue.trim() && attachments.length === 0}
            className="!h-10"
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageList;
