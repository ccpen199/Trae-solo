from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.models import User, Activity, Registration, Shift, ShiftStatus, RegistrationStatus


class ShiftSchedulerEngine:
    """
    Shift-Scheduler 排班引擎
    
    职责：
    1. 根据活动需求和志愿者报名情况自动生成排班
    2. 考虑志愿者技能匹配、时间冲突、负荷均衡等因素
    3. 支持排班确认、调整和冲突检测
    
    设计原因：
    - 社区志愿者活动需要高效的排班管理，避免人工排班的低效和错误
    - 排班需要考虑多维度约束：技能匹配、时间可用性、负荷均衡
    - 排班结果需要可追溯、可调整，支持志愿者确认
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def auto_schedule(
        self,
        activity_id: int,
        max_shifts_per_volunteer: int = 2,
    ) -> List[Shift]:
        """
        自动排班核心算法
        
        步骤：
        1. 获取活动详情和已审核通过的报名
        2. 分析活动时间窗口，确定排班时间段
        3. 按技能匹配度排序志愿者
        4. 分配排班，避免冲突，均衡负荷
        5. 创建排班记录并返回
        """
        activity = await self._get_activity(activity_id)
        if not activity:
            raise ValueError(f"活动 {activity_id} 不存在")

        approved_registrations = await self._get_approved_registrations(activity_id)
        if not approved_registrations:
            return []

        time_slots = self._generate_time_slots(activity)
        volunteers = [reg.volunteer for reg in approved_registrations]
        matched_volunteers = self._rank_volunteers_by_skill_match(
            volunteers, activity.required_skills
        )

        shifts = []
        volunteer_shift_count: Dict[int, int] = {}

        for slot in time_slots:
            volunteers_for_slot = [
                v for v in matched_volunteers
                if volunteer_shift_count.get(v.id, 0) < max_shifts_per_volunteer
            ]

            if not volunteers_for_slot:
                continue

            selected_volunteer = volunteers_for_slot[0]
            volunteer_shift_count[selected_volunteer.id] = (
                volunteer_shift_count.get(selected_volunteer.id, 0) + 1
            )

            registration = next(
                (r for r in approved_registrations if r.volunteer_id == selected_volunteer.id),
                None
            )

            shift = Shift(
                activity_id=activity_id,
                volunteer_id=selected_volunteer.id,
                registration_id=registration.id if registration else None,
                status=ShiftStatus.PENDING,
                start_time=slot["start_time"],
                end_time=slot["end_time"],
            )
            self.db.add(shift)
            shifts.append(shift)

        await self.db.commit()
        for shift in shifts:
            await self.db.refresh(shift)

        return shifts

    async def _get_activity(self, activity_id: int) -> Optional[Activity]:
        result = await self.db.execute(
            select(Activity).where(Activity.id == activity_id)
        )
        return result.scalar_one_or_none()

    async def _get_approved_registrations(self, activity_id: int) -> List[Registration]:
        result = await self.db.execute(
            select(Registration)
            .where(
                and_(
                    Registration.activity_id == activity_id,
                    Registration.status == RegistrationStatus.APPROVED,
                )
            )
        )
        return list(result.scalars().all())

    def _generate_time_slots(self, activity: Activity) -> List[Dict[str, Any]]:
        """
        生成排班时间段
        
        默认每个排班4小时，可根据活动实际时长调整
        """
        slots = []
        slot_duration = timedelta(hours=4)
        current = activity.start_time

        while current < activity.end_time:
            slot_end = current + slot_duration
            if slot_end > activity.end_time:
                slot_end = activity.end_time

            slots.append({
                "start_time": current,
                "end_time": slot_end,
            })
            current = slot_end

        return slots

    def _rank_volunteers_by_skill_match(
        self,
        volunteers: List[User],
        required_skills: List[Any],
    ) -> List[User]:
        """
        按技能匹配度排名志愿者
        
        匹配度计算：
        - 完全匹配：高优先级
        - 部分匹配：中优先级
        - 不匹配：低优先级
        """
        if not required_skills:
            return volunteers

        required_skill_ids = {s.id for s in required_skills}

        def get_match_score(volunteer: User) -> int:
            volunteer_skill_ids = {s.id for s in volunteer.skills}
            return len(volunteer_skill_ids & required_skill_ids)

        sorted_volunteers = sorted(
            volunteers,
            key=get_match_score,
            reverse=True,
        )

        return sorted_volunteers

    async def confirm_shift(self, shift_id: int, volunteer_id: int) -> Shift:
        """
        志愿者确认排班
        
        业务规则：
        1. 只有待确认状态的排班可以被确认
        2. 只能确认自己的排班
        3. 确认后状态变为已确认，等待执行
        """
        result = await self.db.execute(
            select(Shift).where(
                and_(
                    Shift.id == shift_id,
                    Shift.volunteer_id == volunteer_id,
                    Shift.status == ShiftStatus.PENDING,
                )
            )
        )
        shift = result.scalar_one_or_none()

        if not shift:
            raise ValueError(f"排班 {shift_id} 不存在或无法确认")

        shift.status = ShiftStatus.CONFIRMED
        shift.confirmed_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(shift)

        return shift
