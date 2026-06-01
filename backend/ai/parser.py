import re
import json
import hashlib
from typing import List, Dict, Any
from pypdf import PdfReader
from io import BytesIO


TECH_SKILLS_KEYWORDS = [
    "Python", "Java", "JavaScript", "TypeScript", "Go", "Rust", "C++", "C#", "PHP", "Ruby",
    "React", "Vue", "Angular", "Next.js", "Node.js", "Express", "Django", "Flask", "FastAPI",
    "Spring Boot", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Docker",
    "Kubernetes", "AWS", "Azure", "GCP", "Git", "CI/CD", "Linux", "TensorFlow", "PyTorch",
    "机器学习", "深度学习", "NLP", "大模型", "LLM", "Transformer", "RAG", "微服务",
    "分布式系统", "高并发", "性能优化", "系统设计", "算法", "数据结构",
    "SQL", "NoSQL", "GraphQL", "RESTful", "WebSocket", "Kafka", "RabbitMQ",
    "Hadoop", "Spark", "Flink", "数据仓库", "数据分析", "数据挖掘"
]

SOFT_SKILLS_KEYWORDS = [
    "沟通能力", "团队协作", "领导力", "问题解决", "批判性思维", "创新能力",
    "学习能力", "适应能力", "时间管理", "项目管理", "抗压能力", "责任心",
    "主动性", "执行力", "决策能力", "谈判能力", "演讲能力", "英语流利",
    "跨部门协作", "客户服务", "逻辑思维", "数据分析能力", "结果导向"
]

PROJECT_PATTERNS = [
    r"(?P<name>[\u4e00-\u9fa5A-Za-z0-9]+项目)[：:].*?(?P<desc>[\s\S]*?)(?=[\u4e00-\u9fa5A-Za-z0-9]+项目|工作经历|教育背景|$)",
    r"项目名称[：:]\s*(?P<name>[^\n]+)[\s\S]*?项目描述[：:]\s*(?P<desc>[^\n]+)",
    r"[●•]\s*(?P<name>[\u4e00-\u9fa5A-Za-z0-9]{3,})\s*[：:]\s*(?P<desc>[^\n]+)"
]

COMPANY_PATTERNS = [
    r"(?P<company>[\u4e00-\u9fa5A-Za-z0-9]+(公司|科技|集团|有限责任|股份))",
    r"工作经历[：:].*?(?P<company>[\u4e00-\u9fa5A-Za-z0-9]{2,})\s*[|｜-]",
    r"(?P<company>[A-Z][a-zA-Z\s]+)\s*(Inc|Ltd|LLC|Corp)"
]


def extract_text_from_pdf(file_content: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(file_content))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        return f"PDF解析错误: {str(e)}"


def extract_text_from_image(file_content: bytes) -> str:
    try:
        from PIL import Image
        import pytesseract
        image = Image.open(BytesIO(file_content))
        text = pytesseract.image_to_string(image, lang='chi_sim+eng')
        return text
    except ImportError:
        return "OCR功能未安装，请安装pytesseract和PIL"
    except Exception as e:
        return f"图片解析错误: {str(e)}"


def extract_skills(text: str) -> List[str]:
    found_skills = []
    text_lower = text.lower()
    for skill in TECH_SKILLS_KEYWORDS:
        if skill.lower() in text_lower and skill not in found_skills:
            found_skills.append(skill)
    return found_skills[:30]


def extract_soft_skills(text: str) -> List[str]:
    found_skills = []
    for skill in SOFT_SKILLS_KEYWORDS:
        if skill in text and skill not in found_skills:
            found_skills.append(skill)
    return found_skills[:15]


def extract_projects(text: str) -> List[Dict[str, Any]]:
    projects = []
    seen_names = set()

    for pattern in PROJECT_PATTERNS:
        for match in re.finditer(pattern, text):
            name = match.group('name').strip() if 'name' in match.groupdict() else f"项目{len(projects)+1}"
            desc = match.group('desc').strip() if 'desc' in match.groupdict() else ""

            if len(name) > 50:
                name = name[:50] + "..."

            if name and name not in seen_names and len(desc) > 10:
                seen_names.add(name)
                tech_stack = extract_skills(desc)
                duration_match = re.search(r"(\d{4})\s*[-~至到]\s*(\d{4}|至今|现在)", desc)
                duration = duration_match.group(0) if duration_match else "未知"

                projects.append({
                    "name": name,
                    "description": desc[:300],
                    "tech_stack": tech_stack[:10],
                    "duration": duration,
                    "role": extract_role(desc)
                })

    if not projects:
        lines = text.split('\n')
        current_project = None
        for line in lines:
            line = line.strip()
            if re.match(r'^[●•·-]\s*.+项目', line) or (len(line) > 3 and '项目' in line and len(line) < 50):
                if current_project:
                    projects.append(current_project)
                current_project = {
                    "name": line.strip('●•·- '),
                    "description": "",
                    "tech_stack": [],
                    "duration": "未知",
                    "role": "开发者"
                }
            elif current_project and line:
                current_project["description"] += line + " "
                if not current_project["tech_stack"]:
                    current_project["tech_stack"] = extract_skills(line)
        if current_project:
            projects.append(current_project)

    return projects[:10]


def extract_role(text: str) -> str:
    roles = ["技术负责人", "架构师", "项目经理", "高级工程师", "中级工程师", "初级工程师",
             "全栈工程师", "后端工程师", "前端工程师", "算法工程师", "数据工程师", "开发者"]
    for role in roles:
        if role in text:
            return role
    return "开发者"


def extract_companies(text: str) -> List[Dict[str, Any]]:
    companies = []
    seen = set()
    for pattern in COMPANY_PATTERNS:
        for match in re.finditer(pattern, text):
            company = match.group('company').strip()
            if company and company not in seen and len(company) > 1:
                seen.add(company)
                companies.append({
                    "name": company,
                    "position": extract_position(text, company)
                })
    return companies[:5]


def extract_position(text: str, company: str) -> str:
    idx = text.find(company)
    if idx > 0:
        surrounding = text[max(0, idx-100):idx+100]
        pos_match = re.search(r"([\u4e00-\u9fa5A-Za-z]+工程师|[\u4e00-\u9fa5A-Za-z]+经理|[\u4e00-\u9fa5A-Za-z]+总监|[\u4e00-\u9fa5A-Za-z]+架构师)", surrounding)
        if pos_match:
            return pos_match.group(1)
    return "未知职位"


def generate_radar_data(skills: List[str], projects: List[Dict], soft_skills: List[str]) -> Dict[str, Any]:
    tech_score = min(100, len(skills) * 4)
    project_score = min(100, len(projects) * 12)
    soft_score = min(100, len(soft_skills) * 8)

    advanced_skills = [s for s in skills if s in ["机器学习", "深度学习", "大模型", "LLM", "Kubernetes", "微服务", "分布式系统", "高并发"]]
    depth_score = min(100, len(advanced_skills) * 18)

    experience_score = min(100, sum(len(p.get("description", "")) for p in projects) // 20)

    return {
        "dimensions": [
            {"name": "技术广度", "score": tech_score, "max": 100},
            {"name": "项目经验", "score": project_score, "max": 100},
            {"name": "技术深度", "score": depth_score, "max": 100},
            {"name": "软技能", "score": soft_score, "max": 100},
            {"name": "经验丰富度", "score": experience_score, "max": 100}
        ],
        "overall_score": (tech_score + project_score + depth_score + soft_score + experience_score) // 5
    }


def parse_resume(file_content: bytes, file_name: str, file_type: str) -> Dict[str, Any]:
    if file_type == 'application/pdf' or file_name.lower().endswith('.pdf'):
        raw_text = extract_text_from_pdf(file_content)
    elif file_type.startswith('image/') or file_name.lower().endswith(('.png', '.jpg', '.jpeg')):
        raw_text = extract_text_from_image(file_content)
    else:
        try:
            raw_text = file_content.decode('utf-8', errors='ignore')
        except:
            raw_text = str(file_content)

    skills = extract_skills(raw_text)
    soft_skills = extract_soft_skills(raw_text)
    projects = extract_projects(raw_text)
    companies = extract_companies(raw_text)
    radar_data = generate_radar_data(skills, projects, soft_skills)

    return {
        "raw_text": raw_text[:5000],
        "skills": skills,
        "soft_skills": soft_skills,
        "projects": projects,
        "companies": companies,
        "radar_data": radar_data,
        "parsed_data": {
            "name": extract_name(raw_text),
            "phone": extract_phone(raw_text),
            "email": extract_email(raw_text),
            "education": extract_education(raw_text),
            "years_of_experience": estimate_years_experience(raw_text)
        }
    }


def extract_name(text: str) -> str:
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines[:5]:
        if 2 <= len(line) <= 4 and re.match(r'^[\u4e00-\u9fa5]+$', line):
            return line
    match = re.search(r"姓\s*名[：:]\s*([\u4e00-\u9fa5A-Za-z]+)", text)
    return match.group(1) if match else "未知"


def extract_phone(text: str) -> str:
    match = re.search(r"1[3-9]\d{9}", text)
    return match.group(0) if match else "未知"


def extract_email(text: str) -> str:
    match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else "未知"


def extract_education(text: str) -> List[str]:
    education = []
    schools = re.findall(r"([\u4e00-\u9fa5]+大学|[\u4e00-\u9fa5]+学院|[\u4e00-\u9fa5]+学校)", text)
    degrees = re.findall(r"(博士|硕士|本科|专科|高中)", text)
    for s in schools[:3]:
        edu = s
        if degrees:
            edu += " " + degrees[0]
        education.append(edu)
    return education


def estimate_years_experience(text: str) -> float:
    match = re.search(r"(\d+)\s*年.*?(工作|经验)", text)
    if match:
        return float(match.group(1))
    years = re.findall(r"(\d{4})\s*[-~至到]\s*(\d{4}|至今|现在)", text)
    if years:
        total = 0
        for start, end in years:
            end_year = 2025 if end in ["至今", "现在"] else int(end)
            total += max(0, end_year - int(start))
        return total / max(1, len(years))
    return 0.0


def text_hash(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()
