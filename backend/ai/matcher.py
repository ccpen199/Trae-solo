import re
import json
from typing import List, Dict, Any, Tuple
from collections import defaultdict
import numpy as np


QUERY_SKILL_PATTERNS = {
    "大模型": ["大模型", "LLM", "Transformer", "RAG", "微调", "预训练", "Prompt Engineering"],
    "微调": ["微调", "fine-tuning", "LoRA", "QLoRA", "PEFT"],
    "Python": ["Python", "Django", "Flask", "FastAPI", "PyTorch", "TensorFlow"],
    "Java": ["Java", "Spring Boot", "Spring Cloud", "JVM", "MyBatis"],
    "前端": ["React", "Vue", "JavaScript", "TypeScript", "Next.js", "Node.js"],
    "算法": ["算法", "数据结构", "机器学习", "深度学习", "NLP", "CV"],
    "数据": ["数据仓库", "ETL", "Spark", "Hadoop", "Flink", "Kafka"],
    "云原生": ["Docker", "Kubernetes", "CI/CD", "微服务", "DevOps"],
    "架构": ["系统架构", "高并发", "分布式系统", "微服务架构", "性能优化"],
    "全栈": ["Node.js", "React", "Vue", "MongoDB", "Express"]
}


def parse_query(query: str) -> Dict[str, Any]:
    query_lower = query.lower()
    required_skills = []
    keywords = []
    excluded_terms = []

    for term, related_skills in QUERY_SKILL_PATTERNS.items():
        if term.lower() in query_lower:
            keywords.append(term)
            required_skills.extend(related_skills)

    for skill in ["Python", "Java", "C++", "Go", "Rust", "JavaScript", "TypeScript",
                  "React", "Vue", "Angular", "Next.js", "Node.js", "Spring Boot",
                  "Django", "Flask", "FastAPI", "MySQL", "PostgreSQL", "MongoDB",
                  "Redis", "Kafka", "Kubernetes", "Docker", "AWS", "Azure", "GCP",
                  "机器学习", "深度学习", "NLP", "CV", "大模型", "算法"]:
        if skill.lower() in query_lower and skill not in required_skills:
            required_skills.append(skill)

    position_match = re.search(r"(工程师|架构师|设计师|产品经理|运营|分析师|专家|负责人)", query)
    position_type = position_match.group(1) if position_match else "工程师"

    seniority = "中级"
    if "资深" in query or "高级" in query or "senior" in query_lower:
        seniority = "高级"
    elif "专家" in query or "lead" in query_lower or "principal" in query_lower:
        seniority = "专家"
    elif "初级" in query or "junior" in query_lower:
        seniority = "初级"

    experience_years = None
    exp_match = re.search(r"(\d+)\s*年.*?(经验|以上|工作)", query)
    if exp_match:
        experience_years = int(exp_match.group(1))

    return {
        "original_query": query,
        "keywords": keywords,
        "required_skills": list(dict.fromkeys(required_skills)),
        "position_type": position_type,
        "seniority": seniority,
        "experience_years": experience_years,
        "excluded_terms": excluded_terms
    }


def calculate_match_score(query_parsed: Dict[str, Any], resume: Any) -> Tuple[float, List[str], List[str]]:
    score = 0
    matched_skills = []
    highlight_projects = []

    resume_skills = resume.skills or []
    resume_projects = resume.projects or []
    resume_soft_skills = resume.soft_skills or []
    parsed_data = resume.parsed_data or {}

    skill_set = set(s.lower() for s in resume_skills)

    for skill in query_parsed["required_skills"]:
        if skill.lower() in skill_set:
            matched_skills.append(skill)
            score += 10
        elif any(skill.lower() in s.lower() for s in skill_set):
            matched_skills.append(skill)
            score += 5

    skill_match_ratio = len(matched_skills) / max(1, len(query_parsed["required_skills"]))
    score += skill_match_ratio * 30

    for project in resume_projects:
        project_name = project.get("name", "")
        project_desc = project.get("description", "")
        project_tech = project.get("tech_stack", [])

        tech_hits = sum(1 for s in query_parsed["required_skills"]
                       if s.lower() in [t.lower() for t in project_tech])

        keyword_hits = sum(1 for kw in query_parsed["keywords"]
                          if kw.lower() in project_name.lower() or kw.lower() in project_desc.lower())

        if tech_hits > 0 or keyword_hits > 0:
            highlight_projects.append(project_name)
            score += (tech_hits + keyword_hits) * 3

    years_exp = parsed_data.get("years_of_experience", 0)
    required_exp = query_parsed["experience_years"] or 3

    if years_exp >= required_exp:
        score += 15
    elif years_exp >= required_exp * 0.7:
        score += 8
    else:
        score -= 10

    if query_parsed["seniority"] == "高级" and years_exp >= 5:
        score += 10
    elif query_parsed["seniority"] == "专家" and years_exp >= 8:
        score += 15

    radar_data = resume.radar_data or {}
    overall_score = radar_data.get("overall_score", 0)
    score += overall_score * 0.2

    if resume.ai_generated_score and resume.ai_generated_score > 0.8:
        score -= 15

    if resume.anticheat_flags:
        flags_count = len(resume.anticheat_flags)
        score -= flags_count * 10

    final_score = min(100, max(0, score))

    return final_score, matched_skills, highlight_projects


def generate_candidate_brief(resume: Any, match_score: float, matched_skills: List[str],
                             highlight_projects: List[str], query_parsed: Dict[str, Any]) -> Dict[str, Any]:
    parsed_data = resume.parsed_data or {}
    radar_data = resume.radar_data or {}

    name = parsed_data.get("name", "候选人")
    years_exp = parsed_data.get("years_of_experience", 0)
    education = parsed_data.get("education", [])
    companies = parsed_data.get("companies", []) if parsed_data else []

    strengths = []
    if match_score >= 80:
        strengths.append("技能高度匹配，几乎涵盖所有要求")
    elif match_score >= 60:
        strengths.append("核心技能匹配度较高")

    if matched_skills:
        strengths.append(f"掌握关键技能: {', '.join(matched_skills[:5])}")

    if highlight_projects:
        strengths.append(f"相关项目经验丰富: {', '.join(highlight_projects[:2])}")

    if years_exp >= (query_parsed["experience_years"] or 3):
        strengths.append(f"工作经验{years_exp}年，满足岗位要求")

    weaknesses = []
    if match_score < 60:
        weaknesses.append("技能匹配度有待提升")

    missing_skills = [s for s in query_parsed["required_skills"] if s not in matched_skills]
    if missing_skills:
        weaknesses.append(f"缺少技能: {', '.join(missing_skills[:3])}")

    if years_exp < (query_parsed["experience_years"] or 3):
        weaknesses.append(f"经验不足，期望{query_parsed['experience_years']}年，实际{years_exp}年")

    brief_parts = [
        f"{name}，{years_exp}年工作经验",
    ]
    if education:
        brief_parts.append(f"教育背景: {education[0]}")
    if companies:
        brief_parts.append(f"曾就职于: {companies[0].get('name', '未知')}")
    if matched_skills:
        brief_parts.append(f"核心技能: {', '.join(matched_skills[:5])}")

    brief_summary = "。".join(brief_parts)

    return {
        "resume_id": resume.id,
        "candidate_name": name,
        "match_score": round(match_score, 1),
        "skills_match": matched_skills,
        "missing_skills": missing_skills,
        "highlight_projects": highlight_projects,
        "years_of_experience": years_exp,
        "education": education[:2],
        "previous_companies": [c.get("name", "") for c in companies[:3]],
        "overall_score": radar_data.get("overall_score", 0),
        "strengths": strengths,
        "weaknesses": weaknesses,
        "brief_summary": brief_summary,
        "screening_recommendation": "强烈推荐面试" if match_score >= 80 else
                                    "推荐面试" if match_score >= 65 else
                                    "可以考虑" if match_score >= 50 else "不推荐",
        "ai_generated_score": resume.ai_generated_score,
        "anticheat_flags": resume.anticheat_flags
    }


def search_talent(query: str, resumes: List[Any], company_id: int = None, limit: int = 20) -> Dict[str, Any]:
    query_parsed = parse_query(query)

    results = []
    for resume in resumes:
        if not resume.is_valid:
            continue

        score, matched_skills, highlight_projects = calculate_match_score(query_parsed, resume)
        if score >= 30:
            brief = generate_candidate_brief(resume, score, matched_skills, highlight_projects, query_parsed)
            results.append(brief)

    results.sort(key=lambda x: x["match_score"], reverse=True)

    return {
        "query_parsed": query_parsed,
        "total_matched": len(results),
        "candidates": results[:limit],
        "search_summary": {
            "high_match": sum(1 for r in results if r["match_score"] >= 80),
            "medium_match": sum(1 for r in results if 60 <= r["match_score"] < 80),
            "low_match": sum(1 for r in results if r["match_score"] < 60),
            "top_skills": sorted(query_parsed["required_skills"],
                                key=lambda s: sum(1 for r in results if s in r["skills_match"]),
                                reverse=True)[:5]
        }
    }
