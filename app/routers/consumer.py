from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.services.consumer_service import ConsumerService
from app.schemas import (
    TraceabilityResponse,
    ApiResponse,
)

router = APIRouter(prefix="/consumer", tags=["消费查询"])


@router.get("/traceability/{batch_uid}", response_model=TraceabilityResponse)
async def get_batch_traceability(
    batch_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = ConsumerService(session)
    traceability = await service.get_batch_traceability(batch_uid)
    
    if not traceability:
        raise HTTPException(status_code=404, detail="批次不存在")
    
    if "error" in traceability:
        raise HTTPException(status_code=403, detail=traceability["error"])
    
    return traceability


@router.get("/scan/{tag_code}")
async def get_traceability_by_tag(
    tag_code: str,
    session: AsyncSession = Depends(get_session),
):
    service = ConsumerService(session)
    traceability = await service.get_batch_by_tag_code(tag_code)
    
    if not traceability:
        raise HTTPException(status_code=404, detail="标签不存在或未激活")
    
    if "error" in traceability:
        raise HTTPException(status_code=403, detail=traceability["error"])
    
    return traceability


@router.get("/panoramic-map/{batch_uid}")
async def get_panoramic_map(
    batch_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = ConsumerService(session)
    traceability = await service.get_batch_traceability(batch_uid)
    
    if not traceability:
        raise HTTPException(status_code=404, detail="批次不存在")
    
    if "error" in traceability:
        raise HTTPException(status_code=403, detail=traceability["error"])
    
    panoramic_map = traceability.get("panoramic_map", {})
    
    return {
        "batch_uid": batch_uid,
        "panoramic_map": panoramic_map,
        "waypoints": panoramic_map.get("waypoints", []),
        "route_points": panoramic_map.get("route_points", []),
        "map_center": panoramic_map.get("map_center"),
        "origin": panoramic_map.get("origin"),
        "current": panoramic_map.get("current"),
        "total_waypoints": panoramic_map.get("total_waypoints", 0),
    }


@router.get("/check-recall-status/{batch_uid}")
async def check_recall_status(
    batch_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = ConsumerService(session)
    traceability = await service.get_batch_traceability(batch_uid)
    
    if not traceability:
        raise HTTPException(status_code=404, detail="批次不存在")
    
    recall_status = traceability.get("recall_status", "未知")
    batch_info = traceability.get("batch_info", {})
    
    return {
        "batch_uid": batch_uid,
        "batch_code": batch_info.get("batch_code"),
        "product_name": batch_info.get("product_name"),
        "farm_name": batch_info.get("farm_name"),
        "recall_status": recall_status,
        "status": batch_info.get("status"),
        "is_recalled": recall_status == "已召回",
        "is_blocked": recall_status == "已封禁",
        "is_safe": recall_status == "正常",
    }


@router.get("/quick-info/{batch_uid}")
async def get_quick_info(
    batch_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = ConsumerService(session)
    traceability = await service.get_batch_traceability(batch_uid)
    
    if not traceability:
        raise HTTPException(status_code=404, detail="批次不存在")
    
    if "error" in traceability:
        raise HTTPException(status_code=403, detail=traceability["error"])
    
    batch_info = traceability.get("batch_info", {})
    quality_info = traceability.get("quality_info", {})
    flow_info = traceability.get("flow_info", {})
    
    return {
        "batch": {
            "uid": batch_info.get("uid"),
            "code": batch_info.get("batch_code"),
            "product_name": batch_info.get("product_name"),
            "farm_name": batch_info.get("farm_name"),
            "farm_location": batch_info.get("farm_location"),
            "latitude": batch_info.get("latitude"),
            "longitude": batch_info.get("longitude"),
            "planting_date": batch_info.get("planting_date"),
            "harvest_date": batch_info.get("harvest_date"),
            "quantity": batch_info.get("actual_quantity") or batch_info.get("estimated_quantity"),
            "unit": batch_info.get("unit"),
        },
        "quality": {
            "overall_result": quality_info.get("latest_overall_result"),
            "status": quality_info.get("latest_status"),
            "passed_count": quality_info.get("passed_count"),
            "failed_count": quality_info.get("failed_count"),
            "failed_items": quality_info.get("all_failed_items", []),
            "standard_reference": quality_info.get("standard_reference"),
        },
        "flow": {
            "current_node": flow_info.get("current_node"),
            "current_node_name": flow_info.get("current_node_name"),
            "total_transfers": flow_info.get("total_transfers"),
            "total_warehouse_stops": flow_info.get("total_warehouse_stops"),
            "environment_stats": flow_info.get("environment_stats"),
        },
        "recall_status": traceability.get("recall_status"),
        "query_time": traceability.get("query_time"),
    }
