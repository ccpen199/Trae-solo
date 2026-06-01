import re
import hashlib
import json
from typing import List, Dict, Any, Tuple
from collections import defaultdict
from datetime import datetime, timedelta
import numpy as np


AI_GENERATED_PATTERNS = [
    r"作为一个AI语言模型",
    r"我是一个AI",
    r"根据我的训练数据",
    r"作为人工智能",
    r"在我的知识范围内",
    r"让我来帮你",
    r"我来为您",
    r"基于以上分析",
    r"综上所述",
    r"总的来说",
    r"首先，其次，最后",
    r"第一，第二，第三",
    r"一方面，另一方面",
]

GLTR_LIKE_FEATURES = {
    "high_perplexity_words": ["赋能", "抓手", "闭环", "生态", "链路", "打法", "底层逻辑", "顶层设计"],
    "repetitive_phrases": ["熟练掌握", "精通", "深入理解", "具有丰富的", "具备扎实的", "拥有多年"],
    "formulaic_structures": [
        r"负责\S+的\S+工作",
        r"参与\S+项目，\S+",
        r"使用\S+技术，\S+",
        r"主导\S+，实现了\S+",
    ]
}

PROJECT_DUPLICATE_THRESHOLD = 0.7
MESSAGE_SPAM_THRESHOLD = 50
MESSAGE_SPAM_WINDOW_HOURS = 24


def calculate_text_hash(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def calculate_similarity(text1: str, text2: str) -> float:
    if not text1 or not text2:
        return 0.0

    words1 = set(re.findall(r'[\u4e00-\u9fa5A-Za-z0-9]+', text1.lower()))
    words2 = set(re.findall(r'[\u4e00-\u9fa5A-Za-z0-9]+', text2.lower()))

    if not words1 or not words2:
        return 0.0

    intersection = len(words1 & words2)
    union = len(words1 | words2)

    return intersection / union if union > 0 else 0.0


def detect_duplicate_projects(projects: List[Dict[str, Any]], companies: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    flags = []
    companies = companies or []
    company_names = [c.get("name", "") for c in companies]

    for i, project1 in enumerate(projects):
        project_name1 = project1.get("name", "")
        project_desc1 = project1.get("description", "")
        project_company1 = project1.get("company", "")

        for j, project2 in enumerate(projects):
            if i >= j:
                continue

            project_name2 = project2.get("name", "")
            project_desc2 = project2.get("description", "")
            project_company2 = project2.get("company", "")

            name_similarity = calculate_similarity(project_name1, project_name2)
            desc_similarity = calculate_similarity(project_desc1, project_desc2)
            combined_similarity = (name_similarity * 0.4 + desc_similarity * 0.6)

            if combined_similarity >= PROJECT_DUPLICATE_THRESHOLD:
                if project_company1 and project_company2 and project_company1 != project_company2:
                    flags.append({
                        "type": "duplicate_project_across_companies",
                        "severity": "high",
                        "message": f"项目'{project_name1}'在不同公司重复出现",
                        "details": {
                            "project1": {
                                "name": project_name1,
                                "company": project_company1
                            },
                            "project2": {
                                "name": project_name2,
                                "company": project_company2
                            },
                            "similarity": round(combined_similarity, 2)
                        }
                    })
                elif not project_company1 or not project_company2:
                    flags.append({
                        "type": "potential_duplicate_project",
                        "severity": "medium",
                        "message": f"项目'{project_name1}'描述高度相似，可能重复",
                        "details": {
                            "similarity": round(combined_similarity, 2)
                        }
                    })

    for project in projects:
        project_name = project.get("name", "")
        project_desc = project.get("description", "")
        project_companies_mentioned = []

        for company in company_names:
            if company and company in project_desc:
                project_companies_mentioned.append(company)

        if len(project_companies_mentioned) > 1:
            flags.append({
                "type": "project_multiple_companies",
                "severity": "medium",
                "message": f"项目'{project_name}'提及多个公司名称，可能注水",
                "details": {
                    "companies_mentioned": project_companies_mentioned
                }
            })

    return flags


def detect_ai_generated_content(text: str, projects: List[Dict[str, Any]] = None) -> Tuple[float, List[Dict[str, Any]]]:
    flags = []
    score = 0.0

    text_lower = text.lower()

    pattern_hits = 0
    for pattern in AI_GENERATED_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            pattern_hits += 1

    if pattern_hits > 0:
        score += pattern_hits * 0.1
        flags.append({
            "type": "ai_pattern_detected",
            "severity": "low",
            "message": f"检测到{pattern_hits}处AI生成文本特征",
            "details": {"pattern_count": pattern_hits}
        })

    buzzword_count = sum(1 for word in GLTR_LIKE_FEATURES["high_perplexity_words"]
                        if word in text)
    if buzzword_count >= 3:
        score += buzzword_count * 0.05
        flags.append({
            "type": "high_buzzword_density",
            "severity": "medium",
            "message": "文本中高频使用行业黑话，疑似AI生成",
            "details": {"buzzwords_found": buzzword_count}
        })

    repetitive_count = sum(1 for phrase in GLTR_LIKE_FEATURES["repetitive_phrases"]
                          if text.count(phrase) >= 3)
    if repetitive_count >= 2:
        score += repetitive_count * 0.08
        flags.append({
            "type": "repetitive_phrases",
            "severity": "low",
            "message": "文本中存在大量套话和重复性表达",
            "details": {"repetitive_count": repetitive_count}
        })

    formulaic_count = 0
    for pattern in GLTR_LIKE_FEATURES["formulaic_structures"]:
        hits = len(re.findall(pattern, text))
        formulaic_count += hits

    if formulaic_count >= 5:
        score += min(0.3, formulaic_count * 0.03)
        flags.append({
            "type": "formulaic_structure",
            "severity": "low",
            "message": "文本结构过于公式化，可能使用模板生成",
            "details": {"formulaic_count": formulaic_count}
        })

    paragraphs = re.split(r'\n\s*\n', text.strip())
    if paragraphs:
        avg_paragraph_len = np.mean([len(p) for p in paragraphs])
        if avg_paragraph_len < 50 and len(paragraphs) > 10:
            score += 0.1
            flags.append({
                "type": "too_many_short_paragraphs",
                "severity": "low",
                "message": "段落过多且过短，不符合真实简历风格",
                "details": {"avg_length": round(avg_paragraph_len, 1)}
            })

    sentences = re.split(r'[。！？.!?]', text)
    if sentences:
        sentence_lengths = [len(s.strip()) for s in sentences if s.strip()]
        if sentence_lengths:
            length_std = np.std(sentence_lengths)
            if length_std < 10 and len(sentence_lengths) > 5:
                score += 0.15
                flags.append({
                    "type": "sentence_length_uniformity",
                    "severity": "medium",
                    "message": "句子长度高度一致，AI生成特征明显",
                    "details": {"length_std": round(length_std, 2)}
                })

    if projects:
        for project in projects:
            desc = project.get("description", "")
            first_person_hits = len(re.findall(r'我|我们|my|our', desc))
            if len(desc) > 200 and first_person_hits == 0:
                score += 0.05
                flags.append({
                    "type": "impersonal_writing",
                    "severity": "low",
                    "message": f"项目'{project.get('name', '未知')}'缺少第一人称叙述",
                    "details": {"project": project.get("name")}
                })

    score = min(1.0, max(0.0, score))

    return score, flags


def detect_exaggeration(text: str, projects: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    flags = []

    exaggeration_patterns = [
        (r"精通\s*(?:\S+\s+){5,}", "过多使用'精通'，技能描述可能夸大"),
        (r"领导.*团队.*完成.*\d{4,}", "可能夸大项目规模和个人贡献"),
        (r"负责.*公司.*核心业务", "需要验证是否真正负责核心业务"),
        (r"从0到1.*搭建", "需要验证是否真的是从0到1"),
        (r"日活.*千万|亿级", "数据量级需要验证"),
        (r"性能提升.*(?:200|300|500|1000)%", "性能提升幅度需要验证"),
        (r"节省.*(?:百万|千万|亿)", "成本节约数据需要验证"),
    ]

    for pattern, message in exaggeration_patterns:
        if re.search(pattern, text):
            flags.append({
                "type": "content_exaggeration",
                "severity": "medium",
                "message": message,
                "details": {"pattern": pattern}
            })

    if projects:
        for project in projects:
            desc = project.get("description", "")
            tech_stack = project.get("tech_stack", [])

            if len(tech_stack) > 15:
                flags.append({
                    "type": "too_many_tech_stack",
                    "severity": "low",
                    "message": f"项目'{project.get('name', '未知')}'列出了{len(tech_stack)}项技术，可能夸大",
                    "details": {"tech_count": len(tech_stack)}
                })

            duration = project.get("duration", "")
            year_match = re.search(r"(\d{4})\s*[-~至到]\s*(\d{4}|至今)", duration)
            if year_match:
                start = int(year_match.group(1))
                end = 2025 if year_match.group(2) in ["至今", "现在"] else int(year_match.group(2))
                duration_years = max(0, end - start)

                if duration_years <= 0.5 and len(tech_stack) > 10:
                    flags.append({
                        "type": "unrealistic_tech_stack",
                        "severity": "medium",
                        "message": f"项目'{project.get('name', '未知')}'时长不足半年但使用了大量技术",
                        "details": {"duration_years": duration_years, "tech_count": len(tech_stack)}
                    })

    return flags


def check_message_spam(sender_id: int, content: str, messages_query) -> Dict[str, Any]:
    content_hash = calculate_text_hash(content)

    cutoff_time = datetime.utcnow() - timedelta(hours=MESSAGE_SPAM_WINDOW_HOURS)

    same_content_count = messages_query.filter(
        messages_query.column_descriptions[0]['entity'].sender_id == sender_id,
        messages_query.column_descriptions[0]['entity'].content_hash == content_hash,
        messages_query.column_descriptions[0]['entity'].created_at >= cutoff_time
    ).count()

    total_messages = messages_query.filter(
        messages_query.column_descriptions[0]['entity'].sender_id == sender_id,
        messages_query.column_descriptions[0]['entity'].created_at >= cutoff_time
    ).count()

    is_rate_limited = same_content_count >= MESSAGE_SPAM_THRESHOLD

    result = {
        "is_spam": is_rate_limited,
        "same_content_count": same_content_count,
        "total_messages_24h": total_messages,
        "content_hash": content_hash,
        "threshold": MESSAGE_SPAM_THRESHOLD,
        "window_hours": MESSAGE_SPAM_WINDOW_HOURS
    }

    if is_rate_limited:
        result["warning"] = f"用户{sender_id}在24小时内发送相同消息{same_content_count}次，已触发限流"

    return result


def run_anticheat_checks(resume_text: str, projects: List[Dict[str, Any]] = None,
                         companies: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    projects = projects or []
    companies = companies or []

    all_flags = []

    ai_score, ai_flags = detect_ai_generated_content(resume_text, projects)
    all_flags.extend(ai_flags)

    duplicate_flags = detect_duplicate_projects(projects, companies)
    all_flags.extend(duplicate_flags)

    exaggeration_flags = detect_exaggeration(resume_text, projects)
    all_flags.extend(exaggeration_flags)

    severity_counts = defaultdict(int)
    for flag in all_flags:
        severity_counts[flag.get("severity", "low")] += 1

    risk_level = "low"
    if severity_counts["high"] >= 1 or severity_counts["medium"] >= 3:
        risk_level = "high"
    elif severity_counts["medium"] >= 1 or severity_counts["low"] >= 3:
        risk_level = "medium"

    is_valid = risk_level != "high"

    return {
        "ai_generated_score": round(ai_score, 4),
        "risk_level": risk_level,
        "is_valid": is_valid,
        "flag_count": len(all_flags),
        "flags": all_flags,
        "severity_breakdown": dict(severity_counts),
        "checks_completed": [
            "ai_generated_content",
            "duplicate_projects",
            "content_exaggeration"
        ]
    }
