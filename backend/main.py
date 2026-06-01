from fastapi import FastAPI, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc, func
from datetime import datetime, timedelta
from typing import List, Optional
import io
import pandas as pd
import json
import re
import uuid
import os

from config import settings
from database import get_db, engine, Base
import models
import schemas
import auth

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI售后知识库更新Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
api_prefixes = ["token", "users", "documents", "qa", "tasks", "feedbacks", 
                "exceptions", "reports", "export", "audit-logs", "rules", 
                "docs", "openapi.json", "redoc"]

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/")
    async def read_root():
        return FileResponse(os.path.join(frontend_dist, "index.html"))
    
    @app.get("/vite.svg")
    async def vite_svg():
        return FileResponse(os.path.join(frontend_dist, "vite.svg"))
    
    @app.middleware("http")
    async def serve_spa(request, call_next):
        path = request.url.path.lstrip("/")
        if path == "" or path.startswith("assets/") or path == "vite.svg" or \
           any(path.startswith(prefix) for prefix in api_prefixes):
            return await call_next(request)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

def init_db_data(db: Session):
    if db.query(models.User).count() == 0:
        users = [
            {"username": "admin", "password": "admin123", "full_name": "系统管理员", "role": "business_owner", "email": "admin@example.com", "department": "技术部"},
            {"username": "operator", "password": "operator123", "full_name": "模型运营专员", "role": "model_operator", "email": "operator@example.com", "department": "运营部"},
            {"username": "reviewer", "password": "reviewer123", "full_name": "审核人员", "role": "reviewer", "email": "reviewer@example.com", "department": "质控部"},
            {"username": "frontline", "password": "frontline123", "full_name": "一线使用者", "role": "frontline_user", "email": "frontline@example.com", "department": "客服部"},
        ]
        for u in users:
            db_user = models.User(
                username=u["username"],
                email=u["email"],
                full_name=u["full_name"],
                role=u["role"],
                department=u["department"],
                hashed_password=auth.get_password_hash(u["password"])
            )
            db.add(db_user)
        db.commit()
    
    if db.query(models.RuleConfig).count() == 0:
        rule = models.RuleConfig(
            rule_type="task_flow",
            version="1.0",
            content={
                "status_flow": {
                    "pending": ["processing", "rejected"],
                    "processing": ["reviewing", "pending"],
                    "reviewing": ["approved", "rejected", "processing"],
                    "approved": ["completed"],
                    "rejected": ["pending"],
                    "completed": []
                },
                "required_fields": {
                    "qa": ["question", "citations"],
                    "document": ["title", "content", "permission_scope"]
                },
                "role_restrictions": {
                    "approve": ["business_owner", "reviewer"],
                    "reject": ["business_owner", "reviewer"]
                }
            },
            description="任务流程配置规则",
            is_active=True
        )
        db.add(rule)
        db.commit()
    
    if db.query(models.Document).count() == 0:
        sample_docs = [
            {
                "title": "产品退换货政策说明",
                "content": """1. 退换货申请条件：
    - 产品自签收之日起7天内可申请无理由退货
    - 产品自签收之日起15天内可申请换货
    - 产品需保持原包装完好，附件齐全
    - 非人为损坏的质量问题
    
2. 退货流程：
    - 用户在订单详情页点击"申请退货"
    - 填写退货原因，上传产品照片
    - 客服审核通过后，用户寄送产品
    - 仓库确认收货后，3-5个工作日内退款
    
3. 特殊说明：
    - 定制类产品不支持无理由退换
    - 已激活的数码产品如有质量问题，按三包政策处理""",
                "category": "售后政策",
                "permission_scope": "public",
                "status": "approved"
            },
            {
                "title": "常见故障排查指南",
                "content": """一、无法开机问题
1. 检查电源适配器是否连接正常
2. 尝试更换电源插座
3. 长按电源键10秒强制重启
4. 如仍无法解决，请联系客服

二、屏幕显示异常
1. 检查显示连接线是否松动
2. 调整屏幕分辨率设置
3. 更新显卡驱动程序
4. 外接显示器测试判断是否屏幕故障

三、网络连接问题
1. 重启路由器和设备
2. 忘记网络后重新连接
3. 检查网络设置是否正确
4. 联系网络运营商确认线路状态""",
                "category": "技术支持",
                "permission_scope": "public",
                "status": "approved"
            },
            {
                "title": "VIP客户专属服务条款",
                "content": """VIP客户权益：
1. 专属客服通道，响应时间不超过30分钟
2. 享受优先维修服务，处理周期缩短50%
3. 每年享受2次免费上门服务
4. 产品延保服务优惠

VIP服务申请条件：
- 累计消费满10000元
- 年度消费满3000元
- 企业合作客户

服务升级流程：
1. 系统自动识别符合条件客户
2. 发送邀请函至客户注册邮箱
3. 客户确认后自动升级
4. 发放VIP专属服务卡""",
                "category": "VIP服务",
                "permission_scope": "internal",
                "status": "approved"
            }
        ]
        for doc in sample_docs:
            db_doc = models.Document(
                **doc,
                created_by=1,
                approved_by=1,
                approved_at=datetime.now()
            )
            db.add(db_doc)
        db.commit()
        
        documents = db.query(models.Document).all()
        for doc in documents:
            chunks = split_document(doc.content)
            for i, chunk_content in enumerate(chunks):
                chunk = models.DocumentChunk(
                    document_id=doc.id,
                    chunk_index=i,
                    content=chunk_content,
                    token_count=len(chunk_content)
                )
                db.add(chunk)
        db.commit()

def split_document(content: str, chunk_size: int = 300) -> List[str]:
    sentences = re.split(r'[。！？\n]', content)
    chunks = []
    current_chunk = ""
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        if len(current_chunk) + len(sentence) <= chunk_size:
            current_chunk += sentence + "。"
        else:
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = sentence + "。"
    
    if current_chunk:
        chunks.append(current_chunk)
    
    return chunks

def calculate_similarity(text1: str, text2: str) -> float:
    text1 = text1.lower()
    text2 = text2.lower()
    
    keywords1 = set()
    for word in ["退换货", "退货", "换货", "申请", "条件", "流程", "政策", 
                 "故障", "排查", "开机", "屏幕", "网络", "问题", "解决",
                 "vip", "客户", "服务", "权益", "专属", "客服", "维修",
                 "7天", "15天", "质量", "包装", "原包装", "完好",
                 "退款", "审核", "寄送", "收货", "工作日",
                 "电源", "适配器", "重启", "显示", "驱动", "连接",
                 "专属客服", "响应时间", "优先", "上门服务", "延保"]:
        if word in text1:
            keywords1.add(word)
    
    keywords2 = set()
    for word in ["退换货", "退货", "换货", "申请", "条件", "流程", "政策",
                 "故障", "排查", "开机", "屏幕", "网络", "问题", "解决",
                 "vip", "客户", "服务", "权益", "专属", "客服", "维修",
                 "7天", "15天", "质量", "包装", "原包装", "完好",
                 "退款", "审核", "寄送", "收货", "工作日",
                 "电源", "适配器", "重启", "显示", "驱动", "连接",
                 "专属客服", "响应时间", "优先", "上门服务", "延保"]:
        if word in text2:
            keywords2.add(word)
    
    common_chars = set(text1) & set(text2)
    char_score = len(common_chars) / max(len(set(text1)), len(set(text2)), 1) * 0.3
    
    if keywords1 and keywords2:
        keyword_intersection = keywords1 & keywords2
        keyword_union = keywords1 | keywords2
        keyword_score = len(keyword_intersection) / len(keyword_union) * 0.7
        return keyword_score + char_score
    
    return char_score

@app.on_event("startup")
async def startup_event():
    db = next(get_db())
    init_db_data(db)

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.get("/users", response_model=List[schemas.UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["business_owner"]))
):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@app.get("/documents", response_model=List[schemas.DocumentResponse])
def get_documents(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Document)
    
    if current_user.role == "frontline_user":
        query = query.filter(models.Document.permission_scope == "public")
    
    if status:
        query = query.filter(models.Document.status == status)
    if category:
        query = query.filter(models.Document.category == category)
    if search:
        query = query.filter(
            or_(
                models.Document.title.contains(search),
                models.Document.content.contains(search)
            )
        )
    
    documents = query.order_by(desc(models.Document.created_at)).offset(skip).limit(limit).all()
    return documents

@app.post("/documents", response_model=schemas.DocumentResponse)
def create_document(
    document: schemas.DocumentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["business_owner", "model_operator"]))
):
    db_document = models.Document(**document.model_dump(), created_by=current_user.id)
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    chunks = split_document(document.content)
    for i, chunk_content in enumerate(chunks):
        chunk = models.DocumentChunk(
            document_id=db_document.id,
            chunk_index=i,
            content=chunk_content,
            token_count=len(chunk_content)
        )
        db.add(chunk)
    db.commit()
    
    audit_log = models.AuditLog(
        operator_id=current_user.id,
        operation_type="create_document",
        document_id=db_document.id,
        details={"title": document.title}
    )
    db.add(audit_log)
    db.commit()
    
    return db_document

@app.get("/documents/{document_id}", response_model=schemas.DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if current_user.role == "frontline_user" and document.permission_scope != "public":
        raise HTTPException(status_code=403, detail="Access denied")
    
    return document

@app.put("/documents/{document_id}", response_model=schemas.DocumentResponse)
def update_document(
    document_id: int,
    document_update: schemas.DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["business_owner", "model_operator", "reviewer"]))
):
    db_document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    for field, value in document_update.model_dump(exclude_unset=True).items():
        setattr(db_document, field, value)
    
    if document_update.content:
        db.query(models.DocumentChunk).filter(models.DocumentChunk.document_id == document_id).delete()
        chunks = split_document(document_update.content)
        for i, chunk_content in enumerate(chunks):
            chunk = models.DocumentChunk(
                document_id=document_id,
                chunk_index=i,
                content=chunk_content,
                token_count=len(chunk_content)
            )
            db.add(chunk)
    
    db.commit()
    db.refresh(db_document)
    
    audit_log = models.AuditLog(
        operator_id=current_user.id,
        operation_type="update_document",
        document_id=document_id,
        details={"updates": document_update.model_dump(exclude_unset=True)}
    )
    db.add(audit_log)
    db.commit()
    
    return db_document

@app.post("/documents/{document_id}/approve", response_model=schemas.DocumentResponse)
def approve_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["business_owner", "reviewer"]))
):
    db_document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db_document.status = "approved"
    db_document.approved_by = current_user.id
    db_document.approved_at = datetime.now()
    db.commit()
    db.refresh(db_document)
    
    return db_document

@app.post("/qa/ask", response_model=schemas.QAResponse)
def ask_question(
    request: schemas.QARequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    rule_config = db.query(models.RuleConfig).filter(
        models.RuleConfig.rule_type == "task_flow",
        models.RuleConfig.is_active == True
    ).first()
    rule_version = rule_config.version if rule_config else "1.0"
    
    query = db.query(models.DocumentChunk).join(models.Document).filter(
        models.Document.status == "approved",
        models.Document.is_deprecated == False
    )
    
    if current_user.role == "frontline_user":
        query = query.filter(models.Document.permission_scope == "public")
    
    chunks = query.all()
    
    scored_chunks = []
    for chunk in chunks:
        score = calculate_similarity(request.question, chunk.content)
        if score > 0.01:
            scored_chunks.append((chunk, score))
    
    scored_chunks.sort(key=lambda x: x[1], reverse=True)
    top_chunks = scored_chunks[:3]
    
    task = models.Task(
        task_type="qa",
        title=f"问答: {request.question[:50]}...",
        description=request.question,
        question=request.question,
        status="processing",
        assigned_to=current_user.id,
        rule_version=rule_version
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    
    citations = []
    answer_parts = []
    sources = []
    
    if top_chunks:
        for i, (chunk, score) in enumerate(top_chunks):
            doc = db.query(models.Document).filter(models.Document.id == chunk.document_id).first()
            
            citation = models.Citation(
                task_id=task.id,
                document_id=chunk.document_id,
                chunk_id=chunk.id,
                quote_text=chunk.content,
                similarity_score=score
            )
            db.add(citation)
            citations.append(citation)
            
            answer_parts.append(chunk.content)
            sources.append({
                "document_id": doc.id,
                "title": doc.title,
                "chunk_index": chunk.chunk_index,
                "similarity": round(score, 3)
            })
        
        answer = "根据知识库内容，相关信息如下：\n\n" + "\n\n".join(answer_parts)
    else:
        answer = "抱歉，在当前知识库中未找到相关内容。建议您：\n1. 尝试使用不同的关键词搜索\n2. 联系客服人员获取人工帮助\n3. 提交问题，我们将尽快补充相关内容"
    
    task.answer = answer
    task.status = "reviewing"
    db.commit()
    
    status_history = models.StatusHistory(
        task_id=task.id,
        from_status="processing",
        to_status="reviewing",
        operator_id=current_user.id,
        remark="系统自动生成回答"
    )
    db.add(status_history)
    db.commit()
    
    return {
        "question": request.question,
        "answer": answer,
        "citations": citations,
        "task_id": task.id,
        "sources": sources
    }

@app.get("/tasks", response_model=List[schemas.TaskResponse])
def get_tasks(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    task_type: Optional[str] = None,
    assigned_to: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    exception_reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Task)
    
    if current_user.role == "frontline_user":
        query = query.filter(models.Task.assigned_to == current_user.id)
    
    if status:
        query = query.filter(models.Task.status == status)
    if task_type:
        query = query.filter(models.Task.task_type == task_type)
    if assigned_to:
        query = query.filter(models.Task.assigned_to == assigned_to)
    if start_date:
        query = query.filter(models.Task.created_at >= start_date)
    if end_date:
        query = query.filter(models.Task.created_at <= end_date)
    if exception_reason:
        query = query.filter(models.Task.exception_reason.contains(exception_reason))
    
    tasks = query.order_by(desc(models.Task.created_at)).offset(skip).limit(limit).all()
    return tasks

@app.get("/tasks/{task_id}", response_model=schemas.TaskWithDetails)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if not auth.check_task_permission(current_user, task, "view"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    citations = db.query(models.Citation).filter(models.Citation.task_id == task_id).all()
    status_history = db.query(models.StatusHistory).filter(models.StatusHistory.task_id == task_id).order_by(models.StatusHistory.created_at).all()
    
    result = {c.name: getattr(task, c.name) for c in task.__table__.columns}
    result["assignee"] = task.assignee
    result["citations"] = citations
    result["status_history"] = status_history
    result["document"] = None
    
    return result

@app.post("/tasks", response_model=schemas.TaskResponse)
def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    rule_config = db.query(models.RuleConfig).filter(
        models.RuleConfig.rule_type == "task_flow",
        models.RuleConfig.is_active == True
    ).first()
    
    if not rule_config:
        raise HTTPException(status_code=500, detail="Rule configuration not found")
    
    rule_content = rule_config.content
    if task.task_type in rule_content.get("required_fields", {}):
        required = rule_content["required_fields"][task.task_type]
        for field in required:
            if not getattr(task, field, None):
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    if task.previous_node:
        prev_task = db.query(models.Task).filter(models.Task.id == task.previous_node).first()
        if not prev_task:
            raise HTTPException(status_code=400, detail="Previous task not found")
        if prev_task.status != "completed":
            raise HTTPException(status_code=400, detail="Previous task not completed")
    
    db_task = models.Task(
        **task.model_dump(),
        rule_version=rule_config.version
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    status_history = models.StatusHistory(
        task_id=db_task.id,
        from_status=None,
        to_status="pending",
        operator_id=current_user.id,
        remark="任务创建"
    )
    db.add(status_history)
    db.commit()
    
    audit_log = models.AuditLog(
        operator_id=current_user.id,
        operation_type="create_task",
        task_id=db_task.id,
        details={"task_type": task.task_type, "title": task.title}
    )
    db.add(audit_log)
    db.commit()
    
    return db_task

@app.put("/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: int,
    task_update: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if not auth.check_task_permission(current_user, db_task, "update"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if task_update.status and task_update.status != db_task.status:
        rule_config = db.query(models.RuleConfig).filter(
            models.RuleConfig.rule_type == "task_flow",
            models.RuleConfig.is_active == True
        ).first()
        
        if rule_config:
            status_flow = rule_config.content.get("status_flow", {})
            allowed_statuses = status_flow.get(db_task.status, [])
            if task_update.status not in allowed_statuses:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot transition from {db_task.status} to {task_update.status}"
                )
        
        status_history = models.StatusHistory(
            task_id=task_id,
            from_status=db_task.status,
            to_status=task_update.status,
            operator_id=current_user.id
        )
        db.add(status_history)
    
    for field, value in task_update.model_dump(exclude_unset=True).items():
        setattr(db_task, field, value)
    
    if task_update.status == "completed":
        db_task.completed_at = datetime.now()
    
    db.commit()
    db.refresh(db_task)
    
    return db_task

@app.post("/tasks/{task_id}/approve", response_model=schemas.TaskResponse)
def approve_task(
    task_id: int,
    remark: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["business_owner", "reviewer"]))
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if db_task.status != "reviewing":
        raise HTTPException(status_code=400, detail="Task not in reviewing status")
    
    db_task.status = "approved"
    db_task.reviewed_by = current_user.id
    db_task.reviewed_at = datetime.now()
    
    status_history = models.StatusHistory(
        task_id=task_id,
        from_status="reviewing",
        to_status="approved",
        operator_id=current_user.id,
        remark=remark or "审核通过"
    )
    db.add(status_history)
    
    db_task.status = "completed"
    db_task.completed_at = datetime.now()
    
    status_history2 = models.StatusHistory(
        task_id=task_id,
        from_status="approved",
        to_status="completed",
        operator_id=current_user.id,
        remark="系统自动完成"
    )
    db.add(status_history2)
    
    audit_log = models.AuditLog(
        operator_id=current_user.id,
        operation_type="approve_task",
        task_id=task_id,
        details={"remark": remark, "next_step": "任务已完成，结果已同步到知识库"}
    )
    db.add(audit_log)
    
    db.commit()
    db.refresh(db_task)
    
    return db_task

@app.post("/tasks/{task_id}/reject", response_model=schemas.TaskResponse)
def reject_task(
    task_id: int,
    remark: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["business_owner", "reviewer"]))
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if db_task.status != "reviewing":
        raise HTTPException(status_code=400, detail="Task not in reviewing status")
    
    db_task.status = "rejected"
    db_task.exception_reason = remark
    db_task.reviewed_by = current_user.id
    db_task.reviewed_at = datetime.now()
    
    status_history = models.StatusHistory(
        task_id=task_id,
        from_status="reviewing",
        to_status="rejected",
        operator_id=current_user.id,
        remark=remark or "审核拒绝"
    )
    db.add(status_history)
    
    db_task.status = "pending"
    db_task.assigned_to = db_task.created_by
    
    status_history2 = models.StatusHistory(
        task_id=task_id,
        from_status="rejected",
        to_status="pending",
        operator_id=current_user.id,
        remark="退回重新处理"
    )
    db.add(status_history2)
    
    audit_log = models.AuditLog(
        operator_id=current_user.id,
        operation_type="reject_task",
        task_id=task_id,
        details={"remark": remark, "next_step": "已退回创建人重新处理"}
    )
    db.add(audit_log)
    
    db.commit()
    db.refresh(db_task)
    
    return db_task

@app.post("/feedbacks", response_model=schemas.FeedbackResponse)
def create_feedback(
    feedback: schemas.FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    task = db.query(models.Task).filter(models.Task.id == feedback.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db_feedback = models.Feedback(
        **feedback.model_dump(),
        user_id=current_user.id
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    
    return db_feedback

@app.get("/feedbacks", response_model=List[schemas.FeedbackResponse])
def get_feedbacks(
    skip: int = 0,
    limit: int = 100,
    collected: Optional[bool] = None,
    task_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["business_owner", "model_operator"]))
):
    query = db.query(models.Feedback)
    if collected is not None:
        query = query.filter(models.Feedback.collected == collected)
    if task_id:
        query = query.filter(models.Feedback.task_id == task_id)
    
    feedbacks = query.order_by(desc(models.Feedback.created_at)).offset(skip).limit(limit).all()
    return feedbacks

@app.post("/feedbacks/{feedback_id}/collect", response_model=schemas.FeedbackResponse)
def collect_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["business_owner", "model_operator"]))
):
    feedback = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    feedback.collected = True
    feedback.collected_by = current_user.id
    feedback.collected_at = datetime.now()
    db.commit()
    db.refresh(feedback)
    
    return feedback

@app.get("/exceptions", response_model=List[schemas.ExceptionLogResponse])
def get_exceptions(
    skip: int = 0,
    limit: int = 100,
    resolved: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["business_owner", "model_operator"]))
):
    query = db.query(models.ExceptionLog)
    if resolved is not None:
        query = query.filter(models.ExceptionLog.resolved == resolved)
    
    exceptions = query.order_by(desc(models.ExceptionLog.created_at)).offset(skip).limit(limit).all()
    return exceptions

@app.post("/exceptions/{exception_id}/resolve", response_model=schemas.ExceptionLogResponse)
def resolve_exception(
    exception_id: int,
    manual_note: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["business_owner"]))
):
    exception = db.query(models.ExceptionLog).filter(models.ExceptionLog.id == exception_id).first()
    if not exception:
        raise HTTPException(status_code=404, detail="Exception not found")
    
    exception.resolved = True
    exception.resolved_by = current_user.id
    exception.resolved_at = datetime.now()
    if manual_note:
        exception.manual_note = manual_note
    db.commit()
    db.refresh(exception)
    
    return exception

@app.get("/audit-logs", response_model=List[schemas.AuditLogResponse])
def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    operation_type: Optional[str] = None,
    operator_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["business_owner"]))
):
    query = db.query(models.AuditLog)
    if operation_type:
        query = query.filter(models.AuditLog.operation_type == operation_type)
    if operator_id:
        query = query.filter(models.AuditLog.operator_id == operator_id)
    
    logs = query.order_by(desc(models.AuditLog.created_at)).offset(skip).limit(limit).all()
    return logs

@app.get("/reports/tasks-summary")
def get_tasks_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["business_owner", "model_operator"]))
):
    query = db.query(models.Task)
    if start_date:
        query = query.filter(models.Task.created_at >= start_date)
    if end_date:
        query = query.filter(models.Task.created_at <= end_date)
    
    total = query.count()
    status_groups = {}
    type_groups = {}
    
    status_results = db.query(
        models.Task.status,
        func.count(models.Task.id)
    ).group_by(models.Task.status).all()
    for status, count in status_results:
        status_groups[status] = count
    
    type_results = db.query(
        models.Task.task_type,
        func.count(models.Task.id)
    ).group_by(models.Task.task_type).all()
    for task_type, count in type_results:
        type_groups[task_type] = count
    
    avg_processing_time = None
    completed_tasks = query.filter(models.Task.status == "completed").all()
    if completed_tasks:
        total_time = sum(
            (task.completed_at - task.created_at).total_seconds()
            for task in completed_tasks
            if task.completed_at
        )
        avg_processing_time = total_time / len(completed_tasks)
    
    return {
        "total": total,
        "by_status": status_groups,
        "by_type": type_groups,
        "avg_processing_seconds": avg_processing_time
    }

@app.get("/export/tasks")
def export_tasks(
    status: Optional[str] = None,
    task_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["business_owner", "model_operator"]))
):
    query = db.query(models.Task)
    if status:
        query = query.filter(models.Task.status == status)
    if task_type:
        query = query.filter(models.Task.task_type == task_type)
    if start_date:
        query = query.filter(models.Task.created_at >= start_date)
    if end_date:
        query = query.filter(models.Task.created_at <= end_date)
    
    tasks = query.all()
    
    data = []
    for task in tasks:
        data.append({
            "任务ID": task.id,
            "任务类型": task.task_type,
            "标题": task.title,
            "状态": task.status,
            "优先级": task.priority,
            "问题": task.question or "",
            "答案": task.answer or "",
            "创建时间": task.created_at.strftime("%Y-%m-%d %H:%M:%S") if task.created_at else "",
            "完成时间": task.completed_at.strftime("%Y-%m-%d %H:%M:%S") if task.completed_at else ""
        })
    
    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='任务数据')
    
    output.seek(0)
    filename = f"tasks_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/rules", response_model=List[schemas.RuleConfigResponse])
def get_rules(
    rule_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["business_owner"]))
):
    query = db.query(models.RuleConfig)
    if rule_type:
        query = query.filter(models.RuleConfig.rule_type == rule_type)
    
    rules = query.order_by(desc(models.RuleConfig.created_at)).all()
    return rules

@app.post("/rules", response_model=schemas.RuleConfigResponse)
def create_rule(
    rule: schemas.RuleConfigCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["business_owner"]))
):
    db_rule = models.RuleConfig(**rule.model_dump(), created_by=current_user.id)
    db.add(db_rule)
    
    if rule.is_active:
        db.query(models.RuleConfig).filter(
            models.RuleConfig.rule_type == rule.rule_type,
            models.RuleConfig.id != db_rule.id
        ).update({"is_active": False})
    
    db.commit()
    db.refresh(db_rule)
    return db_rule

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=settings.BACKEND_PORT,
        log_level="info"
    )
