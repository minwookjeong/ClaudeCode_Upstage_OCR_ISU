"""
OCR 파이프라인 서비스

Step 1: UpstageDocumentParseLoader  → 파일을 document-digitization API로 전송,
         마크다운 텍스트로 변환 (이미지는 ocr="force", PDF는 ocr="auto")
Step 2: ChatUpstage (solar-pro)     → 추출된 텍스트에서 구조화 JSON 생성
"""

import asyncio
import json
import re
from pathlib import Path

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_upstage import ChatUpstage, UpstageDocumentParseLoader

# ─────────────────────────────────────────────
# 시스템 프롬프트
# ─────────────────────────────────────────────

_SYSTEM_PROMPT = """당신은 영수증 데이터 추출 전문가입니다.
주어진 영수증 텍스트에서 아래 JSON 형식으로 정보를 추출하세요.
반드시 순수 JSON 객체만 반환하고, 마크다운 코드 블록(```)이나 추가 설명은 포함하지 마세요.

{
  "store_name": "상호명 (문자열)",
  "receipt_date": "날짜 YYYY-MM-DD 형식 (추출 불가 시 null)",
  "receipt_time": "시각 HH:MM 형식 (추출 불가 시 null)",
  "category": "카테고리 (식료품|외식|카페|편의점|의류|의료|교통|문화/여가|기타 중 하나)",
  "items": [
    {
      "name": "상품명",
      "quantity": 수량(정수),
      "unit_price": 단가(정수),
      "total_price": 합계금액(정수)
    }
  ],
  "subtotal": 소계(정수),
  "discount": 할인금액(정수, 없으면 0),
  "tax": 세금(정수, 없으면 0),
  "total_amount": 최종결제금액(정수),
  "payment_method": "결제수단 (신용카드|체크카드|현금|간편결제|기타 중 하나)"
}"""


# ─────────────────────────────────────────────
# 내부 헬퍼 (동기 — threadpool 실행용)
# ─────────────────────────────────────────────

def _run_document_parse(file_path: Path, is_pdf: bool) -> str:
    """UpstageDocumentParseLoader를 동기로 실행하여 마크다운 텍스트를 반환합니다."""
    ocr_mode = "auto" if is_pdf else "force"
    loader = UpstageDocumentParseLoader(
        str(file_path),
        ocr=ocr_mode,
        output_format="markdown",
        split="none",
        coordinates=False,
    )
    docs = loader.load()
    return docs[0].page_content if docs else ""


def _parse_json_response(text: str) -> dict:
    """LLM 응답에서 JSON을 추출합니다. 코드 블록 펜스를 제거합니다."""
    # ```json ... ``` 또는 ``` ... ``` 형태 제거
    cleaned = re.sub(r"```(?:json)?\s*([\s\S]*?)```", r"\1", text).strip()
    return json.loads(cleaned)


# ─────────────────────────────────────────────
# 공개 인터페이스
# ─────────────────────────────────────────────

async def run_ocr_pipeline(file_path: Path) -> dict:
    """
    영수증 파일을 받아 구조화된 지출 데이터 dict를 반환합니다.

    Args:
        file_path: 저장된 영수증 파일 경로 (JPG / PNG / PDF)

    Returns:
        OCR 파싱 결과 dict (store_name, receipt_date, items, total_amount 등)

    Raises:
        ValueError: OCR 결과가 비어 있거나 JSON 파싱에 실패한 경우
    """
    suffix = file_path.suffix.lower()
    is_pdf = suffix == ".pdf"

    # ── Step 1: Document Digitization (동기 I/O → 스레드풀 위임) ──
    parsed_text: str = await asyncio.to_thread(_run_document_parse, file_path, is_pdf)

    if not parsed_text.strip():
        raise ValueError(
            "OCR 결과가 비어 있습니다. 이미지 품질을 확인하고 다시 시도해 주세요."
        )

    # ── Step 2: ChatUpstage로 구조화 JSON 추출 ──
    chat = ChatUpstage(model="solar-pro")
    messages = [
        SystemMessage(content=_SYSTEM_PROMPT),
        HumanMessage(
            content=f"다음 영수증 내용에서 데이터를 추출하세요:\n\n{parsed_text}"
        ),
    ]

    response = await chat.ainvoke(messages)

    try:
        return _parse_json_response(response.content)
    except (json.JSONDecodeError, ValueError) as exc:
        preview = response.content[:300]
        raise ValueError(
            f"LLM 응답을 JSON으로 파싱할 수 없습니다. 다시 시도해 주세요.\n"
            f"응답 미리보기: {preview}"
        ) from exc
