"""
Phase 3 완료 기준 자동 검증

PRD 완료 기준:
  [✓] 5개 엔드포인트 전체 정상 응답
  [✓] GET /api/expenses?from=&to=  날짜 필터 동작
  [✓] 존재하지 않는 ID로 DELETE 시 404
  [✓] GET /api/expenses/{id} 단건 조회 및 404
  [✓] GET /api/summary 응답 스펙 (this_month_amount, category_summary 배열)
  [✓] /uploads 정적 파일 서빙 마운트 확인

실행:
  cd backend
  python -m pytest tests/test_phase3.py -v
"""

import json
import uuid
from datetime import date

import pytest
from fastapi.testclient import TestClient

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import main  # noqa: E402 — sys.path 설정 후 import
from services import expense_store

client = TestClient(main.app)

# ─────────────────────────────────────────────
# 픽스처: 테스트용 더미 지출 항목 2건 주입
# ─────────────────────────────────────────────

THIS_MONTH = date.today().strftime("%Y-%m")
LAST_MONTH_YEAR = date.today().year if date.today().month > 1 else date.today().year - 1
LAST_MONTH_NUM  = date.today().month - 1 if date.today().month > 1 else 12
LAST_MONTH = f"{LAST_MONTH_YEAR:04d}-{LAST_MONTH_NUM:02d}"

DUMMY_A = {
    "id": str(uuid.uuid4()),
    "created_at": f"{THIS_MONTH}-05T10:00:00+00:00",
    "store_name": "테스트마트",
    "receipt_date": f"{THIS_MONTH}-05",
    "receipt_time": "10:00",
    "category": "식료품",
    "items": [{"name": "사과", "quantity": 3, "unit_price": 1000, "total_price": 3000}],
    "subtotal": 3000,
    "discount": 0,
    "tax": 0,
    "total_amount": 3000,
    "payment_method": "신용카드",
    "raw_image_path": "uploads/dummy_a.jpg",
}

DUMMY_B = {
    "id": str(uuid.uuid4()),
    "created_at": f"{LAST_MONTH}-10T12:00:00+00:00",
    "store_name": "지난달카페",
    "receipt_date": f"{LAST_MONTH}-10",
    "receipt_time": "12:00",
    "category": "카페",
    "items": [{"name": "아메리카노", "quantity": 1, "unit_price": 4500, "total_price": 4500}],
    "subtotal": 4500,
    "discount": 0,
    "tax": 0,
    "total_amount": 4500,
    "payment_method": "현금",
    "raw_image_path": "uploads/dummy_b.jpg",
}


@pytest.fixture(autouse=True)
def inject_dummy_data(tmp_path, monkeypatch):
    """각 테스트 전에 임시 expenses.json을 주입하고, 테스트 후 복원합니다."""
    tmp_file = tmp_path / "expenses.json"
    tmp_file.write_text(json.dumps([DUMMY_A, DUMMY_B]), encoding="utf-8")
    monkeypatch.setattr(expense_store, "DATA_FILE", tmp_file)
    yield
    # autouse fixture가 teardown을 자동 처리


# ─────────────────────────────────────────────
# 테스트 케이스
# ─────────────────────────────────────────────

class TestHealthCheck:
    def test_root_ok(self):
        r = client.get("/")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


class TestGetExpenses:
    def test_list_all(self):
        """GET /api/expenses — 전체 2건 반환"""
        r = client.get("/api/expenses")
        assert r.status_code == 200
        assert len(r.json()) == 2

    def test_filter_this_month(self):
        """GET /api/expenses?from=&to= — 이번 달만 필터"""
        r = client.get(f"/api/expenses?from_date={THIS_MONTH}-01&to_date={THIS_MONTH}-31")
        assert r.status_code == 200
        result = r.json()
        assert len(result) == 1
        assert result[0]["store_name"] == "테스트마트"

    def test_filter_last_month(self):
        """GET /api/expenses?from=&to= — 지난 달만 필터"""
        r = client.get(f"/api/expenses?from_date={LAST_MONTH}-01&to_date={LAST_MONTH}-31")
        assert r.status_code == 200
        result = r.json()
        assert len(result) == 1
        assert result[0]["store_name"] == "지난달카페"

    def test_filter_no_result(self):
        """날짜 범위 밖 → 빈 배열 반환"""
        r = client.get("/api/expenses?from_date=2000-01-01&to_date=2000-01-31")
        assert r.status_code == 200
        assert r.json() == []


class TestGetExpenseById:
    def test_get_existing(self):
        """GET /api/expenses/{id} — 존재하는 항목 반환"""
        r = client.get(f"/api/expenses/{DUMMY_A['id']}")
        assert r.status_code == 200
        assert r.json()["store_name"] == "테스트마트"

    def test_get_not_found(self):
        """GET /api/expenses/{id} — 없는 ID → 404"""
        r = client.get(f"/api/expenses/{uuid.uuid4()}")
        assert r.status_code == 404


class TestDeleteExpense:
    def test_delete_existing(self):
        """DELETE /api/expenses/{id} — 정상 삭제"""
        r = client.delete(f"/api/expenses/{DUMMY_A['id']}")
        assert r.status_code == 200
        assert r.json()["id"] == DUMMY_A["id"]
        # 삭제 후 조회 시 1건만 남아야 함
        r2 = client.get("/api/expenses")
        assert len(r2.json()) == 1

    def test_delete_not_found(self):
        """DELETE /api/expenses/{id} — 없는 ID → 404"""
        r = client.delete(f"/api/expenses/{uuid.uuid4()}")
        assert r.status_code == 404


class TestUpdateExpense:
    def test_update_existing(self):
        """PUT /api/expenses/{id} — store_name 수정"""
        r = client.put(
            f"/api/expenses/{DUMMY_A['id']}",
            json={"store_name": "수정된마트"},
        )
        assert r.status_code == 200
        assert r.json()["store_name"] == "수정된마트"
        # id, created_at, raw_image_path는 보호되어야 함
        assert r.json()["id"] == DUMMY_A["id"]

    def test_update_not_found(self):
        """PUT /api/expenses/{id} — 없는 ID → 404"""
        r = client.put(f"/api/expenses/{uuid.uuid4()}", json={"store_name": "없음"})
        assert r.status_code == 404

    def test_update_empty_body(self):
        """PUT 요청에 수정 필드 없으면 400"""
        r = client.put(f"/api/expenses/{DUMMY_A['id']}", json={})
        assert r.status_code == 400


class TestSummary:
    def test_summary_response_schema(self):
        """GET /api/summary — PRD 스펙 키 존재 확인"""
        r = client.get("/api/summary")
        assert r.status_code == 200
        body = r.json()
        assert "total_amount" in body
        assert "this_month_amount" in body
        assert "count" in body
        assert "category_summary" in body
        assert isinstance(body["category_summary"], list)

    def test_summary_total_amount(self):
        """전체 total_amount = 3000 + 4500"""
        r = client.get("/api/summary")
        assert r.json()["total_amount"] == 7500

    def test_summary_this_month(self):
        """this_month_amount = 이번 달 합계 (3000)"""
        r = client.get("/api/summary")
        assert r.json()["this_month_amount"] == 3000

    def test_summary_month_filter(self):
        """?month= 필터 시 total_amount가 해당 월만 집계"""
        r = client.get(f"/api/summary?month={LAST_MONTH}")
        assert r.json()["total_amount"] == 4500

    def test_summary_category_summary_sorted(self):
        """category_summary는 amount 내림차순 정렬"""
        r = client.get("/api/summary")
        cs = r.json()["category_summary"]
        assert len(cs) == 2
        amounts = [item["amount"] for item in cs]
        assert amounts == sorted(amounts, reverse=True)

    def test_summary_category_summary_format(self):
        """category_summary 각 항목은 category, amount 키를 가짐"""
        r = client.get("/api/summary")
        for item in r.json()["category_summary"]:
            assert "category" in item
            assert "amount" in item


class TestStaticFiles:
    def test_uploads_mount_exists(self):
        """/uploads 경로가 마운트되어 있음을 확인"""
        routes = [r.path for r in main.app.routes]
        assert any("/uploads" in str(r) for r in main.app.routes)
