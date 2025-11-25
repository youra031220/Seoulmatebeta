import os
import sys
from openai import OpenAI

"""
사용법:
    python tools/auto_fix.py seoulmateback/server.js "server.js 안정화"
    python tools/auto_fix.py seoulmatefront/src/planner/routePlanner.js "프론트 경로 플래너 수정"

전제:
    - 환경변수 OPENAI_API_KEY 설정돼 있어야 함
    - 출력은 설명 없이 "수정된 코드만" 내보내도록 모델에 지시
"""

SYSTEM_PROMPT = """
너는 JavaScript/TypeScript/Node.js/React 코드를 안전하게 리팩토링하는 도우미야.
항상 다음을 지켜라:

1. 기존 기능(함수 이름, 라우트 URL, 데이터 구조)을 망가뜨리지 말 것.
2. 에러가 나기 쉬운 부분(null/undefined, 잘못된 타입)을 방어적으로 수정할 것.
3. 코멘트나 설명 텍스트를 출력하지 말고, 오직 "수정된 전체 코드"만 출력할 것.
4. 파일 하나 전체를 항상 다시 출력할 것 (부분 코드 X, 전체 코드 O).
"""

def build_user_prompt(file_path: str, purpose: str, code: str) -> str:
    return f"""
수정 목적: {purpose}

아래는 {file_path} 파일의 전체 코드야.
위의 목적에 맞게 코드를 개선해줘.

중요:
- 설명, 마크다운, 주석 텍스트를 따로 추가로 쓰지 말고,
  이 메시지에 대한 답변은 "수정된 코드 전체"만 보내.
- ``` 같은 마크다운 코드 블록도 절대 쓰지 마.

=== ORIGINAL CODE START ===
{code}
=== ORIGINAL CODE END ===
"""

def main():
    if len(sys.argv) < 2:
        print("Usage: python tools/auto_fix.py <file_path> [purpose]")
        sys.exit(1)

    file_path = sys.argv[1]
    purpose = sys.argv[2] if len(sys.argv) >= 3 else "코드 안정화 및 리팩토링"

    if not os.path.exists(file_path):
        print(f"[ERROR] File not found: {file_path}")
        sys.exit(1)

    with open(file_path, "r", encoding="utf-8") as f:
        original_code = f.read()

    client = OpenAI()  # OPENAI_API_KEY 환경변수 사용

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": build_user_prompt(file_path, purpose, original_code)},
    ]

    print(f"[INFO] Sending {file_path} to LLM for auto-fix...")

    completion = client.chat.completions.create(
        model="gpt-4.1-mini",  # 사용 가능한 모델명으로 바꿔도 됨
        messages=messages,
        temperature=0,
    )

    fixed_code = completion.choices[0].message.content

    # 백업 파일 저장
    backup_path = file_path + ".bak"
    with open(backup_path, "w", encoding="utf-8") as bf:
        bf.write(original_code)
    print(f"[INFO] Backup saved: {backup_path}")

    # 파일 덮어쓰기
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(fixed_code)

    print(f"[INFO] File updated: {file_path}")
    print("[INFO] Check 'git diff' to review changes before commit.")

if __name__ == "__main__":
    main()
