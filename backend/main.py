from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

load_dotenv()

import settings  # noqa: E402 — settings가 mkdir을 수행하므로 라우터보다 먼저 임포트

app = FastAPI(
    title="Receipt Expense Tracker API",
    description="영수증 OCR 기반 지출 관리 API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import expenses, summary, upload

app.include_router(upload.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(summary.router, prefix="/api")

# 업로드된 영수증 이미지를 프론트에서 직접 로드할 수 있도록 정적 파일 서빙
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")


@app.get("/")
def health_check():
    return {"status": "ok", "message": "Receipt Expense Tracker API is running"}
