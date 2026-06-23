import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceApi } from '../../api';

const ScanModal = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [deviceIdInput, setDeviceIdInput] = useState('');
  const hasScannedRef = useRef(false);

  const handleManualInput = async () => {
    if (!deviceIdInput.trim()) { alert('请输入设备编号'); return; }
    try {
      await deviceApi.getDetail(deviceIdInput);
      navigate(`/devices/${deviceIdInput}`);
    } catch (e) {
      alert('未找到该设备，请检查设备编号');
    }
  };

  const handleDemoScan = async () => {
    if (hasScannedRef.current) return;
    hasScannedRef.current = true;
    setScanning(true);
    try {
      const res = await deviceApi.getList({ status: 'idle', pageSize: 5 });
      if (res.items && res.items.length > 0) {
        setTimeout(() => {
          setScanning(false);
          navigate(`/devices/${res.items![0].id}`);
        }, 1500);
      } else {
        setScanning(false);
        alert('暂无空闲设备');
      }
    } catch (e) {
      setScanning(false);
      alert('扫码失败');
    }
  };

  if (scanning && !hasScannedRef.current) {
    setTimeout(() => handleDemoScan(), 50);
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="p-4 flex items-center">
        <button onClick={() => navigate(-1)} className="text-2xl">←</button>
        <h1 className="flex-1 text-center font-medium">扫码使用</h1>
        <div className="w-8" />
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        <div className="w-64 h-64 border-2 border-primary-400 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-400 animate-pulse" />
          {scanning ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl animate-bounce mb-3">📷</div>
                <p className="text-sm text-gray-300">正在扫描设备二维码...</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-6 bg-gray-900 rounded-t-3xl">
        <p className="text-sm text-gray-400 text-center mb-4">将二维码对准扫描框，或手动输入设备编号</p>
        <div className="flex gap-3">
          <input value={deviceIdInput} onChange={e => setDeviceIdInput(e.target.value)}
            placeholder="请输入设备编号" className="flex-1 px-4 py-3 bg-gray-800 rounded-xl text-white placeholder-gray-500 outline-none" />
          <button onClick={handleManualInput} className="px-6 py-3 bg-primary-500 rounded-xl font-medium">确定</button>
        </div>
      </div>
    </div>
  );
};
export default ScanModal;
