#!/usr/bin/env bash
# PreToolUse hook: block edits to .env files to prevent secret exposure

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Block .env, .env.local, .env.production, .env.development, etc.
# Allow .env.example (template without secrets)
if echo "$FILE_PATH" | grep -qE '\.env\.example$'; then
  exit 0
fi
if echo "$FILE_PATH" | grep -qE '(^|/)\.env(\.[a-zA-Z]+)?$'; then
  cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Editing .env files is blocked to prevent accidental secret exposure. Edit .env.example instead, or ask the user to edit .env manually."
  }
}
EOF
  exit 0
fi

exit 0
