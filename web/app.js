(() => {
  const app = document.getElementById('app');
  let site, categories;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  // 카카오맵 링크가 없으면 이름으로 검색 링크를 만든다
  const mapUrl = (p) => p.kakao || `https://map.kakao.com/link/search/${encodeURIComponent(p.search || `청주 ${p.name}`)}`;

  function renderHome() {
    document.title = site.title;
    app.innerHTML = `
      <header class="hero">
        <div class="eyebrow">${esc(site.eyebrow)}</div>
        <h1>${esc(site.title)}</h1>
        <p>${esc(site.subtitle)}</p>
      </header>
      <nav class="grid">
        ${categories.map((c) => {
          const n = c.places.length;
          const count = !n ? '준비 중' : c.type === 'intro' ? '읽어보기' : `${n}곳`;
          return `
            <a class="cat-card${n ? '' : ' empty'}" href="#${esc(c.id)}">
              <span class="emoji">${esc(c.emoji)}</span>
              <span class="name">${esc(c.name)}</span>
              <span class="desc">${esc(c.desc)}</span>
              <span class="count">${count}</span>
            </a>`;
        }).join('')}
      </nav>
      <footer class="footer">${esc(site.footer)}</footer>`;
  }

  // 블로그 후기 카드 (썸네일은 네이버가 referer 있으면 막아서 no-referrer)
  const renderBlog = (b) => `
    <a class="blog-card" href="${esc(b.url)}" target="_blank" rel="noopener">
      ${b.image ? `<img src="${esc(b.image)}" alt="" referrerpolicy="no-referrer" loading="lazy" onerror="this.remove()">` : ''}
      <span class="blog-text">
        <span class="blog-title">${esc(b.title || '블로그 후기 보기')}</span>
        <span class="blog-site">${esc(b.site)}</span>
      </span>
      <span class="blog-arrow">›</span>
    </a>`;

  // 공식 홈페이지 카드 (블로그 카드와 같은 모양, 썸네일 대신 아이콘)
  const renderHomepage = (h) => `
    <a class="blog-card official" href="${esc(h.url)}" target="_blank" rel="noopener">
      <span class="official-icon">🏛️</span>
      <span class="blog-text">
        <span class="blog-title">${esc(h.title || '공식 홈페이지')}</span>
        <span class="blog-site">공식 안내 · ${esc(new URL(h.url).hostname.replace(/^www\./, ''))}</span>
      </span>
      <span class="blog-arrow">›</span>
    </a>`;

  function renderPost(p, showMap) {
    const photos = p.photos ?? [];
    const multi = photos.length > 1;
    const meta = [p.area, p.distance].filter(Boolean).map(esc).join(' · ');
    return `
      <article class="post">
        <div class="post-head">
          <div class="post-name">${esc(p.name)}</div>
          ${meta ? `<div class="post-meta">${meta}</div>` : ''}
        </div>
        ${photos.length ? `
          <div class="carousel-wrap">
            <div class="carousel">
              ${photos.map((src, i) => `
                <div class="slide">
                  <img src="${esc(src)}" alt="${esc(p.name)} 사진 ${i + 1}"
                       loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async">
                </div>`).join('')}
            </div>
            ${multi ? `<div class="counter">1/${photos.length}</div>` : ''}
          </div>
          ${multi ? `<div class="dots">${photos.map((_, i) => `<span class="${i ? '' : 'on'}"></span>`).join('')}</div>` : ''}
          ${p.credits?.length ? `<p class="credits">사진 ${p.credits.map((c) => `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.text)}</a>`).join(', ')}</p>` : ''}
        ` : ''}
        <div class="post-body">
          ${p.comment ? `<p class="comment">${esc(p.comment)}</p>` : ''}
          ${p.menu ? `<p class="menu"><b>추천</b>${esc(p.menu)}</p>` : ''}
          ${p.tags?.length ? `<div class="tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
          ${p.homepage || p.blogs?.length ? `<div class="blogs">${p.homepage ? renderHomepage(p.homepage) : ''}${(p.blogs ?? []).map(renderBlog).join('')}</div>` : ''}
          ${showMap ? `
          <a class="map-btn" href="${esc(mapUrl(p))}" target="_blank" rel="noopener">
            <span class="pin"></span>카카오맵에서 보기
          </a>` : ''}
        </div>
      </article>`;
  }

  const FILTER_ICONS = { '우리 추천': '👍', '대형카페': '🚗' };

  // 동네(area)가 2개 이상이면 동네 필터 + 동네별 묶음으로 보여준다.
  // _category.yml 의 filters(태그)는 동네 버튼 앞에 붙고, 누르면 그 태그만 동네별로 묶어 보여준다.
  function renderList(cat, selected, showMap) {
    const list = cat.places;
    // area_order 에 적힌 동네를 먼저, 나머지는 나온 순서대로
    const order = cat.area_order ?? [];
    const areas = [...new Set([...order, ...list.map((p) => p.area)].filter((a) => a && list.some((p) => p.area === a)))];
    const filters = cat.filters ?? [];
    const post = (p) => renderPost(p, showMap);
    if (areas.length < 2 && !filters.length) return { chips: '', body: list.map(post).join('') };

    const base = `#${esc(cat.id)}`;
    const chip = (value, label) => `
      <a class="chip${value === selected ? ' on' : ''}" href="${value ? `${base}/${esc(encodeURIComponent(value))}` : base}">${esc(label)}</a>`;
    const chips = `
      <nav class="chips sub">
        ${chip(undefined, '전체')}
        ${filters.map((f) => chip(f, `${FILTER_ICONS[f] ?? '#'} ${f}`)).join('')}
        ${areas.length > 1 ? areas.map((a) => chip(a, a)).join('') : ''}
      </nav>`;

    // pin: true 인 곳은 동네 묶음보다 먼저 맨 위에 보여준다
    const grouped = (all) => all.filter((p) => p.pin).map(post).join('') + byArea(all.filter((p) => !p.pin));
    const byArea = (items) => areas.map((a) => {
      const inArea = items.filter((p) => p.area === a);
      return inArea.length ? `
        <h2 class="group">${esc(a)}<small>${inArea.length}곳</small></h2>
        ${inArea.map(post).join('')}` : '';
    }).join('') + items.filter((p) => !p.area).map(post).join('');

    let body;
    if (filters.includes(selected)) body = grouped(list.filter((p) => p.tags?.includes(selected)));
    else if (selected) body = list.filter((p) => p.area === selected).sort((a, b) => !!b.pin - !!a.pin).map(post).join('');
    else body = areas.length > 1 ? grouped(list) : list.map(post).join('');
    return { chips, body };
  }

  function renderCategory(cat, area) {
    const list = cat.places;
    const isIntro = cat.type === 'intro';
    const { chips, body } = renderList(cat, area, !isIntro);
    document.title = `${cat.name} · ${site.title}`;
    app.innerHTML = `
      <header class="topbar">
        <div class="topbar-row">
          <a class="back" href="#" aria-label="처음으로">‹</a>
          <div class="topbar-title">${esc(cat.emoji)} ${esc(cat.name)}${isIntro ? '' : `<small>${list.length}곳</small>`}</div>
        </div>
        <nav class="chips">
          ${categories.map((c) => `
            <a class="chip${c.id === cat.id ? ' on' : ''}" href="#${esc(c.id)}">${esc(c.emoji)} ${esc(c.name)}</a>`).join('')}
        </nav>
        ${chips}
      </header>
      ${list.length ? body : '<p class="empty-state">곧 채워질 예정이에요 🙂</p>'}`;

    app.querySelectorAll('.chip.on').forEach((c) => c.scrollIntoView({ inline: 'center', block: 'nearest' }));
    app.querySelectorAll('.post').forEach(bindCarousel);
  }

  // 스와이프 위치에 맞춰 1/3 카운터와 점 표시를 갱신
  function bindCarousel(post) {
    const track = post.querySelector('.carousel');
    const counter = post.querySelector('.counter');
    const dots = post.querySelectorAll('.dots span');
    if (!track || !dots.length) return;
    let ticking = false;
    track.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const i = Math.round(track.scrollLeft / track.clientWidth);
        dots.forEach((d, j) => d.classList.toggle('on', i === j));
        counter.textContent = `${i + 1}/${dots.length}`;
        ticking = false;
      });
    }, { passive: true });
  }

  // 모든 화면 오른쪽 위에 고정되는 청첩장 버튼
  function renderInvitation() {
    if (!site.invitation_url) return;
    const a = document.createElement('a');
    a.className = 'invitation';
    a.href = site.invitation_url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = site.invitation_label || '💌 모바일 청첩장';
    document.body.append(a);
  }

  function route() {
    const [id, area] = location.hash.slice(1).split('/').map(decodeURIComponent);
    const cat = categories.find((c) => c.id === id);
    cat ? renderCategory(cat, area) : renderHome();
    window.scrollTo(0, 0);
  }

  fetch('data.json', { cache: 'no-cache' })
    .then((res) => {
      if (!res.ok) throw new Error(`data.json ${res.status}`);
      return res.json();
    })
    .then((data) => {
      ({ site, categories } = data);
      renderInvitation();
      window.addEventListener('hashchange', route);
      route();
    })
    .catch((e) => {
      console.error(e);
      app.innerHTML = '<p class="error">데이터를 불러오지 못했어요.<br>잠시 후 다시 시도해 주세요.</p>';
    });
})();
