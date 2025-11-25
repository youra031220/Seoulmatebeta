import os
import sys
import google.generativeai as genai

"""
사용법 예시:
    python tools/auto_fix_gemini.py seoulmateback/server.js "server.js 안정화"
    python tools/auto_fix_gemini.py seoulmatefront/src/planner/routePlanner.js "프론트 경로 플래너 수정"

전제:
    - 환경변수 GEMINI_API_KEY 설정 필요
    - 모델 이름은 gemini-2.0-flash 기준 (원하면 변경 가능)
"""

SYSTEM_INSTRUCTIONS = """
너는 JavaScript/TypeScript/Node.js/React 코드를 안전하게 리팩토링하는 도우미야.

반드시 지켜야 할 규칙:
1. 기존 기능 (함수 이름, 라우트 URL, 데이터 구조, 리턴 타입)을 망가뜨리지 말 것.
2. null / undefined / 잘못된 타입 등으로 인한 런타임 에러를 최대한 방어적으로 처리할 것.
3. 답변은 오직 "수정된 전체 코드"만 출력할 것.
   - 설명, 한글 요약, 마크다운, ``` 코드 블록, 앞뒤 텍스트 모두 쓰지 말 것.
4. 항상 파일 전체 코드를 다시 출력할 것 (부분 수정 X, 전체 파일 O).
"""

def build_prompt(file_path: str, purpose: str, code: str) -> str:
    return f"""
{SYSTEM_INSTRUCTIONS}

수정 목적: {purpose}

아래는 파일 {file_path}의 전체 코드야.
위의 규칙을 지키면서 코드를 개선해줘.

중요:
- 설명을 쓰지 말고, 최종 답변에는 "수정된 코드 전체"만 포함해야 한다.
- ``` 같은 마크다운 코드 블록도 절대 포함하지 마라.

=== ORIGINAL CODE START ===
{code}
=== ORIGINAL CODE END ===
"""

def main():
    if len(sys.argv) < 2:
        print("Usage: python tools/auto_fix_gemini.py <file_path> [purpose]")
        sys.exit(1)

    file_path = sys.argv[1]
    purpose = sys.argv[2] if len(sys.argv) >= 3 else "코드 안정화 및 리팩토링"

    if not os.path.exists(file_path):
        print(f"[ERROR] File not found: {file_path}")
        sys.exit(1)

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[ERROR] GEMINI_API_KEY 환경변수가 설정되어 있지 않습니다.")
        sys.exit(1)

    with open(file_path, "r", encoding="utf-8") as f:
        original_code = f.read()

    genai.configure(api_key=api_key)

    model = genai.GenerativeModel("gemini-2.0-flash")  # 필요시 버전 변경 가능

    prompt = build_prompt(file_path, purpose, original_code)

    print(f"[INFO] Sending {file_path} to Gemini for auto-fix...")

    try:
        response = model.generate_content(prompt)
    except Exception as e:
        print(f"[ERROR] Gemini 호출 중 오류 발생: {e}")
        sys.exit(1)

    fixed_code = response.text

    if not fixed_code:
        print("[ERROR] Gemini로부터 비어 있는 응답을 받았습니다.")
        sys.exit(1)

    # 백업 저장
    backup_path = file_path + ".bak"
    with open(backup_path, "w", encoding="utf-8") as bf:
        bf.write(original_code)
    print(f"[INFO] Backup saved: {backup_path}")

    # 파일 덮어쓰기
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(fixed_code)

    print(f"[INFO] File updated: {file_path}")
    print("[INFO] 변경사항은 git diff로 확인해 주세요.")

if __name__ == "__main__":
    main()
