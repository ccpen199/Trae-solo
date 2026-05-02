from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.database import AuditLog, Notification, User
from datetime import datetime
import json


class AuditService:
    """审计服务 - 记录所有操作行为，确保全流程可追溯"""
    
    @classmethod
    def log(
        cls,
        db: Session,
        user_id: int,
        action: str,
        resource_type: str,
        resource_id: int,
        details: Dict[str, Any] = None,
        ip_address: str = None,
        user_agent: str = None,
        signature: str = None
    ) -> AuditLog:
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent,
            signature=signature,
            created_at=datetime.utcnow()
        )
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        return audit_log
    
    @classmethod
    def query(
        cls,
        db: Session,
        user_id: int = None,
        resource_type: str = None,
        resource_id: int = None,
        action: str = None,
        start_time: datetime = None,
        end_time: datetime = None,
        limit: int = 100,
        offset: int = 0
    ) -> tuple[List[AuditLog], int]:
        query = db.query(AuditLog)
        
        if user_id is not None:
            query = query.filter(AuditLog.user_id == user_id)
        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)
        if resource_id is not None:
            query = query.filter(AuditLog.resource_id == resource_id)
        if action:
            query = query.filter(AuditLog.action == action)
        if start_time:
            query = query.filter(AuditLog.created_at >= start_time)
        if end_time:
            query = query.filter(AuditLog.created_at <= end_time)
        
        total = query.count()
        logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
        
        return logs, total
    
    @classmethod
    def get_timeline(
        cls,
        db: Session,
        resource_type: str,
        resource_id: int,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        logs, _ = cls.query(
            db,
            resource_type=resource_type,
            resource_id=resource_id,
            limit=limit
        )
        
        timeline = []
        for log in logs:
            user = db.query(User).filter(User.id == log.user_id).first()
            timeline.append({
                "id": log.id,
                "action": log.action,
                "action_display": cls._get_action_display(log.action),
                "user_id": log.user_id,
                "username": user.username if user else None,
                "details": log.details,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            })
        
        return timeline
    
    @classmethod
    def _get_action_display(cls, action: str) -> str:
        action_map = {
            "create": "创建",
            "update": "更新",
            "delete": "删除",
            "publish": "发布",
            "unpublish": "取消发布",
            "archive": "归档",
            "submit": "提交",
            "approve": "审批通过",
            "reject": "驳回",
            "withdraw": "撤回",
            "export": "导出",
            "import": "导入",
            "login": "登录",
            "logout": "退出",
        }
        return action_map.get(action, action)


class NotificationService:
    """消息提醒服务 - 异步推送通知给用户"""
    
    @classmethod
    def create(
        cls,
        db: Session,
        user_id: int,
        title: str,
        content: str,
        notification_type: str = "info",
        resource_type: str = None,
        resource_id: int = None
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            title=title,
            content=content,
            notification_type=notification_type,
            resource_type=resource_type,
            resource_id=resource_id,
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification
    
    @classmethod
    def mark_read(
        cls,
        db: Session,
        notification_id: int,
        user_id: int
    ) -> Optional[Notification]:
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            db.commit()
            db.refresh(notification)
        
        return notification
    
    @classmethod
    def mark_all_read(
        cls,
        db: Session,
        user_id: int
    ) -> int:
        count = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({
            "is_read": True,
            "read_at": datetime.utcnow()
        }, synchronize_session=False)
        db.commit()
        return count
    
    @classmethod
    def get_unread_count(
        cls,
        db: Session,
        user_id: int
    ) -> int:
        return db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()
    
    @classmethod
    def get_user_notifications(
        cls,
        db: Session,
        user_id: int,
        is_read: bool = None,
        notification_type: str = None,
        limit: int = 50,
        offset: int = 0
    ) -> tuple[List[Notification], int]:
        query = db.query(Notification).filter(Notification.user_id == user_id)
        
        if is_read is not None:
            query = query.filter(Notification.is_read == is_read)
        if notification_type:
            query = query.filter(Notification.notification_type == notification_type)
        
        total = query.count()
        notifications = query.order_by(
            Notification.created_at.desc()
        ).offset(offset).limit(limit).all()
        
        return notifications, total
    
    @classmethod
    def broadcast_to_role(
        cls,
        db: Session,
        role: str,
        title: str,
        content: str,
        notification_type: str = "info"
    ) -> int:
        users = db.query(User).filter(User.role == role).all()
        count = 0
        for user in users:
            cls.create(db, user.id, title, content, notification_type)
            count += 1
        return count


class ReportService:
    """报表服务 - 生成填报分析报表"""
    
    @classmethod
    def generate_submission_report(
        cls,
        submissions: List[Dict[str, Any]],
        form_schema: Dict[str, Any]
    ) -> Dict[str, Any]:
        if not submissions:
            return {
                "total": 0,
                "by_status": {},
                "by_field": {},
                "timeline": [],
            }
        
        total = len(submissions)
        
        status_counts = {}
        for sub in submissions:
            status = sub.get("_status", "unknown")
            status_counts[status] = status_counts.get(status, 0) + 1
        
        field_analysis = {}
        properties = form_schema.get("properties", {})
        
        for field_name, field_schema in properties.items():
            field_type = field_schema.get("type", "string")
            
            values = []
            for sub in submissions:
                val = sub.get(field_name)
                if val is not None and val != "":
                    values.append(val)
            
            if not values:
                continue
            
            analysis = {
                "field_name": field_name,
                "total_count": len(values),
                "non_null_count": len([v for v in values if v is not None]),
            }
            
            if field_type in ["number", "integer"]:
                try:
                    num_values = [float(v) for v in values]
                    analysis.update({
                        "min": min(num_values) if num_values else None,
                        "max": max(num_values) if num_values else None,
                        "avg": sum(num_values) / len(num_values) if num_values else None,
                    })
                except:
                    pass
            
            if "enum" in field_schema or field_type == "string":
                value_counts = {}
                for v in values:
                    str_v = str(v)
                    value_counts[str_v] = value_counts.get(str_v, 0) + 1
                
                analysis["top_values"] = sorted(
                    value_counts.items(),
                    key=lambda x: x[1],
                    reverse=True
                )[:10]
            
            field_analysis[field_name] = analysis
        
        timeline = cls._build_timeline(submissions)
        
        return {
            "total": total,
            "by_status": status_counts,
            "by_field": field_analysis,
            "timeline": timeline,
        }
    
    @classmethod
    def _build_timeline(
        cls,
        submissions: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        from collections import defaultdict
        
        date_counts = defaultdict(int)
        for sub in submissions:
            created = sub.get("_created_at")
            if created:
                if hasattr(created, 'date'):
                    date_str = created.date().isoformat()
                else:
                    date_str = str(created)[:10]
                date_counts[date_str] += 1
        
        timeline = []
        for date_str, count in sorted(date_counts.items()):
            timeline.append({
                "date": date_str,
                "count": count
            })
        
        return timeline
    
    @classmethod
    def export_to_excel(
        cls,
        data: List[Dict[str, Any]],
        columns: List[Dict[str, Any]],
        file_path: str
    ) -> bool:
        try:
            import pandas as pd
            from openpyxl import Workbook
            from openpyxl.utils.dataframe import dataframe_to_rows
            
            if not data:
                return False
            
            df = pd.DataFrame(data)
            
            column_map = {c.get("key"): c.get("title", c.get("key")) for c in columns}
            df = df.rename(columns=column_map)
            
            wb = Workbook()
            ws = wb.active
            
            for r in dataframe_to_rows(df, index=False, header=True):
                ws.append(r)
            
            wb.save(file_path)
            return True
        except Exception as e:
            print(f"导出Excel失败: {e}")
            return False


audit_service = AuditService()
notification_service = NotificationService()
report_service = ReportService()
