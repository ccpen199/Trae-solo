import { useMarketStore, usePortfolioStore } from './store';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:11085';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.isConnected = false;
    this.pendingSubscriptions = [];
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket 已经连接');
      return;
    }

    try {
      console.log('正在连接 WebSocket...', WS_URL);
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('WebSocket 连接已建立');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        this.pendingSubscriptions.forEach(sub => {
          this.subscribe(sub.type, sub.code);
        });
        this.pendingSubscriptions = [];
        
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (err) {
          console.error('解析 WebSocket 消息失败:', err);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket 连接已关闭:', event.code, event.reason);
        this.isConnected = false;
        this.stopPing();
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket 错误:', error);
        this.isConnected = false;
      };
    } catch (error) {
      console.error('创建 WebSocket 连接失败:', error);
      this.scheduleReconnect();
    }
  }

  disconnect() {
    console.log('正在断开 WebSocket 连接...');
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  startPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('达到最大重连次数，停止重连');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`将在 ${delay}ms 后尝试重连 (第 ${this.reconnectAttempts} 次)`);
    
    setTimeout(() => {
      console.log('尝试重新连接 WebSocket...');
      this.connect();
    }, delay);
  }

  subscribe(subscriptionType, securityCode = null) {
    if (!this.isConnected || !this.ws) {
      this.pendingSubscriptions.push({ type: subscriptionType, code: securityCode });
      return;
    }

    const message = {
      type: 'subscribe',
      subscriptionType,
      securityCode
    };

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      if (securityCode) {
        useMarketStore.getState().addSubscription(securityCode);
      }
    }
  }

  unsubscribe(subscriptionType, securityCode = null) {
    if (!this.isConnected || !this.ws) {
      return;
    }

    const message = {
      type: 'unsubscribe',
      subscriptionType,
      securityCode
    };

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      if (securityCode) {
        useMarketStore.getState().removeSubscription(securityCode);
      }
    }
  }

  handleMessage(message) {
    const { type, data } = message;

    switch (type) {
      case 'connection_established':
        console.log('连接已建立:', data);
        break;

      case 'pong':
        break;

      case 'market_data':
      case 'tick':
        if (data) {
          useMarketStore.getState().setMarketData(data);
          if (data.code && data.price) {
            useMarketStore.getState().updateSecurityPrice(data.code, data.price, data.volume || 0);
          }
        }
        break;

      case 'trade_executed':
        console.log('成交通知:', data);
        break;

      case 'order_status_change':
        console.log('订单状态变更:', data);
        if (data.orderId) {
          usePortfolioStore.getState().updateOrder(data.orderId, { status: data.status });
        }
        break;

      default:
        console.log('收到未知消息类型:', type, data);
    }
  }
}

export const wsService = new WebSocketService();
export default wsService;
