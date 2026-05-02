const currentUser = {
    role: 'OPERATOR',
    id: 'U005',
    name: '钱七(运营)'
};

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-User-Role': currentUser.role,
        'X-User-Id': currentUser.id
    };
}

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: getHeaders(),
        ...options
    };
    
    if (options.body) {
        config.body = JSON.stringify(options.body);
    }
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API请求失败');
        }
        
        return data;
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
}

const api = {
    getConstants: () => apiRequest('/api/constants'),
    getUsers: () => apiRequest('/api/users'),
    
    getStatistics: () => apiRequest('/api/orders/statistics'),
    getOrders: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/api/orders${query ? '?' + query : ''}`);
    },
    getOrder: (orderNo) => apiRequest(`/api/orders/${orderNo}`),
    createOrder: (data) => apiRequest('/api/orders', { method: 'POST', body: data }),
    submitLocation: (orderNo, data) => apiRequest(`/api/orders/${orderNo}/submit-location`, { method: 'POST', body: data }),
    planRoute: (orderNo) => apiRequest(`/api/orders/${orderNo}/plan-route`, { method: 'POST' }),
    getRoutes: (orderNo) => apiRequest(`/api/orders/${orderNo}/routes`),
    approveRoute: (orderNo, data) => apiRequest(`/api/orders/${orderNo}/approve-route`, { method: 'POST', body: data }),
    rejectRoute: (orderNo, data) => apiRequest(`/api/orders/${orderNo}/reject-route`, { method: 'POST', body: data }),
    updateLocation: (orderNo, data) => apiRequest(`/api/orders/${orderNo}/update-location`, { method: 'POST', body: data }),
    getTrajectories: (orderNo) => apiRequest(`/api/orders/${orderNo}/trajectories`),
    completeNavigation: (orderNo, data) => apiRequest(`/api/orders/${orderNo}/complete-navigation`, { method: 'POST', body: data }),
    lockPOI: (orderNo, data) => apiRequest(`/api/orders/${orderNo}/lock-poi`, { method: 'POST', body: data }),
    unlockPOI: (orderNo, data) => apiRequest(`/api/orders/${orderNo}/unlock-poi`, { method: 'POST', body: data }),
    confirmArrival: (orderNo, data) => apiRequest(`/api/orders/${orderNo}/confirm-arrival`, { method: 'POST', body: data }),
    cancelOrder: (orderNo, data) => apiRequest(`/api/orders/${orderNo}/cancel`, { method: 'POST', body: data }),
    
    getExceptions: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/api/exceptions${query ? '?' + query : ''}`);
    },
    resolveException: (exceptionId, data) => apiRequest(`/api/exceptions/${exceptionId}/resolve`, { method: 'POST', body: data }),
    retryException: (exceptionId) => apiRequest(`/api/exceptions/${exceptionId}/retry`, { method: 'POST' }),
    
    getMessages: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/api/messages${query ? '?' + query : ''}`);
    },
    markMessageRead: (messageId) => apiRequest(`/api/messages/${messageId}/read`, { method: 'POST' }),
    
    getPOIs: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/api/pois${query ? '?' + query : ''}`);
    },
    
    getOrderSummaryReport: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/api/reports/order-summary${query ? '?' + query : ''}`);
    },
    getExceptionAnalysisReport: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/api/reports/exception-analysis${query ? '?' + query : ''}`);
    },
    getTrajectoryReviewReport: (orderNo) => apiRequest(`/api/reports/trajectory-review?order_no=${orderNo}`)
};

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function formatDuration(seconds) {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
        return `${minutes}分钟${secs}秒`;
    } else {
        return `${secs}秒`;
    }
}

function formatDistance(meters) {
    if (!meters) return '-';
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(2)} 公里`;
    }
    return `${meters} 米`;
}

function getStatusClass(status) {
    const statusMap = {
        'PENDING_LOCATION': 'status-pending',
        'PENDING_ROUTE_PLANNING': 'status-pending',
        'NAVIGATION_EXECUTING': 'status-processing',
        'PENDING_TRAJECTORY': 'status-processing',
        'ARRIVAL_CONFIRMED': 'status-success',
        'CANCELLED': 'status-danger',
        'EXCEPTION': 'status-danger'
    };
    return statusMap[status] || 'status-pending';
}
