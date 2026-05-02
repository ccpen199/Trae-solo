from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import Depends, HTTPException, status, APIRouter, Request, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import (
    get_db, User, FormDefinition, FormField, FormLogic, FormSubmission, SubmissionHistory
)
from app.routers.auth import get_current_user
from app.services.modeling_engine import ModelingEngine
from app.services.state_machine import state_machine, rules_engine, FormStatus
from app.services.audit_service import audit_service, notification_service
from app.services.dsl_engine import dsl_engine

router = APIRouter(prefix="/api/forms", tags=["表单管理"])


class FieldConfig(BaseModel):
    field_name: str
    field_label: str
    field_type: str
    is_required: bool = False
    is_unique: bool = False
    default_value: Optional[str] = None
    validation_rules: Dict[str, Any] = {}
    options: List[Dict[str, Any]] = []
    sort_order: int = 0


class FormCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    fields: List[FieldConfig] = []


class FormUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    fields: Optional[List[FieldConfig]] = None


class FormLogicCreate(BaseModel):
    logic_type: str
    name: str
    dsl_code: str


class FormResponse(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str]
    status: str
    schema_json: Optional[Dict[str, Any]]
    table_name: Optional[str]
    creator_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    published_at: Optional[datetime]
    version: int
    
    class Config:
        from_attributes = True


class FormDetailResponse(FormResponse):
    fields: List[Dict[str, Any]]
    logics: List[Dict[str, Any]]


@router.post("", response_model=FormResponse)
def create_form(
    request: Request,
    form_data: FormCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(FormDefinition).filter(FormDefinition.code == form_data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"表单编码 {form_data.code} 已存在"
        )
    
    table_name = ModelingEngine.generate_table_name(form_data.code)
    
    fields_data = [f.model_dump() for f in form_data.fields]
    schema_json = ModelingEngine.generate_json_schema(form_data.name, fields_data)
    
    form = FormDefinition(
        name=form_data.name,
        code=form_data.code,
        description=form_data.description,
        status=FormStatus.DRAFT,
        schema_json=schema_json,
        table_name=table_name,
        creator_id=current_user.id,
        version=1
    )
    db.add(form)
    db.flush()
    
    for field in form_data.fields:
        field_config = ModelingEngine.DEFAULT_FIELD_TYPES.get(
            field.field_type, {"column_type": "TEXT"}
        )
        form_field = FormField(
            form_id=form.id,
            field_name=field.field_name,
            field_label=field.field_label,
            field_type=field.field_type,
            column_type=field_config.get("column_type", "TEXT"),
            is_required=field.is_required,
            is_unique=field.is_unique,
            default_value=field.default_value,
            validation_rules=field.validation_rules,
            options=field.options,
            sort_order=field.sort_order
        )
        db.add(form_field)
    
    db.commit()
    db.refresh(form)
    
    audit_service.log(
        db,
        user_id=current_user.id,
        action="create",
        resource_type="form",
        resource_id=form.id,
        details={"name": form.name, "code": form.code},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    return form


@router.get("", response_model=Dict[str, Any])
def list_forms(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(FormDefinition)
    
    if status:
        query = query.filter(FormDefinition.status == status)
    
    if current_user.role != "admin":
        query = query.filter(FormDefinition.creator_id == current_user.id)
    
    total = query.count()
    forms = query.order_by(
        FormDefinition.updated_at.desc()
    ).offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "data": [FormResponse.from_orm(f) for f in forms]
    }


@router.get("/{form_id}", response_model=FormDetailResponse)
def get_form(
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    form = db.query(FormDefinition).filter(FormDefinition.id == form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="表单不存在"
        )
    
    if current_user.role != "admin" and form.creator_id != current_user.id:
        if form.status != FormStatus.PUBLISHED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="无权限访问此表单"
            )
    
    fields = db.query(FormField).filter(FormField.form_id == form_id).order_by(FormField.sort_order).all()
    logics = db.query(FormLogic).filter(FormLogic.form_id == form_id).order_by(FormLogic.sort_order).all()
    
    return FormDetailResponse(
        id=form.id,
        name=form.name,
        code=form.code,
        description=form.description,
        status=form.status,
        schema_json=form.schema_json,
        table_name=form.table_name,
        creator_id=form.creator_id,
        created_at=form.created_at,
        updated_at=form.updated_at,
        published_at=form.published_at,
        version=form.version,
        fields=[{
            "id": f.id,
            "field_name": f.field_name,
            "field_label": f.field_label,
            "field_type": f.field_type,
            "column_type": f.column_type,
            "is_required": f.is_required,
            "is_unique": f.is_unique,
            "default_value": f.default_value,
            "validation_rules": f.validation_rules,
            "options": f.options,
            "sort_order": f.sort_order
        } for f in fields],
        logics=[{
            "id": l.id,
            "logic_type": l.logic_type,
            "name": l.name,
            "dsl_code": l.dsl_code,
            "ast_json": l.ast_json,
            "is_active": l.is_active
        } for l in logics]
    )


@router.put("/{form_id}", response_model=FormResponse)
def update_form(
    request: Request,
    form_id: int,
    form_data: FormUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    form = db.query(FormDefinition).filter(FormDefinition.id == form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="表单不存在"
        )
    
    if current_user.role != "admin" and form.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限修改此表单"
        )
    
    if form.status == FormStatus.PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="已发布的表单不能修改，请先取消发布"
        )
    
    if form_data.name:
        form.name = form_data.name
    if form_data.description is not None:
        form.description = form_data.description
    
    if form_data.fields is not None:
        old_fields = db.query(FormField).filter(FormField.form_id == form_id).all()
        for field in old_fields:
            db.delete(field)
        
        fields_data = [f.model_dump() for f in form_data.fields]
        schema_json = ModelingEngine.generate_json_schema(form.name, fields_data)
        form.schema_json = schema_json
        
        for field in form_data.fields:
            field_config = ModelingEngine.DEFAULT_FIELD_TYPES.get(
                field.field_type, {"column_type": "TEXT"}
            )
            form_field = FormField(
                form_id=form.id,
                field_name=field.field_name,
                field_label=field.field_label,
                field_type=field.field_type,
                column_type=field_config.get("column_type", "TEXT"),
                is_required=field.is_required,
                is_unique=field.is_unique,
                default_value=field.default_value,
                validation_rules=field.validation_rules,
                options=field.options,
                sort_order=field.sort_order
            )
            db.add(form_field)
    
    form.version += 1
    form.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(form)
    
    audit_service.log(
        db,
        user_id=current_user.id,
        action="update",
        resource_type="form",
        resource_id=form.id,
        details={"name": form.name, "version": form.version},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    return form


@router.post("/{form_id}/publish")
def publish_form(
    request: Request,
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    form = db.query(FormDefinition).filter(FormDefinition.id == form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="表单不存在"
        )
    
    if current_user.role != "admin" and form.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限发布此表单"
        )
    
    can_transition, new_status = state_machine.can_transition_form(form.status, "publish")
    if not can_transition:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无法从当前状态 {form.status} 进行发布操作"
        )
    
    fields = db.query(FormField).filter(FormField.form_id == form_id).all()
    fields_data = [{
        "field_name": f.field_name,
        "field_type": f.field_type,
        "is_required": f.is_required,
        "is_unique": f.is_unique,
        "validation_rules": f.validation_rules,
        "options": f.options
    } for f in fields]
    
    if not ModelingEngine.create_physical_table(form.table_name, fields_data):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="创建物理表失败"
        )
    
    form.status = new_status
    form.published_at = datetime.utcnow()
    db.commit()
    
    audit_service.log(
        db,
        user_id=current_user.id,
        action="publish",
        resource_type="form",
        resource_id=form.id,
        details={"name": form.name, "table_name": form.table_name},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    return {"message": "发布成功", "status": new_status}


@router.post("/{form_id}/unpublish")
def unpublish_form(
    request: Request,
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    form = db.query(FormDefinition).filter(FormDefinition.id == form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="表单不存在"
        )
    
    if current_user.role != "admin" and form.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限操作此表单"
        )
    
    can_transition, new_status = state_machine.can_transition_form(form.status, "unpublish")
    if not can_transition:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无法从当前状态 {form.status} 进行取消发布操作"
        )
    
    form.status = new_status
    db.commit()
    
    audit_service.log(
        db,
        user_id=current_user.id,
        action="unpublish",
        resource_type="form",
        resource_id=form.id,
        details={"name": form.name},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    return {"message": "取消发布成功", "status": new_status}


@router.post("/{form_id}/logics")
def add_form_logic(
    request: Request,
    form_id: int,
    logic_data: FormLogicCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    form = db.query(FormDefinition).filter(FormDefinition.id == form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="表单不存在"
        )
    
    if current_user.role != "admin" and form.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限操作此表单"
        )
    
    parsed_ast = dsl_engine.parse_dsl(logic_data.dsl_code)
    
    logic = FormLogic(
        form_id=form_id,
        logic_type=logic_data.logic_type,
        name=logic_data.name,
        dsl_code=logic_data.dsl_code,
        ast_json=parsed_ast,
        is_active=True
    )
    db.add(logic)
    db.commit()
    db.refresh(logic)
    
    audit_service.log(
        db,
        user_id=current_user.id,
        action="update",
        resource_type="form_logic",
        resource_id=logic.id,
        details={"form_id": form_id, "logic_name": logic.name},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    return {"id": logic.id, "name": logic.name, "ast_json": parsed_ast}


@router.delete("/{form_id}")
def delete_form(
    request: Request,
    form_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    form = db.query(FormDefinition).filter(FormDefinition.id == form_id).first()
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="表单不存在"
        )
    
    if current_user.role != "admin" and form.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限删除此表单"
        )
    
    if form.status == FormStatus.PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="已发布的表单不能删除，请先取消发布"
        )
    
    form_name = form.name
    db.delete(form)
    db.commit()
    
    audit_service.log(
        db,
        user_id=current_user.id,
        action="delete",
        resource_type="form",
        resource_id=form_id,
        details={"name": form_name},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    return {"message": "删除成功"}


@router.get("/published/{form_code}")
def get_published_form_by_code(
    form_code: str,
    db: Session = Depends(get_db)
):
    form = db.query(FormDefinition).filter(
        FormDefinition.code == form_code,
        FormDefinition.status == FormStatus.PUBLISHED
    ).first()
    
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="表单不存在或未发布"
        )
    
    fields = db.query(FormField).filter(FormField.form_id == form.id).order_by(FormField.sort_order).all()
    
    return {
        "id": form.id,
        "name": form.name,
        "code": form.code,
        "description": form.description,
        "schema": form.schema_json,
        "fields": [{
            "field_name": f.field_name,
            "field_label": f.field_label,
            "field_type": f.field_type,
            "is_required": f.is_required,
            "options": f.options,
            "default_value": f.default_value
        } for f in fields]
    }
