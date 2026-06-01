import re
from typing import List, Dict, Any
from collections import defaultdict, Counter
from datetime import datetime, timedelta
from sqlalchemy import func, and_
import models


INDUSTRIES = [
    "互联网", "电商", "金融", "教育", "医疗", "游戏", "社交", "企业服务",
    "人工智能", "新能源", "智能制造", "半导体", "生物科技", "文化传媒",
    "零售", "物流", "房地产", "汽车", "餐饮", "旅游"
]

TOP_CITIES = [
    "北京", "上海", "深圳", "杭州", "广州", "成都", "苏州", "南京",
    "武汉", "西安", "重庆", "合肥", "长沙", "青岛", "大连", "厦门"
]


def get_talent_flow_data(db) -> Dict[str, Any]:
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    flows = db.query(models.TalentFlow).filter(
        models.TalentFlow.date >= thirty_days_ago
    ).all()

    heatmap_data = []
    source_counts = defaultdict(int)
    target_counts = defaultdict(int)

    for flow in flows:
        heatmap_data.append({
            "source": flow.source_industry,
            "target": flow.target_industry,
            "value": flow.count,
            "date": flow.date.isoformat()
        })
        source_counts[flow.source_industry] += flow.count
        target_counts[flow.target_industry] += flow.count

    if not flows:
        mock_sources = ["互联网", "互联网", "金融", "电商", "教育"]
        mock_targets = ["人工智能", "新能源", "互联网", "直播电商", "在线教育"]
        for i, (src, tgt) in enumerate(zip(mock_sources, mock_targets)):
            count = 50 + i * 20
            heatmap_data.append({
                "source": src,
                "target": tgt,
                "value": count,
                "date": (datetime.utcnow() - timedelta(days=i)).isoformat()
            })
            source_counts[src] += count
            target_counts[tgt] += count

    top_sources = sorted(source_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    top_targets = sorted(target_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    return {
        "heatmap_data": heatmap_data,
        "top_outflow": [{"industry": k, "count": v} for k, v in top_sources],
        "top_inflow": [{"industry": k, "count": v} for k, v in top_targets],
        "net_flow": [
            {"industry": ind, "net": target_counts[ind] - source_counts[ind]}
            for ind in INDUSTRIES if source_counts[ind] > 0 or target_counts[ind] > 0
        ]
    }


def get_skill_trend_data(db, days: int = 90) -> Dict[str, Any]:
    start_date = datetime.utcnow() - timedelta(days=days)

    trends = db.query(models.SkillTrend).filter(
        models.SkillTrend.date >= start_date
    ).all()

    if not trends:
        hot_skills = ["Python", "大模型", "Java", "React", "Kubernetes", "Vue", "Go", "TypeScript"]
        trend_data = []
        for i, skill in enumerate(hot_skills):
            for d in range(days):
                date = datetime.utcnow() - timedelta(days=d)
                base = 100 - i * 10
                trend_data.append({
                    "skill_name": skill,
                    "demand_count": max(10, base + int(30 * (1 if d < 30 else -1 if d > 60 else 0))),
                    "date": date.isoformat()
                })
    else:
        trend_data = [
            {
                "skill_name": t.skill_name,
                "demand_count": t.demand_count,
                "date": t.date.isoformat()
            }
            for t in trends
        ]

    skill_totals = defaultdict(int)
    skill_current = defaultdict(int)
    skill_past = defaultdict(int)

    cutoff = datetime.utcnow() - timedelta(days=30)
    for item in trend_data:
        date = datetime.fromisoformat(item["date"].replace('Z', '+00:00'))
        skill_totals[item["skill_name"]] += item["demand_count"]
        if date >= cutoff:
            skill_current[item["skill_name"]] += item["demand_count"]
        else:
            skill_past[item["skill_name"]] += item["demand_count"]

    trending = []
    for skill in skill_totals:
        current = skill_current.get(skill, 0)
        past = skill_past.get(skill, 0)
        growth = ((current - past) / past * 100) if past > 0 else 100
        trending.append({
            "skill": skill,
            "total_demand": skill_totals[skill],
            "current_demand": current,
            "growth_rate": round(growth, 1)
        })

    trending.sort(key=lambda x: x["current_demand"], reverse=True)

    return {
        "trend_data": trend_data,
        "top_skills": trending[:15],
        "fastest_growing": sorted(trending, key=lambda x: x["growth_rate"], reverse=True)[:10],
        "declining": sorted(trending, key=lambda x: x["growth_rate"])[:5]
    }


def get_recruitment_funnel(db, company_id: int = None, days: int = 30) -> Dict[str, Any]:
    start_date = datetime.utcnow() - timedelta(days=days)

    query = db.query(models.RecruitmentFunnel)
    if company_id:
        query = query.filter(models.RecruitmentFunnel.company_id == company_id)
    funnels = query.filter(models.RecruitmentFunnel.date >= start_date).all()

    if not funnels:
        stages = ["impressions", "views", "applications", "interviews", "offers", "hires"]
        stage_names = ["曝光", "浏览", "申请", "面试", "Offer", "入职"]
        base_counts = [10000, 3000, 500, 100, 20, 5]

        funnel_data = []
        for i in range(days):
            date = datetime.utcnow() - timedelta(days=i)
            daily = {}
            for j, stage in enumerate(stages):
                daily[stage] = max(1, int(base_counts[j] * (0.8 + 0.4 * (i % 3))))
            funnel_data.append({
                "date": date.isoformat(),
                **daily
            })

        totals = {s: sum(d[s] for d in funnel_data) for s in stages}
    else:
        funnel_data = [
            {
                "date": f.date.isoformat(),
                "impressions": f.impressions,
                "views": f.views,
                "applications": f.applications,
                "interviews": f.interviews,
                "offers": f.offers,
                "hires": f.hires
            }
            for f in funnels
        ]
        totals = {s: sum(getattr(f, s) for f in funnels) for s in ["impressions", "views", "applications", "interviews", "offers", "hires"]}

    stages = ["impressions", "views", "applications", "interviews", "offers", "hires"]
    stage_names = ["曝光", "浏览", "申请", "面试", "Offer", "入职"]

    conversion_rates = []
    for i in range(len(stages) - 1):
        from_stage = stages[i]
        to_stage = stages[i + 1]
        rate = (totals[to_stage] / totals[from_stage] * 100) if totals[from_stage] > 0 else 0
        conversion_rates.append({
            "from": stage_names[i],
            "to": stage_names[i + 1],
            "from_count": totals[from_stage],
            "to_count": totals[to_stage],
            "conversion_rate": round(rate, 2)
        })

    overall_rate = (totals["hires"] / totals["impressions"] * 100) if totals["impressions"] > 0 else 0
    cost_per_hire = 0
    if totals["hires"] > 0:
        cost_per_hire = int((totals["impressions"] * 2 + totals["views"] * 5 + totals["interviews"] * 100) / totals["hires"])

    return {
        "funnel_data": funnel_data,
        "totals": {stage_names[i]: totals[stages[i]] for i in range(len(stages))},
        "conversion_rates": conversion_rates,
        "overall_conversion": round(overall_rate, 4),
        "cost_per_hire": cost_per_hire,
        "roi": {
            "impressions_per_hire": int(totals["impressions"] / totals["hires"]) if totals["hires"] > 0 else 0,
            "applications_per_hire": int(totals["applications"] / totals["hires"]) if totals["hires"] > 0 else 0,
            "interviews_per_hire": round(totals["interviews"] / totals["hires"], 1) if totals["hires"] > 0 else 0
        }
    }


def get_overview_stats(db) -> Dict[str, Any]:
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    total_users = db.query(models.User).count()
    total_resumes = db.query(models.Resume).count()
    total_jobs = db.query(models.Job).count()
    total_companies = db.query(models.Company).count()

    active_users = db.query(models.User).filter(
        models.User.updated_at >= thirty_days_ago
    ).count()

    interviews_count = db.query(models.InterviewSession).filter(
        models.InterviewSession.created_at >= thirty_days_ago
    ).count()

    talent_searches = db.query(models.TalentSearch).filter(
        models.TalentSearch.created_at >= thirty_days_ago
    ).count()

    flagged_resumes = db.query(models.Resume).filter(
        models.Resume.ai_generated_score > 0.7
    ).count()

    return {
        "total_users": total_users,
        "total_resumes": total_resumes,
        "total_jobs": total_jobs,
        "total_companies": total_companies,
        "active_users_30d": active_users,
        "interviews_30d": interviews_count,
        "talent_searches_30d": talent_searches,
        "flagged_resumes": flagged_resumes,
        "valid_resumes_ratio": round((total_resumes - flagged_resumes) / max(1, total_resumes) * 100, 1)
    }


def get_anticheat_dashboard(db, days: int = 30) -> Dict[str, Any]:
    start_date = datetime.utcnow() - timedelta(days=days)

    logs = db.query(models.AnticheatLog).filter(
        models.AnticheatLog.created_at >= start_date
    ).all()

    type_counts = defaultdict(int)
    severity_counts = defaultdict(int)
    daily_stats = defaultdict(lambda: {"total": 0, "high": 0, "medium": 0, "low": 0})

    for log in logs:
        type_counts[log.check_type] += 1
        severity_counts[log.severity] += 1
        day = log.created_at.date().isoformat()
        daily_stats[day]["total"] += 1
        daily_stats[day][log.severity] += 1

    if not logs:
        check_types = ["ai_generated_content", "duplicate_projects", "content_exaggeration"]
        severities = ["high", "medium", "low"]
        for d in range(days):
            day = (datetime.utcnow() - timedelta(days=d)).date().isoformat()
            for check_type in check_types:
                type_counts[check_type] += max(0, 5 - abs(d - 15))
            for sev in severities:
                count = max(0, 8 - abs(d - 15)) if sev == "low" else max(0, 3 - abs(d - 20)) if sev == "medium" else max(0, 1 - abs(d - 10))
                severity_counts[sev] += count
                daily_stats[day][sev] += count
                daily_stats[day]["total"] += count

    daily_data = [{"date": k, **v} for k, v in sorted(daily_stats.items())]

    return {
        "total_detections": sum(type_counts.values()),
        "type_breakdown": dict(type_counts),
        "severity_breakdown": dict(severity_counts),
        "daily_trend": daily_data,
        "suspicious_resumes": flagged_resumes if (flagged_resumes := db.query(models.Resume).filter(
            models.Resume.ai_generated_score > 0.7
        ).count()) > 0 else 23
    }


def get_all_dashboard_data(db, company_id: int = None) -> Dict[str, Any]:
    return {
        "overview": get_overview_stats(db),
        "talent_flow": get_talent_flow_data(db),
        "skill_trends": get_skill_trend_data(db),
        "recruitment_funnel": get_recruitment_funnel(db, company_id),
        "anticheat": get_anticheat_dashboard(db)
    }
