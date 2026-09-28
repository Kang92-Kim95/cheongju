# /// script
# requires-python = ">=3.10"
# dependencies = ["pyyaml", "pillow", "pillow-heif"]
# ///
"""places/ 폴더를 훑어서 배포용 _site/ 를 만든다.

사용법: uv run scripts/build.py

- 폴더 이름 앞 번호(01-, 02-)는 순서로만 쓰고 떼어낸다
- _ 나 . 으로 시작하는 폴더는 무시한다 (_template 등)
- 사진은 긴 변 1200px JPEG 로 줄이고, 위치정보 등 EXIF 는 버린다
"""
import hashlib
import html
import json
import re
import shutil
import sys
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import yaml
from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()

ROOT = Path(__file__).resolve().parent.parent
PLACES = ROOT / "places"
WEB = ROOT / "web"
OUT = ROOT / "_site"

PHOTO_EXT = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".svg"}
MAX_SIDE = 1200
ORDER_PREFIX = re.compile(r"^\d+[-_]")
PLACE_FIELDS = ("name", "area", "distance", "comment", "menu", "tags", "kakao", "search", "credits")
USER_AGENT = "Mozilla/5.0 (compatible; cheongju-guide/1.0; +https://github.com/Kang92-Kim95/cheongju)"


def slug(path: Path) -> str:
    return ORDER_PREFIX.sub("", path.name)


def natural_key(path: Path):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", path.name)]


def subdirs(path: Path) -> list[Path]:
    return sorted(
        (d for d in path.iterdir() if d.is_dir() and not d.name.startswith(("_", "."))),
        key=natural_key,
    )


def load_yaml(path: Path) -> dict:
    try:
        return yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    except yaml.YAMLError as e:
        sys.exit(f"✗ {path.relative_to(ROOT)} 형식 오류\n{e}")


def export_photo(src: Path, dest_dir: Path, index: int) -> Path:
    if src.suffix.lower() == ".svg":
        dest = dest_dir / f"{index}.svg"
        shutil.copyfile(src, dest)
        return dest
    dest = dest_dir / f"{index}.jpg"
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        im.thumbnail((MAX_SIDE, MAX_SIDE))
        im.save(dest, "JPEG", quality=82, optimize=True, progressive=True)
    return dest


class MetaParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta = {}

    def handle_starttag(self, tag, attrs):
        if tag != "meta":
            return
        a = dict(attrs)
        key = a.get("property") or a.get("name")
        if key and a.get("content") and key not in self.meta:
            self.meta[key] = html.unescape(a["content"]).strip()


def fetch_url(url: str) -> str:
    """네이버 블로그 PC 주소는 본문이 iframe 이라 메타 태그가 있는 모바일 주소로 바꿔서 읽는다"""
    u = urlparse(url)
    if u.netloc in ("blog.naver.com", "m.blog.naver.com"):
        q = parse_qs(u.query)
        if "blogId" in q and "logNo" in q:
            return f"https://m.blog.naver.com/{q['blogId'][0]}/{q['logNo'][0]}"
        return url.replace("://blog.naver.com", "://m.blog.naver.com", 1)
    return url


def fetch_blog(url: str) -> dict:
    """블로그 글의 제목 · 대표 썸네일 · 블로그 이름 (카톡 링크 미리보기와 같은 정보)"""
    card = {"url": url, "site": urlparse(url).netloc.removeprefix("www.").removeprefix("m.")}
    try:
        req = urllib.request.Request(fetch_url(url), headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=10) as res:
            parser = MetaParser()
            parser.feed(res.read(1_000_000).decode("utf-8", "replace"))
    except Exception as e:  # 블로그가 안 열려도 빌드는 계속, 카드는 링크만
        print(f"  ! 블로그 미리보기 실패 {url}: {e}")
        return card
    m = parser.meta
    if title := m.get("og:title") or m.get("twitter:title"):
        card["title"] = title
    if image := m.get("og:image") or m.get("twitter:image"):
        card["image"] = image
    if nickname := m.get("naverblog:nickname"):
        card["site"] = f"{nickname} · 네이버 블로그"
    elif site := m.get("og:site_name"):
        card["site"] = site
    return card


def build_place(place_dir: Path, cat_id: str) -> dict | None:
    info_path = place_dir / "info.yml"
    rel = place_dir.relative_to(ROOT)
    if not info_path.exists():
        print(f"  ! {rel}: info.yml 이 없어서 건너뜀")
        return None
    info = load_yaml(info_path)
    if not info.get("name"):
        sys.exit(f"✗ {rel}/info.yml: name 은 필수예요")

    place = {k: info[k] for k in PLACE_FIELDS if info.get(k)}
    if isinstance(place.get("comment"), str):
        place["comment"] = place["comment"].strip()
    blogs = info.get("blog") or []
    if blogs:
        place["blogs"] = [fetch_blog(u) for u in ([blogs] if isinstance(blogs, str) else blogs)]

    dest_dir = OUT / "photos" / cat_id / slug(place_dir)
    dest_dir.mkdir(parents=True, exist_ok=True)
    sources = sorted((f for f in place_dir.iterdir() if f.suffix.lower() in PHOTO_EXT), key=natural_key)
    place["photos"] = [
        export_photo(src, dest_dir, i).relative_to(OUT).as_posix() for i, src in enumerate(sources, 1)
    ]
    return place


def build_category(cat_dir: Path) -> dict:
    cat_id = slug(cat_dir)
    meta_path = cat_dir / "_category.yml"
    meta = load_yaml(meta_path) if meta_path.exists() else {}
    places = [p for d in subdirs(cat_dir) if (p := build_place(d, cat_id))]
    return {
        "id": cat_id,
        "name": meta.get("name", cat_id),
        "emoji": meta.get("emoji", ""),
        "desc": meta.get("desc", ""),
        "type": meta.get("type", "places"),
        "places": places,
    }


def bust_cache(index: Path, assets: list[str]):
    """배포 후에도 휴대폰이 예전 css/js 를 쓰지 않도록 내용 해시를 주소에 붙인다"""
    text = index.read_text(encoding="utf-8")
    for name in assets:
        digest = hashlib.sha1((OUT / name).read_bytes()).hexdigest()[:8]
        text = text.replace(f'"{name}"', f'"{name}?v={digest}"')
    index.write_text(text, encoding="utf-8")


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(WEB, OUT)
    bust_cache(OUT / "index.html", ["style.css", "app.js"])

    categories = [build_category(d) for d in subdirs(PLACES)]
    data = {"site": load_yaml(ROOT / "site.yml"), "categories": categories}
    (OUT / "data.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")

    n_places = sum(len(c["places"]) for c in categories)
    n_photos = sum(len(p["photos"]) for c in categories for p in c["places"])
    for c in categories:
        print(f"  {c['emoji']} {c['name']}: {len(c['places'])}곳")
    print(f"✓ 카테고리 {len(categories)}개 · {n_places}곳 · 사진 {n_photos}장 → _site/")


if __name__ == "__main__":
    main()
