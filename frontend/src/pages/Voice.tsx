import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, MessageCircle } from 'lucide-react';
import useHomeStore from '../store/useHomeStore';
import { useToast } from '../components/Toast';

interface VoiceCommand {
  id: string;
  command: string;
  result: string;
  success: number;
  createdAt: number;
}

const recommendedCommands = [
  '打开客厅灯',
  '关闭空调',
  '打开电视',
  '所有灯打开',
  '关闭所有设备',
  '温度调到25度',
];

const VoicePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentHomeId } = useHomeStore();
  const [isListening, setIsListening] = useState(false);
  const [commandText, setCommandText] = useState('');
  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([]);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    fetchHistory();
  }, [currentHomeId]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isListening && countdown === 0) {
      handleStopListening();
    }
  }, [countdown, isListening]);

  const fetchHistory = async () => {
    if (!currentHomeId) return;
    try {
      const response = await fetch(`/api/voice/history/home/${currentHomeId}`);
      const result = await response.json();
      if (result.success) {
        setCommandHistory(result.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleStartListening = () => {
    if (!currentHomeId) {
      showToast('请先选择家庭', 'error');
      return;
    }
    setIsListening(true);
    setCountdown(6);
    setCommandText('正在聆听...');
  };

  const handleStopListening = async () => {
    setIsListening(false);
    
    const randomCommand = recommendedCommands[Math.floor(Math.random() * recommendedCommands.length)];
    setCommandText(randomCommand);
    
    try {
      const response = await fetch('/api/voice/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeId: currentHomeId,
          command: randomCommand,
        }),
      });
      const result = await response.json();
      
      if (result.success) {
        showToast(result.data.message || '执行成功', result.data.success ? 'success' : 'info');
        fetchHistory();
      } else {
        showToast(result.message || '执行失败', 'error');
      }
    } catch (err: any) {
      showToast(err.message || '执行失败', 'error');
    }
  };

  const handleRecommendedCommand = async (command: string) => {
    if (!currentHomeId) {
      showToast('请先选择家庭', 'error');
      return;
    }
    
    setCommandText(command);
    try {
      const response = await fetch('/api/voice/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeId: currentHomeId,
          command,
        }),
      });
      const result = await response.json();
      
      if (result.success) {
        showToast(result.data.message || '执行成功', result.data.success ? 'success' : 'info');
        fetchHistory();
      } else {
        showToast(result.message || '执行失败', 'error');
      }
    } catch (err: any) {
      console.error('Voice command error:', err);
      showToast('网络错误，请检查后端服务', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 flex items-center border-b border-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold ml-2">语音控制</h1>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-xl p-6 mb-6 text-center">
          <div
            className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-gradient-to-br from-primary-500 to-primary-700 animate-pulse'
                : 'bg-gray-100'
            }`}
          >
            {isListening ? (
              <Mic className="w-12 h-12 text-white" />
            ) : (
              <MicOff className="w-12 h-12 text-gray-400" />
            )}
          </div>

          {isListening && (
            <div className="mb-4">
              <p className="text-2xl font-bold text-primary-600">{countdown}</p>
              <p className="text-sm text-gray-500">秒后自动停止</p>
            </div>
          )}

          <p className="text-gray-600 mb-6 min-h-[24px]">
            {commandText || '点击下方按钮开始语音控制'}
          </p>

          <button
            onClick={isListening ? handleStopListening : handleStartListening}
            className={`px-8 py-3 rounded-full font-medium text-white transition-all ${
              isListening
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800'
            }`}
          >
            {isListening ? '停止' : '开始语音'}
          </button>
        </div>

        <div className="bg-white rounded-xl p-4 mb-6">
          <h3 className="font-medium text-gray-800 mb-3 flex items-center">
            <MessageCircle className="w-4 h-4 mr-2" />
            推荐说法
          </h3>
          <div className="flex flex-wrap gap-2">
            {recommendedCommands.map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleRecommendedCommand(cmd)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-primary-100 hover:text-primary-600 transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>

        {commandHistory.length > 0 && (
          <div className="bg-white rounded-xl p-4">
            <h3 className="font-medium text-gray-800 mb-3">历史记录</h3>
            <div className="space-y-3">
              {commandHistory.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.success ? 'bg-green-100' : 'bg-gray-100'
                    }`}
                  >
                    <MessageCircle
                      className={`w-4 h-4 ${item.success ? 'text-green-500' : 'text-gray-400'}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{item.command}</p>
                    <p className="text-sm text-gray-500 truncate">{item.result}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoicePage;
