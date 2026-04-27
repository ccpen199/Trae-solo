from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.flow import FlowNode, FlowOperation
from app.services.flow_service import FlowService
from app.schemas import (
    FlowRecordCreate,
    FlowRecordResponse,
    ApiResponse,
)

router = APIRouter(prefix="/flow", tags=["流通追踪"])


@router.post("/records", response_model=FlowRecordResponse)
async def create_flow_record(
    record_data: FlowRecordCreate,
    session: AsyncSession = Depends(get_session),
):
    service = FlowService(session)
    try:
        record = await service.create_flow_record(
            batch_uid=record_data.batch_uid,
            operation_type=record_data.operation_type,
            to_node=record_data.to_node,
            to_node_name=record_data.to_node_name,
            operator_uid=record_data.operator_uid,
            operator_name=record_data.operator_name,
            from_node=record_data.from_node,
            from_node_name=record_data.from_node_name,
            from_latitude=record_data.from_latitude,
            from_longitude=record_data.from_longitude,
            to_latitude=record_data.to_latitude,
            to_longitude=record_data.to_longitude,
            operation_time=record_data.operation_time,
            quantity=record_data.quantity,
            unit=record_data.unit,
            temperature=record_data.temperature,
            humidity=record_data.humidity,
            environment_notes=record_data.environment_notes,
            transport_mode=record_data.transport_mode,
            vehicle_number=record_data.vehicle_number,
            driver_name=record_data.driver_name,
            package_condition=record_data.package_condition,
            seal_intact=record_data.seal_intact,
            receiver_name=record_data.receiver_name,
            receiver_signature=record_data.receiver_signature,
            photo_urls=record_data.photo_urls,
            scan_code=record_data.scan_code,
            notes=record_data.notes,
            extra_data=record_data.metadata,
        )
        await session.commit()
        return record
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/records/{record_uid}", response_model=FlowRecordResponse)
async def get_flow_record(
    record_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = FlowService(session)
    record = await service.get_flow_record_by_uid(record_uid)
    if not record:
        raise HTTPException(status_code=404, detail="流通记录不存在")
    return record


@router.get("/scan/{scan_code}")
async def get_flow_record_by_scan_code(
    scan_code: str,
    session: AsyncSession = Depends(get_session),
):
    service = FlowService(session)
    record = await service.get_flow_record_by_scan_code(scan_code)
    
    if not record:
        raise HTTPException(status_code=404, detail="扫码记录不存在")
    
    return {
        "scan_code": scan_code,
        "batch_uid": record.batch_uid,
        "operation_type": record.operation_type.value,
        "to_node": record.to_node.value,
        "to_node_name": record.to_node_name,
        "operator_name": record.operator_name,
        "operation_time": record.operation_time,
        "quantity": record.quantity,
        "unit": record.unit,
        "temperature": record.temperature,
        "humidity": record.humidity,
    }


@router.get("/batch/{batch_uid}", response_model=List[FlowRecordResponse])
async def get_flow_history_by_batch(
    batch_uid: str,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    service = FlowService(session)
    records = await service.get_flow_history_by_batch(
        batch_uid=batch_uid,
        limit=limit,
        offset=offset,
    )
    return records


@router.get("/batch/{batch_uid}/summary")
async def get_flow_summary(
    batch_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = FlowService(session)
    summary = await service.get_flow_summary(batch_uid)
    return summary


@router.get("/batch/{batch_uid}/locations")
async def get_batch_location_history(
    batch_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = FlowService(session)
    locations = await service.get_batch_location_history(batch_uid)
    return {
        "batch_uid": batch_uid,
        "locations": locations,
    }


@router.get("/current-node/{batch_uid}")
async def get_current_node(
    batch_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = FlowService(session)
    current_node = await service.get_current_node(batch_uid)
    latest_record = await service.get_latest_flow_record(batch_uid)
    
    return {
        "batch_uid": batch_uid,
        "current_node": current_node.value,
        "current_node_name": latest_record.to_node_name if latest_record else None,
        "latest_operation": latest_record.operation_type.value if latest_record else None,
        "latest_time": latest_record.operation_time if latest_record else None,
    }


@router.get("/records/{record_uid}/verify-timestamp")
async def verify_flow_timestamp(
    record_uid: str,
    session: AsyncSession = Depends(get_session),
):
    service = FlowService(session)
    is_valid = await service.verify_digital_timestamp(record_uid)
    
    return {
        "record_uid": record_uid,
        "timestamp_valid": is_valid,
        "message": "数字时间戳验证通过" if is_valid else "数字时间戳验证失败",
    }


@router.get("/node/{node}/batches")
async def get_batches_at_node(
    node: FlowNode,
    session: AsyncSession = Depends(get_session),
):
    service = FlowService(session)
    batches = await service.get_batches_at_node(node)
    
    return {
        "node": node.value,
        "batches": batches,
        "total_batches": len(batches),
    }


@router.get("/nodes")
async def get_flow_nodes():
    return {
        "nodes": [
            {
                "type": node.value,
                "name": {
                    FlowNode.FARM: "产地",
                    FlowNode.WAREHOUSE_1: "一级仓库",
                    FlowNode.WAREHOUSE_2: "二级仓库",
                    FlowNode.DISTRIBUTION_CENTER: "配送中心",
                    FlowNode.RETAIL_STORE: "零售门店",
                    FlowNode.CONSUMER: "消费者",
                }.get(node, node.value),
            }
            for node in FlowNode
        ]
    }


@router.get("/operations")
async def get_flow_operations():
    return {
        "operations": [
            {
                "type": op.value,
                "name": {
                    FlowOperation.RECEIVE: "接收",
                    FlowOperation.STORAGE: "存储",
                    FlowOperation.TRANSFER: "转移",
                    FlowOperation.SHIP: "发货",
                    FlowOperation.DELIVER: "配送",
                    FlowOperation.RETURN: "退货",
                    FlowOperation.SALE: "销售",
                }.get(op, op.value),
            }
            for op in FlowOperation
        ]
    }
