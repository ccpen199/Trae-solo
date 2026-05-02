from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.models import (
    Attendance,
    Shift,
    Activity,
    AnomalyRecord,
    AnomalyType,
    AttendanceStatus,
    ShiftStatus,
    Notification,
)
import math


class LBSAttendanceEngine:
    """
    LBS-Attendance 定位引擎
    
    职责：
    1. 基于地理位置的签到/签出验证
    2. 实时监测志愿者位置和服务时长
    3. 异常离岗检测和预警推送
    4. 签到轨迹留痕和审计
    
    设计原因：
    - 志愿服务的真实性是核心需求，需要通过地理位置确保志愿者实际到场
    - 实时监测确保服务时长的准确性，防止数据造假
    - 异常预警机制让组织者及时发现并处理问题
    - 所有签到轨迹永久留痕，支持政务端审计
    """

    EARTH_RADIUS = 6371000
    LOCATION_TOLERANCE = 200.0

    def __init__(self, db: AsyncSession):
        self.db = db

    async def check_in(
        self,
        shift_id: int,
        volunteer_id: int,
        latitude: float,
        longitude: float,
    ) -> Attendance:
        """
        志愿者签到
        
        步骤：
        1. 验证排班有效性和志愿者身份
        2. 验证地理位置是否在活动范围内
        3. 创建或更新签到记录
        4. 检查是否存在异常（迟到等）
        5. 返回签到结果
        """
        shift = await self._get_shift(shift_id, volunteer_id)
        if not shift:
            raise ValueError(f"排班 {shift_id} 不存在或不属于您")

        activity = await self._get_activity(shift.activity_id)
        if not activity:
            raise ValueError(f"活动 {shift.activity_id} 不存在")

        is_within_range = self._is_location_within_range(
            activity.latitude,
            activity.longitude,
            latitude,
            longitude,
            activity.location_radius,
        )

        if not is_within_range:
            await self._create_anomaly(
                shift=shift,
                activity=activity,
                anomaly_type=AnomalyType.LOCATION_MISMATCH,
                description=f"签到位置超出活动范围，预期半径: {activity.location_radius}米",
            )
            raise ValueError("签到位置不在活动范围内")

        existing_attendance = await self._get_existing_attendance(shift_id)
        if existing_attendance and existing_attendance.check_in_time:
            raise ValueError("您已签到过了")

        if existing_attendance:
            attendance = existing_attendance
        else:
            attendance = Attendance(
                shift_id=shift_id,
                activity_id=shift.activity_id,
                volunteer_id=volunteer_id,
                status=AttendanceStatus.PENDING,
            )
            self.db.add(attendance)

        attendance.check_in_time = datetime.utcnow()
        attendance.check_in_latitude = latitude
        attendance.check_in_longitude = longitude
        attendance.status = AttendanceStatus.CHECKED_IN

        shift.status = ShiftStatus.IN_PROGRESS

        if attendance.check_in_time > shift.start_time + timedelta(minutes=15):
            await self._create_anomaly(
                shift=shift,
                activity=activity,
                anomaly_type=AnomalyType.LATE_ARRIVAL,
                description=f"迟到 {self._calculate_late_minutes(attendance.check_in_time, shift.start_time)} 分钟",
            )

        await self.db.commit()
        await self.db.refresh(attendance)

        return attendance

    async def check_out(
        self,
        shift_id: int,
        volunteer_id: int,
        latitude: float,
        longitude: float,
    ) -> Attendance:
        """
        志愿者签出
        
        步骤：
        1. 验证签到状态
        2. 验证地理位置
        3. 计算实际服务时长
        4. 检查异常（早退等）
        5. 更新签到记录状态
        """
        attendance = await self._get_active_attendance(shift_id, volunteer_id)
        if not attendance:
            raise ValueError("未找到有效的签到记录")

        activity = await self._get_activity(attendance.activity_id)
        if not activity:
            raise ValueError(f"活动不存在")

        is_within_range = self._is_location_within_range(
            activity.latitude,
            activity.longitude,
            latitude,
            longitude,
            activity.location_radius,
        )

        if not is_within_range:
            await self._create_anomaly(
                shift=None,
                activity=activity,
                anomaly_type=AnomalyType.LOCATION_MISMATCH,
                description="签出位置超出活动范围",
                attendance=attendance,
            )

        attendance.check_out_time = datetime.utcnow()
        attendance.check_out_latitude = latitude
        attendance.check_out_longitude = longitude

        if attendance.check_in_time:
            duration_delta = attendance.check_out_time - attendance.check_in_time
            attendance.actual_duration = duration_delta.total_seconds() / 3600.0

        attendance.status = AttendanceStatus.CHECKED_OUT

        shift = await self._get_shift(shift_id, volunteer_id)
        if shift:
            shift.status = ShiftStatus.COMPLETED

            if attendance.check_out_time < shift.end_time - timedelta(minutes=15):
                early_minutes = int((shift.end_time - attendance.check_out_time).total_seconds() / 60)
                await self._create_anomaly(
                    shift=shift,
                    activity=activity,
                    anomaly_type=AnomalyType.EARLY_LEAVE,
                    description=f"早退 {early_minutes} 分钟",
                    attendance=attendance,
                )

        await self.db.commit()
        await self.db.refresh(attendance)

        return attendance

    def _is_location_within_range(
        self,
        center_lat: Optional[float],
        center_lng: Optional[float],
        point_lat: float,
        point_lng: float,
        radius: float,
    ) -> bool:
        """
        使用 Haversine 公式计算两点之间的距离
        验证签到位置是否在活动范围内
        """
        if center_lat is None or center_lng is None:
            return True

        lat1 = math.radians(center_lat)
        lng1 = math.radians(center_lng)
        lat2 = math.radians(point_lat)
        lng2 = math.radians(point_lng)

        dlat = lat2 - lat1
        dlng = lng2 - lng1

        a = (math.sin(dlat / 2) ** 2 +
             math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2)
        c = 2 * math.asin(math.sqrt(a))
        distance = self.EARTH_RADIUS * c

        return distance <= radius

    async def _get_shift(self, shift_id: int, volunteer_id: int) -> Optional[Shift]:
        result = await self.db.execute(
            select(Shift).where(
                and_(
                    Shift.id == shift_id,
                    Shift.volunteer_id == volunteer_id,
                )
            )
        )
        return result.scalar_one_or_none()

    async def _get_activity(self, activity_id: int) -> Optional[Activity]:
        result = await self.db.execute(
            select(Activity).where(Activity.id == activity_id)
        )
        return result.scalar_one_or_none()

    async def _get_existing_attendance(self, shift_id: int) -> Optional[Attendance]:
        result = await self.db.execute(
            select(Attendance).where(Attendance.shift_id == shift_id)
        )
        return result.scalar_one_or_none()

    async def _get_active_attendance(
        self,
        shift_id: int,
        volunteer_id: int,
    ) -> Optional[Attendance]:
        result = await self.db.execute(
            select(Attendance).where(
                and_(
                    Attendance.shift_id == shift_id,
                    Attendance.volunteer_id == volunteer_id,
                    Attendance.status == AttendanceStatus.CHECKED_IN,
                )
            )
        )
        return result.scalar_one_or_none()

    async def _create_anomaly(
        self,
        shift: Optional[Shift],
        activity: Activity,
        anomaly_type: AnomalyType,
        description: str,
        attendance: Optional[Attendance] = None,
    ) -> AnomalyRecord:
        anomaly = AnomalyRecord(
            attendance_id=attendance.id if attendance else None,
            activity_id=activity.id,
            volunteer_id=shift.volunteer_id if shift else None,
            anomaly_type=anomaly_type,
            description=description,
            is_verified=False,
        )
        self.db.add(anomaly)

        if shift and activity:
            notification = Notification(
                user_id=activity.organizer_id,
                title=f"异常预警：{activity.title}",
                message=f"志愿者发生异常：{description}，请及时处理。",
                notification_type="anomaly_alert",
                related_id=anomaly.id,
            )
            self.db.add(notification)

        return anomaly

    def _calculate_late_minutes(self, check_in_time: datetime, start_time: datetime) -> int:
        return int((check_in_time - start_time).total_seconds() / 60)
