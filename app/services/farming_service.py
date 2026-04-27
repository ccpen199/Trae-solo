from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import hashlib
import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.farming import FarmingRecord, FarmingOperation
from app.models.batch import Batch, BatchStatus
from app.models.user import User

logger = structlog.get_logger()


class FarmingService:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _generate_digital_timestamp(
        self,
        batch_uid: str,
        operation_time: datetime,
        operator_uid: str,
        latitude: Optional[float],
        longitude: Optional[float],
    ) -> str:
        timestamp_str = (
            f"{batch_uid}|{operation_time.isoformat()}|{operator_uid}|"
            f"{latitude}|{longitude}|{uuid.uuid4()}"
        )
        return hashlib.sha256(timestamp_str.encode()).hexdigest()
    
    async def create_farming_record(
        self,
        batch_uid: str,
        operation_type: FarmingOperation,
        operation_name: str,
        operator_uid: str,
        operator_name: Optional[str] = None,
        operation_time: Optional[datetime] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        location_description: Optional[str] = None,
        photo_urls: Optional[Dict[str, Any]] = None,
        weather_info: Optional[Dict[str, Any]] = None,
        equipment_used: Optional[str] = None,
        labor_count: Optional[int] = None,
        pesticide_name: Optional[str] = None,
        pesticide_dosage: Optional[float] = None,
        pesticide_unit: Optional[str] = None,
        fertilizer_name: Optional[str] = None,
        fertilizer_dosage: Optional[float] = None,
        fertilizer_unit: Optional[str] = None,
        notes: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> FarmingRecord:
        actual_time = operation_time or datetime.utcnow()
        
        digital_timestamp = self._generate_digital_timestamp(
            batch_uid=batch_uid,
            operation_time=actual_time,
            operator_uid=operator_uid,
            latitude=latitude,
            longitude=longitude,
        )
        
        record = FarmingRecord(
            uid=str(uuid.uuid4()),
            batch_uid=batch_uid,
            operation_type=operation_type,
            operation_name=operation_name,
            operator_uid=operator_uid,
            operator_name=operator_name,
            operation_time=actual_time,
            latitude=latitude,
            longitude=longitude,
            location_description=location_description,
            photo_urls=photo_urls,
            digital_timestamp=digital_timestamp,
            weather_info=weather_info,
            equipment_used=equipment_used,
            labor_count=labor_count,
            pesticide_name=pesticide_name,
            pesticide_dosage=pesticide_dosage,
            pesticide_unit=pesticide_unit,
            fertilizer_name=fertilizer_name,
            fertilizer_dosage=fertilizer_dosage,
            fertilizer_unit=fertilizer_unit,
            notes=notes,
            extra_data=extra_data,
        )
        
        self.session.add(record)
        await self.session.flush()
        
        logger.info(
            "farming_record_created",
            record_uid=record.uid,
            batch_uid=batch_uid,
            operation_type=operation_type.value,
        )
        
        return record
    
    async def get_farming_record_by_uid(self, record_uid: str) -> Optional[FarmingRecord]:
        result = await self.session.execute(
            select(FarmingRecord).where(FarmingRecord.uid == record_uid)
        )
        return result.scalar_one_or_none()
    
    async def get_records_by_batch(
        self,
        batch_uid: str,
        operation_type: Optional[FarmingOperation] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[FarmingRecord]:
        query = select(FarmingRecord).where(FarmingRecord.batch_uid == batch_uid)
        
        if operation_type:
            query = query.where(FarmingRecord.operation_type == operation_type)
        
        query = query.order_by(FarmingRecord.operation_time.desc()).offset(offset).limit(limit)
        
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def get_batch_farming_summary(self, batch_uid: str) -> Dict[str, Any]:
        records = await self.get_records_by_batch(batch_uid)
        
        operation_counts: Dict[str, int] = {}
        for record in records:
            op_type = record.operation_type.value
            operation_counts[op_type] = operation_counts.get(op_type, 0) + 1
        
        total_labor = sum(r.labor_count or 0 for r in records)
        
        pesticide_records = [
            {
                "name": r.pesticide_name,
                "dosage": r.pesticide_dosage,
                "unit": r.pesticide_unit,
                "time": r.operation_time,
            }
            for r in records
            if r.pesticide_name
        ]
        
        fertilizer_records = [
            {
                "name": r.fertilizer_name,
                "dosage": r.fertilizer_dosage,
                "unit": r.fertilizer_unit,
                "time": r.operation_time,
            }
            for r in records
            if r.fertilizer_name
        ]
        
        first_operation = min(r.operation_time for r in records) if records else None
        last_operation = max(r.operation_time for r in records) if records else None
        
        return {
            "batch_uid": batch_uid,
            "total_records": len(records),
            "operation_counts": operation_counts,
            "total_labor": total_labor,
            "pesticide_applications": pesticide_records,
            "fertilizer_applications": fertilizer_records,
            "first_operation": first_operation,
            "last_operation": last_operation,
            "has_photos": any(r.photo_urls for r in records),
            "has_location": any(r.latitude and r.longitude for r in records),
        }
    
    async def add_photo_to_record(
        self,
        record_uid: str,
        photo_url: str,
        photo_description: Optional[str] = None,
    ) -> bool:
        record = await self.get_farming_record_by_uid(record_uid)
        if not record:
            return False
        
        if record.photo_urls is None:
            record.photo_urls = {"photos": []}
        
        if "photos" not in record.photo_urls:
            record.photo_urls["photos"] = []
        
        photo_entry = {
            "url": photo_url,
            "description": photo_description,
            "timestamp": datetime.utcnow().isoformat(),
        }
        record.photo_urls["photos"].append(photo_entry)
        
        await self.session.flush()
        
        logger.info(
            "photo_added_to_farming_record",
            record_uid=record_uid,
            photo_url=photo_url,
        )
        return True
    
    async def verify_digital_timestamp(self, record_uid: str) -> bool:
        record = await self.get_farming_record_by_uid(record_uid)
        if not record:
            return False
        
        expected_timestamp = self._generate_digital_timestamp(
            batch_uid=record.batch_uid,
            operation_time=record.operation_time,
            operator_uid=record.operator_uid,
            latitude=record.latitude,
            longitude=record.longitude,
        )
        
        return record.digital_timestamp == expected_timestamp
