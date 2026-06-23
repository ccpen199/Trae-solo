import mqtt, { MqttClient, IClientOptions, ISubscriptionGrant } from 'mqtt';
import { config } from '@config/index';
import { logger } from '@utils/logger';

export interface MQTTMessage {
  topic: string;
  payload: Buffer;
  qos: 0 | 1 | 2;
  retain: boolean;
}

export interface MQTTMessageHandler {
  (topic: string, payload: Buffer): void | Promise<void>;
}

export type MessageCallback = (topic: string, payload: Buffer) => void;

class MQTTClientManager {
  private client: MqttClient | null = null;
  private subscriptions: Map<string, MQTTMessageHandler[]> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private isConnected: boolean = false;
  private isInitialized: boolean = false;

  constructor() {}

  private initializeClient(): void {
    if (this.isInitialized && this.client) {
      return;
    }

    const options: IClientOptions = {
      clientId: `server_${Date.now()}`,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 2000,
      username: config.mqtt.username,
      password: config.mqtt.password,
      keepalive: 60,
      reschedulePings: true,
      protocolVersion: 5,
      properties: {
        sessionExpiryInterval: 600
      }
    };

    const brokerUrl = `mqtt://${config.mqtt.host}:${config.mqtt.port}`;
    logger.info(`[MQTT] 正在连接到 EMQX Broker: ${brokerUrl}`);

    this.client = mqtt.connect(brokerUrl, options);
    this.isInitialized = true;

    this.client.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('[MQTT] 成功连接到 EMQX Broker');
      this.resubscribeAll();
    });

    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      logger.warn(`[MQTT] 正在尝试重连... 第 ${this.reconnectAttempts} 次`);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.error('[MQTT] 达到最大重连次数，停止重连');
        this.client?.end(false);
      }
    });

    this.client.on('error', (error: Error) => {
      logger.error(`[MQTT] 连接错误: ${error.message}`, error.stack);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('[MQTT] 连接已关闭');
    });

    this.client.on('offline', () => {
      this.isConnected = false;
      logger.warn('[MQTT] 客户端离线');
    });

    this.client.on('message', (topic: string, payload: Buffer, packet: mqtt.IPublishPacket) => {
      this.handleMessage(topic, payload, packet);
    });
  }

  private handleMessage(topic: string, payload: Buffer, packet: mqtt.IPublishPacket): void {
    logger.debug(`[MQTT] 收到消息 - Topic: ${topic}, QoS: ${packet.qos}`);

    const handlers = this.getMatchingHandlers(topic);

    if (handlers.length === 0) {
      logger.warn(`[MQTT] 没有找到 Topic ${topic} 的处理器`);
      return;
    }

    for (const handler of handlers) {
      try {
        const result = handler(topic, payload);
        if (result instanceof Promise) {
          result.catch((error) => {
            logger.error(`[MQTT] 消息处理器执行错误 - Topic: ${topic}`, error);
          });
        }
      } catch (error) {
        logger.error(`[MQTT] 消息处理器执行错误 - Topic: ${topic}`, error);
      }
    }
  }

  private getMatchingHandlers(topic: string): MQTTMessageHandler[] {
    const handlers: MQTTMessageHandler[] = [];

    for (const [subscriptionTopic, topicHandlers] of Array.from(this.subscriptions.entries())) {
      if (this.topicMatches(subscriptionTopic, topic)) {
        handlers.push(...topicHandlers);
      }
    }

    return handlers;
  }

  private topicMatches(subscriptionTopic: string, actualTopic: string): boolean {
    const subParts = subscriptionTopic.split('/');
    const actualParts = actualTopic.split('/');

    for (let i = 0; i < subParts.length; i++) {
      if (subParts[i] === '#') {
        return true;
      }
      if (subParts[i] === '+') {
        continue;
      }
      if (subParts[i] !== actualParts[i]) {
        return false;
      }
    }

    return subParts.length === actualParts.length;
  }

  private resubscribeAll(): void {
    for (const [topic] of Array.from(this.subscriptions.entries())) {
      this.subscribe(topic);
    }
  }

  public subscribe(topic: string, handler?: MQTTMessageHandler): Promise<ISubscriptionGrant[]> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error('MQTT 客户端未初始化'));
        return;
      }

      if (handler) {
        if (!this.subscriptions.has(topic)) {
          this.subscriptions.set(topic, []);
        }
        const handlers = this.subscriptions.get(topic)!;
        if (!handlers.includes(handler)) {
          handlers.push(handler);
        }
      }

      this.client.subscribe(topic, { qos: 1 }, (error, granted) => {
        if (error) {
          logger.error(`[MQTT] 订阅失败 - Topic: ${topic}`, error);
          reject(error);
        } else {
          logger.info(`[MQTT] 订阅成功 - Topic: ${topic}`);
          resolve(granted || []);
        }
      });
    });
  }

  public unsubscribe(topic: string, handler?: MQTTMessageHandler): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error('MQTT 客户端未初始化'));
        return;
      }

      if (handler) {
        const handlers = this.subscriptions.get(topic);
        if (handlers) {
          const index = handlers.indexOf(handler);
          if (index > -1) {
            handlers.splice(index, 1);
          }
        }

        if (handlers && handlers.length === 0) {
          this.subscriptions.delete(topic);
        }
      } else {
        this.subscriptions.delete(topic);
      }

      this.client.unsubscribe(topic, (error) => {
        if (error) {
          logger.error(`[MQTT] 取消订阅失败 - Topic: ${topic}`, error);
          reject(error);
        } else {
          logger.info(`[MQTT] 取消订阅成功 - Topic: ${topic}`);
          resolve();
        }
      });
    });
  }

  public publish(topic: string, message: string | object, qos: 0 | 1 | 2 = 1): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error('MQTT 客户端未初始化'));
        return;
      }

      const payload = typeof message === 'string' ? message : JSON.stringify(message);

      this.client.publish(topic, payload, { qos, retain: false }, (error) => {
        if (error) {
          logger.error(`[MQTT] 发布失败 - Topic: ${topic}`, error);
          reject(error);
        } else {
          logger.debug(`[MQTT] 发布成功 - Topic: ${topic}, QoS: ${qos}`);
          resolve();
        }
      });
    });
  }

  public getClient(): MqttClient | null {
    return this.client;
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await new Promise<void>((resolve) => {
        this.client?.end(false, {}, () => {
          resolve();
        });
      });
      this.isConnected = false;
      logger.info('[MQTT] 已断开连接');
    }
  }

  public async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.initializeClient();

        if (!this.client) {
          resolve(false);
          return;
        }

        const timeout = setTimeout(() => {
          logger.warn('[MQTT] 连接超时，降级运行');
          resolve(false);
        }, 5000);

        this.client.once('connect', () => {
          clearTimeout(timeout);
          resolve(true);
        });

        this.client.once('error', (error) => {
          clearTimeout(timeout);
          logger.warn('[MQTT] 连接失败，降级运行:', (error as Error).message);
          resolve(false);
        });
      } catch (error) {
        logger.warn('[MQTT] 连接异常，降级运行:', (error as Error).message);
        resolve(false);
      }
    });
  }

  public on(event: string, callback: (...args: any[]) => void): void {
    this.client?.on(event as any, callback);
  }
}

export const mqttClient = new MQTTClientManager();
export default mqttClient;
