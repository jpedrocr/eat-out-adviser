#!/usr/bin/env bash
# PostToolUse hook: auto-format files after Edit/Write
# Reads tool input from stdin to extract file_path

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only format if file exists and is a known type
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.yaml|*.yml|*.css)
    pnpm exec prettier --write "$FILE_PATH" 2>/dev/null || true
    ;;
  *.md)
    pnpm exec markdownlint-cli2 --fix "$FILE_PATH" 2>/dev/null || true
    pnpm exec prettier --write "$FILE_PATH" 2>/dev/null || true
    ;;
esac

exit 0
