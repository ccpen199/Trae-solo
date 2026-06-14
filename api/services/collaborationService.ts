import * as repositories from '../repositories/index.js'
import type {
  ApiResponse,
  CollaborationSpace,
  CollaborationMember,
  DiscussionMessage,
  User
} from '../types/index.js'

interface SpaceDetail extends CollaborationSpace {
  members: (CollaborationMember & { user: User | null })[]
  messages: DiscussionMessage[]
}

const collaborationService = {
  createSpace(userId: number, name: string, planId?: number): ApiResponse<{ spaceId: number }> {
    try {
      if (planId !== undefined) {
        const plan = repositories.volunteerPlanRepository.findById(planId)
        if (!plan) {
          return {
            success: false,
            error: '关联的志愿方案不存在'
          }
        }
      }

      const spaceId = repositories.collaborationRepository.createSpace({
        ownerId: userId,
        name,
        planId
      })

      return {
        success: true,
        data: { spaceId },
        message: '协作空间创建成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建协作空间失败'
      }
    }
  },

  addMember(spaceId: number, userId: number, role: 'owner' | 'editor' | 'viewer'): ApiResponse<{ memberId: number }> {
    try {
      const space = repositories.collaborationRepository.findSpaceById(spaceId)
      if (!space) {
        return {
          success: false,
          error: '协作空间不存在'
        }
      }

      const user = repositories.userRepository.findById(userId)
      if (!user) {
        return {
          success: false,
          error: '用户不存在'
        }
      }

      const existingMembers = repositories.collaborationRepository.findMembersBySpaceId(spaceId)
      const isMember = existingMembers.some(m => m.userId === userId)
      if (isMember) {
        return {
          success: false,
          error: '用户已在协作空间中'
        }
      }

      const memberId = repositories.collaborationRepository.addMember(spaceId, userId, role)

      return {
        success: true,
        data: { memberId },
        message: '成员添加成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '添加成员失败'
      }
    }
  },

  removeMember(spaceId: number, memberId: number): ApiResponse {
    try {
      const space = repositories.collaborationRepository.findSpaceById(spaceId)
      if (!space) {
        return {
          success: false,
          error: '协作空间不存在'
        }
      }

      const members = repositories.collaborationRepository.findMembersBySpaceId(spaceId)
      const member = members.find(m => m.id === memberId)
      if (!member) {
        return {
          success: false,
          error: '成员不存在'
        }
      }

      if (member.userId === space.ownerId) {
        return {
          success: false,
          error: '不能移除空间所有者'
        }
      }

      const removed = repositories.collaborationRepository.removeMember(spaceId, member.userId)
      if (!removed) {
        return {
          success: false,
          error: '移除成员失败'
        }
      }

      return {
        success: true,
        message: '成员移除成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '移除成员失败'
      }
    }
  },

  sendMessage(spaceId: number, userId: number, content: string, itemId?: number): ApiResponse<{ messageId: number }> {
    try {
      const space = repositories.collaborationRepository.findSpaceById(spaceId)
      if (!space) {
        return {
          success: false,
          error: '协作空间不存在'
        }
      }

      const members = repositories.collaborationRepository.findMembersBySpaceId(spaceId)
      const isMember = members.some(m => m.userId === userId)
      if (!isMember) {
        return {
          success: false,
          error: '不是协作空间成员，无法发送消息'
        }
      }

      const messageId = repositories.collaborationRepository.addMessage({
        spaceId,
        userId,
        content,
        itemId
      })

      return {
        success: true,
        data: { messageId },
        message: '消息发送成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '发送消息失败'
      }
    }
  },

  getSpaceDetail(spaceId: number): ApiResponse<SpaceDetail> {
    try {
      const space = repositories.collaborationRepository.findSpaceByIdWithMembers(spaceId)
      if (!space) {
        return {
          success: false,
          error: '协作空间不存在'
        }
      }

      const messages = repositories.collaborationRepository.findMessagesBySpaceId(spaceId)

      const membersWithUser = space.members.map(member => ({
        ...member,
        user: repositories.userRepository.findById(member.userId)
      }))

      const messagesWithUser = messages.map(message => ({
        ...message,
        user: repositories.userRepository.findById(message.userId)
      }))

      const spaceDetail: SpaceDetail = {
        ...space,
        members: membersWithUser,
        messages: messagesWithUser as unknown as DiscussionMessage[]
      }

      return {
        success: true,
        data: spaceDetail
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取空间详情失败'
      }
    }
  },

  getUserSpaces(userId: number): ApiResponse<CollaborationSpace[]> {
    try {
      const spaces = repositories.collaborationRepository.findSpacesByUserId(userId)

      return {
        success: true,
        data: spaces
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取用户协作空间失败'
      }
    }
  }
}

export default collaborationService
