from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import hashlib
import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.flow import FlowRecord, FlowNode, FlowOperation
from app.models.batch import Batch, BatchStatus
from app.services.state_machine import batch_state_machine

logger = structlog.get_logger()


class FlowService:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _generate_digital_timestamp(
        self,
        batch_uid: str,
        operation_time: datetime,
        operator_uid: str,
        scan_code: Optional[str],
    ) -> str:
        timestamp_str = (
            f"{batch_uid}|{operation_time.isoformat()}|{operator_uid}|"
            f"{scan_code}|{uuid.uuid4()}"
        )
        return hashlib.sha256(timestamp_str.encode()).hexdigest()
    
    async def get_latest_flow_record(self, batch_uid: str) -> Optional[FlowRecord]:
        result = await self.session.execute(
            select(FlowRecord)
            .where(FlowRecord.batch_uid == batch_uid)
            .order_by(FlowRecord.operation_time.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()
    
    async def get_current_node(self, batch_uid: str) -> FlowNode:
        latest_record = await self.get_latest_flow_record(batch_uid)
        if latest_record:
            return latest_record.to_node
        return FlowNode.FARM
    
    async def create_flow_record(
        self,
        batch_uid: str,
        operation_type: FlowOperation,
        to_node: FlowNode,
        to_node_name: str,
        operator_uid: str,
        operator_name: Optional[str] = None,
        from_node: Optional[FlowNode] = None,
        from_node_name: Optional[str] = None,
        from_latitude: Optional[float] = None,
        from_longitude: Optional[float] = None,
        to_latitude: Optional[float] = None,
        to_longitude: Optional[float] = None,
        operation_time: Optional[datetime] = None,
        quantity: float = 0.0,
        unit: str = "kg",
        temperature: Optional[float] = None,
        humidity: Optional[float] = None,
        environment_notes: Optional[str] = None,
        transport_mode: Optional[str] = None,
        vehicle_number: Optional[str] = None,
        driver_name: Optional[str] = None,
        package_condition: Optional[str] = None,
        seal_intact: Optional[bool] = None,
        receiver_name: Optional[str] = None,
        receiver_signature: Optional[str] = None,
        photo_urls: Optional[Dict[str, Any]] = None,
        scan_code: Optional[str] = None,
        notes: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None,
    ) -> FlowRecord:
        actual_time = operation_time or datetime.utcnow()
        
        if from_node is None:
            current_node = await self.get_current_node(batch_uid)
            from_node = current_node
        
        batch_number = await self._get_next_batch_number(batch_uid)
        
        digital_timestamp = self._generate_digital_timestamp(
            batch_uid=batch_uid,
            operation_time=actual_time,
            operator_uid=operator_uid,
            scan_code=scan_code,
        )
        
        record = FlowRecord(
            uid=str(uuid.uuid4()),
            batch_uid=batch_uid,
            operation_type=operation_type,
            from_node=from_node,
            to_node=to_node,
            from_node_name=from_node_name,
            to_node_name=to_node_name,
            from_latitude=from_latitude,
            from_longitude=from_longitude,
            to_latitude=to_latitude,
            to_longitude=to_longitude,
            operator_uid=operator_uid,
            operator_name=operator_name,
            operation_time=actual_time,
            quantity=quantity,
            unit=unit,
            temperature=temperature,
            humidity=humidity,
            environment_notes=environment_notes,
            transport_mode=transport_mode,
            vehicle_number=vehicle_number,
            driver_name=driver_name,
            package_condition=package_condition,
            seal_intact=seal_intact,
            receiver_name=receiver_name,
            receiver_signature=receiver_signature,
            photo_urls=photo_urls,
            digital_timestamp=digital_timestamp,
            scan_code=scan_code,
            batch_number=batch_number,
            notes=notes,
            extra_data=extra_data,
        )
        
        self.session.add(record)
        await self.session.flush()
        
        await self._handle_batch_status_transition(batch_uid, operation_type, to_node)
        
        logger.info(
            "flow_record_created",
            record_uid=record.uid,
            batch_uid=batch_uid,
            operation_type=operation_type.value,
            from_node=from_node.value if from_node else None,
            to_node=to_node.value,
        )
        
        return record
    
    async def _get_next_batch_number(self, batch_uid: str) -> int:
        result = await self.session.execute(
            select(FlowRecord)
            .where(FlowRecord.batch_uid == batch_uid)
            .order_by(FlowRecord.batch_number.desc())
            .limit(1)
        )
        latest = result.scalar_one_or_none()
        return (latest.batch_number + 1) if latest else 1
    
    async def _handle_batch_status_transition(
        self,
        batch_uid: str,
        operation_type: FlowOperation,
        to_node: FlowNode,
    ) -> None:
        batch_service = BatchService(self.session)
        
        if operation_type == FlowOperation.STORAGE and to_node == FlowNode.WAREHOUSE_1:
            await batch_service.transition_batch_status(batch_uid, "store_warehouse")
        
        elif operation_type == FlowOperation.SHIP:
            await batch_service.transition_batch_status(batch_uid, "ship")
        
        elif operation_type == FlowOperation.RECEIVE and to_node in [FlowNode.WAREHOUSE_1, FlowNode.WAREHOUSE_2]:
            await batch_service.transition_batch_status(batch_uid, "receive_warehouse")
        
        elif operation_type == FlowOperation.SALE and to_node == FlowNode.CONSUMER:
            await batch_service.transition_batch_status(batch_uid, "sold")
    
    async def get_flow_record_by_uid(self, record_uid: str) -> Optional[FlowRecord]:
        result = await self.session.execute(
            select(FlowRecord).where(FlowRecord.uid == record_uid)
        )
        return result.scalar_one_or_none()
    
    async def get_flow_record_by_scan_code(self, scan_code: str) -> Optional[FlowRecord]:
        result = await self.session.execute(
            select(FlowRecord).where(FlowRecord.scan_code == scan_code)
        )
        return result.scalar_one_or_none()
    
    async def get_flow_history_by_batch(
        self,
        batch_uid: str,
        limit: int = 100,
        offset: int = 0,
    ) -> List[FlowRecord]:
        result = await self.session.execute(
            select(FlowRecord)
            .where(FlowRecord.batch_uid == batch_uid)
            .order_by(FlowRecord.operation_time.asc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())
    
    async def get_flow_summary(self, batch_uid: str) -> Dict[str, Any]:
        records = await self.get_flow_history_by_batch(batch_uid)
        
        if not records:
            return {
                "batch_uid": batch_uid,
                "total_records": 0,
                "current_node": FlowNode.FARM.value,
                "path": [],
            }
        
        path = []
        total_transfers = 0
        total_warehouse_stops = 0
        
        for record in records:
            path.append(
                {
                    "from": {
                        "node": record.from_node.value if record.from_node else None,
                        "name": record.from_node_name,
                        "latitude": record.from_latitude,
                        "longitude": record.from_longitude,
                    },
                    "to": {
                        "node": record.to_node.value,
                        "name": record.to_node_name,
                        "latitude": record.to_latitude,
                        "longitude": record.to_longitude,
                    },
                    "operation": record.operation_type.value,
                    "time": record.operation_time,
                    "quantity": record.quantity,
                    "unit": record.unit,
                    "temperature": record.temperature,
                    "humidity": record.humidity,
                }
            )
            
            if record.operation_type in [FlowOperation.TRANSFER, FlowOperation.SHIP]:
                total_transfers += 1
            
            if record.to_node in [FlowNode.WAREHOUSE_1, FlowNode.WAREHOUSE_2]:
                total_warehouse_stops += 1
        
        latest_record = records[-1]
        current_node = latest_record.to_node
        
        environment_stats = {
            "min_temperature": min(r.temperature for r in records if r.temperature is not None) if any(r.temperature for r in records) else None,
            "max_temperature": max(r.temperature for r in records if r.temperature is not None) if any(r.temperature for r in records) else None,
            "min_humidity": min(r.humidity for r in records if r.humidity is not None) if any(r.humidity for r in records) else None,
            "max_humidity": max(r.humidity for r in records if r.humidity is not None) if any(r.humidity for r in records) else None,
        }
        
        return {
            "batch_uid": batch_uid,
            "total_records": len(records),
            "current_node": current_node.value,
            "current_node_name": latest_record.to_node_name,
            "total_transfers": total_transfers,
            "total_warehouse_stops": total_warehouse_stops,
            "path": path,
            "environment_stats": environment_stats,
            "first_operation": records[0].operation_time,
            "last_operation": records[-1].operation_time,
        }
    
    async def get_batch_location_history(
        self,
        batch_uid: str,
    ) -> List[Dict[str, Any]]:
        records = await self.get_flow_history_by_batch(batch_uid)
        
        locations = []
        for record in records:
            if record.to_latitude and record.to_longitude:
                locations.append(
                    {
                        "node": record.to_node.value,
                        "node_name": record.to_node_name,
                        "latitude": record.to_latitude,
                        "longitude": record.to_longitude,
                        "time": record.operation_time,
                        "operation": record.operation_type.value,
                    }
                )
        
        return locations
    
    async def verify_digital_timestamp(self, record_uid: str) -> bool:
        record = await self.get_flow_record_by_uid(record_uid)
        if not record:
            return False
        
        expected_timestamp = self._generate_digital_timestamp(
            batch_uid=record.batch_uid,
            operation_time=record.operation_time,
            operator_uid=record.operator_uid,
            scan_code=record.scan_code,
        )
        
        return record.digital_timestamp == expected_timestamp
    
    async def get_batches_at_node(
        self,
        node: FlowNode,
    ) -> List[Dict[str, Any]]:
        subquery = (
            select(
                FlowRecord.batch_uid,
                FlowRecord.to_node,
                FlowRecord.to_node_name,
                FlowRecord.operation_time,
                FlowRecord.quantity,
                FlowRecord.unit,
            )
            .order_by(FlowRecord.batch_uid, FlowRecord.operation_time.desc())
            .subquery()
        )
        
        from sqlalchemy import func
        
        result = await self.session.execute(
            select(subquery)
            .where(subquery.c.to_node == node)
            .distinct(subquery.c.batch_uid)
        )
        
        return [
            {
                "batch_uid": row.batch_uid,
                "node": row.to_node.value,
                "node_name": row.to_node_name,
                "arrival_time": row.operation_time,
                "quantity": row.quantity,
                "unit": row.unit,
            }
            for row in result.all()
        ]


from app.services.batch_service import BatchService
