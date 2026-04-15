"""
경로 설정 — 로컬 개발과 Vercel 서버리스 환경을 모두 지원합니다.

Vercel 환경변수 설정:
  UPLOAD_DIR=/tmp/uploads
  DATA_FILE_PATH=/tmp/expenses.json
"""

import os
from pathlib import Path

_BASE = Path(__file__).parent

# 환경변수 우선, 없으면 프로젝트 내 기본 경로 사용
UPLOAD_DIR: Path = Path(os.environ.get("UPLOAD_DIR", str(_BASE / "uploads")))
DATA_FILE: Path  = Path(os.environ.get("DATA_FILE_PATH", str(_BASE / "data" / "expenses.json")))

# 시작 시 디렉터리 보장
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
