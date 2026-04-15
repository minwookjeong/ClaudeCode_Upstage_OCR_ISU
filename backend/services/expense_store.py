"""
expenses.json 파일 기반 CRUD 스토어

모든 쓰기 연산은 threading.Lock으로 동시 접근 충돌을 방지합니다.
"""

import json
from pathlib import Path
from threading import Lock
from typing import Optional

import settings

DATA_FILE = settings.DATA_FILE
_lock = Lock()


# ─────────────────────────────────────────────
# 내부 I/O 헬퍼
# ─────────────────────────────────────────────

def _read() -> list:
    if not DATA_FILE.exists():
        return []
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []


def _write(data: list) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ─────────────────────────────────────────────
# 공개 인터페이스
# ─────────────────────────────────────────────

def get_all(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
) -> list:
    """
    지출 목록 조회. 날짜 범위 필터 옵션 지원.

    Args:
        from_date: 시작일 YYYY-MM-DD (포함)
        to_date:   종료일 YYYY-MM-DD (포함)

    Returns:
        created_at 내림차순으로 정렬된 지출 항목 리스트
    """
    with _lock:
        data = _read()

    if from_date:
        data = [e for e in data if (e.get("receipt_date") or "") >= from_date]
    if to_date:
        data = [e for e in data if (e.get("receipt_date") or "") <= to_date]

    return sorted(data, key=lambda e: e.get("created_at", ""), reverse=True)


def get_by_id(expense_id: str) -> Optional[dict]:
    """id로 단건 조회합니다. 없으면 None 반환."""
    with _lock:
        data = _read()
    return next((e for e in data if e["id"] == expense_id), None)


def append(expense: dict) -> dict:
    """지출 항목을 파일에 추가합니다."""
    with _lock:
        data = _read()
        data.append(expense)
        _write(data)
    return expense


def update(expense_id: str, updates: dict) -> Optional[dict]:
    """
    특정 id의 지출 항목을 업데이트합니다.

    Returns:
        업데이트된 항목, 없으면 None
    """
    with _lock:
        data = _read()
        for i, item in enumerate(data):
            if item["id"] == expense_id:
                # id, created_at, raw_image_path는 덮어쓰지 않음
                protected = {
                    k: item[k]
                    for k in ("id", "created_at", "raw_image_path")
                    if k in item
                }
                data[i] = {**item, **updates, **protected}
                _write(data)
                return data[i]
    return None


def delete(expense_id: str) -> bool:
    """
    특정 id의 지출 항목을 삭제합니다.

    Returns:
        삭제 성공 여부
    """
    with _lock:
        data = _read()
        new_data = [e for e in data if e["id"] != expense_id]
        if len(new_data) == len(data):
            return False
        _write(new_data)
    return True
