# 청주 가이드

결혼식 하객분들께 드리는 청주 맛집 · 가볼만한 곳 안내 페이지 (모바일 전용)

👉 https://kang92-kim95.github.io/cheongju/

## 폴더 구조

```
places/                        ← 평소엔 여기만
├── 01-intro/                  청주소개 (type: intro → 지도 버튼 없이 글 + 사진)
├── 02-food/                   카테고리 (앞 번호 = 화면 순서)
│   ├── _category.yml          카테고리 이름 · 이모지 · 설명
│   ├── 01-samgyeopsal/        가게 하나 = 폴더 하나 (앞 번호 = 순서)
│   │   ├── info.yml           이름 · 코멘트 · 카카오맵 링크
│   │   ├── 1.jpg              사진 (파일 이름순으로 옆으로 넘겨짐)
│   │   └── 2.jpg
│   └── 02-gopchang/
├── 03-cafe/
├── 04-spot/
└── _template/info.yml         새 가게 복사용 틀
site.yml                       첫 화면 제목 · 문구
web/                           화면 코드
scripts/                       빌드 · 미리보기 · 사진 줄이기
```

## 가게 추가하는 법

1. `places/_template` 폴더를 원하는 카테고리 안에 복사하고 이름 변경 (예: `places/02-food/03-gopchang`)
2. 사진 넣기 — jpg / png / heic 다 됨. 대표 사진을 `1.jpg` 로
3. `info.yml` 채우기 (`name` 만 필수)
4. 커밋 & 푸시 → GitHub Actions 가 빌드 · 배포 (1~2분)

폴더 이름은 영문 소문자 + 하이픈. 화면엔 `info.yml` 의 한글 이름이 나와요.
카테고리 추가도 같은 방식: `places/05-xxx/_category.yml` 만들면 끝.

## 로컬 미리보기

```bash
scripts/preview.sh
```
→ http://localhost:8770 (`uv` 필요)
