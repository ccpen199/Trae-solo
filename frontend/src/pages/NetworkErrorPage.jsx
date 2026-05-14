function NetworkErrorPage({ onRetry }) {
 return (<div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
 <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-6">
 <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
 </svg>
 </div>
 
 <h1 className="text-2xl font-bold text-dark mb-4">网络连接异常</h1>
 
 <p className="text-gray-600 text-center mb-8">
 当前网络不可用，请检查网络设置后重试
 </p>
 
 <button onClick={onRetry} className="px-8 py-3 bg-primary text-white rounded-full font-medium hover:bg-secondary transition-colors flex items-center gap-2">
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
 </svg>
 刷新重试
 </button>
 </div>);
}
export default NetworkErrorPage;
