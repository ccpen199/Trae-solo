from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.models.models import (
    User,
    UserRole,
    Activity,
    ActivityStatus,
    Skill,
    Notification,
)


class MatchMakerEngine:
    """
    Match-Maker 匹配引擎
    
    职责：
    1. 活动技能标签与志愿者技能的智能匹配
    2. 根据活动需求推送通知给合适的志愿者
    3. 考虑志愿者历史表现、信用分等因素
    4. 支持活动发布后的实时推送
    
    设计原因：
    - 社区志愿者资源有限，需要高效匹配活动需求和志愿者能力
    - 技能匹配确保活动质量，避免技能不匹配导致的服务问题
    - 智能推送提高活动报名率和志愿者参与度
    - 考虑信用分和历史表现，优先推荐优质志愿者
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_matching_volunteers(
        self,
        activity_id: int,
        max_results: int = 50,
    ) -> List[Tuple[User, float]]:
        """
        为活动查找匹配的志愿者
        
        匹配算法：
        1. 技能匹配度（权重60%）
        2. 信用分（权重20%）
        3. 历史服务时长（权重10%）
        4. 地理位置（权重10%，如果有）
        
        返回按匹配度排序的志愿者列表
        """
        activity = await self._get_activity(activity_id)
        if not activity:
            raise ValueError(f"活动 {activity_id} 不存在")

        required_skill_ids = {s.id for s in activity.required_skills}

        active_volunteers = await self._get_active_volunteers()

        matched_volunteers = []
        for volunteer in active_volunteers:
            score = await self._calculate_match_score(
                volunteer,
                required_skill_ids,
                activity,
            )
            if score > 0:
                matched_volunteers.append((volunteer, score))

        matched_volunteers.sort(key=lambda x: x[1], reverse=True)

        return matched_volunteers[:max_results]

    async def push_activity_notifications(
        self,
        activity_id: int,
        matched_volunteers: List[Tuple[User, float]],
    ) -> int:
        """
        向匹配的志愿者推送活动通知
        
        业务规则：
        1. 只推送给匹配度超过阈值的志愿者
        2. 通知中包含活动基本信息和匹配原因
        3. 记录推送历史，避免重复推送
        """
        activity = await self._get_activity(activity_id)
        if not activity:
            raise ValueError(f"活动 {activity_id} 不存在")

        MATCH_THRESHOLD = 0.3
        pushed_count = 0

        for volunteer, score in matched_volunteers:
            if score >= MATCH_THRESHOLD:
                already_notified = await self._check_already_notified(
                    volunteer.id,
                    activity_id,
                )
                if not already_notified:
                    notification = Notification(
                        user_id=volunteer.id,
                        title=f"新活动推荐：{activity.title}",
                        message=self._generate_notification_message(
                            activity,
                            score,
                            volunteer,
                        ),
                        notification_type="activity_match",
                        related_id=activity_id,
                    )
                    self.db.add(notification)
                    pushed_count += 1

        await self.db.commit()

        return pushed_count

    async def _calculate_match_score(
        self,
        volunteer: User,
        required_skill_ids: set,
        activity: Activity,
    ) -> float:
        """
        计算志愿者与活动的匹配度分数（0-1）
        """
        if not required_skill_ids:
            return 0.5

        volunteer_skill_ids = {s.id for s in volunteer.skills}

        skill_match_count = len(volunteer_skill_ids & required_skill_ids)
        skill_match_ratio = skill_match_count / len(required_skill_ids)
        skill_score = skill_match_ratio * 0.6

        credit_ratio = min(volunteer.credit_score / 150, 1.0)
        credit_score = credit_ratio * 0.2

        hours_ratio = min(volunteer.total_service_hours / 100, 1.0)
        hours_score = hours_ratio * 0.1

        location_score = 0.1 if self._check_location_match(activity, volunteer) else 0

        total_score = skill_score + credit_score + hours_score + location_score

        return total_score

    def _check_location_match(
        self,
        activity: Activity,
        volunteer: User,
    ) -> bool:
        return True

    def _generate_notification_message(
        self,
        activity: Activity,
        match_score: float,
        volunteer: User,
    ) -> str:
        score_percent = int(match_score * 100)
        skill_list = ", ".join([s.name for s in activity.required_skills]) if activity.required_skills else "无特殊技能要求"

        return (
            f"您与该活动的匹配度为 {score_percent}%。\n"
            f"活动时间：{activity.start_time.strftime('%Y-%m-%d %H:%M')}\n"
            f"活动地点：{activity.location}\n"
            f"所需技能：{skill_list}\n"
            f"点击查看详情并报名。"
        )

    async def _get_activity(self, activity_id: int) -> Optional[Activity]:
        result = await self.db.execute(
            select(Activity)
            .options(selectinload(Activity.required_skills))
            .where(Activity.id == activity_id)
        )
        return result.scalar_one_or_none()

    async def _get_active_volunteers(self) -> List[User]:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.skills))
            .where(
                and_(
                    User.role == UserRole.VOLUNTEER,
                    User.is_active == True,
                )
            )
        )
        return list(result.scalars().all())

    async def _check_already_notified(
        self,
        user_id: int,
        activity_id: int,
    ) -> bool:
        result = await self.db.execute(
            select(Notification).where(
                and_(
                    Notification.user_id == user_id,
                    Notification.related_id == activity_id,
                    Notification.notification_type == "activity_match",
                )
            )
        )
        return result.scalar_one_or_none() is not None
