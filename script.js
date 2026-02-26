let currentLang = localStorage.getItem('cb-wiki-lang') || 'en';

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('cb-wiki-lang', lang);

  document.querySelectorAll('[data-lang]').forEach(el => {
    el.hidden = el.dataset.lang !== lang;
  });

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.langTarget === lang);
  });

  document.title = lang === 'en'
    ? 'CodeBench Wiki — Documentation'
    : 'CodeBench Wiki — Документация';

  searchInput.placeholder = lang === 'en' ? 'Search keywords…' : 'Поиск по ключевым словам…';

  searchInput.value = '';
  hideResults();
}

const sections = document.querySelectorAll('.section[id]');
const navLinks  = document.querySelectorAll('.sidebar-nav a[href^="#"]');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + id);
      });
    }
  });
}, {
  rootMargin: '-68px 0px -60% 0px',
  threshold: 0
});

sections.forEach(s => observer.observe(s));

const sidebar   = document.querySelector('.sidebar');
const overlay   = document.querySelector('.sidebar-overlay');
const hamburger = document.querySelector('.hamburger');

const iconMenu = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
const iconClose = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  hamburger.innerHTML = iconClose;
}

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  hamburger.innerHTML = iconMenu;
}

hamburger.addEventListener('click', () => {
  sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
});

overlay.addEventListener('click', closeSidebar);

document.querySelectorAll('.sidebar-nav a').forEach(a => {
  a.addEventListener('click', () => {
    if (window.innerWidth <= 768) closeSidebar();
  });
});

const backTop = document.querySelector('.back-top');
window.addEventListener('scroll', () => {
  backTop.classList.toggle('visible', window.scrollY > 300);
});
backTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

const searchInput   = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

function escapeRe(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildIndex() {
  const index = [];
  document.querySelectorAll('.section[id]').forEach(section => {
    const h2 = section.querySelector('h2');
    const titleSpan = h2 && h2.querySelector(`[data-lang="${currentLang}"]`);
    const title = titleSpan ? titleSpan.textContent.trim() : (h2 ? h2.textContent.trim() : '');

    const numEl = section.querySelector('.section-num');
    const num   = numEl ? numEl.textContent.trim() : '';

    const body = section.querySelector(`.lang-block[data-lang="${currentLang}"]`);
    const text = body ? body.innerText : section.innerText;

    index.push({ id: section.id, num, title, text });
  });
  return index;
}

function doSearch(query) {
  if (!query || query.length < 2) { hideResults(); return; }

  const q   = query.toLowerCase();
  const re  = new RegExp('(' + escapeRe(query) + ')', 'gi');
  const idx = buildIndex();
  const hits = [];

  idx.forEach(item => {
    const low = item.text.toLowerCase();
    const pos = low.indexOf(q);
    if (pos === -1) return;

    const start   = Math.max(0, pos - 40);
    const end     = Math.min(item.text.length, pos + query.length + 80);
    let snippet   = item.text.slice(start, end).replace(/\s+/g, ' ').trim();
    if (start > 0) snippet = '…' + snippet;
    if (end < item.text.length) snippet += '…';
    snippet = snippet.replace(re, '<mark>$1</mark>');

    hits.push({ ...item, snippet });
  });

  renderResults(hits, query);
}

function renderResults(hits, query) {
  const noResultsText = currentLang === 'en' ? 'Nothing found' : 'Ничего не найдено';

  if (hits.length === 0) {
    searchResults.innerHTML = `<div class="search-no-results">${noResultsText}</div>`;
    searchResults.classList.add('visible');
    return;
  }

  searchResults.innerHTML = hits.map(h => `
    <div class="search-result-item" data-target="${h.id}">
      <div class="search-result-meta">
        <span class="search-result-num">${h.num}</span>
        <span class="search-result-title">${h.title}</span>
      </div>
      <div class="search-result-snippet">${h.snippet}</div>
    </div>
  `).join('');

  searchResults.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const target = document.getElementById(item.dataset.target);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      searchInput.value = '';
      hideResults();
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
      }
    });
  });

  searchResults.classList.add('visible');
}

function hideResults() {
  searchResults.classList.remove('visible');
  searchResults.innerHTML = '';
}

searchInput.addEventListener('input', () => {
  doSearch(searchInput.value.trim());
});

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') { searchInput.value = ''; hideResults(); }
});

document.addEventListener('click', e => {
  if (!e.target.closest('.search-input-wrap')) hideResults();
});

document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const pre  = btn.closest('.code-wrap').querySelector('pre');
    const text = pre.innerText;
    const copied = currentLang === 'en' ? 'Copied!' : 'Скопировано!';
    const copy   = currentLang === 'en' ? 'Copy'    : 'Копировать';
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = copied;
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = copy; btn.classList.remove('copied'); }, 2000);
    });
  });
});

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.dataset.langTarget));
});

setLang(currentLang);
