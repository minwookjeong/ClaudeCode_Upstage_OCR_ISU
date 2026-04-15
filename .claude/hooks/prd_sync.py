#!/usr/bin/env python3
"""
PostToolUse hook — PRD 자동 동기화
Write / Edit 도구로 backend/ 또는 frontend/ 하위 파일이 변경될 때
PRD_영수증_지출관리앱.md 업데이트를 Claude 현재 컨텍스트에 주입합니다.
"""
import sys
import json
import io

# Windows 환경에서 UTF-8 출력 강제
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

PRD_FILE = "PRD_영수증_지출관리앱.md"
WATCH_DIRS = ("/backend/", "/frontend/")

SECTIONS = (
    "- 기술 스택 버전 테이블 (§11)\n"
    "- Phase 1 requirements.txt 코드 블록 (§13)\n"
    "- API 명세 (§8)\n"
    "- 디렉토리 구조 (§12)"
)


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        return

    tool_name = data.get("tool_name", "")
    if tool_name not in ("Write", "Edit"):
        return

    file_path = (
        data.get("tool_input", {}).get("file_path", "")
        or data.get("tool_response", {}).get("filePath", "")
    )

    # Windows 경로 정규화 (역슬래시 → 슬래시)
    normalized = file_path.replace("\\", "/")

    if not any(d in normalized for d in WATCH_DIRS):
        return

    message = (
        f"[PRD 자동 동기화] '{file_path}' 파일이 수정되었습니다.\n"
        f"이 변경 사항을 {PRD_FILE}의 아래 섹션에 반영이 필요한지 확인하고, "
        f"필요하다면 지금 바로 업데이트해 주세요:\n"
        f"{SECTIONS}\n"
        "변경과 무관한 PRD 내용은 수정하지 마세요."
    )

    output = {
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": message,
        }
    }
    print(json.dumps(output, ensure_ascii=False))


if __name__ == "__main__":
    main()
