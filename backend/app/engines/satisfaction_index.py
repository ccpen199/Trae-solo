from typing import Dict, Any, Optional, List
from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models import Evaluation, Case, ServiceItem


class SatisfactionIndexEngine:
    """
    Satisfaction-Index 评价引擎
    负责满意度评价收集、统计和展示，包括：
    - 评价提交和验证
    - 满意度指标计算
    - 趋势分析
    - 大屏展示数据准备
    """

    SCORE_LEVELS = {
        1: {"name": "非常不满意", "color": "#DC2626"},
        2: {"name": "不满意", "color": "#EA580C"},
        3: {"name": "一般", "color": "#EAB308"},
        4: {"name": "满意", "color": "#22C55E"},
        5: {"name": "非常满意", "color": "#16A34A"},
    }

    async def submit_evaluation(
        self,
        db: AsyncSession,
        case_id: int,
        citizen_id: int,
        overall_score: int,
        attitude_score: Optional[int] = None,
        efficiency_score: Optional[int] = None,
        environment_score: Optional[int] = None,
        comment: Optional[str] = None,
        is_anonymous: bool = False,
    ) -> Dict[str, Any]:
        """
        提交满意度评价
        """
        if overall_score < 1 or overall_score > 5:
            return {
                "success": False,
                "message": "总体评分必须在1-5之间",
                "error_code": "INVALID_SCORE",
            }

        for score, name in [
            (attitude_score, "服务态度"),
            (efficiency_score, "办事效率"),
            (environment_score, "环境体验"),
        ]:
            if score is not None and (score < 1 or score > 5):
                return {
                    "success": False,
                    "message": f"{name}评分必须在1-5之间",
                    "error_code": "INVALID_SCORE",
                }

        existing_query = select(Evaluation).where(Evaluation.case_id == case_id)
        existing_result = await db.execute(existing_query)
        existing = existing_result.scalar_one_or_none()

        if existing:
            return {
                "success": False,
                "message": "该办件已提交过评价",
                "error_code": "ALREADY_EVALUATED",
            }

        evaluation = Evaluation(
            case_id=case_id,
            citizen_id=citizen_id,
            overall_score=overall_score,
            attitude_score=attitude_score,
            efficiency_score=efficiency_score,
            environment_score=environment_score,
            comment=comment,
            is_anonymous=is_anonymous,
        )
        db.add(evaluation)
        await db.commit()
        await db.refresh(evaluation)

        return {
            "success": True,
            "message": "评价提交成功",
            "evaluation": {
                "id": evaluation.id,
                "overall_score": evaluation.overall_score,
                "score_level": self.SCORE_LEVELS.get(evaluation.overall_score, {}).get("name"),
                "created_at": evaluation.created_at.isoformat(),
            },
        }

    async def get_evaluation_stats(
        self,
        db: AsyncSession,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        service_item_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        获取满意度统计数据
        """
        if start_date is None:
            start_date = date.today() - timedelta(days=30)
        if end_date is None:
            end_date = date.today()

        query = select(Evaluation).where(
            and_(
                Evaluation.created_at >= start_date,
                Evaluation.created_at <= end_date + timedelta(days=1),
            )
        )

        if service_item_id is not None:
            query = query.join(Case).where(Case.service_item_id == service_item_id)

        result = await db.execute(query)
        evaluations = list(result.scalars().all())

        if not evaluations:
            return {
                "total_count": 0,
                "average_score": 0,
                "score_distribution": {str(i): 0 for i in range(1, 6)},
                "satisfaction_rate": 0,
            }

        total_count = len(evaluations)
        total_score = sum(e.overall_score for e in evaluations)
        average_score = round(total_score / total_count, 2)

        score_distribution = {str(i): 0 for i in range(1, 6)}
        for e in evaluations:
            score_distribution[str(e.overall_score)] = (
                score_distribution.get(str(e.overall_score), 0) + 1
            )

        satisfied_count = sum(
            1 for e in evaluations if e.overall_score >= 4
        )
        satisfaction_rate = round(satisfied_count / total_count * 100, 2)

        attitude_scores = [e.attitude_score for e in evaluations if e.attitude_score is not None]
        efficiency_scores = [e.efficiency_score for e in evaluations if e.efficiency_score is not None]
        environment_scores = [e.environment_score for e in evaluations if e.environment_score is not None]

        return {
            "total_count": total_count,
            "average_score": average_score,
            "satisfaction_rate": satisfaction_rate,
            "score_distribution": score_distribution,
            "dimension_scores": {
                "attitude": {
                    "average": round(sum(attitude_scores) / len(attitude_scores), 2) if attitude_scores else 0,
                    "count": len(attitude_scores),
                },
                "efficiency": {
                    "average": round(sum(efficiency_scores) / len(efficiency_scores), 2) if efficiency_scores else 0,
                    "count": len(efficiency_scores),
                },
                "environment": {
                    "average": round(sum(environment_scores) / len(environment_scores), 2) if environment_scores else 0,
                    "count": len(environment_scores),
                },
            },
        }

    async def get_dashboard_data(
        self,
        db: AsyncSession,
    ) -> Dict[str, Any]:
        """
        获取大屏展示所需的实时数据
        """
        today = date.today()
        start_of_month = date(today.year, today.month, 1)

        today_stats = await self.get_evaluation_stats(db, today, today)
        month_stats = await self.get_evaluation_stats(db, start_of_month, today)

        recent_comments_query = (
            select(Evaluation)
            .where(Evaluation.comment.isnot(None))
            .order_by(Evaluation.created_at.desc())
            .limit(10)
        )
        recent_result = await db.execute(recent_comments_query)
        recent_evaluations = list(recent_result.scalars().all())

        recent_comments = []
        for e in recent_evaluations:
            if e.comment:
                recent_comments.append(
                    {
                        "score": e.overall_score,
                        "score_level": self.SCORE_LEVELS.get(e.overall_score, {}).get("name"),
                        "comment": e.comment[:100] + "..." if len(e.comment) > 100 else e.comment,
                        "time": e.created_at.strftime("%Y-%m-%d %H:%M"),
                    }
                )

        trend_data = await self._get_trend_data(db, start_of_month, today)

        return {
            "today": {
                "evaluation_count": today_stats.get("total_count", 0),
                "average_score": today_stats.get("average_score", 0),
                "satisfaction_rate": today_stats.get("satisfaction_rate", 0),
            },
            "month": {
                "evaluation_count": month_stats.get("total_count", 0),
                "average_score": month_stats.get("average_score", 0),
                "satisfaction_rate": month_stats.get("satisfaction_rate", 0),
                "score_distribution": month_stats.get("score_distribution", {}),
            },
            "recent_comments": recent_comments,
            "trend_data": trend_data,
            "update_time": datetime.now().isoformat(),
        }

    async def _get_trend_data(
        self,
        db: AsyncSession,
        start_date: date,
        end_date: date,
    ) -> List[Dict[str, Any]]:
        """
        获取满意度趋势数据
        """
        trend = []
        current = start_date
        while current <= end_date:
            day_stats = await self.get_evaluation_stats(db, current, current)
            trend.append(
                {
                    "date": current.strftime("%Y-%m-%d"),
                    "evaluation_count": day_stats.get("total_count", 0),
                    "average_score": day_stats.get("average_score", 0),
                    "satisfaction_rate": day_stats.get("satisfaction_rate", 0),
                }
            )
            current += timedelta(days=1)

        return trend

    async def get_service_item_ranking(
        self,
        db: AsyncSession,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        top_n: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        获取各事项满意度排名
        """
        if start_date is None:
            start_date = date.today() - timedelta(days=30)
        if end_date is None:
            end_date = date.today()

        query = (
            select(
                ServiceItem.id,
                ServiceItem.item_code,
                ServiceItem.item_name,
                ServiceItem.department,
                func.count(Evaluation.id).label("evaluation_count"),
                func.avg(Evaluation.overall_score).label("average_score"),
            )
            .select_from(ServiceItem)
            .join(Case, Case.service_item_id == ServiceItem.id)
            .join(Evaluation, Evaluation.case_id == Case.id)
            .where(
                and_(
                    Evaluation.created_at >= start_date,
                    Evaluation.created_at <= end_date + timedelta(days=1),
                )
            )
            .group_by(ServiceItem.id)
            .order_by(func.avg(Evaluation.overall_score).desc())
            .limit(top_n)
        )

        result = await db.execute(query)
        rows = result.all()

        ranking = []
        for idx, row in enumerate(rows, 1):
            ranking.append(
                {
                    "rank": idx,
                    "service_item_id": row.id,
                    "item_code": row.item_code,
                    "item_name": row.item_name,
                    "department": row.department,
                    "evaluation_count": row.evaluation_count,
                    "average_score": round(float(row.average_score), 2) if row.average_score else 0,
                }
            )

        return ranking
