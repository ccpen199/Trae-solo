import re
from typing import List, Dict, Any


POSITION_SKILL_MAP = {
    "初级工程师": {
        "required": ["数据结构", "算法", "SQL", "Git"],
        "core": ["Python", "Java", "JavaScript"],
        "tools": ["Linux", "Docker"]
    },
    "中级工程师": {
        "required": ["系统设计", "性能优化", "数据库优化", "测试"],
        "core": ["微服务", "RESTful", "消息队列", "缓存"],
        "tools": ["Kubernetes", "CI/CD", "监控"]
    },
    "高级工程师": {
        "required": ["分布式系统", "高并发", "架构设计", "技术选型"],
        "core": ["微服务架构", "领域驱动设计", "容错设计", "容量规划"],
        "tools": ["云原生", "服务网格", "可观测性"]
    },
    "技术专家": {
        "required": ["技术创新", "专利", "行业标准", "技术布道"],
        "core": ["前沿技术研究", "复杂问题解决", "架构演进"],
        "tools": ["AI/ML", "自动化", "量化分析"]
    },
    "技术负责人": {
        "required": ["团队管理", "技术规划", "跨部门协作", "项目管理"],
        "core": ["战略思考", "人才培养", "成本优化", "风险控制"],
        "tools": ["OKR", "敏捷开发", "流程优化"]
    },
    "架构师": {
        "required": ["系统架构", "技术选型", "性能优化", "安全设计"],
        "core": ["云原生架构", "微服务架构", "数据架构", "高可用设计"],
        "tools": ["TOGAF", "UML", "架构评审"]
    },
    "后端工程师": {
        "required": ["数据结构", "算法", "SQL", "网络编程"],
        "core": ["Java", "Spring Boot", "MySQL", "Redis", "微服务"],
        "tools": ["Docker", "Kubernetes", "Git"]
    },
    "前端工程师": {
        "required": ["HTML/CSS", "JavaScript", "TypeScript", "响应式设计"],
        "core": ["React", "Vue", "Node.js", "Webpack", "性能优化"],
        "tools": ["Git", "CI/CD", "测试框架"]
    },
    "全栈工程师": {
        "required": ["JavaScript", "Node.js", "SQL", "HTTP协议"],
        "core": ["React/Vue", "Express/Koa", "MongoDB", "微服务"],
        "tools": ["Docker", "AWS", "CI/CD"]
    },
    "算法工程师": {
        "required": ["数据结构", "算法", "机器学习", "统计学"],
        "core": ["Python", "TensorFlow", "PyTorch", "特征工程"],
        "tools": ["Jupyter", "SQL", "实验平台"]
    },
    "大模型工程师": {
        "required": ["深度学习", "Transformer", "NLP", "机器学习"],
        "core": ["Python", "PyTorch", "大模型", "RAG", "微调"],
        "tools": ["CUDA", "分布式训练", "量化技术"]
    },
    "数据工程师": {
        "required": ["SQL", "数据结构", "ETL", "数据仓库"],
        "core": ["Python", "Spark", "Kafka", "Hadoop"],
        "tools": ["Airflow", "Flink", "BI工具"]
    }
}

LEARNING_RESOURCES = {
    "Python": [
        {"name": "Python官方教程", "type": "文档", "url": "https://docs.python.org/", "level": "beginner"},
        {"name": "流畅的Python", "type": "书籍", "url": "#", "level": "intermediate"},
        {"name": "Python高级编程", "type": "课程", "url": "#", "level": "advanced"}
    ],
    "Java": [
        {"name": "Java核心技术", "type": "书籍", "url": "#", "level": "beginner"},
        {"name": "Spring官方文档", "type": "文档", "url": "https://spring.io/", "level": "intermediate"},
        {"name": "Java并发编程实战", "type": "书籍", "url": "#", "level": "advanced"}
    ],
    "JavaScript": [
        {"name": "MDN Web文档", "type": "文档", "url": "https://developer.mozilla.org/", "level": "beginner"},
        {"name": "你不知道的JavaScript", "type": "书籍", "url": "#", "level": "intermediate"},
        {"name": "TypeScript深入理解", "type": "课程", "url": "#", "level": "advanced"}
    ],
    "算法": [
        {"name": "LeetCode", "type": "练习", "url": "https://leetcode.cn/", "level": "all"},
        {"name": "算法导论", "type": "书籍", "url": "#", "level": "advanced"},
        {"name": "剑指Offer", "type": "书籍", "url": "#", "level": "intermediate"}
    ],
    "系统设计": [
        {"name": "系统设计面试", "type": "书籍", "url": "#", "level": "intermediate"},
        {"name": "DDIA", "type": "书籍", "url": "#", "level": "advanced"},
        {"name": "Grokking系统设计", "type": "课程", "url": "#", "level": "intermediate"}
    ],
    "微服务": [
        {"name": "微服务设计", "type": "书籍", "url": "#", "level": "intermediate"},
        {"name": "Spring Cloud官方文档", "type": "文档", "url": "#", "level": "intermediate"},
        {"name": "Istio实战", "type": "课程", "url": "#", "level": "advanced"}
    ],
    "大模型": [
        {"name": "Hugging Face教程", "type": "文档", "url": "https://huggingface.co/", "level": "intermediate"},
        {"name": "Transformer论文精读", "type": "论文", "url": "#", "level": "advanced"},
        {"name": "LLM应用开发", "type": "课程", "url": "#", "level": "intermediate"}
    ],
    "Kubernetes": [
        {"name": "Kubernetes官方文档", "type": "文档", "url": "https://kubernetes.io/", "level": "intermediate"},
        {"name": "Kubernetes权威指南", "type": "书籍", "url": "#", "level": "advanced"},
        {"name": "CKA认证课程", "type": "课程", "url": "#", "level": "intermediate"}
    ],
    "MySQL": [
        {"name": "MySQL官方文档", "type": "文档", "url": "https://dev.mysql.com/doc/", "level": "beginner"},
        {"name": "高性能MySQL", "type": "书籍", "url": "#", "level": "advanced"},
        {"name": "MySQL技术内幕", "type": "书籍", "url": "#", "level": "advanced"}
    ],
    "Redis": [
        {"name": "Redis官方文档", "type": "文档", "url": "https://redis.io/docs/", "level": "intermediate"},
        {"name": "Redis设计与实现", "type": "书籍", "url": "#", "level": "advanced"},
        {"name": "Redis实战", "type": "书籍", "url": "#", "level": "intermediate"}
    ]
}

DEFAULT_RESOURCES = [
    {"name": "Coursera专业课程", "type": "课程", "url": "https://coursera.org/", "level": "all"},
    {"name": "极客时间专栏", "type": "专栏", "url": "https://time.geekbang.org/", "level": "all"},
    {"name": "GitHub开源项目", "type": "实践", "url": "https://github.com/", "level": "all"}
]


def get_position_level(position: str) -> str:
    position = position.lower()
    if "初级" in position or "junior" in position or "实习" in position:
        return "初级"
    elif "高级" in position or "senior" in position or "专家" in position:
        return "高级"
    elif "资深" in position or "lead" in position or "负责人" in position:
        return "资深"
    elif "架构" in position or "architect" in position:
        return "架构"
    elif "经理" in position or "manager" in position or "总监" in position:
        return "管理"
    else:
        return "中级"


def get_required_skills(target_position: str) -> List[str]:
    skills = []
    target_lower = target_position

    for pos, skill_groups in POSITION_SKILL_MAP.items():
        if pos in target_lower or target_lower in pos:
            for group in ["required", "core", "tools"]:
                skills.extend(skill_groups.get(group, []))

    if not skills:
        level = get_position_level(target_position)
        if level == "初级":
            skills = POSITION_SKILL_MAP["初级工程师"]["required"] + POSITION_SKILL_MAP["初级工程师"]["core"]
        elif level == "高级":
            skills = POSITION_SKILL_MAP["高级工程师"]["required"] + POSITION_SKILL_MAP["高级工程师"]["core"]
        elif level == "架构":
            skills = POSITION_SKILL_MAP["架构师"]["required"] + POSITION_SKILL_MAP["架构师"]["core"]
        else:
            skills = POSITION_SKILL_MAP["中级工程师"]["required"] + POSITION_SKILL_MAP["中级工程师"]["core"]

    return list(dict.fromkeys(skills))[:15]


def find_skill_gaps(current_skills: List[str], target_position: str) -> List[Dict[str, Any]]:
    required = get_required_skills(target_position)
    current_set = set(s.lower() for s in current_skills)

    gaps = []
    for i, skill in enumerate(required):
        if skill.lower() not in current_set:
            priority = "critical" if i < 5 else "important" if i < 10 else "nice_to_have"
            gaps.append({
                "skill": skill,
                "priority": priority,
                "estimated_weeks": 2 if priority == "critical" else 4 if priority == "important" else 6,
                "resources": get_resources_for_skill(skill)
            })

    return gaps


def get_resources_for_skill(skill: str) -> List[Dict[str, Any]]:
    for key in LEARNING_RESOURCES:
        if key.lower() in skill.lower() or skill.lower() in key.lower():
            return LEARNING_RESOURCES[key]
    return DEFAULT_RESOURCES


def generate_roadmap(skill_gaps: List[Dict[str, Any]], target_position: str) -> List[Dict[str, Any]]:
    roadmap = []
    months = ["第1-3个月", "第4-6个月", "第7-12个月"]

    critical_gaps = [g for g in skill_gaps if g["priority"] == "critical"]
    important_gaps = [g for g in skill_gaps if g["priority"] == "important"]
    nice_gaps = [g for g in skill_gaps if g["priority"] == "nice_to_have"]

    roadmap.append({
        "period": months[0],
        "focus": "核心基础提升",
        "skills": [g["skill"] for g in critical_gaps[:4]],
        "actions": [
            "系统学习核心技术栈，完成2-3个实战项目",
            "每周刷10-15道算法题，重点是数组、链表、树",
            "参与技术社区分享，建立技术影响力"
        ],
        "milestone": f"掌握{target_position}核心技能，能够独立完成中等复杂度任务"
    })

    roadmap.append({
        "period": months[1],
        "focus": "深度能力拓展",
        "skills": [g["skill"] for g in important_gaps[:4]],
        "actions": [
            "深入学习系统设计和架构知识",
            "主导1-2个中型项目的技术方案设计",
            "阅读3-5本技术经典书籍，建立知识体系"
        ],
        "milestone": f"具备{target_position}的系统设计能力，能够带领小团队完成项目"
    })

    roadmap.append({
        "period": months[2],
        "focus": "综合能力突破",
        "skills": [g["skill"] for g in nice_gaps[:3]] + ["软技能", "行业视野"],
        "actions": [
            "参与开源项目贡献，积累社区影响力",
            "学习项目管理和团队协作方法论",
            "建立个人技术品牌，定期输出技术文章"
        ],
        "milestone": f"达到{target_position}的综合能力要求，可以开始投递目标岗位"
    })

    return roadmap


def create_career_plan(current_position: str, target_position: str, current_skills: List[str]) -> Dict[str, Any]:
    skill_gaps = find_skill_gaps(current_skills, target_position)

    learning_resources = []
    for gap in skill_gaps[:6]:
        learning_resources.append({
            "skill": gap["skill"],
            "priority": gap["priority"],
            "resources": gap["resources"]
        })

    roadmap = generate_roadmap(skill_gaps, target_position)

    current_level = get_position_level(current_position)
    target_level = get_position_level(target_position)

    difficulty = "easy"
    if current_level == "初级" and target_level in ["高级", "资深", "架构", "管理"]:
        difficulty = "hard"
    elif current_level == "中级" and target_level in ["资深", "架构", "管理"]:
        difficulty = "medium"
    elif current_level == target_level:
        difficulty = "easy"

    estimated_months = 3 if difficulty == "easy" else 6 if difficulty == "medium" else 12

    return {
        "current_position": current_position,
        "target_position": target_position,
        "current_level": current_level,
        "target_level": target_level,
        "transition_difficulty": difficulty,
        "estimated_months": estimated_months,
        "skill_gaps": skill_gaps,
        "learning_resources": learning_resources,
        "roadmap": roadmap,
        "success_probability": 85 if difficulty == "easy" else 70 if difficulty == "medium" else 55,
        "recommendations": [
            f"建议每周投入至少10小时用于技能提升",
            f"重点突破前{min(5, len(skill_gaps))}项核心技能缺口",
            "理论学习与实战项目相结合，积累可展示的作品集",
            "建立人脉网络，寻找目标岗位的内推机会"
        ]
    }
