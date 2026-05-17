import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaMusic, FaMicrophone, FaStop, FaArrowLeft } from 'react-icons/fa';
import { songApi, recommendationApi } from '../api';
import { useUIStore, useUserStore } from '../store';
import { canSubmitRecommendation, getSubmitTimeDescription, debounce } from '../utils';
import BottomNav from './BottomNav';

const SubmitRecommendation = () => {
  const [step, setStep] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [reasonText, setReasonText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  const navigate = useNavigate();
  const showToast = useUIStore((state) => state.showToast);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setCanSubmit(canSubmitRecommendation());
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const debouncedSearch = debounce(async (keyword) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await songApi.getList({ keyword, limit: 10 });
      if (response.data.success) {
        setSearchResults(response.data.data.list);
      }
    } catch (error) {
      console.error('搜索失败', error);
    }
  }, 300);

  useEffect(() => {
    debouncedSearch(searchKeyword);
  }, [searchKeyword]);

  const handleSelectSong = (song) => {
    setSelectedSong(song);
    setStep(2);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      setRecordingTime(0);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSong) {
      showToast('请选择歌曲', 'error');
      return;
    }
    if (!reasonText.trim()) {
      showToast('请输入推荐理由', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await recommendationApi.create({
        song_id: selectedSong.id,
        reason_text: reasonText,
      });
      if (response.data.success) {
        showToast('提交成功，等待审核', 'success');
        setTimeout(() => navigate('/profile'), 1500);
      } else {
        showToast(response.data.message || '提交失败', 'error');
      }
    } catch (error) {
      showToast(error.response?.data?.message || '提交失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!canSubmit) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 pb-24">
        <div className="text-center">
          <FaMusic className="text-6xl text-gray-600 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-4">投稿时间未到</h2>
          <p className="text-gray-400">{getSubmitTimeDescription()}</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col pb-24">
      <div className="bg-gray-800 p-4 flex items-center">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className="text-white mr-4">
            <FaArrowLeft />
          </button>
        )}
        <h1 className="text-white text-lg font-semibold flex-1 text-center mr-8">
          推荐我的私藏音乐
        </h1>
      </div>

      {step === 1 && (
        <div className="flex-1 p-4">
          <div className="relative mb-6">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索歌曲..."
              className="w-full pl-12 pr-4 py-3 bg-gray-800 text-white rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="space-y-2">
            {searchResults.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                {searchKeyword ? '未找到相关歌曲' : '输入关键词搜索歌曲'}
              </div>
            ) : (
              searchResults.map((song) => (
                <button
                  key={song.id}
                  onClick={() => handleSelectSong(song)}
                  className="w-full flex items-center space-x-4 p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition"
                >
                  <img
                    src={song.cover}
                    alt={song.title}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">{song.title}</p>
                    <p className="text-gray-400 text-sm">{song.artist}</p>
                  </div>
                  <FaMusic className="text-gray-500" />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {step === 2 && selectedSong && (
        <div className="flex-1 p-4">
          <div className="bg-gray-800 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-4">
              <img
                src={selectedSong.cover}
                alt={selectedSong.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <p className="text-white font-medium">{selectedSong.title}</p>
                <p className="text-gray-400 text-sm">{selectedSong.artist}</p>
                <p className="text-gray-500 text-xs">{selectedSong.album}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-white font-medium mb-3 block">录制推荐理由</label>
            <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-center">
              <div className="mb-4">
                {isRecording ? (
                  <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <FaStop className="text-white text-2xl" />
                  </div>
                ) : (
                  <button
                    onClick={handleToggleRecording}
                    className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center hover:bg-pink-600 transition"
                  >
                    <FaMicrophone className="text-white text-2xl" />
                  </button>
                )}
              </div>
              <p className="text-white font-mono text-2xl">
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </p>
              <p className="text-gray-400 text-sm mt-2">点击麦克风开始录制</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-white font-medium mb-3 block">文字推荐理由</label>
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="分享你为什么推荐这首歌..."
              className="w-full p-4 bg-gray-800 text-white rounded-xl outline-none focus:ring-2 focus:ring-pink-500 h-32 resize-none"
              maxLength={500}
            />
            <p className="text-gray-500 text-sm text-right mt-2">{reasonText.length}/500</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold text-lg disabled:opacity-50"
          >
            {loading ? '提交中...' : '提交推荐'}
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default SubmitRecommendation;
