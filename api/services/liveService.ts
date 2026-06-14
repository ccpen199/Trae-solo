import * as repositories from '../repositories/index.js'
import type {
  ApiResponse,
  LiveSession,
  LiveReservation,
  User
} from '../types/index.js'

interface SessionWithExpert extends LiveSession {
  expert: User | null
  reservationCount: number
}

interface ReservationWithSession extends LiveReservation {
  session: LiveSession | null
  expert: User | null
}

const liveService = {
  getUpcomingSessions(): ApiResponse<SessionWithExpert[]> {
    try {
      const sessions = repositories.liveRepository.findUpcomingSessions(20)

      const sessionsWithDetails = sessions.map(session => {
        const expert = repositories.userRepository.findById(session.expertId)
        const reservationCount = repositories.liveRepository.getReservationCount(session.id)

        return {
          ...session,
          expert,
          reservationCount
        }
      })

      return {
        success: true,
        data: sessionsWithDetails
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取直播列表失败'
      }
    }
  },

  createReservation(userId: number, sessionId: number): ApiResponse<{ reservationId: number }> {
    try {
      const user = repositories.userRepository.findById(userId)
      if (!user) {
        return {
          success: false,
          error: '用户不存在'
        }
      }

      const session = repositories.liveRepository.findSessionById(sessionId)
      if (!session) {
        return {
          success: false,
          error: '直播不存在'
        }
      }

      if (session.status === 'ended' || session.status === 'cancelled') {
        return {
          success: false,
          error: '该直播已结束或已取消'
        }
      }

      const existingReservation = repositories.liveRepository.findReservation(sessionId, userId)
      if (existingReservation) {
        return {
          success: false,
          error: '已预约该直播'
        }
      }

      const reservationId = repositories.liveRepository.createReservation({
        sessionId,
        userId
      })

      return {
        success: true,
        data: { reservationId },
        message: '预约成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '预约失败'
      }
    }
  },

  getUserReservations(userId: number): ApiResponse<ReservationWithSession[]> {
    try {
      const reservations = repositories.liveRepository.findReservationsByUserId(userId)

      const reservationsWithDetails = reservations.map(reservation => {
        const session = repositories.liveRepository.findSessionById(reservation.sessionId)
        const expert = session ? repositories.userRepository.findById(session.expertId) : null

        return {
          ...reservation,
          session,
          expert
        }
      })

      return {
        success: true,
        data: reservationsWithDetails
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取预约列表失败'
      }
    }
  }
}

export default liveService
