#!/bin/bash
# 빌드 후 로컬 미리보기: http://localhost:8770
# places/ 를 고쳤으면 껐다 다시 실행
set -e
cd "$(dirname "$0")/.."
uv run scripts/build.py
python3 -m http.server "${PORT:-8770}" --directory _site
