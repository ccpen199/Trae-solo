from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.farming import FarmingOperation
from app.services.farming_service import FarmingService
from app.schemas import (
    FarmingRecordCreate,
    FarmingRecordResponse,
    ApiResponse,
)

router = APIRouter(prefix="/farming", tags=["农事作业"])


@router.post("/records", response_model=FarmingRecordResponse)
async def create_farming_record(
    record_data: FarmingRecordCreate,
    session: AsyncSession = Depends(get_session),
):
    service = FarmingService(session)
    try:
        record = await service.create_farming_record(
            batch_uid=record_data.batch_uid,
            operation_type=record_data.operation_type,
            operation_name=record_data.operation_name,
            operator_uid=record_data.operator_uid,
            operator_name=record_data.operator_name,
            operation_time=record_data.operation_time,
            latitude=record_data.latitude,
            longitude=record_data.longitude,
            location_description=record_data.location_description,
            photo_urls=record_data.photo_urls,
            weather_info=record_data.weather_info,
            equipment_used=record_data.equipment_used,
            labor_count=record_data.labor_count,
            pesticide_name=record_data.pesticide_name,
            pesticide_dosage=record_data.pesticide_dosage,
            pesticide_unit=record_data.pesticide_unit,
            fertilizer_name=record_data.fertilizer_name,
            fertilizer_dosage=record_data.fertilizer_dosage,
            fertilizer_unit=record_data.fertilizer_unit,
            notes=record_data.notes,
            extra_data=record_data.metadata,
        )
        await session.commit()
        return record
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/records/{record_uid}", response_model=FarmingRecordResponse)
async def get_farming_record(
    record_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = FarmingService(session)
    record = await service.get_farming_record_by_uid(record_uid)
    if not record:
        raise HTTPException(status_code=404, detail="农事记录不存在")
    return record


@router.get("/batch/{batch_uid}", response_model=List[FarmingRecordResponse])
async def get_farming_records_by_batch(
    batch_uid: str,
    operation_type: Optional[FarmingOperation] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    service = FarmingService(session)
    records = await service.get_records_by_batch(
        batch_uid=batch_uid,
        operation_type=operation_type,
        limit=limit,
        offset=offset,
    )
    return records


@router.get("/batch/{batch_uid}/summary")
async def get_batch_farming_summary(
    batch_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = FarmingService(session)
    summary = await service.get_batch_farming_summary(batch_uid)
    return summary


@router.get("/records/{record_uid}/verify-timestamp")
async def verify_digital_timestamp(
    record_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = FarmingService(session)
    is_valid = await service.verify_digital_timestamp(record_uid)
    
    return {
        "record_uid": record_uid,
        "timestamp_valid": is_valid,
        "message": "数字时间戳验证通过" if is_valid else "数字时间戳验证失败",
    }


@router.post("/records/{record_uid}/photos")
async def add_photo_to_record(
    record_uid: str,
    photo_url: str,
    photo_description: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    service = FarmingService(session)
    success = await service.add_photo_to_record(
        record_uid=record_uid,
        photo_url=photo_url,
        photo_description=photo_description,
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="农事记录不存在")
    
    await session.commit()
    return {
        "success": True,
        "message": "照片已添加到农事记录",
        "photo_url": photo_url,
    }


@router.get("/operation-types")
async def get_operation_types():
    return {
        "operation_types": [
            {
                "type": op.value,
                "name": {
                    FarmingOperation.PLANTING: "种植",
                    FarmingOperation.IRRIGATION: "灌溉",
                    FarmingOperation.FERTILIZATION: "施肥",
                    FarmingOperation.PESTICIDE_APPLICATION: "施药",
                    FarmingOperation.WEED_CONTROL: "除草",
                    FarmingOperation.HARVEST: "采收",
                    FarmingOperation.OTHER: "其他",
                }.get(op, op.value),
            }
            for op in FarmingOperation
        ]
    }
