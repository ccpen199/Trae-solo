import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Toast, Modal } from 'antd-mobile';
import {
  Camera,
  MapPin,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowLeft,
  MapPinOff,
} from 'lucide-react';
import { useAttendanceStore } from '@/store/attendanceStore';
import { calculateDistance, getCurrentPosition, formatDistance, isPointInFence } from '@/utils/geolocation';
import { geofenceApi } from '@/api/endpoints';
import type { GeoFenceConfig } from '@shared/types';

type GpsStatus = 'checking' | 'success' | 'failed' | 'outside';
type CheckInStatus = 'idle' | 'scanning' | 'success' | 'failed';

const CheckIn: React.FC = () => {
  const navigate = useNavigate();
  const { checkIn, checkInLoading, lastCheckIn, clearLastCheckIn } = useAttendanceStore();
  
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('checking');
  const [position, setPosition] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [fenceConfig, setFenceConfig] = useState<GeoFenceConfig | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [studentId, setStudentId] = useState<number>(1);
  const [cameraActive, setCameraActive] = useState(false);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    initGps();
    loadFenceConfig();
    
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  const initGps = async () => {
    setGpsStatus('checking');
    try {
      const pos = await getCurrentPosition();
      setPosition(pos);
      checkFence(pos.lat, pos.lng);
    } catch (error) {
      setGpsStatus('failed');
      Toast.show({
        icon: 'fail',
        content: error instanceof Error ? error.message : 'GPS定位失败',
      });
    }
  };

  const loadFenceConfig = async () => {
    try {
      const config = await geofenceApi.getConfig();
      setFenceConfig(config);
    } catch (error) {
      console.error('Load fence config error:', error);
    }
  };

  const checkFence = (lat: number, lng: number) => {
    if (!fenceConfig) {
      setGpsStatus('success');
      setDistance(0);
      return;
    }

    const inside = isPointInFence(
      lat,
      lng,
      fenceConfig.centerLat,
      fenceConfig.centerLng,
      fenceConfig.radius
    );

    const dist = calculateDistance(
      lat,
      lng,
      fenceConfig.centerLat,
      fenceConfig.centerLng
    );
    setDistance(dist);

    if (inside) {
      setGpsStatus('success');
    } else {
      setGpsStatus('outside');
    }
  };

  const startScanning = () => {
    if (gpsStatus === 'failed' || gpsStatus === 'outside') {
      Toast.show({
        icon: 'fail',
        content: gpsStatus === 'outside' ? '您不在考勤范围内' : 'GPS定位失败，请重试',
      });
      return;
    }

    setCheckInStatus('scanning');
    setCameraActive(true);
    setScanProgress(0);

    let progress = 0;
    scanIntervalRef.current = window.setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
        }
        handleFaceRecognition();
      }
      setScanProgress(progress);
    }, 200);
  };

  const handleFaceRecognition = async () => {
    try {
      if (!position) {
        throw new Error('位置信息不可用');
      }

      const matchScore = 85 + Math.random() * 15;
      
      const record = await checkIn({
        studentId,
        locationLat: position.lat,
        locationLng: position.lng,
        locationAccuracy: position.accuracy,
        faceMatchScore: matchScore,
      });

      setCheckInStatus('success');
      setShowResult(true);
      Toast.show({
        icon: 'success',
        content: '打卡成功',
      });
    } catch (error) {
      setCheckInStatus('failed');
      setShowResult(true);
      Toast.show({
        icon: 'fail',
        content: error instanceof Error ? error.message : '打卡失败',
      });
    } finally {
      setCameraActive(false);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setCheckInStatus('idle');
    setScanProgress(0);
    clearLastCheckIn();
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getGpsStatusConfig = () => {
    switch (gpsStatus) {
      case 'checking':
        return { color: 'text-yellow-500', bgColor: 'bg-yellow-500/20', text: '定位中...', icon: RefreshCw };
      case 'success':
        return { color: 'text-green-500', bgColor: 'bg-green-500/20', text: 'GPS正常', icon: MapPin };
      case 'failed':
        return { color: 'text-red-500', bgColor: 'text-red-500/20', text: '定位失败', icon: MapPinOff };
      case 'outside':
        return { color: 'text-orange-500', bgColor: 'bg-orange-500/20', text: '不在范围', icon: MapPinOff };
    }
  };

  const gpsConfig = getGpsStatusConfig();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-900 via-primary-800 to-primary-700">
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-white">人脸考勤打卡</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-6 mb-6">
        <div className="flex items-center justify-between bg-white/10 rounded-2xl p-4">
          <div className="flex items-center">
            <div className={`w-10 h-10 ${gpsConfig.bgColor} rounded-full flex items-center justify-center mr-3`}>
              <gpsConfig.icon className={`w-5 h-5 ${gpsConfig.color}`} />
            </div>
            <div>
              <p className="text-white font-medium">{gpsConfig.text}</p>
              {position && (
                <p className="text-white/60 text-sm">
                  精度: {position.accuracy.toFixed(0)}米
                  {fenceConfig && gpsStatus !== 'checking' && (
                    <span className="ml-2">
                      距中心: {formatDistance(distance)}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={initGps}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="px-6 mb-8">
        <div className="relative">
          <div className="w-72 h-72 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-4 border-white/20" />
            
            <div className="absolute inset-4 rounded-full border-2 border-white/30" />
            
            <div className="absolute inset-8 rounded-full bg-gray-900 overflow-hidden">
              {cameraActive ? (
                <div className="w-full h-full relative bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="relative w-32 h-40 bg-gray-700 rounded-t-full opacity-60" />
                  
                  {checkInStatus === 'scanning' && (
                    <div
                      className="absolute left-0 right-0 h-1 bg-green-400"
                      style={{
                        top: `${scanProgress}%`,
                        boxShadow: '0 0 20px rgba(74, 222, 128, 0.8)',
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center">
                  <Camera className="w-20 h-20 text-gray-600" />
                </div>
              )}
            </div>

            <svg className="absolute inset-0 w-full h-full">
              <circle
                cx="50%"
                cy="50%"
                r="48%"
                fill="none"
                stroke="#10B981"
                strokeWidth="3"
                strokeDasharray={`${scanProgress * 3.39} 339`}
                transform="rotate(-90 144 144)"
                style={{ transition: 'stroke-dasharray 0.2s ease' }}
              />
            </svg>

            <div className="absolute top-8 left-8 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-lg" />
            <div className="absolute top-8 right-8 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-lg" />
            <div className="absolute bottom-8 left-8 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-lg" />
            <div className="absolute bottom-8 right-8 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-lg" />
          </div>

          {checkInStatus === 'scanning' && (
            <div className="text-center mt-6">
              <p className="text-white text-lg font-medium">人脸识别中...</p>
              <p className="text-white/60 text-sm mt-1">
                {scanProgress < 30 ? '正在检测人脸...' :
                scanProgress < 60 ? '正在进行特征比对...' :
                scanProgress < 90 ? '正在验证身份...' :
                '验证完成'}
              </p>
              <div className="w-48 h-2 bg-white/20 rounded-full mx-auto mt-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-200"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}

          {checkInStatus === 'idle' && (
            <div className="text-center mt-6">
              <p className="text-white text-lg font-medium">请将面部对准取景框</p>
              <p className="text-white/60 text-sm mt-1">
                确保光线充足，面部清晰
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-8">
        <Button
          block
          loading={checkInLoading || checkInStatus === 'scanning'}
          disabled={checkInStatus === 'scanning' || gpsStatus === 'checking'}
          onClick={startScanning}
          className="h-14 text-lg font-medium rounded-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/30"
        >
          {checkInStatus === 'scanning' ? '识别中...' : '开始打卡'}
        </Button>
      </div>

      <div className="px-6">
        <div className="bg-white/10 rounded-2xl p-4">
          <h3 className="text-white font-semibold mb-3">打卡须知</h3>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-white/60 rounded-full mr-2 mt-1.5" />
              <span className="text-white/70 text-sm">请确保在学校考勤范围内打卡</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-white/60 rounded-full mr-2 mt-1.5" />
              <span className="text-white/70 text-sm">请保持面部清晰，光线充足</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-white/60 rounded-full mr-2 mt-1.5" />
              <span className="text-white/70 text-sm">打卡时间：07:00 - 09:00</span>
            </li>
          </ul>
        </div>
      </div>

      <Modal
        visible={showResult}
        onClose={handleCloseResult}
        content={
          <div className="text-center py-6">
            {checkInStatus === 'success' ? (
              <>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">打卡成功</h3>
                {lastCheckIn && (
                  <div className="mt-4 space-y-2">
                    <p className="text-gray-600">
                      <span className="text-gray-400">姓名：</span>
                      {lastCheckIn.studentName}
                    </p>
                    <p className="text-gray-600">
                      <span className="text-gray-400">时间：</span>
                      {new Date(lastCheckIn.checkInTime).toLocaleString()}
                    </p>
                    <p className="text-gray-600">
                      <span className="text-gray-400">状态：</span>
                      <span className="text-green-500">
                        {lastCheckIn.status === 'normal' ? '正常' :
                        lastCheckIn.status === 'late' ? '迟到' :
                        lastCheckIn.status === 'absent' ? '缺勤' : '异常'}
                      </span>
                    </p>
                    <p className="text-gray-600">
                      <span className="text-gray-400">人脸匹配度：</span>
                      {lastCheckIn.faceMatchScore?.toFixed(1)}%
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">打卡失败</h3>
                <p className="text-gray-500">请检查网络连接或重新尝试</p>
              </>
            )}
          </div>
        }
        actions={[
          {
            key: 'confirm',
            text: checkInStatus === 'success' ? '确定' : '重新打卡',
            onClick: handleCloseResult,
          },
        ]}
      />
    </div>
  );
};

export default CheckIn;
