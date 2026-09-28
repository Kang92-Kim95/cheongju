(() => {
  const app = document.getElementById('app');
  let site, categories;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  // 카카오맵 링크가 없으면 이름으로 검색 링크를 만든다
  const mapUrl = (p) => p.kakao || `https://map.kakao.com/link/search/${encodeURIComponent(`청주 ${p.name}`)}`;

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
        ` : ''}
        <div class="post-body">
          ${p.comment ? `<p class="comment">${esc(p.comment)}</p>` : ''}
          ${p.menu ? `<p class="menu"><b>추천</b>${esc(p.menu)}</p>` : ''}
          ${p.tags?.length ? `<div class="tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
          ${showMap ? `
          <a class="map-btn" href="${esc(mapUrl(p))}" target="_blank" rel="noopener">
            <span class="pin"></span>카카오맵에서 보기
          </a>` : ''}
        </div>
      </article>`;
  }

  function renderCategory(cat) {
    const list = cat.places;
    const isIntro = cat.type === 'intro';
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
      </header>
      ${list.length ? list.map((p) => renderPost(p, !isIntro)).join('') : '<p class="empty-state">곧 채워질 예정이에요 🙂</p>'}`;

    app.querySelector('.chip.on')?.scrollIntoView({ inline: 'center', block: 'nearest' });
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

  function route() {
    const id = decodeURIComponent(location.hash.slice(1));
    const cat = categories.find((c) => c.id === id);
    cat ? renderCategory(cat) : renderHome();
    window.scrollTo(0, 0);
  }

  fetch('data.json', { cache: 'no-cache' })
    .then((res) => {
      if (!res.ok) throw new Error(`data.json ${res.status}`);
      return res.json();
    })
    .then((data) => {
      ({ site, categories } = data);
      window.addEventListener('hashchange', route);
      route();
    })
    .catch((e) => {
      console.error(e);
      app.innerHTML = '<p class="error">데이터를 불러오지 못했어요.<br>잠시 후 다시 시도해 주세요.</p>';
    });
})();
