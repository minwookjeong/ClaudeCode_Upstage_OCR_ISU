# PROMPT.md — 확정된 프로세스 & 프롬프트 레퍼런스

> **목적**: 이 프로젝트에서 확정된 AI 프롬프트, 데이터 흐름, API 명세, 개발 규칙을 한 곳에서 관리합니다.
> Claude Code 세션이 새로 시작되더라도 이 파일을 참조해 일관된 방향으로 작업을 이어갈 수 있습니다.

---

## 1. 프로젝트 정의

| 항목 | 내용 |
|------|------|
| 서비스명 | 영수증 OCR 지출 관리 앱 (Receipt Expense Tracker) |
| 목표 | 영수증 사진 업로드 → AI 자동 파싱 → 지출 내역 관리 |
| 개발 방식 | 1일 스프린트 MVP, DB 없이 `expenses.json` 파일 스토리지 |
| 배포 목표 | Vercel (프론트 정적 빌드 + 백엔드 서버리스) |

### 기술 스택 (확정)

| 레이어 | 기술 | 버전 |
|--------|------|------|
| 백엔드 | Python FastAPI | 0.135.3 |
| AI/OCR | Upstage document-digitization + Solar-Pro | - |
| LangChain | langchain-upstage | 0.7.7 |
| 프론트엔드 | React + Vite | 18.3.1 / 5.4.x |
| 스타일 | TailwindCSS | 3.4.x |
| HTTP 클라이언트 | Axios | 1.7.x |
| 라우팅 | React Router DOM | 6.28.x |

---

## 2. OCR 파이프라인 프롬프트 (확정)

### 2-1. Step 1 — Upstage Document Digitization

```python
# backend/services/ocr_service.py

loader = UpstageDocumentParseLoader(
    str(file_path),
    ocr="force",        # 이미지(JPG/PNG): "force" | PDF: "auto"
    output_format="markdown",
    split="none",
    coordinates=False,
)
```

| 파라미터 | 이미지(JPG/PNG) | PDF |
|----------|----------------|-----|
| `ocr` | `"force"` | `"auto"` |
| `output_format` | `"markdown"` | `"markdown"` |
| `split` | `"none"` | `"none"` |

- **API 엔드포인트**: `https://api.upstage.ai/v1/document-digitization`
- **모델**: `document-parse`
- **반환**: 영수증 전체를 마크다운 텍스트로 변환한 문자열

---

### 2-2. Step 2 — Solar-Pro 구조화 추출 시스템 프롬프트 (확정 원문)

```
당신은 영수증 데이터 추출 전문가입니다.
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
}
```

**LangChain 호출 패턴**

```python
chat = ChatUpstage(model="solar-pro")
messages = [
    SystemMessage(content=_SYSTEM_PROMPT),
    HumanMessage(content=f"다음 영수증 내용에서 데이터를 추출하세요:\n\n{parsed_text}"),
]
response = await chat.ainvoke(messages)
```

**응답 파싱 규칙**

- ` ```json ... ``` ` 코드 블록 펜스를 정규식으로 제거 후 `json.loads()`
- 파싱 실패 시 `ValueError` 발생 → HTTP 500 반환

---

## 3. 확정된 API 명세

### 엔드포인트 목록

| 메서드 | 경로 | 설명 | 상태코드 |
|--------|------|------|---------|
| `POST` | `/api/upload` | 영수증 업로드 + OCR 파싱 + 저장 | 200 / 400 / 500 |
| `GET` | `/api/expenses` | 지출 목록 조회 (날짜 필터) | 200 |
| `GET` | `/api/expenses/{id}` | 단건 조회 | 200 / 404 |
| `PUT` | `/api/expenses/{id}` | 항목 수정 (부분 업데이트) | 200 / 400 / 404 |
| `DELETE` | `/api/expenses/{id}` | 항목 삭제 | 200 / 404 |
| `GET` | `/api/summary` | 지출 통계 (`?month=YYYY-MM`) | 200 |
| `GET` | `/uploads/{filename}` | 업로드 이미지 정적 서빙 | 200 / 404 |

### POST /api/upload — 처리 흐름

```
multipart/form-data (file)
    │
    ├─ 파일 형식 검증 (jpg/jpeg/png/pdf)
    ├─ 파일 크기 검증 (최대 10MB)
    ├─ uploads/ 에 저장 (receipt_{8자리hex}.{ext})
    │
    ├─ [Step 1] UpstageDocumentParseLoader → markdown 텍스트
    ├─ [Step 2] ChatUpstage(solar-pro) → 구조화 JSON
    │
    ├─ UUID v4 부여
    ├─ created_at ISO 8601 UTC 타임스탬프 부여
    └─ expenses.json append → HTTP 200 반환
```

### GET /api/summary — 응답 스펙

```json
{
  "total_amount": 128500,
  "this_month_amount": 45300,
  "count": 12,
  "category_summary": [
    { "category": "외식", "amount": 65000 },
    { "category": "식료품", "amount": 43200 }
  ],
  "month": "2026-04"
}
```

- `total_amount`: `month` 파라미터 기준 집계
- `this_month_amount`: **항상 현재 달력 월** 기준 (파라미터 무관)
- `category_summary`: 금액 내림차순 정렬

---

## 4. 확정된 데이터 스키마

### expenses.json 항목 단위

```json
{
  "id": "uuid-v4-string",
  "created_at": "2026-04-15T09:30:00+00:00",
  "raw_image_path": "uploads/receipt_a1b2c3d4.jpg",

  "store_name": "이마트 강남점",
  "receipt_date": "2026-04-15",
  "receipt_time": "09:25",
  "category": "식료품",

  "items": [
    {
      "name": "신라면 멀티팩",
      "quantity": 2,
      "unit_price": 4500,
      "total_price": 9000
    }
  ],

  "subtotal": 9000,
  "discount": 500,
  "tax": 0,
  "total_amount": 8500,
  "payment_method": "신용카드"
}
```

### 불변 필드 (PUT 시 덮어쓰기 금지)

| 필드 | 이유 |
|------|------|
| `id` | 기본키 |
| `created_at` | 생성 시각 이력 |
| `raw_image_path` | 원본 이미지 경로 |

### 카테고리 열거값 (확정)

```
식료품 | 외식 | 카페 | 편의점 | 의류 | 의료 | 교통 | 문화/여가 | 기타
```

### 결제수단 열거값 (확정)

```
신용카드 | 체크카드 | 현금 | 간편결제 | 기타
```

---

## 5. 프론트엔드 확정 구조

### 라우팅 (React Router v6)

| 경로 | 컴포넌트 | 단계 |
|------|----------|------|
| `/` | `Dashboard` | Phase 6 |
| `/upload` | `UploadPage` | Phase 5 ✅ |
| `/expense/:id` | `ExpenseDetail` | Phase 7 |
| `*` | `→ /` 리다이렉트 | - |

### 업로드 페이지 상태 머신 (확정)

```
IDLE
 │ 파일 선택/드롭
 ▼
UPLOADING ──(POST /api/upload 실패)──▶ ERROR ──(재시도)──▶ IDLE
 │
 │ 성공
 ▼
PREVIEW ──(저장 클릭)──▶ SAVING
 │                          │ PUT /api/expenses/{id}
 │                          │ + localStorage 동기화
 │                          │ + showToast('저장됨', 'success')
 │ 취소 클릭                 ▼
 └──────────────────▶ navigate('/')
```

### localStorage 동기화 규칙

```js
// 업서트 방식 — id 기준으로 신규 추가 또는 기존 항목 갱신
const stored = JSON.parse(localStorage.getItem('expenses') || '[]')
const idx = stored.findIndex(e => e.id === expense.id)
if (idx >= 0) stored[idx] = expense
else stored.unshift(expense)
localStorage.setItem('expenses', JSON.stringify(stored))
```

### Axios 인스턴스 설정 (확정)

```js
// frontend/src/api/axios.js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 60_000,   // OCR 처리 최대 60초
})
```

### 개발 서버 프록시 (vite.config.js 확정)

```js
proxy: {
  '/api':     { target: 'http://localhost:8000', changeOrigin: true },
  '/uploads': { target: 'http://localhost:8000', changeOrigin: true },
}
```

---

## 6. 컴포넌트 책임 분리 (확정)

| 컴포넌트 | 파일 | 책임 |
|----------|------|------|
| `ToastContext` | `contexts/ToastContext.jsx` | 전역 알림 상태 관리, 3초 자동 소멸 |
| `Header` | `components/Header.jsx` | 스티키 네비게이션, 경로별 CTA |
| `Badge` | `components/Badge.jsx` | 카테고리 색상 인라인 스타일 매핑 |
| `DropZone` | `components/DropZone.jsx` | 파일 드래그앤드롭, 클라이언트 검증, 미리보기 |
| `ProgressBar` | `components/ProgressBar.jsx` | OCR 처리 중 인디케이터 |
| `ParsePreview` | `components/ParsePreview.jsx` | OCR 결과 인라인 편집, 품목 CRUD, 금액 자동계산 |

### 카테고리 뱃지 색상 매핑 (확정)

| 카테고리 | 배경 | 텍스트 |
|----------|------|--------|
| 식료품 | `#DCFCE7` | `#15803D` |
| 외식 | `#FFEDD5` | `#C2410C` |
| 카페 | `#FEF9C3` | `#A16207` |
| 편의점 | `#E0E7FF` | `#4338CA` |
| 의류/쇼핑 | `#F3E8FF` | `#7E22CE` |
| 의료 | `#FEE2E2` | `#B91C1C` |
| 교통 | `#DBEAFE` | `#1D4ED8` |
| 문화/여가 | `#FCE7F3` | `#9D174D` |
| 기타 | `#F3F4F6` | `#374151` |

---

## 7. Claude Code 훅 프로세스 (확정)

### 설정 파일: `.claude/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "py \".claude/hooks/prd_sync.py\"",
        "timeout": 10,
        "statusMessage": "PRD 동기화 확인 중..."
      }]
    }],
    "Stop": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "py \".claude/hooks/update_prd.py\"",
        "timeout": 15,
        "statusMessage": "PRD 자동 업데이트 중..."
      }]
    }]
  }
}
```

### 훅 동작 규칙

| 훅 이름 | 트리거 | 역할 |
|---------|--------|------|
| `prd_sync.py` | `Write` 또는 `Edit` 도구 실행 후 | PRD 동기화 확인 |
| `update_prd.py` | Claude 세션 종료(`Stop`) | 코드베이스 분석 → `PRD.md` 자동 갱신 |

### `update_prd.py` 갱신 항목

- FastAPI 엔드포인트 목록 (정규식 파싱)
- 백엔드 Python 파일 목록
- 프론트엔드 소스 파일 목록
- `requirements.txt` 의존성 목록
- 갱신 타임스탬프

---

## 8. 개발 단계 진행 현황

| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 1 | 프로젝트 환경 설정 | ✅ 완료 |
| Phase 2 | 백엔드 핵심 API (OCR 업로드) | ✅ 완료 |
| Phase 3 | 백엔드 부가 API (CRUD + Summary) | ✅ 완료 |
| Phase 4 | 프론트엔드 환경 설정 | ✅ 완료 |
| Phase 5 | 업로드 화면 구현 | ✅ 완료 |
| Phase 6 | 대시보드 화면 구현 | ⬜ 미완료 |
| Phase 7 | 지출 상세/수정 화면 구현 | ⬜ 미완료 |
| Phase 8 | 배포 및 E2E 검증 | ⬜ 미완료 |

---

## 9. 로컬 개발 환경

### 백엔드 실행

```bash
cd backend
python -m venv venv                  # 최초 1회
venv/Scripts/activate                # Windows
pip install -r requirements.txt

# .env 설정
echo "UPSTAGE_API_KEY=your_key" > .env

uvicorn main:app --reload --port 8000
# → http://localhost:8000/docs  (Swagger UI)
```

### 프론트엔드 실행

```bash
cd frontend
npm install                          # 최초 1회
npm run dev
# → http://localhost:5173
```

### 환경변수 (`.env`)

```
# 백엔드 (backend/.env)
UPSTAGE_API_KEY=<Upstage 콘솔에서 발급>

# 프론트엔드 (frontend/.env)
VITE_API_BASE_URL=http://localhost:8000
```

---

## 10. 코딩 규칙 (확정)

### 백엔드

| 규칙 | 내용 |
|------|------|
| 비동기 처리 | 동기 OCR 로더는 `asyncio.to_thread()` 로 threadpool 위임 |
| 파일 저장 | `threading.Lock` 으로 동시 쓰기 충돌 방지 |
| 불변 필드 | `id`, `created_at`, `raw_image_path` 는 PUT 에서 덮어쓰지 않음 |
| 에러 응답 | 400 (입력 오류), 404 (항목 없음), 500 (OCR/서버 오류) |
| 파일명 규칙 | `receipt_{uuid8hex}.{ext}` |

### 프론트엔드

| 규칙 | 내용 |
|------|------|
| 컴포넌트 단위 | 단일 책임 원칙 — 한 파일 한 컴포넌트 |
| 스타일 | Tailwind 유틸리티 클래스 우선, 동적 색상만 인라인 스타일 |
| 상태 관리 | `useState` + Context (Toast) — 전역 라이브러리 미사용 |
| API 호출 | 반드시 `src/api/axios.js` 인스턴스 사용 |
| 로컬 저장 | 업서트 방식 (`id` 기준) — 중복 저장 방지 |
| 에러 처리 | `err.response?.data?.detail` 우선, 없으면 `err.message` |
