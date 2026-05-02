from typing import Dict, Any, Optional, List
from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_
from app.models import TimeSlot, Reservation, ServiceItem


class TimeSlotEngine:
    """
    Time-Slot 预约引擎
    负责预约时间槽管理和窗口预约池管理，包括：
    - 时间槽生成和维护
    - 预约配额管理
    - 预约冲突检测
    - 窗口资源分配
    """

    TIME_SLOT_TEMPLATES = [
        {"start": "09:00", "end": "09:30", "capacity": 5},
        {"start": "09:30", "end": "10:00", "capacity": 5},
        {"start": "10:00", "end": "10:30", "capacity": 5},
        {"start": "10:30", "end": "11:00", "capacity": 5},
        {"start": "11:00", "end": "11:30", "capacity": 5},
        {"start": "11:30", "end": "12:00", "capacity": 5},
        {"start": "13:30", "end": "14:00", "capacity": 5},
        {"start": "14:00", "end": "14:30", "capacity": 5},
        {"start": "14:30", "end": "15:00", "capacity": 5},
        {"start": "15:00", "end": "15:30", "capacity": 5},
        {"start": "15:30", "end": "16:00", "capacity": 5},
        {"start": "16:00", "end": "16:30", "capacity": 5},
        {"start": "16:30", "end": "17:00", "capacity": 5},
    ]

    async def generate_time_slots(
        self,
        db: AsyncSession,
        service_item_id: int,
        window_count: int,
        start_date: Optional[date] = None,
        days_ahead: int = 14,
    ) -> List[TimeSlot]:
        """
        为指定服务事项生成未来日期的时间槽
        """
        if start_date is None:
            start_date = date.today()

        existing_slots = await self._get_existing_slots(
            db, service_item_id, start_date, start_date + timedelta(days=days_ahead)
        )
        existing_dates = {
            (slot.date, slot.window_number, slot.start_time)
            for slot in existing_slots
        }

        new_slots = []
        for day_offset in range(days_ahead):
            current_date = start_date + timedelta(days=day_offset)
            if current_date.weekday() >= 5:
                continue

            date_str = current_date.strftime("%Y-%m-%d")

            for window_number in range(1, window_count + 1):
                for template in self.TIME_SLOT_TEMPLATES:
                    key = (date_str, window_number, template["start"])
                    if key in existing_dates:
                        continue

                    slot = TimeSlot(
                        service_item_id=service_item_id,
                        window_number=window_number,
                        date=date_str,
                        start_time=template["start"],
                        end_time=template["end"],
                        total_capacity=template["capacity"],
                        used_capacity=0,
                        status="AVAILABLE",
                    )
                    new_slots.append(slot)
                    db.add(slot)

        if new_slots:
            await db.commit()

        return new_slots

    async def _get_existing_slots(
        self,
        db: AsyncSession,
        service_item_id: int,
        start_date: date,
        end_date: date,
    ) -> List[TimeSlot]:
        query = select(TimeSlot).where(
            and_(
                TimeSlot.service_item_id == service_item_id,
                TimeSlot.date >= start_date.strftime("%Y-%m-%d"),
                TimeSlot.date <= end_date.strftime("%Y-%m-%d"),
            )
        )
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_available_slots(
        self,
        db: AsyncSession,
        service_item_id: int,
        date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取可用的时间槽
        返回按日期和窗口分组的可用时间槽列表
        """
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")

        query = select(TimeSlot).where(
            and_(
                TimeSlot.service_item_id == service_item_id,
                TimeSlot.date >= date,
                TimeSlot.status == "AVAILABLE",
                TimeSlot.used_capacity < TimeSlot.total_capacity,
            )
        ).order_by(TimeSlot.date, TimeSlot.window_number, TimeSlot.start_time)

        result = await db.execute(query)
        slots = list(result.scalars().all())

        grouped = {}
        for slot in slots:
            date_key = slot.date
            if date_key not in grouped:
                grouped[date_key] = {}
            window_key = slot.window_number
            if window_key not in grouped[date_key]:
                grouped[date_key][window_key] = []
            grouped[date_key][window_key].append(
                {
                    "id": slot.id,
                    "start_time": slot.start_time,
                    "end_time": slot.end_time,
                    "total_capacity": slot.total_capacity,
                    "used_capacity": slot.used_capacity,
                    "available_capacity": slot.total_capacity - slot.used_capacity,
                    "status": slot.status,
                }
            )

        result_list = []
        for date_str, windows in grouped.items():
            for window_num, time_slots in windows.items():
                result_list.append(
                    {
                        "date": date_str,
                        "window_number": window_num,
                        "time_slots": time_slots,
                    }
                )

        return result_list

    async def reserve_slot(
        self,
        db: AsyncSession,
        time_slot_id: int,
        case_id: int,
        citizen_id: int,
    ) -> Dict[str, Any]:
        """
        预约时间槽
        """
        query = select(TimeSlot).where(TimeSlot.id == time_slot_id).with_for_update()
        result = await db.execute(query)
        slot = result.scalar_one_or_none()

        if not slot:
            return {
                "success": False,
                "message": "时间槽不存在",
                "error_code": "SLOT_NOT_FOUND",
            }

        if slot.status != "AVAILABLE":
            return {
                "success": False,
                "message": "时间槽不可用",
                "error_code": "SLOT_UNAVAILABLE",
            }

        if slot.used_capacity >= slot.total_capacity:
            return {
                "success": False,
                "message": "时间槽已满",
                "error_code": "SLOT_FULL",
            }

        existing_query = select(Reservation).where(
            and_(
                Reservation.case_id == case_id,
                Reservation.status != "CANCELLED",
            )
        )
        existing_result = await db.execute(existing_query)
        existing_reservation = existing_result.scalar_one_or_none()

        if existing_reservation:
            return {
                "success": False,
                "message": "该办件已有有效预约",
                "error_code": "ALREADY_RESERVED",
            }

        reservation_number = self._generate_reservation_number()

        reservation = Reservation(
            reservation_number=reservation_number,
            case_id=case_id,
            time_slot_id=time_slot_id,
            citizen_id=citizen_id,
            status="CONFIRMED",
        )
        db.add(reservation)

        slot.used_capacity += 1
        if slot.used_capacity >= slot.total_capacity:
            slot.status = "FULL"

        await db.commit()
        await db.refresh(reservation)
        await db.refresh(slot)

        return {
            "success": True,
            "message": "预约成功",
            "reservation": {
                "id": reservation.id,
                "reservation_number": reservation.reservation_number,
                "date": slot.date,
                "start_time": slot.start_time,
                "end_time": slot.end_time,
                "window_number": slot.window_number,
                "status": reservation.status,
            },
        }

    async def cancel_reservation(
        self,
        db: AsyncSession,
        reservation_id: int,
        citizen_id: int,
    ) -> Dict[str, Any]:
        """
        取消预约
        """
        query = select(Reservation).where(Reservation.id == reservation_id)
        result = await db.execute(query)
        reservation = result.scalar_one_or_none()

        if not reservation:
            return {
                "success": False,
                "message": "预约不存在",
                "error_code": "RESERVATION_NOT_FOUND",
            }

        if reservation.citizen_id != citizen_id:
            return {
                "success": False,
                "message": "无权取消该预约",
                "error_code": "PERMISSION_DENIED",
            }

        if reservation.status == "CANCELLED":
            return {
                "success": False,
                "message": "预约已取消",
                "error_code": "ALREADY_CANCELLED",
            }

        slot_query = select(TimeSlot).where(TimeSlot.id == reservation.time_slot_id)
        slot_result = await db.execute(slot_query)
        slot = slot_result.scalar_one_or_none()

        if slot:
            slot.used_capacity = max(0, slot.used_capacity - 1)
            if slot.status == "FULL" and slot.used_capacity < slot.total_capacity:
                slot.status = "AVAILABLE"

        reservation.status = "CANCELLED"

        await db.commit()

        return {
            "success": True,
            "message": "预约已取消",
        }

    async def get_reservation_status(
        self,
        db: AsyncSession,
        reservation_id: int,
    ) -> Optional[Dict[str, Any]]:
        """
        获取预约状态
        """
        query = select(Reservation).where(Reservation.id == reservation_id)
        result = await db.execute(query)
        reservation = result.scalar_one_or_none()

        if not reservation:
            return None

        slot_query = select(TimeSlot).where(TimeSlot.id == reservation.time_slot_id)
        slot_result = await db.execute(slot_query)
        slot = slot_result.scalar_one_or_none()

        return {
            "reservation": {
                "id": reservation.id,
                "reservation_number": reservation.reservation_number,
                "case_id": reservation.case_id,
                "status": reservation.status,
                "check_in_time": reservation.check_in_time,
                "check_out_time": reservation.check_out_time,
            },
            "time_slot": {
                "date": slot.date if slot else None,
                "start_time": slot.start_time if slot else None,
                "end_time": slot.end_time if slot else None,
                "window_number": slot.window_number if slot else None,
            },
        }

    def _generate_reservation_number(self) -> str:
        """生成预约编号"""
        now = datetime.now()
        timestamp = now.strftime("%Y%m%d%H%M%S")
        import random

        random_suffix = "".join([str(random.randint(0, 9)) for _ in range(4)])
        return f"RES{timestamp}{random_suffix}"
