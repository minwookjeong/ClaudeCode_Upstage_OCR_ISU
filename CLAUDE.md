# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 프로젝트 개요

영수증(JPG/PNG/PDF) 업로드 → **Upstage Vision LLM** 기반 OCR 자동 파싱 → 지출 내역 관리 경량 웹 앱.
DB 없이 서버 로컬 `expenses.json` 파일에 누적 저장하는 1일 스프린트 MVP.

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | React 18 + Vite 5 + TailwindCSS 3 + Axios |
| 백엔드 | Python FastAPI 0.111+ |
| AI 오케스트레이션 | LangChain 0.2+ + ChatUpstage (Vision LLM) |
| OCR 모델 | Upstage `document-digitization-vision` |
| 이미지 전처리 | Pillow, pdf2image |
| 배포 | Vercel (프론트 정적 빌드 + 백엔드 서버리스) |

---

## 디렉토리 구조

```
receipt-tracker/
├── frontend/
│   ├── src/
│   │   ├── pages/          # Dashboard, UploadPage, ExpenseDetail
│   │   ├── components/     # Badge, Modal, Toast 등 공통 컴포넌트
│   │   └── api/            # Axios 인스턴스 및 API 호출 함수
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── main.py             # FastAPI 앱 진입점
│   ├── routers/            # 엔드포인트별 라우터
│   ├── services/           # LangChain + Upstage OCR 로직
│   ├── data/
│   │   └── expenses.json   # 지출 데이터 저장소 (DB 대체)
│   └── requirements.txt
├── vercel.json             # Vercel 빌드 및 라우팅 설정
├── .env                    # 로컬 환경변수 (커밋 금지)
└── images/                 # 테스트용 영수증 샘플 이미지
```

---

## 개발 환경 설정 및 실행 명령

### 백엔드

```bash
cd backend
pip install -r requirements.txt

# 개발 서버 실행 (핫 리로드)
uvicorn main:app --reload --port 8000
```

### 프론트엔드

```bash
cd frontend
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

### 환경변수 (`.env`)

```
UPSTAGE_API_KEY=<Upstage API 키>
VITE_API_BASE_URL=http://localhost:8000   # 프론트 빌드 시 주입
DATA_FILE_PATH=backend/data/expenses.json
```

---

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/upload` | 영수증 파일 업로드 → OCR 파싱 → JSON 반환 |
| `GET` | `/api/expenses` | 지출 목록 조회 (`?from=&to=` 날짜 필터 지원) |
| `DELETE` | `/api/expenses/{id}` | 특정 지출 항목 삭제 |
| `PUT` | `/api/expenses/{id}` | 지출 항목 수정 |
| `GET` | `/api/summary` | 합계 통계 (`?month=YYYY-MM`) |

---

## 데이터 스키마 (`expenses.json` 항목 단위)

```json
{
  "id": "uuid-v4",
  "created_at": "2025-07-15T14:30:00Z",
  "store_name": "이마트 강남점",
  "receipt_date": "2025-07-15",
  "receipt_time": "13:25",
  "category": "식료품",
  "items": [
    { "name": "신라면", "quantity": 2, "unit_price": 4500, "total_price": 9000 }
  ],
  "subtotal": 9000,
  "discount": 0,
  "tax": 0,
  "total_amount": 9000,
  "payment_method": "신용카드",
  "raw_image_path": "uploads/receipt_xxx.jpg"
}
```

---

## 핵심 아키텍처: OCR 파이프라인

```
파일 업로드 (multipart/form-data)
    │
    ▼
[이미지 전처리]  PIL / pdf2image → Base64 인코딩
    │
    ▼
[LangChain Chain]
    ├── ChatUpstage (document-digitization-vision)
    │       System Prompt: "JSON 형식으로만 응답"
    │       User Input: Base64 이미지 + 추출 필드 지시문
    └── OutputParser → 구조화 JSON
    │
    ▼
expenses.json append 저장 → HTTP 응답 반환
```

OCR 파싱 실패 시 사용자에게 오류 메시지 반환 (재시도 안내 포함).

---

## Vercel 배포 설정 (`vercel.json`)

```json
{
  "builds": [
    { "src": "frontend/package.json", "use": "@vercel/static-build" },
    { "src": "backend/main.py", "use": "@vercel/python" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "backend/main.py" },
    { "src": "/(.*)", "dest": "frontend/dist/$1" }
  ]
}
```

> **주의**: Vercel 서버리스는 요청마다 컨테이너가 재생성되어 파일 시스템이 유지되지 않음.
> MVP 단계에서는 클라이언트 `localStorage` 병행 저장을 권장. 영속성이 필요하면 Railway/Render 배포 또는 Vercel KV 도입.

---

## 제약 사항

- 지원 파일: JPG, PNG, PDF (최대 10MB)
- 지원 언어: 한국어, 영어 영수증
- 인증(로그인) 없음 — API URL 비공개로 최소 보안 유지
- 동시 접속: 단일 사용자 기준 설계
