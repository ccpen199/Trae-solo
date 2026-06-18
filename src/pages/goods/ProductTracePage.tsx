import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Factory, Truck, Store, Shield, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { getProductTrace, getProduct } from '../../services/api';
import type { ProductTraceNode, Product } from '../../../shared/types';

const stepConfig: Record<string, { label: string; icon: any; color: string }> = {
  production: { label: '生产环节', icon: Factory, color: 'text-purple-600' },
  inspection: { label: '质检环节', icon: Shield, color: 'text-blue-600' },
  storage: { label: '仓储环节', icon: Package, color: 'text-amber-600' },
  distribution: { label: '物流配送', icon: Truck, color: 'text-green-600' },
  store: { label: '门店收货', icon: Store, color: 'text-primary-600' },
};

export default function ProductTracePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [traceData, setTraceData] = useState<ProductTraceNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      fetchData(parseInt(id));
    }
  }, [id]);

  const fetchData = async (productId: number) => {
    try {
      setLoading(true);
      const [productRes, traceRes] = await Promise.all([
        getProduct(productId),
        getProductTrace(productId),
      ]);
      if (productRes.code === 0) setProduct(productRes.data);
      if (traceRes.code === 0) setTraceData(traceRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">产品不存在</p>
        <button onClick={() => navigate('/goods/products')} className="btn btn-primary mt-4">
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/goods/products')}
        className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        返回产品列表
      </button>

      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
              <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium flex items-center gap-1">
                <Shield className="w-4 h-4" />
                可溯源产品
              </span>
            </div>
            <p className="text-gray-500 mb-4">{product.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">产品规格</p>
                <p className="font-semibold text-gray-900">{product.spec}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">生产批次</p>
                <p className="font-semibold text-gray-900">{product.batchNumber || 'B2024061001'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">生产日期</p>
                <p className="font-semibold text-gray-900">2024-06-10</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">保质期至</p>
                <p className="font-semibold text-gray-900">2026-06-09</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary-600" />
          全链路溯源
        </h3>

        <div className="relative">
          {traceData.length > 0 ? (
            <div className="space-y-4">
              {traceData.map((node, idx) => {
                const config = stepConfig[node.step] || stepConfig.storage;
                const Icon = config.icon;
                const isCompleted = node.status === 'completed';
                const isActive = activeStep === idx;
                
                return (
                  <div key={idx} className="relative">
                    {idx < traceData.length - 1 && (
                      <div className={`absolute left-7 top-12 w-0.5 h-full ${isCompleted ? 'bg-primary-500' : 'bg-gray-200'}`}></div>
                    )}
                    <div
                      className={`relative flex gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                        isActive ? 'bg-primary-50 ring-2 ring-primary-500' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => setActiveStep(isActive ? null : idx)}
                    >
                      <div className={`w-14 h-14 rounded-xl ${isCompleted ? 'bg-primary-100' : 'bg-gray-200'} flex items-center justify-center flex-shrink-0`}>
                        {isCompleted ? (
                          <Icon className={`w-7 h-7 ${config.color}`} />
                        ) : (
                          <Clock className="w-7 h-7 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{config.label}</h4>
                            {isCompleted ? (
                              <span className="flex items-center gap-1 text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                已完成
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" />
                                进行中
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">{node.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{node.description}</p>
                        {isActive && node.details && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>详细信息：</strong>{node.details}
                            </p>
                            {node.location && (
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {node.location}
                              </p>
                            )}
                            {node.operator && (
                              <p className="text-sm text-gray-600 mt-1">
                                <strong>操作人：</strong>{node.operator}
                              </p>
                            )}
                            {node.hash && (
                              <p className="text-xs text-gray-400 mt-2 font-mono bg-gray-50 p-2 rounded">
                                区块链哈希: {node.hash}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无溯源数据</p>
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">区块链存证信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl">
            <p className="text-sm text-primary-600 mb-1">区块高度</p>
            <p className="text-2xl font-bold text-primary-900">#1,258,342</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-brand-50 to-brand-100/50 rounded-xl">
            <p className="text-sm text-brand-600 mb-1">上链时间</p>
            <p className="text-lg font-bold text-brand-900">2024-06-10 15:30:22</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl">
            <p className="text-sm text-amber-600 mb-1">交易哈希</p>
            <p className="text-xs font-mono text-amber-900 truncate">0x7f8a...e3d2c1</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-600 flex items-start gap-2">
            <Shield className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>溯源说明：</strong>本产品全流程数据已通过区块链技术存证，不可篡改。每个环节的操作记录均可独立验证，确保产品从生产到消费的全程透明可追溯。消费者可通过扫描产品包装上的溯源码查询完整信息。
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
