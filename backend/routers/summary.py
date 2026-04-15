"""
GET /api/summary — 지출 합계 통계 라우터

?month=YYYY-MM  지정 시 해당 월만 집계
이번 달 합계(this_month_amount)는 항상 현재 달력 기준으로 계산
"""

from datetime import date
from typing import Optional

from fastapi import APIRouter

from services.expense_store import get_all

router = APIRouter()


@router.get("/summary")
def get_summary(month: Optional[str] = None):
    """
    지출 통계 요약을 반환합니다.

    - **month**: 조회 월 YYYY-MM (미지정 시 전체 기간)

    반환 필드:
    - `total_amount`: 조회 기간 총 지출 합계
    - `this_month_amount`: 현재 달력 월 기준 합계 (month 파라미터와 무관하게 항상 계산)
    - `count`: 조회 기간 항목 수
    - `category_summary`: 카테고리별 합계 배열 (금액 내림차순)
    - `month`: 요청한 month 파라미터 (없으면 null)
    """
    # ── 조회 기간 데이터 ──
    if month:
        expenses = get_all(from_date=f"{month}-01", to_date=f"{month}-31")
    else:
        expenses = get_all()

    total_amount = sum(e.get("total_amount") or 0 for e in expenses)

    # 카테고리별 집계 → 금액 내림차순 배열
    by_category: dict[str, int] = {}
    for e in expenses:
        cat = e.get("category") or "기타"
        by_category[cat] = by_category.get(cat, 0) + (e.get("total_amount") or 0)

    category_summary = sorted(
        [{"category": cat, "amount": amt} for cat, amt in by_category.items()],
        key=lambda x: x["amount"],
        reverse=True,
    )

    # ── 이번 달 합계 (항상 현재 달력 기준) ──
    this_month = date.today().strftime("%Y-%m")
    this_month_expenses = get_all(
        from_date=f"{this_month}-01",
        to_date=f"{this_month}-31",
    )
    this_month_amount = sum(e.get("total_amount") or 0 for e in this_month_expenses)

    return {
        "total_amount": total_amount,
        "this_month_amount": this_month_amount,
        "count": len(expenses),
        "category_summary": category_summary,
        "month": month,
    }
