"""
GET /api/summary — 지출 합계 통계 라우터

?month=YYYY-MM  지정 시 해당 월만 집계
"""

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
    - total_amount: 총 지출 합계
    - count: 항목 수
    - by_category: 카테고리별 합계 dict
    - month: 요청 월 (없으면 null)
    """
    if month:
        # YYYY-MM → YYYY-MM-01 ~ YYYY-MM-31 범위로 필터
        expenses = get_all(from_date=f"{month}-01", to_date=f"{month}-31")
    else:
        expenses = get_all()

    total_amount = sum(e.get("total_amount") or 0 for e in expenses)

    by_category: dict[str, int] = {}
    for e in expenses:
        cat = e.get("category") or "기타"
        by_category[cat] = by_category.get(cat, 0) + (e.get("total_amount") or 0)

    return {
        "total_amount": total_amount,
        "count": len(expenses),
        "by_category": by_category,
        "month": month,
    }
