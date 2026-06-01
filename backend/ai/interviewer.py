import re
import random
import json
from typing import List, Dict, Any
from datetime import datetime


QUESTION_TEMPLATES = {
    "technical": [
        "请解释{skill}的核心原理是什么？在实际项目中如何应用？",
        "在使用{skill}开发时，你遇到过的最大性能瓶颈是什么？如何解决的？",
        "{skill}和同类技术相比有什么优缺点？在什么场景下选择使用它？",
        "请描述一个你使用{skill}解决复杂问题的具体案例，包括问题背景、你的方案和最终结果。",
        "如何基于{skill}设计一个高可用、可扩展的系统架构？请说明关键设计点。"
    ],
    "behavioral": [
        "请描述一次你在项目中遇到的重大技术挑战，你是如何克服的？",
        "当你的技术方案与团队其他成员产生分歧时，你会如何处理？请举例说明。",
        "请分享一个你在紧迫时间压力下完成重要项目的经历，你是如何平衡质量和进度的？",
        "描述一次你从失败中学习的经历，这次经历对你后续的工作有什么影响？",
        "当你需要学习一项全新的技术来完成任务时，你的学习路径是什么？请举例说明。"
    ],
    "situational": [
        "假设线上服务出现严重故障，用户大量投诉，作为负责人你会如何处理？请描述你的应急响应流程。",
        "如果发现团队成员的代码存在严重质量问题，但他是资深员工，你会如何沟通和处理？",
        "项目进行到一半，需求发生重大变更，你如何带领团队调整方向并确保交付？",
        "你如何平衡技术债务和新功能开发的关系？请分享你的方法论。",
        "当你接手一个质量很差的遗留系统时，你的重构策略是什么？"
    ],
    "domain": [
        "基于你对{domain}领域的理解，这个岗位需要解决的核心业务问题是什么？",
        "{domain}行业当前的技术趋势是什么？你认为未来3年会有哪些重大变化？",
        "请分析{domain}领域的典型系统架构，并说明其优缺点。",
        "在{domain}场景下，如何平衡用户体验和系统性能？请举例说明。",
        "你认为{domain}领域目前最大的技术痛点是什么？有什么解决方案？"
    ]
}

JOB_KEYWORDS = {
    "后端开发": ["Java", "Spring Boot", "MySQL", "Redis", "微服务", "高并发", "分布式系统"],
    "前端开发": ["JavaScript", "TypeScript", "React", "Vue", "Node.js", "性能优化", "Webpack"],
    "全栈开发": ["Node.js", "React", "Vue", "MySQL", "MongoDB", "Docker", "CI/CD"],
    "算法工程师": ["Python", "机器学习", "深度学习", "TensorFlow", "PyTorch", "算法", "数据结构"],
    "大模型工程师": ["Python", "大模型", "LLM", "Transformer", "RAG", "微调", "PyTorch"],
    "数据工程师": ["Python", "SQL", "Spark", "Hadoop", "数据仓库", "ETL", "Kafka"],
    "DevOps工程师": ["Docker", "Kubernetes", "CI/CD", "Linux", "AWS", "监控", "自动化"],
    "测试开发": ["Python", "自动化测试", "Selenium", "性能测试", "接口测试", "Jenkins"]
}

DOMAIN_KEYWORDS = {
    "电商": ["商品系统", "订单系统", "支付系统", "库存管理", "高并发", "分布式事务"],
    "金融": ["交易系统", "风控", "数据一致性", "高可用", "安全合规", "审计"],
    "教育": ["直播系统", "互动白板", "实时通信", "学习路径", "数据分析"],
    "医疗": ["电子病历", "数据安全", "隐私保护", "医疗影像", "远程问诊"],
    "社交": ["用户关系", "Feed流", "即时通讯", "内容审核", "推荐系统"],
    "企业服务": ["多租户", "权限管理", "工作流", "SaaS", "集成能力"]
}


def extract_required_skills(jd_content: str) -> List[str]:
    skills = []
    text_lower = jd_content.lower()

    all_skills = []
    for v in JOB_KEYWORDS.values():
        all_skills.extend(v)

    for skill in set(all_skills):
        if skill.lower() in text_lower and skill not in skills:
            skills.append(skill)

    return skills[:8]


def detect_job_domain(jd_content: str) -> str:
    for domain in DOMAIN_KEYWORDS.keys():
        if domain in jd_content:
            return domain

    text_lower = jd_content.lower()
    for domain, keywords in DOMAIN_KEYWORDS.items():
        for kw in keywords:
            if kw in jd_content or kw.lower() in text_lower:
                return domain

    return "互联网"


def detect_job_type(jd_content: str) -> str:
    for job_type in JOB_KEYWORDS.keys():
        if job_type in jd_content:
            return job_type

    text_lower = jd_content.lower()
    for job_type, keywords in JOB_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text_lower:
                return job_type

    return "后端开发"


def generate_questions(job_title: str, jd_content: str, count: int = 8) -> List[Dict[str, Any]]:
    questions = []
    required_skills = extract_required_skills(jd_content)
    job_domain = detect_job_domain(jd_content)
    job_type = detect_job_type(jd_content)

    tech_count = min(4, max(2, len(required_skills)))
    behavioral_count = 2
    situational_count = 1
    domain_count = 1

    for i in range(tech_count):
        if required_skills:
            skill = required_skills[i % len(required_skills)]
            template = random.choice(QUESTION_TEMPLATES["technical"])
            q_text = template.format(skill=skill)
        else:
            q_text = random.choice(QUESTION_TEMPLATES["technical"]).format(skill=job_type)

        questions.append({
            "id": len(questions) + 1,
            "question": q_text,
            "type": "technical",
            "difficulty": "hard" if i < 2 else "medium",
            "related_skill": required_skills[i % len(required_skills)] if required_skills else job_type
        })

    for i in range(behavioral_count):
        template = random.choice(QUESTION_TEMPLATES["behavioral"])
        questions.append({
            "id": len(questions) + 1,
            "question": template,
            "type": "behavioral",
            "difficulty": "medium",
            "related_skill": "软技能"
        })

    for i in range(situational_count):
        template = random.choice(QUESTION_TEMPLATES["situational"])
        questions.append({
            "id": len(questions) + 1,
            "question": template,
            "type": "situational",
            "difficulty": "hard",
            "related_skill": "问题解决"
        })

    for i in range(domain_count):
        template = random.choice(QUESTION_TEMPLATES["domain"])
        q_text = template.format(domain=job_domain)
        questions.append({
            "id": len(questions) + 1,
            "question": q_text,
            "type": "domain",
            "difficulty": "medium",
            "related_skill": job_domain
        })

    return questions[:count]


def evaluate_answer(question: Dict[str, Any], answer: str, all_answers: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    score = 0
    strengths = []
    weaknesses = []
    suggestions = []

    answer_len = len(answer.strip())

    if answer_len < 50:
        score = 10 + answer_len // 5
        weaknesses.append("回答过于简短，没有充分展开论述")
        suggestions.append("建议从多个维度详细阐述，每个论点最好有具体案例支撑")
    elif answer_len < 150:
        score = 30 + answer_len // 10
        weaknesses.append("回答有一定内容，但深度和广度有待提升")
        suggestions.append("可以增加具体的数据、案例和量化结果来增强说服力")
    elif answer_len < 300:
        score = 50 + answer_len // 20
        strengths.append("回答内容充实，有一定的论述")
    else:
        score = 65 + min(30, answer_len // 50)
        strengths.append("回答内容详尽，论述充分")

    structure_keywords = ["首先", "其次", "最后", "第一", "第二", "第三", "一方面", "另一方面", "综上", "因此"]
    structure_count = sum(1 for kw in structure_keywords if kw in answer)
    if structure_count >= 2:
        score += 5
        strengths.append("回答结构清晰，逻辑性强")
    else:
        weaknesses.append("回答结构不够清晰，建议使用'首先、其次、最后'等连接词组织内容")

    example_keywords = ["例如", "比如", "举例", "在XX项目中", "曾经", "有一次", "具体来说"]
    has_example = any(kw in answer for kw in example_keywords)
    if has_example:
        score += 5
        strengths.append("回答中包含具体案例，论证有力")
    else:
        weaknesses.append("缺少具体案例支撑，建议补充实际工作中的例子")

    data_keywords = re.findall(r"\d+[%个万元次]|提升了\d+|降低了\d+|优化了\d+", answer)
    if data_keywords:
        score += 5
        strengths.append("回答中包含量化数据，结果导向明确")

    question_type = question.get("type", "general")
    if question_type == "technical":
        skill = question.get("related_skill", "")
        if skill and skill.lower() in answer.lower():
            score += 3
        if len(re.findall(r"架构|设计|方案|优化|解决", answer)) >= 2:
            strengths.append("技术深度足够，能够从系统层面思考问题")

    score = min(100, max(0, score))

    return {
        "score": score,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": suggestions,
        "analysis": {
            "length": answer_len,
            "structure_score": structure_count * 10,
            "has_example": has_example,
            "has_data": len(data_keywords) > 0
        }
    }


def evaluate_session(questions: List[Dict[str, Any]], answers: List[Dict[str, Any]]) -> Dict[str, Any]:
    total_score = 0
    all_strengths = []
    all_weaknesses = []
    all_suggestions = []
    type_scores = {"technical": [], "behavioral": [], "situational": [], "domain": []}

    answer_map = {a["question_id"]: a["answer"] for a in answers}

    for q in questions:
        answer_text = answer_map.get(q["id"], "")
        eval_result = evaluate_answer(q, answer_text)
        total_score += eval_result["score"]
        all_strengths.extend(eval_result["strengths"])
        all_weaknesses.extend(eval_result["weaknesses"])
        all_suggestions.extend(eval_result["suggestions"])

        q_type = q.get("type", "general")
        if q_type in type_scores:
            type_scores[q_type].append(eval_result["score"])

    avg_score = total_score / max(1, len(questions))

    type_avg_scores = {}
    for t, scores in type_scores.items():
        if scores:
            type_avg_scores[t] = sum(scores) / len(scores)

    unique_strengths = list(dict.fromkeys(all_strengths))[:5]
    unique_weaknesses = list(dict.fromkeys(all_weaknesses))[:5]
    unique_suggestions = list(dict.fromkeys(all_suggestions))[:5]

    overall_assessment = ""
    if avg_score >= 80:
        overall_assessment = "表现优秀，逻辑清晰，案例丰富，建议进入下一轮面试"
    elif avg_score >= 65:
        overall_assessment = "表现良好，有一定基础，但部分方面需要提升"
    elif avg_score >= 50:
        overall_assessment = "表现一般，需要加强技术深度和表达能力"
    else:
        overall_assessment = "表现欠佳，建议系统学习相关知识并多加练习"

    return {
        "logic_score": round(avg_score, 1),
        "type_scores": type_avg_scores,
        "strengths": unique_strengths,
        "weaknesses": unique_weaknesses,
        "suggestions": unique_suggestions,
        "overall_assessment": overall_assessment,
        "completed_at": datetime.utcnow().isoformat()
    }
