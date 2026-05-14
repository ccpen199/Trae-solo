function PermissionCheckPage({ hasLocationPermission, onContinue }) {
 return (<div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
 <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
 <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 {hasLocationPermission ? (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>) : (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>)}
 </svg>
 </div>
 
 <h1 className="text-2xl font-bold text-dark mb-4">
 {hasLocationPermission ? '位置权限已获取' : '位置权限未授权'}
 </h1>
 
 <p className="text-gray-600 text-center mb-8">
 {hasLocationPermission
 ? '正在为您定位当前位置...'
 : '位置权限被拒绝，部分功能可能受限。您可以在设置中开启权限。'}
 </p>

 {!hasLocationPermission && (<button onClick={onContinue} className="px-8 py-3 bg-primary text-white rounded-full font-medium hover:bg-secondary transition-colors">
 继续使用
 </button>)}
 </div>);
}
export default PermissionCheckPage;
