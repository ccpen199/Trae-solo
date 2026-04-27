from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.models.recall import RecallRecord, RecallStatus, RecallLevel
from app.models.batch import Batch, BatchStatus
from app.models.flow import FlowRecord, FlowNode

logger = structlog.get_logger()


class RecallService:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _generate_recall_code(self, level: RecallLevel) -> str:
        level_code = level.value.split("_")[-1]
        date_suffix = datetime.utcnow().strftime("%Y%m%d%H%M")
        random_suffix = uuid.uuid4().hex[:4].upper()
        return f"RC-L{level_code}-{date_suffix}-{random_suffix}"
    
    async def create_recall(
        self,
        title: str,
        description: str,
        reason: str,
        level: RecallLevel,
        initiator_uid: str,
        initiator_name: Optional[str] = None,
        reason_category: Optional[str] = None,
        affected_batch_uids: Optional[List[str]] = None,
        total_quantity: Optional[float] = None,
        unit: str = "kg",
        recall_deadline: Optional[datetime] = None,
        compensation_required: bool = False,
        compensation_amount: Optional[float] = None,
        extra_data: Optional[Dict[str, Any]] = None,
    ) -> RecallRecord:
        recall_code = self._generate_recall_code(level)
        
        recall = RecallRecord(
            uid=str(uuid.uuid4()),
            recall_code=recall_code,
            title=title,
            description=description,
            reason=reason,
            reason_category=reason_category,
            level=level,
            initiator_uid=initiator_uid,
            initiator_name=initiator_name,
            status=RecallStatus.DRAFT,
            total_quantity=total_quantity,
            unit=unit,
            recovered_quantity=0.0,
            disposed_quantity=0.0,
            recall_deadline=recall_deadline,
            compensation_required=compensation_required,
            compensation_amount=compensation_amount,
            affected_products_count=0,
            affected_stores_count=0,
            affected_consumers_count=0,
            extra_data=extra_data,
        )
        
        if affected_batch_uids:
            for batch_uid in affected_batch_uids:
                recall.add_affected_batch(batch_uid)
        
        self.session.add(recall)
        await self.session.flush()
        
        logger.info(
            "recall_created",
            recall_uid=recall.uid,
            recall_code=recall_code,
            level=level.value,
        )
        
        return recall
    
    async def get_recall_by_uid(self, recall_uid: str) -> Optional[RecallRecord]:
        result = await self.session.execute(
            select(RecallRecord).where(RecallRecord.uid == recall_uid)
        )
        return result.scalar_one_or_none()
    
    async def get_recall_by_code(self, recall_code: str) -> Optional[RecallRecord]:
        result = await self.session.execute(
            select(RecallRecord).where(RecallRecord.recall_code == recall_code)
        )
        return result.scalar_one_or_none()
    
    async def get_recalls_by_batch(self, batch_uid: str) -> List[RecallRecord]:
        result = await self.session.execute(
            select(RecallRecord)
            .order_by(RecallRecord.created_at.desc())
        )
        
        all_recalls = list(result.scalars().all())
        
        return [
            r for r in all_recalls
            if batch_uid in r.get_affected_batch_list()
        ]
    
    async def get_active_recalls(self) -> List[RecallRecord]:
        result = await self.session.execute(
            select(RecallRecord)
            .where(
                or_(
                    RecallRecord.status == RecallStatus.IN_PROGRESS,
                    RecallRecord.status == RecallStatus.PARTIALLY_COMPLETED,
                )
            )
            .order_by(RecallRecord.created_at.desc())
        )
        return list(result.scalars().all())
    
    async def locate_affected_batches(
        self,
        search_criteria: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        product_name = search_criteria.get("product_name")
        farm_name = search_criteria.get("farm_name")
        date_from = search_criteria.get("date_from")
        date_to = search_criteria.get("date_to")
        batch_codes = search_criteria.get("batch_codes", [])
        
        query = select(Batch)
        
        if product_name:
            query = query.where(Batch.product_name.ilike(f"%{product_name}%"))
        
        if farm_name:
            query = query.where(Batch.farm_name.ilike(f"%{farm_name}%"))
        
        if date_from:
            query = query.where(Batch.harvest_date >= date_from)
        
        if date_to:
            query = query.where(Batch.harvest_date <= date_to)
        
        if batch_codes:
            query = query.where(Batch.batch_code.in_(batch_codes))
        
        result = await self.session.execute(query)
        batches = list(result.scalars().all())
        
        affected_batches = []
        for batch in batches:
            flow_service = FlowService(self.session)
            flow_summary = await flow_service.get_flow_summary(batch.uid)
            current_node = flow_summary.get("current_node", FlowNode.FARM.value)
            
            affected_batches.append(
                {
                    "batch_uid": batch.uid,
                    "batch_code": batch.batch_code,
                    "product_name": batch.product_name,
                    "farm_name": batch.farm_name,
                    "harvest_date": batch.harvest_date,
                    "quantity": batch.actual_quantity or batch.estimated_quantity,
                    "unit": batch.unit,
                    "status": batch.status.value,
                    "current_node": current_node,
                    "current_node_name": flow_summary.get("current_node_name"),
                }
            )
        
        return affected_batches
    
    async def locate_affected_terminals(
        self,
        batch_uid: str,
    ) -> Dict[str, Any]:
        batch_service = BatchService(self.session)
        batch = await batch_service.get_batch_by_uid(batch_uid)
        
        if not batch:
            return {"error": "Batch not found"}
        
        flow_service = FlowService(self.session)
        flow_records = await flow_service.get_flow_history_by_batch(batch_uid)
        
        terminals = {
            "warehouses": [],
            "retail_stores": [],
            "consumers": [],
        }
        
        for record in flow_records:
            if record.to_node == FlowNode.WAREHOUSE_1 or record.to_node == FlowNode.WAREHOUSE_2:
                terminals["warehouses"].append(
                    {
                        "node": record.to_node.value,
                        "name": record.to_node_name,
                        "latitude": record.to_latitude,
                        "longitude": record.to_longitude,
                        "quantity": record.quantity,
                        "arrival_time": record.operation_time,
                        "operator": record.operator_name,
                    }
                )
            elif record.to_node == FlowNode.RETAIL_STORE:
                terminals["retail_stores"].append(
                    {
                        "name": record.to_node_name,
                        "latitude": record.to_latitude,
                        "longitude": record.to_longitude,
                        "quantity": record.quantity,
                        "arrival_time": record.operation_time,
                        "receiver_name": record.receiver_name,
                    }
                )
            elif record.to_node == FlowNode.CONSUMER:
                terminals["consumers"].append(
                    {
                        "quantity": record.quantity,
                        "sale_time": record.operation_time,
                        "receiver_name": record.receiver_name,
                        "scan_code": record.scan_code,
                    }
                )
        
        return {
            "batch_uid": batch_uid,
            "batch_code": batch.batch_code,
            "product_name": batch.product_name,
            "terminals": terminals,
            "total_warehouses": len(terminals["warehouses"]),
            "total_retail_stores": len(terminals["retail_stores"]),
            "total_consumers": len(terminals["consumers"]),
        }
    
    async def approve_recall(
        self,
        recall_uid: str,
        approval_uid: str,
        approval_name: Optional[str] = None,
    ) -> Optional[RecallRecord]:
        recall = await self.get_recall_by_uid(recall_uid)
        if not recall:
            return None
        
        if recall.status != RecallStatus.DRAFT:
            logger.warning(
                "invalid_status_for_approval",
                recall_uid=recall_uid,
                current_status=recall.status.value,
            )
            return None
        
        recall.status = RecallStatus.APPROVED
        recall.approval_uid = approval_uid
        recall.approval_name = approval_name
        recall.approval_time = datetime.utcnow()
        
        await self.session.flush()
        
        logger.info(
            "recall_approved",
            recall_uid=recall_uid,
            recall_code=recall.recall_code,
        )
        
        return recall
    
    async def start_recall(
        self,
        recall_uid: str,
    ) -> Optional[RecallRecord]:
        recall = await self.get_recall_by_uid(recall_uid)
        if not recall:
            return None
        
        if recall.status not in [RecallStatus.DRAFT, RecallStatus.APPROVED]:
            logger.warning(
                "invalid_status_for_start",
                recall_uid=recall_uid,
                current_status=recall.status.value,
            )
            return None
        
        recall.status = RecallStatus.IN_PROGRESS
        recall.recall_start_time = datetime.utcnow()
        
        affected_batches = recall.get_affected_batch_list()
        for batch_uid in affected_batches:
            batch_service = BatchService(self.session)
            await batch_service.transition_batch_status(batch_uid, "recall")
        
        await self.session.flush()
        
        logger.info(
            "recall_started",
            recall_uid=recall_uid,
            recall_code=recall.recall_code,
            affected_batches_count=len(affected_batches),
        )
        
        return recall
    
    async def update_recovery_progress(
        self,
        recall_uid: str,
        recovered_quantity: float,
        disposed_quantity: float = 0.0,
    ) -> Optional[RecallRecord]:
        recall = await self.get_recall_by_uid(recall_uid)
        if not recall:
            return None
        
        if recall.status != RecallStatus.IN_PROGRESS:
            logger.warning(
                "invalid_status_for_progress_update",
                recall_uid=recall_uid,
                current_status=recall.status.value,
            )
            return None
        
        recall.recovered_quantity = recovered_quantity
        recall.disposed_quantity = disposed_quantity
        
        if recall.total_quantity and recall.total_quantity > 0:
            progress = recall.get_progress_percentage()
            if progress >= 100:
                recall.status = RecallStatus.COMPLETED
                recall.recall_completed_time = datetime.utcnow()
            elif progress > 0:
                recall.status = RecallStatus.PARTIALLY_COMPLETED
        
        await self.session.flush()
        
        logger.info(
            "recall_progress_updated",
            recall_uid=recall_uid,
            recovered=recovered_quantity,
            disposed=disposed_quantity,
            progress=recall.get_progress_percentage(),
        )
        
        return recall
    
    async def get_recall_summary(
        self,
        recall_uid: str,
    ) -> Optional[Dict[str, Any]]:
        recall = await self.get_recall_by_uid(recall_uid)
        if not recall:
            return None
        
        affected_batches = recall.get_affected_batch_list()
        
        batch_details = []
        for batch_uid in affected_batches:
            terminals = await self.locate_affected_terminals(batch_uid)
            batch_details.append(terminals)
        
        return {
            "recall_uid": recall.uid,
            "recall_code": recall.recall_code,
            "title": recall.title,
            "description": recall.description,
            "reason": recall.reason,
            "level": recall.level.value,
            "status": recall.status.value,
            "progress_percentage": recall.get_progress_percentage(),
            "total_quantity": recall.total_quantity,
            "recovered_quantity": recall.recovered_quantity,
            "disposed_quantity": recall.disposed_quantity,
            "affected_batches_count": len(affected_batches),
            "affected_batches": batch_details,
            "compensation_required": recall.compensation_required,
            "compensation_amount": recall.compensation_amount,
            "recall_start_time": recall.recall_start_time,
            "recall_deadline": recall.recall_deadline,
            "recall_completed_time": recall.recall_completed_time,
        }


from app.services.batch_service import BatchService
from app.services.flow_service import FlowService
