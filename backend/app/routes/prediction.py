from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timedelta
from typing import List, Optional

from app.database import get_db
from app.routes.auth import get_current_user, create_operation_log
from app.models import (
    User, Device, MeterData, EnergyPrediction, 
    EnergySuggestion, TodoTask
)
from app.schemas import (
    TrendAnalysisResponse, EnergySuggestionResponse
)
from app.engines import PowerLoadEngine

router = APIRouter(prefix="/api/prediction", tags=["预测引擎"])


@router.post("/analyze-trend/{device_id}", response_model=TrendAnalysisResponse)
def analyze_device_trend(
    device_id: int,
    hours: int = Query(24, ge=1, le=168, description="分析小时数"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.deleted_at == None
    ).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    
    prediction_engine = PowerLoadEngine(db)
    result = prediction_engine.analyze_trend(device_id, hours)
    
    if result.get("status") == "insufficient_data":
        raise HTTPException(
            status_code=400,
            detail=result.get("message", "数据不足")
        )
    
    for anomaly in result.get("anomalies", []):
        if anomaly.get("anomaly_reason"):
            existing_suggestion = db.query(EnergySuggestion).filter(
                EnergySuggestion.source_type == "Power-Load Prediction",
                EnergySuggestion.status.in_(["pending", "reviewed"])
            ).first()
            
            if not existing_suggestion:
                suggestion = prediction_engine.generate_energy_suggestion(
                    anomaly_data=anomaly,
                    device_id=device_id
                )
                
                if suggestion:
                    todo_task = TodoTask(
                        task_type="suggestion",
                        title=f"查看节能建议: {suggestion.title}",
                        description=suggestion.content[:500] + "..." if len(suggestion.content) > 500 else suggestion.content,
                        priority=suggestion.priority,
                        status="pending",
                        suggestion_id=suggestion.id,
                    )
                    db.add(todo_task)
                    db.commit()
    
    create_operation_log(
        db=db,
        user=current_user,
        module="预测引擎",
        action="趋势分析",
        target_id=device.id,
        target_name=device.device_name,
        detail=f"对设备 {device.device_name} 进行 {hours} 小时趋势分析"
    )
    
    return result


@router.get("/suggestions/", response_model=List[EnergySuggestionResponse])
def get_energy_suggestions(
    status: Optional[str] = Query(None, description="建议状态"),
    priority: Optional[str] = Query(None, description="建议优先级"),
    category: Optional[str] = Query(None, description="建议分类"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(EnergySuggestion).filter(EnergySuggestion.deleted_at == None)
    
    if status:
        query = query.filter(EnergySuggestion.status == status)
    
    if priority:
        query = query.filter(EnergySuggestion.priority == priority)
    
    if category:
        query = query.filter(EnergySuggestion.category == category)
    
    suggestions = query.order_by(desc(EnergySuggestion.created_at)).offset(skip).limit(limit).all()
    return suggestions


@router.get("/suggestions/{suggestion_id}", response_model=EnergySuggestionResponse)
def get_suggestion(
    suggestion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    suggestion = db.query(EnergySuggestion).filter(
        EnergySuggestion.id == suggestion_id,
        EnergySuggestion.deleted_at == None
    ).first()
    
    if not suggestion:
        raise HTTPException(status_code=404, detail="节能建议不存在")
    
    return suggestion


@router.put("/suggestions/{suggestion_id}/review")
def review_suggestion(
    suggestion_id: int,
    is_approved: bool = True,
    review_note: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    suggestion = db.query(EnergySuggestion).filter(
        EnergySuggestion.id == suggestion_id,
        EnergySuggestion.deleted_at == None
    ).first()
    
    if not suggestion:
        raise HTTPException(status_code=404, detail="节能建议不存在")
    
    if suggestion.status != "pending":
        raise HTTPException(status_code=400, detail="建议已被审核")
    
    suggestion.status = "reviewed" if is_approved else "rejected"
    suggestion.reviewed_by = current_user.id
    suggestion.reviewed_at = datetime.utcnow()
    suggestion.review_note = review_note
    
    db.commit()
    
    create_operation_log(
        db=db,
        user=current_user,
        module="预测引擎",
        action="审核节能建议",
        target_id=suggestion.id,
        target_name=suggestion.title,
        detail=f"审核节能建议: {suggestion.title}, 结果: {'通过' if is_approved else '拒绝'}"
    )
    
    return {
        "suggestion_id": suggestion.id,
        "status": suggestion.status,
        "reviewed_at": suggestion.reviewed_at.isoformat(),
        "reviewed_by": current_user.real_name
    }


@router.put("/suggestions/{suggestion_id}/implement")
def implement_suggestion(
    suggestion_id: int,
    implementation_result: str = None,
    actual_saving: float = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    suggestion = db.query(EnergySuggestion).filter(
        EnergySuggestion.id == suggestion_id,
        EnergySuggestion.deleted_at == None
    ).first()
    
    if not suggestion:
        raise HTTPException(status_code=404, detail="节能建议不存在")
    
    if suggestion.status != "reviewed":
        raise HTTPException(status_code=400, detail="建议需要先审核通过")
    
    suggestion.status = "implemented"
    suggestion.implemented_at = datetime.utcnow()
    suggestion.implementation_result = implementation_result
    suggestion.actual_saving = actual_saving
    
    db.commit()
    
    create_operation_log(
        db=db,
        user=current_user,
        module="预测引擎",
        action="执行节能建议",
        target_id=suggestion.id,
        target_name=suggestion.title,
        detail=f"执行节能建议: {suggestion.title}, 实际节能: {actual_saving} kWh"
    )
    
    return {
        "suggestion_id": suggestion.id,
        "status": suggestion.status,
        "implemented_at": suggestion.implemented_at.isoformat(),
        "actual_saving": actual_saving
    }


@router.get("/predictions/{device_id}")
def get_device_predictions(
    device_id: int,
    limit: int = Query(24, ge=1, le=168, description="预测数量"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = db.query(Device).filter(
        Device.id == device_id,
        Device.deleted_at == None
    ).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")
    
    predictions = db.query(EnergyPrediction).filter(
        EnergyPrediction.device_id == device_id,
        EnergyPrediction.deleted_at == None
    ).order_by(desc(EnergyPrediction.prediction_time)).limit(limit).all()
    
    return [{
        "id": p.id,
        "prediction_type": p.prediction_type,
        "prediction_time": p.prediction_time.isoformat(),
        "target_time": p.target_time.isoformat(),
        "predicted_value": p.predicted_value,
        "actual_value": p.actual_value,
        "confidence": p.confidence,
        "is_anomaly": p.is_anomaly,
        "anomaly_reason": p.anomaly_reason
    } for p in predictions]
