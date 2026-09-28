# 청주 가이드

결혼식 하객분들께 드리는 청주 맛집 · 가볼만한 곳 안내 페이지 (모바일 전용)

👉 https://kang92-kim95.github.io/cheongju/

## 장소 추가하는 법

1. 사진을 `images/places/<가게이름-영문>/` 폴더에 넣는다
2. 사진 줄이기: `scripts/resize.sh images/places/<가게이름-영문>`
3. `data/places.yml` 에 블록 하나 추가 (형식은 파일 맨 위 설명 참고)
4. 커밋 & 푸시 → 1~2분 뒤 사이트 반영

GitHub 웹에서 `data/places.yml` 연필 버튼으로 바로 고쳐도 됩니다.

## 파일 구조

| 파일 | 내용 |
|---|---|
| `data/site.yml` | 첫 화면 제목 · 문구 |
| `data/categories.yml` | 카테고리 (순서 · 이모지 · 설명) |
| `data/places.yml` | 장소 목록 |
| `images/places/` | 사진 |

## 로컬 미리보기

```bash
python3 -m http.server 8770
```
http://localhost:8770 (브라우저 개발자도구에서 모바일 화면으로)
