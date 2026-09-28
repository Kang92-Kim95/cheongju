#!/bin/bash
# 사진을 모바일용으로 줄인다 (긴 변 1200px, JPEG 품질 80). macOS 기본 도구 sips 사용.
# 사용법: scripts/resize.sh images/places/가게폴더
# - HEIC/PNG 는 .jpg 로 변환하고 원본은 지운다
set -euo pipefail
dir="${1:?폴더를 지정하세요. 예: scripts/resize.sh images/places/my-cafe}"
shopt -s nullglob nocaseglob
for f in "$dir"/*.{jpg,jpeg,png,heic}; do
  out="${f%.*}.jpg"
  sips -Z 1200 -s format jpeg -s formatOptions 80 "$f" --out "$out" >/dev/null
  # 대소문자만 다른 경우(IMG.JPG → IMG.jpg)는 같은 파일이라 지우지 않는다
  [[ "$(tr A-Z a-z <<<"$f")" != "$(tr A-Z a-z <<<"$out")" ]] && rm "$f"
  echo "✓ $out ($(du -h "$out" | cut -f1))"
done
