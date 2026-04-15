#!/usr/bin/env python3
"""
Claude Code Stop Hook: PRD 자동 업데이트
세션 종료 시 코드베이스를 분석하여 PRD.md를 갱신합니다.

설정 방법 (.claude/settings.json):
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python .claude/hooks/update_prd.py"
          }
        ]
      }
    ]
  }
}
"""

import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path


# ─────────────────────────────────────────────
# 1. Hook 이벤트 수신
# ─────────────────────────────────────────────

def read_hook_input() -> dict:
    """stdin에서 Claude Code Hook JSON 페이로드를 읽습니다."""
    try:
        raw = sys.stdin.read()
        return json.loads(raw) if raw.strip() else {}
    except (json.JSONDecodeError, Exception):
        return {}


# ─────────────────────────────────────────────
# 2. 프로젝트 루트 탐색
# ─────────────────────────────────────────────

def find_project_root(start: Path) -> Path:
    """CLAUDE.md 또는 .git이 있는 디렉토리를 프로젝트 루트로 반환합니다."""
    for directory in [start, *start.parents]:
        if (directory / "CLAUDE.md").exists() or (directory / ".git").exists():
            return directory
    return start


# ─────────────────────────────────────────────
# 3. 코드베이스 상태 수집
# ─────────────────────────────────────────────

EXCLUDE_DIRS = {"venv", "__pycache__", ".git", "node_modules", ".mypy_cache", ".pytest_cache"}


def collect_python_files(root: Path) -> list[str]:
    """백엔드 Python 소스 파일 목록을 수집합니다."""
    result = []
    backend_dir = root / "backend"
    if not backend_dir.exists():
        return result

    for f in backend_dir.rglob("*.py"):
        if not any(part in EXCLUDE_DIRS for part in f.parts):
            result.append(str(f.relative_to(root)))
    return sorted(result)


def collect_frontend_files(root: Path) -> list[str]:
    """프론트엔드 소스 파일 목록을 수집합니다."""
    result = []
    frontend_dir = root / "frontend"
    if not frontend_dir.exists():
        return result

    extensions = {".tsx", ".ts", ".jsx", ".js", ".vue"}
    for f in frontend_dir.rglob("*"):
        if f.suffix in extensions and not any(part in EXCLUDE_DIRS for part in f.parts):
            result.append(str(f.relative_to(root)))
    return sorted(result)


def extract_api_endpoints(root: Path) -> list[dict]:
    """FastAPI 라우터/앱에서 HTTP 엔드포인트를 파싱합니다."""
    endpoints = []
    http_methods = ["get", "post", "put", "delete", "patch"]
    # @app.get("/path") 또는 @router.post("/path") 형태 매칭
    pattern = re.compile(
        r'@(?:app|router)\.(' + '|'.join(http_methods) + r')\(\s*["\']([^"\']+)["\']',
        re.IGNORECASE,
    )

    backend_dir = root / "backend"
    if not backend_dir.exists():
        return endpoints

    for py_file in backend_dir.rglob("*.py"):
        if any(part in EXCLUDE_DIRS for part in py_file.parts):
            continue
        try:
            content = py_file.read_text(encoding="utf-8")
            for match in pattern.finditer(content):
                method, path = match.group(1).upper(), match.group(2)
                endpoints.append({
                    "method": method,
                    "path": path,
                    "file": str(py_file.relative_to(root)),
                })
        except Exception:
            pass

    # 메서드 → 경로 순 정렬
    return sorted(endpoints, key=lambda e: (e["path"], e["method"]))


def collect_requirements(root: Path) -> list[str]:
    """requirements.txt에서 패키지 목록을 읽습니다."""
    req_file = root / "backend" / "requirements.txt"
    if not req_file.exists():
        return []
    try:
        lines = req_file.read_text(encoding="utf-8").splitlines()
        return [ln.strip() for ln in lines if ln.strip() and not ln.startswith("#")]
    except Exception:
        return []


# ─────────────────────────────────────────────
# 4. PRD.md 생성 / 업데이트
# ─────────────────────────────────────────────

AUTO_START = "<!-- AUTO-PRD-START -->"
AUTO_END = "<!-- AUTO-PRD-END -->"


def build_auto_section(state: dict) -> str:
    """자동 갱신 섹션 마크다운을 생성합니다."""
    ts = state["timestamp"]

    # API 엔드포인트 테이블
    endpoints = state["api_endpoints"]
    if endpoints:
        ep_rows = "\n".join(
            f"| `{e['method']}` | `{e['path']}` | `{e['file']}` |"
            for e in endpoints
        )
        ep_table = (
            "| 메서드 | 경로 | 파일 |\n"
            "|--------|------|------|\n"
            f"{ep_rows}"
        )
    else:
        ep_table = "_아직 구현된 엔드포인트가 없습니다._"

    # 파일 목록
    def file_list(files: list[str]) -> str:
        return "\n".join(f"- `{f}`" for f in files) if files else "_없음_"

    # 의존성 목록
    reqs = state["requirements"]
    req_list = "\n".join(f"- `{r}`" for r in reqs) if reqs else "_없음_"

    return f"""
## 자동 갱신 현황

> **마지막 업데이트**: `{ts}`
> 이 섹션은 Claude Code Stop Hook(`update_prd.py`)이 세션 종료 시 자동으로 갱신합니다.

---

### 구현된 API 엔드포인트

{ep_table}

---

### 백엔드 소스 파일

{file_list(state['backend_files'])}

---

### 프론트엔드 소스 파일

{file_list(state['frontend_files'])}

---

### 백엔드 의존성 (`requirements.txt`)

{req_list}
"""


def generate_initial_prd() -> str:
    """PRD.md가 없을 때 초기 문서 헤더를 생성합니다."""
    return """\
# PRD — 영수증 OCR 지출 관리 웹 앱

## 프로젝트 목표

영수증(JPG/PNG/PDF)을 업로드하면 **Upstage Vision LLM**이 지출 항목을 자동 파싱하여
구조화된 형태로 저장·조회할 수 있는 경량 웹 앱 제공. DB 없이 `expenses.json` 파일로 관리하는 1일 스프린트 MVP.

---

## 핵심 기능 요구사항

- [ ] 영수증 파일 업로드 (JPG / PNG / PDF, 최대 10 MB)
- [ ] AI 기반 자동 OCR 파싱 (Upstage `document-digitization-vision`)
- [ ] 지출 내역 목록 조회 및 날짜 필터링
- [ ] 지출 항목 수정 및 삭제
- [ ] 월별 지출 통계 요약
- [ ] 파일 기반 데이터 영속성 (`expenses.json`)

## 비기능 요구사항

- 단일 사용자 기준 (인증 없음)
- Vercel 정적 빌드 + 서버리스 함수 배포 지원
- OCR 파싱 실패 시 사용자에게 명확한 오류 메시지 반환

---

"""


def update_prd(prd_path: Path, state: dict) -> None:
    """PRD.md를 생성하거나 자동 섹션만 교체합니다."""
    auto_section = build_auto_section(state)
    replacement = f"{AUTO_START}{auto_section}{AUTO_END}"

    if prd_path.exists():
        content = prd_path.read_text(encoding="utf-8")
        if AUTO_START in content and AUTO_END in content:
            # 기존 자동 섹션 교체
            new_content = re.sub(
                re.escape(AUTO_START) + r".*?" + re.escape(AUTO_END),
                replacement,
                content,
                flags=re.DOTALL,
            )
        else:
            # 파일 끝에 자동 섹션 추가
            new_content = content.rstrip() + "\n\n---\n\n" + replacement + "\n"
    else:
        # 신규 생성
        new_content = generate_initial_prd() + replacement + "\n"

    prd_path.write_text(new_content, encoding="utf-8")


# ─────────────────────────────────────────────
# 5. 진입점
# ─────────────────────────────────────────────

def main() -> None:
    hook_data = read_hook_input()

    # cwd: Hook이 실행된 작업 디렉토리
    cwd = Path(hook_data.get("cwd", os.getcwd()))
    project_root = find_project_root(cwd)

    state = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "api_endpoints": extract_api_endpoints(project_root),
        "backend_files": collect_python_files(project_root),
        "frontend_files": collect_frontend_files(project_root),
        "requirements": collect_requirements(project_root),
    }

    prd_path = project_root / "PRD.md"
    update_prd(prd_path, state)

    print(f"[update_prd] PRD 업데이트 완료 → {prd_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
