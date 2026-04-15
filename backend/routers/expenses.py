"""
지출 내역 CRUD 라우터

GET    /api/expenses          — 목록 조회 (날짜 필터 지원)
DELETE /api/expenses/{id}     — 항목 삭제
PUT    /api/expenses/{id}     — 항목 수정
"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.expense_store import delete, get_all, get_by_id, update

router = APIRouter()


# ─────────────────────────────────────────────
# 요청 스키마
# ─────────────────────────────────────────────

class ItemSchema(BaseModel):
    name: str
    quantity: int
    unit_price: int
    total_price: int


class ExpenseUpdateRequest(BaseModel):
    store_name: Optional[str] = None
    receipt_date: Optional[str] = None
    receipt_time: Optional[str] = None
    category: Optional[str] = None
    items: Optional[List[ItemSchema]] = None
    subtotal: Optional[int] = None
    discount: Optional[int] = None
    tax: Optional[int] = None
    total_amount: Optional[int] = None
    payment_method: Optional[str] = None


# ─────────────────────────────────────────────
# 엔드포인트
# ─────────────────────────────────────────────

@router.get("/expenses")
def list_expenses(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
):
    """
    지출 내역 목록을 반환합니다.

    - **from_date**: 시작일 YYYY-MM-DD (포함)
    - **to_date**: 종료일 YYYY-MM-DD (포함)
    """
    return get_all(from_date=from_date, to_date=to_date)


@router.get("/expenses/{expense_id}")
def get_expense(expense_id: str):
    """ID로 지출 항목 단건을 조회합니다."""
    expense = get_by_id(expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="해당 지출 항목을 찾을 수 없습니다.")
    return expense


@router.delete("/expenses/{expense_id}")
def remove_expense(expense_id: str):
    """지출 항목을 삭제합니다."""
    if not delete(expense_id):
        raise HTTPException(status_code=404, detail="해당 지출 항목을 찾을 수 없습니다.")
    return {"message": "삭제되었습니다.", "id": expense_id}


@router.put("/expenses/{expense_id}")
def modify_expense(expense_id: str, body: ExpenseUpdateRequest):
    """지출 항목을 수정합니다. 전달된 필드만 업데이트됩니다."""
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="수정할 필드가 없습니다.")

    # items가 Pydantic 모델 리스트이면 dict로 변환
    if "items" in updates:
        updates["items"] = [
            item if isinstance(item, dict) else item.model_dump()
            for item in updates["items"]
        ]

    updated = update(expense_id, updates)
    if updated is None:
        raise HTTPException(status_code=404, detail="해당 지출 항목을 찾을 수 없습니다.")
    return updated
