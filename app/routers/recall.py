from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.recall import RecallLevel, RecallStatus
from app.services.recall_service import RecallService
from app.schemas import (
    RecallCreate,
    RecallResponse,
    LocateAffectedBatchesRequest,
    ApiResponse,
)

router = APIRouter(prefix="/recall", tags=["质量召回"])


@router.post("/", response_model=RecallResponse)
async def create_recall(
    recall_data: RecallCreate,
    session: AsyncSession = Depends(get_session),
):
    service = RecallService(session)
    try:
        recall = await service.create_recall(
            title=recall_data.title,
            description=recall_data.description,
            reason=recall_data.reason,
            level=recall_data.level,
            initiator_uid=recall_data.initiator_uid,
            initiator_name=recall_data.initiator_name,
            reason_category=recall_data.reason_category,
            affected_batch_uids=recall_data.affected_batch_uids,
            total_quantity=recall_data.total_quantity,
            unit=recall_data.unit,
            recall_deadline=recall_data.recall_deadline,
            compensation_required=recall_data.compensation_required,
            compensation_amount=recall_data.compensation_amount,
            extra_data=recall_data.metadata,
        )
        await session.commit()
        return recall
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{recall_uid}", response_model=RecallResponse)
async def get_recall(
    recall_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = RecallService(session)
    recall = await service.get_recall_by_uid(recall_uid)
    if not recall:
        raise HTTPException(status_code=404, detail="召回记录不存在")
    return recall


@router.get("/code/{recall_code}", response_model=RecallResponse)
async def get_recall_by_code(
    recall_code: str,
    session: AsyncSession = Depends(get_session),
):
    service = RecallService(session)
    recall = await service.get_recall_by_code(recall_code)
    if not recall:
        raise HTTPException(status_code=404, detail="召回记录不存在")
    return recall


@router.get("/active", response_model=List[RecallResponse])
async def get_active_recalls(
    session: AsyncSession = Depends(get_session),
):
    service = RecallService(session)
    recalls = await service.get_active_recalls()
    return recalls


@router.post("/locate-batches")
async def locate_affected_batches(
    request: LocateAffectedBatchesRequest,
    session: AsyncSession = Depends(get_session),
):
    service = RecallService(session)
    
    search_criteria = {
        "product_name": request.product_name,
        "farm_name": request.farm_name,
        "date_from": request.date_from,
        "date_to": request.date_to,
        "batch_codes": request.batch_codes or [],
    }
    
    batches = await service.locate_affected_batches(search_criteria)
    
    return {
        "search_criteria": {
            "product_name": request.product_name,
            "farm_name": request.farm_name,
            "date_from": request.date_from,
            "date_to": request.date_to,
            "batch_codes": request.batch_codes,
        },
        "affected_batches": batches,
        "total_affected": len(batches),
    }


@router.get("/locate-terminals/{batch_uid}")
async def locate_affected_terminals(
    batch_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = RecallService(session)
    terminals = await service.locate_affected_terminals(batch_uid)
    
    if "error" in terminals:
        raise HTTPException(status_code=404, detail=terminals["error"])
    
    return terminals


@router.post("/{recall_uid}/approve", response_model=RecallResponse)
async def approve_recall(
    recall_uid: str,
    approval_uid: str,
    approval_name: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    service = RecallService(session)
    recall = await service.approve_recall(recall_uid, approval_uid, approval_name)
    
    if not recall:
        raise HTTPException(status_code=404, detail="召回记录不存在或状态不允许")
    
    await session.commit()
    return recall


@router.post("/{recall_uid}/start", response_model=RecallResponse)
async def start_recall(
    recall_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = RecallService(session)
    recall = await service.start_recall(recall_uid)
    
    if not recall:
        raise HTTPException(status_code=404, detail="召回记录不存在或状态不允许")
    
    await session.commit()
    return recall


@router.post("/{recall_uid}/update-progress")
async def update_recovery_progress(
    recall_uid: str,
    recovered_quantity: float,
    disposed_quantity: float = 0.0,
    session: AsyncSession = Depends(get_session),
):
    service = RecallService(session)
    recall = await service.update_recovery_progress(
        recall_uid=recall_uid,
        recovered_quantity=recovered_quantity,
        disposed_quantity=disposed_quantity,
    )
    
    if not recall:
        raise HTTPException(status_code=404, detail="召回记录不存在或状态不允许")
    
    await session.commit()
    
    return {
        "recall_uid": recall_uid,
        "status": recall.status.value,
        "recovered_quantity": recall.recovered_quantity,
        "disposed_quantity": recall.disposed_quantity,
        "total_quantity": recall.total_quantity,
        "progress_percentage": recall.get_progress_percentage(),
    }


@router.get("/{recall_uid}/summary")
async def get_recall_summary(
    recall_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = RecallService(session)
    summary = await service.get_recall_summary(recall_uid)
    
    if not summary:
        raise HTTPException(status_code=404, detail="召回记录不存在")
    
    return summary


@router.get("/levels")
async def get_recall_levels():
    return {
        "levels": [
            {
                "type": RecallLevel.LEVEL_1.value,
                "name": "一级召回",
                "description": "食用后已经或者可能导致严重健康损害甚至死亡的",
            },
            {
                "type": RecallLevel.LEVEL_2.value,
                "name": "二级召回",
                "description": "食用后已经或者可能导致一般健康损害的",
            },
            {
                "type": RecallLevel.LEVEL_3.value,
                "name": "三级召回",
                "description": "一般不会造成健康损害但需要召回的",
            },
        ]
    }
