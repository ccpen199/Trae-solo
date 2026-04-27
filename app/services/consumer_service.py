from typing import Optional, List, Dict, Any
from datetime import datetime
import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.batch import Batch, BatchStatus
from app.models.flow import FlowRecord, FlowNode
from app.models.quality import QualityInspection, QualityStatus
from app.models.farming import FarmingRecord

logger = structlog.get_logger()


class ConsumerService:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_batch_traceability(
        self,
        batch_uid: str,
    ) -> Optional[Dict[str, Any]]:
        batch_service = BatchService(self.session)
        batch = await batch_service.get_batch_by_uid(batch_uid)
        
        if not batch:
            return None
        
        if not batch.tags_enabled and batch.status not in [
            BatchStatus.QUALITY_PASSED,
            BatchStatus.IN_TRANSIT,
            BatchStatus.IN_WAREHOUSE,
            BatchStatus.ON_SALE,
            BatchStatus.SOLD,
            BatchStatus.RECALLED,
        ]:
            return {
                "error": "该批次尚未激活溯源标签查验权限",
                "batch_code": batch.batch_code,
                "status": batch.status.value,
            }
        
        farming_service = FarmingService(self.session)
        farming_summary = await farming_service.get_batch_farming_summary(batch_uid)
        
        quality_service = QualityService(self.session)
        quality_history = await quality_service.get_batch_quality_history(batch_uid)
        
        flow_service = FlowService(self.session)
        flow_summary = await flow_service.get_flow_summary(batch_uid)
        location_history = await flow_service.get_batch_location_history(batch_uid)
        
        latest_quality = quality_history.get("latest_status")
        quality_passed = quality_history.get("latest_overall_result")
        
        if batch.status == BatchStatus.RECALLED:
            recall_status = "已召回"
        elif batch.status == BatchStatus.BLOCKED:
            recall_status = "已封禁"
        elif not quality_passed:
            recall_status = "质检不通过"
        else:
            recall_status = "正常"
        
        return {
            "batch_info": {
                "uid": batch.uid,
                "code": batch.batch_code,
                "product_name": batch.product_name,
                "product_category": batch.product_category,
                "farm_name": batch.farm_name,
                "farm_location": batch.farm_location,
                "latitude": batch.latitude,
                "longitude": batch.longitude,
                "planting_date": batch.planting_date,
                "harvest_date": batch.harvest_date,
                "quantity": batch.actual_quantity or batch.estimated_quantity,
                "unit": batch.unit,
                "status": batch.status.value,
                "created_at": batch.created_at,
            },
            "farming_info": {
                "total_records": farming_summary.get("total_records", 0),
                "operation_counts": farming_summary.get("operation_counts", {}),
                "pesticide_applications": farming_summary.get("pesticide_applications", []),
                "fertilizer_applications": farming_summary.get("fertilizer_applications", []),
                "first_operation": farming_summary.get("first_operation"),
                "last_operation": farming_summary.get("last_operation"),
            },
            "quality_info": {
                "total_inspections": quality_history.get("total_inspections", 0),
                "passed_count": quality_history.get("passed_count", 0),
                "failed_count": quality_history.get("failed_count", 0),
                "latest_status": latest_quality,
                "latest_overall_result": quality_passed,
                "all_failed_items": quality_history.get("all_failed_items", []),
                "standard_reference": "GB 2763-2021",
            },
            "flow_info": {
                "total_records": flow_summary.get("total_records", 0),
                "current_node": flow_summary.get("current_node"),
                "current_node_name": flow_summary.get("current_node_name"),
                "total_transfers": flow_summary.get("total_transfers", 0),
                "total_warehouse_stops": flow_summary.get("total_warehouse_stops", 0),
                "path": flow_summary.get("path", []),
                "environment_stats": flow_summary.get("environment_stats", {}),
                "first_operation": flow_summary.get("first_operation"),
                "last_operation": flow_summary.get("last_operation"),
            },
            "location_history": location_history,
            "panoramic_map": self._build_panoramic_map(
                batch=batch,
                location_history=location_history,
                flow_summary=flow_summary,
            ),
            "recall_status": recall_status,
            "query_time": datetime.utcnow(),
        }
    
    def _build_panoramic_map(
        self,
        batch: Batch,
        location_history: List[Dict[str, Any]],
        flow_summary: Dict[str, Any],
    ) -> Dict[str, Any]:
        waypoints = []
        
        waypoints.append(
            {
                "order": 0,
                "type": "origin",
                "node": FlowNode.FARM.value,
                "node_name": batch.farm_name,
                "latitude": batch.latitude,
                "longitude": batch.longitude,
                "description": "产地",
                "arrival_time": batch.planting_date or batch.created_at,
            }
        )
        
        for i, location in enumerate(location_history):
            waypoints.append(
                {
                    "order": i + 1,
                    "type": "transit",
                    "node": location["node"],
                    "node_name": location["node_name"],
                    "latitude": location["latitude"],
                    "longitude": location["longitude"],
                    "description": f"{location['operation']}",
                    "arrival_time": location["time"],
                }
            )
        
        current_node = flow_summary.get("current_node")
        if current_node == FlowNode.CONSUMER.value:
            waypoints.append(
                {
                    "order": len(waypoints),
                    "type": "destination",
                    "node": FlowNode.CONSUMER.value,
                    "node_name": flow_summary.get("current_node_name", "消费者"),
                    "latitude": None,
                    "longitude": None,
                    "description": "已送达消费者",
                    "arrival_time": flow_summary.get("last_operation"),
                }
            )
        
        route_points = [
            {"latitude": wp["latitude"], "longitude": wp["longitude"]}
            for wp in waypoints
            if wp["latitude"] and wp["longitude"]
        ]
        
        return {
            "waypoints": waypoints,
            "route_points": route_points,
            "total_waypoints": len(waypoints),
            "origin": waypoints[0] if waypoints else None,
            "current": waypoints[-1] if waypoints else None,
            "map_center": self._calculate_map_center(route_points),
        }
    
    def _calculate_map_center(
        self,
        points: List[Dict[str, Any]],
    ) -> Optional[Dict[str, float]]:
        if not points:
            return None
        
        valid_points = [p for p in points if p["latitude"] and p["longitude"]]
        if not valid_points:
            return None
        
        avg_lat = sum(p["latitude"] for p in valid_points) / len(valid_points)
        avg_lng = sum(p["longitude"] for p in valid_points) / len(valid_points)
        
        return {"latitude": avg_lat, "longitude": avg_lng}
    
    async def get_batch_by_tag_code(
        self,
        tag_code: str,
    ) -> Optional[Dict[str, Any]]:
        flow_service = FlowService(self.session)
        flow_record = await flow_service.get_flow_record_by_scan_code(tag_code)
        
        if flow_record:
            return await self.get_batch_traceability(flow_record.batch_uid)
        
        return None


from app.services.batch_service import BatchService
from app.services.farming_service import FarmingService
from app.services.quality_service import QualityService
from app.services.flow_service import FlowService
