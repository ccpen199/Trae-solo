import type {
  BubbleRoom,
  BubbleRoomCreateInput,
  RedPacket,
  IndividualPacket,
  BubbleMessage
} from '../types';
import { db } from '../data/database';
import { RiskControlEngine } from '../core/riskControlEngine';

export class RedPacketService {
  private static encryptAmount(amount: number, key: string): string {
    const str = amount.toString();
    return Buffer.from(str + '|' + key).toString('base64');
  }

  private static decryptAmount(encrypted: string, key: string): number | null {
    try {
      const decoded = Buffer.from(encrypted, 'base64').toString();
      const [amount] = decoded.split('|');
      return parseFloat(amount);
    } catch {
      return null;
    }
  }

  private static generatePackets(
    totalAmount: number,
    count: number,
    type: RedPacket['distributionType'],
    key: string
  ): IndividualPacket[] {
    const packets: IndividualPacket[] = [];
    const minPerPacket = Math.max(0.01, totalAmount / count / 10);

    if (type === 'equal') {
      const perPacket = Math.floor((totalAmount / count) * 100) / 100;
      for (let i = 0; i < count; i++) {
        packets.push({
          id: db.generateId(),
          amount: i === count - 1 ? Math.round((totalAmount - perPacket * (count - 1)) * 100) / 100 : perPacket,
          revealed: false,
          encryptedAmount: this.encryptAmount(
            i === count - 1 ? Math.round((totalAmount - perPacket * (count - 1)) * 100) / 100 : perPacket,
            key
          )
        });
      }
    } else if (type === 'fate') {
      let remaining = totalAmount;
      for (let i = 0; i < count; i++) {
        const remainingSlots = count - i;
        let amount: number;
        if (i === count - 1) {
          amount = Math.max(minPerPacket, Math.round(remaining * 100) / 100);
        } else {
          const maxForSlot = Math.max(minPerPacket * 2, (remaining / remainingSlots) * 2);
          amount = Math.max(minPerPacket, Math.random() * (maxForSlot - minPerPacket) + minPerPacket);
          amount = Math.min(amount, remaining - minPerPacket * (remainingSlots - 1));
          amount = Math.floor(amount * 100) / 100;
        }
        packets.push({
          id: db.generateId(),
          amount,
          revealed: false,
          encryptedAmount: this.encryptAmount(amount, key)
        });
        remaining -= amount;
      }
    } else {
      let remaining = totalAmount;
      for (let i = 0; i < count; i++) {
        const remainingSlots = count - i;
        let amount: number;
        if (i === count - 1) {
          amount = Math.max(minPerPacket, Math.round(remaining * 100) / 100);
        } else {
          const avg = remaining / remainingSlots;
          amount = Math.max(minPerPacket, avg * (0.5 + Math.random()));
          amount = Math.min(amount, remaining - minPerPacket * (remainingSlots - 1));
          amount = Math.floor(amount * 100) / 100;
        }
        packets.push({
          id: db.generateId(),
          amount,
          revealed: false,
          encryptedAmount: this.encryptAmount(amount, key)
        });
        remaining -= amount;
      }
    }
    return packets;
  }

  private static checkClaimConditions(
    redPacket: RedPacket,
    room: BubbleRoom,
    claimerId: string
  ): boolean {
    const rules = room.redPacketRules;
    if (!rules?.conditions) return true;

    const claimer = db.users.get(claimerId);
    const sender = db.users.get(redPacket.senderId);
    if (!claimer || !sender) return false;

    const cond = rules.conditions;
    if (cond.creditScoreThreshold && claimer.creditScore < cond.creditScoreThreshold) {
      return false;
    }
    if (cond.tagMatch) {
      const senderTags = new Set(sender.interestTags);
      const matches = claimer.interestTags.filter(t => senderTags.has(t)).length;
      if (matches < cond.tagMatch) return false;
    }
    return true;
  }

  static create(
    roomId: string,
    senderId: string,
    totalAmount: number,
    packetCount: number,
    distributionType: RedPacket['distributionType']
  ): RedPacket | null {
    const room = db.bubbleRooms.get(roomId);
    if (!room) return null;
    if (!room.members.some(m => m.userId === senderId)) return null;
    if (totalAmount < packetCount * 0.01) return null;
    if (totalAmount > 2000) return null;

    const encryptionKey = db.generateId();
    const packets = this.generatePackets(totalAmount, packetCount, distributionType, encryptionKey);

    const redPacket: RedPacket = {
      id: db.generateId(),
      roomId,
      senderId,
      totalAmount,
      packetCount,
      distributionType,
      status: 'pending',
      packets,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      encryptionKey
    };

    db.redPackets.set(redPacket.id, redPacket);
    return redPacket;
  }

  static claim(
    redPacketId: string,
    claimerId: string
  ): { success: boolean; message: string; packet?: IndividualPacket; amount?: number } {
    const redPacket = db.redPackets.get(redPacketId);
    if (!redPacket) return { success: false, message: '红包不存在' };

    const room = db.bubbleRooms.get(redPacket.roomId);
    if (!room || !room.members.some(m => m.userId === claimerId)) {
      return { success: false, message: '仅房间成员可领取' };
    }

    if (new Date() > redPacket.expiresAt) {
      this.refundExpired(redPacketId);
      return { success: false, message: '红包已过期' };
    }

    if (!this.checkClaimConditions(redPacket, room, claimerId)) {
      return { success: false, message: '暂不符合领取条件' };
    }

    const alreadyClaimed = redPacket.packets.find(p => p.claimerId === claimerId);
    if (alreadyClaimed) {
      return { success: false, message: '您已领取过此红包', amount: alreadyClaimed.amount };
    }

    const available = redPacket.packets.find(p => !p.claimerId);
    if (!available) return { success: false, message: '红包已被抢完' };

    available.claimerId = claimerId;
    available.claimedAt = new Date();
    available.revealed = true;

    const decrypted = this.decryptAmount(available.encryptedAmount, redPacket.encryptionKey);

    if (redPacket.packets.every(p => p.claimerId)) {
      redPacket.status = 'distributed';
    } else if (redPacket.status === 'pending') {
      redPacket.status = 'distributing';
    }

    return {
      success: true,
      message: `恭喜抢到 ${decrypted || available.amount} 元`,
      packet: available,
      amount: decrypted || available.amount
    };
  }

  static getClaimablePacketInfo(redPacketId: string, viewerId: string): {
    canClaim: boolean;
    packetCount: number;
    claimedCount: number;
    totalAmount: number;
    myAmount?: number;
    status: RedPacket['status'];
    expiresAt: Date;
  } {
    const redPacket = db.redPackets.get(redPacketId);
    if (!redPacket) {
      return {
        canClaim: false,
        packetCount: 0,
        claimedCount: 0,
        totalAmount: 0,
        status: 'refunded',
        expiresAt: new Date()
      };
    }
    const myPacket = redPacket.packets.find(p => p.claimerId === viewerId);
    return {
      canClaim: !myPacket && redPacket.status !== 'distributed' && redPacket.status !== 'refunded' && new Date() < redPacket.expiresAt,
      packetCount: redPacket.packetCount,
      claimedCount: redPacket.packets.filter(p => p.claimerId).length,
      totalAmount: viewerId === redPacket.senderId || myPacket ? redPacket.totalAmount : 0,
      myAmount: myPacket ? myPacket.amount : undefined,
      status: redPacket.status,
      expiresAt: redPacket.expiresAt
    };
  }

  static refundExpired(redPacketId: string): boolean {
    const redPacket = db.redPackets.get(redPacketId);
    if (!redPacket) return false;
    if (redPacket.status === 'refunded') return true;
    const unclaimed = redPacket.packets.filter(p => !p.claimerId);
    if (unclaimed.length > 0) {
      redPacket.status = 'refunded';
    }
    return true;
  }
}

export class BubbleRoomService {
  static create(hostId: string, input: BubbleRoomCreateInput): BubbleRoom | null {
    const host = db.users.get(hostId);
    if (!host) return null;
    if (host.creditScore < (input.minCreditScore || 600)) return null;

    const contentCheck = RiskControlEngine.evaluateContent(
      hostId, `${input.title} ${input.description}`, 'bubble'
    );

    const now = new Date();
    const autoCloseHours = input.autoCloseHours || 4;

    const room: BubbleRoom = {
      id: db.generateId(),
      hostId,
      roomType: input.roomType,
      title: contentCheck.censoredContent.split(' ')[0] || input.title,
      description: contentCheck.censoredContent.split(' ').slice(1).join(' ') || input.description,
      theme: input.theme,
      maxMembers: input.maxMembers || 8,
      status: 'waiting',
      city: input.city,
      ageRange: input.ageRange || { min: 18, max: 35 },
      genderPreference: input.genderPreference || 'any',
      minCreditScore: input.minCreditScore || 600,
      tags: input.tags || [],
      redPacketRules: input.redPacketRules,
      members: [{
        userId: hostId,
        joinedAt: now,
        isHost: true,
        isReady: true,
        lastHeartbeat: now,
        micEnabled: true,
        cameraEnabled: false
      }],
      createdBy: hostId,
      createdAt: now,
      autoCloseAt: new Date(now.getTime() + autoCloseHours * 3600 * 1000),
      messages: [{
        id: db.generateId(),
        roomId: '',
        senderId: hostId,
        type: 'system',
        content: '房间创建成功，欢迎大家加入！',
        riskFlagged: false,
        createdAt: now
      }]
    };
    room.messages[0].roomId = room.id;
    db.bubbleRooms.set(room.id, room);
    return room;
  }

  static list(options: {
    city?: string;
    type?: BubbleRoom['roomType'];
    status?: BubbleRoom['status'];
    page?: number;
    pageSize?: number;
  } = {}): { items: BubbleRoom[]; total: number } {
    let rooms = Array.from(db.bubbleRooms.values());
    if (options.city) rooms = rooms.filter(r => r.city === options.city);
    if (options.type) rooms = rooms.filter(r => r.roomType === options.type);
    if (options.status) rooms = rooms.filter(r => r.status === options.status);
    rooms.sort((a, b) => b.members.length - a.members.length);

    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    return {
      items: rooms.slice((page - 1) * pageSize, page * pageSize),
      total: rooms.length
    };
  }

  static join(roomId: string, userId: string): { success: boolean; message: string } {
    const room = db.bubbleRooms.get(roomId);
    const user = db.users.get(userId);
    if (!room || !user) return { success: false, message: '房间或用户不存在' };
    if (room.status === 'closed') return { success: false, message: '房间已关闭' };
    if (room.members.length >= room.maxMembers) return { success: false, message: '房间已满' };
    if (room.members.some(m => m.userId === userId)) return { success: false, message: '已在房间内' };
    if (user.creditScore < room.minCreditScore) return { success: false, message: '信用分不足' };
    if (user.age < room.ageRange.min || user.age > room.ageRange.max) return { success: false, message: '年龄不符合' };

    const freq = RiskControlEngine.recordAndCheckHighFrequency(userId, 'room_join');
    if (!freq.allowed) return { success: false, message: '操作过于频繁' };

    const now = new Date();
    room.members.push({
      userId,
      joinedAt: now,
      isHost: false,
      isReady: false,
      lastHeartbeat: now,
      micEnabled: false,
      cameraEnabled: false
    });
    if (room.members.length >= 2 && room.status === 'waiting') {
      room.status = 'active';
      room.startedAt = now;
    }
    return { success: true, message: '加入成功' };
  }

  static leave(roomId: string, userId: string): boolean {
    const room = db.bubbleRooms.get(roomId);
    if (!room) return false;
    const idx = room.members.findIndex(m => m.userId === userId);
    if (idx === -1) return false;
    room.members.splice(idx, 1);
    if (room.members.length === 0) {
      room.status = 'closed';
      room.closedAt = new Date();
    } else if (userId === room.hostId) {
      const nextHost = room.members.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())[0];
      nextHost.isHost = true;
      room.hostId = nextHost.userId;
    }
    return true;
  }

  static sendMessage(
    roomId: string,
    senderId: string,
    type: BubbleMessage['type'],
    content: string,
    redPacketId?: string
  ): BubbleMessage | null {
    const room = db.bubbleRooms.get(roomId);
    if (!room || !room.members.some(m => m.userId === senderId)) return null;

    const freq = RiskControlEngine.recordAndCheckHighFrequency(senderId, 'message');
    if (!freq.allowed) return null;

    let finalContent = content;
    let riskFlagged = false;
    let riskReason: string | undefined;

    if (type === 'text') {
      const evalResult = RiskControlEngine.evaluateContent(senderId, content, 'bubble');
      finalContent = evalResult.censoredContent;
      riskFlagged = evalResult.hits.length > 0;
      if (evalResult.hits.length > 0) riskReason = `敏感词:${evalResult.hits.map(h => h.word).join(',')}`;
      if (!evalResult.allowed) return null;
    }

    const msg: BubbleMessage = {
      id: db.generateId(),
      roomId,
      senderId,
      type,
      content: finalContent,
      redPacketId,
      riskFlagged,
      riskReason,
      createdAt: new Date()
    };
    room.messages.push(msg);
    db.chatMessages.set(msg.id, msg as never);
    return msg;
  }

  static heartbeat(roomId: string, userId: string): boolean {
    const room = db.bubbleRooms.get(roomId);
    if (!room) return false;
    const member = room.members.find(m => m.userId === userId);
    if (!member) return false;
    member.lastHeartbeat = new Date();
    return true;
  }
}
