const { Op } = require('sequelize');
const { Conversation, Message, User, House } = require('../models');
const { NotFoundError, BadRequestError } = require('../middleware/errorHandler');

const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows: conversations } = await Conversation.findAndCountAll({
      where: {
        [Op.or]: [
          { participantA: userId },
          { participantB: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'participantAUser',
          attributes: ['id', 'nickname', 'avatar']
        },
        {
          model: User,
          as: 'participantBUser',
          attributes: ['id', 'nickname', 'avatar']
        },
        {
          model: House,
          as: 'house',
          attributes: ['id', 'title', 'images', 'pricePerNight']
        }
      ],
      order: [['lastMessageAt', 'DESC'], ['updatedAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    const formattedConversations = conversations.map(conv => {
      const isParticipantA = conv.participantA === userId;
      const otherUser = isParticipantA ? conv.participantBUser : conv.participantAUser;
      const unreadCount = isParticipantA ? conv.unreadCountA : conv.unreadCountB;

      return {
        id: conv.id,
        house: conv.house,
        otherUser,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount,
        createdAt: conv.createdAt
      };
    });

    res.json({
      success: true,
      data: {
        conversations: formattedConversations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return next(new NotFoundError('会话不存在'));
    }

    if (conversation.participantA !== userId && conversation.participantB !== userId) {
      return next(new BadRequestError('无权访问此会话'));
    }

    const isParticipantA = conversation.participantA === userId;

    if (isParticipantA && conversation.unreadCountA > 0) {
      await conversation.update({ unreadCountA: 0 });
    } else if (!isParticipantA && conversation.unreadCountB > 0) {
      await conversation.update({ unreadCountB: 0 });
    }

    const offset = (page - 1) * limit;

    const { count, rows: messages } = await Message.findAndCountAll({
      where: { conversationId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'nickname', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    const sortedMessages = messages.reverse();

    res.json({
      success: true,
      data: {
        messages: sortedMessages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType = 'text', metadata } = req.body;
    const senderId = req.user.id;

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return next(new NotFoundError('会话不存在'));
    }

    if (conversation.participantA !== senderId && conversation.participantB !== senderId) {
      return next(new BadRequestError('无权访问此会话'));
    }

    const isParticipantA = conversation.participantA === senderId;
    const otherParticipant = isParticipantA ? conversation.participantB : conversation.participantA;

    const message = await Message.create({
      conversationId,
      senderId,
      messageType,
      content,
      metadata,
      isRead: false
    });

    let previewContent = content;
    if (messageType === 'image') {
      previewContent = '[图片]';
    } else if (messageType === 'order') {
      previewContent = '[订单消息]';
    } else if (messageType === 'system') {
      previewContent = '[系统消息]';
    }

    const updateData = {
      lastMessage: previewContent,
      lastMessageAt: new Date()
    };

    if (isParticipantA) {
      updateData.unreadCountB = (conversation.unreadCountB || 0) + 1;
    } else {
      updateData.unreadCountA = (conversation.unreadCountA || 0) + 1;
    }

    await conversation.update(updateData);

    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'nickname', 'avatar']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: '消息发送成功',
      data: messageWithSender
    });
  } catch (error) {
    next(error);
  }
};

const createConversation = async (req, res, next) => {
  try {
    const { houseId, otherUserId } = req.body;
    const userId = req.user.id;

    if (userId === otherUserId) {
      return next(new BadRequestError('不能与自己创建会话'));
    }

    const otherUser = await User.findByPk(otherUserId);
    if (!otherUser) {
      return next(new NotFoundError('对方用户不存在'));
    }

    let house = null;
    if (houseId) {
      house = await House.findOne({
        where: { id: houseId, status: { [Op.ne]: 'deleted' } }
      });
      if (!house) {
        return next(new NotFoundError('房源不存在'));
      }
    }

    const participantA = userId < otherUserId ? userId : otherUserId;
    const participantB = userId < otherUserId ? otherUserId : userId;

    const [conversation, created] = await Conversation.findOrCreate({
      where: {
        participantA,
        participantB,
        houseId: houseId || null
      },
      defaults: {
        type: 'user_landlord',
        participantA,
        participantB,
        houseId: houseId || null,
        lastMessage: '',
        lastMessageAt: new Date(),
        unreadCountA: 0,
        unreadCountB: 0
      }
    });

    const conversationWithUsers = await Conversation.findByPk(conversation.id, {
      include: [
        {
          model: User,
          as: 'participantAUser',
          attributes: ['id', 'nickname', 'avatar']
        },
        {
          model: User,
          as: 'participantBUser',
          attributes: ['id', 'nickname', 'avatar']
        },
        {
          model: House,
          as: 'house',
          attributes: ['id', 'title', 'images', 'pricePerNight']
        }
      ]
    });

    const isParticipantA = conversationWithUsers.participantA === userId;
    const otherUserInfo = isParticipantA ? conversationWithUsers.participantBUser : conversationWithUsers.participantAUser;
    const unreadCount = isParticipantA ? conversationWithUsers.unreadCountA : conversationWithUsers.unreadCountB;

    res.status(created ? 201 : 200).json({
      success: true,
      message: created ? '会话创建成功' : '会话已存在',
      data: {
        id: conversationWithUsers.id,
        house: conversationWithUsers.house,
        otherUser: otherUserInfo,
        lastMessage: conversationWithUsers.lastMessage,
        lastMessageAt: conversationWithUsers.lastMessageAt,
        unreadCount,
        isNew: created
      }
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [
          { participantA: userId },
          { participantB: userId }
        ]
      }
    });

    let totalUnread = 0;
    conversations.forEach(conv => {
      if (conv.participantA === userId) {
        totalUnread += conv.unreadCountA || 0;
      } else {
        totalUnread += conv.unreadCountB || 0;
      }
    });

    res.json({
      success: true,
      data: {
        totalUnread
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  getUnreadCount
};
