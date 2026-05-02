from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import json
from models import IdempotentRecord, AuditLog, User
import uuid
from typing import Any, Optional, Callable

class IdempotentEngine:
    
    @staticmethod
    def generate_idempotent_key(business_type: str, resource_no: str) -> str:
        return f"{business_type}:{resource_no}:{datetime.utcnow().strftime('%Y%m%d')}"
    
    @staticmethod
    def check_and_record(
        db: Session,
        idempotent_key: str,
        business_type: str,
        resource_no: str,
        request_data: dict,
        processor: Callable,
        operator: Optional[User] = None
    ) -> tuple[Any, bool]:
        
        existing = db.query(IdempotentRecord).filter(
            IdempotentRecord.idempotent_key == idempotent_key
        ).first()
        
        if existing:
            if existing.processed:
                response_data = json.loads(existing.response_data) if existing.response_data else {}
                return response_data, True
            else:
                return {"status": "processing", "message": "Request is being processed"}, False
        
        try:
            record = IdempotentRecord(
                idempotent_key=idempotent_key,
                business_type=business_type,
                resource_no=resource_no,
                request_data=json.dumps(request_data, ensure_ascii=False),
                processed=False,
                created_at=datetime.utcnow()
            )
            db.add(record)
            db.commit()
            db.refresh(record)
        except IntegrityError:
            db.rollback()
            existing = db.query(IdempotentRecord).filter(
                IdempotentRecord.idempotent_key == idempotent_key
            ).first()
            if existing and existing.processed:
                response_data = json.loads(existing.response_data) if existing.response_data else {}
                return response_data, True
            return {"status": "processing", "message": "Request is being processed"}, False
        
        try:
            result = processor()
            
            record.processed = True
            record.processed_at = datetime.utcnow()
            record.response_data = json.dumps(result, ensure_ascii=False)
            
            db.commit()
            
            return result, False
        except Exception as e:
            record.response_data = json.dumps({"error": str(e)}, ensure_ascii=False)
            db.commit()
            raise
    
    @staticmethod
    def get_audit_trail(db: Session, business_type: str, resource_no: str) -> list:
        
        records = db.query(IdempotentRecord).filter(
            IdempotentRecord.business_type == business_type,
            IdempotentRecord.resource_no == resource_no
        ).order_by(IdempotentRecord.created_at.desc()).all()
        
        trail = []
        for record in records:
            trail.append({
                "idempotent_key": record.idempotent_key,
                "business_type": record.business_type,
                "resource_no": record.resource_no,
                "request_data": json.loads(record.request_data) if record.request_data else {},
                "response_data": json.loads(record.response_data) if record.response_data else {},
                "processed": record.processed,
                "created_at": record.created_at.isoformat() if record.created_at else None,
                "processed_at": record.processed_at.isoformat() if record.processed_at else None
            })
        
        return trail
