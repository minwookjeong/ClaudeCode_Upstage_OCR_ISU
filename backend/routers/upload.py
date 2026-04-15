"""
POST /api/upload — 영수증 파일 업로드 및 OCR 파싱 라우터
"""

import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile

from services.expense_store import append
from services.ocr_service import run_ocr_pipeline

router = APIRouter()

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_SUFFIXES = {".jpg", ".jpeg", ".png", ".pdf"}
MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/upload")
async def upload_receipt(file: UploadFile):
    """
    영수증 파일을 업로드하고 OCR 파싱 결과를 expenses.json에 저장합니다.

    - **file**: JPG / PNG / PDF (최대 10 MB)

    성공 시 파싱된 지출 JSON 객체를 반환합니다.
    """
    # ── 파일 형식 검증 ──
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 파일 형식입니다 ({suffix}). JPG, PNG, PDF만 업로드 가능합니다.",
        )

    # ── 파일 읽기 및 크기 검증 ──
    content = await file.read()
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"파일 크기가 10 MB를 초과합니다 ({len(content) / 1024 / 1024:.1f} MB).",
        )

    # ── 파일 저장 ──
    short_id = uuid.uuid4().hex[:8]
    saved_filename = f"receipt_{short_id}{suffix}"
    saved_path = UPLOAD_DIR / saved_filename
    saved_path.write_bytes(content)

    # ── OCR 파이프라인 ──
    try:
        parsed = await run_ocr_pipeline(saved_path)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"OCR 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. ({type(exc).__name__})",
        )

    # ── 지출 항목 구성 후 저장 ──
    expense = {
        "id": str(uuid.uuid4()),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "raw_image_path": f"uploads/{saved_filename}",
        **parsed,
    }
    append(expense)

    return expense
