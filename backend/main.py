import os
import sys
from datetime import datetime
from typing import Optional, List
from dotenv import load_dotenv

from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

sys.path.insert(0, os.path.dirname(__file__))

from database import engine, Base, get_db
import models
import schemas
from ai.parser import parse_resume
from ai.interviewer import generate_questions, evaluate_session
from ai.career_planner import create_career_plan
from ai.matcher import search_talent
from ai.anticheat import run_anticheat_checks, check_message_spam, calculate_text_hash
from ai.dashboard import get_all_dashboard_data, get_overview_stats

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI职业发展协同平台 API", version="1.0.0")

FRONTEND_PORT = os.getenv("FRONTEND_PORT", "46797")
BACKEND_PORT = os.getenv("BACKEND_PORT", "56797")
HOST = os.getenv("HOST", "127.0.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        f"http://127.0.0.1:{FRONTEND_PORT}",
        f"http://localhost:{FRONTEND_PORT}"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def seed_demo_data(db: Session):
    if db.query(models.User).count() > 0:
        return

    demo_users = [
        models.User(username="jobseeker1", email="demo@example.com",
                    password_hash="demo123", role="jobseeker"),
        models.User(username="hr1", email="hr@company.com",
                    password_hash="demo123", role="employer"),
        models.User(username="admin", email="admin@platform.com",
                    password_hash="admin123", role="admin"),
    ]
    db.add_all(demo_users)
    db.flush()

    demo_company = models.Company(
        name="示例科技有限公司",
        description="一家专注于AI技术的创新企业",
        industry="人工智能",
        owner_id=2
    )
    db.add(demo_company)
    db.flush()

    demo_job = models.Job(
        title="高级大模型工程师",
        description="负责大模型应用开发和微调工作",
        jd_content="岗位职责：1. 负责大模型的微调和应用开发；2. 参与RAG系统设计与实现；3. 优化模型推理性能。任职要求：1. 3年以上Python开发经验；2. 熟悉PyTorch和Transformer；3. 有大模型微调经验优先。",
        requirements=["Python", "PyTorch", "大模型", "微调", "RAG"],
        company_id=1
    )
    db.add(demo_job)

    sample_resumes = [
        {
            "name": "张三",
            "phone": "13800138001",
            "email": "zhangsan@example.com",
            "education": ["清华大学 计算机硕士"],
            "years_exp": 5.0,
            "skills": ["Python", "PyTorch", "大模型", "LLM", "Transformer", "RAG", "微调", "FastAPI", "MySQL", "Redis", "Docker", "Kubernetes"],
            "soft_skills": ["沟通能力", "团队协作", "问题解决", "学习能力", "项目管理"],
            "companies": [{"name": "字节跳动", "position": "高级算法工程师"}, {"name": "阿里巴巴", "position": "算法工程师"}],
            "projects": [
                {
                    "name": "企业知识库RAG系统",
                    "description": "负责搭建基于大模型的企业知识库问答系统，使用LangChain和向量数据库实现语义检索，准确率提升40%，支持10万+文档检索。使用技术包括Python、PyTorch、LangChain、ChromaDB、FastAPI。",
                    "tech_stack": ["Python", "PyTorch", "LangChain", "RAG", "FastAPI"],
                    "duration": "2023-至今",
                    "role": "技术负责人"
                },
                {
                    "name": "大模型微调平台",
                    "description": "主导构建大模型LoRA微调平台，支持多任务并行训练，提高训练效率300%，节省GPU资源50%。使用技术包括Python、PyTorch、LoRA、QLoRA、Kubernetes。",
                    "tech_stack": ["Python", "PyTorch", "大模型", "微调", "Kubernetes"],
                    "duration": "2022-2023",
                    "role": "核心开发者"
                }
            ]
        },
        {
            "name": "李四",
            "phone": "13800138002",
            "email": "lisi@example.com",
            "education": ["北京大学 软件工程本科"],
            "years_exp": 3.0,
            "skills": ["Python", "Java", "Spring Boot", "MySQL", "Redis", "微服务", "分布式系统", "高并发", "Docker", "Kafka"],
            "soft_skills": ["沟通能力", "团队协作", "问题解决", "学习能力"],
            "companies": [{"name": "美团", "position": "后端开发工程师"}],
            "projects": [
                {
                    "name": "外卖订单系统重构",
                    "description": "参与外卖订单系统微服务化重构，使用消息队列处理高并发场景，QPS提升200%，系统可用性达99.99%。",
                    "tech_stack": ["Java", "Spring Boot", "Kafka", "MySQL", "Redis"],
                    "duration": "2023-至今",
                    "role": "后端工程师"
                }
            ]
        },
        {
            "name": "王五",
            "phone": "13800138003",
            "email": "wangwu@example.com",
            "education": ["浙江大学 计算机硕士"],
            "years_exp": 4.0,
            "skills": ["Python", "机器学习", "深度学习", "TensorFlow", "PyTorch", "NLP", "算法", "数据结构", "SQL", "Spark"],
            "soft_skills": ["沟通能力", "问题解决", "创新能力", "学习能力"],
            "companies": [{"name": "腾讯", "position": "算法工程师"}],
            "projects": [
                {
                    "name": "智能客服NLP系统",
                    "description": "负责智能客服意图识别和问答系统开发，使用BERT和RAG技术，准确率达到95%，客服效率提升80%。",
                    "tech_stack": ["Python", "PyTorch", "NLP", "BERT", "RAG"],
                    "duration": "2022-至今",
                    "role": "算法负责人"
                }
            ]
        }
    ]

    for i, resume_data in enumerate(sample_resumes):
        raw_text = f"""
{resume_data['name']}
电话: {resume_data['phone']}
邮箱: {resume_data['email']}
教育: {resume_data['education'][0]}
工作经验: {resume_data['years_exp']}年

技能: {', '.join(resume_data['skills'])}

工作经历:
"""
        for company in resume_data['companies']:
            raw_text += f"{company['name']} - {company['position']}\n"

        raw_text += "\n项目经历:\n"
        for project in resume_data['projects']:
            raw_text += f"{project['name']} ({project['duration']})\n{project['description']}\n\n"

        from ai.parser import generate_radar_data
        radar = generate_radar_data(resume_data['skills'], resume_data['projects'], resume_data['soft_skills'])
        anticheat = run_anticheat_checks(raw_text, resume_data['projects'], resume_data['companies'])

        resume = models.Resume(
            user_id=1,
            file_name=f"demo_resume_{i+1}.pdf",
            file_type="application/pdf",
            raw_text=raw_text,
            parsed_data={
                "name": resume_data['name'],
                "phone": resume_data['phone'],
                "email": resume_data['email'],
                "education": resume_data['education'],
                "years_of_experience": resume_data['years_exp'],
                "companies": resume_data['companies']
            },
            skills=resume_data['skills'],
            projects=resume_data['projects'],
            soft_skills=resume_data['soft_skills'],
            radar_data=radar,
            ai_generated_score=anticheat['ai_generated_score'],
            anticheat_flags=anticheat['flags'],
            is_valid=anticheat['is_valid']
        )
        db.add(resume)

    db.commit()


@app.on_event("startup")
async def startup_event():
    db = next(get_db())
    seed_demo_data(db)


@app.get("/api/health", response_model=schemas.HealthResponse, tags=["系统"])
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow()
    }


@app.get("/api/stats/overview", tags=["统计"])
async def get_stats(db: Session = Depends(get_db)):
    return get_overview_stats(db)


@app.post("/api/resumes/parse", tags=["简历解析"])
async def parse_resume_endpoint(
    file: UploadFile = File(...),
    user_id: Optional[int] = 1,
    db: Session = Depends(get_db)
):
    try:
        content = await file.read()
        result = parse_resume(content, file.filename, file.content_type or "")

        anticheat_result = run_anticheat_checks(
            result["raw_text"],
            result["projects"],
            result["companies"]
        )

        resume = models.Resume(
            user_id=user_id,
            file_name=file.filename,
            file_type=file.content_type,
            raw_text=result["raw_text"],
            parsed_data=result["parsed_data"],
            skills=result["skills"],
            projects=result["projects"],
            soft_skills=result["soft_skills"],
            radar_data=result["radar_data"],
            ai_generated_score=anticheat_result["ai_generated_score"],
            anticheat_flags=anticheat_result["flags"],
            is_valid=anticheat_result["is_valid"]
        )

        db.add(resume)
        db.flush()

        for flag in anticheat_result["flags"]:
            log = models.AnticheatLog(
                resume_id=resume.id,
                check_type=flag["type"],
                severity=flag["severity"],
                details=flag.get("details", {})
            )
            db.add(log)

        db.commit()
        db.refresh(resume)

        return {
            "id": resume.id,
            "file_name": resume.file_name,
            "skills": resume.skills,
            "projects": resume.projects,
            "soft_skills": resume.soft_skills,
            "radar_data": resume.radar_data,
            "ai_generated_score": resume.ai_generated_score,
            "anticheat_flags": resume.anticheat_flags,
            "parsed_data": resume.parsed_data,
            "is_valid": resume.is_valid
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"简历解析失败: {str(e)}")


@app.get("/api/resumes", tags=["简历管理"])
async def list_resumes(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Resume)
    if user_id:
        query = query.filter(models.Resume.user_id == user_id)
    resumes = query.order_by(models.Resume.created_at.desc()).all()
    return [{
        "id": r.id,
        "file_name": r.file_name,
        "skills": (r.skills or [])[:10],
        "soft_skills": r.soft_skills or [],
        "overall_score": (r.radar_data or {}).get("overall_score", 0),
        "ai_generated_score": r.ai_generated_score,
        "is_valid": r.is_valid,
        "projects": (r.projects or [])[:3],
        "radar_data": r.radar_data,
        "anticheat_flags": r.anticheat_flags or [],
        "parsed_data": r.parsed_data,
        "created_at": r.created_at,
        "updated_at": r.updated_at
    } for r in resumes]


@app.get("/api/resumes/{resume_id}", tags=["简历管理"])
async def get_resume(resume_id: int, db: Session = Depends(get_db)):
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="简历不存在")
    anticheat_logs = db.query(models.AnticheatLog).filter(
        models.AnticheatLog.resume_id == resume_id
    ).order_by(models.AnticheatLog.created_at.desc()).all()
    result = {
        "id": resume.id,
        "file_name": resume.file_name,
        "file_type": resume.file_type,
        "raw_text": resume.raw_text,
        "parsed_data": resume.parsed_data,
        "skills": resume.skills or [],
        "projects": resume.projects or [],
        "soft_skills": resume.soft_skills or [],
        "radar_data": resume.radar_data,
        "ai_generated_score": resume.ai_generated_score,
        "anticheat_flags": resume.anticheat_flags or [],
        "is_valid": resume.is_valid,
        "created_at": resume.created_at,
        "updated_at": resume.updated_at,
        "anticheat_logs": [{
            "id": l.id,
            "check_type": l.check_type,
            "severity": l.severity,
            "details": l.details,
            "created_at": l.created_at.isoformat() if l.created_at else None
        } for l in anticheat_logs]
    }
    return result


@app.post("/api/interviews/start", tags=["AI模拟面试"])
async def start_interview(request: schemas.InterviewStartRequest, db: Session = Depends(get_db)):
    questions = generate_questions(request.job_title, request.jd_content)

    session = models.InterviewSession(
        user_id=1,
        job_id=request.job_id,
        job_title=request.job_title,
        jd_content=request.jd_content,
        questions=questions,
        answers=[],
        status="in_progress"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "session_id": session.id,
        "job_title": request.job_title,
        "questions": questions
    }


@app.post("/api/interviews/{session_id}/answer", tags=["AI模拟面试"])
async def submit_answer(
    session_id: int,
    request: schemas.InterviewAnswerRequest,
    db: Session = Depends(get_db)
):
    session = db.query(models.InterviewSession).filter(models.InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="面试会话不存在")

    answers = session.answers or []
    answers.append({
        "question_id": request.question_id,
        "answer": request.answer,
        "timestamp": datetime.utcnow().isoformat()
    })
    session.answers = answers
    db.commit()

    return {"status": "success", "answer_saved": True}


@app.post("/api/interviews/{session_id}/evaluate", tags=["AI模拟面试"])
async def evaluate_interview(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.InterviewSession).filter(models.InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="面试会话不存在")

    if not session.questions or not session.answers:
        raise HTTPException(status_code=400, detail="缺少面试问题或答案")

    result = evaluate_session(session.questions, session.answers)

    session.evaluation = result
    session.logic_score = result["logic_score"]
    session.status = "completed"
    db.commit()

    return result


@app.get("/api/interviews", tags=["AI模拟面试"])
async def list_interviews(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.InterviewSession)
    if user_id:
        query = query.filter(models.InterviewSession.user_id == user_id)
    sessions = query.order_by(models.InterviewSession.created_at.desc()).all()
    return [{
        "id": s.id,
        "job_title": s.job_title,
        "status": s.status,
        "logic_score": s.logic_score,
        "created_at": s.created_at
    } for s in sessions]


@app.post("/api/career-plan", tags=["职业路径规划"])
async def generate_career_plan(request: schemas.CareerPlanRequest, db: Session = Depends(get_db)):
    plan_data = create_career_plan(
        request.current_position,
        request.target_position,
        request.current_skills
    )

    plan = models.CareerPlan(
        user_id=1,
        current_position=request.current_position,
        target_position=request.target_position,
        current_skills=request.current_skills,
        skill_gaps=plan_data["skill_gaps"],
        learning_resources=plan_data["learning_resources"],
        roadmap=plan_data["roadmap"]
    )
    db.add(plan)
    db.commit()

    return plan_data


@app.get("/api/career-plans", tags=["职业路径规划"])
async def list_career_plans(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.CareerPlan)
    if user_id:
        query = query.filter(models.CareerPlan.user_id == user_id)
    plans = query.order_by(models.CareerPlan.created_at.desc()).all()
    return [{
        "id": p.id,
        "current_position": p.current_position,
        "target_position": p.target_position,
        "created_at": p.created_at
    } for p in plans]


@app.post("/api/talent/search", tags=["智能人才寻源"])
async def talent_search(request: schemas.TalentSearchRequest, db: Session = Depends(get_db)):
    all_resumes = db.query(models.Resume).filter(models.Resume.is_valid == True).all()

    result = search_talent(request.query, all_resumes, request.company_id)

    search_record = models.TalentSearch(
        company_id=request.company_id,
        query=request.query,
        matched_resume_ids=[c["resume_id"] for c in result["candidates"]],
        candidate_briefs=result["candidates"]
    )
    db.add(search_record)
    db.commit()

    return result


@app.get("/api/talent/searches", tags=["智能人才寻源"])
async def list_talent_searches(company_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.TalentSearch)
    if company_id:
        query = query.filter(models.TalentSearch.company_id == company_id)
    searches = query.order_by(models.TalentSearch.created_at.desc()).all()
    return [{
        "id": s.id,
        "query": s.query,
        "total_matched": len(s.matched_resume_ids or []),
        "created_at": s.created_at
    } for s in searches]


@app.post("/api/messages/send", tags=["消息系统"])
async def send_message(request: schemas.MessageSendRequest, db: Session = Depends(get_db)):
    spam_check = check_message_spam(request.sender_id, request.content, db.query(models.Message))

    content_hash = calculate_text_hash(request.content)

    message = models.Message(
        sender_id=request.sender_id,
        receiver_id=request.receiver_id,
        content=request.content,
        content_hash=content_hash,
        is_rate_limited=spam_check["is_spam"]
    )
    db.add(message)
    db.commit()

    if spam_check["is_spam"]:
        return {
            "status": "rate_limited",
            "message": "发送频率过高，已被限流",
            "details": spam_check
        }

    return {
        "status": "success",
        "message_id": message.id,
        "spam_check": spam_check
    }


@app.get("/api/dashboard", tags=["数据看板"])
async def get_dashboard(company_id: Optional[int] = None, db: Session = Depends(get_db)):
    return get_all_dashboard_data(db, company_id)


@app.get("/api/dashboard/talent-flow", tags=["数据看板"])
async def talent_flow(db: Session = Depends(get_db)):
    from ai.dashboard import get_talent_flow_data
    return get_talent_flow_data(db)


@app.get("/api/dashboard/skill-trends", tags=["数据看板"])
async def skill_trends(db: Session = Depends(get_db)):
    from ai.dashboard import get_skill_trend_data
    return get_skill_trend_data(db)


@app.get("/api/dashboard/recruitment-funnel", tags=["数据看板"])
async def recruitment_funnel(company_id: Optional[int] = None, db: Session = Depends(get_db)):
    from ai.dashboard import get_recruitment_funnel
    return get_recruitment_funnel(db, company_id)


@app.get("/api/anticheat/logs", tags=["反作弊系统"])
async def get_anticheat_logs(db: Session = Depends(get_db)):
    logs = db.query(models.AnticheatLog).order_by(models.AnticheatLog.created_at.desc()).limit(100).all()
    return [{
        "id": l.id,
        "resume_id": l.resume_id,
        "check_type": l.check_type,
        "severity": l.severity,
        "details": l.details,
        "created_at": l.created_at
    } for l in logs]


@app.post("/api/users", tags=["用户管理"])
async def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = models.User(
        username=user.username,
        email=user.email,
        role=user.role,
        password_hash=user.password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.get("/api/users", tags=["用户管理"])
async def list_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return [schemas.UserResponse.model_validate(u) for u in users]


@app.get("/api/jobs", tags=["职位管理"])
async def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(models.Job).all()
    return [{
        "id": j.id,
        "title": j.title,
        "description": j.description[:200],
        "company_name": (j.company.name if j.company else "未知"),
        "created_at": j.created_at
    } for j in jobs]


@app.post("/api/jobs", tags=["职位管理"])
async def create_job(
    title: str,
    description: str,
    jd_content: str,
    company_id: int,
    db: Session = Depends(get_db)
):
    from ai.parser import extract_skills
    requirements = extract_skills(jd_content)

    job = models.Job(
        title=title,
        description=description,
        jd_content=jd_content,
        requirements=requirements,
        company_id=company_id
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@app.get("/api/companies", tags=["企业管理"])
async def list_companies(db: Session = Depends(get_db)):
    companies = db.query(models.Company).all()
    return [{
        "id": c.id,
        "name": c.name,
        "industry": c.industry,
        "description": c.description[:200],
        "jobs_count": len(c.jobs or [])
    } for c in companies]


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", "56797"))
    host = os.getenv("HOST", "127.0.0.1")
    print(f"启动后端服务: http://{host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=False)
