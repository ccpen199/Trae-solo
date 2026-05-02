from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from app.models.models import (
    User,
    Attendance,
    Activity,
    CreditRecord,
    Badge,
    UserBadge,
    BadgeTier,
    Notification,
)


class BadgeIncentiveEngine:
    """
    Badge-Incentive 激励引擎
    
    职责：
    1. 诚信分管理：根据服务表现加减分
    2. 荣誉勋章自动颁发：达到条件自动授予
    3. 激励记录留痕：所有激励操作可追溯
    4. 个人中心同步：实时更新用户荣誉展示
    
    设计原因：
    - 志愿者激励是社区服务持续运营的核心
    - 诚信分体系确保服务质量，奖励优秀行为，惩罚违规行为
    - 荣誉勋章体系提供明确的成长路径和荣誉感
    - 所有激励操作永久留痕，确保激励体系的公平性和透明度
    """

    BASE_CREDIT_PER_HOUR = 5
    PERFECT_ATTENDANCE_BONUS = 10
    ANOMALY_DEDUCTION = 20
    EARLY_LEAVE_DEDUCTION = 10
    LATE_ARRIVAL_DEDUCTION = 5

    def __init__(self, db: AsyncSession):
        self.db = db

    async def calculate_and_apply_incentives(
        self,
        attendance_id: int,
    ) -> Dict[str, Any]:
        """
        活动结束后计算并应用激励
        
        步骤：
        1. 获取考勤记录详情
        2. 计算应得诚信分
        3. 检查是否有异常情况进行扣分
        4. 更新用户诚信分和总服务时长
        5. 检查并颁发符合条件的勋章
        6. 同步到个人中心和发送通知
        """
        attendance = await self._get_attendance(attendance_id)
        if not attendance:
            raise ValueError(f"考勤记录 {attendance_id} 不存在")

        if not attendance.actual_duration or attendance.actual_duration <= 0:
            raise ValueError("考勤记录没有有效服务时长")

        volunteer = await self._get_user(attendance.volunteer_id)
        if not volunteer:
            raise ValueError("志愿者不存在")

        activity = await self._get_activity(attendance.activity_id)

        credit_change = await self._calculate_credit_change(attendance)
        previous_balance = volunteer.credit_score
        new_balance = max(0, previous_balance + credit_change)

        volunteer.credit_score = new_balance
        volunteer.total_service_hours += attendance.actual_duration

        credit_record = CreditRecord(
            user_id=volunteer.id,
            activity_id=attendance.activity_id,
            attendance_id=attendance.id,
            change=credit_change,
            balance=new_balance,
            reason=await self._generate_credit_reason(attendance, credit_change, activity),
        )
        self.db.add(credit_record)

        awarded_badges = await self._check_and_award_badges(volunteer)

        notification = Notification(
            user_id=volunteer.id,
            title="志愿服务激励已发放",
            message=f"您已获得 {credit_change} 诚信分，当前积分: {new_balance}",
            notification_type="incentive",
            related_id=credit_record.id,
        )
        self.db.add(notification)

        await self.db.commit()

        return {
            "credit_change": credit_change,
            "previous_balance": previous_balance,
            "new_balance": new_balance,
            "hours_added": attendance.actual_duration,
            "awarded_badges": [b.name for b in awarded_badges],
        }

    async def _calculate_credit_change(self, attendance: Attendance) -> int:
        """
        计算诚信分变动
        
        规则：
        1. 基础分：每小时 5 分
        2. 全勤奖：准时签到且签出，额外 +10 分
        3. 异常扣款：根据异常类型扣除分数
        """
        credit = 0

        if attendance.actual_duration:
            credit += int(attendance.actual_duration * self.BASE_CREDIT_PER_HOUR)

        has_anomalies = await self._check_attendance_anomalies(attendance.id)
        if not has_anomalies and attendance.actual_duration:
            credit += self.PERFECT_ATTENDANCE_BONUS

        anomaly_deductions = await self._calculate_anomaly_deductions(attendance.id)
        credit -= anomaly_deductions

        return credit

    async def _check_attendance_anomalies(self, attendance_id: int) -> bool:
        from app.models.models import AnomalyRecord
        result = await self.db.execute(
            select(AnomalyRecord).where(
                and_(
                    AnomalyRecord.attendance_id == attendance_id,
                    AnomalyRecord.is_verified == True,
                )
            )
        )
        return result.scalar_one_or_none() is not None

    async def _calculate_anomaly_deductions(self, attendance_id: int) -> int:
        from app.models.models import AnomalyRecord, AnomalyType
        result = await self.db.execute(
            select(AnomalyRecord).where(
                and_(
                    AnomalyRecord.attendance_id == attendance_id,
                    AnomalyRecord.is_verified == True,
                )
            )
        )
        anomalies = list(result.scalars().all())

        total_deduction = 0
        for anomaly in anomalies:
            if anomaly.anomaly_type == AnomalyType.DATA_FRAUD:
                total_deduction += self.ANOMALY_DEDUCTION
            elif anomaly.anomaly_type == AnomalyType.EARLY_LEAVE:
                total_deduction += self.EARLY_LEAVE_DEDUCTION
            elif anomaly.anomaly_type == AnomalyType.LATE_ARRIVAL:
                total_deduction += self.LATE_ARRIVAL_DEDUCTION
            elif anomaly.anomaly_type == AnomalyType.LOCATION_MISMATCH:
                total_deduction += self.ANOMALY_DEDUCTION

        return total_deduction

    async def _check_and_award_badges(self, user: User) -> List[Badge]:
        """
        检查并颁发符合条件的勋章
        
        支持的勋章类型：
        1. 服务时长勋章
        2. 诚信分勋章
        3. 活动次数勋章
        """
        all_badges = await self._get_all_active_badges()
        awarded_badges = []

        existing_user_badges = await self._get_user_badges(user.id)
        existing_badge_ids = {ub.badge_id for ub in existing_user_badges}

        for badge in all_badges:
            if badge.id in existing_badge_ids:
                continue

            if await self._check_badge_eligibility(user, badge):
                user_badge = UserBadge(
                    user_id=user.id,
                    badge_id=badge.id,
                    reason=f"自动颁发：{badge.description}",
                )
                self.db.add(user_badge)
                awarded_badges.append(badge)

                notification = Notification(
                    user_id=user.id,
                    title="恭喜获得新勋章！",
                    message=f"您已获得【{badge.name}】勋章，已存入您的荣誉档案。",
                    notification_type="badge_award",
                    related_id=badge.id,
                )
                self.db.add(notification)

        return awarded_badges

    async def _check_badge_eligibility(self, user: User, badge: Badge) -> bool:
        requirement_type = badge.requirement_type
        requirement_value = badge.requirement_value

        if requirement_type == "total_hours":
            return user.total_service_hours >= requirement_value

        elif requirement_type == "credit_score":
            return user.credit_score >= requirement_value

        elif requirement_type == "activity_count":
            from app.models.models import Registration, RegistrationStatus
            result = await self.db.execute(
                select(Registration).where(
                    and_(
                        Registration.volunteer_id == user.id,
                        Registration.status == RegistrationStatus.APPROVED,
                    )
                )
            )
            count = len(list(result.scalars().all()))
            return count >= requirement_value

        return False

    async def _get_attendance(self, attendance_id: int) -> Optional[Attendance]:
        result = await self.db.execute(
            select(Attendance).where(Attendance.id == attendance_id)
        )
        return result.scalar_one_or_none()

    async def _get_user(self, user_id: int) -> Optional[User]:
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def _get_activity(self, activity_id: Optional[int]) -> Optional[Activity]:
        if not activity_id:
            return None
        result = await self.db.execute(
            select(Activity).where(Activity.id == activity_id)
        )
        return result.scalar_one_or_none()

    async def _get_all_active_badges(self) -> List[Badge]:
        result = await self.db.execute(
            select(Badge).where(Badge.is_active == True)
        )
        return list(result.scalars().all())

    async def _get_user_badges(self, user_id: int) -> List[UserBadge]:
        result = await self.db.execute(
            select(UserBadge).where(UserBadge.user_id == user_id)
        )
        return list(result.scalars().all())

    async def _generate_credit_reason(
        self,
        attendance: Attendance,
        credit_change: int,
        activity: Optional[Activity],
    ) -> str:
        activity_name = activity.title if activity else "志愿服务"
        hours = attendance.actual_duration or 0

        if credit_change > 0:
            return f"完成 {activity_name}，服务时长 {hours:.1f} 小时，获得 {credit_change} 诚信分"
        else:
            return f"完成 {activity_name}，服务时长 {hours:.1f} 小时，因异常记录扣除 {abs(credit_change)} 诚信分"
