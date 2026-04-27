from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.compensation import CompensationType, CompensationStatus
from app.services.compensation_service import CompensationService
from app.schemas import (
    CompensationRecordResponse,
    CompensationStatisticsResponse,
    ApiResponse,
)

router = APIRouter(prefix="/compensation", tags=["失败补偿"])


@router.get("/records/{compensation_uid}", response_model=CompensationRecordResponse)
async def get_compensation_record(
    compensation_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = CompensationService(session)
    record = await service.get_compensation_by_uid(compensation_uid)
    if not record:
        raise HTTPException(status_code=404, detail="补偿记录不存在")
    return record


@router.get("/pending", response_model=List[CompensationRecordResponse])
async def get_pending_compensations(
    limit: int = Query(100, ge=1, le=500),
    priority: Optional[int] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    service = CompensationService(session)
    records = await service.get_pending_compensations(
        limit=limit,
        priority=priority,
    )
    return records


@router.post("/{compensation_uid}/process")
async def process_compensation(
    compensation_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = CompensationService(session)
    record = await service.get_compensation_by_uid(compensation_uid)
    
    if not record:
        raise HTTPException(status_code=404, detail="补偿记录不存在")
    
    success = await service.process_compensation(compensation_uid)
    
    await session.commit()
    
    return {
        "compensation_uid": compensation_uid,
        "success": success,
        "message": "补偿处理成功" if success else "补偿处理失败",
    }


@router.post("/{compensation_uid}/skip")
async def skip_compensation(
    compensation_uid: str,
    reason: str,
    session: AsyncSession = Depends(get_session),
):
    service = CompensationService(session)
    record = await service.skip_compensation(compensation_uid, reason)
    
    if not record:
        raise HTTPException(status_code=404, detail="补偿记录不存在")
    
    await session.commit()
    
    return {
        "compensation_uid": compensation_uid,
        "status": record.status.value,
        "reason": reason,
        "message": "补偿记录已跳过",
    }


@router.post("/{compensation_uid}/resolve")
async def manually_resolve(
    compensation_uid: str,
    resolved_by_uid: str,
    resolution_notes: Optional[str] = None,
    resolved_by_name: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    service = CompensationService(session)
    record = await service.manually_resolve(
        compensation_uid=compensation_uid,
        resolved_by_uid=resolved_by_uid,
        resolved_by_name=resolved_by_name,
        resolution_notes=resolution_notes,
    )
    
    if not record:
        raise HTTPException(status_code=404, detail="补偿记录不存在")
    
    await session.commit()
    
    return {
        "compensation_uid": compensation_uid,
        "status": record.status.value,
        "resolved_by_uid": resolved_by_uid,
        "resolved_by_name": record.resolved_by_name,
        "resolution_notes": record.resolution_notes,
        "message": "补偿记录已人工处理",
    }


@router.get("/statistics", response_model=CompensationStatisticsResponse)
async def get_compensation_statistics(
    session: AsyncSession = Depends(get_session),
):
    service = CompensationService(session)
    stats = await service.get_compensation_statistics()
    return stats


@router.get("/operation-types")
async def get_operation_types():
    return {
        "operation_types": [
            {
                "type": op.value,
                "name": {
                    CompensationType.BATCH_CREATION: "批次创建",
                    CompensationType.FARMING_RECORD: "农事记录",
                    CompensationType.QUALITY_INSPECTION: "质量检测",
                    CompensationType.FLOW_TRANSFER: "流通转移",
                    CompensationType.RECALL: "质量召回",
                    CompensationType.TAG_ACTIVATION: "标签激活",
                    CompensationType.NOTIFICATION: "通知",
                    CompensationType.EXPORT: "导出",
                    CompensationType.OTHER: "其他",
                }.get(op, op.value),
            }
            for op in CompensationType
        ]
    }


@router.get("/statuses")
async def get_compensation_statuses():
    return {
        "statuses": [
            {
                "type": status.value,
                "name": {
                    CompensationStatus.PENDING: "待处理",
                    CompensationStatus.IN_PROGRESS: "处理中",
                    CompensationStatus.SUCCESS: "成功",
                    CompensationStatus.FAILED: "失败",
                    CompensationStatus.SKIPPED: "已跳过",
                    CompensationStatus.MANUALLY_RESOLVED: "人工处理",
                }.get(status, status.value),
            }
            for status in CompensationStatus
        ]
    }
