from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.batch import BatchStatus
from app.services.batch_service import BatchService
from app.services.state_machine import batch_state_machine
from app.schemas import (
    BatchCreate,
    BatchResponse,
    StatusTransitionRequest,
    StatusTransitionResponse,
    ApiResponse,
)

router = APIRouter(prefix="/batches", tags=["批次管理"])


@router.post("/", response_model=BatchResponse)
async def create_batch(
    batch_data: BatchCreate,
    session: AsyncSession = Depends(get_session),
):
    service = BatchService(session)
    try:
        batch = await service.create_batch(
            product_name=batch_data.product_name,
            farm_name=batch_data.farm_name,
            farmer_uid=batch_data.farmer_uid,
            product_category=batch_data.product_category,
            farm_location=batch_data.farm_location,
            latitude=batch_data.latitude,
            longitude=batch_data.longitude,
            planting_date=batch_data.planting_date,
            estimated_quantity=batch_data.estimated_quantity,
            unit=batch_data.unit,
            extra_data=batch_data.metadata,
        )
        await session.commit()
        return batch
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{batch_uid}", response_model=BatchResponse)
async def get_batch(
    batch_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = BatchService(session)
    batch = await service.get_batch_by_uid(batch_uid)
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    return batch


@router.get("/code/{batch_code}", response_model=BatchResponse)
async def get_batch_by_code(
    batch_code: str,
    session: AsyncSession = Depends(get_session),
):
    service = BatchService(session)
    batch = await service.get_batch_by_code(batch_code)
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    return batch


@router.get("/farmer/{farmer_uid}", response_model=List[BatchResponse])
async def get_batches_by_farmer(
    farmer_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = BatchService(session)
    batches = await service.get_batches_by_farmer(farmer_uid)
    return batches


@router.get("/", response_model=List[BatchResponse])
async def search_batches(
    keyword: Optional[str] = Query(None),
    status: Optional[BatchStatus] = Query(None),
    farmer_uid: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    service = BatchService(session)
    batches = await service.search_batches(
        keyword=keyword,
        status=status,
        farmer_uid=farmer_uid,
        limit=limit,
        offset=offset,
    )
    return batches


@router.post("/{batch_uid}/transition", response_model=StatusTransitionResponse)
async def transition_batch_status(
    batch_uid: str,
    transition_data: StatusTransitionRequest,
    session: AsyncSession = Depends(get_session),
):
    service = BatchService(session)
    batch = await service.get_batch_by_uid(batch_uid)
    
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    
    result = batch_state_machine.transition(
        current_state=batch.status,
        event=transition_data.event,
        context=transition_data.context,
    )
    
    if result.success and result.to_state:
        batch.status = result.to_state
        await session.commit()
    
    return StatusTransitionResponse(
        success=result.success,
        from_state=result.from_state.value,
        to_state=result.to_state.value if result.to_state else None,
        message=result.message,
        event=result.event,
        error_code=result.error_code,
    )


@router.get("/{batch_uid}/available-events")
async def get_available_events(
    batch_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = BatchService(session)
    events = await service.get_available_events(batch_uid)
    
    event_descriptions = []
    for event in events:
        batch = await service.get_batch_by_uid(batch_uid)
        if batch:
            description = batch_state_machine.get_transition_description(event, batch.status)
            event_descriptions.append({
                "event": event,
                "description": description or event,
            })
    
    return {
        "batch_uid": batch_uid,
        "available_events": event_descriptions,
    }


@router.put("/{batch_uid}/quantity")
async def update_batch_quantity(
    batch_uid: str,
    actual_quantity: float,
    session: AsyncSession = Depends(get_session),
):
    service = BatchService(session)
    success = await service.update_batch_quantity(batch_uid, actual_quantity)
    
    if not success:
        raise HTTPException(status_code=404, detail="批次不存在")
    
    await session.commit()
    return {
        "success": True,
        "message": "批次数量已更新",
        "actual_quantity": actual_quantity,
    }


@router.post("/{batch_uid}/enable-tags")
async def enable_tags(
    batch_uid: str,
    tags_count: int,
    session: AsyncSession = Depends(get_session),
):
    service = BatchService(session)
    success = await service.enable_tags(batch_uid, tags_count)
    
    if not success:
        raise HTTPException(status_code=404, detail="批次不存在")
    
    await session.commit()
    return {
        "success": True,
        "message": f"已激活 {tags_count} 个溯源标签",
        "tags_count": tags_count,
    }
