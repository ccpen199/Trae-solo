import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, QrCode, Download, Eye, Filter, CreditCard } from 'lucide-react';
import { useGet } from '../../hooks/useApi';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import type { Certificate } from '../../../shared/types';

const categories = [
  { value: 'all', label: '全部' },
  { value: 'identity', label: '身份类' },
  { value: 'education', label: '学历类' },
  { value: 'professional', label: '职业类' },
  { value: 'property', label: '财产类' },
  { value: 'other', label: '其他' },
];

export default function Certificates() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const { data: certificates, isLoading } = useGet<Certificate[]>(
    ['certificates', category],
    `/personal/certificates${category !== 'all' ? `?category=${category}` : ''}`
  );

  const filteredCerts = certificates?.filter((cert) =>
    cert.certTypeName.includes(search) || cert.issuer.includes(search)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索证照名称、发证机关..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                category === cat.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <Card.Body className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded flex-1" />
                  <div className="h-8 bg-gray-200 rounded w-8" />
                  <div className="h-8 bg-gray-200 rounded w-8" />
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      ) : filteredCerts?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCerts.map((cert, idx) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card hover>
                <Card.Body className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        cert.category === 'identity' ? 'bg-blue-100 text-blue-600' :
                        cert.category === 'education' ? 'bg-purple-100 text-purple-600' :
                        cert.category === 'professional' ? 'bg-green-100 text-green-600' :
                        cert.category === 'property' ? 'bg-orange-100 text-orange-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{cert.certTypeName}</h3>
                        <p className="text-xs text-gray-500">{cert.issuer}</p>
                      </div>
                    </div>
                    <StatusBadge
                      status={cert.status === 'valid' ? 'success' : cert.status === 'expired' ? 'warning' : 'error'}
                      text={cert.status === 'valid' ? '有效' : cert.status === 'expired' ? '过期' : '已作废'}
                    />
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">证照号码</span>
                      <span className="font-mono text-gray-900">{cert.certNo}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">发证机关日期</span>
                      <span className="text-gray-900">{new Date(cert.issueDate).toLocaleDateString('zh-CN')}</span>
                    </div>
                    {cert.expiryDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">有效期至</span>
                        <span className="text-gray-900">{new Date(cert.expiryDate).toLocaleDateString('zh-CN')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      亮证
                    </button>
                    <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                      <QrCode className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <Card.Body className="py-12 text-center">
            <Filter className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">暂无证照信息</p>
          </Card.Body>
        </Card>
      )}

      {selectedCert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCert(null)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-primary to-primary/80 p-8 text-white text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center">
                <CreditCard className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold mb-1">{selectedCert.certTypeName}</h3>
              <p className="text-white/80 text-sm">{selectedCert.issuer}</p>
            </div>
            <div className="p-6">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">持证人</span>
                  <span className="font-medium">{selectedCert.metadata.holder || '张三'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">证照号码</span>
                  <span className="font-mono">{selectedCert.certNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">发证机关</span>
                  <span>{selectedCert.issuer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">发证日期</span>
                  <span>{new Date(selectedCert.issueDate).toLocaleDateString('zh-CN')}</span>
                </div>
                {selectedCert.expiryDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">有效期至</span>
                    <span>{new Date(selectedCert.expiryDate).toLocaleDateString('zh-CN')}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                <div className="w-40 h-40 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-gray-800" />
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 mt-4">
                请向核验人出示此二维码，5分钟后自动失效
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}


