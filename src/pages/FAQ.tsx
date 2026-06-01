import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function FAQ() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      const result = await api.faq.list();
      if (result.success) {
        setFaqs(result.data || []);
      }
    } catch (e) {
      console.error('Load FAQs failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center space-x-4">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
            ← 返回
          </Link>
          <h1 className="text-xl font-bold text-gray-800">帮助中心</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-blue-50 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">常见问题解答</h2>
          <p className="text-sm text-blue-600">
            以下是个人所得税年度汇算申报的常见问题，如未能解决您的疑问，请联系税务服务热线12366。
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      Q
                    </span>
                    <span className="font-medium text-gray-800">{faq.question}</span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === faq.id ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedId === faq.id && (
                  <div className="px-6 pb-4">
                    <div className="ml-11 pl-4 border-l-2 border-blue-200">
                      <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">联系我们</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">📞</div>
              <p className="font-medium text-gray-800">服务热线</p>
              <p className="text-sm text-gray-500">12366</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">📧</div>
              <p className="font-medium text-gray-800">电子邮箱</p>
              <p className="text-sm text-gray-500">tax-service@example.gov</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">🕐</div>
              <p className="font-medium text-gray-800">服务时间</p>
              <p className="text-sm text-gray-500">工作日 9:00-17:00</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
